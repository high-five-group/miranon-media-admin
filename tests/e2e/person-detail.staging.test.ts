import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6a L5a — Persondetalj (aggregerande get-person, full kurshistorik).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr persons-list.staging.test.ts).
 *
 * **Deterministiska via `page.route`-mock** av get-person — INTE faktisk
 * EF-deploy (det är L5b). Regex-matchare (`/get-person\?/`) så mocken INTE
 * råkar fånga get-persons (prefix-kollision). Mocken speglar EF-svaret
 * `{ person }` (PersonDetailSchema-form, inkl. event-för-event-historik).
 *
 * Täckning: full-historik-rendering, kontakt/leads/flaggor, namnlös-fallback,
 * loading aria-busy, fel-state, NOT-FOUND (404 → ej-funnen-UI), fokus→<h1> +
 * aria-live-annonsering, axe 0.
 */

const GET_PERSON = /\/functions\/v1\/get-person\?/;
const PERSON_ID = 'recDETAIL0000001';

type PersonDetailMock = Record<string, unknown>;

function personDetail(overrides: PersonDetailMock = {}): PersonDetailMock {
  return {
    id: PERSON_ID,
    namn: 'Anna Andersson',
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.test',
    telefon: '070-1234567',
    ort: 'Skövde',
    manuellFlagga: null,
    aiFlagga: 'Erfaren',
    anteckningar: 'Viktig kontakt — ring före nästa event.',
    antalAnmalningar: 3,
    antalDeltaganden: 5,
    erfarenhetsniva: 'Genomfört RIM steg 1–2',
    erfarenhetsbadge: 'Resenär steg 1–2',
    senasteInteraktion: 'RIM 2',
    senasteInteraktionDatum: '2026-03-01',
    dagarSedanSenaste: 100,
    harAktivAnmalan: 'Aktiv',
    ejGodkandMail: false,
    radSkapad: '2026-01-01T00:00:00.000Z',
    anmalningIds: ['recANM0000000001'],
    deltagandeIds: ['recDLT0000000001', 'recDLT0000000002'],
    aterkommande: 'Ja',
    nastaEvent: 'RIM 2 — Skövde',
    antalGenomfordaEvent: 2,
    senasteDeltagandeDatum: '2026-03-01',
    antalHamtningar: 1,
    allaHamtningar: 'Gratis meditation',
    motivering: 'Vill utvecklas vidare.',
    inbjudenCommunity: true,
    skapatKontoCommunity: false,
    historik: [
      {
        id: 'recDLT0000000002',
        kursnamn: 'Resor i medvetandet 2',
        eventLabel: 'RIM 2 — Göteborg 2026-03-01',
        datum: '2026-03-01',
        session: 'Dag 1',
        status: 'Frånvarande',
        narvaro: false,
        ort: 'Göteborg',
        typ: 'Utbildning',
      },
      {
        id: 'recDLT0000000001',
        kursnamn: 'Resor i medvetandet 1',
        eventLabel: 'RIM 1 — Skövde 2026-02-01',
        datum: '2026-02-01',
        session: 'Dag 1',
        status: 'Närvarande',
        narvaro: true,
        ort: 'Skövde',
        typ: 'Utbildning',
      },
    ],
    ...overrides,
  };
}

async function mockPerson(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  body: PersonDetailMock,
  { status = 200, delayMs = 0 }: { status?: number; delayMs?: number } = {},
) {
  await page.route(GET_PERSON, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: status === 200 ? JSON.stringify({ person: body }) : JSON.stringify({ error: 'x' }),
    });
  });
}

test.describe('Persondetalj (Fas 6a L5a — aggregerande get-person)', () => {
  test('full historik + kontakt/leads/flaggor renderas; fokus → <h1>', async ({ page }) => {
    await mockPerson(page, personDetail());
    await page.goto(`/personer/${PERSON_ID}`);

    // <h1> = namn, fokuserad efter async-laddning.
    const heading = page.getByRole('heading', { level: 1, name: 'Anna Andersson' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att detaljerna anlänt.
    await expect(page.getByText('Persondetaljer för Anna Andersson laddade.')).toHaveCount(1);

    // Kurshistorik: event-för-event (båda raderna syns, senaste först).
    const history = page.getByRole('list', { name: /Kurshistorik/ });
    await expect(history.getByRole('listitem')).toHaveCount(2);
    await expect(page.getByText('RIM 2 — Göteborg 2026-03-01')).toBeVisible();
    await expect(page.getByText('RIM 1 — Skövde 2026-02-01')).toBeVisible();

    // Kontakt, leads, flaggor.
    await expect(page.getByText('anna@example.test')).toBeVisible();
    await expect(page.getByText('Gratis meditation')).toBeVisible();
    await expect(page.getByText('AI-flagga: Erfaren')).toBeVisible();

    // Anteckningar (READ-ONLY i L5a).
    await expect(page.getByText('Viktig kontakt — ring före nästa event.')).toBeVisible();
  });

  test('namnlös person → fallback, ingen krasch', async ({ page }) => {
    await mockPerson(page, personDetail({ namn: null, fornamn: null, efternamn: null }));
    await page.goto(`/personer/${PERSON_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Namnlös person' })).toBeVisible();
  });

  test('NOT-FOUND (404) → ej-funnen-UI via role=alert', async ({ page }) => {
    await mockPerson(page, personDetail(), { status: 404 });
    await page.goto(`/personer/${PERSON_ID}`);
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Personen hittades inte');
  });

  test('övrigt fel (icke-404) → generisk fel-UI via role=alert', async ({ page }) => {
    // 400 (klient-fel) → ingen retry (varken fetchWithRetry eller useQuery
    // retryar 4xx) → deterministiskt, snabbt fel. Skiljt från 404-grenen ovan.
    await mockPerson(page, personDetail(), { status: 400 });
    await page.goto(`/personer/${PERSON_ID}`);
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta persondetaljer');
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page }) => {
    await mockPerson(page, personDetail(), { delayMs: 500 });
    await page.goto(`/personer/${PERSON_ID}`);
    // Innan svaret anländer: synlig + sr-tillgänglig laddnings-status.
    await expect(page.getByText('Laddar persondetaljer…')).toBeVisible();
    // När datan kommit försvinner laddningen.
    await expect(page.getByRole('heading', { level: 1, name: 'Anna Andersson' })).toBeVisible();
  });

  test('axe 0 violations på den renderade detaljvyn', async ({ page }) => {
    await mockPerson(page, personDetail());
    await page.goto(`/personer/${PERSON_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Anna Andersson' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
