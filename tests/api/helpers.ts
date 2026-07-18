// Hjälpfunktioner för Edge Function API-tester.
//
// Tester skippas automatiskt om TEST_SUPABASE_URL saknas — så att
// `npm run test:visual` kan köras utan att API-testerna misslyckas
// p.g.a. saknad infrastruktur.
//
// Krav på env för att API-testerna ska köra:
//   TEST_SUPABASE_URL          — t.ex. https://<projekt>.supabase.co
//   TEST_SUPABASE_ANON_KEY     — anon-key (publik) för "anon-key → 401"
//   TEST_USER_EMAIL            — non-admin login för deny-tester
//   TEST_USER_PASSWORD         — lösenord för samma test-user
//   TEST_ADMIN_EMAIL           — admin login (på ADMIN_EMAILS-listan)
//   TEST_ADMIN_PASSWORD        — lösenord för samma test-admin
//
// Därtill (utanför skipvakten nedan — medvetet, TASK-11):
//   TEST_REGISTRATION_RECORD_ID — seed-ankaret för 6 write-slice-fall
//   (create-registration ×3, get-registrations väg D ×2, update-record ×1).
//   Vaktas av hårda expect:er i respektive fil, inte här: nyckeln är
//   6-falls-lokal — i skipvakten hade saknad nyckel skippat hela sviten
//   (290 friska tester). Raden finns i .env.test.example.
//
// Båda test-users måste finnas i staging-projektet. Skapa med
// supabase CLI eller via dashboard innan testerna körs.

import { readFile } from 'node:fs/promises';
import { type APIRequestContext, type APIResponse, test } from '@playwright/test';
import { assertTestSurfaceNotProd } from '../../src/lib/env-coherence';

// Persisterad api-token-artefakt (T24-b). api-setup-projektet loggar in EN gång
// per credential och skriver hit; api-staging-sviten läser härifrån i stället för
// att logga in per test (44 logins → 2) — eliminerar GoTrue-rate-limit-429-burst
// (T24). Idiomatisk Playwright "authenticate once in setup, reuse" (auth-doc).
// Samma gitignored .auth-katalog som e2e-storageState.
export const API_TOKENS_PATH = 'playwright/.auth/api-tokens.json';

interface ApiTokens {
  userJwt: string;
  adminJwt: string;
}

export interface ApiConfig {
  baseUrl: string;
  anonKey: string;
  userEmail: string;
  userPassword: string;
  adminEmail: string;
  adminPassword: string;
}

export function getApiConfig(): ApiConfig {
  const baseUrl = process.env.TEST_SUPABASE_URL;

  // ADR-061 Pelare 2 (keystone, yta B): kasta FÖRE någon Supabase-anslutning om
  // test-ytan pekar på prod-ref (T12). getApiConfig är den delade chokepoint:en —
  // auth.setup + varje staging-test anropar den för baseUrl före nätverk.
  if (baseUrl) {
    assertTestSurfaceNotProd(baseUrl);
  }

  const anonKey = process.env.TEST_SUPABASE_ANON_KEY;
  const userEmail = process.env.TEST_USER_EMAIL;
  const userPassword = process.env.TEST_USER_PASSWORD;
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;

  const missing = [
    !baseUrl && 'TEST_SUPABASE_URL',
    !anonKey && 'TEST_SUPABASE_ANON_KEY',
    !userEmail && 'TEST_USER_EMAIL',
    !userPassword && 'TEST_USER_PASSWORD',
    !adminEmail && 'TEST_ADMIN_EMAIL',
    !adminPassword && 'TEST_ADMIN_PASSWORD',
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    const skipReason = `API-staging-tester kräver ${missing.join(', ')} i env (saknas: ${missing.length} av 6).`;

    // STAGING_REQUIRED=1 → hard-fail istället för tyst skip.
    // Sätts av CI på api-staging-stepet för att eliminera falsk-grön signal.
    // Lokal dev utan .env.test laddad → tyst skip (dev-ergonomi behålls).
    if (process.env.STAGING_REQUIRED === '1') {
      throw new Error(
        `STAGING_REQUIRED=1 men staging-env är ofullständig. ${skipReason}\n\n` +
          `I CI: verifiera att alla 6 TEST_*-secrets är satta i repo-settings ` +
          `(Settings → Secrets and variables → Actions) och att api-staging-stepet ` +
          `injicerar dem via env:-block. Lokalt: ladda .env.test före npm run test:api:staging ` +
          `(set -a; . ./.env.test; set +a).`,
      );
    }

    test.skip(true, skipReason);
  }

  return {
    baseUrl: baseUrl ?? '',
    anonKey: anonKey ?? '',
    userEmail: userEmail ?? '',
    userPassword: userPassword ?? '',
    adminEmail: adminEmail ?? '',
    adminPassword: adminPassword ?? '',
  };
}

