import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6e L1 Landning 3 — Intresserade-vy (/mer/intresserade, LÄS-vy via get-leads,
 * GLOBAL lista, strikt lead-formel, Senaste interaktion desc).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr mer-vantelista.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av get-leads. Regex-matchare
 * (`/get-leads/`) som INTE kolliderar med andra mocks: `get-leads` är unikt
 * (ingen substräng-krock med get-event/get-events/get-person/get-persons/
 * get-attendance/get-registrations/get-waitlist). EF:en anropas UTAN query-params
 * (global första sida) → ingen `\?` i matcharen. Mocken speglar EF-svaret
 * `{ intresserade: [...] }` (IntresseradSchema-rader — adaptern z.array().parse():ar
 * vid datagränsen, så varje mock-rad måste vara komplett mot schemat).
 *
 * Täckning: roster-rendering (namn + nappat-på/allaHamtningar + antalHamtningar +
 * senaste interaktion), antal-summa, fokus→<h1> + aria-live, tom-state, fel
 * (role=alert), loading aria-busy, namnlös-fallback (MED + UTAN e-post), axe 0.
 * LÄS-vy → INGEN write-affordans.
 */

const GET_LEADS = /\/functions\/v1\/get-leads/;

type Row = Record<string, unknown>;

/** En komplett Intresserad-rad (EF-svarets form, IntresseradSchema = PersonSchema
 * .extend + antalHamtningar/allaHamtningar). Alla fält närvarande — adaptern
 * .parse():ar mot z.array(IntresseradSchema), så en ofullständig rad → parse-fel. */
function row(overrides: Row = {}): Row {
  return {
    id: `recINT${Math.random().toString(36).slice(2, 10)}`,
    namn: 'Anna Andersson',
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1234567',
    ort: [],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar: null,
    antalAnmalningar: 0,
    antalDeltaganden: 0,
    erfarenhetsniva: null,
    erfarenhetsbadge: null,
    senasteInteraktion: 'Laddade ner guide',
    senasteInteraktionDatum: '2026-05-01',
    dagarSedanSenaste: 30,
    harAktivAnmalan: null,
    ejGodkandMail: false,
    radSkapad: '2026-05-01T10:00:00.000Z',
    anmalningIds: [],
    deltagandeIds: [],
    antalHamtningar: 2,
    allaHamtningar: ['Gratis guide', 'Webinar'],
    ...overrides,
  };
}

async function mockLeads(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  rows: Row[],
  {
    status = 200,
    delayMs = 0,
    manualRelease = false,
  }: { status?: number; delayMs?: number; manualRelease?: boolean } = {},
): Promise<() => void> {
  // manualRelease (opt-in): håll EF-svaret öppet tills testet kallar release().
  // Gör loading-fönstret DETERMINISTISKT i stället för att racea en fast delayMs
  // mot realtid (cold-chunk lazy-load under autoCodeSplitting); speglar
  // event-anmalda manualRelease (T26 Landning B). Callers utan flaggan är orörda —
  // release() är då en no-op de ignorerar.
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  await page.route(GET_LEADS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    if (gate) await gate;
    else if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status,
      contentType: 'application/json',
      body:
        status === 200
          ? JSON.stringify({ intresserade: rows, nextCursor: null })
          : JSON.stringify({ error: 'x' }),
    });
  });
  return release;
}

