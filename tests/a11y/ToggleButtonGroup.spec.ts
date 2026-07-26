import type { Locator, Page } from '@playwright/test';
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

/**
 * Löser en CSS-custom-property till computed färg via en DOM-probe.
 *
 * Proben tas UR flödet (`position: absolute` + dolt) — annars kan den knuffa
 * sidans höjd över scrollbar-tröskeln, layouten hoppa i sidled och ett pågående
 * hover-test tappa muspekaren från sitt element. Det gav ett svårläst,
 * last-beroende rött i hover-sviten innan proben isolerades (S91).
 */
async function resolvedTokenColor(page: Page, tokenNamn: string): Promise<string> {
  return page.evaluate((namn) => {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;top:0;left:0;visibility:hidden;pointer-events:none';
    probe.style.color = `var(${namn})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, tokenNamn);
}

/**
 * Färg-matematik i Node — sidan lämnar bara RÅA computed-strängar, all
 * tolkning sker här. Hover-plattan är ett genomskinligt skrim, så det
 * användaren ser är skrimmet KOMPOSITERAT över tracket; att jämföra
 * rgba-värdet rakt av vore ett falskt facit.
 *
 * Parsern normaliserar båda formerna Chrome lämnar: `rgb()/rgba()` med
 * 0–255-kanaler och `color(srgb r g b / a)` med 0–1-kanaler (`color-mix()`
 * beräknas till den senare).
 */
function kanaler(v: string): { rgb: number[]; a: number } {
  const delar = (v.match(/[\d.]+/g) ?? []).map(Number);
  if (delar.length < 3) throw new Error(`Ej tolkbar färg: ${v}`);
  const skala = v.startsWith('color(') ? 255 : 1;
  return { rgb: delar.slice(0, 3).map((k) => k * skala), a: delar.length > 3 ? delar[3] : 1 };
}

/** Lägger `ovan` (ev. genomskinlig) på `under` (antas opak) → opak rgb. */
function komposit(ovan: string, under: string): number[] {
  const o = kanaler(ovan);
  const u = kanaler(under);
  return [0, 1, 2].map((i) => o.a * o.rgb[i] + (1 - o.a) * u.rgb[i]);
}

function relativLuminans(rgb: number[]): number {
  const [r, g, b] = rgb
    .map((k) => k / 255)
    .map((k) => (k <= 0.04045 ? k / 12.92 : ((k + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function kontrast(a: number[], b: number[]): number {
  const [hi, lo] = [relativLuminans(a), relativLuminans(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Hovrar pillen och håller kvar tills bakgrunden STÅR STILLA på `forvantadBg`.
 *
 * Hela blocket körs under `toPass`, alltså MED OM-HOVRING vid varje försök.
 * Skälet är empiriskt (S91, stresskörning 4 workers × 6 repeats): en enkel
 * `hover()` + assertion tappade ibland hovern igen — spårade värden gick
 * `oklab(…/0.06) → oklab(…/0.058) → oklab(…/0.018) → rgba(0,0,0,0)`, alltså en
 * fade-UT: pekaren hamnade utanför pillen när sidan la om sig efter hovern
 * (font-laddning/hydrering under last). Ett engångs-`hover()` kan inte laga
 * det — bara ett nytt hover kan.
 *
 * Assertionen mot det resolverade token-värdet fångar dessutom transitionens
 * SLUT gratis: medan den löper rapporterar Chrome interpolerade oklab-värden,
 * och först när den är klar står det deklarerade `color(srgb …)`. En
 * "alfa > 0"-poll mätte i stället en platta mitt i intoningen.
 */
async function hovraTills(pill: Locator, forvantadBg: string): Promise<void> {
  await expect(async () => {
    await pill.hover();
    await expect(pill).toHaveAttribute('data-hovered', 'true', { timeout: 2_000 });
    await expect(pill).toHaveCSS('background-color', forvantadBg, { timeout: 2_000 });
  }).toPass({ timeout: 25_000 });
}

/**
 * Hovrar pillen, väntar tills skrimmet ligger färdigt på och lämnar tillbaka
 * gruppens råa computed-färger.
 *
 * Token-värdet hämtas FÖRE hovern: probe-elementet rör DOM:en, och att göra
 * det med muspekaren redan placerad kan slå bort hovern.
 */
async function hovraOchMat(page: Page, gruppNamn: string, pillNamn: string) {
  const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: gruppNamn });
  const pill = grupp.getByRole('radio', { name: pillNamn });
  const skrim = await resolvedTokenColor(page, '--mm-state-hover');
  await hovraTills(pill, skrim);
  const rat = await grupp.evaluate((gruppEl) => {
    const pillar = [...gruppEl.querySelectorAll('[role="radio"]')] as HTMLElement[];
    const hovrad = pillar.find((p) => p.hasAttribute('data-hovered'));
    const vald = pillar.find((p) => p.hasAttribute('data-selected'));
    if (!hovrad) throw new Error('Ingen hovrad pill');
    return {
      track: getComputedStyle(gruppEl).backgroundColor,
      platta: getComputedStyle(hovrad).backgroundColor,
      etikett: getComputedStyle(hovrad).color,
      vald: vald ? getComputedStyle(vald).backgroundColor : null,
    };
  });
  return { grupp, pill, rat };
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

  test('rörelse-kontraktet: ENDAST background-color övergår, och reduced-motion nollar den', async ({
    page,
  }) => {
    const pill = page
      .locator(SEKTION)
      .getByRole('radiogroup', { name: 'Period' })
      .getByRole('radio', { name: 'Kommande' });
    const vila = await pill.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        animation: s.animationName,
        egenskap: s.transitionProperty,
        duration: s.transitionDuration,
      };
    });
    // Ingen animation — pillen rör sig inte av sig själv.
    expect(vila.animation).toBe('none');
    // Övergången är hover-plattans, och BARA den. Tailwinds breda
    // `transition-colors` hade dragit med `outline-color` och tonat in den
    // globala fokusringen över 150 ms — fokusindikatorn ska stå direkt
    // (ringens färg låses i fokus-testet ovan).
    expect(vila.egenskap).toBe('background-color');
    expect(Number.parseFloat(vila.duration)).toBeGreaterThan(0);

    // Under prefers-reduced-motion gäller base.css-neutraliseringen (≤0,01 ms).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducerad = await pill.evaluate(
      (el) => Number.parseFloat(getComputedStyle(el).transitionDuration) || 0,
    );
    expect(reducerad).toBeLessThanOrEqual(0.001);
  });

  test('print: track och vald etikett förblir synliga', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: 'Period' });
    await expect(grupp).toBeVisible();
    await expect(grupp.getByRole('radio', { name: 'Kommande' })).toBeVisible();
  });
});

/**
 * Hover-återkoppling (Marcus design-review 2026-07-26, S91).
 *
 * Hover är inte ett TILLSTÅND utan ÅTERKOPPLING på att ytan går att klicka.
 * Kontraktet som vaktas här: ovald pill får plattan, vald pill står orörd,
 * disabled får ingenting, touch får ingenting, och tangentbordet får sin
 * likvärdiga återkoppling ur fokusringen — inte ur hover-plattan.
 */
test.describe('ToggleButtonGroup — hover-återkoppling (pekarens affordans)', () => {
  const FILTER = 'Deltagarfilter';

  test('ovald pill: hover tänder skrim-plattan och släcker den vid utgång', async ({ page }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: FILTER });
    const ovald = grupp.getByRole('radio', { name: 'Medföljande' });
    // Token-uppslaget FÖRE hovern — proben rör DOM:en (se resolvedTokenColor).
    const skrim = await resolvedTokenColor(page, '--mm-state-hover');
    await expect(ovald).toHaveAttribute('aria-checked', 'false');
    await expect(ovald).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    await hovraTills(ovald, skrim);

    // Ut ur gruppen igen — plattan är återkoppling, inte ett kvarstående läge.
    await page.mouse.move(0, 0);
    await expect(ovald).not.toHaveAttribute('data-hovered', 'true');
    await expect(ovald).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('vald pill står ORÖRD vid hover (annars suddas vald/muspekaren-här)', async ({ page }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: FILTER });
    const vald = grupp.getByRole('radio', { name: 'Alla' });
    const valdYta = await resolvedTokenColor(page, '--mm-bg');
    await expect(vald).toHaveAttribute('aria-checked', 'true');
    await expect(vald).toHaveCSS('background-color', valdYta);

    // React Aria sätter attributet även på vald pill — det är CSS-regelns
    // not-data-[selected] som håller ytan stilla, inte frånvaro av hover.
    // Att attributet FAKTISKT står är hela poängen: annars vore testet grönt
    // av fel skäl (ingen hover alls) i stället för av rätt (hover utan platta).
    // Förväntad bakgrund är därför OFÖRÄNDRAD vald-yta, med hovern bevisad.
    await hovraTills(vald, valdYta);
  });

  test('disabled pill får ALDRIG hover-återkoppling', async ({ page }) => {
    const inaktiv = page
      .locator(SEKTION)
      .getByRole('radiogroup', { name: 'Inaktiverad demo' })
      .getByRole('radio', { name: 'På' });
    await expect(inaktiv).toBeDisabled();
    await expect(inaktiv).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    await inaktiv.hover({ force: true });
    // RAC kopplar bort useHover när knappen är disabled → attributet uppstår
    // aldrig, så plattan är omöjlig även om en override skulle glida bort.
    await expect(inaktiv).not.toHaveAttribute('data-hovered', 'true');
    await expect(inaktiv).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('touch ger ingen hover: pekartypen filtreras i React Arias useHover', async ({ page }) => {
    const ovald = page
      .locator(SEKTION)
      .getByRole('radiogroup', { name: FILTER })
      .getByRole('radio', { name: 'Medföljande' });

    // POSITIV KONTROLL FÖRST: bevisa att just DENNA pill tänder på mus. Utan
    // den kan negationen nedan bli grön av fel skäl — en yta som aldrig
    // hovras alls "klarar" annars touch-testet.
    await hovraTills(ovald, await resolvedTokenColor(page, '--mm-state-hover'));
    await page.mouse.move(0, 0);
    await expect(ovald).not.toHaveAttribute('data-hovered', 'true');

    // Samma pill, men pekartypen är touch → useHover returnerar tidigt.
    await ovald.evaluate((el) => {
      for (const typ of ['pointerenter', 'pointerover']) {
        el.dispatchEvent(
          new PointerEvent(typ, { pointerType: 'touch', bubbles: true, composed: true }),
        );
      }
    });

    await expect(ovald).not.toHaveAttribute('data-hovered', 'true');
    await expect(ovald).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('tangentbordet får sin återkoppling ur fokusringen, inte ur hover-plattan', async ({
    page,
  }) => {
    const grupp = page.locator(SEKTION).getByRole('radiogroup', { name: FILTER });
    const vald = grupp.getByRole('radio', { name: 'Alla' });
    const ovald = grupp.getByRole('radio', { name: 'Manuellt tillagda' });

    await vald.focus();
    await page.keyboard.press('ArrowRight');
    await expect(ovald).toBeFocused();
    // Fokusringen står (låst i fokus-testet ovan) men ytan är oförändrad —
    // kanalerna är åtskilda, inte dubblerade.
    await expect(ovald).not.toHaveAttribute('data-hovered', 'true');
    await expect(ovald).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('prefers-contrast: more växlar till den starkare skrim-plattan', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' });
    const ovald = page
      .locator(SEKTION)
      .getByRole('radiogroup', { name: FILTER })
      .getByRole('radio', { name: 'Medföljande' });

    // Båda token-uppslagen FÖRE hovern — proben rör DOM:en.
    const starkt = await resolvedTokenColor(page, '--mm-state-hover-contrast');
    const normalt = await resolvedTokenColor(page, '--mm-state-hover');
    expect(starkt).not.toBe(normalt);

    await hovraTills(ovald, starkt);
  });

  test('kontrast: etiketten håller AA på hover-plattan, och plattan skiljer sig från både track och vald pill', async ({
    page,
  }) => {
    const { rat } = await hovraOchMat(page, FILTER, 'Medföljande');
    if (!rat.vald) throw new Error('Hittade ingen vald pill');

    const track = kanaler(rat.track).rgb;
    const platta = komposit(rat.platta, rat.track);
    const etikett = komposit(rat.etikett, `rgb(${platta.join(',')})`);
    const valdYta = komposit(rat.vald, rat.track);
    const skiljer = (a: number[], b: number[]) => [0, 1, 2].some((i) => Math.abs(a[i] - b[i]) >= 1);

    // Texten på plattan: WCAG 2.2 AA för normal text (≥4,5:1). Uppmätt ≈6,45:1.
    expect(kontrast(etikett, platta)).toBeGreaterThanOrEqual(4.5);
    // Plattan får ALDRIG kollapsa ihop med tracket (regressionsvakten för
    // S91-fyndet: en opak platta försvann på Betalningars egna track) eller
    // med valda pillen.
    expect(skiljer(platta, track)).toBe(true);
    expect(skiljer(platta, valdYta)).toBe(true);
    // Plattan ska stå MINST lika tydligt mot tracket som valda pillen gör —
    // komponentens egen, godkända urskiljningsnivå är golvet.
    expect(kontrast(platta, track)).toBeGreaterThanOrEqual(kontrast(valdYta, track) * 0.95);
  });

  test('spårets färg ägs av konsumenten: plattan håller sitt steg även på ett OMSTÄLLT track', async ({
    page,
  }) => {
    // Betalningar sätter `bg-bg-emphasized` på sitt track via className, och
    // demo-ytan "Omställt track" speglar exakt det. Skrimmet ska ge samma
    // perceptuella steg där som mot standard-tracket — en OPAK platta gjorde
    // det inte (S91: hovern försvann helt på den ytan, uppmätt kvot 1,000).
    const steg = (rat: { track: string; platta: string }) =>
      kontrast(komposit(rat.platta, rat.track), kanaler(rat.track).rgb);

    const standard = await hovraOchMat(page, FILTER, 'Medföljande');
    await page.mouse.move(0, 0);
    const omstallt = await hovraOchMat(page, 'Omställt track', 'Klara');

    // Förutsättningen: tracken bär OLIKA toner (annars provar testet ingenting).
    expect(omstallt.rat.track).not.toBe(standard.rat.track);
    expect(omstallt.rat.track).toBe(await resolvedTokenColor(page, '--mm-bg-emphasized'));

    // Skrimmet ger ett verkligt steg på BÅDA, och stegen ligger inom ±15 %.
    expect(steg(omstallt.rat)).toBeGreaterThan(1.02);
    expect(Math.abs(steg(omstallt.rat) - steg(standard.rat)) / steg(standard.rat)).toBeLessThan(
      0.15,
    );
  });
});
