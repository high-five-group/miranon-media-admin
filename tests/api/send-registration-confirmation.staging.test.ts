// send-registration-confirmation — skarp conformance mot deployad staging-EF
// (task-18.6, PRD task-18 beslut 7). Repots sjätte write-vertikal.
//
// Bevisar mot SKARP staging-data de kontraktspunkter som INTE kräver en verklig
// mail-leverans:
//   1. säkerhets-kontraktet: anon → 401, GET → 405 (delad gateway/requireUser).
//   2. input-grindar (deny-by-default): tom/ogiltig registrationIds → 400, saknad
//      Idempotency-Key → 400, icke-UUID → 400, okänt rec-ID → 404 (get-event-klassens
//      kontrakt — aldrig 500, aldrig tyst hoppa över).
//   3. GATE-LIVENESS + ATOMICITETENS NEGATIVA GREN (AC #1): ett EGET sentinel-
//      anmälnings-record (create-test+uuid@staging.test — icke-Resend-test-adress) →
//      422 non_prod_address_refused OCH omläsning visar att anmälan står KVAR som
//      Obekräftad utan tidsstämpel. Inget mail ⇒ ingen status-flip: basen får aldrig
//      påstå "bekräftad" när inget gick ut. Icke-prod-spärren i _shared/send-bulk.ts
//      är alltså LEVANDE i denna EF:s deploy-kontext.
//   4. IDEMPOTENSEN: en REDAN bekräftad anmälan (den seedade ZZ-arbetsko-fixturen)
//      → 200 status 'skipped' + reason 'already_confirmed', NOLL mail, NOLL skrivning
//      (delade staging-fixturer muteras ALDRIG — skip-vägen returnerar före sändning).
//
// EJ HÄR — MEDVETET, och live-verifierad i stället (send-email L2c/L2d-precedenten,
// Session 40): den POSITIVA happy-path:en (riktigt mail till delivered@resend.dev +
// status-flip + tidsstämpel). Skälet är mekaniskt, inte bekvämlighet: Resends
// test-adresser är en FAST lista (delivered@/bounced@/…) och create-registrations
// 409-affärsunikhet (normaliserad e-post × EventKey) gör att en andra körning inte
// kan skapa samma sentinel igen — och ingen operation kan skriva Status TILLBAKA till
// 'Obekräftad' (allowlisten tillåter exakt Status→Bekräftad + tidsstämpeln). En
// committad happy-path hade därför varit grön exakt en gång. Live-beviset (mail
// accepterat av Resend, Status flippad, tidsstämpel satt, sentinel raderad efteråt)
// är bokfört i kortets Implementation Notes.
//
// SENTINEL: per-körning-unik create-test+${uuid}@staging.test → ADR-060-purgens
// befintliga target städar raden (samma väg som create-registration-sviten).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan creds; skarpa
// beviset körs i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { ARBETSKO_EXPECTED } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/send-registration-confirmation';
const VALID_JOB_ID = '33333333-3333-4333-8333-333333333333';
/** rec-format men finns inte i basen → 404-grenen. */
const OKANT_REC_ID = 'recZZZZZZZZZZZZZZ';

interface ConfirmBody {
  registrationIds?: unknown;
  idempotencyKey?: string;
}

