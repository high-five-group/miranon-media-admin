// rebook-registration — skarp conformance mot deployad staging-EF (TASK-368.4,
// PRD TASK-368 beslut 7-8, ADR-130). Repots nionde write-vertikal, och den
// FÖRSTA staging-sviten som skriver i betalningsdomänens Postgres-tabeller via
// en Edge Function.
//
// NIO test-block, ett per punkt nedan. Bevisar mot SKARP staging-data:
//   1. säkerhets-kontraktet: anon → 401, GET → 405 (delad gateway/requireUser).
//   2. input-grindar (deny-by-default): ogiltiga record-ID-format → 400.
//   3. okända ID:n → 404 (anmälan respektive event), aldrig 500.
//   4. samma event → 409 `samma_event`.
//   4b. personen redan anmäld på MÅL-eventet → 409 `redan_anmald_pa_malet`,
//      och den gamla anmälan står orörd. Marcus beslut 2026-09-03: adoption
//      sker ENDAST när anropet bevisligen är samma request upprepad, aldrig
//      som en tyst sammanslagning av två anmälningars ekonomi.
//   5. FLERA INBETALNINGAR: två aktiva + en makulerad. Efter ombokningen sitter
//      de TVÅ aktiva på den nya anmälan med uppdaterad ögonblicksbild, och den
//      MAKULERADE ligger kvar på den gamla (kortets AC #3).
//   6. SPEGELN PÅ BÅDA anmälningarna, läst via `hamta-inbetalningar`s egen
//      `spegel.iFas` (Postgres-summan mot basens `Summa inbetalt (kr)`).
//   7. PRISSKILLNADENS IDENTITET: `prisskillnad === nyttPris - summan på den
//      nya anmälan`, och `null` när priset inte går att avgöra.
//   8. IDEMPOTENSEN (AC #4): ett andra identiskt anrop skapar ingen anmälan,
//      flyttar noll rader, ändrar ingen status och skriver ingen ny loggrad —
//      men `summaNyAnmalan` står kvar på rätt belopp, till skillnad från de
//      PER-ANROP-räknare (`flyttadeRader`/`flyttadSumma`) som är noll där.
//   9. LOGGVERBET `bokade om anmälan` med BÅDA anmälningarna i statementet
//      (objektet = den gamla, `NY_ANMALAN_EXTENSION_IRI` = den nya).
//  10. EN INBETALNING (AC #5:s andra hälft), i motsatt riktning.
//  11. CORS preflight (tillåten origin) → 200 + speglad origin.
//
// ── VAD SOM MEDVETET INTE PRÖVAS HÄR, OCH VARFÖR ──────────────────────────
// PRISSKILLNADENS TRE TECKEN (positiv/negativ/null) bevisas UTTÖMMANDE
// hermetiskt i `rebook-registration.test.ts` § prisskillnaden, inte här.
// Skälet är mekaniskt, samma klass som `cancel-registration.staging.test.ts`s
// dokumenterade val: ingen befintlig Edge Function kan sätta MÅL-eventets pris
// (`create-event`s allowlist bär inget prisfält), och `Avtalat pris (kr)`
// sätts bara via `registrera-inbetalning` på en anmälan som redan finns — den
// NYA anmälan existerar inte förrän ombokningen skapat den. Att konstruera ett
// bestämt tecken hade krävt en rå Airtable-skrivning förbi allowlisten, alltså
// precis det denna skiva finns för att förhindra. Här bevisas i stället
// IDENTITETEN, som håller oavsett vad staging-basens priser råkar vara.
//
// STATUSMATRISEN (sex statusar) ärvs från `cancel-registration`s
// övergångstabell och är bevisad där — hermetiskt, av samma skäl.
//
// ── STÄDNING: POSTGRES-RADERNA RADERAS AV TESTET SJÄLVT ───────────────────
// `.purge-staging-policy.json`s postgresTarget matchar sentinel-formen
// `ZZ-TASK-346…` i `inbetalningar.ogonblicksbild_namn`, och den kolumnen fylls
// SERVER-SIDE ur anmälans namn (`registrera-inbetalning`). En anmälan skapad
// via `create-registration` bär alltid "Förnamn Efternamn" — med ett
// mellanslag — och kan därför strukturellt aldrig matcha sentinel-regexen
// (`[0-9A-Za-z._+-]`, inget blanksteg). Raderna vore alltså OPURGBARA för
// alltid om testet lämnade dem kvar.
//
// Lösningen är INTE att vidga purge-mönstret (det hade ändrat en delad
// städningsmekanism för hela repot i en skiva om ombokning) utan att testet
// städar efter sig med den befintliga, allowlistade vägen:
// `hantera-inbetalning` med `atgard: 'radera'`. Den vägen finns just för "en
// rad som inte borde finnas", och raderingen är tillåten eftersom inget kvitto
// någonsin utfärdas här (kvittojobbet köas bara av `koa-kvitton`, som testet
// aldrig anropar — `kvitto_id` förblir null och `on delete restrict` fäller
// därför aldrig).
//
// Städningen ligger i `finally` per test. Kraschar körningen mitt i (avbrutet
// CI-jobb) blir raderna kvar — en känd, bokförd kant, samma klass som
// `update-event.staging.test.ts`s finally-beroende städning redan bär.
//
// SENTINEL: eget create-registration-record (create-test+${uuid}@staging.test)
// och ett eget create-event-record (Ort `ZZ-create-event-test`) — båda
// befintliga ADR-060-purge-targets. Inga nya targets behövs.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { ActivityStatementSchema } from '../../src/domain/schemas';
import {
  AKTIVITETSTYP,
  ANMALAN_VERB,
  anmalanObjektId,
  NY_ANMALAN_EXTENSION_IRI,
} from '../../supabase/functions/_shared/aktivitetslogg';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/rebook-registration';
/** rec-format men finns inte i basen → 404-grenarna. */
const OKANT_REC_ID = 'recZZZZZZZZZZZZZZ';
const SENTINEL_ORT = 'ZZ-create-event-test';
/** Samma seedade Eventformat-ankare som create-event.staging.test.ts. */
const SEEDED_EVENTFORMAT_ID = 'recclDd7hUQsfxoVs';
const SENTINEL_NOTERING = 'Fixturskapad text som ska bevaras genom ombokningens skrivning.';

