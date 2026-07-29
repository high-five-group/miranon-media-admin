import { expect, test as setup } from '@playwright/test';
import { kravStagingLedigt } from '../support/staging-preflight';

/**
 * Auth setup-step. Loggar in TEST_USER en gång per testrun, sparar storageState
 * (cookies + localStorage med Supabase session-token) till playwright/.auth/user.json.
 *
 * Övriga test-projekt deklarerar `dependencies: ['setup']` i playwright.config.ts
 * + `use: { storageState: 'playwright/.auth/user.json' }` för att starta autentiserade.
 *
 * **Disciplin (Kandidat 34 aldrig-läcka, K0åc.2-förlängning):**
 * - TEST_USER_EMAIL/PASSWORD läses från process.env (.env.test lokalt, CI-secrets remote)
 * - INGA console.log av credentials
 * - Playwright maskerar input[type=password] i screenshots/videos by default
 * - playwright/.auth/user.json är .gitignored (innehåller tokens)
 *
 * **Hard-fail om env saknas** (matchar STAGING_REQUIRED-pattern från K0åc.2).
 */
const authFile = 'playwright/.auth/user.json';

setup('authenticate as TEST_USER', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL/TEST_USER_PASSWORD env vars required. Set in .env.test ' +
        '(local) or CI secrets (CI). K4.2 setup hard-fails to match STAGING_REQUIRED ' +
        'pattern from K0åc.2.',
    );
  }

  // TASK-77: EFTER creds-kontrollen ovan — saknas env är det felet som ska
  // synas, inte preflightens. Projektet är dependency för
  // chromium-authenticated, så hela e2e-sviten mot staging bär preflighten här.
  kravStagingLedigt('lokal Playwright-körning (e2e setup)');

  // Navigera till login. baseURL från playwright.config.ts (localhost:5173 lokalt,
  // staging-URL på CI via TEST_BASE_URL eller webServer-config).
  await page.goto('/login');

  // Fyll formuläret via stabila id-selektorer (samma som login.tsx a11y-pattern).
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);

  // Klicka submit + vänta på navigation till /hem (bekräftar lyckad auth).
  await Promise.all([page.waitForURL('**/hem'), page.locator('button[type="submit"]').click()]);

  // Verifiera att vi faktiskt nådde /hem (defense-in-depth — om login failar med
  // ovanligt redirect-mönster fångar detta vi det här).
  await expect(page).toHaveURL(/\/hem$/);

  // Spara session-state till disk för återanvändning.
  await page.context().storageState({ path: authFile });
});
