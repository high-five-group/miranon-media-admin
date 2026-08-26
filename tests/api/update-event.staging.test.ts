// update-event — skarp conformance mot deployad staging-EF (task-18.1, PRD task-18
// Implementationsbeslut 2–3).
//
// update-event SKRIVER (POST → PATCH på BEFINTLIG Eventplanering-rad). Repots femte
// write-vertikal; speglar create-event/create-registration/save-segment:s säkerhets-
// kontrakt (POST→405, requireUser→401, body→400, allowlist-SSOT, {error}+requestId)
// men för UPDATE. Till skillnad mot create-event bär den INGEN idempotensnyckel:
// en PATCH med absoluta värden är naturligt idempotent (retry ger samma sluttillstånd)
// — samma klass som mark-registration-fee-paid/update-person-note (update-record).
//
// Bevisar mot SKARP staging-data:
//   1. allow (AC #1 på API-nivån): eget SENTINEL-event skapas via create-event
//      (Ort 'ZZ-create-event-test', ADR-060) → update-event ÄNDRAR (typ/ort/datum/
//      status/maxPlatser) → 200 + SKRIV-BEVIS ur råa record.fields + 'Månad/år'
//      OMHÄRLETT ur nya Startdatum (ADR-066 b6-arvet — datum-edit får inte drifta
//      basens manuella Månad/år) → OMLÄSNING via get-event visar nya värden →
//      teardown ÅTERSTÄLLER ursprungsvärdena (finally; sentinel-raden städas därtill
//      av ADR-060-purgen). Delade staging-fixturer muteras ALDRIG (TASK-6-klassen).
//   2. eventKey i domän-svaret: update-event:s `event`-envelope bär det system-
//      genererade eventKey (läs-shape-utökningen i samma leverans, task-18.1).
//   3. deny-by-default: fälten byggs SERVER-SIDE ur typade inputs (klienten kan
//      aldrig skicka en rå fields-map) — allowlisten är SSOT-grind mot kod-drift,
//      ej en klient-nåbar deny-yta (create-event-mönstret). Klient-nåbara
//      input-denies: saknat/ogiltigt eventId → 400, inga uppdaterbara fält → 400,
//      ogiltig datum-form → 400, negativt maxPlatser → 400.
//   4. anon (ingen JWT) → 401 (delad gateway/requireUser).
//   5. platser-morfen (task-18.2, AC #2): maxPlatser + reserverade ('Extra
//      platser') + manuelltTillagda ('Manuella platser') skrivs i EN operation
//      mot eget sentinel-event, omläsning via get-event, teardown återställer.
//
// EVENTFORMAT-ANKARE: create-setup:en kräver eventtyp (ADR-066 b5) → samma seedade
// sentinel-fixtur som create-event-sviten (`ZZ-create-event-test-format`).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan creds;
// skarpa beviset körs i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { EventSchema } from '../../src/domain/schemas';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/update-event';
const SENTINEL_ORT = 'ZZ-create-event-test';
// Ändrad ort under testet — återställs till SENTINEL_ORT i finally så att
// ADR-060-purgens exakta Ort-match ('^ZZ-create-event-test$') består.
//
// [TASK-309.15] ÅTERSTÄLLNINGEN ÄR EN ENDA FELPUNKT, OCH DEN HAR FALLIT.
// Mätt i staging 2026-08-24: TVÅ rader med Ort `ZZ-create-event-test-uppdaterad`,
// 26,9 respektive 32,3 dygn gamla. Faller `finally` (kraschad körning, avbrutet
// CI-jobb) matchar raden INGEN purge-target — varken formeln
// `{Ort} = 'ZZ-create-event-test'` eller mönstret `^ZZ-create-event-test$` —
// och blir därmed liggande FÖR ALLTID. Två svar, båda tillagda:
//   1. `.purge-staging-policy.json`s target `update-event-uppdaterad-sentineler`
//      gör den uppdaterade orten purge-bar i sig (försvar i djupled).
//   2. Eventet registreras i ägar-manifestet redan vid SKAPANDET (nedan), så
//      `purge:staging:efter` når det oavsett vilken av de två orterna det
//      slutade med.
const UPDATED_ORT = 'ZZ-create-event-test-uppdaterad';

// Samma seedade Eventformat-ankare som create-event.staging.test.ts (Session 38 L1).
const SEEDED_EVENTFORMAT_ID = 'recclDd7hUQsfxoVs';

