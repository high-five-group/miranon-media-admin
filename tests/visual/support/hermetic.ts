import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineNetworkFixture, type NetworkFixture } from '@msw/playwright';
import { test as base } from '@playwright/test';
import { FROZEN_NOW } from './fixture-data';
import { handlers } from './handlers';
import { skapaHermetikVakt } from './hermetik-vakt';

export { expect } from '@playwright/test';

/**
 * Hermetisk test-ram för visuella regressionstester (task-36.7).
 *
 * Varje test i ramen kör i en förseglad värld: frusen klocka (AC 5), seedad
 * session (autentiserade vyer utan staging-login), pinnade typsnitt och
 * mockade EF-svar. ALLT nätverk utanför localhost blockeras — hermetiken är
 * inte en konvention utan en vakt: ett anrop som slinker förbi mockarna FÄLLER
 * testet med sin egen URL namngiven, i stället för att tyst göra pixlarna
 * miljöberoende. Vakten bor i `hermetik-vakt.ts` (task-54.2).
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
 * Hermetiken vaktas av MSW:s `onUnhandledRequest` sedan task-54.2.
 *
 * Registreringen sker på CONTEXT-nivå (bibliotekets design: en enda
 * `context.route` under huven, ingen service worker inblandad). Page-routes
 * vinner över context-routes, vilket är precis vad typsnitts-pinningen nedan
 * utnyttjar — den ligger kvar på sid-nivå och når därför MSW aldrig.
 *
 * BÅDA OPTIONERNA ÄR SATTA EXPLICIT, OCH BÅDA MÅSTE VARA DET:
 *
 * `onUnhandledRequest` — bindningens default är `bypass` (tyst genomsläpp),
 * INTE `warn` som i MSW:s kärna. Utelämnas optionen är vakten avstängd utan
 * att något syns: sviten ser hermetisk ut medan den släpper igenom allt.
 * `hermetik-vakt.spec.ts` bevisar fällningen negativt — en avstängd vakt kan
 * inte se grön ut.
 *
 * `skipAssetRequests: false` — VILLKORET FÖR ATT VAKTEN SER ALLT. Bindningen
 * kortsluter tillgångs-formade anrop med `route.fallback()` FÖRE
 * `handleRequest` (`@msw/playwright` fixture.ts rad 98–103), alltså före
 * callbacken. Med defaultvärdet `true` skulle varje URL som slutar på .png,
 * .json, .css … gå rakt ut på nätet utan att vakten någonsin såg den. Mätt,
 * ej antaget: en probe med `.txt`-URL nådde aldrig callbacken och gick ut.
 *
 * Kostnaden mättes i stället för att ärvas från issue #13:s 3x-varning —
 * sviten gick 17,3 s med defaultvärdet och 14,9 s utan det, alltså ingen
 * mätbar kostnad i vår uppställning. Varningen gäller Vite-projekt med
 * betydligt fler moduler än fixturvärlden laddar.
 *
 * Sid-vakten som tidigare bar hermetiken (en `page.route('**' + '/*')` som
 * abort:ade allt utom localhost och EF-pathen) är BORTTAGEN i task-54.2:
 * hermetiken vaktas nu av EN mekanism, och den sitter där mockningen sker.
 */
export const test = base.extend<{ network: NetworkFixture }>({
  network: [
    async ({ context }, use) => {
      const network = defineNetworkFixture({
        context,
        handlers,
        skipAssetRequests: false,
        onUnhandledRequest: skapaHermetikVakt(handlers),
      });
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
