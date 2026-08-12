// get-activity-log — kontrakt-conformance mot deployad staging-EF (TASK-201.5).
//
// ── MEDVETET VAL: KONTRAKT-MOT-TOM, INGEN SEEDAD FIXTUR ──────────────────────────
// Speglar `get-mail-log.staging.test.ts`s redan etablerade rationale rakt av,
// samma tre skäl:
//   1. `activity_log` är EMPIRISKT TOM vid denna skivas landning (TASK-201.1/
//      201.2 skapade tabellen men skrev ingen permanent rad; TASK-201.3/201.4,
//      skrivvägen, byggs PARALLELLT med denna skiva och kan ha landat NOLL
//      eller NÅGRA rader vid CI-körningstillfället — testerna nedan är
//      medvetet ROBUSTA mot BÅDA fallen, se "best-effort"-testerna längst ner).
//   2. Ingen `service_role`-nyckel finns i CI (samma gap
//      `supabase/migrations/README.md` redan dokumenterar för RLS-write-
//      halvan) — en CI-committad seed-och-städa-cykel är alltså strukturellt
//      omöjlig här, inte bara en stilval.
//   3. Att seeda syntetiska statements vore FALSK aktivitetshistorik i en logg
//      som ska spegla VERKLIGA Lotta/Roger/Marcus-åtgärder — samma "vi seedar
//      aldrig låtsas-utskick"-princip som get-mail-log's gate.
// Den fulla, MANUELLT seedade + städade verifieringen av paginerings-/filter-
// MEKANIKEN mot skarpa rader (keyset-sidbrytning, `category`-equality,
// `eventId`-`.contains()`, `from`/`to`-range, `requestId`-propagering) är
// dokumenterad separat, en gång, mot skarp staging — se
// `supabase/migrations/README.md` § "get-activity-log — läsvägens
// paginerings-/filterbevis" för exakta kommandon/utfall (samma
// "hämta-engångs-kör-kasta"-mönster som TASK-201.2:s service_role-halva,
// fast med `supabase db query --linked` (postgres-rollen) i stället för en
// `service_role`-nyckel, eftersom den senare vägen numera är explicit
// förbjuden för agenter, se uppdraget).
//
// Vad DENNA gate ÄRLIGT bevisar, oavsett tabellens faktiska radantal:
//   1. AUTH: anon (ingen JWT) → 401 (classify401Body-mönstret).
//   2. KONTRAKT: autentiserad GET → 200 + `{ statements: [...], nextCursor }`;
//      z.array(ActivityStatementSchema).parse(...) PASSERAR — bevisar
//      svarsformen OCH wrapper-nycklarna, oavsett om arrayen är tom eller ej.
//   3. CORS: tillåten origin speglas i Access-Control-Allow-Origin.
//   4. FILTERKONTRAKTET (AC #1): category/eventId/from/to accepteras var för
//      sig och kombinerat utan fel — 200, giltig form. Träffmängden kan vara
//      tom (ingen skriven rad matchar ännu); kontraktet är ändå bevisat.
//   5. VALIDERING: ogiltig cursor / ogiltigt from|to → 400 (klient-fel, aldrig
//      500 — servern validerar innan den frågar databasen).
//   6. pageSize klampas till [1, 100] — aldrig fler rader än taket, oavsett
//      hur många som faktiskt finns.
//   7. BEST-EFFORT-ORDNING: om ≥2 rader råkar finnas (skrivvägen kan redan
//      ha landat data när denna svit körs), är `occurred_at` monotont
//      icke-växande över sidan — annars trivialt sant (0/1 rader).
//
// Auth via getValidUserJWT → persisterad api-token-artefakt (T24-b). Lokalt
// skip:as sviten utan staging-creds; kontrakt-beviset körs i CI
// (STAGING_REQUIRED=1).

