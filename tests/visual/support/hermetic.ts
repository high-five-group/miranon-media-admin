import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineNetworkFixture, type NetworkFixture } from '@msw/playwright';
import { test as base } from '@playwright/test';
import { FROZEN_NOW, VISUAL_SUPABASE_URL } from './fixture-data';
import { handlers } from './handlers';

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

// CORS-huvud för de mockade cross-origin-typsnitten. EF-svarens CORS bor hos
// handlers-modulen sedan task-54.1.
const CORS_HEADERS = { 'access-control-allow-origin': '*' };

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

/**
 * EF-lagret bärs av MSW sedan task-54.1 — handlers bor i `handlers.ts`.
 *
 * Registreringen sker på CONTEXT-nivå (bibliotekets design: en enda
 * `context.route` under huven, ingen service worker inblandad). Page-routes
 * vinner över context-routes, vilket är precis vad typsnitts-pinningen nedan
 * utnyttjar — den ligger kvar på sid-nivå och når därför MSW aldrig.
 *
 * `skipAssetRequests` står därför på sitt defaultvärde `true`. VILLKORET FÖR
 * ATT DET ÄR SÄKERT ÄR SID-VAKTEN NEDAN: den abort:ar allt utom localhost och
 * fixtur-originets EF-path, så ingen tillgångs-formad trafik kan nå
 * context-nivån där optionen skulle kortsluta den. Att i stället sätta `false`
 * hade kostat omkring 3x körtid (msw/playwright issue #13) utan vinst.
 *
 * ⚠️ OMPRÖVAS I TASK-54.2. Den skivan flyttar vakten till MSW:s
 * `onUnhandledRequest` — en callback som `skipAssetRequests: true` kör FÖRE.
 * Faller sid-vakten bort utan att optionen omprövas blir defaultvärdet exakt
 * det tysta genomsläpp ADR-080 varnar för. Villkoret ovan är alltså inte
 * evigt; det hänger på att något abort:ar först.
 *
 * `onUnhandledRequest` sätts INTE här — hermetiken vaktas alltjämt av
 * catch-all-routen nedan. Vaktens ombyggnad till MSW:s callback är task-54.2,
 * och den har eget rött-först-krav eftersom bibliotekets default är TYST
 * genomsläpp.
 */
export const test = base.extend<{ network: NetworkFixture }>({
  network: [
    async ({ context }, use) => {
      const network = defineNetworkFixture({ context, handlers });
      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],

  // `network` deklareras som beroende — utan det är aktiveringsordningen
  // odefinierad och sidan kan hinna göra sitt första anrop innan handlers står.
  page: async ({ page, network: _network }, use) => {
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
    //
    // EF-undantaget (task-54.1): MSW registrerar sig på CONTEXT-nivå, och
    // SAMTLIGA page-routes prövas före context-routes. Utan detta undantag
    // skulle vakten alltså abort:a EF-anropen innan MSW någonsin ser dem —
    // verifierat med ett minimalt route-precedenstest före bytet, inte antaget.
    // `fallback()` når context-nivån (samma test), så MSW får trafiken.
    // Vaktens FORM är oförändrad; ombyggnaden till MSW:s egen callback är
    // task-54.2.
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.fallback();
      // Snävt: exakt fixtur-originet OCH pathens början. En bredare form
      // (t.ex. substring-match på valfri host) skulle släppa igenom en
      // tillgångs-formad URL till context-nivån, där MSW:s
      // `skipAssetRequests`-default kortsluter den och låter den gå ut på
      // riktiga nätet — tyst. Vakten ska hålla mot det som inte finns än.
      if (url.origin === VISUAL_SUPABASE_URL && url.pathname.startsWith('/functions/v1/')) {
        return route.fallback();
      }
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

    // EF-lagret ligger hos MSW (se `network`-fixturen ovan) — ingen
    // route-registrering behövs här.

    await use(page);
  },
});
