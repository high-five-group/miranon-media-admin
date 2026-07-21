import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6c L2 — Anmälda-vy (LÄS-vy via get-registrations, eventId-grenen, T15 väg D).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr event-narvaro.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av get-registrations. Regex-matchare
 * (`/get-registrations\?/`) som INTE kolliderar med andra mocks: `get-registrations`
 * är unikt (ingen substräng-krock med get-event/get-events/get-person/get-attendance).
 * Mocken speglar EF-svaret `{ registrations: [...] }` (RegistrationSchema-rader).
 *
 * Täckning: roster-rendering (namn + status-text + ort + antal + inskickad + kontakt),
 * antal-summa, fokus→<h1> + aria-live, tom-state, fel (role=alert), loading aria-busy,
 * namn-fallback ("Namn saknas"), axe 0. LÄS-vy → INGEN markera-betald-knapp.
 */

const GET_REGISTRATIONS = /\/functions\/v1\/get-registrations\?/;
const EVENT_ID = 'recANMALDA0000001';

type Row = Record<string, unknown>;

/** En komplett Registration-rad (EF-svarets form, RegistrationSchema). */
function row(overrides: Row = {}): Row {
  return {
    id: `recANM${Math.random().toString(36).slice(2, 10)}`,
    namn: 'Anna Andersson',
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1234567',
    eventNamn: 'Testevent',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: 'Mottagen',
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-05-02T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: EVENT_ID,
    personId: 'recPER0000000001',
    ...overrides,
  };
}

async function mockRegistrations(
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
  await page.route(GET_REGISTRATIONS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    if (gate) await gate;
    else if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status,
      contentType: 'application/json',
      body:
        status === 200 ? JSON.stringify({ registrations: rows }) : JSON.stringify({ error: 'x' }),
    });
  });
  return release;
}

test.describe('Anmälda-vy (Fas 6c L2 — LÄS-vy via get-registrations)', () => {
  test('roster renderas (namn + fält) + antal-summa; fokus → <h1>', async ({ page }) => {
    await mockRegistrations(page, [
      row({
        namn: 'Anna Andersson',
        ort: 'Skövde',
        status: 'Bekräftad (mail skickat)',
        email: 'anna@example.se',
      }),
      row({
        namn: 'Bo Bengtsson',
        ort: 'Skara',
        status: 'Obekräftad',
        antalPlatser: 2,
        email: 'bo@example.se',
      }),
    ]);
    await page.goto(`/event/${EVENT_ID}/anmalda`);

    // <h1> = "Anmälda", fokuserad efter async-laddning.
    const heading = page.getByRole('heading', { level: 1, name: 'Anmälda' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att anmälda anlänt.
    await expect(page.getByText('Anmälda laddade.')).toHaveCount(1);

    // Antal-summa som TEXT.
    await expect(page.getByText('2 anmälda')).toBeVisible();

    // Namn (aldrig record-ID) + status som TEXT + övriga fält.
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByText('Bo Bengtsson')).toBeVisible();
    await expect(page.getByText('Bekräftad (mail skickat)')).toBeVisible();
    await expect(page.getByText('Obekräftad')).toBeVisible();
    await expect(page.getByText('Skövde')).toBeVisible();
    await expect(page.getByText('anna@example.se')).toBeVisible();
    await expect(page.getByText('bo@example.se')).toBeVisible();
    // Inskickad formaterat sv-SE (aldrig rå ISO).
    await expect(page.getByText('2026-05-02').first()).toBeVisible();

    // LÄS-vy: ingen markera-betald-/spara-kontroll (write = eventsidans
    // betalnings-arbetsyta sedan task-18.8).
    // Namn-scopad så app-skalets chrome ej ger falskt negativ.
    await expect(page.getByRole('button', { name: /markera|betald|spara|ändra/i })).toHaveCount(0);

    // Tillbaka-länk → info-vyn.
    await expect(page.getByRole('link', { name: '← Tillbaka till eventet' })).toHaveAttribute(
      'href',
      `/event/${EVENT_ID}`,
    );
  });

  test('tomt event (inga anmälda) → vänlig tom-text, ej fel', async ({ page }) => {
    await mockRegistrations(page, []);
    await page.goto(`/event/${EVENT_ID}/anmalda`);

    await expect(page.getByRole('heading', { level: 1, name: 'Anmälda' })).toBeVisible();
    await expect(page.getByText('Inga anmälda för det här eventet än.')).toBeVisible();
    await expect(page.getByText('0 anmälda')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('namn null → "Namn saknas" (graciöst), aldrig krasch/tomt', async ({ page }) => {
    await mockRegistrations(page, [row({ namn: null, fornamn: null, efternamn: null })]);
    await page.goto(`/event/${EVENT_ID}/anmalda`);
    await expect(page.getByText('Namn saknas')).toBeVisible();
  });

  test('fel (icke-2xx) → fel-UI via role=alert', async ({ page }) => {
    await mockRegistrations(page, [], { status: 404 });
    await page.goto(`/event/${EVENT_ID}/anmalda`);
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta anmälda');
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page }) => {
    // Håll EF-svaret öppet → loading-tillståndet är deterministiskt synligt medan
    // route:n hålls (ingen realtids-race mot en fast delayMs under parallell last).
    const release = await mockRegistrations(page, [row()], { manualRelease: true });
    await page.goto(`/event/${EVENT_ID}/anmalda`);
    await expect(page.getByText('Laddar anmälda…')).toBeVisible();
    // Släpp svaret → laddat tillstånd renderas.
    release();
    await expect(page.getByRole('heading', { level: 1, name: 'Anmälda' })).toBeVisible();
  });

  test('axe 0 violations på den renderade anmälda-vyn', async ({ page }) => {
    await mockRegistrations(page, [
      row({ namn: 'Anna Andersson', status: 'Bekräftad (mail skickat)' }),
      row({ namn: 'Bo Bengtsson', status: 'Obekräftad' }),
    ]);
    await page.goto(`/event/${EVENT_ID}/anmalda`);
    await expect(page.getByRole('heading', { level: 1, name: 'Anmälda' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
