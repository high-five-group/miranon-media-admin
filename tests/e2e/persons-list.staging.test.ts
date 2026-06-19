import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6a — Personer-listan (cursor-paginerad, ADR-056).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr mark-paid.staging.test.ts).
 *
 * **Deterministiska via `page.route`-interception** av get-persons — INTE
 * faktisk EF-deploy (det är Landning 4). Mocken speglar cursor-porten:
 * `{ persons, nextCursor }` per sida, och nästa anrop bär `?cursor=<förra
 * nextCursor>`. Cursorn är opak för klienten, så testet styr värdena fritt.
 *
 * Täckning: DoD 2 (vy mot data), DoD 3 (cursor-round-trip via "Ladda fler"),
 * DoD 4 (axe 0), DoD 5 (useInfiniteQuery + getNextPageParam), plus a11y bortom
 * axe: fokus-behållning på "Ladda fler" + aria-live-annonsering av antal nya rader.
 */

const GET_PERSONS = '**/functions/v1/get-persons*';

/** Komplett Person som passerar PersonSchema (.parse i adaptern). */
function person(i: number) {
  const namn = `Person ${String(i).padStart(2, '0')}`;
  return {
    id: `recPERSONTEST${String(i).padStart(7, '0')}`,
    namn,
    fornamn: `Person`,
    efternamn: String(i).padStart(2, '0'),
    email: `person.${String(i).padStart(2, '0')}@example.test`,
    telefon: null,
    ort: ['Skövde'],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar: null,
    antalAnmalningar: i % 5,
    antalDeltaganden: 0,
    erfarenhetsniva: null,
    erfarenhetsbadge: null,
    senasteInteraktion: null,
    senasteInteraktionDatum: null,
    dagarSedanSenaste: null,
    harAktivAnmalan: null,
    ejGodkandMail: false,
    radSkapad: null,
    anmalningIds: [],
    deltagandeIds: [],
  };
}

/** Cursor-paginerad mock: tre sidor (00–01 → c1 → 02–03 → c2 → 04 → null). */
function respondPage(rawUrl: string) {
  const url = new URL(rawUrl);
  const search = url.searchParams.get('search');
  const cursor = url.searchParams.get('cursor');

  // Sökning: enkel namn-substräng-filtrering, en enda sida (ingen cursor).
  if (search) {
    const all = [0, 1, 2, 3, 4].map(person);
    const persons = all.filter((p) => p.namn.toLowerCase().includes(search.toLowerCase()));
    return JSON.stringify({ persons, nextCursor: null });
  }

  if (!cursor) return JSON.stringify({ persons: [person(0), person(1)], nextCursor: 'c1' });
  if (cursor === 'c1') return JSON.stringify({ persons: [person(2), person(3)], nextCursor: 'c2' });
  if (cursor === 'c2') return JSON.stringify({ persons: [person(4)], nextCursor: null });
  return JSON.stringify({ persons: [], nextCursor: null });
}

test.describe('Personer-listan (Fas 6a — cursor-port)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(GET_PERSONS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: respondPage(route.request().url()),
      });
    });
  });

  test('DoD 2+3+5 — cursor-round-trip via "Ladda fler"', async ({ page }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });
    const loadMore = page.getByRole('button', { name: 'Ladda fler' });

    // Sida 1.
    await expect(list.getByRole('listitem')).toHaveCount(2);
    await expect(page.getByText('2 personer laddade (fler finns).')).toBeVisible();
    await expect(loadMore).toBeVisible();

    // Sida 2 appendas (cursor c1). Knappen finns kvar (fler sidor).
    await loadMore.click();
    await expect(list.getByRole('listitem')).toHaveCount(4);
    // A11y: fokus BEHÅLLS på "Ladda fler" efter laddning.
    await expect(loadMore).toBeFocused();
    // A11y: aria-live annonserar antal nya rader.
    await expect(page.getByText('2 fler personer laddade, 4 totalt.')).toHaveCount(1);

    // Sida 3 appendas (cursor c2) → sista sidan (nextCursor null) → knappen borta.
    await loadMore.click();
    await expect(list.getByRole('listitem')).toHaveCount(5);
    await expect(loadMore).toHaveCount(0);
    // A11y: fokus tappas inte — flyttas till status-raden när knappen försvinner.
    await expect(page.getByText('5 personer laddade.')).toBeFocused();
  });

  test('DoD 5 — sökning skriver ?q och filtrerar via server-param', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('2 personer laddade (fler finns).')).toBeVisible();

    await page.getByRole('searchbox', { name: 'Sök person' }).fill('Person 00');

    await expect(page).toHaveURL(/[?&]q=Person/);
    await expect(page.getByText('1 person laddade för "Person 00".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(1);
  });

  test('DoD 5 — tom sökning ger "Inga träffar"', async ({ page }) => {
    await page.goto('/personer');
    await page.getByRole('searchbox', { name: 'Sök person' }).fill('Finnsinte');
    await expect(page.getByText('Inga träffar för "Finnsinte".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(0);
  });

  test('DoD 4 — axe 0 violations på den renderade listan', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('2 personer laddade (fler finns).')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
