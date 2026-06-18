import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6a Landning 2 — Personer-listan (sökbar + paginerad).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr shell.staging.test.ts +
 * mark-paid.staging.test.ts).
 *
 * **Deterministiska via `page.route`-interception** av get-persons — INTE
 * faktisk get-persons-deploy. Avsiktligt: deploy-status är oberoende av denna
 * vy (M4 — EF deployas per namngiven konsument; det är Landning 3+). Testet
 * bevisar KLIENTENS list-/sök-/paginerings-beteende mot ett känt svar, flak-fritt
 * och utan seedad data. Mocken speglar server-side-sökningen: när `search`-param
 * finns filtrerar den svaret (filterByFormula-ekvivalent), så ?q-vägen testas
 * end-to-end inklusive att fetch-nyckeln byter.
 *
 * Täckning: DoD 2 (vy mot data), DoD 3 (vy-baseline), DoD 4 (axe 0),
 * DoD 5 (TanStack-query + URL-state-driven cache).
 */

const GET_PERSONS = '**/functions/v1/get-persons*';

/** Komplett Person som passerar PersonSchema (.parse i adaptern). */
function person(i: number, namn: string) {
  return {
    id: `recPERSONTEST${String(i).padStart(7, '0')}`,
    namn,
    fornamn: namn.split(' ')[0] ?? namn,
    efternamn: namn.split(' ')[1] ?? null,
    email: `${namn.toLowerCase().replace(/\s+/g, '.')}@example.test`,
    telefon: null,
    ort: 'Skövde',
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

/** 30 personer (Person 00 … Person 29) → räcker för två sidor à 25. */
const ALL_PERSONS = Array.from({ length: 30 }, (_, i) =>
  person(i, `Person ${String(i).padStart(2, '0')}`),
);

/** Speglar serverns search: filtrera på namn-substräng (case-insensitive). */
function respondPersons(url: string) {
  const search = new URL(url).searchParams.get('search');
  const persons = search
    ? ALL_PERSONS.filter((p) => p.namn.toLowerCase().includes(search.toLowerCase()))
    : ALL_PERSONS;
  return JSON.stringify({ persons });
}

test.describe('Personer-listan (Fas 6a Landning 2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(GET_PERSONS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: respondPersons(route.request().url()),
      });
    });
  });

  test('DoD 2+3 — listan renderas, paginering ?page byter sida', async ({ page }) => {
    await page.goto('/personer');

    // Lista scopas på namn så AppShell-TabBarens <li> inte räknas med.
    const list = page.getByRole('list', { name: 'Personer' });

    // Antalsraden + första sidan (25 av 30).
    await expect(page.getByText('30 personer.')).toBeVisible();
    await expect(list.getByRole('listitem')).toHaveCount(25);
    await expect(page.getByText('Sida 1 av 2')).toBeVisible();
    await expect(page.getByText('Person 00')).toBeVisible();

    // Nästa sida → 5 kvarvarande + URL bär ?page=2.
    await page.getByRole('button', { name: 'Nästa' }).click();
    await expect(page.getByText('Sida 2 av 2')).toBeVisible();
    await expect(list.getByRole('listitem')).toHaveCount(5);
    await expect(page.getByText('Person 29')).toBeVisible();
    await expect(page).toHaveURL(/[?&]page=2/);
  });

  test('DoD 5 — sökning skriver ?q och filtrerar via server-param', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('30 personer.')).toBeVisible();

    await page.getByRole('searchbox', { name: 'Sök person' }).fill('Person 1');

    // Debouncad → URL får ?q, servern filtrerar (Person 10–19 = 10 träffar).
    await expect(page).toHaveURL(/[?&]q=Person/);
    await expect(page.getByText('10 personer för "Person 1".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(
      10,
    );
  });

  test('DoD 5 — tom sökning ger "Inga träffar"', async ({ page }) => {
    await page.goto('/personer');
    await page.getByRole('searchbox', { name: 'Sök person' }).fill('Finnsinte');
    await expect(page.getByText('Inga träffar för "Finnsinte".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(0);
  });

  test('DoD 4 — axe 0 violations på den renderade listan', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('30 personer.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
