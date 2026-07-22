import { expect, type Page } from '@playwright/test';

/**
 * Fristående inloggning för e2e-tester som gör SKARPA Edge Function-anrop.
 *
 * ## Varför den finns
 *
 * Nästan alla e2e-tester `page.route`-mockar sina EF-läsningar och bryr sig
 * därför aldrig om huruvida sessionen i `playwright/.auth/user.json` fortfarande
 * är giltig SERVER-SIDE. Ett test som läser skarpt gör det — `requireUser`
 * (supabase/functions/_shared/auth.ts) validerar token mot Supabase Auth och
 * svarar `401 {"error":"Invalid or expired token"}` när sessionen inte längre
 * håller.
 *
 * Den delade `storageState`-sessionen är inte robust under full svit: ~200
 * webbläsarkontexter hydreras ur SAMMA refresh-token, och rotationen gör att
 * de flesta förlorar kapplöpningen. Symptomet är osynligt för mockade tester
 * och slår ENBART mot den som läser skarpt. Empiriskt fångat 2026-07-22
 * (S75 batch 3, task-19.3): testet är grönt ensamt (10/10) och i liten
 * seriell delmängd (68/68), men rött i full parallell svit — identiskt i
 * CI och lokalt.
 *
 * Samma familj som T24-b:s GoTrue-429-burst i api-sviten, löst där genom ett
 * eget setup-projekt. Här räcker EN extra inloggning: testet får en helt egen,
 * färsk session som ingen annan kontext rör.
 *
 * ## Bruk
 *
 * ```ts
 * test.describe('… SKARPT mot staging', () => {
 *   test.use({ storageState: { cookies: [], origins: [] } });
 *   test.beforeEach(async ({ page }) => {
 *     await loggaInFristaende(page);
 *   });
 * });
 * ```
 *
 * ## Disciplin (Kandidat 34 aldrig-läcka)
 *
 * Credentials läses ur `process.env` — ALDRIG literaler i testfiler, ALDRIG
 * `console.log`. Playwright maskerar `input[type=password]` i screenshots,
 * videor och traces som standard. Samma hard-fail-mönster som
 * `tests/e2e/auth.setup.ts` när env saknas.
 */
export async function loggaInFristaende(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL/TEST_USER_PASSWORD env vars required. Set in .env.test ' +
        '(local) or CI secrets (CI). Samma hard-fail som auth.setup.ts.',
    );
  }

  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await Promise.all([page.waitForURL('**/hem'), page.locator('button[type="submit"]').click()]);
  await expect(page).toHaveURL(/\/hem$/);
}
