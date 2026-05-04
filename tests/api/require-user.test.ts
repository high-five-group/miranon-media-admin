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
import { getApiConfig, getValidUserJWT, INVALID_JWT } from './helpers';

const ENDPOINT = '/functions/v1/test-auth';

test.describe('requireUser — isolerad helper-test via test-auth', () => {
  test('deny: anonym (ingen Authorization-header) → 401', async ({ request }) => {
    const config = getApiConfig();

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`);

    expect(res.status()).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('Missing Authorization header');
  });

  test('deny: ogiltig JWT → 401', async ({ request }) => {
    const config = getApiConfig();

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${INVALID_JWT}` },
    });

    expect(res.status()).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('Invalid or expired token');
  });

  test('deny: anon-key (ej user-JWT) → 401', async ({ request }) => {
    const config = getApiConfig();

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${config.anonKey}` },
    });

    expect(res.status()).toBe(401);
    const body = (await res.json()) as { error?: string };
    // Antingen "Invalid or expired token" (om Supabase returnerar null user)
    // eller "Anon key not accepted as user identity" (om den returnerar en
    // user med role: 'anon'). Båda är giltiga 401-vägar.
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