interface UpdateBody {
  eventId?: string;
  typ?: string;
  ort?: string;
  startdatum?: string;
  slutdatum?: string;
  status?: string;
  maxPlatser?: number;
  // Beläggningens Ändra (task-18.2): reserverade → 'Extra platser',
  // manuelltTillagda → 'Manuella platser' (K16-modellens mappning).
  reserverade?: number;
  manuelltTillagda?: number;
  // Auto-utskickets två ADDITIVA bas-fält (task-18.6): schemalagt datum
  // ('Deltagarinfo schemalagd') + opt-out ('Deltagarinfo auto-utskick avstängt').
  deltagarinfoSchemalagd?: string | null;
  deltagarinfoAutoAvstangt?: boolean;
}

function postUpdate(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: UpdateBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${ENDPOINT}`, { headers, data: body });
}

/** Skapa ett eget sentinel-event att mutera (ADR-060; rör aldrig delade fixturer). */
async function createSentinelEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}/functions/v1/create-event`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      event: 'Fjärrskådning',
      typ: 'Utbildning',
      ort: SENTINEL_ORT,
      startdatum: '2026-09-15',
      slutdatum: '2026-09-16',
      maxPlatser: 20,
      eventtyp: process.env.TEST_EVENTFORMAT_RECORD_ID || SEEDED_EVENTFORMAT_ID,
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), raw).toBe(201);
  const id = (JSON.parse(raw) as { record: { id: string } }).record.id;
  // [TASK-309.15] Registreras FÖRE någon mutation — ägarskapet gäller raden,
  // inte det Ort-värde den råkar bära när körningen slutar.
  registreraKastbarPost(id, 'update-event/Eventplanering');
  return id;
}

