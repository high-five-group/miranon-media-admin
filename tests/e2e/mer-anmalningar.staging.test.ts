import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './support/test-bas';

/**
 * task-1.4 — Samlade anmälningslistan (/mer/anmalningar, LÄS-vy via
 * get-registrations event-lösa gren, GLOBAL lista, senaste först via
 * klient-sort på Inskickad). FK-listmönstret: ETT KORT PER RAD med namn +
 * event + datum; rad med event-koppling är LÄNK till eventets anmälda-vy,
 * rad utan visas olänkad med "Utan event" (PRD beslut 4 + 6).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr mer-vantelista.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av get-registrations. Samma
 * regex-form som hem-e2e:n (`get-registrations` är unik delsträng — krockar
 * inte med create-registration). Mocken speglar EF-svaret
 * `{ registrations: [...] }` (Registration.schema-rader → adapterns
 * `.parse()` passerar).
 *
 * Täckning: list-rendering senaste-först (namn + event + datum per rad),
 * nåbar från Mer-landningens länklista, rad-klick → anmälda-vyn,
 * "Utan event"-rad olänkad, tom-state, fel (4xx role=alert), fokus→<h1>,
 * axe 0. LÄS-vy → ingen write-affordans. INGET delayMs-loading-test
 * (mönstret är lastkänsligt — TASK-3).
 */

const GET_REGISTRATIONS = /\/functions\/v1\/get-registrations/;

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

async function mockRegistrations(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  rows: Row[],
  { status = 200 }: { status?: number } = {},
) {
  await page.route(GET_REGISTRATIONS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body:
        status === 200 ? JSON.stringify({ registrations: rows }) : JSON.stringify({ error: 'x' }),
    });
  });
}

test.describe('Samlade anmälningslistan (task-1.4 — /mer/anmalningar)', () => {
  test('AC 1 — nås från Mer-landningen; rader senaste först med namn + event + datum; fokus → <h1>', async ({
    page,
  }) => {
    await mockRegistrations(page, [
      reg({ fornamn: 'Bo', efternamn: 'Bengtsson', inskickad: '2026-06-21T10:00:00.000Z' }),
      reg({ fornamn: 'Carl', efternamn: 'Carlsson', inskickad: '2026-06-22T10:00:00.000Z' }),
      reg({ fornamn: 'Disa', efternamn: 'Dahl', inskickad: '2026-06-20T10:00:00.000Z' }),
    ]);
    await page.goto('/mer');
    await page.getByRole('link', { name: 'Anmälningar' }).click();

    await expect(page).toHaveURL(/\/mer\/anmalningar$/);
    const h1 = page.getByRole('heading', { level: 1, name: 'Anmälningar' });
    await expect(h1).toBeVisible();
    await expect(h1).toBeFocused();

    // Senaste först (klient-sort på Inskickad, fallande): Carl (22:e) före
    // Bo (21:a) före Disa (20:e) — DOM-ordningen bevisar sorteringen.
    const rader = page.getByRole('list', { name: 'Anmälningar' }).getByRole('link');
    await expect(rader.nth(0)).toContainText('Carl Carlsson');
    await expect(rader.nth(1)).toContainText('Bo Bengtsson');
    await expect(rader.nth(2)).toContainText('Disa Dahl');

    // Namn + event + datum per rad (FK-listmönstret).
    await expect(rader.nth(0)).toContainText('Resor i medvetandet 1');
    await expect(rader.nth(0)).toContainText('2026-06-22');

    // Antal som TEXT (översikt, aldrig enbart färg).
    await expect(page.getByText('3 anmälningar')).toBeVisible();
  });

  test('AC 3 — rad-klick → eventets anmälda-vy; rad utan event olänkad med "Utan event"', async ({
    page,
  }) => {
    await mockRegistrations(page, [
      reg({ fornamn: 'Carl', efternamn: 'Carlsson', eventId: 'recEvent1' }),
      reg({
        fornamn: 'Eva',
        efternamn: 'Ek',
        eventId: null,
        eventNamn: null,
        inskickad: '2026-06-19T10:00:00.000Z',
      }),
    ]);
    await page.goto('/mer/anmalningar');

    // "Utan event"-raden: synlig men OLÄNKAD (uppgiften saknas synligt).
    await expect(page.getByText('Eva Ek')).toBeVisible();
    await expect(page.getByText(/Utan event/)).toBeVisible();
    const lista = page.getByRole('list', { name: 'Anmälningar' });
    await expect(lista.getByRole('link')).toHaveCount(1); // endast Carl-raden

    await page.getByRole('link', { name: /Carl Carlsson/ }).click();
    await expect(page).toHaveURL(/\/event\/recEvent1\/anmalda/);
  });

  test('tomt läge → vänlig text, inga fel', async ({ page }) => {
    await mockRegistrations(page, []);
    await page.goto('/mer/anmalningar');

    await expect(page.getByRole('heading', { level: 1, name: 'Anmälningar' })).toBeVisible();
    await expect(page.getByText('Inga anmälningar än.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('fel (4xx) → fel-UI via role=alert', async ({ page }) => {
    await mockRegistrations(page, [], { status: 404 });
    await page.goto('/mer/anmalningar');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta anmälningarna');
  });

  test('axe 0 violations på den renderade listan', async ({ page }) => {
    await mockRegistrations(page, [
      reg(),
      reg({ fornamn: 'Eva', efternamn: 'Ek', eventId: null, eventNamn: null }),
    ]);
    await page.goto('/mer/anmalningar');
    await expect(page.getByRole('heading', { level: 1, name: 'Anmälningar' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
