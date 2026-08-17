import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Forberedelseskarm — beteende-tester mot Förberedelseskärmens UI-kontrakt
 * (ADR-112; PRD TASK-218 användarberättelser 1, 6, 7; task-218.2 AC 1–3;
 * bakgrundsbilden task-273.6 AC 1–4).
 *
 * Testar externt beteende, inte implementationsdetaljer: progressbar-
 * semantiken + korrekta aria-värden per förloppsläge, den polite-
 * annonserade sr-only-statusraden (skild kanal från widgeten, se
 * komponentens klassdoc), den Marcus-låsta ordalydelsen (kvar i DOM:en men
 * sr-only sedan task-273.6 — logotypen och den synliga texten är borta ur
 * den renderade ytan, bara baren är kvar), reducerad rörelse (diskret
 * stegning — ingen transition-deklaration alls under reduce, samma
 * progressive-enhancement-mönster som Skeleton.spec.ts), och
 * kontrastkontraktet: dels det ursprungliga (normalläge redan ≥3:1 mot
 * spåret — sage-9 golvet, inte bara ett contrast-more-tak — som mörknar
 * vidare till sage-11 under contrast-more; färgbytet från gold är
 * task-273.1, 2026-08-17), dels det NYA (bakgrundsscrimmets opacitet mot
 * det mätta WCAG-golvet, task-273.6 — se components.css:s tokenkommentar
 * för fullständig pixelanalys av `public/roger-och-lotta.webp`).
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

/**
 * WCAG 2.x relativ luminans ur en computed färgsträng.
 *
 * TVÅ FORMAT, med avsikt (S107 fynd-fix): Chromium serialiserar vanliga
 * färger som `rgb(r, g, b)` med 0–255-kanaler, MEN resultatet av en
 * `color-mix()` som `color(srgb 0.97 0.97 0.96)` med 0–1-kanaler. Den
 * ursprungliga formen dividerade alltid med 255 och läste därför ett
 * near-vitt color-mix-värde som near-svart — en kontrastkvot på 20,9 där
 * sanningen var 1,0. Felet var LATENT: samtliga dåvarande anrop jämförde
 * tokens som råkade resolva till `rgb()`. Första color-mix-tokenen som
 * mättes avslöjade det.
 */
