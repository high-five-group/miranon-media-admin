// create-event — skarp conformance mot deployad staging-EF (Fas 6f L1, ADR-066).
//
// create-event SKRIVER (POST → ny Eventplanering-rad). Repots TREDJE write-vertikal;
// speglar create-registration/save-segment:s säkerhets-kontrakt men för CREATE av ett
// event. Bevisar mot SKARP staging-data:
//   1. allow: giltig create → 201 + SKRIV-BEVIS ur råa record.fields — EF:en satte
//      Event(source)/Typ/Ort/datum/platser/Status/Eventtyp + Idempotensnyckel, HÄRLEDDE
//      Månad/år ur Startdatum (ADR-066 b6), och de system-genererade EventKey/Event-nr
//      FÖDDES (formel-på-autoNumber) utan att vi satte dem.
//   2. IDEMPOTENS-INTEGRATION (kärnan, ADR-066 b3): färsk UUID → createdRecords (nytt event,
//      201); SAMMA UUID + samma payload → updatedRecords (idempotent replay, 200, SAMMA
//      record-ID, noll dubblett). Bevisar att upsert mot tomt-på-alla-rader-merge-fält SKAPAR
//      (ej matchar en tom rad) + att retry är idempotent (L189).
//   3. INVARIANT: saknad idempotencyKey → 400; malformad (ej UUID v4) → 400.
//   4. deny: ogiltig eventtyp-form → 400 (klient-nåbar input-deny; create:s `fields` byggs
//      server-side, så field-allowlisten är en SSOT-grind mot kod-drift, ej en klient-deny-yta —
//      samma mönster som create-registration deny-testet).
//   5. anon (ingen JWT) → 401 (delad gateway/requireUser).
//
// EVENTFORMAT-ANKARE: eventtyp KRÄVS vid create (ADR-066 b5, GREN A) → driver Sessionsmall.
// Staging Eventformat var TOMT vid bygget (Session 38) → en permanent sentinel-fixtur seedades
// (`ZZ-create-event-test-format`) och dess record-ID injiceras via TEST_EVENTFORMAT_RECORD_ID
// (samma seedat-ankare-mönster som TEST_REGISTRATION_RECORD_ID). Robustare än ett hårdkodat ID
// (duplicerad bas, ADR-050).
//
// SENTINEL (ADR-060): events skapas med Ort `ZZ-create-event-test` (ZZ-prefix → markerat
// syntetiskt, speglar befintliga staging-fixturer) + per-anrop UUID-nyckel. setup-purge är
// manuell/schemalagd (CI saknar Airtable-creddad seed-fas) — bounded sentinel-ackumulering
// tolereras, ADR-060. Lokalt städas de via Airtable-MCP efter körning (Code-session).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan creds; skarpa
// beviset körs i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/create-event';
const SENTINEL_ORT = 'ZZ-create-event-test';

interface CreateBody {
  event?: string;
  typ?: string;
  ort?: string;
  startdatum?: string;
  slutdatum?: string;
  maxPlatser?: number;
  status?: string;
  eventtyp?: string;
  idempotencyKey?: string;
}

