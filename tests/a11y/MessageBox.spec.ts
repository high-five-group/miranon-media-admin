import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * `MessageBox` — S109-facitets familjeform, promoverad (`ADR-103` B2 steg 1,
 * `TASK-285.2`). Facit-källa: `tasks/sessions/bilagor/
 * s109-meddelandefamiljen-konvergens/facit.json` § yta "meddelanderutan"
 * (varv 4 — ingen kontur i vila, 4 px intent-vänsterkant, `contrast-more`
 * tänder full kontur, kryss-regeln, actions-sloten).
 *
 * Kör i a11y-projektet mot /dev/primitives (skarv 1, ADR-044/045) — den
 * fullständiga axe-skanningen av sektionen bor i `primitives.spec.ts`
 * ("MessageBox — sektion"); denna fil bevisar de FYRA formbesluten som axe
 * inte kan se: rollmappningen, kryss-regeln (STRUKTURELLT — ingen
 * stäng-knapp renderas för error/warning oavsett), actions-sloten
 * (högerställd knapprad) och hög-kontrast-konturen.
 *
 * LOKATOR-VALET (`.filter({ hasText })`, inte `getByRole(role, { name })`):
 * `alert`/`status` är "name from author" i ARIA-taxonomin, inte "name from
 * content" — utan ett explicit `aria-label`/`aria-labelledby` (som denna
 * primitiv medvetet inte bär, se `MessageBox.tsx`) är den räknade
 * TILLGÄNGLIGA NAMNET tomt. `getByRole(..., { name: /rubrik/ })` mot en sådan
 * nod matchar därför ALDRIG (mätt: samtliga sådana lokatorer i ett tidigare
 * utkast av denna fil föll med "element(s) not found"). `.filter({ hasText })`
 * söker i stället i noden UTDATA-TRÄDET (roll + synlig text), samma mönster
 * som `persons-list.acceptance.test.ts`
 * (`page.getByRole('alert').filter({ hasText: 'Kunde inte hämta personer' })`).
 *
 * Referens för samma form på en ANNAN yta (den fulla `/dev/notis-prototyp`-
 * demot, prototyp FÖRE == primitiv EFTER): `tests/visual/
 * messagebox-promoverings-grind.spec.ts` (ADR-103 B4).
 */

const SEKTION = '[aria-labelledby="rubrik-messagebox"]';

/** Löser en CSS-custom-property till computed färg via en DOM-probe. */
async function resolvedTokenColor(page: Page, tokenNamn: string): Promise<string> {
  return page.evaluate((namn) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${namn})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, tokenNamn);
}

test.describe('MessageBox — rollmappning (oförändrad av promoveringen, AC #5)', () => {
  test('error/warning renderar role="alert"; success/info renderar role="status"', async ({
    page,
  }) => {
    const sektion = page.locator(SEKTION);
    await expect(sektion.getByRole('alert').filter({ hasText: 'Rubrik (error)' })).toBeVisible();
    await expect(sektion.getByRole('alert').filter({ hasText: 'Rubrik (warning)' })).toBeVisible();
    await expect(sektion.getByRole('status').filter({ hasText: 'Rubrik (success)' })).toBeVisible();
    await expect(sektion.getByRole('status').filter({ hasText: 'Rubrik (info)' })).toBeVisible();
  });
});

