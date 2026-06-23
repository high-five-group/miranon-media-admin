import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6d L1 — Hem-aggregering (/hem, STATISK hämtning). Greeting + tre översikts-
 * cards (nya anmälningar / nästa event / obetalda) + CTA, mot befintliga read-EF
 * (get-registrations event-lösa gren + get-events). INGEN polling i L1 (det är L2).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr mer-vantelista.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av BÅDA EF:erna. Regex-matchare som inte
 * kolliderar: `get-registrations` och `get-events` är unika delsträngar (get-events
 * matchar inte get-event, get-registrations matchar inte create-registration).
 * Mockarna speglar EF-svaren `{ registrations: [...] }` / `{ events: [...] }`
 * (Registration.schema / Event.schema-rader → adapterns `.parse()` passerar).
 *
 * Täckning: cards-rendering (senaste anmälningar recency-sorterat, nästa event
 * temporalt, obetalda-antal), greeting, CTA→/event, tom-state per card, fel
 * (4xx role=alert, no-retry), axe 0. INGEN h1-auto-fokus-assertion: /hem är
 * default-landningsytan → containern flyttar INTE fokus (skip-link-först-tab-
 * ordning, speglar EventsList; se Hem.tsx + shell DoD 2).
 */

const GET_REGISTRATIONS = /\/functions\/v1\/get-registrations/;
const GET_EVENTS = /\/functions\/v1\/get-events/;

type Row = Record<string, unknown>;

/** En komplett Registration-rad (EF-svarets form, Registration.schema). */
function reg(overrides: Row = {}): Row {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-20T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEvent1',
    personId: 'recPerson1',
    ...overrides,
  };
}

/** En komplett Event-rad (EF-svarets form, Event.schema). */
function ev(overrides: Row = {}): Row {
  return {
    id: `recE${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: 'RIM1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Kurs',
    ort: 'Skövde',
    startdatum: '2099-06-01',
    slutdatum: '2099-06-02',
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 5,
    platserKvar: 15,
    anmaldBelaggning: 0.25,
    bekraftadBelaggning: 0.2,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 3,
    antalSlutbetalningar: 1,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    ...overrides,
  };
}

async function mock(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  {
    registrations = [],
    events = [],
    regStatus = 200,
    eventStatus = 200,
  }: { registrations?: Row[]; events?: Row[]; regStatus?: number; eventStatus?: number } = {},
) {
  await page.route(GET_REGISTRATIONS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: regStatus,
      contentType: 'application/json',
      body: regStatus === 200 ? JSON.stringify({ registrations }) : JSON.stringify({ error: 'x' }),
    });
  });
  await page.route(GET_EVENTS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: eventStatus,
      contentType: 'application/json',
      body: eventStatus === 200 ? JSON.stringify({ events }) : JSON.stringify({ error: 'x' }),
    });
  });
}

test.describe('Hem-aggregering (Fas 6d L1 — statisk översiktsvy)', () => {
  test('cards renderas med data + greeting + CTA', async ({ page }) => {
    await mock(page, {
      registrations: [
        reg({ fornamn: 'Carl', efternamn: 'Carlsson', inskickad: '2026-06-22T10:00:00.000Z' }),
        reg({ fornamn: 'Bo', efternamn: 'Bengtsson', inskickad: '2026-06-21T10:00:00.000Z' }),
        reg({
          fornamn: 'Disa',
          efternamn: 'Dahl',
          inskickad: '2026-06-20T10:00:00.000Z',
          anmalningsavgift: 'Ej mottagen',
        }),
      ],
      events: [
        ev({ eventNamn: 'Förbi-event', startdatum: '2020-01-01' }), // dåtid → ej "nästa"
        ev({ eventNamn: 'Resor i medvetandet 1', startdatum: '2099-06-01' }),
      ],
    });
    await page.goto('/hem');

    // <h1> = "Hem" (ingen fokus-assertion — landningsytan stjäl inte fokus).
    await expect(page.getByRole('heading', { level: 1, name: 'Hem' })).toBeVisible();

    // Greeting (statisk — inget namnfält i auth-context).
    await expect(page.getByText('Hej! Här är din översikt.')).toBeVisible();

    // Nya anmälningar: senaste namn (recency via Inskickad) + formaterat datum.
    await expect(page.getByText('Carl Carlsson')).toBeVisible();
    await expect(page.getByText('2026-06-22')).toBeVisible();

    // Nästa event: temporalt valt (kommande, ej dåtids-eventet); namn-länk.
    await expect(page.getByRole('link', { name: 'Resor i medvetandet 1' })).toBeVisible();
    await expect(page.getByText('Förbi-event')).toHaveCount(0);

    // Obetalda: en rad har "Ej mottagen" → antal som text + namn. Scopat till
    // cardets region-landmark: namnet kan även synas i "Nya anmälningar" (samma
    // person), så region-scope undviker strict-mode-dubbelträff och bevisar att
    // raden ligger i RÄTT card.
    const obetalda = page.getByRole('region', { name: 'Obetalda avgifter' });
    await expect(obetalda.getByText('1 obetald avgift')).toBeVisible();
    await expect(obetalda.getByText('Disa Dahl')).toBeVisible();

    // CTA → eventlistan.
    await expect(page.getByRole('link', { name: 'Visa alla event →' })).toHaveAttribute(
      'href',
      '/event',
    );
  });

  test('tomma listor → vänliga tom-texter per card, inga fel', async ({ page }) => {
    await mock(page, { registrations: [], events: [] });
    await page.goto('/hem');

    await expect(page.getByRole('heading', { level: 1, name: 'Hem' })).toBeVisible();
    await expect(page.getByText('Inga anmälningar än.')).toBeVisible();
    await expect(page.getByText('Inga kommande event.')).toBeVisible();
    await expect(page.getByText('Inga obetalda avgifter.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('endast dåtida event → "Inga kommande event"', async ({ page }) => {
    await mock(page, {
      registrations: [reg()],
      events: [ev({ startdatum: '2020-01-01' })],
    });
    await page.goto('/hem');
    await expect(page.getByText('Inga kommande event.')).toBeVisible();
  });

  test('get-registrations 4xx → fel-UI (role=alert) i anmälnings-cards, event-card opåverkat', async ({
    page,
  }) => {
    // 4xx = klient-fel → no-retry-grenen (speglar 6c). Båda anmälnings-cards delar
    // queryn → båda visar alert; event-cardet (separat query, 200) renderar fint.
    await mock(page, { regStatus: 404, events: [ev({ eventNamn: 'Resor i medvetandet 1' })] });
    await page.goto('/hem');

    await expect(page.getByRole('alert').first()).toContainText('Kunde inte hämta anmälningar');
    await expect(page.getByRole('link', { name: 'Resor i medvetandet 1' })).toBeVisible();
  });

  test('axe 0 violations på den renderade Hem-vyn', async ({ page }) => {
    await mock(page, {
      registrations: [reg({ anmalningsavgift: 'Ej mottagen' }), reg()],
      events: [ev()],
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: 'Hem' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