function postConfirm(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: ConfirmBody,
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
      efternamn: 'Bekraftelse',
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

/** Omläsning via get-registrations — samma läs-väg som arbetskön använder. */
async function readRegistration(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  id: string,
): Promise<Record<string, unknown>> {
  const res = await request.get(
    `${config.baseUrl}/functions/v1/get-registrations?eventId=${encodeURIComponent(eventId)}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(res.status()).toBe(200);
  const { registrations } = (await res.json()) as { registrations: Record<string, unknown>[] };
  const rad = registrations.find((r) => r.id === id);
  expect(rad, `anmälan ${id} hittades inte via get-registrations`).toBeTruthy();
  return rad as Record<string, unknown>;
}

test.describe('send-registration-confirmation — skarp conformance (task-18.6)', () => {
  test('AUTH: 401 utan token', async ({ request }) => {
    const config = getApiConfig();
    const res = await postConfirm(request, config, undefined, {
      registrationIds: ['recX'],
      idempotencyKey: VALID_JOB_ID,
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

  test('INPUT: 400 på tom lista, ogiltig ID-form, saknad och trasig idempotensnyckel', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const tom = await postConfirm(request, config, jwt, {
      registrationIds: [],
      idempotencyKey: VALID_JOB_ID,
    });
    expect(tom.status()).toBe(400);
    expect(((await tom.json()) as { error?: string }).error).toContain('registrationIds');

    const felForm = await postConfirm(request, config, jwt, {
      registrationIds: ['inte-ett-rec-id'],
      idempotencyKey: VALID_JOB_ID,
    });
    expect(felForm.status()).toBe(400);

    const utanNyckel = await postConfirm(request, config, jwt, {
      registrationIds: [ARBETSKO_EXPECTED.bekraftadId],
    });
    expect(utanNyckel.status()).toBe(400);
    expect(((await utanNyckel.json()) as { error?: string }).error).toContain('Idempotency-Key');

    const trasigNyckel = await postConfirm(request, config, jwt, {
      registrationIds: [ARBETSKO_EXPECTED.bekraftadId],
      idempotencyKey: 'inte-en-uuid',
    });
    expect(trasigNyckel.status()).toBe(400);
    expect(((await trasigNyckel.json()) as { error?: string }).error).toContain('UUID');
  });

  test('OKÄNT ID: 404 (aldrig 500, aldrig tyst överhoppning)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postConfirm(request, config, jwt, {
      registrationIds: [OKANT_REC_ID],
      idempotencyKey: VALID_JOB_ID,
    });
    expect(res.status()).toBe(404);
    expect(((await res.json()) as { error?: string }).error).toContain(OKANT_REC_ID);
  });

  test('GATE-LIVENESS + ATOMICITET (AC #1): icke-test-adress → 422 och anmälan står ORÖRD', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await findSeededEventId(request, config, jwt);

    // Eget sentinel-record — ADR-060-purgen städar det (create-registration-targeten).
    const registrationId = await createSentinelRegistration(request, config, jwt, eventId);

    const fore = await readRegistration(request, config, jwt, eventId, registrationId);
    expect(fore.status).toBe('Obekräftad');

    const res = await postConfirm(request, config, jwt, {
      registrationIds: [registrationId],
      idempotencyKey: randomUUID(),
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(422);
    const body = JSON.parse(raw) as { code?: string; offending?: string[] };
    expect(body.code).toBe('non_prod_address_refused');
    expect(body.offending?.length).toBe(1);

    // ATOMICITETENS NEGATIVA GREN: inget mail ⇒ ingen flip, ingen tidsstämpel.
    const efter = await readRegistration(request, config, jwt, eventId, registrationId);
    expect(efter.status).toBe('Obekräftad');
    expect(efter.bekraftelseSkickad ?? null).toBeNull();
  });

  test('IDEMPOTENS: redan bekräftad anmälan → 200 skipped/already_confirmed (noll skrivning)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postConfirm(request, config, jwt, {
      registrationIds: [ARBETSKO_EXPECTED.bekraftadId],
      idempotencyKey: randomUUID(),
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const body = JSON.parse(raw) as {
      status: string;
      attempted: number;
      confirmed: string[];
      skipped: { registrationId: string; reason: string }[];
      bekraftelseSkickad: string | null;
    };
    expect(body.status).toBe('skipped');
    expect(body.attempted).toBe(0);
    expect(body.confirmed).toEqual([]);
    expect(body.skipped).toEqual([
      { registrationId: ARBETSKO_EXPECTED.bekraftadId, reason: 'already_confirmed' },
    ]);
    // Ingenting skrevs — den seedade fixturens tidsstämpel står kvar orörd.
    expect(body.bekraftelseSkickad).toBeNull();
  });
});
