import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Forberedelseskarm — beteende-tester mot Förberedelseskärmens UI-kontrakt
 * (ADR-112; PRD TASK-218 användarberättelser 1, 6, 7; task-218.2 AC 1–3).
 *
 * Testar externt beteende, inte implementationsdetaljer: progressbar-
 * semantiken + korrekta aria-värden per förloppsläge, den polite-
 * annonserade sr-only-statusraden (skild kanal från widgeten, se
 * komponentens klassdoc), den Marcus-låsta ordalydelsen, reducerad
 * rörelse (diskret stegning — ingen transition-deklaration alls under
 * reduce, samma progressive-enhancement-mönster som Skeleton.spec.ts),
 * och kontrastkontraktet (normalläge redan ≥3:1 mot spåret — gold-11
 * golvet, inte bara ett contrast-more-tak — som mörknar vidare till
 * gold-12 under contrast-more).
 *
 * Kör i a11y-projektet mot /dev/primitives (ADR-044/045) — axe-skanningen
 * av sektionen bor i primitives.spec.ts.
 */

const SEKTION = '[aria-labelledby="rubrik-forberedelseskarm"]';
const LAST_TEXT = 'Förbereder ditt administrationsverktyg';

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

/** WCAG 2.x relativ luminans ur en computed `rgb(r, g, b)`-sträng. */
function relativLuminans(rgb: string): number {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
  const lin = (kanal: number) => {
    const c = kanal / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG-kontrastkvot mellan två computed rgb-färger. */
function kontrastKvot(a: string, b: string): number {
  const la = relativLuminans(a);
  const lb = relativLuminans(b);
  const [ljus, mork] = la >= lb ? [la, lb] : [lb, la];
  return (ljus + 0.05) / (mork + 0.05);
}

test.describe('Forberedelseskarm — Förberedelseskärmens UI-kontrakt (task-218.2)', () => {
  test('AC 1: logotyp, determinate bar och den EXAKTA låsta texten renderas i alla tre demo-instanser', async ({
    page,
  }) => {
    const instanser = page.locator(SEKTION).locator('img[alt="Miranon Media"]');
    await expect(instanser).toHaveCount(3);

    const texter = page.locator(SEKTION).getByText(LAST_TEXT, { exact: true });
    await expect(texter).toHaveCount(3);

    // Ordalydelsen är LÅST — inte "innehåller", exakt den fulla strängen,
    // inget mer och inget mindre (Marcus-kravet, ändra aldrig ett tecken).
    for (const el of await texter.all()) {
      await expect(el).toHaveText(LAST_TEXT);
    }
  });

  test('AC 2: progressbar-semantik — korrekta aria-värden per förloppsläge (0 %, delvis, full)', async ({
    page,
  }) => {
    const bars = page.locator(`${SEKTION} [role="progressbar"]`);
    await expect(bars).toHaveCount(3);

    const forvantat = [
      { now: '0', max: '5', text: '0 av 5 hämtningar klara' },
      { now: '2', max: '5', text: '2 av 5 hämtningar klara' },
      { now: '5', max: '5', text: '5 av 5 hämtningar klara' },
    ];
    for (const [i, vantat] of forvantat.entries()) {
      const bar = bars.nth(i);
      await expect(bar).toHaveAttribute('aria-valuenow', vantat.now);
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', vantat.max);
      await expect(bar).toHaveAttribute('aria-valuetext', vantat.text);
      // Namnges av den låsta textraden — ingen dold dubblett-etikett.
      const labelledbyId = await bar.getAttribute('aria-labelledby');
      expect(labelledbyId).toBeTruthy();
      await expect(page.locator(`#${labelledbyId}`)).toHaveText(LAST_TEXT);
    }
  });

  test('AC 2: polite sr-besked — SEPARAT role=status-kanal, aldrig role=alert', async ({
    page,
  }) => {
    const status = page.locator(`${SEKTION} [role="status"]`);
    await expect(status).toHaveCount(3);
    for (const el of await status.all()) {
      await expect(el).toHaveAttribute('aria-live', 'polite');
    }
    await expect(status.nth(0)).toHaveText('0 av 5 hämtningar klara');
    await expect(status.nth(1)).toHaveText('2 av 5 hämtningar klara');
    await expect(status.nth(2)).toHaveText('5 av 5 hämtningar klara');

    // INTE alert (Marcus-kravet) — noll role=alert i sektionen.
    await expect(page.locator(`${SEKTION} [role="alert"]`)).toHaveCount(0);
  });

  test('AC 2: reducerad rörelse — diskret stegning, ingen transition-deklaration alls under reduce', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const forstaFyllnad = page
      .locator(`${SEKTION} [role="progressbar"]`)
      .first()
      .locator('> div > div');
    const medRorelse = await forstaFyllnad.evaluate(
      (el) => getComputedStyle(el).transitionProperty,
    );
    expect(medRorelse).toContain('width');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const utanRorelse = await forstaFyllnad.evaluate(
      (el) => getComputedStyle(el).transitionProperty,
    );
    // Progressive enhancement (samma mönster som Skeleton-shimmerns
    // motion-safe-gate): under reduce är transition-egenskapen 'all'
    // (Tailwinds default/no-op) i stället för 'width' — deklarationen
    // som sätter width existerar inte i denna media-gren alls, så
    // breddändringar blir en diskret hoppning i stället för mjuk fyllnad.
    expect(utanRorelse).not.toContain('width');
  });

  test('AC 2: prefers-contrast: more — spårets outline blir synlig och fyllnaden mörknar till kontrast-tokenen', async ({
    page,
  }) => {
    const forstaTrack = page.locator(`${SEKTION} [role="progressbar"]`).first().locator('> div');
    const forstaFyllnad = forstaTrack.locator('> div');

    // Normalläge: outline-STIL är osatt (border-transparent-mönstret
    // applicerat på outline) — färgen finns men syns inte.
    const normalOutline = await forstaTrack.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(normalOutline).toBe('none');
    const normalFill = await forstaFyllnad.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(normalFill).toBe(await resolvedTokenColor(page, '--mm-forberedelseskarm-bar-fill'));
    expect(normalFill).toBe(await resolvedTokenColor(page, '--p-gold-11'));
    // Golvet gäller redan i NORMALLÄGE (gold-11, inte --mm-primary/gold-9):
    // ≥3:1 mot spåret, inte bara ett contrast-more-tak.
    const trackBg = await forstaTrack.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(kontrastKvot(normalFill, trackBg)).toBeGreaterThanOrEqual(3);

    await page.emulateMedia({ contrast: 'more' });
    const contrastOutline = await forstaTrack.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(contrastOutline).toBe('solid');
    const contrastFill = await forstaFyllnad.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(contrastFill).toBe(
      await resolvedTokenColor(page, '--mm-forberedelseskarm-bar-fill-contrast'),
    );
    expect(contrastFill).toBe(await resolvedTokenColor(page, '--p-gold-12'));
    expect(kontrastKvot(contrastFill, trackBg)).toBeGreaterThanOrEqual(4.5);
  });

  test('print: spårets outline blir synlig (samma dubbelbälte som SlideToConfirm-spåret)', async ({
    page,
  }) => {
    await page.emulateMedia({ media: 'print' });
    const forstaTrack = page.locator(`${SEKTION} [role="progressbar"]`).first().locator('> div');
    const stil = await forstaTrack.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(stil).toBe('solid');
  });
});
