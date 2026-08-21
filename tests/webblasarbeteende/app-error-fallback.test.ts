import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Appfel-fallbackens designvillkor — externt beteende (TASK-285.3, AC #2).
 *
 * KLASSVALET är `webblasarbeteende`, inte `acceptance`, av samma skäl som
 * `app-chunk-laddningsfel.test.ts` (se dess filhuvud): noll databeteende,
 * `scripts/hermetik-sjalvtest.mjs` (ADR-080 beslut 3) fäller sådana tester i
 * acceptance-klassen.
 *
 * VAD SOM BEVISAS: `AppErrorFallback` (`src/components/ErrorBoundary/
 * AppErrorFallback.tsx`) är appens SISTA skyddslager och kan nås när resten
 * av appen — inklusive stylesheetet — är dött. Facit
 * (`tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json`
 * ytan "appfel-sidan") kräver därför att formen kommer helt från INLINE
 * `style`-attribut, aldrig från en CSS-klass eller en CSS custom property
 * (`var(--p-...)`/`var(--mm-...)`) — en sådan hade fallit tillbaka till
 * webbläsarens default-värde när stylesheetet försvinner, och testet nedan
 * hade fällt på FEL färg, inte på ett kastat fel.
 *
 * METOD: navigera till `/dev/primitives` (samma DEV-guardade demo-yta som
 * `app-chunk-laddningsfel.test.ts` använder), ta bort VARJE `<link
 * rel="stylesheet">` och `<style>`-element i dokumentet (Vites dev-server
 * injicerar Tailwind/design-tokens via `<style>`, inte `<link>` — båda
 * typerna tas bort för att täcka bygg-läget också), och läs sedan
 * `getComputedStyle` på fallbackens egna element. Matchar de fortfarande
 * primitivernas hex-värden (`#a90000`/`#242424`/`#ffffff`,
 * `src/styles/tokens/primitives.css`) är formen bevisligen inline, inte
 * stylesheet-buren.
 */

async function taBortAllaStylesheets(page: Page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('link[rel="stylesheet"], style')) {
      el.remove();
    }
  });
}

test.describe('AppErrorFallback — renderar utan stylesheet (designvillkoret, AC #2)', () => {
  test('formen (färger, kant, skugga) kommer från inline-stilar, inte CSS', async ({ page }) => {
    await page.goto('/dev/primitives');
    // .first(): sidans EGEN rubrik är alltid FÖRST i DOM-ordning — sektionen
    // nedan (samma skiva) lägger till ytterligare två h1-rubriker (facit-
    // formen kräver en riktig rubrik-roll), så ett oscopat
    // getByRole('heading', { level: 1 }) blir en strict-mode-krock.
    await page.getByRole('heading', { level: 1 }).first().waitFor();

    await taBortAllaStylesheets(page);

    const kort = page.getByTestId('appfel-fallback-skarp').locator('div[role="alert"]');
    await expect(kort).toBeVisible();

    const computed = await kort.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        borderLeftColor: s.borderLeftColor,
        borderLeftWidth: s.borderLeftWidth,
        background: s.backgroundColor,
        color: s.color,
      };
    });
    // #a90000
    expect(computed.borderLeftColor).toBe('rgb(169, 0, 0)');
    expect(computed.borderLeftWidth).toBe('4px');
    // #ffffff
    expect(computed.background).toBe('rgb(255, 255, 255)');
    // #242424
    expect(computed.color).toBe('rgb(36, 36, 36)');

    const knapp = kort.getByRole('button', { name: 'Ladda om' });
    const knappFarg = await knapp.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(knappFarg).toBe('rgb(36, 36, 36)');
  });

  test('rubrik, brödtext och knapp är fortfarande synliga och läsbara utan stylesheet', async ({
    page,
  }) => {
    await page.goto('/dev/primitives');
    // .first(): sidans EGEN rubrik är alltid FÖRST i DOM-ordning — sektionen
    // nedan (samma skiva) lägger till ytterligare två h1-rubriker (facit-
    // formen kräver en riktig rubrik-roll), så ett oscopat
    // getByRole('heading', { level: 1 }) blir en strict-mode-krock.
    await page.getByRole('heading', { level: 1 }).first().waitFor();

    await taBortAllaStylesheets(page);

    const kort = page.getByTestId('appfel-fallback-skarp');
    await expect(kort.getByRole('heading', { name: 'Appen kunde inte visas' })).toBeVisible();
    await expect(kort).toContainText(
      'Något gick sönder så att sidan inte kan ritas upp. Det du redan har sparat finns kvar.',
    );
    await expect(kort.getByRole('button', { name: 'Ladda om' })).toBeVisible();
  });
});
