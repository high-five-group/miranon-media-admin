import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Ladda .env.test för LOKALA körningar (task-10 AC 3, officiella Playwright-
// mönstret playwright.dev/docs/test-parameterize). Tre verifierade egenskaper
// (körningsbevisade 2026-07-12) gör detta CI-säkert:
//   1. Saknad fil felar MJUKT (result.error = ENOENT, inget throw) — i CI
//      finns ingen .env.test och config-laddningen fortsätter oförändrad.
//   2. dotenv skriver ALDRIG över befintliga process.env-nycklar — CI:s
//      workflow-env (secrets) vinner alltid över filen.
//   3. Lokalt ersätter detta det gamla source-prefixet
//      (`set -a; source .env.test; set +a;`) — playwright-anrop fungerar
//      direkt. quiet: true håller testutdata ren (v17 loggar annars en
//      injektions-rad per körning).
// path förankras vid config-filen (import.meta.dirname, Node >= 20.11 —
// .nvmrc-golvet uppfyller det) så cwd-varianter inte tyst missar filen.
dotenv.config({ path: path.resolve(import.meta.dirname, '.env.test'), quiet: true });

// A11y-runnern kör mot en ALLTID-FÄRSK dev-server på dedikerad port
// (Session 15 K2-fynd: främmande server på 5173 återanvändes tyst av
// reuseExistingServer, och stale server-state gav falsk-grön).
// --strictPort failar högt vid upptagen port i stället för tyst port-byte;
// reuseExistingServer: false vägrar återanvända. Aktiveras via
// test:a11y-scriptets env-flagga så övriga projekts webServer-beteende
// är orört.
const A11Y_DEV_PORT = 5199;
const isA11yRun = process.env.PLAYWRIGHT_A11Y_DEV_SERVER === '1';

// E2E-dev-servern är PORTLÅST till 5173: staging-CORS_ALLOWED_ORIGINS tillåter
// exakt origin http://localhost:5173 (jfr tests/api/cors.staging.test.ts) — en
// dedikerad e2e-port à la a11y-mönstret hade CORS-blockerat appens staging-anrop
// (samma vägg som TASK-10:s preview-port 4173). Stale-server-skyddet (task-5;
// S61 batch 2: en 5 dagar gammal Vite-process med död fil-watcher serverade
// GAMMAL komponentkod → falsk-rött/falsk-grönt) bärs därför av
// reuseExistingServer: false + --strictPort på SAMMA port: ledig port → alltid
// färsk server (modulgraf ≡ disk vid start), upptagen port → hård vägran
// ("...is already used"), aldrig tyst återanvändning.
const E2E_DEV_PORT = 5173;

// Playwrights webServer är GLOBAL per config-fil — den startas/valideras för
// VARJE körning oavsett projekt-urval. API-projekten (api-pure/api-setup/
// api-staging) är serverfria: pure är rena enhetstester, setup+staging går via
// HTTP direkt mot Supabase (inga page.goto). test:api*-scripten sätter därför
// PLAYWRIGHT_NO_WEB_SERVER=1 (samma env-flagge-idiom som test:a11y) så
// webServer-blocket stängs av helt — utan flaggan hade task-5:s hårda vägran
// blockerat serverfria API-körningar varje gång 5173 bär en dev-server (och
// före task-5 slösade de en tyst reuse/serverstart).
const isServerFreeRun = process.env.PLAYWRIGHT_NO_WEB_SERVER === '1';

// Staging-preview-verifieringen (task-10): kör mot ett BYGGT staging-bygge
// servat av `vite preview` på EGEN port/origin 4173 — aldrig dev-originet 5173
// (fälla 5-klassen: en byggd app servad på dev-originet registrerar sin SW där
// och servar gammal bundle cache-first för evigt; origin-separationen är
// skyddet). 4173 är CORS-tillåten i staging-EF:ernas allowlist sedan
// S66-enabling-steget. Samma env-flagge-idiom som a11y/serverfritt ovan; utan
// flaggan existerar varken projektet eller webServer-grenen → plain-körningar
// (redan icke-stödda, TASK-6) och CI är opåverkade. Kanonisk kedja:
// `npm run test:preview:staging` (build:staging → bundelgrind → denna svit);
// runbook: docs/reference/staging-verifiering-runbook.md.
const PREVIEW_PORT = 4173;
const isPreviewRun = process.env.PLAYWRIGHT_STAGING_PREVIEW === '1';

/**
 * Playwright — visuella regressionstester + API-säkerhetstester + e2e auth-flow.
 *
 * Åtta projekt:
 *   - setup       → tests/e2e/*.setup.ts (auth-fixture, kör en gång per testrun)
 *   - api-pure    → tests/api/*.test.ts (pure-logik, ingen staging-koppling)
 *   - api-setup   → tests/api/*.setup.ts (T24-b: loggar in user+admin en gång; api-staging beror på det)
 *   - api-staging → tests/api/*.staging.test.ts (HTTP mot deployad Supabase)
 *   - chromium-authenticated → tests/e2e/*.staging.test.ts (e2e via storageState från setup)
 *   - a11y        → tests/a11y/ (axe-core mot /dev/primitives + /dev/patterns;
 *                   alltid-färsk dev-server på dedikerad port via test:a11y-
 *                   scriptets env-flagga — PLAYWRIGHT_TEST_BASE_URL lämnas osatt
 *                   även i CI per ADR-045 beslut 1, routerna är DEV-guardade ADR-044)
 *   - visual-*    → tests/visual/ (skärmdumpar, Fas 3+)
 *
 * KÖRFORM (TASK-6): plain `npx playwright test` (alla projekt i EN körning)
 * är ICKE-STÖDD. api-staging och chromium-authenticated saknar inbördes
 * dependency → de kör samtidigt, och e2e-flödena skriver mot samma
 * staging-poster som api-testernas idempotens-/409-/ordnings-assertions
 * läser → 6 deterministiska kollisioner (create-registration 89/129/160,
 * get-registrations väg D 86/132, update-record 92). Felklassa dem inte
 * som regressioner — kör de kanoniska sekventiella kommandona
 * (CONTRIBUTING.md § Testkörning). Projekt-dependencies som fix
 * förkastades: --project drar in dependencies transitivt → CI:s e2e-steg
 * hade svällt 148→259 tester och fallit på saknade admin-secrets
 * (beviskedjan i TASK-6-kortets notes; jfr ADR-073 beslut 3+4 som löser
 * kollisionsklassen utanför config-filen).
 *
 * api-staging-projektet kräver TEST_SUPABASE_URL satt. Saknas den →
 * testerna skippas i runtime (se tests/api/helpers.ts). api-pure körs
 * alltid utan staging-koppling.
 *
 * chromium-authenticated dependencies: ['setup'] — setup loggar in TEST_USER
 * och sparar storageState till playwright/.auth/user.json. Övriga e2e-tester
 * återanvänder via storageState-config. K4.2-disciplin per Kandidat 34
 * (aldrig-läcka): credentials läses från process.env, INTE hårdkodade.
 *
 * E2E-projektet använder PLAYWRIGHT_TEST_BASE_URL (CI/staging) eller default
 * localhost:5173 (dev; portlåst av staging-CORS — se E2E_DEV_PORT).
 * webServer-config startar en ALLTID-FÄRSK `npm run dev` lokalt vid behov;
 * upptagen port ⇒ hård vägran, aldrig tyst återanvändning (task-5).
 */
export default defineConfig({
  testDir: './tests',
  // ADR-061 Pelare 3 (T29): purga klartext-lösenord ur error-context.md efter
  // hela runnet (Playwrights page-snapshot listar input-värden, även för
  // type=password). Ren artefakt-efterbearbetning — rör ej testbeteende/a11y.
  globalTeardown: './tests/global-teardown.ts',
  snapshotPathTemplate: '{testDir}/visual/__screenshots__/{testFilePath}/{arg}{ext}',
  // T26: 0 lokalt (se flakes direkt) / 2 i CI (absorbera infra-brus utan
  // att maskera äkta fel — Playwright rapporterar flaky ≠ failed).
  retries: process.env.CI ? 2 : 0,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  use: {
    locale: 'sv-SE',
    timezoneId: 'Europe/Stockholm',
  },
  // webServer startar ALLTID-FÄRSK `npm run dev` lokalt om PLAYWRIGHT_TEST_BASE_URL
  // inte är satt (task-5): reuseExistingServer: false → en upptagen 5173 ger hård
  // vägran i stället för tyst återanvändning av potentiellt stale modulgraf —
  // stäng egen dev-server före lokal e2e-körning (dev-ergonomi-trade-offen,
  // öppet bokförd i task-5-kortets notes). Med PLAYWRIGHT_TEST_BASE_URL satt
  // hoppas webServer över.
  webServer:
    process.env.PLAYWRIGHT_TEST_BASE_URL || isServerFreeRun
      ? undefined
      : isPreviewRun
        ? {
            // Servar befintlig dist/ statiskt — bygget + bundelgrinden körs
            // FÖRE i test:preview:staging-kedjan (aldrig stale/fel-mode-
            // bundle, L272-klassen). --strictPort i scriptet: upptagen 4173
            // ⇒ hård vägran, aldrig tyst port-byte.
            command: 'npm run preview:staging',
            url: `http://localhost:${PREVIEW_PORT}`,
            reuseExistingServer: false,
            timeout: 60_000,
          }
        : isA11yRun
          ? {
              command: `npm run dev -- --port ${A11Y_DEV_PORT} --strictPort`,
              url: `http://localhost:${A11Y_DEV_PORT}`,
              reuseExistingServer: false,
              timeout: 60_000,
            }
          : {
              command: `npm run dev -- --port ${E2E_DEV_PORT} --strictPort`,
              url: `http://localhost:${E2E_DEV_PORT}`,
              reuseExistingServer: false,
              timeout: 60_000,
            },
  projects: [
    {
      name: 'setup',
      testDir: './tests/e2e',
      testMatch: /.*\.setup\.ts$/,
      use: {
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${E2E_DEV_PORT}`,
      },
    },
    {
      name: 'api-pure',
      testDir: './tests/api',
      // Ignorera även setup-filen — api-pure är creds-fria enhetstester (T24-b).
      testIgnore: ['**/*.staging.test.ts', '**/*.setup.ts'],
    },
    {
      // T24-b: loggar in user + admin EN gång och persisterar tokens; api-staging
      // beror på detta projekt → svit-testerna återanvänder tokens (44 logins → 2),
      // eliminerar GoTrue-429-burst. Idiomatisk Playwright setup-projekt + dependency.
      name: 'api-setup',
      testDir: './tests/api',
      testMatch: /.*\.setup\.ts$/,
    },
    {
      name: 'api-staging',
      testDir: './tests/api',
      testMatch: '**/*.staging.test.ts',
      dependencies: ['api-setup'],
      use: {
        baseURL: process.env.TEST_SUPABASE_URL,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
        },
      },
    },
    {
      name: 'chromium-authenticated',
      testDir: './tests/e2e',
      testMatch: '**/*.staging.test.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${E2E_DEV_PORT}`,
        storageState: 'playwright/.auth/user.json',
        // Kandidat 34 aldrig-läcka: maskera password-inputs i screenshots/videos/traces.
        // Playwright maskerar input[type=password] som standard → även debug-
        // artefakter (trace, screenshot, video) är credentials-fria.
        // T26: trace on-first-retry fångar trace exakt när en retry triggas →
        // diagnostik för Landning B (flaky-repro) utan att spara på varje run.
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
    {
      name: 'a11y',
      testDir: './tests/a11y',
      use: {
        ...devices['Desktop Chrome'],
        baseURL:
          process.env.PLAYWRIGHT_TEST_BASE_URL ||
          (isA11yRun ? `http://localhost:${A11Y_DEV_PORT}` : `http://localhost:${E2E_DEV_PORT}`),
      },
    },
    {
      name: 'visual-desktop',
      testDir: './tests/visual',
      use: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' },
    },
    {
      name: 'visual-mobile',
      testDir: './tests/visual',
      use: { viewport: { width: 375, height: 812 }, colorScheme: 'light' },
    },
    // Villkorat (task-10): existerar ENDAST under PLAYWRIGHT_STAGING_PREVIEW=1
    // så att plain `npx playwright test` och CI aldrig drar igång preview-
    // flödet — kanoniska anropet är `npm run test:preview:staging`. Ingen
    // storageState: login-flödet i färsk kontext ÄR en del av beviset.
    ...(isPreviewRun
      ? [
          {
            name: 'staging-preview',
            testDir: './tests/preview',
            use: {
              ...devices['Desktop Chrome'],
              baseURL: `http://localhost:${PREVIEW_PORT}`,
            },
          },
        ]
      : []),
  ],
});
