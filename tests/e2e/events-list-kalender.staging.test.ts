import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/**
 * Kalendervyn till S72-facit (task-17.4).
 *
 * Facit: `tasks/sessions/bilagor/s72-event-lista-konvergens/FACIT-kalendervyn.png`
 * + `variant-B-steg3-kalendervyn-dagval.png` (Marcus: "Toppen, vi låser
 * kalendervyn här" → "Facit, vi låser hela event-listans yta", 2026-07-19).
 * Formen: vy-ikon-toggeln (lista förvald) med `?vy=kalender` i URL:en,
 * React Aria Calendar-motorn med FK-skinnet, solida dag-plattor i EXAKT
 * legendens kulör (kursfärgs-tokensen, task-17.3), likbreda dag-kolumner
 * (table-fixed), månadsnav som ersätter period-toggeln i kalenderläget,
 * månadssummeringen med kursfärgs-streck, dag-tryck → dagens event som
 * kort + toggle-avval (klick/Enter på vald dag → månaden åter); vald dag
 * bär mörk markeringsram och behåller plattans kulör; idag FK-ringmarkeras
 * runt dagssiffran (fk-referens IMG_1590). Review-våg 1 (Marcus
 * 2026-07-22): guld-plattan + "Visa hela månaden"-knappen ur S72-facitet
 * rivna ÖPPET till förmån för ram + toggle; idag-markeringen tillkom.
 *
 * AC-mappning: AC#1 = plattor/legend/vald-dag computed (L245/L246/L272);
 * AC#2 = ?vy-kontraktet + dag-flödet i e2e, begriplig annonsering, axe-0.
 *
 * Determinism: klockan pinnas till verklig "nu" (setFixedTime — hem-svitens
 * TASK-3-mönster: datum-aritmetiken kan inte glida över midnatt mitt i
 * testet; auth-tokens förblir giltiga) och eventen läggs på dagarna 14–22 i
 * INNEVARANDE månad — bandet 14–22 är alltid unikt i månads-gridden (grannmånadens
 * outside-dagar är ≥23 respektive ≤13), så dag-text-locators aldrig dubblas.
 * Datumsträngar härleds i BROWSERNS zon (Europe/Stockholm per config).
 */

const GET_EVENTS = '**/functions/v1/get-events*';

type Row = Record<string, unknown>;

/** Komplett Event-rad (EF-svarets form — EventSchema .parse:as i adaptern). */
function ev(o: {
  id: string;
  namn: string;
  startdatum: string | null;
  slutdatum?: string | null;
  ort?: string | null;
  maxPlatser?: number | null;
  antalAnmalda?: number;
  platserKvar?: number | null;
  status?: string | null;
  borOverAntal?: number;
}): Row {
  return {
    id: o.id,
    eventlabel: o.namn,
    eventNamn: o.namn,
    typ: 'Kurs',
    ort: o.ort !== undefined ? o.ort : 'Skövde',
    startdatum: o.startdatum,
    slutdatum: o.slutdatum ?? o.startdatum,
    tidKvarTillEvent: null,
    maxPlatser: o.maxPlatser ?? null,
    antalAnmalda: o.antalAnmalda ?? 0,
    platserKvar: o.platserKvar ?? null,
    anmaldBelaggning: null,
    bekraftadBelaggning: null,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: o.status ?? 'Planerat',
    // Bor över-summeringen (task-17.5): get-events returnerar ALLTID ett tal ≥0
    // → mocken speglar det (default 0). Dag-tryckets EventCard visar då raden.
    borOverAntal: o.borOverAntal ?? 0,
  };
}

/** Registrera events-mocken (senast registrerad route vinner). */
function mockEvents(page: Page, events: Row[]) {
  return page.route(GET_EVENTS, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events }),
    });
  });
}

