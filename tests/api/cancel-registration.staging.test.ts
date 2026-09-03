// cancel-registration — skarp conformance mot deployad staging-EF (TASK-368.2,
// PRD TASK-368 beslut 1/3/4). Repots åttonde write-vertikal.
//
// Bevisar mot SKARP staging-data:
//   1. säkerhets-kontraktet: anon → 401, GET → 405 (delad gateway/requireUser).
//   2. input-grindar (deny-by-default): ogiltig atgard → 400, ogiltigt
//      registrationId-format → 400, för långt skäl → 400.
//   3. okänt rec-ID → 404 (get-event/create-registration-klassens kontrakt).
//   4. DEN FULLA, REACHABLE ÖVERGÅNGEN, ände-till-ände, på ETT sentinel-record:
//      Obekräftad --avboka--> Avbokad/Ombokad --aterta--> Obekräftad (härledd,
//      ingen Bekräftelse skickad på fixturen). Notering-appendet prövas i
//      BÅDA leden: fixturens EGEN starttext bevaras genom BÅDA skrivningarna,
//      och båda de datumstämplade raderna finns kvar i slutresultatet.
//   5. IDEMPOTENSEN (AC #4): ett andra identiskt `avboka` på en redan avbokad
//      anmälan → 409 `redan_avbokad`, INGEN ändring av Status/Notering. Ett
//      andra identiskt `aterta` på en redan återtagen anmälan → 409
//      `inte_avbokad`. Ingen loggrad skrivs vid någon av de avvisade anropen
//      (aktivitetsloggen bär exakt två rader för sentinelet: en `avbokade
//      anmälan`, en `återtog avbokning`).
//   6. LOGGVERBEN via get-activity-log: `AKTIVITETSTYP.anmalan` +
//      `ANMALAN_VERB.avbokade`/`.atertogAvbokning`, rätt `object.id`
//      (anmalanObjektId) och `object.definition.name` (personens namn).
//   7. CORS preflight (tillåten origin) → 200 + speglad origin.
//
// ── VAD SOM MEDVETET INTE PRÖVAS HÄR, OCH VARFÖR ──────────────────────────
// Full-matrisen (AC #1: SEX statusar × TVÅ åtgärder) bevisas UTTÖMMANDE
// hermetiskt i `cancel-registration.test.ts` mot den delade orkestratorn
// (`_shared/cancel-registration.ts`) — inte här. Skälet är mekaniskt, samma
// klass som `send-registration-confirmation.staging.test.ts`s dokumenterade
// val att INTE committa en happy-path för varje gren: ingen befintlig Edge
// Function kan sätta en anmälan till "Bekräftad (mail skickat)",
// "Betalningspåminnelse skickad", "Flytta till väntelista" eller "Inställt"
// utan antingen (a) muterande en PERMANENT delad fixtur andra sviter beror
// på exakta värden av (`ARBETSKO_EXPECTED.bekraftadId` m.fl. — "delade
// staging-fixturer muteras ALDRIG", samma disciplin den filen bär), eller
// (b) en rå Airtable-skrivning utanför alla allowlistade operationer, vilket
// själva denna skiva finns för att förhindra. Den enda statuskombination en
// FÄRSK, egen sentinel kan nå via befintliga EF:er (`create-registration`
// startar alltid på "Obekräftad") är den som prövas nedan — och den täcker
// samtidigt BÅDA härledningsgrenarna för `aterta` går INTE att nå (ingen EF
// sätter "Bekräftelse skickad" utan att skicka ett riktigt mail, se
// `send-registration-confirmation.staging.test.ts`s egen not om det). Den
// grenen ("Bekräftelse skickad" satt → härledd "Bekräftad (mail skickat)")
// är därför BARA hermetiskt bevisad, inte skarpt.
//
// SENTINEL: eget create-registration-record (create-test+${uuid}@staging.test)
// — samma ADR-060-purge-target som create-registration/send-registration-
// confirmation redan delar ("create-registration-sentineler" i
// `.purge-staging-policy.json`). Ingen ny purge-target behövs.
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
} from '../../supabase/functions/_shared/aktivitetslogg';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/cancel-registration';
/** rec-format men finns inte i basen → 404-grenen. */
const OKANT_REC_ID = 'recZZZZZZZZZZZZZZ';
const SENTINEL_NOTERING = 'Fixturskapad text som ska bevaras genom BÅDA avbokningsskrivningarna.';