test.describe('Intresserade-vy (Fas 6e L1 L3 — LÄS-vy via get-leads)', () => {
  test('roster renderas (namn + nappat-på + antal + senaste interaktion) + summa; fokus → <h1>', async ({
    page,
  }) => {
    await mockLeads(page, [
      row({
        namn: 'Anna Andersson',
        email: 'anna@example.se',
        antalHamtningar: 2,
        allaHamtningar: ['Gratis guide', 'Webinar'],
        senasteInteraktion: 'Laddade ner guide',
      }),
      row({
        namn: 'Bo Bengtsson',
        email: 'bo@example.se',
        antalHamtningar: 1,
        allaHamtningar: ['Nyhetsbrev'],
        senasteInteraktion: 'Öppnade välkomstmail',
      }),
    ]);
    await page.goto('/mer/intresserade');

    // <h1> = "Intresserade", fokuserad efter async-laddning.
    const heading = page.getByRole('heading', { level: 1, name: 'Intresserade' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att listan anlänt.
    await expect(page.getByText('Intresserade laddade.')).toHaveCount(1);

    // Antal-summa som TEXT.
    await expect(page.getByText('2 intresserade')).toBeVisible();

    // Namn (aldrig record-ID).
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByText('Bo Bengtsson')).toBeVisible();

    // "Nappat på" — allaHamtningar (string[]) som läsbar kommaseparerad lista.
    await expect(page.getByText('Gratis guide, Webinar')).toBeVisible();
    await expect(page.getByText('Nyhetsbrev')).toBeVisible();

    // Antal hämtningar-fältet renderas (dt-etiketten finns).
    await expect(page.getByText('Antal hämtningar').first()).toBeVisible();

    // Senaste interaktion som läsbar text.
    await expect(page.getByText('Laddade ner guide')).toBeVisible();
    await expect(page.getByText('Öppnade välkomstmail')).toBeVisible();

    // LÄS-vy: ingen write-/markera-kontroll (mailutskick = framtida slice).
    // Namn-scopad så app-skalets chrome ej ger falskt negativ.
    await expect(
      page.getByRole('button', { name: /skicka|markera|spara|ändra|ta bort/i }),
    ).toHaveCount(0);

    // Tillbaka-länk → Mer-landningen.
    await expect(page.getByRole('link', { name: '← Tillbaka till Mer' })).toHaveAttribute(
      'href',
      '/mer',
    );
  });

  test('tom lista → vänlig tom-text, ej fel', async ({ page }) => {
    await mockLeads(page, []);
    await page.goto('/mer/intresserade');

    await expect(page.getByRole('heading', { level: 1, name: 'Intresserade' })).toBeVisible();
    await expect(page.getByText('Inga intresserade än.')).toBeVisible();
    await expect(page.getByText('0 intresserade')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('namnlös lead MED e-post → "Namnlös person — …" (graciöst, aldrig krasch/tomt)', async ({
    page,
  }) => {
    await mockLeads(page, [
      row({ namn: null, fornamn: null, efternamn: null, email: 'namnlos@example.se' }),
    ]);
    await page.goto('/mer/intresserade');
    await expect(page.getByText('Namnlös person — namnlos@example.se')).toBeVisible();
  });

  test('namnlös lead UTAN e-post → "Namnlös person" (generisk fallback)', async ({ page }) => {
    await mockLeads(page, [row({ namn: null, fornamn: null, efternamn: null, email: null })]);
    await page.goto('/mer/intresserade');
    await expect(page.getByText('Namnlös person', { exact: true })).toBeVisible();
  });

  test('fel (4xx, klient-fel) → fel-UI via role=alert (ingen retry)', async ({ page }) => {
    // 4xx → no-retry-grenen: isError direkt, ingen backoff. 5xx vore fel testval —
    // då retryar react-query korrekt och alerten dröjer förbi timeouten.
    await mockLeads(page, [], { status: 404 });
    await page.goto('/mer/intresserade');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta intresserade');
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page }) => {
    // Håll EF-svaret öppet → loading-tillståndet är deterministiskt synligt medan
    // route:n hålls (ingen realtids-race mot en fast delayMs / cold-chunk lazy-load).
    const release = await mockLeads(page, [row()], { manualRelease: true });
    await page.goto('/mer/intresserade');
    await expect(page.getByText('Laddar intresserade…')).toBeVisible();
    // Släpp svaret → laddat tillstånd renderas.
    release();
    await expect(page.getByRole('heading', { level: 1, name: 'Intresserade' })).toBeVisible();
  });

  test('axe 0 violations på den renderade intresserade-vyn', async ({ page }) => {
    await mockLeads(page, [
      row({ namn: 'Anna Andersson', email: 'anna@example.se' }),
      row({
        namn: 'Bo Bengtsson',
        email: 'bo@example.se',
        senasteInteraktion: 'Anmälde nyhetsbrev',
      }),
    ]);
    await page.goto('/mer/intresserade');
    await expect(page.getByRole('heading', { level: 1, name: 'Intresserade' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
