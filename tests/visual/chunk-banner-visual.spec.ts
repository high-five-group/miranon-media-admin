import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * ChunkBanner — visual-baslinje-FÖRBEREDELSE (TASK-285.9, AC #6).
 *
 * SPEC-FILEN FINNS, BASLINJEN TAS INTE HÄR — se `notis-visual.spec.ts`s
 * filhuvud för den fullständiga motiveringen (samma kort, samma regel,
 * samma `CONTRIBUTING.md` § Visuell regression-hänvisning): ingen
 * `-linux.png` checkas in av denna skiva. `s109-uppdateringsnotis-
 * konvergens/facit.json` § yta "chunk-banner" har för övrigt medvetet
 * `bilder: []` — ingen facit-bild låstes ens vid prototyp-konvergensen
 * (se manifestets egen `not`-text) — denna spec-fil är alltså den FÖRSTA
 * pixel-baslinje-förberedelsen för just denna yta, inte en omtagning.
 *
 * YTAN: "Sidan behöver laddas om" (`ChunkBanner`, TASK-285.5/285.8) på en
 * RIKTIG autentiserad sida (`/hem`) — komponenten lever bara i `AppShell`
 * (det inloggade skalet), monterad som FÖRSTA barn i `<main>` före sidans
 * egen `h1` (ADR-121 beslut 3).
 *
 * TRIGGERN: samma `vite:preloadError`-dispatch som
 * `app-chunk-laddningsfel.test.ts` och `hem.acceptance.test.ts`s
 * "Chunk-bannern — placering i skalet"-svit.
 */
test('chunk-banner — /hem, "Sidan behöver laddas om" synlig, före h1', async ({ page }) => {
  await page.goto('/hem');
  await expect(page.getByText('Lotta').first()).toBeVisible();

  await page.waitForFunction(
    () => {
      if (document.querySelector('[data-testid="app-reload-required-reload"]')) return true;
      window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
      return false;
    },
    undefined,
    { timeout: 15_000, polling: 50 },
  );
  await expect(page.locator('[data-testid="app-reload-required-banner"]')).toBeVisible();

  await expect(page).toHaveScreenshot('chunk-banner.png', { fullPage: true });
});
