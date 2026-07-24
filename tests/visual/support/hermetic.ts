import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base } from '@playwright/test';
import { EVENTS_RESPONSE, FROZEN_NOW, REGISTRATIONS_RESPONSE } from './fixture-data';

export { expect } from '@playwright/test';

/**
 * Hermetisk test-ram för visuella regressionstester (task-36.7).
 *
 * Varje test i ramen kör i en förseglad värld: frusen klocka (AC 5), seedad
 * session (autentiserade vyer utan staging-login), pinnade typsnitt och
 * mockade EF-svar. ALLT nätverk utanför localhost blockeras — hermetiken är
 * inte en konvention utan en vakt: ett anrop som slinker förbi mockarna
 * abort:as synligt i stället för att tyst göra pixlarna miljöberoende.
 */

// supabase-js härleder lagringsnyckeln `sb-${hostname.split('.')[0]}-auth-token`
// — verifierad mot @supabase/supabase-js dist (defaultStorageKey, v2.110).
const AUTH_STORAGE_KEY = 'sb-visual-fixture-auth-token';

const ASSETS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets');

// CORS-huvuden för de mockade cross-origin-svaren (EF + typsnitt). Preflight
// besvaras explicit — Authorization/Content-Type i EF-anropen triggar OPTIONS.
const CORS_HEADERS = { 'access-control-allow-origin': '*' };
const PREFLIGHT_HEADERS = {
  ...CORS_HEADERS,
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

/** Base64url utan padding — JWT-segmentens form. */
function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/**
 * Fabricerad session i supabase-js lagrings-form. `getSession()` läser
 * localStorage utan server-validering (AuthProvider-kontraktet, K3) — en
 * syntaktiskt giltig JWT med utgång långt efter FROZEN_NOW ger inloggat läge
 * utan nätverk: ingen refresh hinner schemaläggas inom testets livstid.
 */
function buildSession() {
  const expiresAt = Math.floor(FROZEN_NOW.getTime() / 1000) + 24 * 60 * 60;
  const user = {
    id: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'lotta@visual-fixture.se',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { display_name: 'Lotta' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const accessToken = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: user.id, email: user.email, role: 'authenticated', exp: expiresAt }),
    'visual-fixture-signatur',
  ].join('.');
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 24 * 60 * 60,
    expires_at: expiresAt,
    refresh_token: 'visual-fixture-refresh',
    user,
  };
}

/** EF-namn → fruset svar. Växer per vy i steg 2 — en omockad EF svarar 501
 *  med namnet i klartext (synligt fel, aldrig tyst tom data). */
const EF_FIXTURES: Record<string, unknown> = {
  'get-events': EVENTS_RESPONSE,
  'get-registrations': REGISTRATIONS_RESPONSE,
};

export const test = base.extend({
  page: async ({ page }, use) => {
    // Frusen klocka (AC 5): Date/new Date() fixeras vid FROZEN_NOW; timers
    // löper vidare så React/TanStack beter sig normalt.
    await page.clock.setFixedTime(FROZEN_NOW);

    // Sessionen seedas FÖRE app-JS via init-script — appen vaknar inloggad.
    await page.addInitScript(
      ([key, session]) => {
        window.localStorage.setItem(key as string, JSON.stringify(session));
      },
      [AUTH_STORAGE_KEY, buildSession()] as const,
    );

    // Hermetik-vakten. Registreras FÖRST = prövas SIST (Playwright matchar
    // routes i omvänd registreringsordning): allt som ingen mock nedan
    // fångade och inte är localhost blockeras hörbart.
    await page.route('**/*', (route) => {
      const { hostname } = new URL(route.request().url());
      if (hostname === 'localhost' || hostname === '127.0.0.1') return route.fallback();
      return route.abort('blockedbyclient');
    });

    // Typsnitts-pinning: base.css @import:ar Inter från Google Fonts — CDN:en
    // är både ett externt beroende och en drift-källa (ny font-version = nya
    // pixlar). CSS + woff2 (v20) är incheckade i assets/ och servas härifrån;
    // uppgraderas medvetet via kadens-regeln (AC 9), aldrig tyst av CDN:en.
    await page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({
        headers: CORS_HEADERS,
        contentType: 'text/css',
        body: readFileSync(path.join(ASSETS_DIR, 'inter.css'), 'utf8'),
      }),
    );
    await page.route('https://fonts.gstatic.com/**', (route) => {
      const filnamn = path.basename(new URL(route.request().url()).pathname);
      return route.fulfill({
        headers: CORS_HEADERS,
        contentType: 'font/woff2',
        body: readFileSync(path.join(ASSETS_DIR, filnamn)),
      });
    });

    // EF-mockarna: samma svar-form som skarpa EF:er, parsas av samma zod-
    // scheman i adaptern. Host-agnostiskt mönster — pekar appen mot fel URL
    // syns det som utloggat läge (lagringsnyckeln matchar inte), inte som
    // tyst staging-trafik.
    await page.route('**/functions/v1/**', (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: PREFLIGHT_HEADERS });
      }
      const efNamn =
        new URL(route.request().url()).pathname.split('/functions/v1/')[1] ?? '(okänd)';
      const svar = EF_FIXTURES[efNamn];
      if (svar === undefined) {
        return route.fulfill({
          status: 501,
          headers: CORS_HEADERS,
          json: { error: `Omockad EF i visual-fixturvärlden: ${efNamn}` },
        });
      }
      return route.fulfill({ headers: CORS_HEADERS, json: svar });
    });

    await use(page);
  },
});
