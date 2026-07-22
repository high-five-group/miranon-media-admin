import AxeBuilder from '@axe-core/playwright';
import { expect, type Route, test } from '@playwright/test';

/**
 * Fas 6f L2 — Skapa nytt event. create-event-vertikalens klient-yta:
 * pessimistiskt formulär mot create-event-EF (ADR-066 b4). Eventtyp REQUIRED (b5) ur
 * get-event-formats; Event/Typ-options ur get-events.
 *
 * HEMVIST-FLYTTEN (task-19.2, PRD task-19 beslut 2, Marcus-kvitterad
 * 2026-07-21): sidan bor i EVENT-FAMILJEN på /event/skapa; Mer-ingången är
 * RIVEN och gamla routen /mer/skapa-event omdirigerar hit (öppet hanterad —
 * inga döda URL:er i PWA-historik/bokmärken). Formens INNEHÅLL mot
 * S73-facit-utökningen ägs av task-19.3.
 *
 * Körs i chromium-authenticated-projektet (storageState). DETERMINISTISK via `page.route`-
 * MOCK av get-events (options), get-event-formats (Eventtyp-dropdown) och create-event
 * (mutation) — INGEN riktig staging-write, så ingen sentinel-städning behövs (jfr api-testet
 * som skriver skarpt). Fixtur-formerna speglar EF:ernas RIKTIGA svar (adaptrarna .parse():ar).
 *
 * Täckning: hemvisten (URL:en består + back-länken till event-listan + gamla
 * routens omdirigering), happy path (fyll → submit → pessimistisk navigation
 * till skapat event), required-validering (tom Eventtyp → submit blockeras
 * klient-side, fel synligt, ingen navigation), axe 0.
 */

const GET_EVENTS = /\/functions\/v1\/get-events/;
const GET_EVENT_FORMATS = /\/functions\/v1\/get-event-formats/;
const CREATE_EVENT = /\/functions\/v1\/create-event/;
// Anchored: matchar 'get-event' men INTE 'get-events' (s) eller 'get-event-formats' (-),
// annars skulle detalj-mocken klobbra beforeEach:s get-events/get-event-formats-routes.
const GET_EVENT = /\/functions\/v1\/get-event(?![s-])/;

const FORMAT_ID = 'recFmtTEST00000001';
const CREATED_ID = 'recEVTcreated00001';

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

test.describe('Skapa nytt event (Fas 6f L2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(GET_EVENTS, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: [ev('Fjärrskådning', 'Utbildning')] }),
      });
    });
    await page.route(GET_EVENT_FORMATS, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ eventFormats: [{ id: FORMAT_ID, namn: 'RIM-format' }] }),
      });
    });
  });

  /** Fyll alla fält UTOM (valfritt) Eventformat. */
  async function fillForm(
    // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
    page: any,
    { withFormat = true }: { withFormat?: boolean } = {},
  ): Promise<void> {
    await page.getByRole('button', { name: 'Kurs (eventnamn)' }).click();
    await page.getByRole('option', { name: 'Fjärrskådning' }).click();
    await page.getByRole('button', { name: 'Typ' }).click();
    await page.getByRole('option', { name: 'Utbildning' }).click();
    await page.getByLabel('Ort').fill('Skövde');
    await page.getByLabel('Startdatum').fill('2026-09-15');
    await page.getByLabel('Slutdatum').fill('2026-09-16');
    await page.getByLabel('Max antal platser').fill('20');
    if (withFormat) {
      await page.getByRole('button', { name: 'Eventformat' }).click();
      await page.getByRole('option', { name: 'RIM-format' }).click();
    }
  }

  test('happy path: fyll → submit → pessimistisk navigation till skapat event', async ({
    page,
  }) => {
    let createCalled = false;
    await page.route(CREATE_EVENT, async (route: Route) => {
      createCalled = true;
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
    // Detalj-sidan (get-event) efter navigation — mockas så vy:n renderar utan fel.
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
    // Hemvisten (task-19.2): URL:en BESTÅR — ingen omdirigering bort.
    await expect(page).toHaveURL(/\/event\/skapa$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    await fillForm(page);
    await page.getByRole('button', { name: 'Skapa event' }).click();

    // Pessimistisk: navigerar till det skapade eventet vid server-OK.
    await page.waitForURL(`**/event/${CREATED_ID}`);
    expect(createCalled).toBe(true);
  });

  test('hemvisten är event-familjen: back-länken pekar på event-listan', async ({ page }) => {
    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    // Back-länken följer hemvist-flytten (task-19.2): till event-listan,
    // inte Mer (jfr Mer-undersidornas "← Tillbaka till Mer").
    await expect(page.getByRole('link', { name: '← Tillbaka till Event' })).toHaveAttribute(
      'href',
      '/event',
    );
    await expect(page.getByRole('link', { name: '← Tillbaka till Mer' })).toHaveCount(0);
  });

  test('gamla routen /mer/skapa-event omdirigerar till /event/skapa (rivningen öppet hanterad)', async ({
    page,
  }) => {
    await page.goto('/mer/skapa-event');

    // Route-nivå-omdirigering (task-19.2): PWA-historik och bokmärken dör
    // inte — de landar på den nya hemvisten.
    await page.waitForURL('**/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeVisible();
  });

  test('required-validering: tom Eventtyp → submit blockeras klient-side, fel synligt, ingen navigation', async ({
    page,
  }) => {
    let createCalled = false;
    await page.route(CREATE_EVENT, async (route: Route) => {
      createCalled = true;
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    await fillForm(page, { withFormat: false });
    await page.getByRole('button', { name: 'Skapa event' }).click();

    // Klient-side-grind: Eventformat-felet syns, ingen EF-anrop, kvar på formuläret.
    await expect(page.getByText('Eventformat krävs — det styr sessionsstrukturen.')).toBeVisible();
    expect(createCalled).toBe(false);
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeVisible();
  });

  test('axe 0 violations på det renderade formuläret', async ({ page }) => {
    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    // Interagera så fält-states (vald option) ingår i scanet.
    await page.getByRole('button', { name: 'Kurs (eventnamn)' }).click();
    await page.getByRole('option', { name: 'Fjärrskådning' }).click();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
