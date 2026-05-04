// M6 deny-path-tester för create-admin-user.
//
// Tre scenarier per Marcus DoD:
//   1. anon-key → 401 (gateway eller requireUser fångar — anon-key är
//      ett valid JWT så gateway släpper genom; requireUser fångar via
//      role-check). classify401Body hanterar båda format.
//   2. user utan admin-email → 403 (requireUser passerar, ADMIN_EMAILS-
//      check faller). Body: { error: 'Forbidden' }.
//   3. admin-email → 200 ELLER 4xx från senare validering (auth-gate
//      passerade — testet bekräftar att !=401 OCH !=403).
//
// Test 3 använder admin-email's egen email som "skapa"-target, vilket
// utlöser "User already registered" i Supabase admin.createUser. Det
// är medvetet — bevisar att gate passerades utan att skapa nya users
// per testkörning (inga test-databas-bivirkningar).

import { expect, test } from '@playwright/test';
import { classify401Body, getApiConfig, getValidAdminUserJWT, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/create-admin-user';

test.describe('create-admin-user — auth + admin-allowlist', () => {
  test('deny: anon-key → 401', async ({ request }) => {
    const config = getApiConfig();

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${config.anonKey}` },
      data: { email: 'foo@test.local', password: 'irrelevant' },
    });

    // Anon-key är valid JWT → gateway släpper genom → requireUser
    // fångar via role-check. classify401Body verifierar atomärt
    // status===401 + body matchar gateway- ELLER requireUser-format.
    await classify401Body(res);
  });

  test('deny: user utan admin-email → 403', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: { email: 'foo@test.local', password: 'irrelevant' },
    });

    // requireUser passerade (vi har giltig user-JWT). ADMIN_EMAILS-
    // check ska fånga och returnera 403 med generic body.
    expect(res.status()).toBe(403);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('Forbidden');
  });

  test('allow: admin-email → 200 (eller 4xx från Supabase user-exists)', async ({ request }) => {
    const config = getApiConfig();
    const adminJwt = await getValidAdminUserJWT(request, config);

    // Använder admin-email själv som target → Supabase admin.createUser
    // returnerar 4xx ("User already registered"). Det BEVISAR att
    // auth-gaten passerade (annars hade vi fått 401/403 innan vi
    // ens nådde admin.createUser).
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${adminJwt}` },
      data: { email: config.adminEmail, password: 'irrelevant-but-required' },
    });

    // Vi asserterar (!=401 && !=403 && <500) istället för == 200
    // medvetet: target-emailen är admin-userens egen email, så Supabase
    // admin.createUser returnerar 400 ("User already registered"). 400
    // bevisar att auth-gaten passerade — annars hade vi fått 401/403
    // innan vi ens nådde admin.createUser. Strikt == 200 skulle kräva
    // unik email per testkörning (test-databas-bivirkningar) eller
    // cleanup-step. 5xx skulle indikera bug i M6 och fångas separat.
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
    expect(res.status()).toBeLessThan(500);
  });
});
