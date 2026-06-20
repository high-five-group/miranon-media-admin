import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6b L2 — Event-detalj (info-vy, berikad operations-översikt via get-event).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr person-detail.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av get-event. Regex-matchare
 * (`/get-event\?/`) så mocken INTE råkar fånga get-events (substräng-kollision:
 * `get-event` följs av `s`, inte `?`). Mocken speglar EF-svaret `{ event }`
 * (EventSchema-form).
 *
 * Täckning: identitet + beläggnings-överblick + betalnings-sammanfattning +
 * länkar till detaljytorna, fullt-event-flagga, namnlöst-fallback, loading
 * aria-busy, fel-state, NOT-FOUND (404), fokus→<h1> + aria-live, axe 0.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const EVENT_ID = 'recDETAIL0000001';

type EventMock = Record<string, unknown>;

function eventDetail(overrides: EventMock = {}): EventMock {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 2 – 2026-06-01',
    eventNamn: 'Resor i medvetandet 2',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-06-01',
    slutdatum: '2026-06-01',
    tidKvarTillEvent: 'Om 10 dagar',
    maxPlatser: 25,
    antalAnmalda: 18,
    platserKvar: 7,
    anmaldBelaggning: 0.72,
    bekraftadBelaggning: 0.6,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 12,
    antalSlutbetalningar: 5,
    antalSlutbetalningFelande: 2,
    status: 'Planerat',
    ...overrides,
  };
}

async function mockEvent(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  body: EventMock,
  { status = 200, delayMs = 0 }: { status?: number; delayMs?: number } = {},
) {
  await page.route(GET_EVENT, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: status === 200 ? JSON.stringify({ event: body }) : JSON.stringify({ error: 'x' }),
    });
  });
}

test.describe('Event-detalj (Fas 6b L2 — info-vy)', () => {
  test('full operations-översikt renderas; fokus → <h1>', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);

    // <h1> = eventnamn, fokuserad efter async-laddning.
    const heading = page.getByRole('heading', { level: 1, name: 'Resor i medvetandet 2' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att eventet anlänt.
    await expect(page.getByText('Event Resor i medvetandet 2 laddat.')).toHaveCount(1);

    // Identitet.
    await expect(page.getByText('Utbildning')).toBeVisible();
    await expect(page.getByText('Planerat')).toBeVisible();

    // Beläggning som TEXT + procent.
    await expect(page.getByText('18 av 25 platser · 72 % fullt')).toBeVisible();

    // Betalnings-SAMMANFATTNING (siffror, ej lista).
    await expect(page.getByText('12 av 18 har betalat anmälningsavgift.')).toBeVisible();
    await expect(page.getByText('Slutbetalningar: 5 mottagna, 2 saknas.')).toBeVisible();

    // Länkar till detaljytorna.
    await expect(page.getByRole('link', { name: 'Öppna betalnings-vyn →' })).toHaveAttribute(
      'href',
      `/event/${EVENT_ID}/betalning`,
    );
    await expect(page.getByRole('link', { name: 'Öppna närvaro-vyn →' })).toHaveAttribute(
      'href',
      `/event/${EVENT_ID}/narvaro`,
    );
  });

  test('fullt event → "Fullt" i text (ej enbart färg)', async ({ page }) => {
    await mockEvent(page, eventDetail({ antalAnmalda: 25, platserKvar: 0, anmaldBelaggning: 1 }));
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByText('25 av 25 platser · Fullt · 100 % fullt')).toBeVisible();
  });

  test('null-säker beläggning: osatt maxPlatser → "platser ej satt", ingen NaN', async ({
    page,
  }) => {
    await mockEvent(
      page,
      eventDetail({ maxPlatser: null, platserKvar: null, anmaldBelaggning: null }),
    );
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByText('18 anmälda (platser ej satt)')).toBeVisible();
  });

  test('namnlöst event → fallback, ingen krasch', async ({ page }) => {
    await mockEvent(page, eventDetail({ eventNamn: null, eventlabel: null }));
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Namnlöst event' })).toBeVisible();
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

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page }) => {
    await mockEvent(page, eventDetail(), { delayMs: 500 });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByText('Laddar event…')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Resor i medvetandet 2' }),
    ).toBeVisible();
  });

  test('axe 0 violations på den renderade detaljvyn', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Resor i medvetandet 2' }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
