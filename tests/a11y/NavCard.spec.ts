import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * NavCard — beteende-tester mot M6-facitet (task-9.1; facit-källa
 * sessionsdok S64 Del 3 §Facit-specen p4 + §Byggkravs-listan p1).
 *
 * Testar externt beteende, inte implementationsdetaljer (PRD TASK-9
 * §Testbeslut): roll/namn/dekorativ ikon + computed-mått och
 * token-paritet där facitet kräver exakthet. Färg-assertioner löser
 * förväntansvärdet ur SEMANTISKA tokens via DOM-probe (L272:
 * computed-assertioner, aldrig pixel-titt eller hårdkodade färger) —
 * testet bevisar kedjan komponent → komponent-token → semantisk token.
 *
 * Kör i a11y-projektet mot /dev/primitives (skarv 1, ADR-044/045) —
 * axe-skanningen av sektionen bor i primitives.spec.ts.
 */

const SEKTION = '[aria-labelledby="rubrik-navcard"]';

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

test.describe('NavCard — M6-facitets beteendekontrakt', () => {
  test('hela ytan är EN länk: etiketten bär länknamnet ensam, ikonen är dekorativ, ingen chevron', async ({
    page,
  }) => {
    const sektion = page.locator(SEKTION);
    const lank = sektion.getByRole('link', { name: 'Anmälningar', exact: true });
    await expect(lank).toBeVisible();

    // Router-typad to → riktig href (obefintlig route stoppas i tsc;
    // här bevisas den positiva wiringen ände-till-ände).
    await expect(lank).toHaveAttribute('href', '/mer/anmalningar');

    // Exakt EN svg (ingen chevron — app-bred regel, D-reviderad M4),
    // och den är dekorativ (aria-hidden) så länknamnet är rent.
    const ikoner = lank.locator('svg');
    await expect(ikoner).toHaveCount(1);
    await expect(ikoner.first()).toHaveAttribute('aria-hidden', 'true');
  });

  test('träffyta: raden är ≈58 px hög (≥44 px-golvet)', async ({ page }) => {
    const lank = page.locator(SEKTION).getByRole('link', { name: 'Anmälningar' });
    const box = await lank.boundingBox();
    expect(box).not.toBeNull();
    // AC-golvet ≥44; facit-måttet 58 (py-4 16+16 + radhöjd 24 + kant 2×1).
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(Math.round(box?.height ?? 0)).toBe(58);
  });

  test('ikon-paritet: 20 px i sekundärfärgen (computed token-probe)', async ({ page }) => {
    const ikon = page
      .locator(SEKTION)
      .getByRole('link', { name: 'Anmälningar' })
      .locator('svg')
      .first();
    const matt = await ikon.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bredd: s.width, hojd: s.height, farg: s.color };
    });
    expect(matt.bredd).toBe('20px');
    expect(matt.hojd).toBe('20px');
    expect(matt.farg).toBe(await resolvedTokenColor(page, '--mm-text-secondary'));
  });

  test('kortytan: bg-muted-token, transparent kant i vila, etikett 16/600', async ({ page }) => {
    const lank = page.locator(SEKTION).getByRole('link', { name: 'Anmälningar' });
    const yta = await lank.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, kant: s.borderTopColor };
    });
    expect(yta.bg).toBe(await resolvedTokenColor(page, '--mm-bg-muted'));
    expect(yta.kant).toBe('rgba(0, 0, 0, 0)');

    const etikett = await lank
      .locator('span', { hasText: 'Anmälningar' })
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return { storlek: s.fontSize, vikt: s.fontWeight };
      });
    expect(etikett.storlek).toBe('16px');
    expect(etikett.vikt).toBe('600');
  });

  test('ingen hover-bakgrundsändring (M3 prövad och förkastad)', async ({ page }) => {
    const lank = page.locator(SEKTION).getByRole('link', { name: 'Anmälningar' });
    const bgFore = await lank.evaluate((el) => getComputedStyle(el).backgroundColor);
    await lank.hover();
    const bgEfter = await lank.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgEfter).toBe(bgFore);
  });

  test('tangentbordsfokus ger den globala fokus-ringen (2 px + 2 px offset)', async ({ page }) => {
    const sektion = page.locator(SEKTION);
    // Tab-flytt (inte programmatisk focus) garanterar :focus-visible.
    await sektion.getByRole('link', { name: 'Anmälningar' }).focus();
    await page.keyboard.press('Tab');
    const andra = sektion.getByRole('link', { name: 'Väntelista' });
    await expect(andra).toBeFocused();

    const ring = await andra.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        bredd: s.outlineWidth,
        stil: s.outlineStyle,
        farg: s.outlineColor,
        offset: s.outlineOffset,
      };
    });
    expect(ring.bredd).toBe('2px');
    expect(ring.stil).toBe('solid');
    expect(ring.offset).toBe('2px');
    expect(ring.farg).toBe(await resolvedTokenColor(page, '--mm-focus-ring'));
  });

  test('hög-kontrast-läge ger synlig kantlinje (prefers-contrast: more)', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' });
    const lank = page.locator(SEKTION).getByRole('link', { name: 'Anmälningar' });
    const kant = await lank.evaluate((el) => {
      const s = getComputedStyle(el);
      return { farg: s.borderTopColor, bredd: s.borderTopWidth, stil: s.borderTopStyle };
    });
    expect(kant.stil).toBe('solid');
    expect(kant.bredd).toBe('1px');
    expect(kant.farg).toBe(await resolvedTokenColor(page, '--mm-border-strong'));
  });

  test('reduced-motion: raden är statisk och den globala neutraliseringen täcker den', async ({
    page,
  }) => {
    const lank = page.locator(SEKTION).getByRole('link', { name: 'Anmälningar' });
    // Facitet är statiskt: ingen deklarerad animation/transition i vila.
    const vila = await lank.evaluate((el) => {
      const s = getComputedStyle(el);
      return { animation: s.animationName, transition: s.transitionDuration };
    });
    expect(vila.animation).toBe('none');
    expect(vila.transition).toBe('0s');

    // Under prefers-reduced-motion gäller base.css-neutraliseringen (≤0.01 ms).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducerad = await lank.evaluate(
      (el) => Number.parseFloat(getComputedStyle(el).transitionDuration) || 0,
    );
    expect(reducerad).toBeLessThanOrEqual(0.001);
  });

  test('print: rad och etikett förblir synliga', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    const lank = page.locator(SEKTION).getByRole('link', { name: 'Anmälningar' });
    await expect(lank).toBeVisible();
    await expect(lank.locator('span', { hasText: 'Anmälningar' }).first()).toBeVisible();
  });
});
