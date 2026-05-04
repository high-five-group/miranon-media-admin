// M3 deny-path-tester för CORS origin-allowlist.
//
// Två scenarier per Marcus DoD:
//   1. tillåten origin → preflight OK + Access-Control-Allow-Origin
//      headern speglar request-origin
//   2. otillåten origin → preflight 403 (gateway-eller-helper-mönstret
//      gäller inte här — handleCors fattar beslutet före gateway)
//
// CORS skyddar bara browsers — non-browser-klienter (curl, Playwright
// API request context) skickar oftast ingen Origin-header. Det är
// medvetet inte testat här eftersom det är ett separat test-scenario
// (server-till-server) som BÖR fungera och bevisas av att alla
// befintliga 23 tester (som inte sätter Origin) fortfarande passerar.

import { expect, test } from '@playwright/test';
import { getApiConfig } from './helpers';

const ENDPOINT = '/functions/v1/test-auth'; // verify_jwt=false → CORS når oss
const ALLOWED_ORIGIN = 'http://localhost:5173'; // Per CORS_ALLOWED_ORIGINS i staging
const DISALLOWED_ORIGIN = 'https://evil.example.com';

test.describe('CORS origin-allowlist (M3)', () => {
  test('preflight: tillåten origin → 200 + Access-Control-Allow-Origin speglar', async ({
    request,
  }) => {
    const config = getApiConfig();

    const res = await request.fetch(`${config.baseUrl}${ENDPOINT}`, {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });

    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });

  test('preflight: otillåten origin → 403', async ({ request }) => {
    const config = getApiConfig();

    const res = await request.fetch(`${config.baseUrl}${ENDPOINT}`, {
      method: 'OPTIONS',
      headers: {
        Origin: DISALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });

    expect(res.status()).toBe(403);
    // Body ska vara JSON med felmeddelande, inte tomt
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
    // Allow-Origin ska INTE skickas tillbaka (annars är allowlisten meningslös)
    expect(res.headers()['access-control-allow-origin']).toBeUndefined();
  });
});
