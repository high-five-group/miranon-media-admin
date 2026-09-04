import AxeBuilder from '@axe-core/playwright';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { expect, type Page, type Route, test } from '../support/test-bas';
import { loggaInFristaende } from './helpers/fristaende-session';

/**
 * Skapa nytt event — event-familjens skapa-sida mot S73-FACIT-UTÖKNINGEN
 * (task-19.3; bilagan FACIT-skapa-sidan.png). Sidan konsumerar den BEFINTLIGA
 * create-event-operationen (ADR-066: server-side-byggd shape, allowlist-SSOT,
 * Airtable-nativ upsert-idempotens på klient-genererad nyckel) — ingen ny EF.
 *
 * HEMVIST (task-19.2): /event/skapa; Mer-ingången riven, gamla
 * /mer/skapa-event omdirigerar hit.
 *
 * TVÅ SVITER I SAMMA FIL:
 *   1. FACIT + flöde — DETERMINISTISK via `page.route`-MOCK av get-events,
 *      get-event-formats och create-event. Ingen staging-write; fixtur-formerna
 *      speglar EF:ernas riktiga svar (adaptrarna .parse():ar dem).
 *   2. SKARPT MOT STAGING (kortets AC #1) — INGA mocks: formuläret skriver
 *      genom hela vertikalen till staging-basen. Sentinel-städningen är
 *      ZZ-mönstret (Ort = `ZZ-create-event-test`, samma markör som
 *      create-event-api-testet) + setup-purge (ADR-060,
 *      .purge-staging-policy.json target `create-event-sentineler`).
 *      Idempotensen byggs INTE om här — den är kontraktstestad i
 *      tests/api/create-event.staging.test.ts och regressions-bevakas där.
 *
 * PUBLICERINGSFLAGGAN (task-19.4): handtaget armerar bas-fältet `Publicerad på
 * miranon.se`. Mockade sviten bevisar payload-formen i BÅDA lägena (armerat →
 * `publicera: true`; oarmerat → nyckeln HELT frånvarande); skarpa sviten bevisar
 * armeringen ände-till-ände mot staging via create-event-svarets råa record.fields.
 * Allowlist-avgränsningen + osatt-formen kontraktstestas i api-sviten.
 */

const GET_EVENTS = /\/functions\/v1\/get-events/;
const GET_EVENT_FORMATS = /\/functions\/v1\/get-event-formats/;
const CREATE_EVENT = /\/functions\/v1\/create-event/;
// Anchored: matchar 'get-event' men INTE 'get-events' (s) eller 'get-event-formats' (-),
// annars skulle detalj-mocken klobbra beforeEach:s get-events/get-event-formats-routes.
const GET_EVENT = /\/functions\/v1\/get-event(?![s-])/;

// Bas-namnen är live-verifierade (Airtable-MCP 2026-07-22, Eventformat
// tbl8qhuJQ5ZWPMRk4) — etiketterna "2 dagar"/"1 dag" härleds ur dem
// (src/lib/eventformat-etikett.ts, PRD task-19 beslut 5).
const FORMAT_2_DAGAR = { id: 'recFmtTEST00000001', namn: 'Utbildning - 2 dagar' };
const FORMAT_1_DAG = { id: 'recFmtTEST00000002', namn: 'Föreläsning' };
const CREATED_ID = 'recEVTcreated00001';

/** Sentinel-markören för skarpa staging-writes (ADR-060; purge-policyns target). */
const SENTINEL_ORT = 'ZZ-create-event-test';

/**
 * Publiceringsflaggan (task-19.4) — EXAKT Airtable-fältnamnet i Eventplanering
 * (staging `fldyJKnJCP1brHwL6`, checkbox). Läses ur create-event-svarets råa
 * `record.fields` i det skarpa testet = skriv-beviset ände-till-ände.
 */
const PUBLICERINGSFALT = 'Publicerad på miranon.se';

