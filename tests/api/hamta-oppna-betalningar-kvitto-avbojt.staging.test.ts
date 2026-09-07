// hamta-oppna-betalningar — kvitto_avbojt-uteslutningen, skarp conformance
// mot deployad staging-EF (TASK-367 review runda 1, FYND 2, Marcus beslut
// 2026-09-06 "Definitivt A").
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD SOM BEVISAS
// ═══════════════════════════════════════════════════════════════════════════
// Den durabla "kvitto att skicka"-härledningen (`hamta-oppna-betalningar/
// index.ts` § "KVITTO ATT SKICKA") ska ALDRIG återuppliva en inbetalning
// Lotta MEDVETET registrerade utan kvitto. `registrera-inbetalning` skriver
// nu `kvitto_avbojt = !medKvitto` (migration
// `20260906165100_inbetalning_kvitto_avbojt.sql`), och kandidatfrågan
// filtrerar `kvitto_avbojt = false`. Testet bevisar BÅDA riktningarna på
// SKARP staging-data:
//   1. `medKvitto: false` → raden syns INTE i `oskickadeKvitton`.
//   2. `medKvitto: true`  → raden syns.
//
// ═══════════════════════════════════════════════════════════════════════════
// TVÅ EGNA SENTINEL-ANMÄLNINGAR (ADR-060) — DELADE FIXTURER MUTERAS ALDRIG
// ═══════════════════════════════════════════════════════════════════════════
// Samma mönster som `cancel-registration.staging.test.ts`: `create-
// registration` mot det redan seedade eventet (`TEST_REGISTRATION_RECORD_ID`
// pekar ut det), med en `create-test+${uuid}@staging.test`-adress — samma
// ADR-060-purge-target övriga skarpa create-registration-sentineler delar.
// INGEN riktig kurs, INGEN ZZ-GRANSKNING-fixtur rörs.
//
// INBETALNINGARNA RADERAS I `afterAll` (atgard: 'radera' via
// `hantera-inbetalning`, tillåtet före ett kvitto utfärdats — vilket det
// aldrig gör här, testet skickar aldrig ett kvitto). Postgres-raderna är
// INTE en ADR-060-purge-target (den täcker Airtable-anmälningar), så
// explicit städning är den enda vägen att inte lämna spår.
//
// INGET MAIL SKICKAS. `registrera-inbetalning` skickar aldrig något (kön nås
// bara via `koa-kvitton`, som denna svit aldrig anropar).
//
// Auth via `getValidUserJWT` (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

function postJson(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  path: string,
  data: Record<string, unknown>,
): Promise<APIResponse> {
  return request.post(`${config.baseUrl}/functions/v1${path}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data,
  });
}

/** Härled conformance-ankaret: den seedade postens event (ingen ny event-fixtur) —
    samma helper-form som `cancel-registration.staging.test.ts`s `findSeededEventId`. */
async function findSeededEventId(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<string> {
  const seededId = process.env.TEST_REGISTRATION_RECORD_ID ?? '';
  expect(
    seededId,
    'TEST_REGISTRATION_RECORD_ID måste vara satt i staging-env (.env.test.example — seed-ankaret)',
  ).not.toBe('');

  const res = await request.get(`${config.baseUrl}/functions/v1/get-registrations`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status()).toBe(200);
  const { registrations } = (await res.json()) as {
    registrations: { id: string; eventId: string | null }[];
  };
  const seeded = registrations.find((r) => r.id === seededId);
  expect(seeded?.eventId, `seedad post ${seededId} saknar eventId`).toBeTruthy();
  return seeded?.eventId as string;
}

/** Eget sentinel-anmälnings-record (ADR-060) — delade fixturer muteras aldrig. */
async function createSentinelRegistration(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  suffix: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}/functions/v1/create-registration`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      fornamn: 'Sentinel',
      efternamn: `KvittoAvbojt${suffix}`,
      email: `create-test+${randomUUID()}@staging.test`,
      telefon: null,
      eventId,
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), raw).toBe(201);
  return (JSON.parse(raw) as { record: { id: string } }).record.id;
}

type OppenBetalningRad = { anmalanRecordId: string; oskickadeKvitton: unknown[] };

/** Läser `hamta-oppna-betalningar` och plockar ut EN anmälans rad. */
async function hamtaRad(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  anmalanRecordId: string,
): Promise<OppenBetalningRad | undefined> {
  const res = await request.get(`${config.baseUrl}/functions/v1/hamta-oppna-betalningar`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status()).toBe(200);
  const { betalningar } = (await res.json()) as { betalningar: OppenBetalningRad[] };
  return betalningar.find((b) => b.anmalanRecordId === anmalanRecordId);
}

