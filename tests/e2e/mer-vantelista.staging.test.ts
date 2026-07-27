import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './support/test-bas';

/**
 * Fas 6c Leverabel 3 — Väntelista-vy (/mer/vantelista, LÄS-vy via get-waitlist,
 * GLOBAL lista, NOT Flyttad, createdTime desc).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr event-anmalda.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av get-waitlist. Regex-matchare
 * (`/get-waitlist/`) som INTE kolliderar med andra mocks: `get-waitlist` är unikt
 * (ingen substräng-krock med get-event/get-events/get-person/get-attendance/
 * get-registrations). EF:en anropas UTAN query-params (global) → ingen `\?` i
 * matcharen. Mocken speglar EF-svaret `{ waitlist: [...] }` (WaitlistEntrySchema-rader).
 *
 * Täckning: roster-rendering (namn + ställde-sig-datum + e-post + telefon +
 * informationsmail-status), antal-summa, fokus→<h1> + aria-live, tom-state, fel
 * (role=alert), loading aria-busy, namn-fallback ("Namn saknas"), axe 0. LÄS-vy →
 * INGEN flytta-/write-affordans.
 */

const GET_WAITLIST = /\/functions\/v1\/get-waitlist/;

type Row = Record<string, unknown>;

/** En komplett WaitlistEntry-rad (EF-svarets form, WaitlistEntrySchema). */
function row(overrides: Row = {}): Row {
  return {
    id: `recWL${Math.random().toString(36).slice(2, 10)}`,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1234567',
    informationsmail1Skickad: null,
    createdTime: '2026-05-02T10:00:00.000Z',
    ...overrides,
  };
}

async function mockWaitlist(
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
  // mot realtid under parallell worker-last (T26 Landning B). Befintliga callers
  // (utan flaggan) är orörda — release() är då en no-op de ignorerar.
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  await page.route(GET_WAITLIST, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    if (gate) await gate;
    else if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: status === 200 ? JSON.stringify({ waitlist: rows }) : JSON.stringify({ error: 'x' }),
    });
  });
  return release;
}

test.describe('Väntelista-vy (Fas 6c L3 — LÄS-vy via get-waitlist)', () => {
  test('roster renderas (namn + fält) + antal-summa; fokus → <h1>', async ({ page }) => {
    await mockWaitlist(page, [
      row({
        fornamn: 'Anna',
        efternamn: 'Andersson',
        email: 'anna@example.se',
        telefon: '070-1111111',
        informationsmail1Skickad: '2026-04-28T06:37:58.949Z',
        createdTime: '2026-05-02T10:00:00.000Z',
      }),
      row({
        fornamn: 'Bo',
        efternamn: 'Bengtsson',
        email: 'bo@example.se',
        telefon: '070-2222222',
        informationsmail1Skickad: null,
        createdTime: '2026-05-01T09:00:00.000Z',
      }),
    ]);
    await page.goto('/mer/vantelista');

    // <h1> = "Väntelista", fokuserad efter async-laddning.
    const heading = page.getByRole('heading', { level: 1, name: 'Väntelista' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att väntelistan anlänt.
    await expect(page.getByText('Väntelistan laddad.')).toHaveCount(1);

    // Antal-summa som TEXT.
    await expect(page.getByText('2 på väntelistan')).toBeVisible();

    // Namn (aldrig record-ID) + kontaktfält.
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByText('Bo Bengtsson')).toBeVisible();
    await expect(page.getByText('anna@example.se')).toBeVisible();
    await expect(page.getByText('bo@example.se')).toBeVisible();

    // Ställde sig: createdTime formaterat sv-SE (aldrig rå ISO).
    await expect(page.getByText('2026-05-02')).toBeVisible();
    await expect(page.getByText('2026-05-01')).toBeVisible();

    // Informationsmail-1-status som TEXT, båda grenarna.
    await expect(page.getByText('Skickat 2026-04-28')).toBeVisible();
    await expect(page.getByText('Ej skickat')).toBeVisible();

    // LÄS-vy: ingen flytta-/spara-/markera-kontroll (write = framtida slice).
    // Namn-scopad så app-skalets chrome ej ger falskt negativ.
    await expect(
      page.getByRole('button', { name: /flytta|markera|spara|ändra|ta bort/i }),
    ).toHaveCount(0);

    // Tillbaka-länk → Mer-landningen.
    await expect(page.getByRole('link', { name: '← Tillbaka till Mer' })).toHaveAttribute(
      'href',
      '/mer',
    );
  });

  test('tom väntelista → vänlig tom-text, ej fel', async ({ page }) => {
    await mockWaitlist(page, []);
    await page.goto('/mer/vantelista');

    await expect(page.getByRole('heading', { level: 1, name: 'Väntelista' })).toBeVisible();
    await expect(page.getByText('Väntelistan är tom.')).toBeVisible();
    await expect(page.getByText('0 på väntelistan')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('namn null → "Namn saknas" (graciöst), aldrig krasch/tomt', async ({ page }) => {
    await mockWaitlist(page, [row({ fornamn: null, efternamn: null })]);
    await page.goto('/mer/vantelista');
    await expect(page.getByText('Namn saknas')).toBeVisible();
  });

  test('fel (4xx, klient-fel) → fel-UI via role=alert (ingen retry)', async ({ page }) => {
    // 4xx → no-retry-grenen (speglar event-anmalda 404): isError direkt, ingen
    // backoff. 5xx vore fel testval — då retryar react-query korrekt och alerten
    // dröjer förbi timeouten.
    await mockWaitlist(page, [], { status: 404 });
    await page.goto('/mer/vantelista');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta väntelistan');
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page }) => {
    // Håll EF-svaret öppet → loading-tillståndet är deterministiskt synligt medan
    // route:n hålls (ingen realtids-race mot en fast delayMs under parallell last).
    const release = await mockWaitlist(page, [row()], { manualRelease: true });
    await page.goto('/mer/vantelista');
    await expect(page.getByText('Laddar väntelistan…')).toBeVisible();
    // Släpp svaret → laddat tillstånd renderas.
    release();
    await expect(page.getByRole('heading', { level: 1, name: 'Väntelista' })).toBeVisible();
  });

  test('axe 0 violations på den renderade väntelista-vyn', async ({ page }) => {
    await mockWaitlist(page, [
      row({ fornamn: 'Anna', efternamn: 'Andersson', email: 'anna@example.se' }),
      row({
        fornamn: 'Bo',
        efternamn: 'Bengtsson',
        email: 'bo@example.se',
        createdTime: '2026-05-01T09:00:00.000Z',
      }),
    ]);
    await page.goto('/mer/vantelista');
    await expect(page.getByRole('heading', { level: 1, name: 'Väntelista' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