/** En komplett Event-rad (get-events-svarets form, EventSchema). */
function ev(eventNamn: string, typ: string): Record<string, unknown> {
  return {
    id: `recEV${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: eventNamn,
    eventNamn,
    typ,
    ort: 'Skövde',
    startdatum: '2026-03-01',
    slutdatum: '2026-03-02',
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 0,
    platserKvar: 20,
    anmaldBelaggning: 0,
    bekraftadBelaggning: 0,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: null,
  };
}

/** create-event-svarets `event` (CreatedEventSchema) — bär system-genererade EventKey/Event-nr. */
const CREATED_EVENT = {
  id: CREATED_ID,
  eventlabel: 'Skövde – Utbildning – Fjärrskådning – 2026-09-15',
  eventNamn: 'Fjärrskådning',
  typ: 'Utbildning',
  ort: 'Skövde',
  startdatum: '2026-09-15',
  slutdatum: '2026-09-16',
  manadAr: 'September 2026',
  maxPlatser: 20,
  status: 'Planerat',
  eventKey: 'Event-99',
  eventNr: 99,
};

/** Väljer ett alternativ i en Select (trigger scopad via fältets testid). */
async function valj(page: Page, faltTestId: string, alternativ: string): Promise<void> {
  await page.getByTestId(faltTestId).getByRole('button').click();
  await page.getByRole('option', { name: alternativ, exact: true }).click();
}

/**
 * Fyller datumspannet (RAC DateRangePicker, sv-SE → segmentordning år-månad-dag).
 * Segmenten är spinbuttons; start-fältets tre först, slut-fältets tre sedan.
 */
async function fyllDatum(page: Page, start: string, slut: string): Promise<void> {
  const segment = page.getByTestId('falt-datum').getByRole('spinbutton');
  await segment.nth(0).click();
  await page.keyboard.type(start.replaceAll('-', ''));
  await segment.nth(3).click();
  await page.keyboard.type(slut.replaceAll('-', ''));
}

/**
 * Fyller Max antal platser och commit:ar värdet med blur. RAC NumberField
 * exponerar sitt fält som TEXTBOX (inte spinbutton — inmatningen är fri text
 * med inputMode-numerik; stegknapparna är egna knappar), DOM-verifierat.
 */
async function fyllPlatser(page: Page, antal: string): Promise<void> {
  const falt = page.getByTestId('falt-platser').getByRole('textbox');
  await falt.click();
  await falt.fill(antal);
  await page.keyboard.press('Tab');
}

test.describe('Skapa nytt event — facit-formen + flödet (task-19.3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(GET_EVENTS, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [ev('Fjärrskådning', 'Utbildning'), ev('RIM 1', 'Föreläsning')],
        }),
      });
    });
    await page.route(GET_EVENT_FORMATS, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ eventFormats: [FORMAT_2_DAGAR, FORMAT_1_DAG] }),
      });
    });
  });

  /** Fyller hela formuläret (utom, valfritt, Eventformat). */
  async function fyllFormular(
    page: Page,
    { medFormat = true }: { medFormat?: boolean } = {},
  ): Promise<void> {
    await valj(page, 'falt-event', 'Fjärrskådning');
    await valj(page, 'falt-eventtyp', 'Utbildning');
    await page.getByLabel('Ort', { exact: true }).fill('Skövde');
    await fyllDatum(page, '2026-09-15', '2026-09-16');
    await fyllPlatser(page, '20');
    if (medFormat) await valj(page, 'falt-eventformat', '2 dagar');
  }

  test('facit: grupperna, fältfacitet och språket per FACIT-skapa-sidan.png', async ({ page }) => {
    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    // Grupprubrikerna (familjens grammatik: rubrik utanför det tonala kortet).
    for (const rubrik of ['Om eventet', 'Platser och format', 'Publicering']) {
      await expect(page.getByRole('heading', { level: 2, name: rubrik })).toBeVisible();
    }

    // Fältfacitet + UI-språket (Event/Eventtyp per ORDLISTA, INTE basens namn).
    await expect(page.getByTestId('falt-event')).toContainText('Event');
    await expect(page.getByTestId('falt-eventtyp')).toContainText('Eventtyp');
    await expect(page.getByLabel('Ort', { exact: true })).toBeVisible();
    await expect(page.getByTestId('falt-datum')).toContainText('Datum');
    await expect(page.getByTestId('falt-platser')).toContainText('Max antal platser');
    await expect(page.getByTestId('falt-eventformat')).toContainText('Eventformat');
    // Basens språk läcker ALDRIG ut i UI:t.
    await expect(page.getByText('Event (source)')).toHaveCount(0);
    await expect(page.getByText('Kurs (eventnamn)')).toHaveCount(0);

    // Tillbaka-chevronen (familjens toppform) pekar på event-listan.
    await expect(page.getByRole('link', { name: 'Tillbaka till event' })).toHaveAttribute(
      'href',
      '/event',
    );

    // K84: INGA obligatorisk-markeringar — allt krävs, alltså markeras inget.
    const sidtext = (await page.locator('section').first().innerText()).toLowerCase();
    expect(sidtext).not.toContain('*');
    expect(sidtext).not.toContain('obligatorisk');
  });

  test('facit: formatetiketterna talar Lottas språk (2 dagar / 1 dag)', async ({ page }) => {
    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    await page.getByTestId('falt-eventformat').getByRole('button').click();
    await expect(page.getByRole('option', { name: '2 dagar', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: '1 dag', exact: true })).toBeVisible();
    // Basens egna namn visas aldrig för Lotta.
    await expect(page.getByRole('option', { name: 'Utbildning - 2 dagar' })).toHaveCount(0);
  });

  test('facit (rev. 2026-07-23): Skapa event följer grön-regeln DYNAMISKT — mörkgrå oarmerad, grön vid armerad publicering', async ({
    page,
  }) => {
    // Marcus review-våg 5: K77:s statiskt gröna knapp riven — intenten
    // följer publicerings-läget (grön-regeln på knappens FAKTISKA semantik:
    // oarmerat når skapandet inget utomstående → primary; armerat
    // publiceras eventet → success). 18.16:s K77-A-beslut amenderat.
    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    const skapa = page.getByRole('button', { name: 'Skapa event', exact: true });
    // Oarmerat: primary (mörkgrå, --p-neutral-800 #282928).
    await expect(skapa).toHaveCSS('background-color', 'rgb(40, 41, 40)');

    // Armera publiceringen (tangentbordet — draget är förstärkning).
    const handtag = page.getByRole('switch', { name: 'Publicera på miranon.se' });
    await handtag.focus();
    await page.keyboard.press(' ');
    // Armerat: success (sage #606B57 → vit text ≈ 5,6:1, AA).
    await expect(skapa).toHaveCSS('background-color', 'rgb(96, 107, 87)');
    await expect(page.getByRole('button', { name: 'Avbryt', exact: true })).toBeVisible();
  });

  test('publicerings-handtaget renderas och armeras med tangentbordet', async ({ page }) => {
    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    const handtag = page.getByRole('switch', { name: 'Publicera på miranon.se' });
    await expect(handtag).toBeVisible();
    await expect(handtag).toHaveAttribute('aria-checked', 'false');
    // Review-våg 5 (Marcus): oarmerade prompten utan destination — kort
    // "Dra för att publicera"; destinationen bärs av armerade läget + aria.
    await expect(handtag).toContainText('Dra för att publicera');
    await expect(handtag).not.toContainText('Dra för att publicera på');

    // Draget är förstärkning, aldrig enda vägen (11-ribban).
    await handtag.focus();
    await page.keyboard.press(' ');
    await expect(handtag).toHaveAttribute('aria-checked', 'true');
    // Punkt 15: armerade texten utan destination (självklar; aria bär den).
    await expect(handtag).toContainText('Publiceras');
    await expect(handtag).not.toContainText('Publiceras på');
  });

  test('happy path: fyll → Skapa event → bekräftelseläge (nästa steg ett klick bort)', async ({
    page,
  }) => {
    let skickadPayload: Record<string, unknown> | null = null;
    await page.route(CREATE_EVENT, async (route: Route) => {
      skickadPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          event: CREATED_EVENT,
          record: { id: CREATED_ID, fields: {} },
          created: true,
        }),
      });
    });
    await page.route(GET_EVENT, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: {
            ...CREATED_EVENT,
            tidKvarTillEvent: null,
            antalAnmalda: 0,
            platserKvar: 20,
            anmaldBelaggning: 0,
            bekraftadBelaggning: 0,
            antalNyaAnmalningar: 0,
            antalAnmalningsavgifter: 0,
            antalSlutbetalningar: 0,
            antalSlutbetalningFelande: 0,
          },
        }),
      });
    });

    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    await fyllFormular(page);
    // Handtaget ARMERAS → publiceringsflaggan följer med i payloaden (19.4).
    await page.getByRole('switch', { name: 'Publicera på miranon.se' }).focus();
    await page.keyboard.press(' ');
    await page.getByRole('button', { name: 'Skapa event', exact: true }).click();

    // Bekräftelseläget ersätter formuläret och tar fokus.
    const bekraftelse = page.getByTestId('bekraftelse');
    await expect(bekraftelse).toBeVisible();
    await expect(bekraftelse).toBeFocused();
    await expect(bekraftelse).toContainText('Eventet är skapat');
    await expect(page).toHaveURL(/\/event\/skapa$/);

    // Payloaden: UI-språket mappat mot kontraktets fält (namnkrocken explicit).
    const payload = skickadPayload as Record<string, unknown> | null;
    expect(payload).not.toBeNull();
    expect(payload?.event).toBe('Fjärrskådning');
    expect(payload?.typ).toBe('Utbildning');
    expect(payload?.ort).toBe('Skövde');
    expect(payload?.startdatum).toBe('2026-09-15');
    expect(payload?.slutdatum).toBe('2026-09-16');
    expect(payload?.maxPlatser).toBe(20);
    expect(payload?.eventtyp).toBe(FORMAT_2_DAGAR.id);
    expect(typeof payload?.idempotencyKey).toBe('string');
    // Publiceringsflaggan (19.4): ARMERAT handtag → nyckeln med i payloaden.
    expect(payload?.publicera).toBe(true);

    // Nästa steg ett klick bort: till det skapade eventet.
    await page.getByRole('button', { name: 'Till eventet', exact: true }).click();
    await page.waitForURL(`**/event/${CREATED_ID}`);
  });

  test('publiceringsflaggan: OARMERAT handtag → nyckeln utelämnas HELT ur payloaden', async ({
    page,
  }) => {
    let skickadPayload: Record<string, unknown> | null = null;
    await page.route(CREATE_EVENT, async (route: Route) => {
      skickadPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          event: CREATED_EVENT,
          record: { id: CREATED_ID, fields: {} },
          created: true,
        }),
      });
    });

    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    await fyllFormular(page);
    // Handtaget lämnas OARMERAT — skapa utan publicering är default-vägen
    // (PRD-berättelse 6).
    await expect(page.getByRole('switch', { name: 'Publicera på miranon.se' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await page.getByRole('button', { name: 'Skapa event', exact: true }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    // Ett skickat `false` skulle SÄTTA basens checkbox (EF:ens fields-map är tät)
    // — därför måste nyckeln vara HELT frånvarande, inte falsk.
    const payload = skickadPayload as Record<string, unknown> | null;
    expect(payload).not.toBeNull();
    expect(payload && 'publicera' in payload).toBe(false);
  });

  test('validering: tomt Eventformat → Skapa blockeras klient-side, fel synligt, ingen write', async ({
    page,
  }) => {
    let createCalled = false;
    await page.route(CREATE_EVENT, async (route: Route) => {
      createCalled = true;
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/event/skapa');
    // TASK-236 (218.3-regression): FÖRSTA renderingen på en fräsch, kall
    // chromium-authenticated-kontext går genom hela warmup-gaten
    // (ADR-112/main.tsx InnerApp) — default-timeouten (5000ms) räcker inte
    // längre. Samma mönster som persist-cache.staging.test.ts:s fix.
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused({
      timeout: 12_000,
    });

    await fyllFormular(page, { medFormat: false });
    await page.getByRole('button', { name: 'Skapa event', exact: true }).click();

    await expect(page.getByText('Välj ett eventformat')).toBeVisible();
    expect(createCalled).toBe(false);
    await expect(page.getByTestId('bekraftelse')).toHaveCount(0);
  });

  test('hemvisten: gamla /mer/skapa-event omdirigerar till /event/skapa', async ({ page }) => {
    await page.goto('/mer/skapa-event');

    await page.waitForURL('**/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeVisible();
    await expect(page.getByRole('link', { name: '← Tillbaka till Mer' })).toHaveCount(0);
  });

  test('axe 0 violations på det renderade formuläret', async ({ page }) => {
    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    // Interagera så fält-states (vald option) ingår i scanet.
    await valj(page, 'falt-event', 'Fjärrskådning');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe('Skapa nytt event — SKARPT mot staging (AC #1)', () => {
  // Skarpa EF-läsningar kräver en session som håller SERVER-SIDE. Den delade
  // storageState-sessionen gör inte det under full svit (refresh-token-rotation
  // över ~200 kontexter → 401 "Invalid or expired token"); mockade tester
  // märker det aldrig, detta test gör det. Egen färsk session i stället.
  // Se tests/e2e/helpers/fristaende-session.ts för fullständig rationale.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await loggaInFristaende(page);
  });

  /**
   * Ände-till-ände genom hela vertikalen: inga mocks — formuläret läser
   * options ur staging (get-events + get-event-formats) och SKRIVER en riktig
   * Eventplanering-rad via den befintliga create-event-operationen.
   *
   * Städning: raden bär sentinel-orten `ZZ-create-event-test` och plockas av
   * setup-purgen (ADR-060; .purge-staging-policy.json target
   * `create-event-sentineler`, ålders-guard 60 min, länk-guard med Eventtyp
   * undantagen). Idempotensen byggs inte om här — se fil-huvudet.
   *
   * Datumen ligger i basens `Månad/år`-options-range (samma september-2026-val
   * som create-event-api-testet, som är grönt i CI).
   */
  test('formuläret skapar ett riktigt event i staging och landar i bekräftelseläget', async ({
    page,
  }) => {
    // Options-läsningarna är SKARPA här — vänta in dem innan formuläret rörs
    // (en Select med tom kollektion öppnar ingen popover; mot mockad data är
    // svaren omedelbara, mot staging är de det inte).
    const eventsSvar = page.waitForResponse((r) => r.url().includes('/get-events'));
    const formatSvar = page.waitForResponse((r) => r.url().includes('/get-event-formats'));
    await page.goto('/event/skapa');
    // TASK-236 (218.3-regression): fräsch (ej delad) storageState här också —
    // se "validering"-testets kommentar ovan för samma warmup-gate-orsak.
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused({
      timeout: 12_000,
    });
    expect((await eventsSvar).status()).toBe(200);
    expect((await formatSvar).status()).toBe(200);

    // Event/Eventtyp-options är LIVE-härledda ur staging-eventen — plocka
    // första tillgängliga i stället för att anta ett värde.
    await page.getByTestId('falt-event').getByRole('button').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('falt-eventtyp').getByRole('button').click();
    await page.getByRole('option').first().click();

    await page.getByLabel('Ort', { exact: true }).fill(SENTINEL_ORT);
    await fyllDatum(page, '2026-09-15', '2026-09-16');
    await fyllPlatser(page, '20');
    // "2 dagar" = etiketten för staging-formatet `Utbildning - 2 dagar`
    // (eventformat-etikett-mappningen bevisad mot LIVE-data).
    await valj(page, 'falt-eventformat', '2 dagar');

    // PUBLICERINGSFLAGGAN (task-19.4 AC #2): handtaget ARMERAS i UI:t — hela
    // vägen genom vertikalen till checkboxen i basen.
    const handtag = page.getByRole('switch', { name: 'Publicera på miranon.se' });
    await handtag.focus();
    await page.keyboard.press(' ');
    await expect(handtag).toHaveAttribute('aria-checked', 'true');

    const createSvar = page.waitForResponse((r) => r.url().includes('/create-event'));
    await page.getByRole('button', { name: 'Skapa event', exact: true }).click();

    // SKRIV-BEVISET för flaggan: EF:ens råa `record.fields` (samma envelope som
    // api-kontraktstestet läser) visar checkboxen SATT på den skapade raden.
    const createBody = (await (await createSvar).json()) as {
      record: { id: string; fields: Record<string, unknown> };
    };
    // [TASK-309.15] Raden är KASTBAR och KOMMANDE (startdatum 2026-09-15) →
    // ägar-manifestet, så `purge:staging:efter` river den direkt i stället för
    // att lämna den i appens eventväljare till nästa staging-jobbs setup-purge.
    // Manifestet delas med api-sviten: CI kör `test:api:staging` och
    // `test:e2e:staging` som två Playwright-invokationer i SAMMA jobb, och
    // filen ligger utanför `test-results/` just därför (se helperns filhuvud).
    registreraKastbarPost(createBody.record.id, 'e2e-skapa-event/Eventplanering');
    expect(createBody.record.fields[PUBLICERINGSFALT]).toBe(true);

    // Bekräftelseläget är skriv-beviset: det renderas ENBART på server-OK
    // (201 created / 200 idempotent replay) från den skarpa create-event-EF:en.
    const bekraftelse = page.getByTestId('bekraftelse');
    await expect(bekraftelse).toBeVisible({ timeout: 20_000 });
    await expect(bekraftelse).toContainText('Eventet är skapat');
    // Nästa steg är ett klick bort (knappen finns; detaljsidans egen rendering
    // är eventsidans kontrakt, inte detta korts).
    await expect(page.getByRole('button', { name: 'Till eventet', exact: true })).toBeVisible();
  });

  test('review-våg 5 (p15): armerade texten är "Publiceras" i promptens vikt — domänen borta ur UI:t', async ({
    page,
  }) => {
    // Marcus punkt 15 (2026-07-23): destinationen är självklar — armerade
    // läget säger bara "Publiceras", i SAMMA vikt som "Dra för att
    // publicera" (medium-lyftet rivet med MiranonSe-komponenten; K81-sagan
    // stängd — domänen förekommer inte längre som synlig text på sidan).
    await page.goto('/event/skapa');
    // TASK-236 (218.3-regression): se testet ovan ("formuläret skapar ett
    // riktigt event...") för samma warmup-gate-orsak.
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused({
      timeout: 12_000,
    });
    const handtag = page.getByRole('switch', { name: 'Publicera på miranon.se' });
    await handtag.focus();
    await page.keyboard.press(' ');

    await expect(handtag).toContainText('Publiceras');
    await expect(handtag).not.toContainText('Publiceras på');
    expect(await page.getByText('miranon.se', { exact: true }).count()).toBe(0);
    const vikt = await handtag
      .getByText('Publiceras', { exact: true })
      .evaluate((el) => getComputedStyle(el).fontWeight);
    expect(vikt).toBe('400');
  });
});