/** Löser en CSS-custom-property till computed färg via DOM-probe (L272). */
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
 * Kalender-fixturen: pinnad klocka + tre event i innevarande månad
 * (dag-bandet 14–22): RIM 1 (grön) dag 16 · Fjärrskådning (blå) SPANN
 * 17–18 · "Annat"-uppsamlingen dag 20. Dag 15 lämnas alltid tom
 * (muted-referensen).
 */
async function kalenderFixtur(page: Page) {
  const nu = new Date();
  await page.clock.setFixedTime(nu);
  const idagStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(nu);
  const manadPrefix = idagStr.slice(0, 7); // YYYY-MM
  const ar = idagStr.slice(0, 4);
  const dag = (dd: number) => `${manadPrefix}-${String(dd).padStart(2, '0')}`;
  const manadNamn = new Intl.DateTimeFormat('sv-SE', {
    month: 'long',
    timeZone: 'Europe/Stockholm',
  }).format(nu); // "juli"
  const events: Row[] = [
    ev({
      id: 'recRIM1',
      namn: 'Resor i medvetandet 1',
      startdatum: dag(16),
      maxPlatser: 12,
      antalAnmalda: 8,
      platserKvar: 4,
    }),
    ev({
      id: 'recFJARR',
      namn: 'Fjärrskådning',
      startdatum: dag(17),
      slutdatum: dag(18),
      ort: 'Stockholm',
      maxPlatser: 10,
      antalAnmalda: 10,
      platserKvar: 0,
    }),
    ev({
      id: 'recANNAT',
      namn: 'Sommarföreläsning i parken',
      startdatum: dag(20),
      ort: 'Göteborg',
      antalAnmalda: 34,
    }),
  ];
  await mockEvents(page, events);
  return { nu, idagStr, ar, manadPrefix, manadNamn, dag };
}

/** Kalender-gridden (React Aria Calendar-motorns grid-roll). */
function gridden(page: Page) {
  return page.getByRole('grid');
}

/** Dag-plattan (RAC: styled inre div med dag-numret som text) i gridden. */
function platta(page: Page, dd: number) {
  return gridden(page).getByText(String(dd), { exact: true });
}

/** Gridcellen (td med aria-label-datumnamnet + aria-selected) för en dag.
    OBS: `has`-locatorn måste vara relativ (page-rotad), inte grid-kedjad. */
function cell(page: Page, dd: number) {
  return gridden(page)
    .getByRole('gridcell')
    .filter({ has: page.getByText(String(dd), { exact: true }) });
}

/** Vy-toggeln (radiogroup Visningsläge — ToggleButtonGroup-primitiven). */
function vyToggle(page: Page) {
  return page.getByRole('radiogroup', { name: 'Visningsläge' });
}

/** Månadssummeringens lista ("Event i <månad>"). */
function summering(page: Page, manadNamn: string) {
  return page.getByRole('list', { name: `Event i ${manadNamn}` });
}