interface CancelBody {
  registrationId?: unknown;
  atgard?: unknown;
  skal?: unknown;
}

function postCancel(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: CancelBody,
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

/** Eget sentinel-anmälnings-record (ADR-060) — delade fixturer muteras aldrig. */
async function createSentinelRegistration(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}/functions/v1/create-registration`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      fornamn: 'Sentinel',
      efternamn: 'Avbokningstest',
      email: `create-test+${randomUUID()}@staging.test`,
      telefon: null,
      eventId,
      notering: SENTINEL_NOTERING,
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), raw).toBe(201);
  return (JSON.parse(raw) as { record: { id: string } }).record.id;
}

/** Omläsning via get-registrations — samma läs-väg som resten av API-sviterna. */
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

/** Statements för EXAKT detta sentinel-record, nyast först (get-activity-log). */
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
  const parsed = statements.map((s) => ActivityStatementSchema.parse(s));
  return parsed.filter((s) => s.object.id === anmalanObjektId(registrationId));
}

test.describe('cancel-registration — skarp conformance (TASK-368.2)', () => {
  test('AUTH: 401 utan token', async ({ request }) => {
    const config = getApiConfig();
    const res = await postCancel(request, config, undefined, {
      registrationId: OKANT_REC_ID,
      atgard: 'avboka',
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

  test('INPUT: 400 på ogiltig atgard, ogiltigt registrationId-format och för långt skäl', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const felAtgard = await postCancel(request, config, jwt, {
      registrationId: OKANT_REC_ID,
      atgard: 'annulera',
    });
    expect(felAtgard.status()).toBe(400);
    expect(((await felAtgard.json()) as { error?: string }).error).toContain('atgard');

    const felForm = await postCancel(request, config, jwt, {
      registrationId: 'inte-ett-rec-id',
      atgard: 'avboka',
    });
    expect(felForm.status()).toBe(400);
    expect(((await felForm.json()) as { error?: string }).error).toContain('registrationId');

    const langtSkal = await postCancel(request, config, jwt, {
      registrationId: OKANT_REC_ID,
      atgard: 'avboka',
      skal: 'x'.repeat(501),
    });
    expect(langtSkal.status()).toBe(400);
    expect(((await langtSkal.json()) as { error?: string }).error).toContain('500');
  });

  test('OKÄNT ID: 404 (aldrig 500, aldrig tyst överhoppning)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postCancel(request, config, jwt, {
      registrationId: OKANT_REC_ID,
      atgard: 'avboka',
    });
    expect(res.status()).toBe(404);
    expect(((await res.json()) as { error?: string }).error).toContain(OKANT_REC_ID);
  });

  test('ALLOW + NOTERING-APPEND + IDEMPOTENS + LOGGVERB: hela runda-tripen på ett eget sentinel-record', async ({
    request,
  }) => {
    // Flödet kedjar ~10 sekventiella HTTP-anrop (skapa fixtur, två läsningar
    // per skrivning, fyra skrivningar, en loggläsning) — gott om marginal
    // över standardtaket (30 s) utan att sviten i övrigt behöver ett eget
    // globalt tak (samma punktinsats som config.ts:s enstaka `timeout: 60_000`-
    // block för andra tunga flöden).
    test.setTimeout(90_000);
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await findSeededEventId(request, config, jwt);
    const registrationId = await createSentinelRegistration(request, config, jwt, eventId);

    const fore = await readRegistration(request, config, jwt, eventId, registrationId);
    expect(fore.status).toBe('Obekräftad');
    expect(fore.notering).toBe(SENTINEL_NOTERING);

    // ── 1. AVBOKA: aktiv (Obekräftad) → Avbokad/Ombokad ────────────────────
    const avbokaRes = await postCancel(request, config, jwt, {
      registrationId,
      atgard: 'avboka',
      skal: 'Blev sjuk',
    });
    const avbokaRaw = await avbokaRes.text();
    expect(avbokaRes.status(), avbokaRaw).toBe(200);
    const avbokaBody = JSON.parse(avbokaRaw) as { status: string; notering: string };
    expect(avbokaBody.status).toBe('Avbokad/Ombokad');
    // Befintlig text BEVARAD, ny rad sist, med skäl, tomrad emellan.
    expect(avbokaBody.notering.startsWith(SENTINEL_NOTERING)).toBe(true);
    expect(avbokaBody.notering).toMatch(/\n\n\[Avbokad \d{4}-\d{2}-\d{2} av .+\] Blev sjuk$/);

    const efterAvboka = await readRegistration(request, config, jwt, eventId, registrationId);
    expect(efterAvboka.status).toBe('Avbokad/Ombokad');
    expect(efterAvboka.notering).toBe(avbokaBody.notering);

    // ── 2. IDEMPOTENS: avboka en redan avbokad anmälan → 409, INGEN ändring ─
    const avbokaIgenRes = await postCancel(request, config, jwt, {
      registrationId,
      atgard: 'avboka',
      skal: 'Ett andra försök',
    });
    expect(avbokaIgenRes.status()).toBe(409);
    const avbokaIgenBody = (await avbokaIgenRes.json()) as { code?: string };
    expect(avbokaIgenBody.code).toBe('redan_avbokad');

    const efterAvbokaIgen = await readRegistration(request, config, jwt, eventId, registrationId);
    // Oförändrat — det andra skälet ("Ett andra försök") skrevs ALDRIG.
    expect(efterAvbokaIgen.notering).toBe(avbokaBody.notering);

    // ── 3. ÅTERTA: Avbokad/Ombokad → härledd Obekräftad (ingen Bekräftelse
    // skickad på sentinelet — create-registration sätter den aldrig) ───────
    const atertaRes = await postCancel(request, config, jwt, {
      registrationId,
      atgard: 'aterta',
    });
    const atertaRaw = await atertaRes.text();
    expect(atertaRes.status(), atertaRaw).toBe(200);
    const atertaBody = JSON.parse(atertaRaw) as { status: string; notering: string };
    expect(atertaBody.status).toBe('Obekräftad');
    // BÅDA tidigare raderna finns kvar — inget skrivs över.
    expect(atertaBody.notering.startsWith(avbokaBody.notering)).toBe(true);
    expect(atertaBody.notering).toMatch(/\n\n\[Avbokning återtagen \d{4}-\d{2}-\d{2} av .+\]$/);

    const efterAterta = await readRegistration(request, config, jwt, eventId, registrationId);
    expect(efterAterta.status).toBe('Obekräftad');
    expect(efterAterta.notering).toBe(atertaBody.notering);

    // ── 4. IDEMPOTENS: aterta en redan återtagen (icke-avbokad) anmälan → 409
    const atertaIgenRes = await postCancel(request, config, jwt, {
      registrationId,
      atgard: 'aterta',
    });
    expect(atertaIgenRes.status()).toBe(409);
    const atertaIgenBody = (await atertaIgenRes.json()) as { code?: string };
    expect(atertaIgenBody.code).toBe('inte_avbokad');

    // ── 5. LOGGVERBEN: EXAKT två rader för detta sentinel-record ───────────
    const statements = await readActivityLogFor(request, config, jwt, registrationId);
    expect(statements.length, JSON.stringify(statements)).toBe(2);

    const avbokadeStatement = statements.find((s) => s.verb.id === ANMALAN_VERB.avbokade.id);
    expect(avbokadeStatement, 'saknar avbokade-verbet').toBeTruthy();
    expect(avbokadeStatement?.verb.display['sv-SE']).toBe('avbokade anmälan');
    expect(avbokadeStatement?.object.definition.type).toBe(AKTIVITETSTYP.anmalan);
    expect(avbokadeStatement?.object.definition.name['sv-SE']).toBe('Sentinel Avbokningstest');

    const atertogStatement = statements.find((s) => s.verb.id === ANMALAN_VERB.atertogAvbokning.id);
    expect(atertogStatement, 'saknar atertogAvbokning-verbet').toBeTruthy();
    expect(atertogStatement?.verb.display['sv-SE']).toBe('återtog avbokning');
    expect(atertogStatement?.object.definition.name['sv-SE']).toBe('Sentinel Avbokningstest');
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
