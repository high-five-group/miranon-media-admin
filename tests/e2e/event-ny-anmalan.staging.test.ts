import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route, test } from '@playwright/test';

/**
 * Manuell anmälan-sidan: task-18.12 (skarpa formen) + task-18.18 (eventväljaren).
 *
 * task-18.18 (S83 pass 4-facit, Marcus-låst 2026-07-24): sidan får en EVENTVÄLJARE
 * överst — förvald med djuplänkens event, öppningsbar med sök + månadsgrupperad
 * lista för att byta event. Väljarens stängda läge bär B-formens kontextrad
 * (kursfärgs-prick + namn font-medium + ort + kollapsat datumspann) och ERSÄTTER
 * den råa eventlabel-raden (AC #2: rå eventlabel borta ur UI:t). Route-semantiken
 * (beslut a/13): byte navigerar URL:en till /event/$eventId/ny-anmalan; tomt läge
 * bor på tunna /anmalan/ny (samma komponent). Formulär-state BEHÅLLS vid byte
 * (beslut b/14 — ingen remount vid param-byte).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt). DETERMINISTISK via `page.route`:
 * get-event (sammanfattningen), get-events (väljarlistan) och create-registration
 * (201 / 409) mockas. Inga skarpa staging-skrivningar i e2e — server-write-
 * kontraktet bevisas av tests/api/create-registration.staging.test.ts.
 * Listmockens datum ligger i 2099 (events-list-precedenten): kommande-filtret
 * jämför mot verklig klocka och testet får aldrig åldras till rött.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_EVENTS = '**/functions/v1/get-events*';
const CREATE_REGISTRATION = /\/functions\/v1\/create-registration/;
const EVENT_ID = 'recNYANM0000001';
const HOST_ID = 'recNYANMHOST0002';
const FJARR_ID = 'recNYANMFJARR003';

type Row = Record<string, unknown>;

function eventRow(overrides: Row = {}): Row {
  return {
    id: EVENT_ID,
    eventlabel: 'RIM 1 (e2e)',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2099-07-31',
    slutdatum: '2099-08-01',
    tidKvarTillEvent: '1 vecka',
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 0.67,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 5,
    antalSlutbetalningar: 2,
    antalSlutbetalningFelande: 6,
    status: 'Planerat',
    eventKey: 'Event-21',
    ...overrides,
  };
}

/** Komplett get-events-rad (EF-svarets form — EventSchema .parse:as i adaptern).
    `vantelista` MEDVETET utelämnad: bara get-event aggregerar den (ADR-078
    beslut 2 — listposten är partiell). */
function listRow(o: {
  id: string;
  namn: string;
  ort?: string | null;
  startdatum: string | null;
  slutdatum?: string | null;
  typ?: string | null;
  status?: string | null;
}): Row {
  return {
    id: o.id,
    eventlabel: `${o.namn} (label)`,
    eventNamn: o.namn,
    typ: o.typ !== undefined ? o.typ : 'Utbildning',
    ort: o.ort !== undefined ? o.ort : 'Skövde',
    startdatum: o.startdatum,
    slutdatum: o.slutdatum ?? o.startdatum,
    tidKvarTillEvent: null,
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 0.67,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: o.status ?? 'Planerat',
    borOverAntal: 0,
  };
}

/** Väljarlistan: djuplänkens event (juli/aug 2099) + två bytesmål + ett
    passerat event (2000) som kommande-filtret ska sålla bort. */
const LIST_EVENTS: Row[] = [
  listRow({
    id: EVENT_ID,
    namn: 'Resor i medvetandet 1',
    startdatum: '2099-07-31',
    slutdatum: '2099-08-01',
  }),
  listRow({
    id: FJARR_ID,
    namn: 'Fjärrskådning',
    startdatum: '2099-08-15',
    slutdatum: '2099-08-16',
  }),
  listRow({
    id: HOST_ID,
    namn: 'Höstretreat',
    ort: 'Mullsjö',
    startdatum: '2099-09-12',
    slutdatum: '2099-09-13',
  }),
  listRow({ id: 'recGAMMAL0000004', namn: 'Passerat event', startdatum: '2000-01-15' }),
];

