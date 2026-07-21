import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route, test } from '@playwright/test';

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
const PERSIST_KEY = 'REACT_QUERY_OFFLINE_CACHE';

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
  anmaldBelaggning?: number | null;
  status?: string | null;
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
    anmaldBelaggning: o.anmaldBelaggning ?? null,
    bekraftadBelaggning: o.anmaldBelaggning ?? null,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: o.status ?? 'Planerat',
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
    await expect(page.getByRole('button', { name: /Sortera efter/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Visa/ })).toHaveCount(0);
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
    await expect(eventItems(page)).toHaveCount(5);

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
    await expect(grund).toContainText('8 av 12 platser bokade');
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
    await expect(slot(installt)).toHaveText('Inställt');
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
    await expect(full).toContainText('10 av 10 platser bokade');
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
    await expect(page.getByRole('heading', { level: 1, name: 'Event' })).toBeVisible();
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
