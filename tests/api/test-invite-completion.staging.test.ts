// Staging-tester för test-invite-completion (Väg A, docs/research/
// auth-invite-e2e-service-role-branschprecedent-2026-08-05.md § Rekommendation).
//
// Sex scenarier:
//   1. anon-key → 401 (classify401Body — gateway eller requireUser-format,
//      samma mönster som invite-user.staging.test.ts).
//   2. user utan admin-email → 403.
//   3. fel metod (GET) → 405 (RUNTIME-bevis — ef-metod-vakt.test.ts i
//      api-pure täcker INTE denna EF, den itererar bara
//      .prod-functions-allowlist.conf och test-invite-completion är
//      MEDVETET utelämnad därifrån, se EF:ens fil-header. Detta test är
//      alltså den enda vakten som faktiskt bevisar 405-formen för denna EF).
//   4. admin-email men adress utanför +e2e--mönstret → 403 (EF:ens
//      huvudsakliga härdning — se EF:ens fil-header § ADRESS-ALLOWLIST).
//      Target är TEST_ADMIN_EMAIL SJÄLV: en riktig, otaggad adminadress —
//      exakt den account-takeover-ytan spärren finns för att stänga.
//   5. admin-email men okänd/saknad action → 400.
//   6. allow: generate_link för en +e2e--taggad adress → action_link är en
//      riktig URL mot staging-projektet och bär ett token; delete_user river
//      den igen (AC "testet ska inte lämna rester i staging"). Ett sjunde
//      test bevisar att delete_user är idempotent för en adress som aldrig
//      skapades (samma no-op-kontrakt som teardown-anropet i test 6 hade
//      behövt om generate_link någonsin misslyckas efter att ha skapat
//      raden — se EF:ens fil-header § "EN ADRESS SOM INTE FINNS").
//
// Adressgenerering: `+e2e-<uuid>@h5gruppen.se` — samma plus-adress-
// konvention som den etablerade prod-smoke-identiteten
// (`marcus+ef-smoke@h5gruppen.se`, S84) men med ett EGET segment (`+e2e-`)
// och en unik UUID per test-körning, så parallella körningar aldrig
// kolliderar och aldrig kan förväxlas med prod-smoke-identiteten.
// `generateLink` skickar per Supabase-dokumentationen ALDRIG mail till
// mottagaren ("will not send links or OTPs to the end user") — domänvalet
// har alltså ingen leverans-konsekvens, adressen används enbart som en
// nyckel i auth.users.

import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { classify401Body, getApiConfig, getValidAdminUserJWT, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/test-invite-completion';

function freshTestEmail(): string {
  return `test-invite-completion+e2e-${randomUUID()}@h5gruppen.se`;
}

test.describe('test-invite-completion — staging-only testharness-EF (Väg A)', () => {
  test('deny: anon-key → 401', async ({ request }) => {
    const config = getApiConfig();

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${config.anonKey}` },
      data: { action: 'generate_link', email: freshTestEmail() },
    });

    await classify401Body(res);
  });

  test('deny: user utan admin-email → 403', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: { action: 'generate_link', email: freshTestEmail() },
    });

    expect(res.status()).toBe(403);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('Forbidden');
  });

  test('deny: fel metod (GET) → 405 före auth', async ({ request }) => {
    const config = getApiConfig();
    const adminJwt = await getValidAdminUserJWT(request, config);

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
    });

    expect(res.status()).toBe(405);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/Method not allowed/);
  });

  test('deny: admin-email men adress utanför +e2e--mönstret → 403 (adress-allowlist)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const adminJwt = await getValidAdminUserJWT(request, config);

    // Target = adminens EGEN, riktiga (otaggade) e-post — exakt den
    // account-takeover-ytan adress-allowlisten finns för att stänga (se
    // EF:ens fil-header). Om detta test någonsin ger 200 är härdningen
    // trasig.
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { action: 'generate_link', email: config.adminEmail },
    });

    expect(res.status()).toBe(403);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/test-address pattern/);
  });

  test('deny: admin-email men okänd/saknad action → 400', async ({ request }) => {
    const config = getApiConfig();
    const adminJwt = await getValidAdminUserJWT(request, config);

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { email: freshTestEmail() },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/action/);
  });

  test('allow: admin genererar länk för +e2e--adress, verifierar URL:en, river igen', async ({
    request,
  }) => {
    const config = getApiConfig();
    const adminJwt = await getValidAdminUserJWT(request, config);
    const email = freshTestEmail();

    const genRes = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { action: 'generate_link', email },
    });

    expect(genRes.status()).toBe(200);
    const genBody = (await genRes.json()) as { action_link?: string; hashed_token?: string };

    expect(genBody.action_link).toBeTruthy();
    const actionUrl = new URL(genBody.action_link as string);
    // Riktig URL mot STAGING-projektet (inte en fabricerad sträng) — samma
    // origin som TEST_SUPABASE_URL.
    expect(actionUrl.origin).toBe(new URL(config.baseUrl).origin);
    // Bär ett token (GoTrues action_link-format:
    // auth/v1/verify?type=invite&token=<hashed_token>&redirect_to=...).
    expect(actionUrl.searchParams.get('token')).toBeTruthy();
    expect(genBody.hashed_token).toBeTruthy();
    expect(actionUrl.searchParams.get('token')).toBe(genBody.hashed_token);

    // Riv testanvändaren igen — AC "testet ska inte lämna rester i
    // staging". Medvetet ingen try/catch: en misslyckad radering SKA fälla
    // testet, inte tystas.
    const delRes = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { action: 'delete_user', email },
    });

    expect(delRes.status()).toBe(200);
    const delBody = (await delRes.json()) as { deleted?: boolean };
    expect(delBody.deleted).toBe(true);
  });

  test('delete_user är idempotent för en adress som aldrig skapats → {deleted: false}', async ({
    request,
  }) => {
    const config = getApiConfig();
    const adminJwt = await getValidAdminUserJWT(request, config);
    const email = freshTestEmail(); // aldrig genererad/skapad i detta testet

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { action: 'delete_user', email },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { deleted?: boolean };
    expect(body.deleted).toBe(false);
  });
});
