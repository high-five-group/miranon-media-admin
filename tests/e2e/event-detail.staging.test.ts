import AxeBuilder from '@axe-core/playwright';
import { mockValjarLista, type ValjarRad, valjarRad } from './helpers/valjar-lista';
import { expect, type Page, type Route, test } from './support/test-bas';

/**
 * task-18.1 — Eventsidans grundform (S73-facit) + Om eventet-morfen +
 * uppdatera-event-vertikalen.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event + update-event —
 * mark-paid-precedentens split: SERVER-write-kontraktet (allowlist, faktisk
 * mutation, omläsning, restore) bevisas av `tests/api/update-event.staging.test.ts`
 * mot skarp staging; dessa e2e bevisar KLIENTENS form och beteende flak-fritt
 * utan att mutera delad staging-data.
 *
 * Täckning: toppraden (chevron ensam + h1 + EventKey-pill + tid kvar-raden),
 * grupp-grammatiken (rubrik UTANFÖR tonala kort), Om eventets etikett-värde-rader
 * med långdatum (aldrig rå ISO), MORFEN Δ=0 px DOM-mätt (AC #3) + likbredda fält,
 * "ändrar från"-mönstret, Spara-payloaden (endast satta fält), fel-väg, Avbryt
 * med fokus-retur, 404/fel/laddläge, axe 0 i BÅDA morf-lägena.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_EVENT_NOTES = '**/functions/v1/get-event-notes*';
const UPDATE_EVENT = '**/functions/v1/update-event';
const EVENT_ID = 'recDETAIL0000001';

/**
 * Anteckningar-gruppen (task-18.11) fetchar get-event-notes för VARJE event. Stubbas
 * tom här så eventsidans övriga sviter förblir deterministiska (antecknings-strömmens
 * egna beteenden bevisas i `tests/acceptance/event-anteckningar.acceptance.test.ts`,
 * dit filen flyttade i task-59.6).
 */
async function mockNotes(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
): Promise<void> {
  await page.route(GET_EVENT_NOTES, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ notes: [] }),
    });
  });
}

type EventMock = Record<string, unknown>;

/** task-18.19: eventväljarens bytesmål på detaljsidan. */
const BYT_HOST_ID = 'recDETAILHOST002';
const BYT_FJARR_ID = 'recDETAILFJARR03';

/** Väljarlistan: sidans event (juli 2099) + två bytesmål + ett passerat
    event (2000) som kommande-filtret ska sålla bort. Delade stub-formen
    (helpers/valjar-lista.ts) med filens egna rader; eventKey per rad så
    sidhuvudets pill kan stå direkt ur placeholdern (review-pilotens F4). */
const VALJAR_LISTA: ValjarRad[] = [
  valjarRad({
    id: EVENT_ID,
    namn: 'Resor i medvetandet 1',
    startdatum: '2099-07-31',
    slutdatum: '2099-08-01',
    eventKey: 'Event-21',
  }),
  valjarRad({
    id: BYT_FJARR_ID,
    namn: 'Fjärrskådning',
    startdatum: '2099-08-15',
    slutdatum: '2099-08-16',
    eventKey: 'Event-55',
  }),
  valjarRad({
    id: BYT_HOST_ID,
    namn: 'Höstretreat',
    ort: 'Mullsjö',
    startdatum: '2099-09-12',
    slutdatum: '2099-09-13',
    eventKey: 'Event-77',
  }),
  valjarRad({ id: 'recDETAILGAMMAL4', namn: 'Passerat event', startdatum: '2000-01-15' }),
];

function eventDetail(overrides: EventMock = {}): EventMock {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1 – 2026-07-31',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-07-31',
    slutdatum: '2026-08-01',
    tidKvarTillEvent: '1 vecka och 3 dagar',
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
    // Beläggningens innehållsmodell (task-18.2, K16) — facit-lik komposition:
    // 8 + 1 + 1 + 1 = 11 av 12 upptagna (92 %), väntelistan 0 utanför taket.
    reserverade: 1,
    manuelltTillagda: 1,
    viaFormular: 8,
    medfoljande: 1,
    vantelista: 0,
    ...overrides,
  };
}

async function mockEvent(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  body: EventMock,
  { status = 200, manualRelease = false }: { status?: number; manualRelease?: boolean } = {},
): Promise<() => void> {
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  await page.route(GET_EVENT, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    if (gate) await gate;
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: status === 200 ? JSON.stringify({ event: body }) : JSON.stringify({ error: 'x' }),
    });
  });
  // Betalningar-gruppen (task-18.8) hämtar anmälningarna — stubbas tom så
  // sviten förblir deterministisk (arbetsytans egen svit: mark-paid-e2e).
  await page.route(
    '**/functions/v1/get-registrations*',
    async (route: { fulfill: (r: unknown) => Promise<void> }) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: [] }),
      });
    },
  );
  await mockNotes(page);
  await mockValjarLista(page, VALJAR_LISTA);
  return release;
}

