// Isolerade deny-path-tester direkt mot requireUser-helpern via test-auth.
//
// Per M2:s utökade DoD (Marcus 2026-05-04): de tre deny-path-testerna
// (anonym/ogiltig/anon-key) ska köras direkt mot requireUser-helpern,
// inte bara mot M2:s wiring i datafunktionerna. Annars tappar vi
// helperns isolerade verifiering.
//
// test-auth (supabase/functions/test-auth/index.ts) är en minimal
// endpoint som anropar requireUser och returnerar { ok, userId } vid
// success, eller den 401 som requireUser producerar vid fel.

import { expect, test } from '@playwright/test';
import { classify401Body, getApiConfig, getValidUserJWT, INVALID_JWT } from './helpers';

const ENDPOINT = '/functions/v1/test-auth';

// Pre-M8: Supabase Gateway har verify_jwt=true som default. Det betyder
// att gateway:n fångar saknad header + ogiltig JWT INNAN requireUser
// körs — bodyn blir Supabase-format ({"code":"UNAUTHORIZED_*",...}).
// Anon-key släpps genom gateway (det ÄR ett valid JWT) och fångas av
// requireUser → bodyn blir requireUser-format ({"error":"..."}).
//
// När M8 sätter [functions.test-auth] verify_jwt = false börjar alla
// paths nå requireUser och bodies blir requireUser-format genomgående.
// Då kan dessa assertions strängare-checka bodyn.
//
// classify401Body() returnerar 'gateway' eller 'requireUser' så vi vet
// vem som svarade utan att testet bryts vid M8-cutoveren.

test.describe('requireUser — isolerad helper-test via test-auth', () => {
  test('deny: anonym (ingen Authorization-header) → 401', async ({ request }) => {
    const config = getApiConfig();

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`);

    expect(res.status()).toBe(401);
    const body = await res.json();
    classify401Body(body); // kastar om bodyformat oväntat
  });

  test('deny: ogiltig JWT → 401', async ({ request }) => {
    const config = getApiConfig();

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${INVALID_JWT}` },
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    classify401Body(body);
  });

  test('deny: anon-key (ej user-JWT) → 401', async ({ request }) => {
    const config = getApiConfig();

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${config.anonKey}` },
    });

    expect(res.status()).toBe(401);
    const body = (await res.json()) as { error?: string };
    // Anon-key är ett valid JWT (signerad av Supabase med role: anon) →
    // gateway släpper genom → requireUser fångar.
    // Antingen "Invalid or expired token" (om auth.getUser returnerar null
    // user) eller "Anon key not accepted as user identity" (om role-check
    // triggas). Båda är giltiga requireUser-svar.
    expect(classify401Body(body)).toBe('requireUser');
    expect(body.error).toMatch(
      /^(Invalid or expired token|Anon key not accepted as user identity)$/,
    );
  });

  test('allow: giltig user-JWT → 200', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok?: boolean; userId?: string };
    expect(body.ok).toBe(true);
    expect(body.userId).toBeTruthy();
  });
});
