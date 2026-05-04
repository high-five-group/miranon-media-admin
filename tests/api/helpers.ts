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
