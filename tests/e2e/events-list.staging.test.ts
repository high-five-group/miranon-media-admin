import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route, test } from '../support/test-bas';

/**
 * Event-listan till S72-facit (task-17.2) — listvyn ände-till-ände.
 *
 * Facit: `tasks/sessions/bilagor/s72-event-lista-konvergens/FACIT-listvyn.png`
 * (Marcus: "Facit, vi låser hela event-listans yta", 2026-07-19). Formen:
 * period-toggeln [Kommande|Tidigare] via ToggleButtonGroup-primitiven,
 * månadsgrupprubriker, likformiga slot-kort (B-kortens grammatik),
 * strukturerat text-tomläge och Lugnt laddläge.
 *
 * URL-kontraktet: `?period=upcoming|past` ERSÄTTER gamla `?status`+`?sort`
 * (URL-STATE-SPEC §Event; ORDLISTA "Period"). Period härleds ur startdatum
 * mot idag — ALDRIG ur Status-fältet (stänger T14 tekniskt): ett inställt
 * event i framtiden är Kommande + Inställt.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt). Deterministisk via `page.route`-interception av
 * get-events (fasta datum 2099/2000 → period-filtret stabilt oavsett körtid).
 * Visuella facit-krav bevisas COMPUTED (L245/L246/L272) — aldrig enbart
 * källkodsläsning.
 */

const GET_EVENTS = '**/functions/v1/get-events*';
const GET_EVENT_FORMATS = '**/functions/v1/get-event-formats*';
const PERSIST_KEY = 'REACT_QUERY_OFFLINE_CACHE';

type Row = Record<string, unknown>;

/** Komplett Event-rad (EF-svarets form — EventSchema .parse:as i adaptern). */
function ev(o: {
  id: string;
  namn: string;
  startdatum: string | null;
  slutdatum?: string | null;
  typ?: string | null;
  ort?: string | null;
  maxPlatser?: number | null;
  antalAnmalda?: number;
  platserKvar?: number | null;
  anmaldBelaggning?: number | null;
  status?: string | null;
  borOverAntal?: number;
}): Row {
  return {
    id: o.id,
    eventlabel: o.namn,
    eventNamn: o.namn,
    typ: o.typ !== undefined ? o.typ : 'Kurs',
    ort: o.ort !== undefined ? o.ort : 'Skövde',
    startdatum: o.startdatum,
    slutdatum: o.slutdatum ?? o.startdatum,
    tidKvarTillEvent: null,
    maxPlatser: o.maxPlatser ?? null,
    antalAnmalda: o.antalAnmalda ?? 0,
    platserKvar: o.platserKvar ?? null,
    anmaldBelaggning: o.anmaldBelaggning ?? null,
    bekraftadBelaggning: o.anmaldBelaggning ?? null,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: o.status ?? 'Planerat',
    // Bor över-summeringen (task-17.5): get-events returnerar ALLTID ett tal ≥0
    // (härlett per event) → mocken speglar det (default 0 = noll-fallet).
    borOverAntal: o.borOverAntal ?? 0,
  };
}

/**
 * Fem kommande (mars ×2, juni, augusti ×2 2099) + två tidigare (nov + jan
 * 2000): månadsgrupper, fullbokat, Inställt-i-framtiden (axlarna korsar
 * fritt), Flyttat, platser-ej-satt + ort-lös (platshållar-raderna).
 */
const EVENTS: Row[] = [
  ev({
    id: 'recUPP1',
    namn: 'Grundkurs i medvetande',
    startdatum: '2099-03-05',
    slutdatum: '2099-03-06',
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 8 / 12,
    borOverAntal: 3, // bor över-radens antal-fall (task-17.5)
  }),
  ev({
    id: 'recFULL',
    namn: 'Fjärrskådning fördjupning',
    startdatum: '2099-03-20',
    maxPlatser: 10,
    antalAnmalda: 10,
    platserKvar: 0,
    anmaldBelaggning: 1,
  }),
  ev({
    id: 'recINST',
    namn: 'Sommarkurs i närvaro',
    startdatum: '2099-06-10',
    maxPlatser: 12,
    antalAnmalda: 3,
    platserKvar: 9,
    anmaldBelaggning: 3 / 12,
    status: 'Inställt',
  }),
  ev({
    id: 'recFLYTT',
    namn: 'Psionautics intro',
    startdatum: '2099-08-15',
    maxPlatser: 16,
    antalAnmalda: 5,
    platserKvar: 11,
    anmaldBelaggning: 5 / 16,
    status: 'Flyttat',
  }),
  ev({
    id: 'recUTAN',
    namn: 'Föreläsning: Medveten kontakt',
    startdatum: '2099-08-30',
    ort: null,
    antalAnmalda: 34,
  }),
  ev({
    id: 'recPAST1',
    namn: 'Höstkurs i medvetande',
    startdatum: '2000-11-10',
    maxPlatser: 12,
    antalAnmalda: 9,
    platserKvar: 3,
    anmaldBelaggning: 0.75,
    status: 'Genomfört',
  }),
  ev({
    id: 'recPAST2',
    namn: 'Vinterkurs i närvaro',
    startdatum: '2000-01-05',
    maxPlatser: 12,
    antalAnmalda: 12,
    platserKvar: 0,
    anmaldBelaggning: 1,
    status: 'Genomfört',
  }),
];

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

/** Håll-bar mock (task-4.5-mönstret): parkerar svaret tills testet släpper. */
function hallbarMock(page: Page, events: Row[]) {
  const st = {
    hall: true,
    parkerade: [] as Route[],
    async slappAlla() {
      const rutter = this.parkerade.splice(0);
      for (const rutt of rutter) {
        await rutt.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ events }),
        });
      }
    },
  };
  return page
    .route(GET_EVENTS, async (rutt) => {
      if (st.hall) {
        st.parkerade.push(rutt);
        return;
      }
      await rutt.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events }),
      });
    })
    .then(() => st);
}

