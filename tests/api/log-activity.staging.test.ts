// log-activity — skarp conformance mot deployad staging-EF (TASK-201.3
// AC #2/#3, ADR-110/ADR-111). Förebild: send-registration-confirmation.
// staging.test.ts (kontrakts-svit-formen) + confirm-registrations.test.ts
// (PRD TASK-201 § Testbeslut: "EF-kontrakten för write och läsning").
//
// DENNA SVIT INNEHÅLLER EN (1) SKARP SKRIVNING — en medveten, källmärkt
// avvikelse från `supabase/migrations/README.md`s regel "aldrig ett
// committat, rutinmässigt körande test som skriver via service_role,
// eftersom ett sådant test inte kan städa efter sig". Den regeln gäller
// `activity_log`s RLS/GRANT-PROBE (TASK-201.2s service-role-halva) — en
// permissions-fråga som inte förändras per commit och därför inte behöver
// bevisas på nytt varje CI-körning. AC #3 kräver något ANNAT: att
// requestId FAKTISKT propagerar klient → EF → activity_log-rad — och RLS
// nekar anon/authenticated all direkt tabell-läsning (`tests/api/
// activity-log-rls.staging.test.ts`), så EF:ens EGET svar (`{id, requestId,
// occurredAt}`) är den ENDA läsväg denna svit har. En mockad/simulerad
// "skrivning" hade bevisat noll om den verkliga insert-vägen. Statementet
// är därför AVSIKTLIGT TAGGAT (verb + objekt-namn nedan) så en framtida
// läsare/filter kan känna igen raden som en API-kontroll, inte en Lotta-
// åtgärd — och volymen är försumbar mot ADR-110s egen 20 000–70 000
// rader/år-uppskattning från verklig användning.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import {
  REQUEST_ID_EXTENSION_IRI,
  XAPI_IRI_BASE,
} from '../../src/domain/schemas/ActivityStatement.schema';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/log-activity';

/** `sub`-claimet ur en JWT (Supabase auth-användarens UUID) — ingen
 * signaturverifiering (testet litar redan på att JWT:n kom från
 * getValidUserJWT/en riktig inloggning); bara payload-avläsning. */
function decodeJwtSub(jwt: string): string {
  const parts = jwt.split('.');
  const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
  const payload = JSON.parse(payloadJson) as { sub?: unknown };
  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('JWT saknar ett giltigt sub-claim');
  }
  return payload.sub;
}

/** Ett komplett, giltigt xAPI-statement — samma profil-form som
 * `tests/api/activity-statement-schema.test.ts` § `activityStatement()`,
 * egen kopia (den filen är api-pure/schema-fokuserad, denna är
 * EF-kontrakts-fokuserad — olika syften, samma form). */
function validStatement(actorId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    actor: {
      objectType: 'Agent',
      name: 'API-testanvändare (skrivs över server-side)',
      account: { homePage: XAPI_IRI_BASE, name: actorId },
    },
    verb: {
      id: `${XAPI_IRI_BASE}/verbs/korde-api-kontroll`,
      display: { 'sv-SE': 'körde ett API-kontrolltest (TASK-201.3)' },
    },
    object: {
      objectType: 'Activity',
      id: `${XAPI_IRI_BASE}/objects/tests/log-activity-staging`,
      definition: {
        name: {
          'sv-SE':
            'log-activity API-kontrolltest — permanent testrad, raderas ej (se supabase/migrations/README.md)',
        },
        type: `${XAPI_IRI_BASE}/activity-types/api-kontroll`,
      },
    },
    context: { extensions: { [REQUEST_ID_EXTENSION_IRI]: randomUUID() } },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function post(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: unknown,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${ENDPOINT}`, { headers, data: body });
}

test.describe('log-activity — säkerhets-kontraktet', () => {
  test('anon (ingen Authorization-header): 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await post(
      request,
      config,
      undefined,
      validStatement('00000000-0000-4000-8000-000000000000'),
    );
    await classify401Body(res);
  });

  // MÄTT (röd-fas, denna skiva): GET UTAN JWT ger 401, inte 405 — gatewayen
  // (`verify_jwt = true`, config.toml) fångar saknad Authorization-header
  // FÖRE funktionens egen kod körs alls, oavsett metod. Metod-grinden i
  // index.ts är därför bara nåbar EFTER gatewayen släppt igenom en giltig
  // JWT — testet skickar en för att pröva RÄTT lager.
  test('GET med giltig JWT: 405 (funktionens egen metod-grind, efter gatewayen)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });
});

test.describe('log-activity — validering (AC #2): ogiltigt statement skrivs ALDRIG', () => {
  test('saknar actor: 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const stmt = validStatement(decodeJwtSub(jwt)) as Record<string, unknown>;
    delete stmt.actor;
    const res = await post(request, config, jwt, stmt);
    expect(res.status()).toBe(400);
  });

  test('verb.id är inte en giltig URL (IRI-kravet): 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const stmt = validStatement(decodeJwtSub(jwt), {
      verb: { id: 'inte-en-iri', display: { 'sv-SE': 'x' } },
    });
    const res = await post(request, config, jwt, stmt);
    expect(res.status()).toBe(400);
  });

  test('context.extensions saknar requestId-nyckeln: 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const stmt = validStatement(decodeJwtSub(jwt), { context: { extensions: {} } });
    const res = await post(request, config, jwt, stmt);
    expect(res.status()).toBe(400);
  });

  test('id är inte en UUID: 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const stmt = validStatement(decodeJwtSub(jwt), { id: 'inte-en-uuid' });
    const res = await post(request, config, jwt, stmt);
    expect(res.status()).toBe(400);
  });

  test('actor.account.name matchar INTE anroparen: 403 (identitetsbindningen — ingen kan logga aktivitet som någon annan)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const stmt = validStatement('11111111-1111-4111-8111-111111111111');
    const res = await post(request, config, jwt, stmt);
    expect(res.status()).toBe(403);
  });
});

test.describe('log-activity — requestId round-trip (AC #3, byggplanens DoD 3)', () => {
  test('giltigt statement från anroparen själv: 201, svaret ekar id + requestId — DEN ENDA SKARPA SKRIVNINGEN i denna svit (se filhuvud)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const actorId = decodeJwtSub(jwt);
    const stmt = validStatement(actorId);
    const sentRequestId = (stmt.context.extensions as Record<string, string>)[
      REQUEST_ID_EXTENSION_IRI
    ];

    const res = await post(request, config, jwt, stmt);
    expect(res.status()).toBe(201);

    const responseBody = (await res.json()) as {
      id?: string;
      requestId?: string;
      occurredAt?: string;
    };
    expect(responseBody.id).toBe(stmt.id);
    expect(responseBody.requestId).toBe(sentRequestId);
    expect(responseBody.occurredAt).toBe(stmt.timestamp);
  });
});
