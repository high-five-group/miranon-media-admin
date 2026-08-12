// activity_log — RLS-bevis mot skarp staging (TASK-201.2, deny-triple-andan
// anpassad till en RÅ POSTGRES-TABELL i stället för en Edge Function).
//
// activity_log har INGEN Edge Function framför sig ännu (skrivvägen,
// TASK-201.3s recordActivity, är en senare skiva) — testerna anropar
// PostgREST (`/rest/v1/activity_log`) DIREKT, samma väg en framtida
// service_role-EF eller en felkonfigurerad klient skulle använda.
//
// Bevisar mot SKARP staging (RLS + explicit GRANT tillsammans, se
// supabase/migrations/20260811211759_create_activity_log.sql +
// supabase/migrations/20260812143131_grant_service_role_activity_log.sql):
//   1. anon: läsning nekas (401, Postgres 42501 permission denied — GRANT-lagret,
//      inte RLS-policy-evaluering, se migrationens kommentar för varför).
//   2. anon: skrivning nekas (401, samma orsak).
//   3. authenticated (giltig user-JWT): läsning nekas (403 — annan HTTP-status än
//      anon eftersom PostgREST skiljer "ingen identitet" (401) från
//      "identitet men saknar rättighet" (403), men samma Postgres-felkod 42501).
//   4. authenticated: skrivning nekas (403, samma orsak).
//
// VAD DENNA FIL INTE TÄCKER (medvetet, källmärkt gap): service_role-halvan
// ("write via service-role ska gå igenom" + "UPDATE/DELETE nekas — append-only")
// kräver SUPABASE_SERVICE_ROLE_KEY, som INTE är en CI-secret (verifierat:
// `gh secret list` bär inga SERVICE_ROLE-poster — samma gap
// docs/research/task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md redan
// dokumenterade för invite-user-flödet). Utöver secret-gapet gör bordets
// MEDVETNA append-only-grant (service_role har bara SELECT+INSERT, aldrig
// DELETE — se grant-migrationens kommentar) ett rutinmässigt CI-committat
// insert-test direkt SKADLIGT: varje körning skulle lämna en permanent rad i
// staging som INGEN service_role-nyckel kan städa bort igen (bara en
// `postgres`-nivå-åtgärd, t.ex. `supabase db query --linked`, kan). Den halvan
// är därför verifierad som en LIVE, engångskörd, manuellt städad probe —
// samma "hämta engångs, kör, kasta"-mönster som
// scripts/provision-attachments-bucket.mjs och task-127-9 redan etablerat —
// dokumenterad med exakta kommandon/utfall i supabase/migrations/README.md
// och backlog-kortets Implementation Notes, inte som ett committat testfall.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, expect, test } from '@playwright/test';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const TABLE_PATH = '/rest/v1/activity_log';

interface PostgrestErrorBody {
  code?: string;
  message?: string;
}

// En strukturellt giltig (om än påhittad) rad — permission-nekandet sker i
// Postgres GRANT/RLS-lagret INNAN någon kolumn-/typvalidering, så exakt
// innehåll spelar ingen roll för deny-halvan. Unikt `id` per anrop (aldrig
// samma två gånger) så ett eventuellt regression-brott (permission börjar
// oväntat SLÄPPA igenom) inte råkar krocka på en primary key och maskeras
// som "409 conflict" i stället för det verkliga "200/201 skulle aldrig ha
// hänt"-felet.
function denyProbeRow(): Record<string, unknown> {
  const id = randomUUID();
  const now = new Date().toISOString();
  return {
    id,
    actor_name: 'RLS-deny-probe',
    actor_account_name: '00000000-0000-0000-0000-000000000000',
    verb_id: 'https://admin.miranon.dev/xapi/verbs/probed',
    verb_display: 'undersökte (deny-probe, ska aldrig lyckas)',
    object_id: 'https://admin.miranon.dev/xapi/objects/rls-deny-probe',
    object_type: 'https://admin.miranon.dev/xapi/activity-types/probe',
    object_name: 'RLS-deny-probe',
    request_id: randomUUID(),
    occurred_at: now,
    statement: { id, note: 'RLS-deny-probe — ska aldrig nå tabellen' },
  };
}

async function assertPermissionDenied(
  res: { status: () => number; json: () => Promise<unknown> },
  expectedStatus: number,
): Promise<void> {
  expect(res.status(), `förväntade ${expectedStatus} (permission denied)`).toBe(expectedStatus);
  const body = (await res.json()) as PostgrestErrorBody;
  // 42501 = Postgres "insufficient_privilege" — samma kod oavsett om orsaken är
  // RLS-policy-evaluering eller ett rent GRANT-nekande (se filhuvudet).
  expect(body.code, `Postgres-felkod 42501, fick body: ${JSON.stringify(body)}`).toBe('42501');
  expect(body.message).toMatch(/permission denied for table activity_log/);
}

function restUrl(config: ApiConfig, query = '?select=*&limit=1'): string {
  return `${config.baseUrl}${TABLE_PATH}${query}`;
}

test.describe('activity_log RLS — deny-halva (anon + authenticated)', () => {
  test('anon: läsning nekas (401)', async ({ request }: { request: APIRequestContext }) => {
    const config = getApiConfig();
    const res = await request.get(restUrl(config), {
      headers: { apikey: config.anonKey },
    });
    await assertPermissionDenied(res, 401);
  });

  test('anon: skrivning nekas (401)', async ({ request }: { request: APIRequestContext }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${TABLE_PATH}`, {
      headers: { apikey: config.anonKey },
      data: denyProbeRow(),
    });
    await assertPermissionDenied(res, 401);
  });

  test('authenticated: läsning nekas (403)', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(restUrl(config), {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${jwt}` },
    });
    await assertPermissionDenied(res, 403);
  });

  test('authenticated: skrivning nekas (403)', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.post(`${config.baseUrl}${TABLE_PATH}`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${jwt}` },
      data: denyProbeRow(),
    });
    await assertPermissionDenied(res, 403);
  });
});
