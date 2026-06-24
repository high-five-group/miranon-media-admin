import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6e L2 Landning 2 — Maillogg-vy (/mer/maillogg, LÄS-vy via get-mail-log,
 * GLOBAL lista, hela Utskickslogg, createdTime desc).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr mer-vantelista.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av get-mail-log. Regex-matchare
 * (`/get-mail-log/`) som INTE kolliderar med andra mocks: `get-mail-log` är unikt
 * (ingen substräng-krock med get-leads/get-waitlist/get-event(s)/get-person(s)/
 * get-attendance/get-registrations). EF:en anropas UTAN query-params (global) →
 * ingen `\?` i matcharen. Mocken speglar EF-svaret `{ maillog: [...] }`
 * (MailLogEntrySchema-rader — adaptern z.array().parse():ar vid datagränsen).
 *
 * TOM-TILLSTÅND ÄR PRIMÄRT: Utskickslogg är tom tills L3 send-email loggar utskick.
 * Tom-vyn måste vara ärlig (icke-alarmerande) OCH axe-ren. Täckning: tom-tillstånd,
 * roster, öppningsgrad-formatering (decimal→%, null→"—", aldrig NaN/null), namn-
 * fallback, fel (role=alert), loading (manualRelease), axe 0 på BÅDE tom + ifylld.
 */

const GET_MAIL_LOG = /\/functions\/v1\/get-mail-log/;

type Row = Record<string, unknown>;

/** En komplett MailLogEntry-rad (EF-svarets form, MailLogEntrySchema). oppningsgrad
 * är DECIMAL 0–1; utskicksIds/skickatTill är rec-ID-arrayer (länkfält). */
function row(overrides: Row = {}): Row {
  return {
    id: `recML${Math.random().toString(36).slice(2, 10)}`,
    utskicksNamn: 'Vårnyhetsbrev',
    utskicksIds: ['recBULK01'],
    skickatTill: ['recPER01', 'recPER02'],
    antalSkickade: 2,
    datum: '2026-05-02T10:00:00.000Z',
    oppningsgrad: 0.5,
    filterSnapshot: 'Segment: aktiva deltagare',
    mailutskickCopy: null,
    ...overrides,
  };
}

async function mockMailLog(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  rows: Row[],
  {
    status = 200,
    delayMs = 0,
    manualRelease = false,
  }: { status?: number; delayMs?: number; manualRelease?: boolean } = {},
): Promise<() => void> {
  // manualRelease (opt-in): håll EF-svaret öppet tills testet kallar release() →
  // deterministiskt loading-fönster (ingen race mot fast delayMs / cold-chunk
  // lazy-load); speglar event-anmalda/mer-intresserade (T26 Landning B).
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  await page.route(GET_MAIL_LOG, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    if (gate) await gate;
    else if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: status === 200 ? JSON.stringify({ maillog: rows }) : JSON.stringify({ error: 'x' }),
    });
  });
  return release;
}