test.describe('Eventsidan — grundformen (task-18.1)', () => {
  test('toppraden: chevron ensam + h1 = eventnamn (fokus) + EventKey-pill + tid kvar-rad', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);

    // h1 = eventnamnet, fokuserad efter async-laddning (identiteten är sidrubriken).
    const heading = page.getByRole('heading', { level: 1, name: 'Resor i medvetandet 1' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att eventet anlänt.
    await expect(page.getByText('Event Resor i medvetandet 1 laddat.')).toHaveCount(1);

    // Chevronen ensam bär "detta är en undersida" — rund 44 px-knapp, länk till listan.
    const back = page.getByRole('link', { name: 'Tillbaka till event' });
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute('href', '/event');
    const backBox = await back.boundingBox();
    expect(backBox?.width).toBe(44);
    expect(backBox?.height).toBe(44);

    // EventKey-pillen på titelraden (metadata, inte titel-storlek).
    await expect(page.getByText('Event-21')).toBeVisible();

    // Tid kvar-raden under titeln — nedräkningsformerna bär suffixet
    // "kvar till eventet" (review-våg 1, Marcus 2026-07-22).
    await expect(page.getByText('1 vecka och 3 dagar kvar till eventet')).toBeVisible();
  });

  test('tid kvar-raden: "Avslutat" renderas rått utan kvar-suffix (formelns enda icke-nedräkningsgren)', async ({
    page,
  }) => {
    // Basens formel (fldcwlblR3JQxXVbe, läst 2026-07-22) ger exakt tre
    // former: "Avslutat" | "N dagar" | "N vecka/veckor [och M dagar]" —
    // suffixet får aldrig ge "Avslutat kvar till eventet".
    await mockEvent(page, eventDetail({ tidKvarTillEvent: 'Avslutat' }));
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Avslutat', { exact: true })).toBeVisible();
    await expect(page.getByText(/Avslutat kvar till/)).toHaveCount(0);
  });

  test('grupp-grammatiken: rubriker UTANFÖR tonala kort; facit-ordningen', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Grupperna i facit-ordning (check-in-kortet är rubrikfritt per K26;
    // Gruppdynamik är sidans sista datagrupp sedan 18.10 — Anteckningar 18.11
    // blir den allra sista efteråt).
    const rubriker = await page.getByRole('heading', { level: 2 }).allTextContents();
    expect(rubriker).toEqual([
      'Åtgärder',
      'Om eventet',
      'Beläggning',
      'Anmälda deltagare',
      'Betalningar',
      'Närvaro',
      'Gruppdynamik',
      'Anteckningar',
    ]);

    // Rubriken står UTANFÖR den tonala kortytan: h2:s förälder är sektionen,
    // och kortet (syskonet efter) bär tonal bakgrund (inte transparent).
    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    const kort = omGrupp.locator('[data-testid="grupp-kort"]');
    const kortBg = await kort.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(kortBg).not.toBe('rgba(0, 0, 0, 0)');
    const h2InuteKort = await kort.locator('h2').count();
    expect(h2InuteKort).toBe(0);
  });

  test('Om eventet: etikett-värde-rader med långdatum (aldrig rå ISO)', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await expect(omGrupp.getByText('Utbildning', { exact: true })).toBeVisible();
    await expect(omGrupp.getByText('Skövde', { exact: true })).toBeVisible();
    // Långdatum-spannet (Gunilla — aldrig rå ISO i läsytan).
    await expect(omGrupp.getByText('31 juli – 1 augusti 2026')).toBeVisible();
    await expect(omGrupp.getByText('Planerat', { exact: true })).toBeVisible();
    expect(await omGrupp.getByText('2026-07-31').count()).toBe(0);
  });

  test('review-våg 4: samma-månad-spann kollapsas — "15–16 augusti 2026" (branschformen)', async ({
    page,
  }) => {
    // Marcus (2026-07-23): "15 augusti – 16 augusti 2026" är oproffsigt —
    // spann inom samma månad skrivs dag–dag månad år (tätt tankstreck,
    // svenska skrivregler). Biblioteksfixen i datumSpannText bär alla
    // konsumenter (Om eventet · ny-anmälans kontextrad · redigeringsraden);
    // spann över månads-/årsgräns behåller sina former (låset ovan).
    await mockEvent(page, eventDetail({ startdatum: '2026-08-15', slutdatum: '2026-08-16' }));
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await expect(omGrupp.getByText('15–16 augusti 2026', { exact: true })).toBeVisible();
    expect(await omGrupp.getByText('15 augusti – 16 augusti 2026').count()).toBe(0);
  });

  test('MORFEN Δ=0 px DOM-mätt (AC #3): kortets geometri + etikett-positioner identiska; likbredda fält', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    const kort = omGrupp.locator('[data-testid="grupp-kort"]');

    // DOKUMENT-relativa positioner (top + scrollY, 18.2-testets mätform):
    // morfens autoFocus scrollar fältet i vy — sedan 18.3 lade Åtgärder +
    // check-in ovanför ligger kortet lägre och scrollen slår till. Viewport-
    // relativa boundingBox-y skiftar då av SCROLLEN, inte av geometrin;
    // dokument-koordinater är den ärliga Δ=0 px-mätningen.
    const kortBox = () =>
      kort.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY, height: r.height, width: r.width };
      });
    const labelTops = () =>
      kort
        .locator('dt')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top + window.scrollY));

    // Läge 1 (visning): kortets box + varje etiketts y-position.
    const before = await kortBox();
    const labelYBefore = await labelTops();

    await omGrupp.getByRole('button', { name: 'Ändra' }).click();

    // Läge 2 (redigering): exakt samma kort-geometri och rad-positioner (Δ=0 px).
    const after = await kortBox();
    expect(after.height).toBe(before.height);
    expect(after.top).toBe(before.top);
    expect(after.width).toBe(before.width);

    const labelYAfter = await labelTops();
    expect(labelYAfter).toEqual(labelYBefore);

    // Likbredda fält: alla fyra fält-slotar exakt samma bredd (K13-regeln).
    const slotWidths = await kort
      .locator('[data-testid="falt-slot"]')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    expect(slotWidths.length).toBe(4);
    expect(new Set(slotWidths).size).toBe(1);
  });

  test('"ändrar från"-mönstret: nuvarande värde dämpat bredvid fältet', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await omGrupp.getByRole('button', { name: 'Ändra' }).click();

    // Nuvarande värden står kvar synliga (dämpade) genom hela ändringen.
    const nuvarande = omGrupp.locator('[data-testid="nuvarande-varde"]');
    await expect(nuvarande).toHaveText([
      'Utbildning',
      'Skövde',
      '31 juli – 1 augusti 2026',
      'Planerat',
    ]);
  });

  test('Spara skriver via update-event: endast satta fält i payloaden; morfen stängs mot svaret', async ({
    page,
  }) => {
    // Server-sanning i mocken (mark-paid-mönstret): efter update speglar get-event
    // det nya värdet — onSettled-refetchen (ADR-016 E) ska KONVERGERA, inte backa.
    let serverOrt = 'Skövde';
    await mockNotes(page);
    await mockValjarLista(page, VALJAR_LISTA);
    await page.route(GET_EVENT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ event: eventDetail({ ort: serverOrt }) }),
      });
    });
    let updateBody: Record<string, unknown> | null = null;
    await page.route(UPDATE_EVENT, async (route) => {
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      serverOrt = 'Falköping'; // server-sanningen efter mutationen
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: eventDetail({ ort: 'Falköping' }),
          record: { id: EVENT_ID, fields: {} },
        }),
      });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await omGrupp.getByRole('button', { name: 'Ändra' }).click();

    // Ändra orten och spara.
    const ortFalt = omGrupp.getByRole('textbox', { name: 'Ort' });
    await ortFalt.fill('Falköping');
    await omGrupp.getByRole('button', { name: 'Spara' }).click();

    // Morfen stängs mot svaret; raden visar nya värdet.
    await expect(omGrupp.getByRole('button', { name: 'Ändra' })).toBeVisible();
    await expect(omGrupp.getByText('Falköping', { exact: true })).toBeVisible();

    // Payloaden: eventId + SAMTLIGA sektionens fält (sektions-spara), inga extra.
    expect(updateBody).toEqual({
      eventId: EVENT_ID,
      typ: 'Utbildning',
      ort: 'Falköping',
      startdatum: '2026-07-31',
      slutdatum: '2026-08-01',
      status: 'Planerat',
    });
  });

  test('fel-väg: update-event 500 → role=alert med fel, morfen förblir öppen', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.route(UPDATE_EVENT, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error', requestId: 'req-test-1' }),
      });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await omGrupp.getByRole('button', { name: 'Ändra' }).click();
    await omGrupp.getByRole('button', { name: 'Spara' }).click();

    await expect(page.getByRole('alert')).toContainText('Kunde inte spara');
    // Morfen kvar (Spara syns fortfarande — inget tyst tapp av ändringar).
    await expect(omGrupp.getByRole('button', { name: 'Spara' })).toBeVisible();
  });

  test('Avbryt: ändringar kastas; fokus tillbaka till Ändra-knappen', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await omGrupp.getByRole('button', { name: 'Ändra' }).click();
    await omGrupp.getByRole('textbox', { name: 'Ort' }).fill('Bortkastat');
    await omGrupp.getByRole('button', { name: 'Avbryt' }).click();

    await expect(omGrupp.getByText('Skövde', { exact: true })).toBeVisible();
    await expect(omGrupp.getByRole('button', { name: 'Ändra' })).toBeFocused();
  });

  test('detaljsidans sektioner är skarpa: inga interim-länkar; Närvaro-registret bär sektionen', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Alla tre tidigare interim-länkar är rivna: Anmälda deltagare (18.4, egen
    // svit event-deltagare-e2e), Betalningar (18.8, mark-paid-e2e) och Närvaro
    // (18.9, registret) är nu skarpa sektioner — inga "Öppna …-vyn"-länkar kvar.
    await expect(page.getByRole('link', { name: 'Öppna anmälda-vyn' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Öppna betalnings-vyn' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Öppna närvaro-vyn' })).toHaveCount(0);

    // Närvaro-registret: default-eventet är Planerat → lugnt ej-genomfört-läge
    // (registret fetchar INTE närvaron för kommande event → ingen get-attendance-
    // mock behövs här). Full register-täckning: event-narvaro-register.staging.test.ts.
    const narvaro = page.locator('section[aria-labelledby="grupp-narvaro"]');
    // Review-våg 2 (Marcus 2026-07-23): tomlägestexten kortad — svansen
    // "— närvaron fylls i vid check-in" riven; centrerad gråad (muted) text.
    const tomlage = narvaro.getByText('Eventet är inte genomfört ännu', { exact: true });
    await expect(tomlage).toBeVisible();
    await expect(tomlage).toHaveCSS('text-align', 'center');
  });

  test('namnlöst event → fallback, ingen krasch; pill utelämnas utan eventKey', async ({
    page,
  }) => {
    // eventKey: undefined → nyckeln droppas ur JSON:et (EF-formen när värdet saknas).
    await mockEvent(page, eventDetail({ eventNamn: null, eventlabel: null, eventKey: undefined }));
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Namnlöst event' })).toBeVisible();
    expect(await page.getByText('Event-21').count()).toBe(0);
  });

  test('NOT-FOUND (404) → ej-funnen-UI via role=alert', async ({ page }) => {
    await mockEvent(page, eventDetail(), { status: 404 });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('alert')).toContainText('Eventet hittades inte');
  });

  test('övrigt fel (icke-404) → generisk fel-UI via role=alert', async ({ page }) => {
    await mockEvent(page, eventDetail(), { status: 400 });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta eventet');
  });

  test('Lugnt laddläge: skeleton i slutgeometri (aria-busy + sr-besked), ingen "Laddar…"-textrad', async ({
    page,
  }) => {
    const release = await mockEvent(page, eventDetail(), { manualRelease: true });
    await page.goto(`/event/${EVENT_ID}`);

    // Scopa till skeletonens status-region (OfflineIndicator bär också role=status).
    const status = page.getByRole('status').filter({ hasText: 'Laddar event…' });
    await expect(status).toHaveAttribute('aria-busy', 'true');
    // Besked endast sr-only — ingen synlig "Laddar…"-textrad (Lugnt laddläge).
    const synligLaddtext = page.getByText('Laddar event…');
    await expect(synligLaddtext).toHaveClass(/sr-only/);

    release();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Resor i medvetandet 1' }),
    ).toBeVisible();
  });

  test('axe 0 violations — visningsläget OCH morf-lägena (Om eventet + Beläggning)', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const taggar = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
    const visning = await new AxeBuilder({ page }).withTags(taggar).analyze();
    expect(visning.violations).toEqual([]);

    await page
      .locator('section[aria-labelledby="grupp-om-eventet"]')
      .getByRole('button', { name: 'Ändra' })
      .click();
    const morf = await new AxeBuilder({ page }).withTags(taggar).analyze();
    expect(morf.violations).toEqual([]);

    // Stäng Om eventet-morfen och öppna Beläggningens (task-18.2) — nya mönster
    // (RAC NumberField, segmenterad mätare) får axe-0 i sitt öppna läge.
    await page
      .locator('section[aria-labelledby="grupp-om-eventet"]')
      .getByRole('button', { name: 'Avbryt' })
      .click();
    await page
      .locator('section[aria-labelledby="grupp-belaggning"]')
      .getByRole('button', { name: 'Ändra' })
      .click();
    const belaggningsMorf = await new AxeBuilder({ page }).withTags(taggar).analyze();
    expect(belaggningsMorf.violations).toEqual([]);
  });
});

/**
 * task-18.3 — Åtgärds-gruppen + check-in-ingången + chevron-koherensen
 * (S73-facit K19–K26, K47, K72) — amenderad av task-18.15: åtgärds-radernas
 * LEDANDE ikoner (kuvert-grammatiken K47) är ersatta av radnummer 1–6 i vita
 * rutor (referentbarhet — "gå till åtgärd 4", Gunilla-principen; öppen
 * facit-revidering, S83 konvergens-pass 2). Kuvertet består i övriga ytor;
 * check-in-kortets UserCheck är orörd.
 *
 * Renderad verifiering (L245/L246): hover-plattans grammatik, måttpariteten
 * check-in ↔ åtgärdsrad och numrutans form bevisas via computed-style/
 * DOM-mätning — aldrig klass-tittande. Utskicks-raderna + Markera betalda är
 * ÄNNU inte kopplade (flödena byggs i 18.6/18.8) och bär aria-disabled tills
 * dess — öppet bokfört interim; Skriv ut är skarp (window.print).
 */