function relativLuminans(farg: string): number {
  const kanaler = (farg.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
  // `color(srgb …)` bär redan 0–1; `rgb(…)` bär 0–255. "srgb" innehåller
  // inga siffror, så matchningen ovan är opåverkad av prefixet.
  const skala = farg.startsWith('color(') ? 1 : 255;
  const [r, g, b] = kanaler;
  const lin = (kanal: number) => {
    const c = kanal / skala;
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
  test('task-273.6 AC 1: logotypen är helt borta, den låsta texten är kvar i DOM:en men INTE synlig, baren orörd', async ({
    page,
  }) => {
    // Logotypen är BORTTAGEN, inte bara osynlig — noll instanser.
    const logor = page.locator(SEKTION).locator('img[alt="Miranon Media"]');
    await expect(logor).toHaveCount(0);

    // Ordalydelsen är fortfarande LÅST och kvar — progressbarens
    // aria-labelledby-mål (se testet nedan) — men "rensas till enbart
    // loadingbaren" (Marcus tillägg 2) gör den sr-only i stället för synlig.
    const texter = page.locator(SEKTION).getByText(LAST_TEXT, { exact: true });
    await expect(texter).toHaveCount(3);
    for (const el of await texter.all()) {
      // Ordalydelsen är LÅST — inte "innehåller", exakt den fulla strängen,
      // inget mer och inget mindre (Marcus-kravet, ändra aldrig ett tecken).
      await expect(el).toHaveText(LAST_TEXT);
      // ...men inte längre VISUELLT synlig (AC 1: "borta ur den renderade
      // ytan"). Playwrights toBeVisible() räcker INTE här — mätt: den
      // klassar ett sr-only-element som "visible" ändå, eftersom
      // clip-tekniken bara påverkar MÅLNING, inte layoutboxen som
      // getBoundingClientRect() läser. Mät i stället den FAKTISKA synliga
      // ytan: en sr-only-rad har en ~1×1px bounding box, inte en läsbar
      // textrads mått.
      const box = await el.boundingBox();
      expect(box?.width ?? 0).toBeLessThanOrEqual(1);
      expect(box?.height ?? 0).toBeLessThanOrEqual(1);
    }

    // Baren (task-273.1:s form) är KVAR ORÖRD — tre progressbars, en per
    // demo-instans, oförändrad räkning.
    await expect(page.locator(`${SEKTION} [role="progressbar"]`)).toHaveCount(3);
  });

  test('task-273.6 AC 2/4: bakgrundsbilden renderas — foto (cover/center, aria-hidden) + scrim, ingen <img>', async ({
    page,
  }) => {
    const foton = page.locator(SEKTION).locator('[data-testid="forberedelseskarm-bakgrund"]');
    await expect(foton).toHaveCount(3);
    const scrim = page.locator(SEKTION).locator('[data-testid="forberedelseskarm-scrim"]').first();
    await expect(scrim).toHaveCount(1);

    const forstaFoto = foton.first();
    await expect(forstaFoto).toHaveAttribute('aria-hidden', 'true');
    await expect(scrim).toHaveAttribute('aria-hidden', 'true');

    const stilar = await forstaFoto.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        bild: cs.backgroundImage,
        storlek: cs.backgroundSize,
        position: cs.backgroundPosition,
      };
    });
    // "centrerad och täcker hela ... fönstret (cover-beteende)" — Marcus
    // form-beskrivning, task-273.6 AC 2 — inte letterboxad/upprepad.
    expect(stilar.bild).toContain('roger-och-lotta.webp');
    expect(stilar.storlek).toBe('cover');
    expect(stilar.position).toBe('50% 50%');

    // Scrimmets opacitet är den MÄTTA WCAG-säkerhetsmarginalen. Golvet
    // sänktes 0,90 → 0,85 i S107 på Marcus granskning ("liiite mer av
    // fotot"); vid 85 % ger bildens absolut mörkaste uppmätta pixel
    // (0,10,24) kontrasten 4,02:1 mot barens fyllnad — fortsatt över
    // 1.4.11:s 3:1-golv, med 34 % marginal. 80 % mättes (3,56:1) och valdes
    // bort. Talet här är ett GOLV, inte ett mål: en regression under det
    // äter den mätta marginalen utan att någon annan grind fångar det.
    // Sänks det igen MÅSTE luminansanalysen räknas om — och kamouflagefärgen
    // med den (samma procenttal, se components.css).
    const alfa = await scrim.evaluate((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      const match = bg.match(/rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*([\d.]+)\s*)?\)/);
      return match?.[1] === undefined ? 1 : Number(match[1]);
    });
    expect(alfa).toBeGreaterThanOrEqual(0.85);
  });

  test('task-273.6 AC 3: prefers-contrast: more DÖLJER bakgrund+scrim helt, faller tillbaka till ren yta', async ({
    page,
  }) => {
    const foto = page
      .locator(SEKTION)
      .locator('[data-testid="forberedelseskarm-bakgrund"]')
      .first();
    const scrim = page.locator(SEKTION).locator('[data-testid="forberedelseskarm-scrim"]').first();
    await expect(foto).toBeVisible();
    await expect(scrim).toBeVisible();

    await page.emulateMedia({ contrast: 'more' });
    // "bilden får tonas ned ytterligare eller döljas där" (Marcus AC 3) —
    // denna implementation DÖLJER, faller tillbaka till containerns egen
    // bg-bg (samma rena yta som fanns FÖRE denna skiva).
    await expect(foto).toBeHidden();
    await expect(scrim).toBeHidden();
  });

  test('S107 fynd-fix: rännstens-kamouflaget målar canvas-lagret så scroll-spalten inte blir vit', async ({
    page,
  }) => {
    // Markören sitter på <html> — foto/scrim ligger INUTI body och kan aldrig
    // nå rännstenen (Chromium-spec-gapet, se components.css-tokenen).
    await expect(page.locator('html')).toHaveAttribute('data-forberedelse-fond', 'true');

    const kamouflage = await resolvedTokenColor(page, '--mm-forberedelseskarm-fond-kamouflage');
    const htmlBakgrund = await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    );
    expect(htmlBakgrund).toBe(kamouflage);

    // Kärnan i fyndet: canvas-lagret får INTE stå kvar som appens rena vita,
    // för då är rännstenen fortfarande en vit spalt bredvid fotot.
    const bg = await resolvedTokenColor(page, '--mm-bg');
    expect(htmlBakgrund).not.toBe(bg);

    // DEN INVARIANT SOM FAKTISKT SKYDDAR (S107, andra varvet): kamouflaget
    // och scrimmet MÅSTE bära samma procenttal. Gör de inte det målas
    // rännstenen i en annan ton än fotot bredvid — vilket var precis det
    // Marcus såg när kamouflaget byggde på helbildsmedlet i stället för
    // kantfärgen.
    //
    // En tidigare version av detta test låste i stället "kamouflaget ligger
    // nära vitt". Det var fel kontrakt: när kantfärgen mättes korrekt blev
    // kamouflaget RÄTTELIGEN mörkare, och testet fällde en förbättring.
    // Närhet till vitt var aldrig kravet — närhet till FOTOT är det.
    // Scrimmets procenttal läses ur TOKENEN, inte ur en nod: testet ska
    // hålla även om komponentens lager-struktur skrivs om. Alfat
    // serialiseras som `rgba(r, g, b, a)` ELLER `color(srgb r g b / a)`
    // beroende på hur webbläsaren väljer att skriva ut color-mix-resultatet.
    const scrimFarg = await resolvedTokenColor(page, '--mm-forberedelseskarm-scrim');
    const alfaMatch = scrimFarg.match(/[/,]\s*([\d.]+)\s*\)$/);
    const scrimAlfa = alfaMatch ? Number(alfaMatch[1]) : 1;
    expect(scrimAlfa).toBeGreaterThan(0);
    expect(scrimAlfa).toBeLessThan(1);
    const forvantat = await page.evaluate(
      (procent) => {
        const probe = document.createElement('span');
        // Samma kantfärg som components.css-tokenen bär, samma procenttal som
        // scrimmet faktiskt har just nu.
        probe.style.color = `color-mix(in srgb, var(--mm-bg) ${procent}%, #888a6b)`;
        document.body.appendChild(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return c;
      },
      Math.round(scrimAlfa * 100),
    );
    expect(htmlBakgrund).toBe(forvantat);

    // contrast-more/print döljer foto+scrim → kamouflaget måste följa med,
    // annars blir rännstenen den enda tonade ytan på en i övrigt ren skärm.
    await page.emulateMedia({ contrast: 'more' });
    const underContrastMore = await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    );
    expect(underContrastMore).toBe(bg);
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
    expect(normalFill).toBe(await resolvedTokenColor(page, '--p-sage-9'));
    // Golvet gäller redan i NORMALLÄGE (sage-9, inte gold — task-273.1):
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
    expect(contrastFill).toBe(await resolvedTokenColor(page, '--p-sage-11'));
    expect(kontrastKvot(contrastFill, trackBg)).toBeGreaterThanOrEqual(4.5);
  });

  test('print: spårets outline blir synlig (samma dubbelbälte som SlideToConfirm-spåret); bakgrundsbilden döljs (task-273.6)', async ({
    page,
  }) => {
    await page.emulateMedia({ media: 'print' });
    const forstaTrack = page.locator(`${SEKTION} [role="progressbar"]`).first().locator('> div');
    const stil = await forstaTrack.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(stil).toBe('solid');

    // Foto+scrim döljs under utskrift av samma skäl som contrast-more —
    // faller tillbaka till containerns rena bg-bg, inget bläckslöseri.
    const foto = page
      .locator(SEKTION)
      .locator('[data-testid="forberedelseskarm-bakgrund"]')
      .first();
    const scrim = page.locator(SEKTION).locator('[data-testid="forberedelseskarm-scrim"]').first();
    await expect(foto).toBeHidden();
    await expect(scrim).toBeHidden();
  });
});