import { type APIRequestContext, expect, test } from '@playwright/test';
import { z } from 'zod';
import { ActivityStatementSchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

type ActivityStatement = z.infer<typeof ActivityStatementSchema>;

const ALLOWED_ORIGIN = 'http://localhost:5173'; // per CORS_ALLOWED_ORIGINS i staging

interface RawResult {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

async function callGetActivityLog(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  params: Record<string, string> = {},
  origin?: string,
): Promise<RawResult> {
  const url = new URL(`${config.baseUrl}/functions/v1/get-activity-log`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const headers: Record<string, string> = { Authorization: `Bearer ${jwt}` };
  if (origin) headers.Origin = origin;

  const res = await request.get(url.toString(), { headers });
  const body = res.status() === 204 ? undefined : await res.json().catch(() => undefined);
  return { status: res.status(), body, headers: res.headers() };
}

async function fetchActivityLog(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  params: Record<string, string> = {},
): Promise<{ statements: ActivityStatement[]; nextCursor: string | null }> {
  const { status, body } = await callGetActivityLog(request, config, jwt, params);
  expect(status, `get-activity-log ska svara 200 (params: ${JSON.stringify(params)})`).toBe(200);
  const b = body as { statements: unknown; nextCursor: string | null };
  // .parse() PÅ klienten: bevisar att EF-svaret matchar ActivityStatementSchema
  // (samma systemgräns-disciplin som fetchActivityLog i AirtableAdapter.ts).
  // Tom array parsar rent → schema-form + wrapper-nyckel verifierade även mot
  // en tom tabell.
  const statements = z.array(ActivityStatementSchema).parse(b.statements);
  return { statements, nextCursor: b.nextCursor };
}

test.describe('get-activity-log — kontrakt-conformance (TASK-201.5, tom-eller-okänd tabell)', () => {
  test('kontrakt: autentiserad GET utan params → 200 + { statements: [...], nextCursor }', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { statements, nextCursor } = await fetchActivityLog(request, config, jwt);
    expect(Array.isArray(statements), 'svaret ska bära en statements-array').toBe(true);
    expect(nextCursor === null || typeof nextCursor === 'string').toBe(true);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.get(`${config.baseUrl}/functions/v1/get-activity-log`);
    await classify401Body(res);
  });

  test('CORS: tillåten origin speglas i Access-Control-Allow-Origin', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, headers } = await callGetActivityLog(request, config, jwt, {}, ALLOWED_ORIGIN);
    expect(status).toBe(200);
    expect(headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });

  test.describe('filterkontraktet (AC #1) — category/eventId/from/to accepteras', () => {
    test('category ensamt → 200', async ({ request }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const { statements } = await fetchActivityLog(request, config, jwt, {
        category: 'https://admin.miranon.dev/xapi/activity-types/anmalan',
      });
      expect(Array.isArray(statements)).toBe(true);
    });

    test('eventId ensamt → 200', async ({ request }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const { statements } = await fetchActivityLog(request, config, jwt, {
        eventId: 'recDoesNotExist00000',
      });
      expect(Array.isArray(statements)).toBe(true);
    });

    test('from + to (ISO 8601) → 200', async ({ request }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const { statements } = await fetchActivityLog(request, config, jwt, {
        from: '2020-01-01T00:00:00.000Z',
        to: new Date().toISOString(),
      });
      expect(Array.isArray(statements)).toBe(true);
    });

    test('samtliga fyra filter kombinerade → 200', async ({ request }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const { statements } = await fetchActivityLog(request, config, jwt, {
        category: 'https://admin.miranon.dev/xapi/activity-types/anmalan',
        eventId: 'recDoesNotExist00000',
        from: '2020-01-01T00:00:00.000Z',
        to: new Date().toISOString(),
      });
      expect(Array.isArray(statements)).toBe(true);
    });
  });

  test.describe('validering — 400 på felformad indata, aldrig 500', () => {
    test('ogiltig cursor → 400', async ({ request }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const { status, body } = await callGetActivityLog(request, config, jwt, {
        cursor: 'not-a-valid-cursor-token',
      });
      expect(status).toBe(400);
      expect((body as { error?: string }).error).toBeTruthy();
    });

    test('cursor med injektionsförsök i occurredAt-halvan → 400 (ej 200/500)', async ({
      request,
    }) => {
      // Försvar-i-djupled-provet (se EF:ens filhuvud § parseCursorToken): en
      // handbyggd token vars occurredAt-del bär PostgREST-filtersträngens
      // metatecken ska aldrig nå .or()-anropet.
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const forged = Buffer.from(
        JSON.stringify({
          o: '2020-01-01T00:00:00Z,or(id.gt.0)|00000000-0000-0000-0000-000000000000',
        }),
      ).toString('base64');
      const { status } = await callGetActivityLog(request, config, jwt, { cursor: forged });
      expect(status).toBe(400);
    });

    test('ogiltigt "from" → 400', async ({ request }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const { status } = await callGetActivityLog(request, config, jwt, { from: 'not-a-date' });
      expect(status).toBe(400);
    });

    test('ogiltigt "to" → 400', async ({ request }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const { status } = await callGetActivityLog(request, config, jwt, { to: 'not-a-date' });
      expect(status).toBe(400);
    });
  });

  test('pageSize klampas till [1, 100] — aldrig fler rader än taket', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { statements } = await fetchActivityLog(request, config, jwt, { pageSize: '1000' });
    expect(statements.length).toBeLessThanOrEqual(100);
  });

  test('best-effort: occurred_at (statement.timestamp) monotont icke-växande över en sida', async ({
    request,
  }) => {
    // Trivialt sant mot 0 eller 1 rad — den skarpa ordnings-BEVISNINGEN
    // (mot flera KÄNDA seedade rader) är den manuella, dokumenterade
    // verifieringen (se filhuvudet). Detta är ett billigt, alltid-körbart
    // regressionsnät: BÖRJAR tabellen fyllas på (skrivvägen landar), fäller
    // detta testet omedelbart om ordningen någonsin bryts.
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { statements } = await fetchActivityLog(request, config, jwt, { pageSize: '20' });
    const timestamps = statements.map((s) => Date.parse(s.timestamp));
    for (let i = 1; i < timestamps.length; i++) {
      expect(
        timestamps[i],
        `rad ${i} (${statements[i].timestamp}) ska inte vara SENARE än rad ${i - 1} (${statements[i - 1].timestamp})`,
      ).toBeLessThanOrEqual(timestamps[i - 1]);
    }
  });
});