test.describe('Åtgärder + check-in-ingången (task-18.3)', () => {
  test('check-in-ingången: eget rubrikfritt kort ÖVER Åtgärder i exakt åtgärdsradens mått', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Ingången är en LÄNK med belagt mål (PRD beslut 18-mönstret, öppet
    // avgjort i skivan): befintliga närvaro-ytan tills check-in-sidan byggs.
    const checkIn = page.getByRole('link', { name: 'Gå till check-in' });
    await expect(checkIn).toBeVisible();
    await expect(checkIn).toHaveAttribute('href', `/event/${EVENT_ID}/narvaro`);

    // Eget kort-skal (K24/K26): tonal yta + 16 px-radie, UTAN rubrik —
    // det speciella bärs av placeringen + ensamheten, inte avvikande mått.
    const kort = page.locator('[data-testid="checkin-kort"]');
    const kortStil = await kort.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, radie: s.borderRadius };
    });
    expect(kortStil.bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(kortStil.radie).toBe('16px');
    expect(await kort.locator('h2').count()).toBe(0);

    // Placeringen: kortet ligger ovanför Åtgärds-gruppen (K23 — eventdagens
    // primärhandling), och raden delar åtgärdsradens mått (K26, DOM-mätt).
    const atgarder = page.locator('section[aria-labelledby="grupp-atgarder"]');
    const kortBox = await kort.boundingBox();
    const atgarderBox = await atgarder.boundingBox();
    expect((kortBox?.y ?? 0) + (kortBox?.height ?? 0)).toBeLessThanOrEqual(atgarderBox?.y ?? 0);

    const checkInHojd = (await checkIn.boundingBox())?.height;
    const atgardsRadHojd = (
      await atgarder.getByRole('link', { name: 'Lägg till manuell anmälan' }).boundingBox()
    )?.height;
    expect(checkInHojd).toBe(atgardsRadHojd);
  });

  test('Åtgärder: sex rader i frekvensordning med radnummer 1–6 (18.15) och chevroner', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-atgarder"]');

    // Frekvensordningen (K21: vanligaste först) — Lägg till är en LÄNK till
    // manuell anmälan-sidan (K16/K17), resten knappar. Numren 1–6 följer
    // ordningen (18.15 byggkrav 1: ordningen ändras ej).
    const lagg = grupp.getByRole('link', { name: 'Lägg till manuell anmälan' });
    await expect(lagg).toHaveAttribute('href', `/event/${EVENT_ID}/ny-anmalan`);

    const rader = grupp.locator('a, button');
    await expect(rader).toHaveCount(6);
    const radNamn = [
      'Lägg till manuell anmälan',
      'Skicka bekräftelsemail till obekräftade',
      'Skicka betalningspåminnelse till obetalda',
      'Markera alla obetalda som betalda',
      'Skicka eventinfo till alla anmälda',
      'Skriv ut denna detaljsida',
    ];
    for (const [i, namn] of radNamn.entries()) {
      // AT-PARITETEN (18.15 AC 2): radNAMNET är oförändrat — numret är
      // aria-hidden dekor och ingår ALDRIG i det tillgängliga namnet.
      await expect(rader.nth(i)).toHaveAccessibleName(namn);
      // Radnumret leder raden (visuell referens: "gå till åtgärd 4").
      await expect(rader.nth(i).locator('span[aria-hidden="true"]').first()).toHaveText(
        String(i + 1),
      );
    }

    // RIVNINGEN (18.15): de ledande lucide-ikonerna är ersatta av numrutor —
    // kuvert-grammatiken (K47) består i övriga ytor, och check-in-kortets
    // UserCheck (utanför gruppen) är orörd (byggkrav 3).
    await expect(grupp.locator('svg.lucide-mail')).toHaveCount(0);
    await expect(grupp.locator('svg.lucide-plus')).toHaveCount(0);
    await expect(grupp.locator('svg.lucide-badge-check')).toHaveCount(0);
    await expect(grupp.locator('svg.lucide-printer')).toHaveCount(0);
    await expect(page.locator('[data-testid="checkin-kort"] svg.lucide-user-check')).toHaveCount(1);

    // K25-chevronen på ALLA sex rader (chevron = raden leder vidare).
    await expect(grupp.locator('svg.lucide-chevron-right')).toHaveCount(6);
  });

  test('numrutan (18.15): vit 24×24-ruta i radens radie-språk som ALDRIG delar färg med hover-plattan', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-atgarder"]');
    const rad = grupp.getByRole('button', { name: 'Skicka bekräftelsemail till obekräftade' });
    const ruta = rad.locator('span[aria-hidden="true"]').first();

    // Formen (byggkrav 2, renderad — L245/L246): 24×24 (size-6), radius 8 px
    // (rounded-lg — radens/hover-plattans radie-språk, K56; kortets YTTERradie
    // är 16 px och en annan skala), siffran i text-caption (12 px) semibold.
    const box = await ruta.boundingBox();
    expect(box?.width).toBe(24);
    expect(box?.height).toBe(24);

    // LEDANDE positionen (byggkrav 1: numrutan ERSÄTTER den ledande ikonen) —
    // rutan står först i raden, vid radens innehållskant (px-2 = 8 px).
    // Delta-mätt i SAMMA ögonblick som box-mätningen (ompasserings-härdning:
    // ingen retry-separerad om-mätning som kan jämföra gamla mot färska x).
    const radBox = await rad.boundingBox();
    expect((box?.x ?? 0) - (radBox?.x ?? 0)).toBe(8);

    await expect(ruta).toHaveCSS('border-radius', '8px');
    await expect(ruta).toHaveCSS('font-size', '12px');
    await expect(ruta).toHaveCSS('font-weight', '600');
    // Siffran CENTRERAD i rutan (byggkrav 2, renderad — flex-centreringen).
    await expect(ruta).toHaveCSS('justify-content', 'center');
    await expect(ruta).toHaveCSS('align-items', 'center');

    // FÄRGVAKTEN (beslutsgrundad, S83-konvergensen: grå ruta föll på att den
    // delade färg med hover-plattan — Marcus-fångst): rutan är bg-surface och
    // får ALDRIG dela värde med bg-emphasized, i VILA och under HOVER.
    // Siffran bär text-text-secondary (byggkrav 2, renderad).
    const [surface, emphasized, sekundar] = await page.evaluate(() => {
      const probe = document.createElement('span');
      document.body.appendChild(probe);
      const las = (token: string) => {
        probe.style.color = token;
        return getComputedStyle(probe).color;
      };
      const trio = [
        las('var(--mm-surface)'),
        las('var(--mm-bg-emphasized)'),
        las('var(--mm-text-secondary)'),
      ];
      probe.remove();
      return trio;
    });
    expect(surface).not.toBe(emphasized);
    await expect(ruta).toHaveCSS('background-color', surface);
    await expect(ruta).toHaveCSS('color', sekundar);
    await rad.hover();
    await expect(rad).toHaveCSS('background-color', emphasized);
    await expect(ruta).toHaveCSS('background-color', surface);
  });

  test('hover-plattan (K72): emphasized-platta med rundade hörn på hovrad rad, transparent i vila', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-atgarder"]');
    const rad = grupp.getByRole('button', { name: 'Skicka bekräftelsemail till obekräftade' });

    // Vila: transparent bakgrund (plattan finns bara vid hover).
    const bgVila = await rad.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgVila).toBe('rgba(0, 0, 0, 0)');

    // Hover: emphasized-plattan (K56-grammatiken) — computed mot token-kedjan.
    // toHaveCSS auto-retryar förbi motion-safe-transitionens mellanvärden.
    const emphasized = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--mm-bg-emphasized)';
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    await rad.hover();
    await expect(rad).toHaveCSS('background-color', emphasized);
    await expect(rad).toHaveCSS('border-radius', '8px');

    // Plattans -mx-2-geometri (K72): knappen skjuter 8 px UTANFÖR kortets
    // 16 px innehålls-inset (kant + padding) — plattan får luft utan att
    // texten flyttas. DOM-mätt mot kortets computed kant/padding-kedja.
    const kortet = grupp.locator('[data-testid="grupp-kort"]');
    const kortMatt = await kortet.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        x: el.getBoundingClientRect().x,
        inset: Number.parseFloat(s.borderLeftWidth) + Number.parseFloat(s.paddingLeft),
      };
    });
    expect(kortMatt.inset).toBe(17); // 1 px kant + 16 px padding (px-4)
    const radX = (await rad.boundingBox())?.x ?? 0;
    expect(radX).toBe(kortMatt.x + kortMatt.inset - 8);
  });

  test('Skriv ut är skarp: raden anropar window.print', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.addInitScript(() => {
      (window as unknown as { __printAnrop: number }).__printAnrop = 0;
      window.print = () => {
        (window as unknown as { __printAnrop: number }).__printAnrop += 1;
      };
    });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Skriv ut denna detaljsida' }).click();
    const anrop = await page.evaluate(
      () => (window as unknown as { __printAnrop: number }).__printAnrop,
    );
    expect(anrop).toBe(1);
  });

  test('okopplade rader bär aria-disabled tills sina flöden finns (18.6/18.8); de skarpa gör det inte', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-atgarder"]');
    for (const namn of [
      'Skicka bekräftelsemail till obekräftade',
      'Skicka betalningspåminnelse till obetalda',
      'Markera alla obetalda som betalda',
      'Skicka eventinfo till alla anmälda',
    ]) {
      await expect(grupp.getByRole('button', { name: namn })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
    await expect(
      grupp.getByRole('link', { name: 'Lägg till manuell anmälan' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    await expect(
      grupp.getByRole('button', { name: 'Skriv ut denna detaljsida' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
  });
});

/**
 * task-18.2 — Beläggningen till S73-facit (K14–K22): innehållsmodellen som
 * mappar basen 1-till-1, segmenterad mätare med streck-markörer, Väntelista-
 * raden alltid med utanför taket, och Ändra-morfen på de tre skrivbara fälten
 * via uppdatera-event-operationen.
 *
 * Deterministisk via `page.route`-mock (mark-paid-precedentens split): SERVER-
 * kontraktet (allowlist, faktisk mutation mot staging, per-källa-aggregationen,
 * omläsning, restore) bevisas av tests/api/update-event.staging.test.ts +
 * tests/api/get-event.staging.test.ts; dessa e2e bevisar KLIENTENS form och
 * beteende flak-fritt (renderad verifiering — L245/L246).
 */
test.describe('Beläggningen (task-18.2)', () => {
  test('K16-modellen renderad mot facit: radordning, värden, väntelistan alltid med', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');

    // Radordningen är Marcus-modellens (K16): taket först, sedan kategorierna
    // som fyller det, väntelistan sist (utanför taket).
    const termer = await grupp.locator('dt').allTextContents();
    expect(termer).toEqual([
      'Max antal platser',
      'Extra platser',
      'Anmälda deltagare',
      'Manuellt tillagda',
      'Medföljande',
      'Väntelista',
    ]);

    // Värdena ur innehållsmodellen (per-källa — inte basens aggregat).
    const varden = await grupp.locator('dd').allTextContents();
    expect(varden).toEqual(['12', '1', '8', '1', '1', '0']);
  });

  test('streck-markörerna: kategorirader bär färgade streck == mätarens segment; väntelistan utan', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');

    // Renderad verifiering (L245): streckens computed background-color per rad —
    // fyra kategorirader har streck, Max/Väntelista har inga.
    const streckFarger = await grupp
      .locator('dt span[aria-hidden="true"]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(streckFarger.length).toBe(4);
    // Fyra DISTINKTA kategorifärger (aldrig samma färg två gånger).
    expect(new Set(streckFarger).size).toBe(4);

    // Mätarens segment bär SAMMA färger som strecken (GitHub-storage-klassen:
    // streck på raderna == segment i stapeln) — ordningen är fyllnadsordningen
    // (deltagare först, reserverade sist), inte radordningen.
    const segmentFarger = await grupp
      .locator('[data-testid^="belaggning-segment-"]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(segmentFarger.length).toBe(4);
    expect(new Set(segmentFarger)).toEqual(new Set(streckFarger));

    // Deltagar-blå är INTE fokusringens exklusiva #1b4965 (konstitutionen:
    // --p-blue-700 aldrig till annat — medveten facit-avvikelse, öppet bokförd).
    expect(streckFarger).not.toContain('rgb(27, 73, 101)');
  });

  test('mätaren: "11 av 12 platser upptagna" + 92 % + proportionella segment; dekorativ stapel', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');

    // TEXTEN är bäraren (a11y): summering + procent (8+1+1+1 = 11 av 12 = 92 %).
    await expect(grupp.getByText('11 av 12 platser upptagna')).toBeVisible();
    await expect(grupp.getByText('92 %')).toBeVisible();

    // Stapeln är dekorativ (aria-hidden) och segmentbredderna proportionella:
    // formulär-segmentet (8/12) är störst — DOM-mätt (L246).
    const matare = grupp.locator('[data-testid="belaggning-matare"]');
    await expect(matare.locator('[aria-hidden="true"]')).toHaveCount(1);
    const bredder = await matare
      .locator('[data-testid^="belaggning-segment-"]')
      .evaluateAll((els) =>
        els.map((el) => ({
          nyckel: (el as HTMLElement).dataset.testid,
          bredd: el.getBoundingClientRect().width,
        })),
      );
    const formular = bredder.find((b) => b.nyckel === 'belaggning-segment-formular');
    expect(formular).toBeTruthy();
    for (const b of bredder) {
      if (b.nyckel !== 'belaggning-segment-formular') {
        expect(formular?.bredd ?? 0).toBeGreaterThan(b.bredd);
      }
    }
  });

  test('fullt event: " · Fullt" i mätartexten; utan tak: tomt spår', async ({ page }) => {
    await mockEvent(
      page,
      eventDetail({ viaFormular: 9, maxPlatser: 12, reserverade: 1, manuelltTillagda: 1 }),
    );
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('12 av 12 platser upptagna · Fullt')).toBeVisible();
  });

  test('MORFEN Δ=0 px DOM-mätt (AC #2): kortets geometri + etikett-positioner; likbredda w-32-fält', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    const kort = grupp.locator('[data-testid="grupp-kort"]');

    // DOKUMENT-relativa positioner (top + scrollY): morfens autoFocus scrollar
    // fältet i vy → viewport-relativa boundingBox-y skiftar av SCROLLEN, inte
    // av geometrin. Dokument-koordinater är den ärliga Δ=0 px-mätningen.
    const kortBox = () =>
      kort.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY, height: r.height, width: r.width };
      });
    const labelTops = () =>
      kort
        .locator('dt')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top + window.scrollY));

    // Läge 1 (visning): kortets box + varje etiketts y-position.
    const before = await kortBox();
    const labelYBefore = await labelTops();

    await grupp.getByRole('button', { name: 'Ändra' }).click();

    // Läge 2 (redigering): exakt samma kort-geometri och rad-positioner (Δ=0 px).
    const after = await kortBox();
    expect(after.height).toBe(before.height);
    expect(after.top).toBe(before.top);
    expect(after.width).toBe(before.width);

    const labelYAfter = await labelTops();
    expect(labelYAfter).toEqual(labelYBefore);

    // Likbredda fält per-FORMULÄR (K15): tre antal-fält-slotar, exakt samma
    // bredd, smalare än Om eventets w-60 (fältbredd speglar förväntat svar).
    const slotBredder = await kort
      .locator('[data-testid="falt-slot"]')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    expect(slotBredder.length).toBe(3);
    expect(new Set(slotBredder).size).toBe(1);
    expect(slotBredder[0]).toBeLessThan(240);
  });

  test('"ändrar från"-mönstret: nuvarande värden dämpade bredvid antal-fälten', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    await grupp.getByRole('button', { name: 'Ändra' }).click();

    // Nuvarande värden står kvar synliga (dämpade) genom hela ändringen —
    // endast de TRE redigerbara raderna bär mönstret (läsraderna är kontext).
    const nuvarande = grupp.locator('[data-testid="nuvarande-varde"]');
    await expect(nuvarande).toHaveText(['12', '1', '1']);

    // Fokus-kontinuitet: första fältet fokuserat när morfen öppnas.
    await expect(grupp.getByRole('textbox', { name: 'Max antal platser' })).toBeFocused();
  });

  test('Spara skriver via update-event: TRE absoluta fält; mergen behåller räkningsraderna', async ({
    page,
  }) => {
    // Server-sanning i mocken: efter update speglar get-event det nya värdet —
    // onSettled-refetchen (ADR-016 E) ska KONVERGERA, inte backa.
    let serverMax = 12;
    await mockNotes(page);
    await mockValjarLista(page, VALJAR_LISTA);
    await page.route(GET_EVENT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ event: eventDetail({ maxPlatser: serverMax }) }),
      });
    });
    let updateBody: Record<string, unknown> | null = null;
    await page.route(UPDATE_EVENT, async (route) => {
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      serverMax = 14;
      // update-event-svaret bär ALDRIG räkningarna (viaFormular/medfoljande/
      // vantelista) — exakt EF-formen; mergen i useUpdateEvent måste bevara dem.
      const {
        viaFormular: _vf,
        medfoljande: _mf,
        vantelista: _vl,
        ...utanRakningar
      } = eventDetail({ maxPlatser: 14 });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: utanRakningar,
          record: { id: EVENT_ID, fields: {} },
        }),
      });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    await grupp.getByRole('button', { name: 'Ändra' }).click();

    // Ändra Max antal platser 12 → 14 (RAC NumberField committar vid blur).
    await grupp.getByRole('textbox', { name: 'Max antal platser' }).fill('14');
    await grupp.getByRole('button', { name: 'Spara' }).click();

    // Morfen stängs mot svaret; raden visar nya värdet.
    await expect(grupp.getByRole('button', { name: 'Ändra' })).toBeVisible();
    await expect(grupp.getByText('14', { exact: true })).toBeVisible();

    // Payloaden: eventId + sektionens TRE fält som absoluta värden, inga extra.
    expect(updateBody).toEqual({
      eventId: EVENT_ID,
      maxPlatser: 14,
      reserverade: 1,
      manuelltTillagda: 1,
    });

    // MERGE-BEVISET: räkningsraderna står kvar direkt efter Spara (utan mergen
    // hade Anmälda deltagare/Medföljande/Väntelista blinkat bort tills refetchen).
    const termer = await grupp.locator('dt').allTextContents();
    expect(termer).toContain('Anmälda deltagare');
    expect(termer).toContain('Väntelista');
    await expect(grupp.getByText('8', { exact: true })).toBeVisible();
  });

  test('fel-väg: update-event 500 → role=alert med fel, morfen förblir öppen', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.route(UPDATE_EVENT, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error', requestId: 'req-test-2' }),
      });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    await grupp.getByRole('button', { name: 'Ändra' }).click();
    await grupp.getByRole('button', { name: 'Spara' }).click();

    await expect(page.getByRole('alert')).toContainText('Kunde inte spara');
    await expect(grupp.getByRole('button', { name: 'Spara' })).toBeVisible();
  });

  test('Avbryt: ändringar kastas; fokus tillbaka till Beläggningens Ändra-knapp', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    await grupp.getByRole('button', { name: 'Ändra' }).click();
    await grupp.getByRole('textbox', { name: 'Max antal platser' }).fill('99');
    await grupp.getByRole('button', { name: 'Avbryt' }).click();

    // Visningsläget åter med OFÖRÄNDRAT värde; fokus-retur till gruppens Ändra.
    await expect(grupp.getByText('12', { exact: true })).toBeVisible();
    await expect(grupp.getByRole('button', { name: 'Ändra' })).toBeFocused();
  });

  test('stale cache utan beläggningsfält: räkningsrader 0, väntelistan ändå med, ingen krasch', async ({
    page,
  }) => {
    // Optional-fälten frånvarande (äldre EF-svar/get-events-cache-form).
    await mockEvent(
      page,
      eventDetail({
        reserverade: undefined,
        manuelltTillagda: undefined,
        viaFormular: undefined,
        medfoljande: undefined,
        vantelista: undefined,
      }),
    );
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    const termer = await grupp.locator('dt').allTextContents();
    // Rader med null-värde döljs (K6-normen); Anmälda deltagare + Väntelista
    // står ALLTID (K22) — med 0.
    expect(termer).toEqual(['Max antal platser', 'Anmälda deltagare', 'Väntelista']);
  });
});

