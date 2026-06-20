import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6b L1 — Event-listan (filtrerbar + sorterbar, klient-side).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr persons-list.staging.test.ts).
 *
 * **Deterministisk via `page.route`-interception** av get-events — INTE faktisk
 * EF-deploy (get-events är redan live; mocken gör testet stabilt och seed-fritt).
 * Mocken speglar EF-svaret `{ events: [...] }` som fetchEvents `.parse()`:ar.
 * Fasta datum (2099/2000) gör upcoming/past-filtret stabilt oavsett körtid.
 *
 * Täckning: vy mot data (baseline), status-filter (?status), sort (date+capacity),
 * beläggning-som-text + "Fullt" + procent vid capacity-sort, aria-live-bekräftelse
 * av omsortering, axe 0.
 */

const GET_EVENTS = '**/functions/v1/get-events*';

/** Komplett Event som passerar EventSchema (.parse i adaptern). */
function event(o: {
  id: string;
  namn: string;
  startdatum: string | null;
  maxPlatser: number | null;
  antalAnmalda: number;
  platserKvar: number | null;
  anmaldBelaggning: number | null;
  status?: string | null;
}) {
  return {
    id: o.id,
    eventlabel: o.namn,
    eventNamn: o.namn,
    typ: 'Kurs',
    ort: 'Skövde',
    startdatum: o.startdatum,
    slutdatum: o.startdatum,
    tidKvarTillEvent: null,
    maxPlatser: o.maxPlatser,
    antalAnmalda: o.antalAnmalda,
    platserKvar: o.platserKvar,
    anmaldBelaggning: o.anmaldBelaggning,
    bekraftadBelaggning: o.anmaldBelaggning,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: o.status ?? 'Planerat',
  };
}

// 3 kommande (B 2099-03, A 2099-06, C 2099-09) + 1 tidigare (D 2000-01).
const EVENTS = [
  event({
    id: 'recEVENTA',
    namn: 'Alfaevent',
    startdatum: '2099-06-01',
    maxPlatser: 25,
    antalAnmalda: 18,
    platserKvar: 7,
    anmaldBelaggning: 0.72,
  }),
  event({
    id: 'recEVENTB',
    namn: 'Betaevent',
    startdatum: '2099-03-01',
    maxPlatser: 10,
    antalAnmalda: 10,
    platserKvar: 0,
    anmaldBelaggning: 1,
  }),
  event({
    id: 'recEVENTC',
    namn: 'Charlieevent',
    startdatum: '2099-09-01',
    maxPlatser: null,
    antalAnmalda: 5,
    platserKvar: null,
    anmaldBelaggning: null,
  }),
  event({
    id: 'recEVENTD',
    namn: 'Deltaevent',
    startdatum: '2000-01-01',
    maxPlatser: 30,
    antalAnmalda: 12,
    platserKvar: 18,
    anmaldBelaggning: 0.4,
    status: 'Genomfört',
  }),
];

test.describe('Event-listan (Fas 6b L1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(GET_EVENTS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: EVENTS }),
      });
    });
  });

  test('baseline — default upcoming + datum-sort (närmast först)', async ({ page }) => {
    await page.goto('/event');
    const list = page.getByRole('list', { name: 'Event' });

    // 3 kommande, datum-sort stigande → Beta (mars) före Alfa (juni) före Charlie (sep).
    await expect(list.getByRole('listitem')).toHaveCount(3);
    await expect(page.getByText('3 event (kommande)')).toBeVisible();
    const names = list.getByRole('link');
    await expect(names.nth(0)).toHaveText('Betaevent');
    await expect(names.nth(1)).toHaveText('Alfaevent');
    await expect(names.nth(2)).toHaveText('Charlieevent');

    // Beläggning som TEXT (aldrig enbart färg); "Fullt"; null-säker platstext.
    await expect(list.getByRole('listitem').filter({ hasText: 'Betaevent' })).toContainText(
      '10 av 10 platser · Fullt',
    );
    await expect(list.getByRole('listitem').filter({ hasText: 'Alfaevent' })).toContainText(
      '18 av 25 platser',
    );
    await expect(list.getByRole('listitem').filter({ hasText: 'Charlieevent' })).toContainText(
      '5 anmälda (platser ej satt)',
    );

    // Rad-namn länkar till info-vyn /event/$eventId.
    await expect(names.nth(0)).toHaveAttribute('href', '/event/recEVENTB');
  });

  test('sort=capacity — fallande andel, null sist, procent synlig + aria-live', async ({
    page,
  }) => {
    await page.goto('/event');
    await page.getByRole('button', { name: /Sortera efter/ }).click();
    await page.getByRole('option', { name: 'Beläggning' }).click();

    await expect(page).toHaveURL(/[?&]sort=capacity/);
    const list = page.getByRole('list', { name: 'Event' });
    const names = list.getByRole('link');
    // Beta 100% > Alfa 72% > Charlie null (sist).
    await expect(names.nth(0)).toHaveText('Betaevent');
    await expect(names.nth(1)).toHaveText('Alfaevent');
    await expect(names.nth(2)).toHaveText('Charlieevent');

    // Procenten visas så ordningen blir begriplig (Gunilla-principen).
    await expect(list.getByRole('listitem').filter({ hasText: 'Alfaevent' })).toContainText('72 %');
    // aria-live bekräftar omsorteringen.
    await expect(
      page.getByText('sorterat efter beläggning, fullast först', { exact: false }),
    ).toHaveCount(1);
  });

  test('status=past — datum-baserat filter (endast tidigare event)', async ({ page }) => {
    await page.goto('/event');
    await page.getByRole('button', { name: /Visa/ }).click();
    await page.getByRole('option', { name: 'Tidigare' }).click();

    await expect(page).toHaveURL(/[?&]status=past/);
    const list = page.getByRole('list', { name: 'Event' });
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(list.getByRole('link')).toHaveText('Deltaevent');
  });

  test('axe 0 violations på den renderade listan', async ({ page }) => {
    await page.goto('/event');
    await expect(page.getByText('3 event (kommande)')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