function postCreate(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: CreateBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${ENDPOINT}`, { headers, data: body });
}

// Seedat Eventformat-ankare (eventtyp-länkens mål). Staging Eventformat var TOMT vid bygget
// (Session 38 L1) → en permanent sentinel-fixtur seedades (`ZZ-create-event-test-format`,
// Format=[Dag 1, Dag 2]) som dokumenterat staging-ankare. TEST_EVENTFORMAT_RECORD_ID kan
// override:a (om basen någon gång re-seedas); annars används det seedade ID:t direkt → CI
// behöver ingen ny secret (till skillnad mot TEST_REGISTRATION_RECORD_ID-vägen). Fixturen är
// ZZ-markerad → ADR-060 sentinel-tolerans (purgeas ej).
const SEEDED_EVENTFORMAT_ID = 'recclDd7hUQsfxoVs';

function eventformatId(): string {
  return process.env.TEST_EVENTFORMAT_RECORD_ID || SEEDED_EVENTFORMAT_ID;
}

/** Giltig create-payload med färsk idempotensnyckel. Startdatum i Månad/år-options-range. */
function validBody(eventtyp: string, idempotencyKey: string): CreateBody {
  return {
    event: 'Fjärrskådning',
    typ: 'Utbildning',
    ort: SENTINEL_ORT,
    startdatum: '2026-09-15',
    slutdatum: '2026-09-16',
    maxPlatser: 20,
    eventtyp,
    idempotencyKey,
  };
}

test.describe('create-event — skarp conformance (Fas 6f L1)', () => {
  test('allow: giltig create → 201 + skriv-bevis (Månad/år härlett, Eventtyp satt, system-fält födda)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();

    const res = await postCreate(request, config, jwt, validBody(eventtyp, randomUUID()));
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as {
      event: Record<string, unknown>;
      record: { id: string; fields: Record<string, unknown> };
      created: boolean;
    };

    // (i) SKRIV-BEVIS ur råa record.fields — EF:en satte fälten i Airtable.
    expect(body.created).toBe(true);
    expect(body.record.id.startsWith('rec')).toBe(true);
    expect(body.record.fields['Event (source)']).toBe('Fjärrskådning');
    expect(body.record.fields['Typ']).toBe('Utbildning');
    expect(body.record.fields['Ort']).toBe(SENTINEL_ORT);
    expect(body.record.fields['Startdatum']).toBe('2026-09-15');
    expect(body.record.fields['Status']).toBe('Planerat'); // default
    // Månad/år HÄRLETT ur Startdatum (ADR-066 b6) — ej skickat av klienten.
    expect(body.record.fields['Månad/år']).toBe('September 2026');
    // Eventtyp-länk satt → single-element array med ankar-ID.
    expect(body.record.fields['Eventtyp']).toEqual([eventtyp]);
    // Idempotensnyckel skrevs (merge-nyckeln).
    expect(typeof body.record.fields['Idempotensnyckel']).toBe('string');
    // System-genererade fält FÖDDES utan att vi satte dem.
    expect(body.record.fields['EventKey']).toMatch(/^Event-\d+$/);
    expect(typeof body.record.fields['Event-nr']).toBe('number');

    // (ii) Domän-envelope (adapterns parse-väg byggs i L2) — bär system-tilldelningen.
    expect(body.event.eventNamn).toBe('Fjärrskådning');
    expect(body.event.eventKey).toMatch(/^Event-\d+$/);
  });

  test('IDEMPOTENS: färsk UUID → 201 created; samma UUID → 200 replay, samma record-ID, noll dubblett', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();
    const key = randomUUID();

    // (1) Färsk nyckel → SKAPAR (createdRecords).
    const first = await postCreate(request, config, jwt, validBody(eventtyp, key));
    const firstRaw = await first.text();
    expect(first.status(), firstRaw).toBe(201);
    const firstBody = JSON.parse(firstRaw) as { record: { id: string }; created: boolean };
    expect(firstBody.created).toBe(true);
    const firstId = firstBody.record.id;

    // (2) SAMMA nyckel + samma payload → MATCHAR (updatedRecords), idempotent replay.
    const second = await postCreate(request, config, jwt, validBody(eventtyp, key));
    const secondRaw = await second.text();
    expect(second.status(), secondRaw).toBe(200);
    const secondBody = JSON.parse(secondRaw) as { record: { id: string }; created: boolean };
    expect(secondBody.created).toBe(false);
    // SAMMA record-ID → ingen dubblett skapades (upsert matchade på Idempotensnyckel).
    expect(secondBody.record.id).toBe(firstId);
  });

  test('INVARIANT: saknad idempotencyKey → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();

    const body = validBody(eventtyp, '');
    body.idempotencyKey = undefined;
    const res = await postCreate(request, config, jwt, body);
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/Idempotency-Key/i);
  });

  test('INVARIANT: malformad idempotencyKey (ej UUID v4) → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();

    const res = await postCreate(request, config, jwt, validBody(eventtyp, 'inte-en-uuid'));
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/UUID/i);
  });

  test('deny: ogiltig eventtyp-form → 400 (input-deny; allowlist är SSOT-grind mot kod-drift)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      ...validBody('rec-ankare-ersätts', randomUUID()),
      eventtyp: 'inteEttRecordId',
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/eventtyp/i);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: validBody('recANY', randomUUID()),
    });
    await classify401Body(res);
  });
});