/**
 * task-18.5 — PERSONKORTEN i Anmälda deltagare (S73-facit K45/K62).
 *
 * Formen: identitetszonen (namn i fetstil + E-post etikett-över-värde) ÄR
 * person-klickytan; metaytan ligger UTANFÖR den (interaktivt i interaktivt är
 * förbjudet, K44/L303) och bär Anmäld dag + klockslag på EN rad, därunder
 * ENDAST UTFÖRDA åtgärder, sist historikraden med HELA namnet Miranon Media.
 *
 * **Placering (öppet bokförd):** task-18.4:s deltagar-svit ligger utanför denna
 * skivas deklarerade fil-yta; personkorten renderas på eventsidan och bevisas
 * därför i eventsidans egen svit. Samma `page.route`-mock-split som ovan.
 */

const PK_EVENT_ID = 'recPERSONKORT0001';
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';

type PkJson = Record<string, unknown>;

function pkRegistrering(overrides: PkJson): PkJson {
  return {
    id: 'recPk',
    namn: null,
    fornamn: null,
    efternamn: null,
    email: null,
    telefon: null,
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Obekräftad',
    flagga: null,
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: null,
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: PK_EVENT_ID,
    personId: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: null,
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: null,
    ...overrides,
  };
}

/**
 * Anna  — Obekräftad · person-länk · 0 genomförda ⇒ "Första eventet"
 *         · INGEN utförd åtgärd (ej-skickat får aldrig synas)
 * David  — Bekräftad · person-länk · Källa '+1' · alla tre utskicken utförda
 *         · 3 genomförda ⇒ "3 tidigare event"
 * Cecilia— Bekräftad · SAKNAR person-länk och e-post · räknaren okänd (null)
 */
const PK_DELTAGARE: PkJson[] = [
  pkRegistrering({
    id: 'recPkAnna',
    namn: 'Anna Ek',
    email: 'anna@example.se',
    personId: 'recPersonAnna001',
    inskickad: '2026-07-01T09:00:00.000Z',
    antalGenomfordaEvent: 0,
  }),
  pkRegistrering({
    id: 'recPkDavid',
    namn: 'David Nord',
    email: 'david@example.se',
    personId: 'recPersonDavid01',
    status: 'Bekräftad (mail skickat)',
    kalla: '+1',
    inskickad: '2026-06-25T09:00:00.000Z',
    bekraftelseSkickad: '2026-06-26T09:00:00.000Z',
    betalningspaminnelseSkickad: '2026-07-08T09:00:00.000Z',
    deltagarinfoSkickad: '2026-07-10T09:00:00.000Z',
    antalGenomfordaEvent: 3,
  }),
  pkRegistrering({
    id: 'recPkCecilia',
    namn: 'Cecilia Lund',
    status: 'Bekräftad (mail skickat)',
    inskickad: '2026-07-05T09:00:00.000Z',
  }),
];

async function mockaPersonkort(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  registrations: PkJson[] = PK_DELTAGARE,
): Promise<void> {
  await page.route(GET_EVENT, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: eventDetail({ id: PK_EVENT_ID }) }),
    });
  });
  await mockNotes(page);
  await mockValjarLista(page, VALJAR_LISTA);
  await page.route(GET_REGISTRATIONS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations }),
    });
  });
}