test.describe('Kalendervyn till S72-facit (task-17.4)', () => {
  test('?vy-kontraktet: lista förvald med ren URL, toggeln skriver ?vy=kalender, direktnav + back fungerar', async ({
    page,
  }) => {
    await kalenderFixtur(page);
    await page.goto('/event');

    // Vy-ikon-toggeln: radiogroup med två ikon-piller, Listvy förvald.
    await expect(vyToggle(page)).toBeVisible();
    await expect(vyToggle(page).getByRole('radio', { name: 'Listvy' })).toBeChecked();
    await expect(vyToggle(page).getByRole('radio', { name: 'Kalendervy' })).not.toBeChecked();
    // Lista är default = ren URL (inga synliga params).
    expect(new URL(page.url()).search).toBe('');
    // Listläget: period-toggeln finns, ingen kalender.
    await expect(page.getByRole('radiogroup', { name: 'Period' })).toBeVisible();
    await expect(gridden(page)).toHaveCount(0);

    // Växling → ?vy=kalender i URL:en (delbart läge, history push).
    await vyToggle(page).getByRole('radio', { name: 'Kalendervy' }).click();
    await expect(page).toHaveURL(/[?&]vy=kalender/);
    await expect(gridden(page)).toBeVisible();
    // Månadsnavet ERSÄTTER period-toggeln i kalenderläget (PRD beslut 7).
    await expect(page.getByRole('radiogroup', { name: 'Period' })).toHaveCount(0);

    // Tillbaka till lista → parametern försvinner (ren default-URL igen).
    await vyToggle(page).getByRole('radio', { name: 'Listvy' }).click();
    expect(new URL(page.url()).search).toBe('');
    await expect(gridden(page)).toHaveCount(0);
    await expect(page.getByRole('radiogroup', { name: 'Period' })).toBeVisible();

    // Back-navigation: föregående vyval återställs (nuqs history push).
    await page.goBack();
    await expect(page).toHaveURL(/[?&]vy=kalender/);
    await expect(gridden(page)).toBeVisible();

    // Direktnavigering är delbar: ?vy=kalender återger exakt läget.
    await page.goto('/event?vy=kalender');
    await expect(gridden(page)).toBeVisible();
    await expect(vyToggle(page).getByRole('radio', { name: 'Kalendervy' })).toBeChecked();
  });

  test('månadsnavet: rubriken bär månaden, Nästa/Föregående bläddrar, summeringen följer fokusmånaden', async ({
    page,
  }) => {
    const { manadNamn, manadPrefix, ar } = await kalenderFixtur(page);
    await page.goto('/event?vy=kalender');

    // Månadsrubriken i navet: "<månad> <år>" (sv-SE; versal via CSS).
    const rubrikText = new RegExp(`${manadNamn}\\s+${ar}`, 'i');
    await expect(page.getByRole('heading', { name: rubrikText })).toBeVisible();

    // Nästa månad: rubriken byts, summeringen följer (inga event där → lugn text).
    const nastaDatum = new Date(`${manadPrefix}-15T12:00:00Z`);
    nastaDatum.setUTCMonth(nastaDatum.getUTCMonth() + 1);
    const nastaNamn = new Intl.DateTimeFormat('sv-SE', {
      month: 'long',
      timeZone: 'Europe/Stockholm',
    }).format(nastaDatum);
    // Nav-knapparna via slot (RAC bär även SR-dolda syskon-knappar med samma
    // namn); det tillgängliga namnet är svenskt (I18nProvider sv-SE).
    const nasta = page.locator('button[slot="next"]');
    await expect(nasta).toHaveAccessibleName('Nästa');
    await nasta.click();
    await expect(page.getByRole('heading', { name: new RegExp(nastaNamn, 'i') })).toBeVisible();
    await expect(page.getByText(`Inga event i ${nastaNamn}.`)).toBeVisible();

    // Föregående: tillbaka till innevarande månad — summeringens rader åter.
    const foregaende = page.locator('button[slot="previous"]');
    await expect(foregaende).toHaveAccessibleName('Föregående');
    await foregaende.click();
    await expect(page.getByRole('heading', { name: rubrikText })).toBeVisible();
    await expect(summering(page, manadNamn).getByRole('listitem')).toHaveCount(3);
  });

  test('AC#1 — dag-plattornas kulör == legendens EXAKT (computed); spannet färgas; tom dag muted', async ({
    page,
  }) => {
    const { manadNamn } = await kalenderFixtur(page);
    await page.goto('/event?vy=kalender');
    await expect(summering(page, manadNamn).getByRole('listitem')).toHaveCount(3);

    const rim1 = await resolvedTokenColor(page, '--mm-kurs-rim1');
    const fjarr = await resolvedTokenColor(page, '--mm-kurs-fjarrskadning');
    const annat = await resolvedTokenColor(page, '--mm-kurs-annat');
    const muted = await resolvedTokenColor(page, '--mm-bg-muted');
    const inverse = await resolvedTokenColor(page, '--mm-text-inverse');

    const bg = (dd: number) =>
      platta(page, dd).evaluate((el) => getComputedStyle(el).backgroundColor);

    // Solida plattor i kursens token-kulör (K12: SAMMA token som legenden).
    expect(await bg(16)).toBe(rim1);
    // Flerdagars-spannet: BÅDA dagarna färgas (fre–lör-formen).
    expect(await bg(17)).toBe(fjarr);
    expect(await bg(18)).toBe(fjarr);
    // Uppsamlingen Annat (föreläsning utanför kurs-mappningen) — grå.
    expect(await bg(20)).toBe(annat);
    // Tom dag: muted platta, aldrig en kurs-kulör.
    expect(await bg(15)).toBe(muted);

    // Plattans text: inverst vit + semibold (läsbarheten på solid 500).
    const plattStil = await platta(page, 16).evaluate((el) => {
      const s = getComputedStyle(el);
      return { color: s.color, fontWeight: s.fontWeight };
    });
    expect(plattStil).toEqual({ color: inverse, fontWeight: '600' });

    // Legenden: alla fem etiketter i facit-ordningen, prickens kulör ==
    // plattans kulör (EXAKT samma computed-värde — paritetsbeviset).
    const legend = page.getByRole('list', { name: 'Kursfärger' });
    await expect(legend.getByRole('listitem')).toHaveText([
      /Fjärrskådning/,
      /RIM 1/,
      /RIM 2/,
      /RIM 3/,
      /Annat/,
    ]);
    const prickFarg = (etikett: string) =>
      legend
        .getByRole('listitem')
        .filter({ hasText: etikett })
        .locator('[data-slot="legend-prick"]')
        .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await prickFarg('RIM 1')).toBe(await bg(16));
    expect(await prickFarg('Fjärrskådning')).toBe(await bg(17));
    expect(await prickFarg('Annat')).toBe(await bg(20));
  });

  test('månadssummeringen: kursfärgs-streck (computed), korta kursnamn, Annat bär eventnamnet, rader länkar', async ({
    page,
  }) => {
    const { manadNamn, dag } = await kalenderFixtur(page);
    await page.goto('/event?vy=kalender');

    // Summeringens rubrik är en riktig h2 med månadens namn.
    await expect(
      page.getByRole('heading', { level: 2, name: new RegExp(`^${manadNamn}$`, 'i') }),
    ).toBeVisible();

    const rader = summering(page, manadNamn).getByRole('listitem');
    await expect(rader).toHaveCount(3);

    // Kronologisk ordning + K13-copyn: korta kursnamn för kända kurser,
    // eventnamnet för Annat-uppsamlingen.
    await expect(rader.nth(0)).toContainText('RIM 1');
    await expect(rader.nth(0)).not.toContainText('Resor i medvetandet 1');
    await expect(rader.nth(1)).toContainText('Fjärrskådning');
    await expect(rader.nth(2)).toContainText('Sommarföreläsning i parken');

    // Sekundärraden: datum + ort ("veckodag 16 juli · Skövde"; spannet "17–18 juli").
    await expect(rader.nth(0)).toContainText(`16 ${manadNamn}`);
    await expect(rader.nth(0)).toContainText('Skövde');
    await expect(rader.nth(1)).toContainText(`17–18 ${manadNamn}`);

    // K14: vertikala kursfärgs-strecket bär EXAKT kursens token-kulör.
    const rim1 = await resolvedTokenColor(page, '--mm-kurs-rim1');
    const annat = await resolvedTokenColor(page, '--mm-kurs-annat');
    const streckFarg = (rad: ReturnType<typeof rader.nth>) =>
      rad
        .locator('[data-slot="kurs-streck"]')
        .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await streckFarg(rader.nth(0))).toBe(rim1);
    expect(await streckFarg(rader.nth(2))).toBe(annat);

    // Raden är länk till eventets sida.
    await expect(rader.nth(0).getByRole('link')).toHaveAttribute('href', /\/event\/recRIM1/);
    // Fixtur-sanity: dag-hjälparen byggde rätt månad (16:e finns i gridden).
    expect(dag(16).endsWith('-16')).toBe(true);
  });

  test('AC#1+#2 — dag-flödet: dag-tryck visar dagens kort, vald dag bär mörk ram med plattans kulör kvar (computed), toggle-avval åter till månaden', async ({
    page,
  }) => {
    const { manadNamn } = await kalenderFixtur(page);
    await page.goto('/event?vy=kalender');
    await expect(summering(page, manadNamn).getByRole('listitem')).toHaveCount(3);

    // Dag-tryck på spann-dagen 17 → dagens event som kort (B-formen).
    await platta(page, 17).click();
    const dagens = page.getByRole('list', { name: 'Valda dagens event' });
    await expect(dagens).toBeVisible();
    await expect(dagens.getByRole('link', { name: 'Fjärrskådning' })).toBeVisible();
    await expect(dagens).toContainText('10 av 10 platser reserverade');
    // Månadssummeringen är ersatt av dag-läget.
    await expect(summering(page, manadNamn)).toHaveCount(0);

    // Vald dag: mörk markeringsram (--mm-text i ring-skuggan) och plattan
    // BEHÅLLER kursens kulör — guld-plattan är riven (review-våg 1, Marcus
    // 2026-07-22; S72-facit-revideringen öppet bokförd i task-17.4).
    const fjarr = await resolvedTokenColor(page, '--mm-kurs-fjarrskadning');
    const mork = await resolvedTokenColor(page, '--mm-text');
    await expect(cell(page, 17)).toHaveAttribute('aria-selected', 'true');
    const valdStil = await platta(page, 17).evaluate((el) => {
      const s = getComputedStyle(el);
      return { backgroundColor: s.backgroundColor, boxShadow: s.boxShadow };
    });
    expect(valdStil.backgroundColor).toBe(fjarr);
    expect(valdStil.boxShadow).toContain(mork);

    // Toggle-avval: klick på den valda dagen igen → summeringen åter,
    // valet släppt; "Visa hela månaden"-knappen är riven.
    await platta(page, 17).click();
    await expect(summering(page, manadNamn).getByRole('listitem')).toHaveCount(3);
    await expect(dagens).toHaveCount(0);
    await expect(cell(page, 17)).not.toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('button', { name: 'Visa hela månaden' })).toHaveCount(0);
    expect(await platta(page, 17).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      fjarr,
    );
  });

  test('tangentbord: pilnavigering flyttar fokus mellan dagar, Enter väljer; tom dag ger lugn text', async ({
    page,
  }) => {
    const { manadNamn } = await kalenderFixtur(page);
    await page.goto('/event?vy=kalender');
    await expect(summering(page, manadNamn).getByRole('listitem')).toHaveCount(3);

    // Välj dag 16 med pekare, flytta med piltangent till 17 och välj med Enter.
    await platta(page, 16).click();
    await expect(cell(page, 16)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(cell(page, 17)).toHaveAttribute('aria-selected', 'true');
    const dagens = page.getByRole('list', { name: 'Valda dagens event' });
    await expect(dagens.getByRole('link', { name: 'Fjärrskådning' })).toBeVisible();

    // Tom dag via tangentbord (17 → 15): lugn strukturerad text.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Inga event denna dag.')).toBeVisible();

    // Tangentbords-toggeln: Enter på redan vald dag avmarkerar (paritet
    // med pekar-togglen — WCAG 2.1.1) → månadssummeringen åter.
    await page.keyboard.press('Enter');
    await expect(summering(page, manadNamn).getByRole('listitem')).toHaveCount(3);
  });

  test('likbreda dag-kolumner: table-fixed ger sju kolumner med samma bredd (review-våg 1-defekten)', async ({
    page,
  }) => {
    const { manadNamn } = await kalenderFixtur(page);
    await page.goto('/event?vy=kalender');
    await expect(summering(page, manadNamn).getByRole('listitem')).toHaveCount(3);

    // Utan table-fixed satte veckodags-th:arnas textbredd (mån/tis/ons …)
    // kolumnbredderna (table-layout: auto → innehållsstyrd bredd). Mät
    // första body-radens celler: alla sju likbreda (subpixel-tolerans).
    const bredder = await gridden(page)
      .locator('tbody tr')
      .first()
      .locator('td')
      .evaluateAll((celler) => celler.map((c) => c.getBoundingClientRect().width));
    expect(bredder).toHaveLength(7);
    expect(Math.max(...bredder) - Math.min(...bredder)).toBeLessThan(1.5);
  });

  test('idag FK-ringmarkeras: tunn cirkel runt dagssiffran, oberoende av plattans kulör', async ({
    page,
  }) => {
    const { manadNamn, idagStr, ar } = await kalenderFixtur(page);
    await page.goto('/event?vy=kalender');
    await expect(summering(page, manadNamn).getByRole('listitem')).toHaveCount(3);

    // Idag-plattan via sitt tillgängliga datum-namn (aria-label bär hela
    // datumet); visible-filtret väljer bort grannmånadens invisible-dubblett.
    const dd = Number(idagStr.slice(8, 10));
    const idagPlatta = gridden(page)
      .getByLabel(new RegExp(`\\b${dd} ${manadNamn} ${ar}`, 'i'))
      .filter({ visible: true });
    await expect(idagPlatta).toHaveCount(1);

    // FK-idiomet (fk-referens IMG_1590): ringen sitter på ett runt spann
    // RUNT SIFFRAN (formburen markering, inte färgburen) — ring-1 = 1px
    // ring-skugga i currentColor → kontrasten följer plattans textfärg.
    const ringSpann = idagPlatta.locator('span');
    await expect(ringSpann).toHaveText(String(dd));
    const skugga = await ringSpann.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(skugga).toMatch(/0px 0px 0px 1px/);
  });

  test('AC#2 — kalenderns dagar annonseras begripligt: grid-namn, svenska veckodagar (mån först), datum-namn på cellerna', async ({
    page,
  }) => {
    const { manadNamn, ar } = await kalenderFixtur(page);
    await page.goto('/event?vy=kalender');

    // Gridden bär ett begripligt tillgängligt namn (Eventkalender + månad).
    await expect(page.getByRole('grid', { name: /Eventkalender/ })).toBeVisible();

    // Veckodagsrubrikerna: svenska korta namn, måndag först (sv-SE-veckan).
    // Raden är aria-hidden per react-aria-mönstret (cellernas fullständiga
    // datum-namn bär skärmläsarens karta) — därför th-locator, inte roll.
    await expect(gridden(page).locator('th')).toHaveText([
      /mån/i,
      /tis/i,
      /ons/i,
      /tors?/i,
      /fre/i,
      /lör/i,
      /sön/i,
    ]);

    // Dag-plattan (fokus-elementet) annonserar hela datumet på svenska —
    // inte bara siffran (RAC: aria-label på det fokuserbara cell-innehållet).
    const namn = await platta(page, 16).getAttribute('aria-label');
    expect(namn).toMatch(new RegExp(`16 ${manadNamn} ${ar}`, 'i'));
  });

  test('axe 0 violations på den renderade kalendervyn (facit-läget)', async ({ page }) => {
    const { manadNamn } = await kalenderFixtur(page);
    await page.goto('/event?vy=kalender');
    // Gate axe på FULLT renderad kalender (T26-mönstret): grid + summering.
    await expect(gridden(page)).toBeVisible();
    await expect(summering(page, manadNamn).getByRole('listitem')).toHaveCount(3);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