function registrationRow(overrides: Row = {}): Row {
  return {
    id: 'recANMSKAPAD0001',
    namn: 'Ny Manuell',
    fornamn: 'Ny',
    efternamn: 'Manuell',
    email: 'ny@example.se',
    telefon: null,
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Obekräftad',
    flagga: null,
    anmalningsavgift: null,
    slutbetalning: null,
    betalningspaminnelseSkickad: null,
    inskickad: '2026-07-23T09:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 3,
    notering: 'Ringde in — betalar via faktura.',
    eventId: EVENT_ID,
    personId: null,
    ...overrides,
  };
}

interface MockOptions {
  createStatus?: number;
  eventOverrides?: Row;
}

async function mockEndpoints(
  page: Page,
  { createStatus = 201, eventOverrides = {} }: MockOptions = {},
): Promise<{
  /** Senaste POST-kroppen mot create-registration (null = aldrig nådd). */
  senaste: () => Record<string, unknown> | null;
  /** Samtliga POST-kroppar i ordning (nyckelrotations-beviset, F7). */
  alla: () => Record<string, unknown>[];
}> {
  const createBodies: Record<string, unknown>[] = [];

  await page.route(GET_EVENT, async (route: Route) => {
    // Sammanfattningens detalj-svar per event-ID (bytet hämtar NYTT id).
    const url = new URL(route.request().url());
    const id = url.searchParams.get('id');
    const rad =
      id === HOST_ID
        ? listRow({
            id: HOST_ID,
            namn: 'Höstretreat',
            ort: 'Mullsjö',
            startdatum: '2099-09-12',
            slutdatum: '2099-09-13',
          })
        : eventRow(eventOverrides);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: rad }),
    });
  });

  await page.route(GET_EVENTS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events: LIST_EVENTS }),
    });
  });

  await page.route(CREATE_REGISTRATION, async (route: Route) => {
    createBodies.push(route.request().postDataJSON());
    if (createStatus === 201) {
      const created = registrationRow();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ registration: created, record: { id: created.id, fields: {} } }),
      });
    } else {
      await route.fulfill({
        status: createStatus,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Personen är redan anmäld till eventet',
          existingName: 'Ny Manuell',
          requestId: 'req_test_409',
        }),
      });
    }
  });

  return {
    senaste: () => createBodies[createBodies.length - 1] ?? null,
    alla: () => createBodies,
  };
}

/** Väljarens trigger — accessibla namnet bär "Välj event" (Select-etiketten). */
function valjarTrigger(page: Page) {
  return page.getByRole('button', { name: /Välj event/ });
}

