import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6b L3 — Närvaro-vy (sessions-grupperad LÄS-vy via get-attendance).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr event-detail.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av get-attendance. Regex-matchare
 * (`/get-attendance\?/`) som INTE kolliderar med andra mocks: `get-attendance`
 * är unikt (ingen substräng-krock med get-event/get-events/get-person). Mocken
 * speglar EF-svaret `{ attendance: [...] }` (AttendanceSchema-rader, INKL. personNamn).
 *
 * Täckning: sessions-gruppering i fast ordning, närvarande-räkning (lynchpin
 * Närvarande+Deltog online), "Ej avstämt"-kommande-event (förväntat, ej fel),
 * tom-state, fel (role=alert), läsbart personNamn (aldrig rec-ID), fokus→<h1> +
 * aria-live, loading aria-busy, axe 0. LÄS-vy → INGEN markera-knapp.
 */

const GET_ATTENDANCE = /\/functions\/v1\/get-attendance\?/;
const EVENT_ID = 'recNARVARO0000001';

type Row = Record<string, unknown>;

/** En komplett Attendance-rad (EF-svarets form, AttendanceSchema). */
function row(overrides: Row = {}): Row {
  return {
    id: `recATT${Math.random().toString(36).slice(2, 10)}`,
    anmalanId: 'recANM0000000001',
    eventId: EVENT_ID,
    personId: 'recPER0000000001',
    personNamn: 'Anna Andersson',
    session: 'Dag 1',
    status: 'Närvarande',
    noteringar: null,
    avstamt: '2026-05-02T10:00:00.000Z',
    ...overrides,
  };
}

async function mockAttendance(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  rows: Row[],
  { status = 200, delayMs = 0 }: { status?: number; delayMs?: number } = {},
) {
  await page.route(GET_ATTENDANCE, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: status === 200 ? JSON.stringify({ attendance: rows }) : JSON.stringify({ error: 'x' }),
    });
  });
}

test.describe('Närvaro-vy (Fas 6b L3 — sessions-grupperad LÄS-vy)', () => {
  test('sessions-gruppering + närvarande-räkning; fokus → <h1>', async ({ page }) => {
    await mockAttendance(page, [
      row({ personNamn: 'Anna Andersson', session: 'Dag 1', status: 'Närvarande' }),
      row({ personNamn: 'Bo Bengtsson', session: 'Dag 1', status: 'Frånvarande' }),
      row({ personNamn: 'Cecilia Carlsson', session: 'Dag 1', status: 'Deltog online' }),
      row({ personNamn: 'Anna Andersson', session: 'Dag 2', status: 'Närvarande' }),
    ]);
    await page.goto(`/event/${EVENT_ID}/narvaro`);

    // <h1> = "Närvaro", fokuserad efter async-laddning.
    const heading = page.getByRole('heading', { level: 1, name: 'Närvaro' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att närvaron anlänt.
    await expect(page.getByText('Närvaro laddad.')).toHaveCount(1);

    // Två sessions-grupper (Dag 1, Dag 2) som h2-rubriker.
    await expect(page.getByRole('heading', { level: 2, name: 'Dag 1' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Dag 2' })).toBeVisible();

    // Dag 1: Närvarande + Deltog online = 2 av 3 (lynchpin-mängden).
    await expect(page.getByText('2 av 3 närvarande')).toBeVisible();
    // Dag 2: 1 av 1.
    await expect(page.getByText('1 av 1 närvarande')).toBeVisible();

    // Person-NAMN syns (aldrig record-ID), status som TEXT.
    await expect(page.getByText('Anna Andersson').first()).toBeVisible();
    await expect(page.getByText('Frånvarande')).toBeVisible();
    await expect(page.getByText('Deltog online')).toBeVisible();

    // LÄS-vy: ingen markera-/spara-närvarande-kontroll finns (write = framtida slice).
    // Namn-scopad (ej total button-count) så app-skalets chrome ej ger falskt negativ.
    await expect(
      page.getByRole('button', { name: /markera|spara|närvar|ändra|avstäm/i }),
    ).toHaveCount(0);

    // Tillbaka-länk → info-vyn.
    await expect(page.getByRole('link', { name: '← Tillbaka till eventet' })).toHaveAttribute(
      'href',
      `/event/${EVENT_ID}`,
    );
  });

  test('endast vissa sessioner: bara Föreläsning renderas (ingen tom Dag 1/Dag 2)', async ({
    page,
  }) => {
    await mockAttendance(page, [
      row({ personNamn: 'Doris Dahl', session: 'Föreläsning', status: 'Närvarande' }),
    ]);
    await page.goto(`/event/${EVENT_ID}/narvaro`);

    await expect(page.getByRole('heading', { level: 2, name: 'Föreläsning' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Dag 1' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Dag 2' })).toHaveCount(0);
  });

  test('kommande event: allt "Ej avstämt" → visas rakt av, ingen varnings-/fel-yta', async ({
    page,
  }) => {
    await mockAttendance(page, [
      row({ personNamn: 'Erik Ek', session: 'Dag 1', status: 'Ej avstämt' }),
      row({ personNamn: 'Frida Falk', session: 'Dag 1', status: 'Ej avstämt' }),
    ]);
    await page.goto(`/event/${EVENT_ID}/narvaro`);

    // 0 av 2 närvarande — förväntat tillstånd för kommande event, ej fel.
    await expect(page.getByText('0 av 2 närvarande')).toBeVisible();
    await expect(page.getByText('Ej avstämt').first()).toBeVisible();
    // INGEN fel-yta (role=alert) för "Ej avstämt".
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('tomt event (inga deltaganden) → vänlig tom-text, ej fel', async ({ page }) => {
    await mockAttendance(page, []);
    await page.goto(`/event/${EVENT_ID}/narvaro`);

    await expect(page.getByRole('heading', { level: 1, name: 'Närvaro' })).toBeVisible();
    await expect(
      page.getByText('Inga deltaganden registrerade för det här eventet än.'),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('personNamn null → "Namn saknas" (graciöst), aldrig krasch/tomt', async ({ page }) => {
    await mockAttendance(page, [row({ personNamn: null, session: 'Dag 1', status: 'Närvarande' })]);
    await page.goto(`/event/${EVENT_ID}/narvaro`);
    await expect(page.getByText('Namn saknas')).toBeVisible();
  });

  test('fel (icke-2xx) → fel-UI via role=alert', async ({ page }) => {
    await mockAttendance(page, [], { status: 404 });
    await page.goto(`/event/${EVENT_ID}/narvaro`);
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta närvaron');
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page }) => {
    await mockAttendance(page, [row()], { delayMs: 500 });
    await page.goto(`/event/${EVENT_ID}/narvaro`);
    await expect(page.getByText('Laddar närvaro…')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Närvaro' })).toBeVisible();
  });

  test('axe 0 violations på den renderade närvaro-vyn', async ({ page }) => {
    await mockAttendance(page, [
      row({ personNamn: 'Anna Andersson', session: 'Dag 1', status: 'Närvarande' }),
      row({ personNamn: 'Bo Bengtsson', session: 'Föreläsning', status: 'Ej avstämt' }),
    ]);
    await page.goto(`/event/${EVENT_ID}/narvaro`);
    await expect(page.getByRole('heading', { level: 1, name: 'Närvaro' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