/** Omläsning via get-event — samma EF som detaljsidan läser genom (AC #1-formen). */
async function readEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  id: string,
): Promise<Record<string, unknown>> {
  const res = await request.get(
    `${config.baseUrl}/functions/v1/get-event?id=${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(res.status()).toBe(200);
  return ((await res.json()) as { event: Record<string, unknown> }).event;
}

test.describe('update-event — skarp conformance (task-18.1)', () => {
  test('allow: ändra → spara → omläsning visar nya värden; teardown återställer (sentinel-event)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // Eget sentinel-event — delade staging-fixturer muteras aldrig (TASK-6-klassen).
    const eventId = await createSentinelEvent(request, config, jwt);

    try {
      const res = await postUpdate(request, config, jwt, {
        eventId,
        typ: 'Föreläsning',
        ort: UPDATED_ORT,
        startdatum: '2026-10-01',
        slutdatum: '2026-10-02',
        status: 'Flyttat',
        maxPlatser: 33,
      });
      const raw = await res.text();
      expect(res.status(), raw).toBe(200);
      const body = JSON.parse(raw) as {
        event: Record<string, unknown>;
        record: { id: string; fields: Record<string, unknown> };
      };

      // (i) SKRIV-BEVIS ur råa record.fields — EF:en satte fälten i Airtable.
      expect(body.record.id).toBe(eventId);
      expect(body.record.fields['Typ']).toBe('Föreläsning');
      expect(body.record.fields['Ort']).toBe(UPDATED_ORT);
      expect(body.record.fields['Startdatum']).toBe('2026-10-01');
      expect(body.record.fields['Slutdatum']).toBe('2026-10-02');
      expect(body.record.fields['Status']).toBe('Flyttat');
      expect(body.record.fields['Max antal platser']).toBe(33);
      // 'Månad/år' OMHÄRLETT ur nya Startdatum (ADR-066 b6-arvet) — ej skickat av klienten.
      expect(body.record.fields['Månad/år']).toBe('Oktober 2026');

      // (ii) Domän-envelope: samma berikade läs-shape som get-event (adapterns parse-väg)
      // + system-genererade eventKey (läs-shape-utökningen, task-18.1).
      const domain = EventSchema.parse(body.event);
      expect(domain.id).toBe(eventId);
      expect(domain.typ).toBe('Föreläsning');
      expect(domain.eventKey).toMatch(/^Event-\d+$/);
      // Basdimensionerna (TASK-249.4): sentinel-eventet skapades med
      // event='Fjärrskådning' (createSentinelEvent) → create-event satte
      // Kursfamilj vid radskapelse. update-event RÖR ALDRIG kursnamnet/
      // Kursfamilj, men PATCH-svaret bär basens FULLSTÄNDIGA fields (mapEvent-
      // kommentaren i update-event/index.ts) — håll-i-synk-beviset: fältet
      // överlever oförändrat genom en update som inte rör det.
      expect(domain.kursfamilj).toBe('Fjärrskådning');

      // (iii) OMLÄSNING via get-event — nya värden syns i läs-vägen (AC #1).
      const reread = await readEvent(request, config, jwt, eventId);
      expect(reread.typ).toBe('Föreläsning');
      expect(reread.ort).toBe(UPDATED_ORT);
      expect(reread.startdatum).toBe('2026-10-01');
      expect(reread.slutdatum).toBe('2026-10-02');
      expect(reread.status).toBe('Flyttat');
      expect(reread.maxPlatser).toBe(33);
    } finally {
      // TEARDOWN ÅTERSTÄLLER (AC #1): skriv tillbaka ursprungsvärdena — särskilt Ort
      // till SENTINEL_ORT så ADR-060-purgens exakta match består. Körs även vid fel.
      await postUpdate(request, config, jwt, {
        eventId,
        typ: 'Utbildning',
        ort: SENTINEL_ORT,
        startdatum: '2026-09-15',
        slutdatum: '2026-09-16',
        status: 'Planerat',
        maxPlatser: 20,
      });
    }

    // Restore-bevis (utanför finally — får inte svälja assert-fel i cleanup-vägen).
    const restored = await readEvent(request, config, jwt, eventId);
    expect(restored.ort).toBe(SENTINEL_ORT);
    expect(restored.typ).toBe('Utbildning');
    expect(restored.status).toBe('Planerat');
  });

  test('platser-morfen (AC #2): skriver ALLA TRE fälten mot staging; omläsning + teardown', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // Eget sentinel-event — delade staging-fixturer muteras aldrig (TASK-6-klassen).
    const eventId = await createSentinelEvent(request, config, jwt);

    try {
      // Beläggningens sektions-spara: K16-modellens tre skrivbara i EN operation.
      const res = await postUpdate(request, config, jwt, {
        eventId,
        maxPlatser: 14,
        reserverade: 3,
        manuelltTillagda: 2,
      });
      const raw = await res.text();
      expect(res.status(), raw).toBe(200);
      const body = JSON.parse(raw) as {
        event: Record<string, unknown>;
        record: { id: string; fields: Record<string, unknown> };
      };

      // (i) SKRIV-BEVIS ur råa record.fields — segmenten mappar basens fält 1-till-1
      // (AC #1-summeringen: reserverade == 'Extra platser', manuelltTillagda ==
      // 'Manuella platser'; domänspråket i API:t, basnamnen endast server-side).
      expect(body.record.fields['Max antal platser']).toBe(14);
      expect(body.record.fields['Extra platser']).toBe(3);
      expect(body.record.fields['Manuella platser']).toBe(2);
      // Datum EJ skickat → 'Månad/år' orört (härledningen är Startdatum-bunden).
      expect(body.record.fields['Startdatum']).toBe('2026-09-15');

      // (ii) Domän-envelope bär de två kategorifälten (update-svaret cache-sätts).
      const domain = EventSchema.parse(body.event);
      expect(domain.maxPlatser).toBe(14);
      expect(domain.reserverade).toBe(3);
      expect(domain.manuelltTillagda).toBe(2);

      // (iii) OMLÄSNING via get-event — läs-vägen visar de nya värdena.
      const reread = await readEvent(request, config, jwt, eventId);
      expect(reread.maxPlatser).toBe(14);
      expect(reread.reserverade).toBe(3);
      expect(reread.manuelltTillagda).toBe(2);
    } finally {
      // TEARDOWN: återställ kapacitetsfälten (Ort/Typ/Status rördes aldrig här;
      // Extra/Manuella platser fanns inte på sentineln → 0 är närmast "osatt"
      // som operationen kan skriva — sentinel-raden städas därtill av purgen).
      await postUpdate(request, config, jwt, {
        eventId,
        maxPlatser: 20,
        reserverade: 0,
        manuelltTillagda: 0,
      });
    }

    // Restore-bevis (utanför finally — får inte svälja assert-fel i cleanup-vägen).
    const restored = await readEvent(request, config, jwt, eventId);
    expect(restored.maxPlatser).toBe(20);
    expect(restored.ort).toBe(SENTINEL_ORT);
  });

  test('auto-utskicks-fälten (task-18.6 AC #3): schemalagt datum + opt-out skrivs och läses tillbaka', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // Eget sentinel-event — delade staging-fixturer muteras aldrig (TASK-6-klassen).
    const eventId = await createSentinelEvent(request, config, jwt);

    try {
      // Krysset URKRYSSAT ("Skickas inte automatiskt"): opt-out true + datumet står kvar.
      const av = await postUpdate(request, config, jwt, {
        eventId,
        deltagarinfoSchemalagd: '2026-09-01',
        deltagarinfoAutoAvstangt: true,
      });
      const avRaw = await av.text();
      expect(av.status(), avRaw).toBe(200);
      const avBody = JSON.parse(avRaw) as {
        event: Record<string, unknown>;
        record: { fields: Record<string, unknown> };
      };
      // (i) SKRIV-BEVIS ur råa record.fields — ADDITIVA staging-fälten (2026-07-22).
      expect(avBody.record.fields['Deltagarinfo schemalagd']).toBe('2026-09-01');
      expect(avBody.record.fields['Deltagarinfo auto-utskick avstängt']).toBe(true);
      // (ii) Domän-envelope (adapterns parse-väg).
      const domain = EventSchema.parse(avBody.event);
      expect(domain.deltagarinfoSchemalagd).toBe('2026-09-01');
      expect(domain.deltagarinfoAutoAvstangt).toBe(true);
      // (iii) OMLÄSNING via get-event — läs-vägen krysset renderas ur.
      const reread = await readEvent(request, config, jwt, eventId);
      expect(reread.deltagarinfoSchemalagd).toBe('2026-09-01');
      expect(reread.deltagarinfoAutoAvstangt).toBe(true);

      // Krysset IKRYSSAT igen: opt-out false (checkbox false ⇒ Airtable utelämnar
      // fältet ur svaret — läs-vägen normaliserar till false, aldrig undefined).
      const pa = await postUpdate(request, config, jwt, {
        eventId,
        deltagarinfoSchemalagd: '2026-09-02',
        deltagarinfoAutoAvstangt: false,
      });
      expect(pa.status()).toBe(200);
      const paReread = await readEvent(request, config, jwt, eventId);
      expect(paReread.deltagarinfoSchemalagd).toBe('2026-09-02');
      expect(paReread.deltagarinfoAutoAvstangt).toBe(false);
    } finally {
      // TEARDOWN: rensa schemat (null ⇒ Airtable tömmer date-fältet) + opt-out av.
      await postUpdate(request, config, jwt, {
        eventId,
        deltagarinfoSchemalagd: null,
        deltagarinfoAutoAvstangt: false,
      });
    }

    // Restore-bevis (utanför finally — får inte svälja assert-fel i cleanup-vägen).
    const restored = await readEvent(request, config, jwt, eventId);
    expect(restored.deltagarinfoSchemalagd ?? null).toBeNull();
    expect(restored.deltagarinfoAutoAvstangt).toBe(false);
  });

  test('deny: ogiltig deltagarinfoSchemalagd-form → 400 (task-18.6)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postUpdate(request, config, jwt, {
      eventId: 'recAAAAAAAAAAAAA',
      deltagarinfoSchemalagd: '01/09/2026',
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/deltagarinfoSchemalagd/i);
  });

  test('deny: negativt reserverade/manuelltTillagda → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res1 = await postUpdate(request, config, jwt, {
      eventId: 'recAAAAAAAAAAAAA',
      reserverade: -1,
    });
    expect(res1.status()).toBe(400);
    expect(((await res1.json()) as { error?: string }).error).toMatch(/reserverade/i);

    const res2 = await postUpdate(request, config, jwt, {
      eventId: 'recAAAAAAAAAAAAA',
      manuelltTillagda: -1,
    });
    expect(res2.status()).toBe(400);
    expect(((await res2.json()) as { error?: string }).error).toMatch(/manuelltTillagda/i);
  });

  test('deny: eventId saknas → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postUpdate(request, config, jwt, { ort: 'Skövde' });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/eventId/i);
  });

  test('deny: eventId utan rec-prefix → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postUpdate(request, config, jwt, {
      eventId: 'inteEttRecordId',
      ort: 'Skövde',
    });
    expect(res.status()).toBe(400);
  });

  // TASK-24-kontraktstestet: rec-prefixat men obefintligt eventId gav tidigare
  // 500 (generisk Error ur updateAirtableRecord → mapErrorToResponse). Speglar
  // get-event.staging.test.ts:s "okänt ID → 404"-test och
  // create-event-note.staging.test.ts:s "okänt event (rec-format men finns
  // ej) → 404" — samma mall-kontrakt, nu även för PATCH.
  test('okänt event (rec-format men finns ej) → 404 (mall-kontraktet, TASK-24)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postUpdate(request, config, jwt, {
      eventId: 'recZZZZZZZZZZZZZZ',
      ort: 'Skövde',
    });
    expect(res.status()).toBe(404);
    const body = (await res.json()) as { error?: unknown };
    expect(typeof body.error).toBe('string');
  });

  test('deny: inga uppdaterbara fält → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postUpdate(request, config, jwt, { eventId: 'recAAAAAAAAAAAAA' });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/least one/i);
  });

  test('deny: ogiltig startdatum-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postUpdate(request, config, jwt, {
      eventId: 'recAAAAAAAAAAAAA',
      startdatum: '01/10/2026',
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/startdatum/i);
  });

  test('deny: negativt maxPlatser → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postUpdate(request, config, jwt, {
      eventId: 'recAAAAAAAAAAAAA',
      maxPlatser: -1,
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/maxPlatser/i);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { eventId: 'recANY', ort: 'X' },
    });
    await classify401Body(res);
  });
});