test.describe('Personkorten — metaytan + historiken (task-18.5)', () => {
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  const gruppen = (page: any) => page.locator('section[aria-labelledby="grupp-deltagare"]');

  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  async function oppnaSidan(page: any): Promise<void> {
    await page.goto(`/event/${PK_EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(gruppen(page).getByRole('heading', { name: 'Anmälda deltagare' })).toBeVisible();
    // Arkivet är stängt per K40 — personkorten där behövs i flera assertioner.
    await gruppen(page).getByRole('button', { name: 'Bekräftade (2)', exact: true }).click();
  }

  /** Kortet för en namngiven deltagare. */
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  const kortet = (page: any, namn: string) =>
    gruppen(page).getByTestId('deltagar-kort').filter({ hasText: namn });

  test('identitetszonen är person-länken: namn i fetstil + E-post etikett-över-värde', async ({
    page,
  }) => {
    await mockaPersonkort(page);
    await oppnaSidan(page);

    const anna = kortet(page, 'Anna Ek');
    // Kortet bär sedan 18.17 TVÅ länkar (person + anmälan) — identitetszonen
    // är person-länken, adresserad på sitt href.
    const identitet = anna.locator('a[href="/personer/recPersonAnna001"]');
    await expect(identitet).toBeVisible();

    // Namnet ligger INUTI person-länken och står i fetstil (facitets identitet).
    await expect(identitet.getByTestId('deltagar-namn')).toHaveText('Anna Ek');
    const vikt = await identitet
      .getByTestId('deltagar-namn')
      .evaluate((el: Element) => getComputedStyle(el).fontWeight);
    expect(Number(vikt)).toBeGreaterThanOrEqual(600);

    // E-post som ETIKETT ÖVER VÄRDE — båda inne i identitetszonen.
    await expect(identitet.getByText('E-post', { exact: true })).toBeVisible();
    await expect(identitet.getByText('anna@example.se')).toBeVisible();

    // Kategori-pillen står UTANFÖR länken (status är ingen del av identiteten)
    // och normen (via formulär) bär inget märke alls.
    await expect(identitet.getByText('Obekräftad')).toHaveCount(0);
    await expect(anna.getByText('Obekräftad')).toBeVisible();
    await expect(anna.getByText('Manuellt tillagd')).toHaveCount(0);
    await expect(
      kortet(page, 'David Nord').getByText('Medföljande', { exact: true }),
    ).toBeVisible();
  });

  test('metaytan ligger UTANFÖR person-länken och bär Anmäld dag + klockslag på EN rad', async ({
    page,
  }) => {
    await mockaPersonkort(page);
    await oppnaSidan(page);

    const anna = kortet(page, 'Anna Ek');
    const meta = anna.getByTestId('deltagar-metayta');

    // K62/L303: metaytan är SYSKON till person-länken (aldrig inuti den).
    // Sedan 18.17 är Anmäld-raden en riktig LÄNK till anmälans sida — metaytan
    // bär EXAKT en länk och inga knappar (no-op-eran är över).
    await expect(meta.locator('a')).toHaveCount(1);
    await expect(meta.locator('button')).toHaveCount(0);
    await expect(
      anna.locator('a[href="/personer/recPersonAnna001"]').getByTestId('deltagar-metayta'),
    ).toHaveCount(0);

    // EN rad med både dag och klockslag (Inskickad är en dateTime).
    const rader = await meta.getByTestId('deltagar-meta-rad').allTextContents();
    expect(rader).toHaveLength(1);
    expect(rader[0]).toMatch(/^Anmäld 1 juli \d{2}:\d{2}$/);
  });

  test('ENDAST utförda åtgärder renderas — ej-skickat visas aldrig', async ({ page }) => {
    await mockaPersonkort(page);
    await oppnaSidan(page);

    // Anna har inget utskick gjort: metaytan bär BARA Anmäld-raden.
    const annaRader = await kortet(page, 'Anna Ek')
      .getByTestId('deltagar-meta-rad')
      .allTextContents();
    expect(annaRader).toEqual([annaRader[0]]);
    await expect(kortet(page, 'Anna Ek').getByText(/Ej skickat|Ej skickad/)).toHaveCount(0);

    // David har alla tre utförda — var och en på sin egen rad, i Lottas
    // utskicksordning (bekräftelse → påminnelse → eventinfo, K42).
    const davidRader = await kortet(page, 'David Nord')
      .getByTestId('deltagar-meta-rad')
      .allTextContents();
    expect(davidRader.slice(1)).toEqual([
      'Bekräftelse 26 juni',
      'Påminnelse 8 juli',
      'Eventinfo 10 juli',
    ]);
    expect(davidRader[0]).toMatch(/^Anmäld 25 juni \d{2}:\d{2}$/);
  });

  test('historikraden: Första eventet / N tidigare event — HELA namnet Miranon Media', async ({
    page,
  }) => {
    await mockaPersonkort(page);
    await oppnaSidan(page);

    await expect(kortet(page, 'Anna Ek').getByTestId('deltagar-historik')).toHaveText(
      'Första eventet hos Miranon Media',
    );
    await expect(kortet(page, 'David Nord').getByTestId('deltagar-historik')).toHaveText(
      '3 tidigare event hos Miranon Media',
    );
    // Okänd räknare (ingen person-koppling) ⇒ ingen rad — en osann "Första
    // eventet" är värre än en utelämnad rad.
    await expect(kortet(page, 'Cecilia Lund').getByTestId('deltagar-historik')).toHaveCount(0);
  });

  test('utan person-koppling: identitetszonen renderas OLÄNKAD, e-postluckan syns', async ({
    page,
  }) => {
    await mockaPersonkort(page);
    await oppnaSidan(page);

    const cecilia = kortet(page, 'Cecilia Lund');
    // IDENTITETSZONEN olänkad (ingen person-koppling) — men Anmäld-radens
    // anmälningslänk (18.17) finns kvar: den kräver ingen person.
    await expect(cecilia.locator('a[href^="/personer/"]')).toHaveCount(0);
    await expect(
      cecilia.locator(`a[href="/event/${PK_EVENT_ID}/anmalan/recPkCecilia"]`),
    ).toHaveCount(1);
    await expect(cecilia.getByTestId('deltagar-namn')).toHaveText('Cecilia Lund');
    // Luckan redovisas som den är — aldrig bortdesignad, aldrig "null".
    await expect(cecilia.getByText('E-post', { exact: true })).toBeVisible();
    await expect(cecilia.getByText('Saknas', { exact: true })).toBeVisible();
  });

  test('AC #2 (rev. 2026-07-23; länkad i 18.17): Anmäld-raden är understruken LÄNK till anmälans sida', async ({
    page,
  }) => {
    await mockaPersonkort(page);
    await oppnaSidan(page);

    // Review-våg 2 (Marcus 2026-07-23): PRD task-18 punkt 18 ("ingen
    // länk-affordans i skarp produkt") RIVEN ÖPPET — facit-K62-formen gäller:
    // understruken rad med "Öppna anmälan"-namnet. Sedan task-18.17 finns
    // länkmålet (per-anmälan-detaljvyn) och raden är en riktig <a>.
    const anmald = kortet(page, 'Anna Ek').getByRole('link', {
      name: 'Öppna anmälan för Anna Ek',
    });
    await expect(anmald).toBeVisible();
    await expect(anmald).toHaveText(/^Anmäld /);
    await expect(anmald).toHaveAttribute('href', `/event/${PK_EVENT_ID}/anmalan/recPkAnna`);
    const dekoration = await anmald.evaluate(
      (el: Element) => getComputedStyle(el).textDecorationLine,
    );
    expect(dekoration).toContain('underline');
    // Kortens länkar: person-länkarna (2 av 3 korten) + Anmäld-länkarna
    // (alla 3 korten bär Inskickad) — inga andra.
    await expect(
      gruppen(page).getByTestId('deltagar-kort').locator('a[href^="/personer/"]'),
    ).toHaveCount(2);
    await expect(
      gruppen(page).getByTestId('deltagar-kort').locator('a[href*="/anmalan/"]'),
    ).toHaveCount(3);
  });

  test('390 px med TVÅ pillar: namnet och e-posten bryts inte mitt i ordet', async ({ page }) => {
    // DEFEKT fångad i facit-avprickningens 390-px-mätning: pillspannet stod
    // shrink-0 och åt så mycket bredd att identitetskolumnen kollapsade —
    // namnet radbröts och e-posten bröts MITT I ORDET ("bertil@exa/mple.se").
    // Pillarna wrappar nu i stället. Mätt som RADBOXAR (getClientRects), inte
    // klass-närvaro (L246).
    await page.setViewportSize({ width: 390, height: 844 });
    // HELA facit-uppsättningen + Bertil — samma scen som facit-avprickningens
    // skärmdump, så testet och den renderade verifieringen bevisar samma bild.
    await mockaPersonkort(page, [
      ...PK_DELTAGARE,
      pkRegistrering({
        id: 'recPkBertil',
        namn: 'Bertil Sund',
        email: 'bertil@example.se',
        personId: 'recPersonBertil1',
        kalla: 'Manuell',
        inskickad: '2026-06-20T14:30:00.000Z',
        antalGenomfordaEvent: 1,
      }),
    ]);
    await page.goto(`/event/${PK_EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const bertil = kortet(page, 'Bertil Sund');
    // Båda pillarna renderas (kombinationen obekräftad + manuellt tillagd).
    await expect(bertil.getByText('Obekräftad')).toBeVisible();
    await expect(bertil.getByText('Manuellt tillagd')).toBeVisible();

    // Radboxarna räknas över TEXTINNEHÅLLET via en Range — elementens egna
    // getClientRects() ger alltid 1 (flex-items blockifieras), vilket hade
    // gjort assertionen blind för precis den brytning som var defekten.
    const radboxar = (el: Element) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return r.getClientRects().length;
    };
    expect(await bertil.getByTestId('deltagar-namn').evaluate(radboxar)).toBe(1);
    expect(await bertil.getByText('bertil@example.se').evaluate(radboxar)).toBe(1);
  });

  test('axe 0 på personkorten', async ({ page }) => {
    await mockaPersonkort(page);
    await oppnaSidan(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('section[aria-labelledby="grupp-deltagare"]')
      .analyze();
    expect(
      results.violations,
      results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'),
    ).toEqual([]);
  });
});

/**
 * ── Gruppdynamik — erfarenhetsmix + kurshistorik + motiveringar (task-18.10) ──
 *
 * Deterministisk via `page.route`-mock av get-registrations (samma split som
 * 18.4/18.5; helt mockad, staging-CORS aldrig i spel — körs på egen dev-port).
 *
 * Datasetet bär facitets tre nivåer + T16-luckan + genomförd-filtret + Läs mer:
 *   Erik  — 3 genomförda (⇒ "3+") · badge 'Resenär steg 1–2' (RIM-3-BLIND: räknaren
 *           säger 3+, badgen bara 1–2 = den kända luckan visad RÅ) · kurshistorik
 *           FS/RIM 1/RIM 2 genomförda + en Dag 2-dubblett + en icke-närvaro-rad
 *           (båda ska filtreras bort) · LÅNG motivering (Läs mer)
 *   Sara  — 2 genomförda (⇒ "1–2") · badge 'Resenär steg 1' · KORT motivering
 *   Anna  — 0 genomförda (⇒ "Första eventet") · badge 'Ej påbörjat' · tom kurshistorik
 *   Uno   — Källa 'Manuell', INGEN Person-länk (räknare/badge/kurshistorik null,
 *           ingen motivering) ⇒ EJ klassificerbar → utanför mixen helt
 */

const GD_EVENT_ID = 'recGRUPPDYNAMIK1';

const GD_LANG_MOTIVERING =
  'Hej! Jag lyssnade på ett poddavsnitt med Roger för en tid sedan och kände direkt att det här vill jag utforska mer.\nJag har alltid varit en sökande person och gått några kurser genom åren, men det är först nu jag har tid att fördjupa mig på riktigt. Det är så givande att både lära sig nytt och samtidigt få träffa andra som är intresserade av samma saker.';

type GdHist = Record<string, unknown>;
function gdHist(id: string, kursnamn: string, datum: string, overrides: GdHist = {}): GdHist {
  // PersonHistoryEntry-shapen (get-person-kontraktet återanvänt). Standard =
  // en GENOMFÖRD kurspost (Dag 1, Närvarande, narvaro true).
  return {
    id,
    kursnamn,
    eventLabel: `${kursnamn}-event`,
    datum,
    session: 'Dag 1',
    status: 'Närvarande',
    narvaro: true,
    ort: 'Skövde',
    typ: 'Utbildning',
    ...overrides,
  };
}

function gdReg(overrides: PkJson): PkJson {
  return pkRegistrering({
    eventId: GD_EVENT_ID,
    erfarenhetsbadge: null,
    kurshistorik: null,
    ...overrides,
  });
}

const GD_DELTAGARE: PkJson[] = [
  gdReg({
    id: 'recGdErik',
    namn: 'Erik Berg',
    email: 'erik@example.se',
    personId: 'recPersonErik001',
    status: 'Bekräftad (mail skickat)',
    inskickad: '2026-07-01T09:00:00.000Z',
    antalGenomfordaEvent: 3,
    // RIM-3-BLIND: räknaren 3+ men badgen bara 1–2 = den kända luckan (T16).
    erfarenhetsbadge: 'Resenär steg 1–2',
    motivering: GD_LANG_MOTIVERING,
    kurshistorik: [
      gdHist('recH1', 'Fjärrskådning', '2025-08-23'),
      gdHist('recH2', 'Resor i medvetandet 1', '2025-10-18'),
      gdHist('recH3', 'Resor i medvetandet 2', '2026-02-21'),
      // Dag 2-dubblett av samma event — får ALDRIG bli en egen kurshistorik-rad.
      gdHist('recH4', 'Resor i medvetandet 2', '2026-02-22', { session: 'Dag 2' }),
      // Ej närvarande — filtreras bort (genomförd = Närvaropoäng 1).
      gdHist('recH5', 'Resor i medvetandet 3', '2026-04-11', {
        status: 'Frånvarande',
        narvaro: false,
      }),
    ],
  }),
  gdReg({
    id: 'recGdSara',
    namn: 'Sara Nyström',
    email: 'sara@example.se',
    personId: 'recPersonSara001',
    status: 'Bekräftad (mail skickat)',
    inskickad: '2026-07-02T09:00:00.000Z',
    antalGenomfordaEvent: 2,
    erfarenhetsbadge: 'Resenär steg 1',
    motivering: 'Gick RIM 1 i februari och vill utforska mitt medvetande djupare.',
    kurshistorik: [
      gdHist('recH6', 'Fjärrskådning', '2025-10-11'),
      gdHist('recH7', 'Resor i medvetandet 1', '2026-02-07'),
    ],
  }),
  gdReg({
    id: 'recGdAnna',
    namn: 'Anna Ek',
    email: 'anna@example.se',
    personId: 'recPersonAnna002',
    inskickad: '2026-07-03T09:00:00.000Z',
    antalGenomfordaEvent: 0,
    erfarenhetsbadge: 'Ej påbörjat',
    motivering: 'Har länge velat utforska mitt inre.',
    kurshistorik: [],
  }),
  gdReg({
    id: 'recGdUno',
    namn: 'Uno Manuell',
    status: 'Bekräftad (mail skickat)',
    kalla: 'Manuell',
    inskickad: '2026-07-04T09:00:00.000Z',
    // Ingen Person-länk ⇒ EF:en lämnar räknare/badge/kurshistorik null.
  }),
];

async function mockaGruppdynamik(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  registrations: PkJson[] = GD_DELTAGARE,
): Promise<void> {
  await page.route(GET_EVENT, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: eventDetail({ id: GD_EVENT_ID }) }),
    });
  });
  await mockNotes(page);
  await mockValjarLista(page, VALJAR_LISTA);
  await page.route(GET_REGISTRATIONS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations }),
    });
  });
}