/** Tom cache-arrangemang (ADR-072): persist-nyckeln bort FÖRE app-boot. */
function arrangeraTomCache(page: Page) {
  return page.addInitScript((nyckel) => localStorage.removeItem(nyckel), PERSIST_KEY);
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

/** Samtliga event-kort — scopat till månadsgruppernas listor ("Event <Månad>");
    sidan kan bära andra listor (t.ex. dev-verktygens) som inte är kort. */
function eventItems(page: Page) {
  return page.getByRole('list', { name: /^Event / }).getByRole('listitem');
}

/** Kortet (listitem i en månadsgrupp) som innehåller given text. */
function kort(page: Page, text: string) {
  return eventItems(page).filter({ hasText: text });
}

/** Status-slotten (pillen topp-höger) i ett kort. */
function slot(kortet: ReturnType<Page['getByRole']>) {
  return kortet.locator('[data-slot="status"]');
}

test.describe('Event-listan till S72-facit (task-17.2)', () => {
  test('?period-kontraktet: default utan param, växling skriver ?period=past, back-navigation återställer', async ({
    page,
  }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event');

    // Period-toggeln är primitivens radiogroup — Kommande förvald.
    const toggle = page.getByRole('radiogroup', { name: 'Period' });
    await expect(toggle).toBeVisible();
    await expect(toggle.getByRole('radio', { name: 'Kommande' })).toBeChecked();
    // Default = ren URL (inga synliga params).
    expect(new URL(page.url()).search).toBe('');

    // Kommande: närmast först — Grundkurs (mars) före Fullbokat (mars) osv.
    const lista = page.getByRole('list', { name: /^Event / }).first();
    await expect(lista.getByRole('link').first()).toHaveText('Grundkurs i medvetande');
    await expect(eventItems(page)).toHaveCount(5);

    // Växling → ?period=past i URL:en (delbart läge, history push).
    await toggle.getByRole('radio', { name: 'Tidigare' }).click();
    await expect(page).toHaveURL(/[?&]period=past/);
    await expect(toggle.getByRole('radio', { name: 'Tidigare' })).toBeChecked();

    // Tidigare: senast först — Höstkurs (nov 2000) före Vinterkurs (jan 2000).
    await expect(eventItems(page)).toHaveCount(2);
    const namn = page.getByRole('list', { name: /^Event / }).getByRole('link');
    await expect(namn.nth(0)).toHaveText('Höstkurs i medvetande');
    await expect(namn.nth(1)).toHaveText('Vinterkurs i närvaro');

    // Skärmläsaren får växlings-bekräftelsen (aria-live).
    await expect(page.getByText(/Visar tidigare event/)).toHaveCount(1);

    // Back-navigation: föregående läge återställs (nuqs history push).
    await page.goBack();
    await expect(toggle.getByRole('radio', { name: 'Kommande' })).toBeChecked();
    await expect(eventItems(page)).toHaveCount(5);
  });

  test('?period=past är delbar: direktnavigering återger exakt läget', async ({ page }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event?period=past');

    const toggle = page.getByRole('radiogroup', { name: 'Period' });
    await expect(toggle.getByRole('radio', { name: 'Tidigare' })).toBeChecked();
    await expect(eventItems(page)).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'November 2000' })).toBeVisible();
  });

  test('gamla kontraktet är borta: ?status/?sort ignoreras och Selecterna finns inte', async ({
    page,
  }) => {
    await mockEvents(page, EVENTS);
    // Gamla URL-formen får inte styra något: default-läget renderas ändå.
    await page.goto('/event?status=past&sort=name');

    await expect(page.getByRole('radiogroup', { name: 'Period' })).toBeVisible();
    await expect(
      page.getByRole('radiogroup', { name: 'Period' }).getByRole('radio', { name: 'Kommande' }),
    ).toBeChecked();
    // Kommande-innehåll i datumordning (inte past, inte namnsort) = params döda.
    await expect(eventItems(page)).toHaveCount(5);
    await expect(
      page
        .getByRole('list', { name: /^Event / })
        .getByRole('link')
        .first(),
    ).toHaveText('Grundkurs i medvetande');
    // Select-kontrollerna ("Visa"/"Sortera efter") existerar inte längre.
    // Exakt namn-match (task-17.7): filtervyns tratt-knapp heter "Visa filter"
    // och får inte träffas av det gamla kontrollnamnets vakt.
    await expect(page.getByRole('button', { name: /Sortera efter/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Visa', exact: true })).toHaveCount(0);
  });

  test('månadsgrupperna: riktiga rubriker i tillgänglighetsträdet, kronologisk ordning, korten under rätt månad', async ({
    page,
  }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event');

    // Rubrikhierarkin: h1 "Event" → h2 per månad (riktiga heading-noder).
    await expect(page.getByRole('heading', { level: 1, name: 'Event' })).toBeVisible();
    const manader = page.getByRole('heading', { level: 2 });
    await expect(manader).toHaveText(['Mars 2099', 'Juni 2099', 'Augusti 2099']);

    // Varje grupp är en egen lista med månadens kort.
    const mars = page.getByRole('list', { name: 'Event Mars 2099' });
    await expect(mars.getByRole('listitem')).toHaveCount(2);
    const augusti = page.getByRole('list', { name: 'Event Augusti 2099' });
    await expect(augusti.getByRole('listitem')).toHaveCount(2);

    // Tidigare-läget: egna månadsgrupper, senast först.
    await page
      .getByRole('radiogroup', { name: 'Period' })
      .getByRole('radio', { name: 'Tidigare' })
      .click();
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'November 2000',
      'Januari 2000',
    ]);
  });

  test('slot-korten är likformiga: 2-raders rubrik-reserv, alla rader alltid, platshållare vid saknat värde', async ({
    page,
  }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event');
    // TASK-236 (218.3-regression): FÖRSTA renderingen på en fräsch, kall
    // chromium-authenticated-kontext går genom hela warmup-gaten
    // (ADR-112/main.tsx InnerApp) — default-timeouten (5000ms) räcker inte
    // längre. Samma mönster som persist-cache.staging.test.ts:s fix.
    await expect(eventItems(page)).toHaveCount(5, { timeout: 12_000 });

    // Rubriken reserverar EXAKT 2 rader (min-height = 2lh) på VARJE kort —
    // computed (L245): text-body 16px × 1.5 = 24px per rad → 48px.
    for (const namn of ['Grundkurs i medvetande', 'Psionautics intro']) {
      const rubrik = page.getByRole('link', { name: namn });
      const minHeight = await rubrik.evaluate((el) => getComputedStyle(el).minHeight);
      expect(minHeight, `${namn}: 2-raders rubrik-reserv`).toBe('48px');
    }

    // Alla rader alltid (slot-modellen): ort-lösa kortet visar platshållare …
    const utan = kort(page, 'Föreläsning: Medveten kontakt');
    await expect(utan).toContainText('Ort ej satt');
    // … och tak-löst kort bär text-formen + stapel-SPÅRET (tom fyllnad).
    await expect(utan).toContainText('34 anmälda (platser ej satt)');
    const utanFyllnad = utan.locator('[data-slot="belaggning-fyllnad"]');
    expect(await utanFyllnad.evaluate((el) => getComputedStyle(el).width)).toBe('0px');

    // Normalkortet: beläggningstext + fylld stapel.
    const grund = kort(page, 'Grundkurs i medvetande');
    await expect(grund).toContainText('8 av 12 platser reserverade');
    const fyllnad = grund.locator('[data-slot="belaggning-fyllnad"]');
    expect(
      Number.parseFloat(await fyllnad.evaluate((el) => getComputedStyle(el).width)),
    ).toBeGreaterThan(0);

    // Status-slotten: dagar-kvar-pill på kommande utan avvikelse …
    await expect(slot(grund)).toHaveText(/\d+ dagar kvar$/);

    // … men ALDRIG på tidigare (ingen nedräkning bakåt; Genomfört är tyst).
    await page
      .getByRole('radiogroup', { name: 'Period' })
      .getByRole('radio', { name: 'Tidigare' })
      .click();
    const past = kort(page, 'Höstkurs i medvetande');
    await expect(past).toBeVisible();
    await expect(slot(past)).toHaveCount(0);
    await expect(past).not.toContainText('Genomfört');
  });

  test('bor över-raden per facit (task-17.5): säng-rad på VARJE kort, antal + noll-platshållare', async ({
    page,
  }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event');
    await expect(eventItems(page)).toHaveCount(5);

    // Slot-modellen (AC #2 + review-våg 1): bor över-raden renderas på VARJE
    // kort (reserverad — kort med och utan bor över är likhöga), aldrig
    // villkorligt dold. Räknar raden på alla fem månadsgrupp-korten.
    await expect(eventItems(page).locator('[data-slot="bor-over"]')).toHaveCount(5);

    // Antalet bärs av TEXTEN (säng-glyfen är dekor, aria-hidden): Grundkurs
    // har 3 ikryssade → "3 bor över" med exakt en dekor-ikon.
    const grund = kort(page, 'Grundkurs i medvetande');
    await expect(grund.locator('[data-slot="bor-over"]')).toHaveText('3 bor över');
    await expect(grund.locator('[data-slot="bor-over"] svg[aria-hidden="true"]')).toHaveCount(1);

    // Noll-platshållaren (AC #2): ett event utan kryss visar "0 bor över" —
    // raden renderas ändå (0 är ett definit värde, inte "dölj raden").
    const noll = kort(page, 'Föreläsning: Medveten kontakt');
    await expect(noll.locator('[data-slot="bor-over"]')).toHaveText('0 bor över');
  });

  test('avvikelse-markeringarna per facit: Inställt dämpat + genomstruket, Flyttat i varselfärg — computed', async ({
    page,
  }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event');

    // Inställt (kommande + Inställt — axlarna korsar fritt, T14): slotten
    // bär texten i error-färgen; kortet dämpat; rubriken genomstruken.
    // Dämpningen är TEXT-TOKEN-buren (muted, AA-säkrad) + opacity endast på
    // dekor — prototypens kort-opacity drog texterna under AA (axe-fångst,
    // öppet bokförd facit-avvikelse i task-17.2).
    const installt = kort(page, 'Sommarkurs i närvaro');
    // TASK-236 (218.3-regression): se "slot-korten"-testets kommentar ovan
    // (rad ~331) — samma warmup-gate-fördröjning på en fräsch kall kontext.
    await expect(slot(installt)).toHaveText('Inställt', { timeout: 12_000 });
    expect(await slot(installt).evaluate((el) => getComputedStyle(el).color)).toBe(
      await resolvedTokenColor(page, '--mm-error'),
    );
    expect(await installt.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    expect(await installt.getByRole('link').evaluate((el) => getComputedStyle(el).color)).toBe(
      await resolvedTokenColor(page, '--mm-text-muted'),
    );
    expect(
      await installt.getByRole('link').evaluate((el) => getComputedStyle(el).textDecorationLine),
    ).toBe('line-through');
    // Dekoren (stapel-spåret) bär dämpnings-opaciteten.
    expect(
      await installt
        .locator('[data-slot="belaggning-fyllnad"]')
        .evaluate((el) => getComputedStyle(el.parentElement as Element).opacity),
    ).toBe('0.6');

    // Flyttat: slot-texten i varselfärgen; kortet ODÄMPAT, rubriken hel.
    const flyttat = kort(page, 'Psionautics intro');
    await expect(slot(flyttat)).toHaveText('Flyttat');
    expect(await slot(flyttat).evaluate((el) => getComputedStyle(el).color)).toBe(
      await resolvedTokenColor(page, '--mm-warning'),
    );
    expect(await flyttat.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    expect(
      await flyttat.getByRole('link').evaluate((el) => getComputedStyle(el).textDecorationLine),
    ).toBe('none');

    // Planerat är TYST: ingen statustext — bara dagar-kvar-pillen.
    const tyst = kort(page, 'Grundkurs i medvetande');
    await expect(tyst).not.toContainText('Planerat');
  });

  test('Fullbokat per facit: grön kontur + grön stapel (computed); texten bär tillståndet', async ({
    page,
  }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event');

    const success = await resolvedTokenColor(page, '--mm-success');
    const full = kort(page, 'Fjärrskådning fördjupning');
    await expect(full).toContainText('10 av 10 platser reserverade');
    expect(await full.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(success);
    expect(
      await full
        .locator('[data-slot="belaggning-fyllnad"]')
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe(success);

    // Icke-fullt kort: transparent kontur (ingen grön), dämpad grå fyllnad.
    const grund = kort(page, 'Grundkurs i medvetande');
    expect(await grund.evaluate((el) => getComputedStyle(el).borderTopColor)).not.toBe(success);
    expect(
      await grund
        .locator('[data-slot="belaggning-fyllnad"]')
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe(success);
  });

  test('tomläget: lugn strukturerad text per facit — båda perioderna', async ({ page }) => {
    await mockEvents(page, []);
    await page.goto('/event');

    await expect(page.getByText('Inga kommande event')).toBeVisible();
    await expect(page.getByText('Event du planerar dyker upp här.')).toBeVisible();

    await page
      .getByRole('radiogroup', { name: 'Period' })
      .getByRole('radio', { name: 'Tidigare' })
      .click();
    await expect(page.getByText('Inga tidigare event')).toBeVisible();
    await expect(page.getByText('Genomförda event dyker upp här.')).toBeVisible();
  });

  test('Lugnt laddläge: rubrik + toggle i slutgeometri från första bildrutan; datalandningen flyttar ingenting', async ({
    page,
  }) => {
    await arrangeraTomCache(page);
    const mocken = await hallbarMock(page, EVENTS);
    await page.goto('/event');

    // Riktiga kontroller DIREKT medan svaret är parkerat: h1 + period-toggeln.
    // TASK-236 (218.3-regression): rubriken monteras INTE förrän hela
    // warmup-gaten (main.tsx InnerApp) släppt — parkeringen ovan gäller bara
    // get-events, inte de fem övriga warmup-posterna mot RIKTIG staging.
    await expect(page.getByRole('heading', { level: 1, name: 'Event' })).toBeVisible({
      timeout: 12_000,
    });
    const toggle = page.getByRole('radiogroup', { name: 'Period' });
    await expect(toggle).toBeVisible();

    // Laddande container: role=status + aria-busy + sr-only-besked
    // (Roselli-mönstret); blocken dekorativa; ingen spinner, ingen synlig
    // "Laddar…"-textrad (beskedet är 1×1 sr-only).
    const laddare = page.locator('main#main').getByRole('status');
    await expect(laddare).toHaveAttribute('aria-busy', 'true');
    await expect(laddare.locator('span[aria-hidden="true"]').first()).toBeVisible();
    const besked = page.getByText(/^Laddar event/);
    await expect(besked).toHaveCount(1);
    const beskedStil = await besked.evaluate((n) => {
      const s = getComputedStyle(n);
      return { position: s.position, width: s.width, height: s.height };
    });
    expect(beskedStil).toEqual({ position: 'absolute', width: '1px', height: '1px' });
    await expect(page.getByRole('progressbar')).toHaveCount(0);

    // Mät-stillhet (L246: neutralisera pekaren först): h1 + toggle står
    // EXAKT still när datat landar — listan öppnar utan hopp (story 14).
    await page.mouse.move(0, 0);
    const h1Box = await page.getByRole('heading', { level: 1, name: 'Event' }).boundingBox();
    const toggleBox = await toggle.boundingBox();

    mocken.hall = false;
    await mocken.slappAlla();
    await expect(page.getByRole('heading', { name: 'Mars 2099' })).toBeVisible();
    await expect(page.locator('main#main').getByRole('status')).toHaveCount(0);
    await page.evaluate(
      () => new Promise((klar) => requestAnimationFrame(() => requestAnimationFrame(klar))),
    );

    expect(await page.getByRole('heading', { level: 1, name: 'Event' }).boundingBox()).toEqual(
      h1Box,
    );
    expect(await toggle.boundingBox()).toEqual(toggleBox);
  });

  test('tangentbord: pilnavigering flyttar fokus i toggeln, Enter väljer och skriver URL:en', async ({
    page,
  }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event');

    const toggle = page.getByRole('radiogroup', { name: 'Period' });
    await toggle.getByRole('radio', { name: 'Kommande' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(toggle.getByRole('radio', { name: 'Tidigare' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(toggle.getByRole('radio', { name: 'Tidigare' })).toBeChecked();
    await expect(page).toHaveURL(/[?&]period=past/);
    await expect(eventItems(page)).toHaveCount(2);
  });

  test('axe 0 violations på den renderade listan (facit-läget)', async ({ page }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event');
    // Gate axe på FULLT renderad lista (T26-mönstret).
    await expect(eventItems(page)).toHaveCount(5);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

/**
 * Skapa-ingången på vy-raden (task-19.2) — S73-FACIT-UTÖKNINGEN.
 *
 * Facit: `tasks/sessions/bilagor/s73-eventsida-konvergens/
 * FACIT-lista-skapa-ingangen.png` (K74: kapsel VÄNSTER på vy-väljarraden i
 * väljarnas stil — K73:s titelrads-primärknapp prövad-och-riven; Marcus:
 * "i linje med list- och kalendervy-väljaren fast på motsatt sida i samma
 * stil"). Ingången leder till event-familjens skapa-sida /event/skapa
 * (hemvist-flytten, PRD task-19 beslut 2, Marcus-kvitterad 2026-07-21).
 * Visuella krav bevisas COMPUTED (L245/L246/L272) — jämförande mot
 * väljarens renderade yta, aldrig klass-närvaro.
 */
test.describe('Skapa-ingången på vy-raden (task-19.2)', () => {
  test('renderar per facit: kapsel VÄNSTER på vy-raden i väljarnas stil — computed', async ({
    page,
  }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event');

    const ingang = page.getByRole('link', { name: 'Skapa nytt event' });
    await expect(ingang).toBeVisible();

    // Ikonen är dekorativ (aria-hidden) — länknamnet bärs av texten ensam
    // (namnet assertas redan av selektorn ovan).
    await expect(ingang.locator('svg[aria-hidden="true"]')).toHaveCount(1);

    // Väljarnas stil (K74): kapselns renderade yta == vy-väljarens track —
    // samma bg-token och samma fulla radie. Jämförande computed-assertion
    // mot SAMMA renderade sida (L272: aldrig token-antagande i testet).
    const toggle = page.getByRole('radiogroup', { name: 'Visningsläge' });
    const ingangStil = await ingang.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, radius: cs.borderRadius };
    });
    const toggleStil = await toggle.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, radius: cs.borderRadius };
    });
    expect(ingangStil.bg).toBe(toggleStil.bg);
    expect(ingangStil.radius).toBe(toggleStil.radius);

    // VÄNSTER på SAMMA rad: kapseln slutar före väljaren (väljaren behåller
    // höger), och kapselns vertikala mitt ligger inom väljarens band — EN
    // rad, ingen stapling (facit-geometrin).
    const ingangBox = await ingang.boundingBox();
    const toggleBox = await toggle.boundingBox();
    if (!ingangBox || !toggleBox) throw new Error('ingång/väljare saknar boundingBox');
    expect(ingangBox.x + ingangBox.width).toBeLessThan(toggleBox.x);
    const ingangMittY = ingangBox.y + ingangBox.height / 2;
    expect(ingangMittY).toBeGreaterThan(toggleBox.y);
    expect(ingangMittY).toBeLessThan(toggleBox.y + toggleBox.height);
  });

  test('leder till skapa-sidan: klick → /event/skapa (hemvist-flytten)', async ({ page }) => {
    await mockEvents(page, EVENTS);
    // Skapa-sidans format-hämtning mockas så destinationen renderar
    // deterministiskt (formens innehåll ägs av task-19.3 — här bevisas
    // enbart destinationen).
    await page.route(GET_EVENT_FORMATS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ eventFormats: [] }),
      });
    });
    await page.goto('/event');

    await page.getByRole('link', { name: 'Skapa nytt event' }).click();
    await page.waitForURL('**/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeVisible();
  });

  test('följer med i kalenderläget (K10: raden har fast position i båda vy-lägena)', async ({
    page,
  }) => {
    await mockEvents(page, EVENTS);
    await page.goto('/event?vy=kalender');

    await expect(
      page
        .getByRole('radiogroup', { name: 'Visningsläge' })
        .getByRole('radio', { name: 'Kalendervy' }),
    ).toBeChecked();
    await expect(page.getByRole('link', { name: 'Skapa nytt event' })).toBeVisible();
  });
});

/**
 * Filtervyn på event-listan + skriv ut (task-17.7) — S83-PROTOTYP-FACIT.
 *
 * Facit: `tasks/sessions/bilagor/s83-filtervy-konvergens/` (k02 låst
 * filterform + k02-print; Marcus-låst 2026-07-24: "Vi låser den så").
 * Research-grund: docs/research/filtervy-listor-monster-2026-07-24.md
 * (disclosure-bar = MOJ-mönstret; NN/g live-filtrering vid klientlokal data).
 *
 * Byggkraven (kortets Implementation Notes, låsta): tratt-ingång HÖGER om
 * period-toggeln (aria-expanded/aria-controls, siffer-badge, sr-only-namn) ·
 * disclosure-panel med TRE Select-dropdowns (Typ · Ort · Status; värden ur
 * HELA källan, typ/ort sv-alfabetiskt, status kanonisk ordning) · ETT val
 * per dimension, AND över dimensioner, LIVE utan Apply · räknare + aria-live ·
 * eget filter-tomläge SKILJT från period-tomläget · Skriv ut via
 * window.print() med print-huvud och print-dold nav/kontroller · URL-delbara
 * filterval ?typ/?ort/?status (nuqs, ren URL utan filter).
 * Visuella facit-krav bevisas COMPUTED (L245/L246/L272).
 */
test.describe('Filtervyn på event-listan + skriv ut (task-17.7)', () => {
  /**
   * Filter-diversifierad uppsättning (5 kommande + 2 tidigare): tre typer,
   * fyra orter, tre statusar (Flyttat MEDVETET frånvarande — bevisar att
   * alternativen HÄRLEDS ur källan, inte hårdkodas). Status-ordningen i
   * datat är vald så att kanonisk ordning ≠ alfabetisk ordning går att skilja.
   */
  const FILTER_EVENTS: Row[] = [
    ev({
      id: 'recFU1',
      namn: 'Medialkurs steg 1',
      typ: 'Kurs',
      ort: 'Skövde',
      startdatum: '2099-03-05',
      maxPlatser: 12,
      antalAnmalda: 8,
      platserKvar: 4,
    }),
    ev({
      id: 'recFU2',
      namn: 'Healingkväll',
      typ: 'Föreläsning',
      ort: 'Göteborg',
      startdatum: '2099-03-20',
      maxPlatser: 30,
      antalAnmalda: 12,
      platserKvar: 18,
    }),
    ev({
      id: 'recFU3',
      namn: 'Storseans',
      typ: 'Föreläsning',
      ort: 'Stockholm',
      startdatum: '2099-06-17',
      maxPlatser: 80,
      antalAnmalda: 12,
      platserKvar: 68,
      status: 'Inställt',
    }),
    ev({
      id: 'recFU4',
      namn: 'Retreat — inre resa',
      typ: 'Retreat',
      ort: 'Ulvåker',
      startdatum: '2099-08-27',
      maxPlatser: 16,
      antalAnmalda: 9,
      platserKvar: 7,
    }),
    ev({
      id: 'recFU5',
      namn: 'Höstretreat',
      typ: 'Retreat',
      ort: 'Ulvåker',
      startdatum: '2099-10-28',
      maxPlatser: 16,
      antalAnmalda: 2,
      platserKvar: 14,
    }),
    ev({
      id: 'recFP1',
      namn: 'Vårseans',
      typ: 'Föreläsning',
      ort: 'Göteborg',
      startdatum: '2000-04-10',
      maxPlatser: 30,
      antalAnmalda: 24,
      platserKvar: 6,
      status: 'Genomfört',
    }),
    ev({
      id: 'recFP2',
      namn: 'Vinterkurs',
      typ: 'Kurs',
      ort: 'Skövde',
      startdatum: '2000-01-05',
      maxPlatser: 12,
      antalAnmalda: 12,
      platserKvar: 0,
      status: 'Genomfört',
    }),
  ];

  /** Tratt-ingången (öppnar/stänger filterpanelen). */
  function filterKnapp(page: Page) {
    return page.getByRole('button', { name: /^(Visa|Dölj) filter/ });
  }

  /** Väljer ett alternativ i en filter-Select (skapa-event-testets idiom). */
  async function valjFilter(page: Page, testId: string, alternativ: string): Promise<void> {
    await page.getByTestId(testId).getByRole('button').click();
    await page.getByRole('option', { name: alternativ, exact: true }).click();
  }

  test('filter-ingången: tratt-knapp i period-raden med aria-expanded/aria-controls; panelen bär tre dropdowns med härledda alternativ i facit-ordning', async ({
    page,
  }) => {
    await mockEvents(page, FILTER_EVENTS);
    await page.goto('/event');

    // Stängd ingång: "Visa filter", aria-expanded=false, ingen badge.
    // TASK-236 (218.3-regression): se "slot-korten"-testets kommentar (rad
    // ~331) — samma warmup-gate-fördröjning på en fräsch kall kontext.
    const knapp = filterKnapp(page);
    await expect(knapp).toHaveAccessibleName('Visa filter', { timeout: 12_000 });
    await expect(knapp).toHaveAttribute('aria-expanded', 'false');

    // Öppning: aria-expanded=true + namnbytet till "Dölj filter";
    // aria-controls pekar på den nu synliga panelen (disclosure-kontraktet).
    await knapp.click();
    await expect(knapp).toHaveAttribute('aria-expanded', 'true');
    await expect(knapp).toHaveAccessibleName('Dölj filter');
    const panelId = await knapp.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toBeVisible();

    // Panelens facit-form COMPUTED (L272): tonala kortets bg + rounded-2xl.
    // Formen bor på den INRE wrappern sedan Marcus-fixen 2026-07-25 —
    // panel-ELEMENTET är ostylat (until-found/content-visibility renderar
    // elementets egen bakgrund/padding även i stängt läge; grå rand-buggen).
    const wrapper = panel.locator('> div');
    const panelStil = await wrapper.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, radius: cs.borderRadius };
    });
    expect(panelStil.bg).toBe(await resolvedTokenColor(page, '--mm-bg-muted'));
    expect(panelStil.radius).toBe('16px');

    // TRE dropdowns med synliga labels i facit-ordningen Typ · Ort · Status.
    for (const [testId, label] of [
      ['filter-typ', 'Typ'],
      ['filter-ort', 'Ort'],
      ['filter-status', 'Status'],
    ] as const) {
      await expect(page.getByTestId(testId)).toContainText(label);
    }

    // Typ-alternativen HÄRLEDS ur HELA källan: nolläget först, sedan
    // sv-alfabetiskt (Föreläsning < Kurs < Retreat).
    await page.getByTestId('filter-typ').getByRole('button').click();
    await expect(page.getByRole('option')).toHaveText([
      'Alla typer',
      'Föreläsning',
      'Kurs',
      'Retreat',
    ]);
    await page.keyboard.press('Escape');

    // Ort sv-alfabetiskt.
    await page.getByTestId('filter-ort').getByRole('button').click();
    await expect(page.getByRole('option')).toHaveText([
      'Alla orter',
      'Göteborg',
      'Skövde',
      'Stockholm',
      'Ulvåker',
    ]);
    await page.keyboard.press('Escape');

    // Status i KANONISK ordning (Planerat/Genomfört/Inställt — aldrig
    // alfabetisk) och ENDAST närvarande värden (Flyttat saknas i källan).
    await page.getByTestId('filter-status').getByRole('button').click();
    await expect(page.getByRole('option')).toHaveText([
      'Alla statusar',
      'Planerat',
      'Genomfört',
      'Inställt',
    ]);
    await page.keyboard.press('Escape');

    // Kalenderläget berörs ej av filtret (kalendern äger tiden, PRD beslut 7).
    await page.goto('/event?vy=kalender');
    await expect(filterKnapp(page)).toHaveCount(0);
  });

  test('stängd panel är VISUELLT FRÅNVARANDE — ingen grå rand (Marcus-fix 2026-07-25)', async ({
    page,
  }) => {
    // Grundorsak (react-arias useDisclosure): hidden="until-found" ⇒
    // content-visibility: hidden — innehållet döljs men panel-elementets
    // EGEN bakgrund/padding renderas. Stilarna bor därför på inre wrappern;
    // stängt läge får addera NOLL synlig yta (prototypens form).
    await mockEvents(page, FILTER_EVENTS);
    await page.goto('/event');
    await expect(eventItems(page)).toHaveCount(5);

    // Stängt läge från start: panelen osynlig och 0 px hög — ingen rand.
    const panel = page.getByTestId('filter-panel');
    await expect(panel).not.toBeVisible();
    const stangdBox = await panel.boundingBox();
    expect(stangdBox?.height ?? 0).toBe(0);

    // Öppna → panelen syns; stäng igen → visuellt frånvarande IGEN (samma
    // lås efter en interaktionscykel — inte bara initialtillståndet).
    await filterKnapp(page).click();
    await expect(panel).toBeVisible();
    await filterKnapp(page).click();
    await expect(panel).not.toBeVisible();
    const aterStangdBox = await panel.boundingBox();
    expect(aterStangdBox?.height ?? 0).toBe(0);
  });

  test('live-filtrering utan Apply: valet skriver URL:en, AND över dimensioner, räknare + aria-live; Rensa återställer till ren URL', async ({
    page,
  }) => {
    await mockEvents(page, FILTER_EVENTS);
    await page.goto('/event');
    await expect(eventItems(page)).toHaveCount(5);

    await filterKnapp(page).click();

    // ETT val filtrerar DIREKT (ingen Apply-knapp existerar) och skriver URL:en.
    await valjFilter(page, 'filter-typ', 'Föreläsning');
    await expect(eventItems(page)).toHaveCount(2);
    await expect(page).toHaveURL(/[?&]typ=/); // poll — nuqs throttlar URL-skrivningen
    expect(new URL(page.url()).searchParams.get('typ')).toBe('Föreläsning');
    await expect(page.getByRole('button', { name: /Apply|Tillämpa|Filtrera$/ })).toHaveCount(0);

    // Räknaren i panelfoten + aria-live-bekräftelsen (skiljs på punkten).
    await expect(page.getByText('Visar 2 av 5 event', { exact: true })).toBeVisible();
    await expect(page.getByText('Visar 2 av 5 event.', { exact: true })).toHaveCount(1);

    // AND över dimensioner: Föreläsning ∧ Göteborg → exakt Healingkväll.
    await valjFilter(page, 'filter-ort', 'Göteborg');
    await expect(eventItems(page)).toHaveCount(1);
    await expect(eventItems(page).getByRole('link')).toHaveText('Healingkväll');
    await expect(page).toHaveURL(/[?&]ort=/); // poll — nuqs throttlar URL-skrivningen
    expect(new URL(page.url()).searchParams.get('ort')).toBe('Göteborg');
    await expect(page.getByText('Visar 1 av 5 event', { exact: true })).toBeVisible();

    // Badgen bär antalet aktiva val; sr-namnet bär samma tal.
    await expect(filterKnapp(page)).toHaveAccessibleName('Dölj filter, 2 aktiva filterval');

    // Rensa filter: allt nollställs, URL:en är REN (inga filterparams kvar).
    // expect.poll — nuqs throttlar URL-skrivningen (review-pilotens fynd 4).
    await page.getByRole('button', { name: 'Rensa filter' }).click();
    await expect(eventItems(page)).toHaveCount(5);
    await expect.poll(() => new URL(page.url()).search).toBe('');
    await expect(page.getByText('Visar 5 av 5 event', { exact: true })).toBeVisible();
    await expect(filterKnapp(page)).toHaveAccessibleName('Dölj filter');
  });

  test('delbar URL + stabila alternativ: direktnavigering återger filterläget; periodbyte behåller filter och alternativrymd — aktiv-indikationen computed', async ({
    page,
  }) => {
    await mockEvents(page, FILTER_EVENTS);
    await page.goto('/event?typ=Kurs');

    // Direktnavigering återger exakt läget: filtrerad lista + badge — panelen
    // är STÄNGD men aktiv-indikationen syns (MOJ-affordans-läxan).
    await expect(eventItems(page)).toHaveCount(1);
    await expect(eventItems(page).getByRole('link')).toHaveText('Medialkurs steg 1');
    const knapp = filterKnapp(page);
    await expect(knapp).toHaveAttribute('aria-expanded', 'false');
    // Singular-böjning (review-pilotens fynd 3): "1 aktivt filterval".
    await expect(knapp).toHaveAccessibleName('Visa filter, 1 aktivt filterval');

    // Aktiv/öppen knapp per facit COMPUTED: bg-text + text-text-inverse;
    // badgen bär accent-bg med inverse-text (öppet bokförd facit-avvikelse
    // från prototypens text-text — WCAG 1.4.3-golvet skärs aldrig).
    expect(await knapp.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      await resolvedTokenColor(page, '--mm-text'),
    );
    const badge = knapp.locator('span[aria-hidden="true"]');
    await expect(badge).toHaveText('1');
    const badgeStil = await badge.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    expect(badgeStil.bg).toBe(await resolvedTokenColor(page, '--mm-accent'));
    expect(badgeStil.color).toBe(await resolvedTokenColor(page, '--mm-text-inverse'));

    // Periodbyte BEHÅLLER filtret (params är oberoende) och filtrerar
    // Tidigare-listan: Kurs ∧ past → exakt Vinterkurs.
    await page
      .getByRole('radiogroup', { name: 'Period' })
      .getByRole('radio', { name: 'Tidigare' })
      .click();
    await expect(page).toHaveURL(/[?&]period=past/);
    expect(new URL(page.url()).searchParams.get('typ')).toBe('Kurs');
    await expect(eventItems(page)).toHaveCount(1);
    await expect(eventItems(page).getByRole('link')).toHaveText('Vinterkurs');

    // Alternativen är STABILA över periodbytet (härledda ur HELA källan,
    // inte den periodfiltrerade): typ-listan är identisk i Tidigare-läget.
    await knapp.click();
    await expect(page.getByText('Visar 1 av 2 event', { exact: true })).toBeVisible();
    await page.getByTestId('filter-typ').getByRole('button').click();
    await expect(page.getByRole('option')).toHaveText([
      'Alla typer',
      'Föreläsning',
      'Kurs',
      'Retreat',
    ]);
  });

  test('filter-tomläget: aktiva filter + 0 träffar ger eget tomläge med Rensa — period-tomläget består orört', async ({
    page,
  }) => {
    await mockEvents(page, FILTER_EVENTS);
    await page.goto('/event');
    await filterKnapp(page).click();

    // Kurs ∧ Ulvåker = 0 träffar → filter-tomläget (inte period-tomläget).
    await valjFilter(page, 'filter-typ', 'Kurs');
    await valjFilter(page, 'filter-ort', 'Ulvåker');
    await expect(eventItems(page)).toHaveCount(0);
    await expect(page.getByText('Inga event matchar filtren')).toBeVisible();
    await expect(page.getByText('Inga kommande event')).toHaveCount(0);
    await expect(page.getByText('Visar 0 av 5 event', { exact: true })).toBeVisible();

    // Tomlägets Rensa-knapp är återvägen (research: tydlig återväg).
    await page.getByRole('button', { name: 'Rensa filter' }).last().click();
    await expect(eventItems(page)).toHaveCount(5);
    await expect(page.getByText('Inga event matchar filtren')).toHaveCount(0);

    // Okänt URL-värde (fri sträng per URL-beslutet): filtret är aktivt,
    // tomläget visas och dropdown-triggern KOMMUNICERAR värdet som extra
    // alternativ — aldrig RAC:s råa placeholder (review-pilotens fynd 6b).
    await page.goto('/event?typ=Okänd');
    await expect(page.getByText('Inga event matchar filtren')).toBeVisible();
    await expect(filterKnapp(page)).toHaveAccessibleName('Visa filter, 1 aktivt filterval');
    await filterKnapp(page).click();
    await expect(page.getByTestId('filter-typ')).toContainText('Okänd');

    // Period-tomläget består ORÖRT: tom källa + aktivt filter visar
    // period-tomläget (det finns inga event att "rensa fram").
    // Persist-cachen rensas före om-navigeringen (ADR-072): annars
    // hydreras föregående lista ur localStorage och tomläget nås aldrig.
    await mockEvents(page, []);
    await arrangeraTomCache(page);
    await page.goto('/event?typ=Kurs');
    await expect(page.getByText('Inga kommande event')).toBeVisible();
    await expect(page.getByText('Inga event matchar filtren')).toHaveCount(0);
  });

  test('ogiltig ?status-parameter är inert (enum-parsning): inga aktiva filter, hela listan renderas', async ({
    page,
  }) => {
    await mockEvents(page, FILTER_EVENTS);
    await page.goto('/event?status=bananas');

    await expect(eventItems(page)).toHaveCount(5);
    const knapp = filterKnapp(page);
    await expect(knapp).toHaveAccessibleName('Visa filter');
    await expect(knapp.locator('span[aria-hidden="true"]')).toHaveCount(0);
    // Inaktiv stängd knapp bär kapselns tysta ton — inte aktiv-svärtan.
    expect(await knapp.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      await resolvedTokenColor(page, '--mm-bg-muted'),
    );
  });

  test('Skriv ut: knappen anropar window.print; @media print döljer nav + kontroller och renderar utskriftshuvudet', async ({
    page,
  }) => {
    await mockEvents(page, FILTER_EVENTS);
    await page.addInitScript(() => {
      (window as unknown as { __printAnrop: number }).__printAnrop = 0;
      window.print = () => {
        (window as unknown as { __printAnrop: number }).__printAnrop += 1;
      };
    });
    await page.goto('/event');
    await filterKnapp(page).click();
    await valjFilter(page, 'filter-typ', 'Retreat');
    await expect(eventItems(page)).toHaveCount(2);

    // Skriv ut-knappen i panelfoten anropar window.print (utskriften ÄR den
    // synliga filtrerade listan — ingen parallell utskriftsvy).
    await page.getByRole('button', { name: 'Skriv ut' }).click();
    expect(
      await page.evaluate(() => (window as unknown as { __printAnrop: number }).__printAnrop),
    ).toBe(1);

    // @media print (emulerad): nav + samtliga kontroller döljs (GOV.UK-
    // blacklisten via återanvändbar print-utility), listan består.
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('nav')).toBeHidden();
    await expect(page.getByRole('radiogroup', { name: 'Period' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'Skapa nytt event' })).toBeHidden();
    await expect(filterKnapp(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Skriv ut' })).toBeHidden();
    await expect(page.getByRole('heading', { level: 1, name: 'Event' })).toBeVisible();
    await expect(eventItems(page)).toHaveCount(2);

    // Print-huvudet bär kontexten pappret annars tappar (facit k02-print):
    // "Event - {Period} · {aktiva filter} · {N} event · Utskrivet {långdatum}".
    // timeZone är INTE valfri här (L264). Utan den byggs strängen i RUNNERNS
    // zon (UTC på CI) medan sidan renderar i configens `timezoneId`
    // Europe/Stockholm — och mellan 22:00 och 24:00 UTC är runnern ett dygn
    // BAKOM browsern. Testet letade då efter gårdagens datum på en sida som
    // skrev dagens: deterministiskt 3/3-fel i ett tvåtimmarsfönster per dygn,
    // grönt alla andra timmar. Sex andra tidsformaterande tester i sviten bar
    // redan denna option; detta var det enda som saknade den.
    const langdatum = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Stockholm',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    await expect(
      page.getByText(`Event - Kommande · Typ: Retreat · 2 event · Utskrivet ${langdatum}`, {
        exact: true,
      }),
    ).toBeVisible();

    // Tillbaka till skärmläget: huvudet är print-only.
    await page.emulateMedia({ media: 'screen' });
    await expect(page.getByText(/Utskrivet /)).toBeHidden();
    await expect(page.getByRole('radiogroup', { name: 'Period' })).toBeVisible();

    // Kalenderläget berörs EJ (byggkrav 5): inget utskriftshuvud där —
    // kalendern läser hela källan ofiltrerad och list-/filterkontexten
    // hade ljugit på pappret (review-pilotens fynd 1).
    await page.goto('/event?vy=kalender');
    await expect(
      page.getByRole('radiogroup', { name: 'Visningsläge' }).getByRole('radio', {
        name: 'Kalendervy',
      }),
    ).toBeChecked();
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByText(/Utskrivet /)).toHaveCount(0);
  });

  test('Lugnt laddläge i panelen (INSTANT-regeln): aldrig falska nollor — skeleton i slutgeometri tills datat landat', async ({
    page,
  }) => {
    await arrangeraTomCache(page);
    const mocken = await hallbarMock(page, FILTER_EVENTS);
    await page.goto('/event');

    // Panelen kan öppnas DIREKT (ingen väntan på data för själva ytan) …
    await filterKnapp(page).click();
    const panelId = await filterKnapp(page).getAttribute('aria-controls');
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toBeVisible();

    // … men räknaren ritar ALDRIG falska nollor ("Visar 0 av 0 event")
    // medan svaret är parkerat — skelett bär ytan (ADR-078 beslut 2).
    await expect(page.getByText(/Visar 0 av 0/)).toHaveCount(0);
    await expect(panel.getByRole('button', { name: /^(Typ|Ort|Status)/ })).toHaveCount(0);

    // Slutgeometri: panelhöjden står still när datat landar (beslut 4).
    const holdBox = await panel.boundingBox();
    mocken.hall = false;
    await mocken.slappAlla();
    await expect(page.getByText('Visar 5 av 5 event', { exact: true })).toBeVisible();
    await expect(page.getByTestId('filter-typ')).toBeVisible();
    const landatBox = await panel.boundingBox();
    if (!holdBox || !landatBox) throw new Error('panelen saknar boundingBox');
    expect(Math.abs(landatBox.height - holdBox.height)).toBeLessThanOrEqual(1);
  });

  test('tangentbord: Enter öppnar disclosuren, dropdown-valet görs och filtrerar utan pekare', async ({
    page,
  }) => {
    await mockEvents(page, FILTER_EVENTS);
    await page.goto('/event');

    const knapp = filterKnapp(page);
    await knapp.focus();
    await page.keyboard.press('Enter');
    await expect(knapp).toHaveAttribute('aria-expanded', 'true');

    // Typ-dropdownen med enbart tangentbord: öppna, stega, välj.
    await page.getByTestId('filter-typ').getByRole('button').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(eventItems(page)).toHaveCount(2);
    await expect(page).toHaveURL(/[?&]typ=/); // poll — nuqs throttlar URL-skrivningen
    expect(new URL(page.url()).searchParams.get('typ')).toBe('Föreläsning');

    // Rensa via tangentbord: knappen unmountas i trycket — fokus flyttas
    // till tratt-knappen, aldrig till body (review-pilotens fynd 2).
    await page.getByRole('button', { name: 'Rensa filter' }).focus();
    await page.keyboard.press('Enter');
    await expect(eventItems(page)).toHaveCount(5);
    await expect(knapp).toBeFocused();
  });

  test('axe 0 violations med öppen filterpanel och aktivt filter', async ({ page }) => {
    await mockEvents(page, FILTER_EVENTS);
    await page.goto('/event');
    await filterKnapp(page).click();
    await valjFilter(page, 'filter-typ', 'Retreat');
    await expect(eventItems(page)).toHaveCount(2);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
