import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Skeleton — beteende-tester mot Lugnt laddläge-principen (task-8.2;
 * facit-källa PRD TASK-8 implementationsbeslut 5–6 + grillad samsyn
 * S63 Del 2 beslut 3, käll-verifierad research NN/g + Chung + Roselli).
 *
 * Testar externt beteende, inte implementationsdetaljer (PRD TASK-8
 * §Testbeslut, a11y-primitiv-skarven): Roselli-markupen, shimmer-regeln
 * (animation ENDAST under prefers-reduced-motion: no-preference),
 * 3:1-kontrasten (WCAG 1.4.11) computed-style-verifierad, contrast-more-
 * och print-stödet samt lh-dimensionerna (blocken reserverar sina
 * slutdimensioner). Färg-assertioner löser förväntansvärdet ur tokens
 * via DOM-probe (L272: computed-assertioner, aldrig pixel-titt).
 *
 * Kör i a11y-projektet mot /dev/primitives (ADR-044/045) —
 * axe-skanningen av sektionen bor i primitives.spec.ts.
 */

const SEKTION = '[aria-labelledby="rubrik-skeleton"]';
const CONTAINER = `${SEKTION} [aria-busy="true"]`;
const BLOCK = `${CONTAINER} span[aria-hidden="true"]`;

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

