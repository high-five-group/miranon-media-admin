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
 *
 * ─── FÄRGÖVERGÅNGEN: varför färg-assertionerna poll:as ────────────────────
 * Sedan task-273.2 (commit cd4492a0, Marcus omprövning 2026-08-17) bär raden
 * `hover:bg-bg-emphasized motion-safe:transition-colors`. Tailwind v4:s
 * `transition-colors` omfattar `outline-color` OCH `border-color` utöver
 * `background-color` (verifierat i tailwindcss@4.3.3), med
 * `--default-transition-duration: 150ms`. En computed-avläsning omedelbart
 * efter en tillståndsändring fångar därför ett MELLANVÄRDE i övergången.
 *
 * Det gav tre nätters röd A11y-svit (S107): fokusringen mättes till
 * rgb(32,53,66), rgb(28,70,96) och rgb(34,42,47) i olika körningar mot
 * facitets rgb(27,73,101), och kantlinjen till rgba(196,196,194,0.835) med
 * alpha ännu inte framme. Vilket av testerna som föll varierade med
 * maskinens timing — därav flake-signaturen.
 *
 * `expect.poll` väntar in det deterministiska SLUTtillståndet. Den döljer
 * ingen flakighet — den mäter rätt ögonblick. Att i stället höja en timeout
 * eller slå på retries hade dolt orsaken i stället för att åtgärda den
 * (scripts/flake-matserie.mjs § egenskap 3).
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
  test('hela ytan är EN länk: etiketten bär länknamnet ensam, ikon + chevron är dekorativa', async ({
    page,
  }) => {
    const sektion = page.locator(SEKTION);
    const lank = sektion.getByRole('link', { name: 'Anmälningar', exact: true });
    await expect(lank).toBeVisible();

    // Router-typad to → riktig href (obefintlig route stoppas i tsc;
    // här bevisas den positiva wiringen ände-till-ände).
    await expect(lank).toHaveAttribute('href', '/mer/anmalningar');

    // Exakt TVÅ svg: radikonen + chevronen. Ingen-chevron-regeln är RIVEN
    // ÖPPET (task-18.3; S73 K25-prövningens Marcus-kvitterade konsekvens):
    // chevron betyder att raden leder vidare — spec §14. Båda dekorativa
    // (aria-hidden) så länknamnet är rent.
    const ikoner = lank.locator('svg');
    await expect(ikoner).toHaveCount(2);
    await expect(ikoner.first()).toHaveAttribute('aria-hidden', 'true');
    await expect(ikoner.last()).toHaveAttribute('aria-hidden', 'true');
    await expect(lank.locator('svg.lucide-chevron-right')).toHaveCount(1);
  });

  test('chevronen: 18 px i sekundärfärgen, sist i raden (leder vidare-grammatiken)', async ({
    page,
  }) => {
    const lank = page.locator(SEKTION).getByRole('link', { name: 'Anmälningar' });
    const chevron = lank.locator('svg.lucide-chevron-right');
    const matt = await chevron.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bredd: s.width, hojd: s.height, farg: s.color };
    });
    // Åtgärdsradernas chevron-grammatik (S73 K25/K72): 18 px, sekundärfärgen.
    expect(matt.bredd).toBe('18px');
    expect(matt.hojd).toBe('18px');
    expect(matt.farg).toBe(await resolvedTokenColor(page, '--mm-text-secondary'));

    // Chevronen är radens sista element (höger — "raden leder vidare").
    const positioner = await lank.evaluate((el) => {
      const svgs = el.querySelectorAll('svg');
      const sista = svgs[svgs.length - 1] as SVGElement;
      return {
        chevronHoger: sista.getBoundingClientRect().right,
        lankHoger: el.getBoundingClientRect().right,
      };
    });
    expect(positioner.chevronHoger).toBeLessThanOrEqual(positioner.lankHoger);
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

  test('hover ger eventdetaljens radhover-platta (M3 RIVET, task-273.2)', async ({ page }) => {
    const lank = page.locator(SEKTION).getByRole('link', { name: 'Anmälningar' });
    expect(await lank.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      await resolvedTokenColor(page, '--mm-bg-muted'),
    );

    await lank.hover();
    // Övergången är 150 ms — poll:a in SLUTvärdet (se § Färgövergången ovan).
    await expect
      .poll(() => lank.evaluate((el) => getComputedStyle(el).backgroundColor))
      .toBe(await resolvedTokenColor(page, '--mm-bg-emphasized'));
  });

  test('tangentbordsfokus ger den globala fokus-ringen (2 px + 2 px offset)', async ({ page }) => {
    const sektion = page.locator(SEKTION);
    // Tab-flytt (inte programmatisk focus) garanterar :focus-visible.
    await sektion.getByRole('link', { name: 'Anmälningar' }).focus();
    await page.keyboard.press('Tab');
    const andra = sektion.getByRole('link', { name: 'Väntelista' });
    await expect(andra).toBeFocused();

    // Måtten animeras inte — läses direkt.
    const ring = await andra.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bredd: s.outlineWidth, stil: s.outlineStyle, offset: s.outlineOffset };
    });
    expect(ring.bredd).toBe('2px');
    expect(ring.stil).toBe('solid');
    expect(ring.offset).toBe('2px');

    // outline-color INGÅR i transition-colors (Tailwind v4) — poll:a in slutvärdet.
    await expect
      .poll(() => andra.evaluate((el) => getComputedStyle(el).outlineColor))
      .toBe(await resolvedTokenColor(page, '--mm-focus-ring'));
  });

  test('hög-kontrast-läge ger synlig kantlinje (prefers-contrast: more)', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' });
    const lank = page.locator(SEKTION).getByRole('link', { name: 'Anmälningar' });
    const kant = await lank.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bredd: s.borderTopWidth, stil: s.borderTopStyle };
    });
    expect(kant.stil).toBe('solid');
    expect(kant.bredd).toBe('1px');

    // border-color INGÅR i transition-colors — poll:a in slutvärdet. Mätt mitt i
    // övergången gav den rgba(196, 196, 194, 0.835): alpha ännu inte framme.
    await expect
      .poll(() => lank.evaluate((el) => getComputedStyle(el).borderTopColor))
      .toBe(await resolvedTokenColor(page, '--mm-border-strong'));
  });

  test('reduced-motion: ingen keyframe-animation, och färgövergången neutraliseras', async ({
    page,
  }) => {
    const lank = page.locator(SEKTION).getByRole('link', { name: 'Anmälningar' });
    const vila = await lank.evaluate((el) => {
      const s = getComputedStyle(el);
      return { animation: s.animationName, transition: s.transitionDuration };
    });
    // Ingen keyframe-animation — den delen av M6-facitet står kvar.
    expect(vila.animation).toBe('none');
    // Men "ingen transition i vila" är RIVET (task-273.2): hover-plattan bär en
    // motion-safe-villkorad färgövergång. Assertionen bokför att den FINNS —
    // exakt duration låses inte, den ägs av Tailwinds default.
    expect(Number.parseFloat(vila.transition)).toBeGreaterThan(0);

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
