// Hjälpfunktioner för Edge Function API-tester.
//
// Tester skippas automatiskt om TEST_SUPABASE_URL saknas — så att
// `npm run test:visual` kan köras utan att API-testerna misslyckas
// p.g.a. saknad infrastruktur.
//
// Krav på env för att API-testerna ska köra:
//   TEST_SUPABASE_URL          — t.ex. https://<projekt>.supabase.co
//   TEST_SUPABASE_ANON_KEY     — anon-key (publik) för "anon-key → 401"
//   TEST_USER_EMAIL            — login för "giltig user-JWT → 200"
//   TEST_USER_PASSWORD         — lösenord för samma test-user
//
// Test-user måste finnas i staging-projektet. Skapa med
// supabase CLI eller via dashboard innan testerna körs.

import { type APIRequestContext, test } from '@playwright/test';

export interface ApiConfig {
  baseUrl: string;
  anonKey: string;
  userEmail: string;
  userPassword: string;
}

export function getApiConfig(): ApiConfig {
  const baseUrl = process.env.TEST_SUPABASE_URL;
  const anonKey = process.env.TEST_SUPABASE_ANON_KEY;
  const userEmail = process.env.TEST_USER_EMAIL;
  const userPassword = process.env.TEST_USER_PASSWORD;

  test.skip(
    !baseUrl || !anonKey || !userEmail || !userPassword,
    'API-tester kräver TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_USER_EMAIL och TEST_USER_PASSWORD i env.',
  );

  return {
    baseUrl: baseUrl ?? '',
    anonKey: anonKey ?? '',
    userEmail: userEmail ?? '',
    userPassword: userPassword ?? '',
  };
}

// Loggar in test-user via Supabase Auth REST API och returnerar
// access_token (= en giltig user-JWT).
export async function getValidUserJWT(
  request: APIRequestContext,
  config: ApiConfig,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
    },
    data: { email: config.userEmail, password: config.userPassword },
  });

  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  }

  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) {
    throw new Error('Login returned no access_token');
  }
  return body.access_token;
}

// En klart ogiltig JWT — 3 segment med base64url, men signaturen är
// nonsens. Supabase auth.getUser() returnerar AuthError + null user.
export const INVALID_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpbnZhbGlkIn0.invalidsignature123';

// Verifierar att en 401-response kommer antingen från Supabase Gateway
// (default verify_jwt=true fångar saknad/ogiltig JWT) eller från
// requireUser-helpern (fångar anon-key + alla andra fall).
//
// Båda är acceptabla 401-vägar — M2:s DoD säger "deny → 401", inte
// "deny → 401 från specifik plats". När M8 sätter verify_jwt=false på
// test-auth så börjar requireUser:s format dyka upp för alla paths.
//
// Returnerar 'gateway' eller 'requireUser' så testet vet vem som svarade.
export function classify401Body(body: unknown): 'gateway' | 'requireUser' {
  const b = body as { error?: string; code?: string; message?: string };
  if (b.code?.startsWith('UNAUTHORIZED_')) return 'gateway';
  if (typeof b.error === 'string' && b.error.length > 0) return 'requireUser';
  throw new Error(`Unexpected 401 body shape: ${JSON.stringify(body)}`);
}