test.describe('Skeleton — Lugnt laddläge-primitivens beteendekontrakt', () => {
  test('Roselli-markupen: aria-busy på containern, aria-hidden på blocken, sr-only-laddbesked', async ({
    page,
  }) => {
    // Containern som "laddar" bär aria-busy (konsument-anatomin, demon visar den).
    const container = page.locator(CONTAINER);
    await expect(container).toBeVisible();

    // Samtliga skelettblock är dekorativa: aria-hidden, utan roll och utan text.
    const block = page.locator(BLOCK);
    expect(await block.count()).toBeGreaterThanOrEqual(6);
    for (const el of await block.all()) {
      await expect(el).toHaveAttribute('aria-hidden', 'true');
      await expect(el).toHaveText('');
    }

    // aria-busy kompletteras ALLTID med textbesked (få skärmläsare honorerar
    // busy ensam — Roselli): beskedet finns i DOM för uppläsning men är
    // visuellt dolt (sr-only: absolut positionerad 1×1-klippt).
    const besked = container.locator('.sr-only');
    await expect(besked).toHaveCount(1);
    await expect(besked).toContainText(/Laddar/);
    const stil = await besked.evaluate((el) => {
      const s = getComputedStyle(el);
      return { position: s.position, width: s.width, height: s.height };
    });
    expect(stil.position).toBe('absolute');
    expect(stil.width).toBe('1px');
    expect(stil.height).toBe('1px');
  });

  test('shimmer: långsam animation V→H körs ENDAST under prefers-reduced-motion: no-preference', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const forstaBlock = page.locator(BLOCK).first();

    // Glansen bor på ::after-lagret; animationen är deklarerad och långsam
    // (Chung-empirin: långsam slår snabb — ≥2 s per svep).
    const animerad = await forstaBlock.evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return {
        namn: s.animationName,
        duration: s.animationDuration,
        count: s.animationIterationCount,
      };
    });
    expect(animerad.namn).toContain('skeleton-shimmer');
    expect(Number.parseFloat(animerad.duration)).toBeGreaterThanOrEqual(2);
    expect(animerad.count).toBe('infinite');
  });

  test('reduced-motion: statiska block — ingen shimmer-deklaration alls', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const forstaBlock = page.locator(BLOCK).first();

    // Progressive enhancement (WCAG 2.2.2-noten): animationen är media-gated
    // vid deklarationen — under reduce finns den inte (inte bara neutraliserad
    // av base.css-bältet till 0.01 ms).
    const efter = await forstaBlock.evaluate((el) => getComputedStyle(el, '::after').animationName);
    expect(efter).toBe('none');
  });

  test('kontrast: blocken ligger i det lugna platshållar-bandet 1,15–2:1 — 1.4.11 gäller ej dekorativa block (task-8.6)', async ({
    page,
  }) => {
    const forstaBlock = page.locator(BLOCK).first();
    const blockBg = await forstaBlock.evaluate((el) => getComputedStyle(el).backgroundColor);

    // Token-kedjan: komponent-token → semantisk platshållar-roll (L272-paritet).
    // WCAG 1.4.11 undantar dekorativa ytor (Understanding 1.4.11) — bandet
    // vaktar därför BÅDA hållen: blocket syns (≥1,15) men skriker inte
    // (≤2; branschbandet MUI/Carbon/shadcn ≈1,1–2:1, spec §15 Form).
    expect(blockBg).toBe(await resolvedTokenColor(page, '--mm-skeleton-block'));
    expect(blockBg).toBe(await resolvedTokenColor(page, '--mm-bg-placeholder'));

    // Computed-verifierad kvot mot ytan blocket ligger på.
    const containerBg = await page
      .locator(CONTAINER)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const kvot = kontrastKvot(blockBg, containerBg);
    expect(kvot).toBeGreaterThanOrEqual(1.15);
    expect(kvot).toBeLessThanOrEqual(2);
  });

  test('prefers-contrast: more — blocken mörknar till kontrast-tokenen och håller stark kontrast (≥4,5:1)', async ({
    page,
  }) => {
    await page.emulateMedia({ contrast: 'more' });
    const forstaBlock = page.locator(BLOCK).first();
    const blockBg = await forstaBlock.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(blockBg).toBe(await resolvedTokenColor(page, '--mm-skeleton-block-contrast'));
    expect(blockBg).toBe(await resolvedTokenColor(page, '--mm-text-secondary'));

    // Uttalat användarval om urskiljbarhet — här gäller STARK kontrast
    // (text-secondary ≈7:1); 4,5 är golvet med marginal för token-drift.
    const containerBg = await page
      .locator(CONTAINER)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(kontrastKvot(blockBg, containerBg)).toBeGreaterThanOrEqual(4.5);
  });

  test('print: blocken förblir urskiljbara — synlig kontur i border-strong', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    const forstaBlock = page.locator(BLOCK).first();
    await expect(forstaBlock).toBeVisible();

    // Utskrift tappar ofta bakgrundsfärger (print-color-adjust: economy) —
    // konturen bär urskiljbarheten (DashboardCards print-mönster).
    const kant = await forstaBlock.evaluate((el) => {
      const s = getComputedStyle(el);
      return { farg: s.borderTopColor, stil: s.borderTopStyle, bredd: s.borderTopWidth };
    });
    expect(kant.stil).toBe('solid');
    expect(kant.bredd).toBe('1px');
    expect(kant.farg).toBe(await resolvedTokenColor(page, '--mm-border-strong'));
  });

  test('blocken reserverar slutdimensioner: textrad = 1 line-box, tal följer sin typografi, listrad = 3', async ({
    page,
  }) => {
    // Textraden i brödtext-kontext (16 px × 1.5) upptar exakt line-boxen: 24 px.
    const textBlock = page.locator(`${SEKTION} [data-demo="skeleton-text"] span[aria-hidden]`);
    const textBox = await textBlock.first().boundingBox();
    expect(textBox).not.toBeNull();
    expect(Math.round(textBox?.height ?? 0)).toBe(24);

    // Full radbredd som default — blocket fyller sin textrads plats.
    const radYta = await page.locator(`${SEKTION} [data-demo="skeleton-text"]`).boundingBox();
    expect(Math.round(textBox?.width ?? 0)).toBe(Math.round(radYta?.width ?? 0));

    // Talet ärver talets typografi (text-3xl: 30 px × 1.2 = 36 px hög line-box).
    const talBlock = page.locator(`${SEKTION} [data-demo="skeleton-number"] span[aria-hidden]`);
    const talBox = await talBlock.boundingBox();
    expect(Math.round(talBox?.height ?? 0)).toBe(36);

    // Listraden reserverar tre line-boxar (72 px i brödtext-kontext).
    const listBlock = page
      .locator(`${SEKTION} [data-demo="skeleton-list"] span[aria-hidden]`)
      .first();
    const listBox = await listBlock.boundingBox();
    expect(Math.round(listBox?.height ?? 0)).toBe(72);
  });
});
