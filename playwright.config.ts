import { defineConfig, devices } from '@playwright/test';

// A11y-runnern kör mot en ALLTID-FÄRSK dev-server på dedikerad port
// (Session 15 K2-fynd: främmande server på 5173 återanvändes tyst av
// reuseExistingServer, och stale server-state gav falsk-grön).
// --strictPort failar högt vid upptagen port i stället för tyst port-byte;
// reuseExistingServer: false vägrar återanvända. Aktiveras via
// test:a11y-scriptets env-flagga så övriga projekts webServer-beteende
// är orört.
const A11Y_DEV_PORT = 5199;
const isA11yRun = process.env.PLAYWRIGHT_A11Y_DEV_SERVER === '1';

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
 * localhost:5173 (dev). webServer-config startar `npm run dev` lokalt vid behov.
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
  // webServer startar `npm run dev` lokalt om PLAYWRIGHT_TEST_BASE_URL inte är satt.
  // På CI med staging-deployment sätts PLAYWRIGHT_TEST_BASE_URL och webServer hoppas över.
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : isA11yRun
      ? {
          command: `npm run dev -- --port ${A11Y_DEV_PORT} --strictPort`,
          url: `http://localhost:${A11Y_DEV_PORT}`,
          reuseExistingServer: false,
          timeout: 60_000,
        }
      : {
          command: 'npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
  projects: [
    {
      name: 'setup',
      testDir: './tests/e2e',
      testMatch: /.*\.setup\.ts$/,
      use: {
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173',
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
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173',
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
          (isA11yRun ? `http://localhost:${A11Y_DEV_PORT}` : 'http://localhost:5173'),
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
  ],
});
