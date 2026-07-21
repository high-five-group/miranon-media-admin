import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * ToggleButtonGroup — beteende-tester mot S72-facitets pill-form (task-17.1;
 * facit-källa S72-bilagan `tasks/sessions/bilagor/s72-event-lista-konvergens/`
 * FACIT-listvyn.png + README §FACIT).
 *
 * Testar externt beteende, inte implementationsdetaljer (PRD TASK-17
 * §Testbeslut): radiogroup/radio-semantik, pilnavigering, val och
 * computed-form där facitet kräver exakthet. Färg-assertioner löser
 * förväntansvärdet ur SEMANTISKA tokens via DOM-probe (L272:
 * computed-assertioner, aldrig pixel-titt eller hårdkodade färger).
 *
 * Kör i a11y-projektet mot /dev/primitives (skarv 1, ADR-044/045) —
 * axe-skanningen av sektionen bor i primitives.spec.ts.
 */

const SEKTION = '[aria-labelledby="rubrik-togglebuttongroup"]';

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

test.describe('ToggleButtonGroup — semantik och tangentbord (minimaltestet)', () => {
  test('gruppen är en radiogroup med tillgängligt namn; varje pill är radio med aria-checked', async ({
    page,
  }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    await expect(grupp).toBeVisible();

    // Singel-val + disallowEmptySelection är förseglade i primitiven →
    // React Aria ger radio-semantik (inte aria-pressed-toggles).
    const pills = grupp.getByRole('radio');
    await expect(pills).toHaveCount(2);
    await expect(grupp.getByRole('radio', { name: 'Kommande' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(grupp.getByRole('radio', { name: 'Tidigare' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  test('val: tryck på ovald pill flyttar valet och når konsumentens onSelectionChange', async ({
    page,
  }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    await grupp.getByRole('radio', { name: 'Tidigare' }).click();
    await expect(grupp.getByRole('radio', { name: 'Tidigare' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(grupp.getByRole('radio', { name: 'Kommande' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    // Demo-sidans aria-live-statusrad bevisar att nyckeln nådde konsumenten.
    await expect(page.getByTestId('senast-tryckt')).toHaveText('period: past');
  });

  test('alltid-ett-val: tryck på redan vald pill avväljer INTE (disallowEmptySelection)', async ({
    page,
  }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    const kommande = grupp.getByRole('radio', { name: 'Kommande' });
    await kommande.click();
    await expect(kommande).toHaveAttribute('aria-checked', 'true');
  });

  test('tangentbord: pilnavigering flyttar fokus inom gruppen; Enter/Space väljer', async ({
    page,
  }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    const kommande = grupp.getByRole('radio', { name: 'Kommande' });
    const tidigare = grupp.getByRole('radio', { name: 'Tidigare' });

    await kommande.focus();
    await page.keyboard.press('ArrowRight');
    await expect(tidigare).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(tidigare).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('ArrowLeft');
    await expect(kommande).toBeFocused();
    await page.keyboard.press(' ');
    await expect(kommande).toHaveAttribute('aria-checked', 'true');
    await expect(tidigare).toHaveAttribute('aria-checked', 'false');
  });

  test('tangentbordsfokus ger den globala fokus-ringen (2 px + 2 px offset)', async ({ page }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    // Tab-flytt (inte programmatisk focus) garanterar :focus-visible.
    await grupp.getByRole('radio', { name: 'Kommande' }).focus();
    await page.keyboard.press('ArrowRight');
    const tidigare = grupp.getByRole('radio', { name: 'Tidigare' });
    await expect(tidigare).toBeFocused();

    const ring = await tidigare.evaluate((el) => {
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
});

test.describe('ToggleButtonGroup — S72-facitets pill-form (computed-låst)', () => {
  test('tracket: kapselrund yta i bg-muted-token med 4 px inre luft', async ({ page }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    const track = await grupp.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        radie: s.borderTopLeftRadius,
        padding: s.paddingTop,
      };
    });
    expect(track.bg).toBe(await resolvedTokenColor(page, '--mm-bg-muted'));
    // rounded-full → calc(infinity * 1px) ⇒ computed till en pill-radie
    // (halva höjden i px eller ett gigantiskt värde beroende på motor) —
    // assertionen är "inte ett hörn-värde": ≥ halva pillhöjden (~22 px).
    expect(Number.parseFloat(track.radie)).toBeGreaterThanOrEqual(22);
    expect(track.padding).toBe('4px');
  });

  test('vald pill: bg-token, semibold, skugga; ovald: sekundärfärg, medium, transparent', async ({
    page,
  }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    const vald = await grupp.getByRole('radio', { name: 'Kommande' }).evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, vikt: s.fontWeight, skugga: s.boxShadow };
    });
    expect(vald.bg).toBe(await resolvedTokenColor(page, '--mm-bg'));
    expect(vald.vikt).toBe('600');
    expect(vald.skugga).not.toBe('none');

    const ovald = await grupp.getByRole('radio', { name: 'Tidigare' }).evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, vikt: s.fontWeight, farg: s.color };
    });
    expect(ovald.bg).toBe('rgba(0, 0, 0, 0)');
    expect(ovald.vikt).toBe('500');
    expect(ovald.farg).toBe(await resolvedTokenColor(page, '--mm-text-secondary'));
  });

  test('spread-formen: likbreda segment som fyller tracket (period-toggelns geometri)', async ({
    page,
  }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    const kommande = await grupp.getByRole('radio', { name: 'Kommande' }).boundingBox();
    const tidigare = await grupp.getByRole('radio', { name: 'Tidigare' }).boundingBox();
    expect(kommande).not.toBeNull();
    expect(tidigare).not.toBeNull();
    // Likbredd (auto-cols-fr): segmenten skiljer < 1 px.
    expect(Math.abs((kommande?.width ?? 0) - (tidigare?.width ?? 0))).toBeLessThan(1);
    // ≥44 px-golvets kompletterande höjdkrav täcks av träffyte-testet nedan.
  });

  test('träffyta: pillens höjd ≥ 40 px (py-2 + text-body + trackets p-1 ger ≥44 totalt)', async ({
    page,
  }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    const pill = await grupp.getByRole('radio', { name: 'Kommande' }).boundingBox();
    expect(pill).not.toBeNull();
    expect(pill?.height ?? 0).toBeGreaterThanOrEqual(40);
    const track = await grupp.boundingBox();
    expect(track?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('ikon-formen: pillens namn bärs av aria-label, ikonen är dekorativ', async ({ page }) => {
    const vyGrupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Visningsläge' });
    const lista = vyGrupp.getByRole('radio', { name: 'Listvy' });
    await expect(lista).toHaveAttribute('aria-checked', 'true');
    const ikoner = lista.locator('svg');
    await expect(ikoner).toHaveCount(1);
    await expect(ikoner.first()).toHaveAttribute('aria-hidden', 'true');
  });

  test('inaktiverad grupp: pillerna är disabled och dämpade', async ({ page }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Inaktiverad demo' });
    const pill = grupp.getByRole('radio', { name: 'Av' });
    await expect(pill).toBeDisabled();
    const opacitet = await pill.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number.parseFloat(opacitet)).toBeLessThan(1);
  });

  test('statisk pill: ingen deklarerad animation/transition i vila (reduced-motion utan specialfall)', async ({
    page,
  }) => {
    const pill = page
      .locator(SEKTION)
      .getByRole('radiogroup', { name: 'Period' })
      .getByRole('radio', { name: 'Kommande' });
    const vila = await pill.evaluate((el) => {
      const s = getComputedStyle(el);
      return { animation: s.animationName, transition: s.transitionDuration };
    });
    expect(vila.animation).toBe('none');
    expect(vila.transition).toBe('0s');
  });

  test('print: track och vald etikett förblir synliga', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    await expect(grupp).toBeVisible();
    await expect(grupp.getByRole('radio', { name: 'Kommande' })).toBeVisible();
  });
});