test.describe('Gruppdynamik — erfarenhetsmix + kurshistorik + motiveringar (task-18.10)', () => {
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  const gruppen = (page: any) => page.locator('section[aria-labelledby="grupp-gruppdynamik"]');

  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  async function oppnaSidan(page: any): Promise<void> {
    await page.goto(`/event/${GD_EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(gruppen(page).getByRole('heading', { name: 'Gruppdynamik' })).toBeVisible();
  }

  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  const niva = (page: any, namn: string) =>
    gruppen(page).getByRole('button', { name: new RegExp(`^${namn}`) });

  test('summeringsraden: återkommande av KLASSIFICERBARA (manuell utan länk räknas ej)', async ({
    page,
  }) => {
    await mockaGruppdynamik(page);
    await oppnaSidan(page);

    // Klassificerbara = Erik, Sara, Anna (Uno saknar räknare ⇒ utanför mixen).
    // Återkommande (räknare > 0) = Erik + Sara = 2 av 3.
    await expect(gruppen(page).getByTestId('gruppdynamik-summering')).toHaveText('2 av 3');
    // Uno finns aldrig i erfarenhetsmixen (varken bucket eller kort).
    await expect(gruppen(page).getByText('Uno Manuell')).toHaveCount(0);
  });

  test('de tre nivå-accordionerna bär rätt antal (buckets ur antalGenomfordaEvent)', async ({
    page,
  }) => {
    await mockaGruppdynamik(page);
    await oppnaSidan(page);

    await expect(niva(page, 'Första eventet')).toContainText('1');
    await expect(niva(page, '1–2 tidigare event')).toContainText('1');
    await expect(niva(page, '3\\+ tidigare event')).toContainText('1');
  });

  test('accordion öppnar personkortet med kurshistorik i kursfärgs-tokensen + månad/år', async ({
    page,
  }) => {
    await mockaGruppdynamik(page);
    await oppnaSidan(page);

    const knapp = niva(page, '3\\+ tidigare event');
    await expect(knapp).toHaveAttribute('aria-expanded', 'false');
    await knapp.click();
    await expect(knapp).toHaveAttribute('aria-expanded', 'true');

    const erik = gruppen(page)
      .getByTestId('gruppdynamik-personkort')
      .filter({ hasText: 'Erik Berg' });
    await expect(erik).toBeVisible();

    // GENOMFÖRD-FILTRET + DEDUP: FS/RIM 1/RIM 2 = 3 rader. Dag 2-dubbletten och
    // den icke-närvarande RIM 3-raden syns ALDRIG.
    const rader = erik.getByTestId('gruppdynamik-kurshistorik-rad');
    await expect(rader).toHaveCount(3);
    await expect(rader.nth(0)).toContainText('Fjärrskådning');
    await expect(rader.nth(0)).toContainText('augusti 2025');
    await expect(rader.nth(1)).toContainText('RIM 1'); // legend-etiketten, ej basens långnamn
    await expect(rader.nth(1)).toContainText('oktober 2025');
    await expect(rader.nth(2)).toContainText('RIM 2');
    await expect(rader.nth(2)).toContainText('februari 2026');
    await expect(erik.getByText('RIM 3')).toHaveCount(0);

    // Kursfärgs-TOKENSEN renderade: RIM 1-streckets bakgrund == --mm-kurs-rim1
    // (#606b57 = rgb(96,107,87)). Bevisar tokens-färgen, inte bara en klass.
    const rim1Streck = rader.nth(1).locator('span[aria-hidden="true"]');
    const bg = await rim1Streck.evaluate((el: Element) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(96, 107, 87)');
  });

  test('T16: den RÅA Erfarenhetsbadgen visas som den är (RIM-3-blind, ej bortdesignad)', async ({
    page,
  }) => {
    await mockaGruppdynamik(page);
    await oppnaSidan(page);

    // Erik står i "3+ tidigare event" (räknaren är RIM-3-inkluderande) MEN bär
    // badgen 'Resenär steg 1–2' (RIM-3-BLIND). Divergensen ÄR den kända luckan.
    await niva(page, '3\\+ tidigare event').click();
    const erik = gruppen(page)
      .getByTestId('gruppdynamik-personkort')
      .filter({ hasText: 'Erik Berg' });
    await expect(erik.getByTestId('gruppdynamik-badge')).toHaveText('Resenär steg 1–2');
  });

  test('Första eventet: tom kurshistorik ⇒ "första gången"-raden, ingen kurshistorik-rad', async ({
    page,
  }) => {
    await mockaGruppdynamik(page);
    await oppnaSidan(page);

    await niva(page, 'Första eventet').click();
    const anna = gruppen(page)
      .getByTestId('gruppdynamik-personkort')
      .filter({ hasText: 'Anna Ek' });
    await expect(anna).toContainText('första gången hos Miranon Media');
    await expect(anna.getByTestId('gruppdynamik-kurshistorik-rad')).toHaveCount(0);
  });

  test('motiveringarna som vita kort — Läs mer visas BARA vid faktisk overflow', async ({
    page,
  }) => {
    await mockaGruppdynamik(page);
    await oppnaSidan(page);

    const erik = gruppen(page)
      .getByTestId('gruppdynamik-motivering')
      .filter({ hasText: 'Erik Berg' });
    const anna = gruppen(page)
      .getByTestId('gruppdynamik-motivering')
      .filter({ hasText: 'Anna Ek' });

    // Manuell utan formulärsvar (Uno) får inget motiveringskort.
    await expect(gruppen(page).getByTestId('gruppdynamik-motivering')).toHaveCount(3);

    // Kort svar (Anna) ryms på ≤3 rader ⇒ INGEN knapp.
    await expect(anna.getByRole('button')).toHaveCount(0);

    // Långt svar (Erik) overflowar ⇒ knappen finns (ETT motiveringskort =
    // EN knapp → stabil roll-locator; aria-label är KONTEXTUELL och ändras
    // Läs hela ⇄ Visa mindre, så vi ankrar aldrig på det föränderliga namnet).
    const knapp = erik.getByRole('button');
    await expect(knapp).toBeVisible();
    await expect(knapp).toHaveText('Läs mer');
    await expect(knapp).toHaveAttribute('aria-expanded', 'false');
    await expect(knapp).toHaveAttribute('aria-label', 'Läs hela motiveringen från Erik Berg');

    const vitStil = await erik
      .getByTestId('gruppdynamik-motivering-text')
      .evaluate((el: Element) => getComputedStyle(el).whiteSpace);
    expect(vitStil).toBe('pre-line');

    await knapp.click();
    await expect(knapp).toHaveText('Visa mindre');
    await expect(knapp).toHaveAttribute('aria-expanded', 'true');
    await expect(knapp).toHaveAttribute('aria-label', 'Visa mindre av motiveringen från Erik Berg');
    await expect(erik).toContainText('gått några kurser genom åren');

    await knapp.click();
    await expect(knapp).toHaveText('Läs mer');
  });

  test('axe 0 på gruppdynamiken (mätare, accordions öppna, motiveringar)', async ({ page }) => {
    await mockaGruppdynamik(page);
    await oppnaSidan(page);

    // Öppna alla accordions så personkorten + kurshistoriken axe-täcks öppna.
    await niva(page, 'Första eventet').click();
    await niva(page, '1–2 tidigare event').click();
    await niva(page, '3\\+ tidigare event').click();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('section[aria-labelledby="grupp-gruppdynamik"]')
      .analyze();
    expect(
      results.violations,
      results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'),
    ).toEqual([]);
  });

  test('review-våg 2: tomläget — "Inget att visa ännu" centrerat gråat + samma korthöjd som Närvaro', async ({
    page,
  }) => {
    // Marcus (2026-07-23): tomma kort ser lika stora ut — gemensam fast
    // minimihöjd för Närvaro- och Gruppdynamik-korten i tomläge; texten
    // "Inget att visa ännu" centrerad i muted-tonen (ersätter den gamla
    // vänsterställda erfarenhetsmix-raden).
    await mockaGruppdynamik(page, []);
    await oppnaSidan(page);

    const tomlage = gruppen(page).getByText('Inget att visa ännu', { exact: true });
    await expect(tomlage).toBeVisible();
    await expect(tomlage).toHaveCSS('text-align', 'center');

    // Höjd-paret: default-eventet är Planerat ⇒ Närvaro visar sitt tomläge
    // på samma sida — de två tonala korten är exakt lika höga.
    const narvaroKort = page
      .locator('section[aria-labelledby="grupp-narvaro"]')
      .getByTestId('grupp-kort');
    await expect(
      narvaroKort.getByText('Eventet är inte genomfört ännu', { exact: true }),
    ).toBeVisible();
    const gdKort = gruppen(page).getByTestId('grupp-kort');
    const nBox = await narvaroKort.boundingBox();
    const gBox = await gdKort.boundingBox();
    expect(nBox?.height).toBe(gBox?.height);
  });
});

/**
 * task-18.19 — Eventväljaren på eventdetaljsidan (review-iteration 5; S83
 * pass 4-facit, Marcus-låst 2026-07-24: **VARIANT A — väljaren ÄR rubriken**).
 *
 * H1:an är triggern: eventnamnet i full rubrikstorlek med chevron-par (20 px),
 * hela ytan klickbar i hover-plattans grammatik (-mx-2 px-2 py-1 rounded-lg +
 * bg-emphasized); sidhuvudets övriga delar (EventKey-pillen, tid kvar-raden,
 * avdelaren) orörda. Listan är SAMMA komponentfamilj som 18.18
 * (biblioteks-beviset: EventValjare, andra konsumenten — kommande event
 * närmast först, sök, månadsgruppering). Bytet navigerar routen
 * (/event/$eventId — URL:en alltid sann och delbar; 18.18 beslut a).
 *
 * INSTANT (ADR-078 + facit punkt 5): rubriken och Om eventet står DIREKT ur
 * listcachen vid byte (placeholderData); beläggnings-aggregaten finns bara i
 * get-event och hålls i skeleton tills detaljen landat (aldrig falska nollor);
 * prefetch på avsikt (hover på listrad värmer get-event + get-registrations).
 *
 * RUBRIK-SEMANTIKEN (AC #3): h1:ans accessible name är EXAKT eventnamnet —
 * väljar-etiketten får aldrig förorena rubriken; "vad kontrollen gör" bärs av
 * aria-description ("Byt event") + aria-haspopup, aldrig av namnet
 * (Stripe-formen: objektnamnet ÄR triggern).
 */
test.describe('Eventväljaren på eventdetaljsidan (task-18.19)', () => {
  /** Detalj-svar per event-ID + väljarlistan + tomma stubs; spårar anropen
      (prefetch-beviset). `hallHostDetaljen` grindar bytesmålets get-event
      (INSTANT-beviset: placeholder-läget hålls öppet tills release). */
  async function mockaValjarSidan(
    page: Page,
    { hallHostDetaljen = false }: { hallHostDetaljen?: boolean } = {},
  ): Promise<{ slappHost: () => void; detaljAnrop: () => string[]; regAnrop: () => string[] }> {
    let slappHost = () => {};
    const grind = hallHostDetaljen ? new Promise<void>((r) => (slappHost = r)) : null;
    const detaljAnrop: string[] = [];
    const regAnrop: string[] = [];

    await page.route(GET_EVENT, async (route: Route) => {
      const id = new URL(route.request().url()).searchParams.get('id') ?? '';
      detaljAnrop.push(id);
      if (id === BYT_HOST_ID) {
        if (grind) await grind;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            event: eventDetail({
              id: BYT_HOST_ID,
              eventlabel: 'Höstretreat (label)',
              eventNamn: 'Höstretreat',
              ort: 'Mullsjö',
              startdatum: '2099-09-12',
              slutdatum: '2099-09-13',
              tidKvarTillEvent: null,
              eventKey: 'Event-77',
              vantelista: 2,
            }),
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ event: eventDetail() }),
      });
    });
    await page.route(GET_REGISTRATIONS, async (route: Route) => {
      regAnrop.push(new URL(route.request().url()).searchParams.get('eventId') ?? '');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: [] }),
      });
    });
    await mockNotes(page);
    await mockValjarLista(page, VALJAR_LISTA);
    return { slappHost, detaljAnrop: () => detaljAnrop, regAnrop: () => regAnrop };
  }

  /** Rubrik-triggern: accessibla namnet är EXAKT eventnamnet (rubrik-semantiken). */
  function rubrikTrigger(page: Page, namn: string) {
    return page.getByRole('button', { name: namn, exact: true });
  }

  test('väljaren ÄR rubriken (variant A): h1 = eventnamnet är trigger med chevron-par; sidhuvudet i övrigt orört', async ({
    page,
  }) => {
    await mockaValjarSidan(page);
    await page.goto(`/event/${EVENT_ID}`);

    // h1 = eventnamnet, EXAKT (accname-fullmatch — ingen "Välj event"-
    // förorening av rubriken), fokuserad efter laddning (fokus-semantiken).
    const heading = page.getByRole('heading', { level: 1, name: 'Resor i medvetandet 1' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // Triggern bor I h1:an (hela rubrikytan är klickbar) och bär eventnamnet
    // som accessibla namn; "vad kontrollen gör" bärs av beskrivningen.
    const trigger = rubrikTrigger(page, 'Resor i medvetandet 1');
    await expect(heading.getByRole('button')).toHaveCount(1);
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(trigger).toHaveAccessibleDescription('Byt event');
    // Väljar-etiketten finns ALDRIG som knappnamn på denna yta (jfr 18.18-
    // formen där "Välj event" är Select-etiketten).
    await expect(page.getByRole('button', { name: /Välj event/ })).toHaveCount(0);

    // Chevron-paret intill namnet — aria-hidden dekor (texten bär). 18 px =
    // §14-chevronstandarden (facitets 20 revs öppet i våg 2 för
    // rubrik-utrymmet, Marcus 2026-07-25).
    const chevron = trigger.locator('svg.lucide-chevrons-up-down');
    await expect(chevron).toHaveAttribute('width', '18');
    await expect(chevron).toHaveAttribute('aria-hidden', 'true');

    // Hover-plattans grammatik (renderad verifiering, L245/L246): -mx-2 =
    // plattan skjuter 8 px utanför rubrikens vänsterkant utan att texten
    // flyttas; px-2 py-1 + rounded-lg; emphasized-plattan vid hover.
    const h1Box = await heading.boundingBox();
    const triggerBox = await trigger.boundingBox();
    expect((h1Box?.x ?? 0) - (triggerBox?.x ?? 0)).toBe(8);
    await expect(trigger).toHaveCSS('padding-left', '8px');
    await expect(trigger).toHaveCSS('padding-top', '4px');
    await expect(trigger).toHaveCSS('border-radius', '8px');
    const emphasized = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--mm-bg-emphasized)';
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    const bgVila = await trigger.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgVila).toBe('rgba(0, 0, 0, 0)');
    await trigger.hover();
    await expect(trigger).toHaveCSS('background-color', emphasized);

    // Sidhuvudets övriga delar orörda (facit punkt 2): EventKey-pillen till
    // höger (UTANFÖR h1:an), tid kvar-raden under.
    await expect(page.getByText('Event-21')).toBeVisible();
    await expect(heading.getByText('Event-21')).toHaveCount(0);
    await expect(page.getByText('1 vecka och 3 dagar kvar till eventet')).toBeVisible();
  });

  test('förvald = aktuellt event; listan är den delade komponentfamiljen: sök + månadsgruppering + kommande närmast först', async ({
    page,
  }) => {
    await mockaValjarSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await rubrikTrigger(page, 'Resor i medvetandet 1').click();

    // Sökfältet får fokus när listan öppnas (18.18 punkt 8 — samma maskineri).
    const sok = page.getByRole('searchbox', { name: 'Sök event eller ort' });
    await expect(sok).toBeFocused();

    // Månadsgruppering i EventsLists form; kommande närmast först; passerade
    // sållas bort; FÖRVALD = sidans aktuella event (aria-selected).
    await expect(page.getByText('Juli 2099', { exact: true })).toBeVisible();
    await expect(page.getByText('Augusti 2099', { exact: true })).toBeVisible();
    await expect(page.getByText('September 2099', { exact: true })).toBeVisible();
    const options = page.getByRole('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toContainText('Resor i medvetandet 1');
    await expect(options.nth(1)).toContainText('Fjärrskådning');
    await expect(options.nth(2)).toContainText('Höstretreat');
    await expect(page.getByRole('option', { name: /Passerat event/ })).toHaveCount(0);
    await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true');

    // Sök matchar namn ELLER ort (delade filtret).
    await sok.pressSequentially('mullsjö');
    await expect(page.getByRole('option')).toHaveCount(1);
    await expect(page.getByRole('option').first()).toContainText('Höstretreat');
  });

  test('INSTANT-bytet (ADR-078 + facit punkt 5): rubriken står direkt ur listcachen, beläggningen i skeleton tills detaljen landat; fokus åter till triggern', async ({
    page,
  }) => {
    const { slappHost } = await mockaValjarSidan(page, { hallHostDetaljen: true });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await rubrikTrigger(page, 'Resor i medvetandet 1').click();
    await page.getByRole('option', { name: /Höstretreat/ }).click();

    // Bytet navigerar routen (beslut a): URL:en alltid sann och delbar.
    await expect(page).toHaveURL(new RegExp(`/event/${BYT_HOST_ID}$`));

    // Rubriken står DIREKT ur listcachen — get-event för bytesmålet är ännu
    // GRINDAT (ingen väntan på data vi redan har; placeholder, aldrig tomt).
    const nyRubrik = page.getByRole('heading', { level: 1, name: 'Höstretreat' });
    await expect(nyRubrik).toBeVisible();
    await expect(page).toHaveTitle(/Höstretreat/);

    // HELA sidhuvudet står ur placeholdern — även EventKey-pillen (listposten
    // bär eventKey; review-pilotens F4): asserterad FÖRE släppet av detaljen.
    await expect(page.getByText('Event-77')).toBeVisible();

    // Om eventet står också direkt (listposten bär typ · ort · datum).
    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await expect(omGrupp.getByText('Mullsjö', { exact: true })).toBeVisible();

    // Beläggnings-aggregaten finns BARA i get-event (?? 0-klassen): sektionen
    // hålls i skeleton — ALDRIG en sekund av falska nollor (ADR-078 beslut 2).
    const belaggningSkeleton = page.getByRole('status').filter({ hasText: 'Laddar beläggning…' });
    await expect(belaggningSkeleton).toBeVisible();
    await expect(belaggningSkeleton).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('section[aria-labelledby="grupp-belaggning"]')).toHaveCount(0);

    // Fokus-semantiken efter byte: fokus återvänder till rubrik-triggern
    // (React Arias fokus-retur) — aldrig tappat till body.
    await expect(rubrikTrigger(page, 'Höstretreat')).toBeFocused();

    // Detaljen släpps → beläggningen renderas med riktig data (väntelistan 2).
    slappHost();
    const belaggning = page.locator('section[aria-labelledby="grupp-belaggning"]');
    await expect(belaggning).toBeVisible();
    await expect(belaggningSkeleton).toHaveCount(0);
    await expect(belaggning.getByText('Väntelista')).toBeVisible();
    await expect(belaggning.getByText('2', { exact: true })).toBeVisible();
  });

  test('prefetch på avsikt (ADR-078 beslut 3): hover på en listrad värmer bytesmålets queries utan navigering', async ({
    page,
  }) => {
    const { detaljAnrop, regAnrop } = await mockaValjarSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await rubrikTrigger(page, 'Resor i medvetandet 1').click();
    // Invänta sökfältets programmatiska fokus (rAF) före tangenttryck —
    // annars kan ArrowDown landa utanför popovern (ompasseringens N2).
    await expect(page.getByRole('searchbox', { name: 'Sök event eller ort' })).toBeFocused();

    // TANGENTBORDSVÄGEN (review-pilotens F1 — ADR-078 beslut 3 nämner hover
    // OCH fokus): pil ned flyttar den virtuella fokusen från det valda
    // eventet till nästa kommande (Fjärrskådning, 18.18:s AT-kontrakt) →
    // avsikts-värmning utan mus, likvärdig upplevelse oavsett styrsätt.
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => detaljAnrop().filter((id) => id === BYT_FJARR_ID).length).toBe(1);
    await expect.poll(() => regAnrop().filter((id) => id === BYT_FJARR_ID).length).toBe(1);

    // MUSVÄGEN: hover på en annan rad startar get-event + get-registrations
    // för det bytesmålet — klicket sker aldrig, URL:en står kvar.
    await page.getByRole('option', { name: /Höstretreat/ }).hover();
    await expect.poll(() => detaljAnrop().filter((id) => id === BYT_HOST_ID).length).toBe(1);
    await expect.poll(() => regAnrop().filter((id) => id === BYT_HOST_ID).length).toBe(1);
    await expect(page).toHaveURL(new RegExp(`/event/${EVENT_ID}$`));
  });

  test('axe 0 violations: stängt läge (helsides) + öppen väljare (scopad)', async ({ page }) => {
    await mockaValjarSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const taggar = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
    const stangd = await new AxeBuilder({ page }).withTags(taggar).analyze();
    expect(stangd.violations).toEqual([]);

    // Öppen väljare — scopad skan (ComboBox-mönstermallens scope-not: RAC:s
    // ariaHideOutside ger helsides-false-positive på aria-hidden-focus för
    // icke-modala popovers; det interaktiva skannas i stället).
    await rubrikTrigger(page, 'Resor i medvetandet 1').click();
    await expect(page.getByRole('searchbox', { name: 'Sök event eller ort' })).toBeFocused();
    const oppen = await new AxeBuilder({ page })
      .withTags(taggar)
      .include('h1')
      .include('[data-testid="event-valjare-popover"]')
      .analyze();
    expect(oppen.violations).toEqual([]);
  });

  test('rubrik-triggern RADBRYTER ALDRIG (Marcus-fix 2026-07-25): nowrap + visuell ellipsis, chevronen behåller sin plats, accname är HELA namnet', async ({
    page,
  }) => {
    // Morgongranskningen S86: "Fjärrskådning" bröts på smal viewport,
    // "Resor i medvetandet 3" värre — rubriken får ALDRIG radbrytas.
    // Truncaten är ENBART visuell: accname beräknas ur textinnehållet.
    const LANGT_NAMN =
      'Resor i medvetandet 3 — fördjupningsresan för återvändande deltagare med övernattning';
    await mockEvent(page, eventDetail({ eventNamn: LANGT_NAMN }));
    await mockNotes(page);
    await mockValjarLista(page, VALJAR_LISTA);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/event/${EVENT_ID}`);

    const heading = page.getByRole('heading', { level: 1, name: LANGT_NAMN });
    await expect(heading).toBeVisible();
    const trigger = heading.getByRole('button');

    // Accessible name = HELA namnet — klippningen förorenar aldrig accname.
    await expect(trigger).toHaveAccessibleName(LANGT_NAMN);

    // Nowrap-låset (computed, L245/L246): namn-spannet bryter aldrig rad och
    // klipper med ellipsis vid överflöd. Spannet lokaliseras via triggerns
    // aria-labelledby (accname-bäraren, exakt det spann låset gäller) —
    // `span[id]` vore tvetydigt: RAC:s SelectValue bär ett eget auto-id.
    const labelId = await trigger.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const namnSpann = page.locator(`[id="${labelId}"]`);
    await expect(namnSpann).toHaveCSS('white-space', 'nowrap');
    await expect(namnSpann).toHaveCSS('text-overflow', 'ellipsis');
    await expect(namnSpann).toHaveCSS('overflow-x', 'hidden');

    // Ellipsis är faktiskt AKTIV på denna viewport (innehållet överflödar).
    const klippt = await namnSpann.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(klippt).toBe(true);

    // Geometri-låset: EN rad (text-3xl-raden + py-1 ≈ 44 px; två rader ≈ 80).
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox?.height ?? 0).toBeLessThan(60);

    // Chevron-paret behåller sin plats: synligt, till höger om namnet och
    // INNANFÖR viewporten (aldrig utskuffat av det långa namnet).
    const chevron = trigger.locator('svg.lucide-chevrons-up-down');
    await expect(chevron).toBeVisible();
    const chevronBox = await chevron.boundingBox();
    const namnBox = await namnSpann.boundingBox();
    expect(chevronBox?.x ?? 0).toBeGreaterThanOrEqual((namnBox?.x ?? 0) + (namnBox?.width ?? 0));
    expect((chevronBox?.x ?? 0) + (chevronBox?.width ?? 0)).toBeLessThanOrEqual(390);

    // Väljaren fungerar fortsatt från den truncerade triggern.
    await trigger.click();
    await expect(page.getByRole('searchbox', { name: 'Sök event eller ort' })).toBeFocused();
  });

  test('RIM 3 — längsta verkliga kursnamnet — ryms på EN rad UTAN ellipsis på mobilbredd (Marcus våg 2): rubriken får radens utrymme, EventKey-pillen viker under', async ({
    page,
  }) => {
    // Marcus omgranskning 2026-07-25: truncate räcker inte — "Resor i
    // medvetandet 3" SKA rymmas ("annars faller hela konceptet med
    // Eventnamnet som rubrik"). Ellipsis är ENBART extremnamns-skyddsnät.
    await mockEvent(page, eventDetail({ eventNamn: 'Resor i medvetandet 3' }));
    await mockNotes(page);
    await mockValjarLista(page, VALJAR_LISTA);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/event/${EVENT_ID}`);

    const heading = page.getByRole('heading', { level: 1, name: 'Resor i medvetandet 3' });
    await expect(heading).toBeVisible();
    const trigger = heading.getByRole('button');

    // FONT-VAKT: mät aldrig textbredd förrän Inter är laddad — fallback-
    // metriken är ~6 % bredare och gav falskt klipp i CI (våg 2-fyndet).
    await page.evaluate(() => document.fonts.ready);

    // INGEN ellipsis: namn-spannet överflödar inte (scrollWidth <= clientWidth).
    const labelId = await trigger.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const namnSpann = page.locator(`[id="${labelId}"]`);
    await expect(namnSpann).toHaveText('Resor i medvetandet 3');
    const klippt = await namnSpann.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(klippt).toBe(false);

    // EN rad (geometri-låset från våg 1 gäller även här).
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox?.height ?? 0).toBeLessThan(60);

    // EventKey-pillen har vikt UNDER rubriken (basis-full < sm) — synlig,
    // fortfarande UTANFÖR h1:an (facit punkt 2:s semantik står).
    const pill = page.getByText('Event-21');
    await expect(pill).toBeVisible();
    await expect(heading.getByText('Event-21')).toHaveCount(0);
    const pillBox = await pill.boundingBox();
    expect(pillBox?.y ?? 0).toBeGreaterThanOrEqual(
      (triggerBox?.y ?? 0) + (triggerBox?.height ?? 0) - 1,
    );
  });

  test('popovern matchar triggerns bredd med min-w-golv och linjerar vänsterkanten (form B, Marcus 2026-07-25)', async ({
    page,
  }) => {
    await mockaValjarSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const trigger = rubrikTrigger(page, 'Resor i medvetandet 1');
    await trigger.click();
    const popover = page.getByTestId('event-valjare-popover');
    await expect(popover).toBeVisible();

    // width = var(--trigger-width) (RAC sätter variabeln automatiskt) med
    // min-w-72-golvet (288 px) som hängsle för smala rubrik-triggrar;
    // placement="bottom start" ⇒ vänsterkanterna linjerar (aldrig den
    // centrerade default-placeringen som sköt popovern utanför innehållet).
    const trigBox = await trigger.boundingBox();
    const popBox = await popover.boundingBox();
    expect(Math.abs((popBox?.x ?? 0) - (trigBox?.x ?? 0))).toBeLessThanOrEqual(1);
    expect(popBox?.width ?? 0).toBeCloseTo(Math.max(trigBox?.width ?? 0, 288), 0);
  });
});