interface RebookBody {
  registrationId?: unknown;
  nyttEventId?: unknown;
}

type RebookSvar = {
  gammalAnmalanId: string;
  nyAnmalanId: string;
  nyAnmalanSkapad: boolean;
  aterupptaget: boolean;
  nyttEventId: string;
  status: string;
  notering: string;
  flyttadeRader: number;
  flyttadSumma: number;
  summaNyAnmalan: number;
  nyttPris: number | null;
  prisskillnad: number | null;
  spegelGammal: { skrivet: boolean };
  spegelNy: { skrivet: boolean };
};

function postRebook(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: RebookBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${ENDPOINT}`, { headers, data: body });
}

/** Härled conformance-ankaret: den seedade postens event (ingen ny event-fixtur). */
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

/** Eget sentinel-event (ADR-060, Ort ZZ-create-event-test) att boka om TILL. */
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
  registreraKastbarPost(id, 'rebook-registration/mal-event');
  return id;
}

/** Eget sentinel-anmälnings-record (ADR-060) — delade fixturer muteras aldrig. */
async function createSentinelRegistration(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  efternamn: string,
  /** Återanvänd adress när samma PERSON ska finnas på två event. */
  aterianvandEmail?: string,
): Promise<{ id: string; email: string }> {
  const email = aterianvandEmail ?? `create-test+${randomUUID()}@staging.test`;
  const res = await request.post(`${config.baseUrl}/functions/v1/create-registration`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      fornamn: 'Sentinel',
      efternamn,
      email,
      telefon: null,
      eventId,
      notering: SENTINEL_NOTERING,
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), raw).toBe(201);
  return { id: (JSON.parse(raw) as { record: { id: string } }).record.id, email };
}

/** Registrerar EN inbetalning och returnerar dess id (för flytt-bevis + städning). */
async function registreraInbetalning(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  anmalanRecordId: string,
  belopp: number,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}/functions/v1/registrera-inbetalning`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    // [TASK-367 review runda 1, FYND 2] `medKvitto` är sedan denna skiva
    // OBLIGATORISKT (`registrera-inbetalning` svarar 400 utan det). Denna
    // svit rör flytten mellan anmälningar, aldrig kvittoflödet — `true` är
    // det neutrala valet (samma default kryssrutan i UI:t bär).
    data: { anmalanRecordId, belopp: String(belopp), betalsatt: 'Swish', medKvitto: true },
  });
  const raw = await res.text();
  expect(res.status(), raw).toBe(201);
  return (JSON.parse(raw) as { inbetalning: { id: string } }).inbetalning.id;
}

