import { expect, test } from '@playwright/test';

/**
 * Staging-preview-flödet (task-10 AC 2) — beviset att lokal browser-
 * verifiering mot staging fungerar via det BYGGDA flödet: staging-mode-bygge
 * → bundelgrind → `vite preview` på egen port/origin 4173.
 *
 * Körs ENDAST via `npm run test:preview:staging` (kedjan bygger + grindar
 * bundeln före serverstart; projektet `staging-preview` existerar bara under
 * PLAYWRIGHT_STAGING_PREVIEW=1 — se playwright.config.ts). Till skillnad från
 * e2e-sviten mockas INGA EF:er här: riktiga staging-anrop är själva beviset.
 * Assertions är därför data-oberoende (stagings faktiska records styr inte
 * utfallet) — de bevisar att inloggning + datainläsning LYCKAS, inte vad
 * datat innehåller.
 *
 * Skyddsräckena som bevisas (fälla 1+2+5 ur task-10):
 *   1. Bundeln pekar på staging (login 400-mot-prod-klassen stängd) —
 *      nätverksbeviset kräver staging-EF-svar och NOLL prod-försök.
 *   2. CORS-vägen för 4173 är öppen (preflight-403-klassen stängd) — utan
 *      den faller datainläsningen till felläge i stället för innehåll.
 *   5. SW-registreringen landar på preview-originet 4173 — aldrig på
 *      dev-originet 5173 (origin-separationen; MDN Service Worker API).
 *
 * Prod-guarden är defense-in-depth: skulle bundeln peka fel ABORTERAS varje
 * prod-anrop i browsern innan det lämnar maskinen, och räknaren gör försöken
 * asserterbara — falsifikations-passet (L273) kör exakt den vägen RÖTT mot
 * en prod-byggd dist.
 */

const STAGING_HOST = 'pqtshyierkdgwdnxuirz.supabase.co';
const PROD_HOST = 'lvjsfnphlauldxqlncpl.supabase.co';

test.describe('Staging-preview-flödet (task-10 AC 2)', () => {
  test('login + Hem-datainläsning mot staging på 4173 — nätverksbevis + SW-scope', async ({
    page,
    baseURL,
  }) => {
    // Riktigt nätverk (staging-EF:er + SW-install) → egen generös budget.
    test.setTimeout(90_000);

    // Prod-guarden: registreras FÖRE all navigation. Regex mot hela URL:en —
    // varje request mot prod-hosten aborteras och räknas.
    let prodForsok = 0;
    await page.route(new RegExp(PROD_HOST.replaceAll('.', '\\.')), async (route) => {
      prodForsok += 1;
      await route.abort();
    });

    // Nätverksbeviset samlas passivt: lyckade svar från staging-EF:erna.
    const stagingEfSvar: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes(`${STAGING_HOST}/functions/v1/`) && response.ok()) {
        stagingEfSvar.push(response.url());
      }
    });

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      throw new Error(
        'TEST_USER_EMAIL/TEST_USER_PASSWORD krävs — .env.test laddas av ' +
          'playwright.config.ts (task-10 AC 3); kontrollera att filen finns.',
      );
    }

    // Login i FÄRSK kontext (ingen storageState) — flödet är beviset.
    // Samma stabila selektorer som tests/e2e/auth.setup.ts.
    await page.goto('/login');
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(password);
    await Promise.all([page.waitForURL('**/hem'), page.locator('button[type="submit"]').click()]);

    // Hem-datainläsningen: hälsningen renderar (session), laddlägena ersätts
    // av innehåll (role=status → 0 väntar ut EF-svaren) och ingen felyta
    // visas (role=alert = fetch-reject-symptomet ur fälla 2).
    await expect(page.getByRole('heading', { level: 1, name: /^Hej/ })).toBeVisible();
    await expect(page.locator('main#main').getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);

    // Nätverksbeviset: staging-EF-trafik skedde; prod försöktes ALDRIG.
    expect(stagingEfSvar.length, 'minst ett lyckat staging-EF-svar').toBeGreaterThan(0);
    expect(prodForsok, 'noll försök mot prod-hosten').toBe(0);

    // SW-ledet: preview-byggets SW-registrering landar på 4173-ORIGINET.
    // registerSW() körs vid boot (main.tsx) men installationen är asynkron →
    // poll. Scope-assertionen binder registreringen till preview-originet;
    // att 5173 är opåverkat följer mekaniskt av att en SW-registrering är
    // origin-bunden (task-10-notes bär resonemanget).
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            navigator.serviceWorker.getRegistration().then((r) => r?.scope ?? null),
          ),
        { timeout: 20_000, message: 'SW-registreringen ska landa på preview-originet' },
      )
      .toBe(`${baseURL}/`);
  });
});
