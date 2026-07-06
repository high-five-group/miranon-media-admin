import { expect, type Request, test } from '@playwright/test';

/**
 * K3-arkitektur-verifikation via automatiserad regression-test.
 *
 * Sex tester verifierar K3.2/K3.3 + K3.5-arkitekturen end-to-end:
 *
 * Utloggat tillstånd (4 tester, override storageState till empty):
 * - Test 1: initial redirect / → /login
 * - Test 2: /login renderar form med a11y-attribut
 * - Test 4: direkt-nav till /hem (pathless _authenticated route) → /login?redirect=%2Fhem
 * - Test 5: **INGA functions/v1/*-anrop läcker före /login-redirect** (defense-in-depth —
 *   sessionsdok Del 5.0; pinne flyttad från inloggat /hem i Fas 6d, se testet)
 *
 * Autentiserat tillstånd (2 tester, använder storageState från auth.setup.ts):
 * - Test 3: /hem nås direkt
 * - Test 6: router.invalidate fungerar vid auth-state-byte (storage-clear → reload)
 *
 * **Disciplin (Kandidat 34 aldrig-läcka, K0åc.2-förlängning):**
 * TEST_USER_EMAIL/PASSWORD läses från process.env via auth.setup.ts. Tester
 * själva refererar ALDRIG credentials direkt — bara verifierar slutresultatet
 * av setup-flödet.
 *
 * **Spårbar disciplin för Fas 7 (per byggplan §4 + SECURITY-SPEC §6 + ADR-deferring):**
 * I dag körs dessa tester mot `npm run dev` (lokal Vite) via Playwright webServer-config.
 * När Fas 7 etablerar Vercel-deployment-pipeline ska samma test-suite kompletteras
 * att köra mot Vercel preview-URL via `PLAYWRIGHT_TEST_BASE_URL`-env i CI-steget.
 * Test 5 (INGA functions/v1-anrop) är arkitekturellt identisk i dev/prod —
 * defense-in-depth-skyddet beror inte på production-build. Per Marcus' beslut
 * (Session 5, post-K4.2) flyttas Vercel-aktivering INTE hit; den är Fas 7-arbete
 * per fas-disciplin-policy.
 */

// ===================================================================
// HARD-FAIL om TEST_USER-env saknas (defense-in-depth utöver auth.setup.ts).
// Matchar STAGING_REQUIRED-pattern från K0åc.2.
// ===================================================================

test.beforeAll(() => {
  if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
    throw new Error(
      'TEST_USER_EMAIL/TEST_USER_PASSWORD env vars required for K4.3 staging-tests. ' +
        'Same hard-fail pattern som auth.setup.ts.',
    );
  }
});

// ===================================================================
// UTLOGGAT TILLSTÅND (override storageState till empty)
// ===================================================================