/** Makulerar en inbetalning (skäl krävs) — den ska sedan INTE flyttas. */
async function makulera(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  inbetalningId: string,
): Promise<void> {
  const res = await request.post(`${config.baseUrl}/functions/v1/hantera-inbetalning`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { atgard: 'makulera', inbetalningId, skal: 'Fixtur: ska inte följa med vid ombokning' },
  });
  expect(res.status(), await res.text()).toBe(200);
}

/**
 * Städar en Postgres-rad via den allowlistade raderingsvägen. Aldrig en
 * assertion — städningen får inte fälla ett test vars egentliga bevis redan
 * är avlagt (och en redan makulerad rad utan kvitto raderas lika bra).
 */
async function raderaTyst(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  inbetalningId: string,
): Promise<void> {
  try {
    const res = await request.post(`${config.baseUrl}/functions/v1/hantera-inbetalning`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: { atgard: 'radera', inbetalningId },
    });
    if (res.status() !== 200) {
      console.warn(`[rebook-städning] ${inbetalningId} raderades inte: ${await res.text()}`);
    }
  } catch (err) {
    console.warn(`[rebook-städning] ${inbetalningId}: ${err instanceof Error ? err.message : err}`);
  }
}

/** Inbetalningarna + spegelns färskhet för EN anmälan. */
async function lasBetalningar(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  anmalanRecordId: string,
) {
  const res = await request.get(
    `${config.baseUrl}/functions/v1/hamta-inbetalningar?anmalanRecordId=${encodeURIComponent(anmalanRecordId)}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  const raw = await res.text();
  expect(res.status(), raw).toBe(200);
  return JSON.parse(raw) as {
    inbetalningar: {
      id: string;
      status: string;
      belopp: number;
      ogonblicksbildEvent: string;
      ogonblicksbildEventdatum: string | null;
      kvittoId: string | null;
    }[];
    spegel: { summaPostgres: number; summaBasen: number | null; iFas: boolean };
  };
}

/** Omläsning av anmälan via get-registrations — samma läsväg som övriga sviter. */
async function readRegistration(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  id: string,
): Promise<{ status: unknown; notering: unknown }> {
  const res = await request.get(
    `${config.baseUrl}/functions/v1/get-registrations?eventId=${encodeURIComponent(eventId)}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(res.status()).toBe(200);
  const { registrations } = (await res.json()) as {
    registrations: { id: string; status: unknown; notering: unknown }[];
  };
  const rad = registrations.find((r) => r.id === id);
  expect(rad, `anmälan ${id} hittades inte via get-registrations`).toBeTruthy();
  return rad as { status: unknown; notering: unknown };
}

/** Statements för EXAKT en anmälan, via get-activity-log. */
async function readActivityLogFor(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  registrationId: string,
) {
  const res = await request.get(
    `${config.baseUrl}/functions/v1/get-activity-log?category=${encodeURIComponent(AKTIVITETSTYP.anmalan)}&pageSize=100`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  const raw = await res.text();
  expect(res.status(), raw).toBe(200);
  const { statements } = JSON.parse(raw) as { statements: unknown[] };
  return statements
    .map((s) => ActivityStatementSchema.parse(s))
    .filter((s) => s.object.id === anmalanObjektId(registrationId));
}

test.describe('rebook-registration — skarp conformance (TASK-368.4)', () => {
  test('AUTH: 401 utan token', async ({ request }) => {
    const config = getApiConfig();
    const res = await postRebook(request, config, undefined, {
      registrationId: OKANT_REC_ID,
      nyttEventId: OKANT_REC_ID,
    });
    await classify401Body(res);
  });

  test('METOD: 405 på GET', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });

  test('INPUT: 400 på ogiltiga record-ID-format', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const felAnmalan = await postRebook(request, config, jwt, {
      registrationId: 'inte-ett-rec-id',
      nyttEventId: OKANT_REC_ID,
    });
    expect(felAnmalan.status()).toBe(400);
    expect(((await felAnmalan.json()) as { error?: string }).error).toContain('registrationId');

    const felEvent = await postRebook(request, config, jwt, {
      registrationId: OKANT_REC_ID,
      nyttEventId: 'inte-ett-rec-id',
    });
    expect(felEvent.status()).toBe(400);
    expect(((await felEvent.json()) as { error?: string }).error).toContain('nyttEventId');
  });

  test('OKÄNT ID: 404 för anmälan (aldrig 500, aldrig tyst överhoppning)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postRebook(request, config, jwt, {
      registrationId: OKANT_REC_ID,
      nyttEventId: OKANT_REC_ID,
    });
    expect(res.status()).toBe(404);
    expect(((await res.json()) as { error?: string }).error).toContain(OKANT_REC_ID);
  });

  test('SAMMA EVENT: 409 samma_event, ingenting skrivs', async ({ request }) => {
    test.setTimeout(120_000);
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await findSeededEventId(request, config, jwt);
    const { id: registrationId } = await createSentinelRegistration(
      request,
      config,
      jwt,
      eventId,
      'Sammaevent',
    );

    const res = await postRebook(request, config, jwt, { registrationId, nyttEventId: eventId });
    expect(res.status()).toBe(409);
    expect(((await res.json()) as { code?: string }).code).toBe('samma_event');

    const efter = await readRegistration(request, config, jwt, eventId, registrationId);
    expect(efter.status).toBe('Obekräftad');
    expect(efter.notering).toBe(SENTINEL_NOTERING);
  });

  test('REDAN ANMÄLD PÅ MÅLET: 409 redan_anmald_pa_malet, ingen ekonomi slås ihop', async ({
    request,
  }) => {
    // Marcus beslut 2026-09-03 (granskningen av PR #2247): adoption sker ENDAST
    // när anropet bevisligen är samma request upprepad. Personen har här en
    // GENUIN anmälan på båda eventen — då ska ombokningen fälla, inte flytta
    // pengarna till den befintliga raden.
    test.setTimeout(180_000);
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const gammaltEventId = await findSeededEventId(request, config, jwt);
    const nyttEventId = await createSentinelEvent(request, config, jwt);
    const { id: registrationId, email } = await createSentinelRegistration(
      request,
      config,
      jwt,
      gammaltEventId,
      'Dubbelanmald',
    );
    // SAMMA person (samma e-post) på mål-eventet — affärs-unikheten ser den.
    await createSentinelRegistration(request, config, jwt, nyttEventId, 'Dubbelanmald', email);

    const res = await postRebook(request, config, jwt, { registrationId, nyttEventId });
    const raw = await res.text();
    expect(res.status(), raw).toBe(409);
    const kropp = JSON.parse(raw) as { code?: string; error?: string };
    expect(kropp.code).toBe('redan_anmald_pa_malet');
    expect(kropp.error).toContain('redan anmäld');

    // Den gamla anmälan står ORÖRD — ingen status, ingen Notering-rad.
    const efter = await readRegistration(request, config, jwt, gammaltEventId, registrationId);
    expect(efter.status).toBe('Obekräftad');
    expect(efter.notering).toBe(SENTINEL_NOTERING);
  });

  test('FLERA INBETALNINGAR: flytt, makulerad kvar, spegel på båda, loggverb, idempotens', async ({
    request,
  }) => {
    // Flödet kedjar ~25 sekventiella HTTP-anrop mot staging (fixturer, två
    // ombokningsanrop, fyra läsningar per anmälan, städning) — gott om
    // marginal över standardtaket utan att sviten i övrigt behöver ett eget.
    test.setTimeout(240_000);
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const gammaltEventId = await findSeededEventId(request, config, jwt);
    const nyttEventId = await createSentinelEvent(request, config, jwt);
    const { id: registrationId } = await createSentinelRegistration(
      request,
      config,
      jwt,
      gammaltEventId,
      'Ombokningstest',
    );

    const inbetalningar: string[] = [];
    try {
      const aktivA = await registreraInbetalning(request, config, jwt, registrationId, 1000);
      const aktivB = await registreraInbetalning(request, config, jwt, registrationId, 500);
      const makuleradId = await registreraInbetalning(request, config, jwt, registrationId, 250);
      inbetalningar.push(aktivA, aktivB, makuleradId);
      await makulera(request, config, jwt, makuleradId);

      const fore = await readRegistration(request, config, jwt, gammaltEventId, registrationId);
      expect(fore.status).toBe('Obekräftad');
      expect(fore.notering).toBe(SENTINEL_NOTERING);

      // ── OMBOKNINGEN ──────────────────────────────────────────────────────
      const res = await postRebook(request, config, jwt, { registrationId, nyttEventId });
      const raw = await res.text();
      expect(res.status(), raw).toBe(200);
      const svar = JSON.parse(raw) as RebookSvar;

      expect(svar.gammalAnmalanId).toBe(registrationId);
      expect(svar.nyAnmalanId.startsWith('rec')).toBe(true);
      expect(svar.nyAnmalanId).not.toBe(registrationId);
      expect(svar.nyAnmalanSkapad).toBe(true);
      expect(svar.aterupptaget).toBe(false);
      expect(svar.status).toBe('Avbokad/Ombokad');

      // AC #2/#3: exakt de TVÅ aktiva flyttades, den makulerade inte.
      expect(svar.flyttadeRader).toBe(2);
      expect(svar.flyttadSumma).toBe(1500);
      // Tillståndstalet 368.5 ska visa — samma belopp här, men stabilt över
      // omkörningar till skillnad från räknarna ovan (se idempotens-steget).
      expect(svar.summaNyAnmalan).toBe(1500);

      // AC #3: prisskillnadens identitet (tecknen bevisas hermetiskt, se filhuvudet).
      if (svar.nyttPris === null) {
        expect(svar.prisskillnad).toBeNull();
      } else {
        expect(svar.prisskillnad).toBeCloseTo(svar.nyttPris - 1500, 2);
      }

      // Notering: fixturens text BEVARAD, Ombokad-raden sist.
      expect(svar.notering.startsWith(SENTINEL_NOTERING)).toBe(true);
      expect(svar.notering).toMatch(/\n\n\[Ombokad \d{4}-\d{2}-\d{2} av .+\] till .+$/);

      const efterGammal = await readRegistration(
        request,
        config,
        jwt,
        gammaltEventId,
        registrationId,
      );
      expect(efterGammal.status).toBe('Avbokad/Ombokad');
      expect(efterGammal.notering).toBe(svar.notering);

      // ── PENGARNA: gamla anmälan har BARA den makulerade kvar ─────────────
      const gammalBet = await lasBetalningar(request, config, jwt, registrationId);
      expect(gammalBet.inbetalningar.map((p) => p.id).sort()).toEqual([makuleradId]);
      expect(gammalBet.inbetalningar[0].status).toBe('makulerad');
      expect(gammalBet.spegel.summaPostgres).toBe(0);
      expect(gammalBet.spegel.iFas, JSON.stringify(gammalBet.spegel)).toBe(true);
      expect(svar.spegelGammal.skrivet).toBe(true);

      // ── PENGARNA: nya anmälan har de två aktiva, med NY ögonblicksbild ───
      const nyBet = await lasBetalningar(request, config, jwt, svar.nyAnmalanId);
      expect(nyBet.inbetalningar.map((p) => p.id).sort()).toEqual([aktivA, aktivB].sort());
      expect(nyBet.spegel.summaPostgres).toBe(1500);
      expect(nyBet.spegel.iFas, JSON.stringify(nyBet.spegel)).toBe(true);
      expect(svar.spegelNy.skrivet).toBe(true);
      for (const post of nyBet.inbetalningar) {
        expect(post.status).toBe('aktiv');
        // Ögonblicksbilden pekar på MÅL-eventet (kortets AC #2).
        expect(post.ogonblicksbildEvent).toBe('Fjärrskådning');
        expect(post.ogonblicksbildEventdatum).toBe('2026-09-15');
        // Kvittot rörs aldrig — ingen av raderna fick ett i denna körning.
        expect(post.kvittoId).toBeNull();
      }

      // ── IDEMPOTENS: andra identiska anropet ändrar ingenting ─────────────
      const igen = await postRebook(request, config, jwt, { registrationId, nyttEventId });
      const igenRaw = await igen.text();
      expect(igen.status(), igenRaw).toBe(200);
      const igenSvar = JSON.parse(igenRaw) as RebookSvar;
      expect(igenSvar.aterupptaget).toBe(true);
      expect(igenSvar.nyAnmalanSkapad).toBe(false);
      expect(igenSvar.nyAnmalanId).toBe(svar.nyAnmalanId);
      // PER-ANROP-räknarna är noll här — och det är precis därför 368.5 inte
      // får bygga "X kr flyttades" på dem.
      expect(igenSvar.flyttadeRader).toBe(0);
      expect(igenSvar.flyttadSumma).toBe(0);
      // TILLSTÅNDSTALET står kvar på rätt belopp.
      expect(igenSvar.summaNyAnmalan).toBe(1500);
      // Noteringen fick INGEN andra Ombokad-rad.
      const efterIgen = await readRegistration(
        request,
        config,
        jwt,
        gammaltEventId,
        registrationId,
      );
      expect(efterIgen.notering).toBe(svar.notering);

      // ── LOGGVERBET: EXAKT en rad, med BÅDA anmälningarna ─────────────────
      const statements = await readActivityLogFor(request, config, jwt, registrationId);
      const ombokningar = statements.filter((s) => s.verb.id === ANMALAN_VERB.bokadeOm.id);
      expect(ombokningar.length, JSON.stringify(ombokningar)).toBe(1);
      const statement = ombokningar[0];
      expect(statement.verb.display['sv-SE']).toBe('bokade om anmälan');
      expect(statement.object.definition.type).toBe(AKTIVITETSTYP.anmalan);
      expect(statement.object.definition.name['sv-SE']).toBe('Sentinel Ombokningstest');
      expect(statement.context.extensions[NY_ANMALAN_EXTENSION_IRI]).toBe(
        anmalanObjektId(svar.nyAnmalanId),
      );
    } finally {
      for (const id of inbetalningar) {
        await raderaTyst(request, config, jwt, id);
      }
    }
  });

  test('EN INBETALNING: flytt i motsatt riktning, spegel på båda', async ({ request }) => {
    test.setTimeout(240_000);
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // Här är sentinel-eventet UTGÅNGSPUNKTEN och det seedade eventet målet —
    // motsatt riktning mot fallet ovan, så flytten bevisas åt båda hållen.
    const gammaltEventId = await createSentinelEvent(request, config, jwt);
    const nyttEventId = await findSeededEventId(request, config, jwt);
    const { id: registrationId } = await createSentinelRegistration(
      request,
      config,
      jwt,
      gammaltEventId,
      'Enbetalning',
    );

    const inbetalningar: string[] = [];
    try {
      const enda = await registreraInbetalning(request, config, jwt, registrationId, 2000);
      inbetalningar.push(enda);

      const res = await postRebook(request, config, jwt, { registrationId, nyttEventId });
      const raw = await res.text();
      expect(res.status(), raw).toBe(200);
      const svar = JSON.parse(raw) as RebookSvar;

      expect(svar.nyAnmalanSkapad).toBe(true);
      expect(svar.flyttadeRader).toBe(1);
      expect(svar.flyttadSumma).toBe(2000);
      expect(svar.summaNyAnmalan).toBe(2000);
      expect(svar.status).toBe('Avbokad/Ombokad');
      if (svar.nyttPris === null) {
        expect(svar.prisskillnad).toBeNull();
      } else {
        expect(svar.prisskillnad).toBeCloseTo(svar.nyttPris - 2000, 2);
      }

      const gammalBet = await lasBetalningar(request, config, jwt, registrationId);
      expect(gammalBet.inbetalningar).toHaveLength(0);
      expect(gammalBet.spegel.iFas, JSON.stringify(gammalBet.spegel)).toBe(true);

      const nyBet = await lasBetalningar(request, config, jwt, svar.nyAnmalanId);
      expect(nyBet.inbetalningar.map((p) => p.id)).toEqual([enda]);
      expect(nyBet.spegel.summaPostgres).toBe(2000);
      expect(nyBet.spegel.iFas, JSON.stringify(nyBet.spegel)).toBe(true);
    } finally {
      for (const id of inbetalningar) {
        await raderaTyst(request, config, jwt, id);
      }
    }
  });

  test('CORS preflight: tillåten origin → 200 + Access-Control-Allow-Origin speglar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const res = await request.fetch(`${config.baseUrl}${ENDPOINT}`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