test.describe('Maillogg-vy (Fas 6e L2 L2 — LÄS-vy via get-mail-log)', () => {
  test('tom-tillstånd (NORMALT): ärlig icke-alarmerande text, 0 utskick, ej fel, fokus→h1', async ({
    page,
  }) => {
    await mockMailLog(page, []);
    await page.goto('/mer/maillogg');

    // <h1> = "Maillogg", fokuserad efter async-laddning (tom är giltigt laddat).
    const heading = page.getByRole('heading', { level: 1, name: 'Maillogg' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // Ärlig tom-text (systemet är nytt, inte trasigt) — INGEN fel-yta.
    await expect(page.getByText('Inga mailutskick har loggats än.')).toBeVisible();
    await expect(page.getByText('0 utskick')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('roster renderas (namn + datum + mottagare + öppningsgrad) + summa; fokus → <h1>', async ({
    page,
  }) => {
    await mockMailLog(page, [
      row({
        utskicksNamn: 'Vårnyhetsbrev',
        datum: '2026-05-02T10:00:00.000Z',
        antalSkickade: 2,
        oppningsgrad: 0.5,
      }),
      row({
        utskicksNamn: 'Höstkampanj',
        datum: '2026-05-01T09:00:00.000Z',
        antalSkickade: 5,
        oppningsgrad: 0.2,
      }),
    ]);
    await page.goto('/mer/maillogg');

    const heading = page.getByRole('heading', { level: 1, name: 'Maillogg' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att loggen anlänt.
    await expect(page.getByText('Maillogg laddad.')).toHaveCount(1);

    // Antal-summa som TEXT.
    await expect(page.getByText('2 utskick')).toBeVisible();

    // Utskicksnamn (aldrig record-ID).
    await expect(page.getByText('Vårnyhetsbrev')).toBeVisible();
    await expect(page.getByText('Höstkampanj')).toBeVisible();

    // Datum formaterat sv-SE (aldrig rå ISO).
    await expect(page.getByText('2026-05-02')).toBeVisible();
    await expect(page.getByText('2026-05-01')).toBeVisible();

    // Mottagar-antal + öppningsgrad (decimal → %).
    await expect(page.getByText('2 mottagare')).toBeVisible();
    await expect(page.getByText('5 mottagare')).toBeVisible();
    await expect(page.getByText('50 %')).toBeVisible();
    await expect(page.getByText('20 %')).toBeVisible();

    // Tillbaka-länk → Mer-landningen.
    await expect(page.getByRole('link', { name: '← Tillbaka till Mer' })).toHaveAttribute(
      'href',
      '/mer',
    );
  });

  test('öppningsgrad-formatering: decimal → "%", null (0 skickade) → "—", aldrig NaN/null', async ({
    page,
  }) => {
    await mockMailLog(page, [
      row({ utskicksNamn: 'Med öppningar', antalSkickade: 10, oppningsgrad: 0.5 }),
      // Div-by-zero: 0 skickade → Airtable ger null → vyn visar "—", ALDRIG "NaN %".
      row({ utskicksNamn: 'Inga skickade', antalSkickade: 0, oppningsgrad: null }),
    ]);
    await page.goto('/mer/maillogg');
    await expect(page.getByRole('heading', { level: 1, name: 'Maillogg' })).toBeVisible();

    await expect(page.getByText('50 %')).toBeVisible();
    await expect(page.getByText('—')).toBeVisible();
    // Ingen NaN/null läcker till UI:t (null hanteras före formatering).
    await expect(page.getByText(/NaN/)).toHaveCount(0);
    await expect(page.getByText(/null\s*%/)).toHaveCount(0);
  });

  test('namn-fallback: utskicksNamn=null + mailutskickCopy=null → "Namnlöst utskick"', async ({
    page,
  }) => {
    await mockMailLog(page, [row({ utskicksNamn: null, mailutskickCopy: null })]);
    await page.goto('/mer/maillogg');
    await expect(page.getByText('Namnlöst utskick')).toBeVisible();
  });

  test('fel (4xx, klient-fel) → fel-UI via role=alert (ingen retry)', async ({ page }) => {
    // 4xx → no-retry-grenen: isError direkt, ingen backoff.
    await mockMailLog(page, [], { status: 404 });
    await page.goto('/mer/maillogg');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta maillogg');
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page }) => {
    // Håll EF-svaret öppet → loading deterministiskt synligt (ingen realtids-race).
    const release = await mockMailLog(page, [row()], { manualRelease: true });
    await page.goto('/mer/maillogg');
    await expect(page.getByText('Laddar maillogg…')).toBeVisible();
    // Släpp svaret → laddat tillstånd renderas.
    release();
    await expect(page.getByRole('heading', { level: 1, name: 'Maillogg' })).toBeVisible();
  });

  test('axe 0 violations på TOM vy (primärt tillstånd)', async ({ page }) => {
    await mockMailLog(page, []);
    await page.goto('/mer/maillogg');
    await expect(page.getByText('Inga mailutskick har loggats än.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations på IFYLLD vy', async ({ page }) => {
    await mockMailLog(page, [
      row({ utskicksNamn: 'Vårnyhetsbrev', oppningsgrad: 0.5 }),
      row({ utskicksNamn: 'Inga skickade', antalSkickade: 0, oppningsgrad: null }),
    ]);
    await page.goto('/mer/maillogg');
    await expect(page.getByRole('heading', { level: 1, name: 'Maillogg' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