test.describe('Manuell anmälan-sidan — skarp (task-18.12)', () => {
  test('renderar per facit: formklassen + sex fält + väljaren i stället för eventlabel-raden', async ({
    page,
  }) => {
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    // h1 = sidrubriken (fokuserad efter mount).
    const heading = page.getByRole('heading', { level: 1, name: 'Lägg till manuell anmälan' });
    await expect(heading).toBeVisible();

    // Väljarens stängda läge bär eventets identitet (B-formens kontextrad);
    // den RÅA eventlabeln är borta ur UI:t (task-18.18 AC #2, punkt 11-fyndet).
    await expect(valjarTrigger(page)).toContainText('Resor i medvetandet 1');
    await expect(page.getByText('RIM 1 (e2e)')).toHaveCount(0);

    // Chevron tillbaka till eventet.
    const back = page.getByRole('link', { name: 'Tillbaka till eventet' });
    await expect(back).toHaveAttribute('href', `/event/${EVENT_ID}`);

    // Grupprubrikerna (DetaljGrupp).
    await expect(page.getByRole('heading', { level: 2, name: 'Deltagare' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Anmälan' })).toBeVisible();

    // Facit-formens sex fält. MÄRKNINGS-REGELN (K84, review-våg 7): normen är
    // att fältet krävs → markera UNDANTAGEN, inte normen.
    await expect(page.getByLabel('Förnamn', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Efternamn', { exact: true })).toBeVisible();
    await expect(page.getByLabel('E-post', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Mobilnummer (valfritt)')).toBeVisible();
    await expect(page.getByLabel('Antal platser')).toBeVisible();
    await expect(page.getByLabel('Notering (valfritt)')).toBeVisible();

    // Ingen "(obligatorisk)"-text får finnas kvar någonstans på sidan.
    await expect(page.getByText('(obligatorisk)')).toHaveCount(0);

    // Knappraden: primär först.
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Avbryt' })).toBeVisible();
  });

  test('fyll → submit 201 → bekräftelseläge (POST bär antalPlatser + notering)', async ({
    page,
  }) => {
    const skapade = await mockEndpoints(page, { createStatus: 201 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn', { exact: true }).fill('Ny');
    await page.getByLabel('Efternamn', { exact: true }).fill('Manuell');
    await page.getByLabel('E-post', { exact: true }).fill('ny@example.se');
    await page.getByLabel('Mobilnummer (valfritt)').fill('070-1234567');
    // Antal platser: default 1 → öka till 3 via stepparen (RAC NumberField).
    await page.getByRole('button', { name: 'Öka' }).click();
    await page.getByRole('button', { name: 'Öka' }).click();
    await page.getByLabel('Notering (valfritt)').fill('Ringde in — betalar via faktura.');

    await page.getByRole('button', { name: 'Spara anmälan' }).click();

    // Bekräftelseläget ersätter formuläret.
    await expect(page.getByRole('heading', { level: 2, name: 'Deltagare' })).toBeHidden();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();
    await expect(page.getByText('Anmälan sparad')).toBeVisible();

    // BEKRÄFTELSE-COPYN MOT BELÄGGNINGS-MODELLEN (review-våg 7): domänens ord —
    // platserna RESERVERADE, anmälan OBEKRÄFTAD tills bekräftelsen skickas.
    await expect(
      page.getByText('Ny Manuell är anmäld och har 3 platser reserverade.', { exact: false }),
    ).toBeVisible();
    await expect(page.getByText(/obekräftad tills du skickar bekräftelsen/i)).toBeVisible();
    await expect(page.getByText('källan Manuell')).toHaveCount(0);

    await expect(page.getByRole('button', { name: 'Tillbaka till eventet' })).toBeVisible();

    // POST-kroppen bar de nya fälten (Källa/EventKey/Event sätts server-side, ej i kroppen).
    const body = skapade.senaste();
    expect(body?.fornamn).toBe('Ny');
    expect(body?.efternamn).toBe('Manuell');
    expect(body?.email).toBe('ny@example.se');
    expect(body?.antalPlatser).toBe(3);
    expect(body?.notering).toBe('Ringde in — betalar via faktura.');
    expect(typeof body?.idempotencyKey).toBe('string');
  });

  test('409 (dubblett) → inline-fel, formuläret kvar', async ({ page }) => {
    await mockEndpoints(page, { createStatus: 409 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn', { exact: true }).fill('Ny');
    await page.getByLabel('Efternamn', { exact: true }).fill('Manuell');
    await page.getByLabel('E-post', { exact: true }).fill('ny@example.se');
    await page.getByRole('button', { name: 'Spara anmälan' }).click();

    await expect(page.getByRole('alert')).toContainText('redan anmäld');
    // Formuläret kvar (ingen bekräftelse).
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toBeVisible();
    await expect(page.getByTestId('bekraftelse')).toBeHidden();
  });

  test('required-validering: tom e-post → fält-fel, ingen submit', async ({ page }) => {
    const skapade = await mockEndpoints(page, { createStatus: 201 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn', { exact: true }).fill('Ny');
    await page.getByLabel('Efternamn', { exact: true }).fill('Manuell');
    // E-post lämnas tom.
    await page.getByRole('button', { name: 'Spara anmälan' }).click();

    await expect(page.getByText('Fyll i en giltig e-postadress')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toBeVisible();
    // create-registration aldrig nådd.
    expect(skapade.senaste()).toBeNull();
  });

  test('axe 0 violations på den skarpa formen', async ({ page }) => {
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Lägg till manuell anmälan' }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe('Eventväljaren på manuell anmälan-sidan (task-18.18)', () => {
  test('förval från djuplänken: Eventet-blocket FÖRST med kontextrad + sammanfattning', async ({
    page,
  }) => {
    await mockEndpoints(page, { eventOverrides: { vantelista: 3 } });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    // Väljaren är FÖRVALD med djuplänkens event: kontextraden bär namn +
    // ort + KOLLAPSAT datumspann (B-formen). Rå eventlabel aldrig i UI:t.
    const trigger = valjarTrigger(page);
    await expect(trigger).toContainText('Resor i medvetandet 1');
    await expect(trigger).toContainText('Skövde');
    await expect(trigger).toContainText('31 juli – 1 augusti 2099');
    await expect(page.getByText('RIM 1 (e2e)')).toHaveCount(0);

    // Eventet-blocket ligger FÖRE Deltagare (facit punkt 1: "är detta rätt
    // event?" är Lottas första fråga vid djuplänk).
    const block = page.getByTestId('eventet-block');
    await expect(block).toBeVisible();
    const blockBox = await block.boundingBox();
    const deltagareBox = await page
      .getByRole('heading', { level: 2, name: 'Deltagare' })
      .boundingBox();
    expect(blockBox).not.toBeNull();
    expect(deltagareBox).not.toBeNull();
    expect((blockBox?.y ?? 0) + (blockBox?.height ?? 0)).toBeLessThan(deltagareBox?.y ?? 0);

    // Breddpariteten (facit punkt 2): kortet har INGEN egen mx — samma bredd
    // som DetaljGrupps kort (renderad verifiering, DOM-mätt 0-diff).
    const gruppBox = await page.getByTestId('grupp-kort').first().boundingBox();
    expect(blockBox?.width).toBe(gruppBox?.width);

    // Sammanfattningen bär bara det som påverkar handlingen (punkt 4):
    // Typ · Platser kvar. Status TYST när Planerat (normen får inget märke).
    await expect(block.getByText('Typ')).toBeVisible();
    await expect(block.getByText('Utbildning')).toBeVisible();
    await expect(block.getByText('Platser kvar')).toBeVisible();
    await expect(block.getByText('4 av 12')).toBeVisible();
    await expect(block.getByText('Status')).toHaveCount(0);

    // Beläggningsstapeln (punkt 5): listkortets enkla form, aria-hidden dekor,
    // bredd = antalAnmalda/maxPlatser (8/12 → 67%).
    const fyllnad = block.locator('[data-slot="belaggning-fyllnad"]');
    await expect(fyllnad).toHaveAttribute('style', /width: 67%/);

    // Väntelistan (villkorad, punkt 4+11): bara get-event aggregerar den —
    // raden ligger SIST bland sammanfattningsraderna och renderas när
    // detalj-datat landat med värde > 0.
    await expect(block.getByText('Väntelista')).toBeVisible();
    await expect(block.getByText('3', { exact: true })).toBeVisible();

    // Sekundär navigering längst ned (punkt 6): nedtonad vikt — text-small
    // (14 px) + INTE font-medium (renderad verifiering av navigerings-vikten).
    const detaljLank = block.getByRole('link', { name: /Gå till eventdetaljer/ });
    await expect(detaljLank).toHaveAttribute('href', `/event/${EVENT_ID}`);
    const lankStil = await detaljLank.evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, fontWeight: s.fontWeight };
    });
    expect(lankStil.fontSize).toBe('14px');
    expect(Number(lankStil.fontWeight)).toBeLessThan(500);
  });

  test('fast bredd (facit-komplettering, Marcus-beslut 2026-07-25): stängda triggern spänner över hela blocket med symmetriska marginaler', async ({
    page,
  }) => {
    // Bredden var aldrig låst i S83-facitet — triggern växte med innehållet.
    // Beslutet: full blockbredd, samma inset höger som vänster (kortets px-4);
    // chevronen står vid triggerns högerkant (ml-auto).
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    const trigger = valjarTrigger(page);
    await expect(trigger).toContainText('Resor i medvetandet 1');
    const blockBox = await page.getByTestId('eventet-block').boundingBox();
    const triggerBox = await trigger.boundingBox();
    expect(blockBox).not.toBeNull();
    expect(triggerBox).not.toBeNull();

    const vanster = (triggerBox?.x ?? 0) - (blockBox?.x ?? 0);
    const hoger =
      (blockBox?.x ?? 0) +
      (blockBox?.width ?? 0) -
      ((triggerBox?.x ?? 0) + (triggerBox?.width ?? 0));
    // Kortets inner-inset på VÄNSTER (px-4 = 16 px + kortets 1 px
    // transparenta kant som ingår i boundingBox = 17) — och SAMMA på höger
    // (symmetrin ÄR Marcus-beslutet).
    expect(vanster).toBeCloseTo(17, 0);
    expect(hoger).toBeCloseTo(vanster, 0);

    // Chevronen vid högerkanten: triggerns px-3.5 (14 px) + triggerns egen
    // 1 px-kant i boundingBox = 15.
    const chevronBox = await trigger.locator('svg.lucide-chevrons-up-down').boundingBox();
    expect(
      (triggerBox?.x ?? 0) +
        (triggerBox?.width ?? 0) -
        ((chevronBox?.x ?? 0) + (chevronBox?.width ?? 0)),
    ).toBeCloseTo(15, 0);
  });

  test('status ≠ Planerat får sitt märke; väntelista-raden borta vid 0', async ({ page }) => {
    await mockEndpoints(page, { eventOverrides: { status: 'Flyttat' } });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    const block = page.getByTestId('eventet-block');
    await expect(block.getByText('Status')).toBeVisible();
    await expect(block.getByText('Flyttat')).toBeVisible();
    // Ingen väntelista i detalj-svaret → ingen rad (aldrig falsk nolla ur
    // placeholder — ADR-078 beslut 2).
    await expect(block.getByText('Väntelista')).toHaveCount(0);
  });

  test('öppna väljaren: sökfältet får fokus, listan är månadsgrupperad kommande (närmast först)', async ({
    page,
  }) => {
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await valjarTrigger(page).click();

    // Fokus flyttas till sökfältet när listan öppnas (facit punkt 8 —
    // programmatiskt, aldrig autoFocus-attributet).
    const sok = page.getByRole('searchbox', { name: 'Sök event eller ort' });
    await expect(sok).toBeFocused();

    // Månadsgruppering i EventsLists EGEN form (punkt 9): "Juli 2099" —
    // versal först, ALDRIG ALL CAPS (S83 pass 4-fångst #1).
    await expect(page.getByText('Juli 2099', { exact: true })).toBeVisible();
    await expect(page.getByText('Augusti 2099', { exact: true })).toBeVisible();
    await expect(page.getByText('September 2099', { exact: true })).toBeVisible();

    // Kommande event, närmast först (punkt 10); passerade sållas bort.
    const options = page.getByRole('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toContainText('Resor i medvetandet 1');
    await expect(options.nth(1)).toContainText('Fjärrskådning');
    await expect(options.nth(2)).toContainText('Höstretreat');
    await expect(page.getByRole('option', { name: /Passerat event/ })).toHaveCount(0);

    // Alternativraden bär B-formens kontextrad: kollapsat spann inom månaden.
    await expect(options.nth(1)).toContainText('15–16 augusti 2099');
  });

  test('sök matchar namn ELLER ort', async ({ page }) => {
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);
    await valjarTrigger(page).click();

    const sok = page.getByRole('searchbox', { name: 'Sök event eller ort' });
    // Ort-träff ("mullsjö", skiftlägesokänsligt) → bara Höstretreat kvar.
    await sok.pressSequentially('mullsjö');
    await expect(page.getByRole('option')).toHaveCount(1);
    await expect(page.getByRole('option').first()).toContainText('Höstretreat');

    // Namn-träff.
    await sok.clear();
    await sok.pressSequentially('Fjärr');
    await expect(page.getByRole('option')).toHaveCount(1);
    await expect(page.getByRole('option').first()).toContainText('Fjärrskådning');
  });

  test('byte navigerar URL:en och BEHÅLLER ifyllda personfält (beslut a + b)', async ({ page }) => {
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    // Fyll persondata FÖRE bytet — samma person till annat event är ett
    // verkligt flöde (beslut b: BEHÅLL; rensa är ett knapptryck).
    await page.getByLabel('Förnamn', { exact: true }).fill('Lotta');
    await page.getByLabel('E-post', { exact: true }).fill('lotta@example.se');

    await valjarTrigger(page).click();
    await page.getByRole('option', { name: /Höstretreat/ }).click();

    // Route-semantiken (beslut a/13): URL:en alltid sann och delbar.
    await expect(page).toHaveURL(`/event/${HOST_ID}/ny-anmalan`);

    // Väljaren bär nu det nya eventets identitet.
    await expect(valjarTrigger(page)).toContainText('Höstretreat');
    await expect(valjarTrigger(page)).toContainText('Mullsjö');

    // Formulär-staten överlevde bytet (ingen remount vid param-byte).
    await expect(page.getByLabel('Förnamn', { exact: true })).toHaveValue('Lotta');
    await expect(page.getByLabel('E-post', { exact: true })).toHaveValue('lotta@example.se');
  });

  test('tangentbordsvägen: pil ned + Enter väljer (AT-skärpan, punkt 8)', async ({ page }) => {
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await valjarTrigger(page).click();
    const sok = page.getByRole('searchbox', { name: 'Sök event eller ort' });
    await expect(sok).toBeFocused();
    await sok.pressSequentially('Höst');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(`/event/${HOST_ID}/ny-anmalan`);
    await expect(valjarTrigger(page)).toContainText('Höstretreat');
  });

  test('AT-kontraktet: virtuell fokus — DOM-fokus i fältet, aria-activedescendant pekar på det aktiva alternativet (punkt 8)', async ({
    page,
  }) => {
    // Mekaniska delen av facitets AT-krav (USWDS-fyndens riskyta är exakt
    // aria-activedescendant-wiringen — axe ser den inte). Det MANUELLA
    // VoiceOver-passet är bokfört som Marcus-moment på kortet.
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await valjarTrigger(page).click();
    const sok = page.getByRole('searchbox', { name: 'Sök event eller ort' });
    await expect(sok).toBeFocused();

    await page.keyboard.press('ArrowDown');
    // DOM-fokus står KVAR i sökfältet (virtuell fokus, inte fokusflytt).
    await expect(sok).toBeFocused();
    // Det virtuella fokuset annonseras via aria-activedescendant. Startpunkten
    // är det VALDA alternativet (combobox-mönstret) → första pil ned landar på
    // NÄSTA kommande event efter djuplänkens.
    const aktivtId = await sok.getAttribute('aria-activedescendant');
    expect(aktivtId).toBeTruthy();
    await expect(page.locator(`[id="${aktivtId}"]`)).toContainText('Fjärrskådning');
    // Pil ned igen → nästa alternativ (wiringen följer med).
    await page.keyboard.press('ArrowDown');
    const aktivtId2 = await sok.getAttribute('aria-activedescendant');
    expect(aktivtId2).toBeTruthy();
    expect(aktivtId2).not.toBe(aktivtId);
    await expect(page.locator(`[id="${aktivtId2}"]`)).toContainText('Höstretreat');
  });

  test('bytet nollställer mutations-utfall och roterar idempotensnyckeln (ADR-059; F4/F7)', async ({
    page,
  }) => {
    const skapade = await mockEndpoints(page, { createStatus: 409 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn', { exact: true }).fill('Ny');
    await page.getByLabel('Efternamn', { exact: true }).fill('Manuell');
    await page.getByLabel('E-post', { exact: true }).fill('ny@example.se');
    await page.getByRole('button', { name: 'Spara anmälan' }).click();
    await expect(page.getByRole('alert')).toContainText('redan anmäld');

    // Byt event → utfallet från event A får inte stå kvar under event B.
    await valjarTrigger(page).click();
    await page.getByRole('option', { name: /Höstretreat/ }).click();
    await expect(page).toHaveURL(`/event/${HOST_ID}/ny-anmalan`);
    await expect(page.getByRole('alert')).toHaveCount(0);

    // Ny submit mot B: kroppen bär B:s eventId och en NY idempotensnyckel
    // (en nyckel per skapa-intention — samma nyckel mot annat event vore en
    // felklassad replay).
    await page.getByRole('button', { name: 'Spara anmälan' }).click();
    await expect(page.getByRole('alert')).toContainText('redan anmäld');
    const alla = skapade.alla();
    expect(alla).toHaveLength(2);
    expect(alla[0]?.eventId).toBe(EVENT_ID);
    expect(alla[1]?.eventId).toBe(HOST_ID);
    expect(typeof alla[1]?.idempotencyKey).toBe('string');
    expect(alla[1]?.idempotencyKey).not.toBe(alla[0]?.idempotencyKey);
  });

  test('tomt läge (/anmalan/ny): väljaren står FRISTÅENDE, formuläret renderas INTE (punkt 7 + 13)', async ({
    page,
  }) => {
    await mockEndpoints(page);
    await page.goto('/anmalan/ny');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Lägg till manuell anmälan' }),
    ).toBeVisible();

    // Progressive disclosure: en kontroll som inte är tillämplig förrän ett
    // val gjorts DÖLJS — resten av formuläret finns inte i DOM:en.
    await expect(valjarTrigger(page)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Deltagare' })).toHaveCount(0);
    await expect(page.getByLabel('Förnamn', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toHaveCount(0);

    // Välj event → navigerar in i den nästlade routen och avslöjar formuläret.
    await valjarTrigger(page).click();
    await page.getByRole('option', { name: /Fjärrskådning/ }).click();
    await expect(page).toHaveURL(`/event/${FJARR_ID}/ny-anmalan`);
    await expect(page.getByRole('heading', { level: 2, name: 'Deltagare' })).toBeVisible();
    await expect(page.getByLabel('Förnamn', { exact: true })).toBeVisible();
  });

  test('axe 0 violations: öppen väljare (scopat) + tomt läge (helsides)', async ({ page }) => {
    await mockEndpoints(page);

    // Tomt läge — helsidesskan.
    await page.goto('/anmalan/ny');
    await expect(valjarTrigger(page)).toBeVisible();
    const tomt = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(tomt.violations).toEqual([]);

    // Öppen väljare — scopad skan (ComboBox-mönstermallens scope-not: RAC:s
    // ariaHideOutside ger helsides-false-positive på aria-hidden-focus för
    // icke-modala popovers; det interaktiva skannas i stället).
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);
    await valjarTrigger(page).click();
    await expect(page.getByRole('searchbox', { name: 'Sök event eller ort' })).toBeFocused();
    const oppen = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('[data-testid="eventet-block"]')
      .include('[data-testid="event-valjare-popover"]')
      .analyze();
    expect(oppen.violations).toEqual([]);
  });
});