test.describe('Utloggat tillstånd', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Test 1: / redirectar utloggad användare till /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1#login-heading')).toHaveText(/Logga in/i);
  });

  test('Test 2: /login renderar form med a11y-attribut', async ({ page }) => {
    await page.goto('/login');

    // Rubrik (id-baserad, aria-labelledby refererar till denna).
    await expect(page.locator('h1#login-heading')).toHaveText(/Logga in/i);

    // E-postadress-fält med label-input-koppling + autocomplete.
    const emailInput = page.locator('#login-email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    await expect(page.locator('label[for="login-email"]')).toHaveText(/E-postadress/i);

    // Lösenord-fält med label-input-koppling + autocomplete.
    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    await expect(page.locator('label[for="login-password"]')).toHaveText(/Lösenord/i);

    // Submit-knapp synlig och enabled initialt (inte isSubmitting).
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  test('Test 4: Direkt-nav till /hem utan session redirectar till /login med redirect-param', async ({
    page,
  }) => {
    // **Pathless layout-route-konvention:** `_authenticated`-prefix i filsystem
    // (src/routes/_authenticated/hem.tsx) syns INTE i URL — `_`-prefix är pathless.
    // Riktig URL är `/hem`.
    await page.goto('/hem');

    // URL ska vara /login med redirect=%2Fhem (URL-encoded).
    await expect(page).toHaveURL(/\/login\?redirect=%2Fhem/);
    await expect(page.locator('h1#login-heading')).toHaveText(/Logga in/i);
  });

  test('Test 5: oinloggad nav till /hem läcker INGA functions/v1/*-anrop före /login-redirect', async ({
    page,
  }) => {
    // **Arkitektur-kritiskt test.** Invariant (sessionsdok Del 5.0): UI faller
    // ALDRIG tillbaka på anon-key — `_authenticated.tsx` beforeLoad-guarden
    // redirectar en oautentiserad användare till /login FÖRE någon datafetch (Edge
    // Function-anrop) hinner ske. Brister guarden skulle EF-anrop läcka med
    // anon-key → detta test fångar den regressionen.
    //
    // **PINNE FLYTTAD (Fas 6d L1).** Assertionen låg tidigare på INLOGGAT /hem och
    // krävde noll EF-anrop — men det byggde på att /hem var en inert placeholder
    // ("K3-state: /hem utan datafetch"). Fas 6d gör inloggat /hem till en
    // datafetchande aggregeringsvy (get-registrations + get-events), så den
    // premissen är obsolet. Själva invarianten (anon-key-fallback-förbudet,
    // Del 5.0) står ORÖRD — bara regressions-testets kontext flyttar till sin sanna
    // plats: den OINLOGGADE vägen, där "guard FÖRE datafetch" är vad som faktiskt
    // skyddas. Knyter ihop med Test 4 (samma oinloggade redirect-väg).
    //
    // Defense-in-depth (klient-guard + server requireUser) är arkitekturellt
    // identiskt i dev/prod — testet körs mot npm run dev (webServer-config) utan att
    // förlora regression-värdet. Fas 7 kompletterar mot Vercel preview-URL.
    const functionsRequests: Request[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/functions/v1/')) {
        functionsRequests.push(request);
      }
    });

    await page.goto('/hem');

    // Guarden redirectar till /login FÖRE datafetch …
    await expect(page).toHaveURL(/\/login\?redirect=%2Fhem/);
    // … och INGET Edge Function-anrop fick ske på vägen (anon-key-fallback-förbudet).
    expect(functionsRequests).toHaveLength(0);
  });
});

// ===================================================================
// AUTENTISERAT TILLSTÅND (storageState från auth.setup.ts)
// ===================================================================

test.describe('Autentiserat tillstånd', () => {
  test('Test 3: Inloggad användare når /hem direkt', async ({ page }) => {
    // storageState från setup → vi är inloggade redan.
    await page.goto('/hem');
    await expect(page).toHaveURL(/\/hem$/);
    // /hem:s h1 är hälsningen (task-1.3 AC #6) — namn-delen miljöberoende.
    await expect(page.locator('h1')).toHaveText(/^Hej/);
  });

  test('Test 6: router.invalidate triggas vid auth-state-byte (logout via storage-clear)', async ({
    page,
    context,
  }) => {
    // K3.2 InnerApp-pattern + K3.5-fix: useEffect → router.invalidate() på BÅDA
    // auth.isAuthenticated OCH auth.isLoading. K3.5 löste race-condition där
    // initial isAuthenticated: false → settled false aldrig triggade invalidate.

    // Steg 1: bekräfta inloggat tillstånd.
    await page.goto('/hem');
    await expect(page).toHaveURL(/\/hem$/);

    // Steg 2: rensa Supabase session från storage (simulerar logout).
    // **Använd full clear()** — Supabase har flera storage-keys (PKCE code-verifier,
    // refresh-token-state) som inte alla `endsWith('-auth-token')`. Full clear() är
    // robustare för regression-test.
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Steg 3: trigga AuthProvider re-eval via reload. I praktisk användning triggar
    // Supabase signOut() → onAuthStateChange → setUser(null) → InnerApp useEffect →
    // router.invalidate(). Här simulerar vi end-result: routern måste se utloggat-state
    // och redirecta till /login (via _authenticated.tsx beforeLoad-guard).
    await page.reload();
    await expect(page).toHaveURL(/\/login/);
  });
});