test.describe('MessageBox — kryss-regeln (S109-facit, familjeregel, AC #3)', () => {
  test('error med actions bär INGEN stäng-knapp, bara knapprad', async ({ page }) => {
    const ruta = page
      .locator(SEKTION)
      .getByRole('alert')
      .filter({ hasText: 'Med knapprad (error)' });
    await expect(ruta.getByRole('button', { name: 'Stäng meddelande' })).toHaveCount(0);
    await expect(ruta.getByRole('button', { name: 'Försök igen' })).toBeVisible();
  });

  test('warning med actions bär INGEN stäng-knapp, bara knapprad', async ({ page }) => {
    const ruta = page
      .locator(SEKTION)
      .getByRole('alert')
      .filter({ hasText: 'Med knapprad (warning)' });
    await expect(ruta.getByRole('button', { name: 'Stäng meddelande' })).toHaveCount(0);
    await expect(ruta.getByRole('button', { name: 'Ignorera varningen' })).toBeVisible();
  });

  test('success FÅR en stäng-knapp, indragen i linje med rubriken/högerkanten', async ({
    page,
  }) => {
    const ruta = page
      .locator(SEKTION)
      .getByRole('status')
      .filter({ hasText: 'Avvisningsbar (success)' });
    const knapp = ruta.getByRole('button', { name: 'Stäng meddelande' });
    await expect(knapp).toBeVisible();
    // Indragningen (`-mt-1.5 -mr-2`, S109-facit varv 2) är ett negativt
    // margin-par — computed-läsning i stället för klass-namns-sniff (L272).
    const margin = await knapp.evaluate((el) => {
      const s = getComputedStyle(el);
      return { top: s.marginTop, right: s.marginRight };
    });
    expect(margin.top).toBe('-6px');
    expect(margin.right).toBe('-8px');
  });

  test('info FÅR en stäng-knapp (samma familjeregel som success)', async ({ page }) => {
    const ruta = page
      .locator(SEKTION)
      .getByRole('status')
      .filter({ hasText: 'Avvisningsbar (info)' });
    await expect(ruta.getByRole('button', { name: 'Stäng meddelande' })).toBeVisible();
  });

  test('kryss och knapprad samtidigt är oberoende slotar (success)', async ({ page }) => {
    const ruta = page
      .locator(SEKTION)
      .getByRole('status')
      .filter({ hasText: 'Kryss och knapprad tillsammans' });
    await expect(ruta.getByRole('button', { name: 'Stäng meddelande' })).toBeVisible();
    await expect(ruta.getByRole('button', { name: 'Visa kvitto' })).toBeVisible();
  });
});

test.describe('MessageBox — actions-sloten (S109-facit, AC #2)', () => {
  test('knapprad är högerställd under brödtexten, inte i huvudraden', async ({ page }) => {
    const ruta = page
      .locator(SEKTION)
      .getByRole('alert')
      .filter({ hasText: 'Med knapprad (error)' });
    const knapp = ruta.getByRole('button', { name: 'Försök igen' });
    await expect(knapp).toBeVisible();
    const rutaBox = await ruta.boundingBox();
    const knappBox = await knapp.boundingBox();
    expect(rutaBox).not.toBeNull();
    expect(knappBox).not.toBeNull();
    // Högerställd: knappens högerkant ligger nära rutans (padding avräknat),
    // inte i vänsterkanten där brödtexten börjar.
    const rutaHoger = (rutaBox?.x ?? 0) + (rutaBox?.width ?? 0);
    const knappHoger = (knappBox?.x ?? 0) + (knappBox?.width ?? 0);
    expect(rutaHoger - knappHoger).toBeLessThan(20);
    // Under texten: knappraden ligger LÄNGRE NER än brödtextens rad.
    const brodtext = ruta.getByText('actions-sloten renderar');
    const brodtextBox = await brodtext.boundingBox();
    expect(knappBox?.y ?? 0).toBeGreaterThan(brodtextBox?.y ?? 0);
  });
});

test.describe('MessageBox — hög-kontrast-läge (prefers-contrast: more, AC #4)', () => {
  const INTENTS = ['info', 'success', 'warning', 'error'] as const;

  for (const intent of INTENTS) {
    test(`${intent}: ingen kontur i vila, full intent-kontur under prefers-contrast: more`, async ({
      page,
    }) => {
      const roll = intent === 'success' || intent === 'info' ? 'status' : 'alert';
      const ruta = page
        .locator(SEKTION)
        .getByRole(roll)
        .filter({ hasText: `Rubrik (${intent})` });
      await expect(ruta).toBeVisible();

      // Vila: bara vänsterkanten (4 px) bär bredd; övriga sidor 0.
      const vila = await ruta.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          vanster: s.borderLeftWidth,
          topp: s.borderTopWidth,
          hoger: s.borderRightWidth,
        };
      });
      expect(vila.vanster).toBe('4px');
      expect(vila.topp).toBe('0px');
      expect(vila.hoger).toBe('0px');

      await page.emulateMedia({ contrast: 'more' });
      const kontrast = await ruta.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          topp: { bredd: s.borderTopWidth, stil: s.borderTopStyle, farg: s.borderTopColor },
          hoger: { bredd: s.borderRightWidth },
        };
      });
      expect(kontrast.topp.bredd).toBe('1px');
      expect(kontrast.topp.stil).toBe('solid');
      expect(kontrast.hoger.bredd).toBe('1px');
      expect(kontrast.topp.farg).toBe(
        await resolvedTokenColor(page, `--mm-messagebox-${intent}-border`),
      );

      // Städa: nästa test i loopen ska inte ärva emuleringen.
      await page.emulateMedia({ contrast: 'no-preference' });
    });
  }
});
