import { expect, test } from './fixtures';

/**
 * SKAL-KONTRAKT: rännstenen överlever React Arias scroll-lås (review-våg 6,
 * Marcus-fångst 2026-07-23 på skapa-sidans väljare).
 *
 * ROTORSAKEN (källäst, react-aria/dist/private/overlays/usePreventScroll.mjs
 * rad 51–55): när en modal overlay öppnas (Select-popover, Dialog, Modal) kör
 * `preventScrollStandard()` och sätter INLINE på <html> — men ENDAST när
 * `window.innerWidth - documentElement.clientWidth > 0`, dvs. när scrollbaren
 * tar layoutplats (klassiska scrollbars):
 *
 *     document.documentElement.style.scrollbarGutter = 'stable'
 *     document.documentElement.style.overflow        = 'hidden'
 *
 * Vår skal-regel är `scrollbar-gutter: stable both-edges` (base.css) —
 * SYMMETRISK rännsten så att innehållet står stilla oavsett scrollbar.
 * React Arias inline-värde är den ENKELSIDIGA formen, och inline-deklarationer
 * slår vanlig author-CSS i kaskaden → vänsterrännstenen rivs i öppnings-
 * ögonblicket och hela sidan hoppar i sidled. Uppmätt före fixen: h1.x
 * 452 → 446,5 px (halva rännstensbredden; vänsterställt innehåll hoppar hela).
 * Detta är samma hopp-klass som Marcus vetade i review-våg 2 — men här via en
 * mekanism som RIVER den tidigare fixen, i varje select/popover/modal i appen.
 *
 * KONTRAKTSFORMEN (L-lärdomen ur review-våg 2, CI-overlay-scrollbars):
 * headless-chromium bär overlay-scrollbars → `innerWidth - clientWidth` är 0 →
 * React Aria tar ALDRIG gutter-grenen i CI, så ett test som bara öppnar en
 * riktig Select är strukturellt vakuöst här. Den CI-bevisbara formen är att
 * utföra React Arias EXAKTA två operationer och kräva att skal-regeln överlever
 * dem. `scrollbar-gutter` reserverar plats även med overlay-scrollbars, så
 * x-mätningen ÄR skarp i denna miljö (rött-först-belagt).
 */

const REACT_ARIA_LAS = `
  document.documentElement.style.scrollbarGutter = 'stable';
  document.documentElement.style.overflow = 'hidden';
`;

const SLAPP_LAS = `
  document.documentElement.style.scrollbarGutter = '';
  document.documentElement.style.overflow = '';
`;

test.describe('Skal-kontrakt — scroll-låset får inte riva rännstenen', () => {
  test('React Arias inline-lås besegrar INTE den symmetriska rännstenen (≥ sm)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 600 });

    const gutterFore = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarGutter,
    );
    expect(gutterFore).toBe('stable both-edges');

    await page.evaluate(REACT_ARIA_LAS);

    const gutterUnderLas = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarGutter,
    );
    expect(gutterUnderLas).toBe('stable both-edges');

    await page.evaluate(SLAPP_LAS);
  });

  test('innehållet står stilla när scroll-låset slår till (inget sidledshopp)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 600 });

    // .first(): sidans EGEN rubrik är alltid FÖRST i DOM-ordning — sedan
    // TASK-285.3 bär /dev/primitives ytterligare två h1-rubriker längre ner.
    const rubrik = page.getByRole('heading', { level: 1 }).first();
    const fore = await rubrik.boundingBox();

    await page.evaluate(REACT_ARIA_LAS);
    const under = await rubrik.boundingBox();

    // Halvpixel-toleransen (review-våg 5): udda containerbredd kan aldrig ge
    // exakt tal-identitet — kontraktet är visuell likhet, inte identitet.
    expect(Math.abs((under?.x ?? 0) - (fore?.x ?? 0))).toBeLessThanOrEqual(1);

    await page.evaluate(SLAPP_LAS);
  });

  test('mobil-undantaget står: under sm reserveras ingen rännsten', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const gutter = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarGutter,
    );
    expect(gutter).toBe('auto');
  });

  test('riktig Select-öppning lämnar rännstenen orörd (miljöberoende skydd)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 600 });

    // .first(): se testet ovan.
    const rubrik = page.getByRole('heading', { level: 1 }).first();
    const fore = await rubrik.boundingBox();

    await page
      .getByRole('button', { name: /status/i })
      .first()
      .click();
    await page.getByRole('listbox').waitFor();

    const gutterOppen = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarGutter,
    );
    expect(gutterOppen).toBe('stable both-edges');

    const under = await rubrik.boundingBox();
    expect(Math.abs((under?.x ?? 0) - (fore?.x ?? 0))).toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
  });
});