// Generell login-helper. Loggar in via Supabase Auth REST API och
// returnerar access_token (= en giltig user-JWT). Exporterad så api-setup-
// projektet (tests/api/auth.setup.ts) kan göra de TVÅ enda login-anropen per
// körning (user + admin); svit-testerna loggar INTE in själva längre (T24-b).
export async function loginUser(
  request: APIRequestContext,
  baseUrl: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${baseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    data: { email, password },
  });

  if (!res.ok()) {
    throw new Error(`Login failed for ${email}: ${res.status()} ${await res.text()}`);
  }

  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) {
    throw new Error(`Login returned no access_token for ${email}`);
  }
  return body.access_token;
}

// Cachad token-läsning (per worker): läser den persisterade artefakten EN gång
// per process och återanvänder. INGA login-anrop här — api-setup-projektet har
// redan gjort dem (T24-b). Cross-worker-säkert: filen skrevs av setup-projektet
// före api-staging kör (dependency), varje worker läser samma fil.
let cachedTokens: ApiTokens | null = null;

async function readApiTokens(): Promise<ApiTokens> {
  if (!cachedTokens) {
    const raw = await readFile(API_TOKENS_PATH, 'utf-8');
    cachedTokens = JSON.parse(raw) as ApiTokens;
  }
  return cachedTokens;
}

// Returnerar non-admin test-user-JWT (TEST_USER_*) ur den persisterade artefakten.
// Signaturen `(request, config)` bevaras så de ~43 call-sites är orörda; params
// används ej längre (login skedde i api-setup) → `_`-prefix.
export async function getValidUserJWT(
  _request: APIRequestContext,
  _config: ApiConfig,
): Promise<string> {
  return (await readApiTokens()).userJwt;
}

// Returnerar admin test-user-JWT (TEST_ADMIN_*) ur den persisterade artefakten.
// Admin måste finnas i staging ADMIN_EMAILS-secret för att create-admin-user ska
// godkänna calleren. Signatur bevarad (se getValidUserJWT).
export async function getValidAdminUserJWT(
  _request: APIRequestContext,
  _config: ApiConfig,
): Promise<string> {
  return (await readApiTokens()).adminJwt;
}

// En klart ogiltig JWT — 3 segment med base64url, men signaturen är
// nonsens. Supabase auth.getUser() returnerar AuthError + null user.
export const INVALID_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpbnZhbGlkIn0.invalidsignature123';

export interface UnauthorizedClassification {
  source: 'gateway' | 'requireUser';
  body: unknown;
}

// Atomärt verifierar att en response är ett legitimt 401-deny.
//
// Krav som måste alla uppfyllas, annars throw med faktisk status +
// body-snippet i felmeddelandet (så future regression syns i test-output):
//   1. response.status() === 401 (inte 200, inte 403, inte 500)
//   2. body är JSON som matchar ANTINGEN
//        gateway-format       — { code: 'UNAUTHORIZED_*', message: ... }
//      ELLER
//        requireUser-format   — { error: '<non-empty string>' }
//      Tom body, godtycklig JSON eller "ser ut som ett fel" → throw.
//
// Returnerar { source, body } så caller kan göra extra body-checks
// (t.ex. regex på error-message i anon-key-testet) utan double-fetch
// (Playwright APIResponse.json() kan bara läsas en gång).
//
// Designnot: båda formaten är legitima 401-vägar — gateway fångar
// saknad/ogiltig JWT (verify_jwt=true), requireUser fångar anon-key
// (anon-key passerar gateway eftersom det ÄR ett valid JWT). När
// verify_jwt=false sätts på en funktion (t.ex. test-auth) börjar
// requireUser-format dyka upp för alla paths.
export async function classify401Body(response: APIResponse): Promise<UnauthorizedClassification> {
  const status = response.status();
  if (status !== 401) {
    const text = await response.text();
    throw new Error(
      `classify401Body: förväntade status 401, fick ${status}. Body-snippet: ${text.slice(0, 200)}`,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (parseError) {
    const text = await response.text().catch(() => '<unreadable>');
    throw new Error(
      `classify401Body: 401-response hade icke-JSON body. Body-snippet: ${text.slice(0, 200)}. Parse-fel: ${(parseError as Error).message}`,
    );
  }

  const b = body as { error?: string; code?: string; message?: string };

  if (typeof b.code === 'string' && b.code.startsWith('UNAUTHORIZED_')) {
    return { source: 'gateway', body };
  }
  if (typeof b.error === 'string' && b.error.length > 0) {
    return { source: 'requireUser', body };
  }

  throw new Error(
    `classify401Body: 401-body matchar varken gateway-format ({code:'UNAUTHORIZED_*',...}) eller requireUser-format ({error:'<non-empty>'}). Body-snippet: ${JSON.stringify(body).slice(0, 200)}`,
  );
}
