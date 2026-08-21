import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * Uppdateringsnotisen — visual-baslinje-FÖRBEREDELSE (TASK-285.9, AC #6).
 *
 * SPEC-FILEN FINNS, BASLINJEN TAS INTE HÄR. Kortets egen instruktion:
 * "Visual-baslinjen för de nya ytorna FÖRBEREDS (spec-filer och fixturer)
 * men tas INTE här — den tas som regressionslås först efter Marcus
 * godkännande (ADR-103 B4), i rivnings-skivan." Samma regel upprepas i
 * `CONTRIBUTING.md` § Visuell regression: "Baselines föds i CI, aldrig
 * lokalt" — denna fil har DÄRFÖR ingen incheckad `-linux.png` under
 * `tests/visual/__screenshots__/`, och SKA inte få en förrän
 * `visual-baselines.yml` kör den (T87-aktiveringen) EFTER Marcus
 * godkännande av den promoverade formen.
 *
 * YTAN: samma "ny version av appen"-notis som `uppdateringsnotis-
 * promoverings-grind.test.ts` redan bevisar strukturellt (ariaSnapshot,
 * ADR-103 B4) — DENNA fil bevisar i stället PIXLARNA, på en RIKTIG
 * autentiserad sida (`/hem`, samma fixturvärld som `hem.spec.ts`), inte
 * `/dev/primitives`. `AppUpdateBanner` är monterad globalt (`__root.tsx`)
 * och syns därför på varenda route, /hem inkluderat.
 *
 * TRIGGERN: samma window-event som webblasarbeteende-syskonfilen
 * (`app-update-banner.test.ts`s `mm:app-uppdatering-tillganglig`) — ingen
 * ny mekanism uppfinns här.
 */
test('notis (Uppdateringsnotis) — /hem, "ny version av appen" synlig', async ({ page }) => {
  await page.goto('/hem');
  await expect(page.getByText('Lotta').first()).toBeVisible();

  await page.waitForFunction(
    () => {
      if (document.querySelector('[data-testid="app-update-reload"]')) return true;
      window.dispatchEvent(new CustomEvent('mm:app-uppdatering-tillganglig'));
      return false;
    },
    undefined,
    { timeout: 15_000, polling: 50 },
  );
  await expect(page.locator('[data-testid="app-update-reload"]')).toBeVisible();

  await expect(page).toHaveScreenshot('notis-uppdateringsnotis.png', { fullPage: true });
});