test.describe('hamta-oppna-betalningar — kvitto_avbojt-uteslutningen (TASK-367 review runda 1, FYND 2)', () => {
  test('medKvitto: false → inbetalningen syns ALDRIG i "kvitto att skicka"; medKvitto: true → den syns', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await findSeededEventId(request, config, jwt);

    const anmalanAvbojt = await createSentinelRegistration(request, config, jwt, eventId, 'Nej');
    const anmalanOnskat = await createSentinelRegistration(request, config, jwt, eventId, 'Ja');

    const inbetalningIds: string[] = [];
    try {
      // ── Registrera EN inbetalning per sentinel, olika medKvitto ─────────
      const svarAvbojt = await postJson(request, config, jwt, '/registrera-inbetalning', {
        anmalanRecordId: anmalanAvbojt,
        belopp: '1',
        betalsatt: 'Swish',
        medKvitto: false,
      });
      const rawAvbojt = await svarAvbojt.text();
      // 201 (Created) — registrera-inbetalning skapar en ny rad.
      expect(svarAvbojt.status(), rawAvbojt).toBe(201);
      inbetalningIds.push(
        (JSON.parse(rawAvbojt) as { inbetalning: { id: string } }).inbetalning.id,
      );

      const svarOnskat = await postJson(request, config, jwt, '/registrera-inbetalning', {
        anmalanRecordId: anmalanOnskat,
        belopp: '1',
        betalsatt: 'Swish',
        medKvitto: true,
      });
      const rawOnskat = await svarOnskat.text();
      expect(svarOnskat.status(), rawOnskat).toBe(201);
      inbetalningIds.push(
        (JSON.parse(rawOnskat) as { inbetalning: { id: string } }).inbetalning.id,
      );

      // ── Läs härledningen ─────────────────────────────────────────────────
      const radAvbojt = await hamtaRad(request, config, jwt, anmalanAvbojt);
      const radOnskat = await hamtaRad(request, config, jwt, anmalanOnskat);

      // `radAvbojt` FÅR SAKNAS HELT — och det är i sig en del av beviset,
      // inte ett testfel. Det seedade ankar-eventet ("Resor i medvetandet 1",
      // ZZ-History Ort) har inget pris basen kan räkna fram (`Avtalat pris`
      // och `Pris (kr) (from Event)` är båda blanka — appens `valjPris` läser
      // en TREDJE nivå, Eventinnehåll-standarden, som `Saknas (kr)`-formeln
      // INTE gör, se `hamta-oppna-betalningar/index.ts` § "FÖNSTRET", en
      // KÄND, redan bokförd begränsning, inte ny för detta test). `Saknas
      // (kr)` blir därför BLANK, och `raderOppna` (Airtable-filtret) hittar
      // aldrig raden. Den enda vägen in för en sådan rad är extra-fetchen
      // (`extraAnmalanIds`), och den drivs UTESLUTANDE av
      // `kandidatPerAnmalan` — som `kvitto_avbojt = true` explicit UTESLUTER
      // `anmalanAvbojt` ur. Att raden är HELT FRÅNVARANDE är alltså precis
      // vad en KORREKT uteslutning ser ut som här; att den DYKT UPP hade
      // varit felet (en avslöjande negativ kontroll: utan
      // `.eq('kvitto_avbojt', false)` i kandidatfrågan hade `anmalanAvbojt`
      // synts via EXAKT samma extra-fetch-väg som `radOnskat` nedan).
      expect(radAvbojt?.oskickadeKvitton ?? []).toEqual([]);

      // `radOnskat` MÅSTE synas: `kvitto_avbojt = false` gör den till en
      // genuin kandidat, och eftersom den (av samma prisskäl som ovan) inte
      // finns i `raderOppna` är dess enda väg in extra-fetchen — som inte
      // bryr sig om pris alls (bara `{Status} != "Avbokad/Ombokad"`). Att
      // den SYNS här är alltså live-bevis på att extra-fetch-mekanismen
      // (TASK-367s huvudfix) fungerar mot verklig, oförutsägbar staging-data,
      // inte bara mot fixturer med känt pris.
      expect(radOnskat, 'anmalanOnskat saknas helt i hamta-oppna-betalningar').toBeTruthy();
      expect(radOnskat?.oskickadeKvitton.length).toBeGreaterThan(0);
    } finally {
      // ── Städning: radera BÅDA inbetalningarna (före kvitto, tillåtet) ───
      for (const id of inbetalningIds) {
        await postJson(request, config, jwt, '/hantera-inbetalning', {
          atgard: 'radera',
          inbetalningId: id,
        });
      }
    }
  });
});
