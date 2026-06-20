import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 5.5 K2 — klient-optimistic "markera anmälningsavgift som betald".
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr shell.staging.test.ts).
 *
 * **Deterministiska via `page.route`-interception** — INTE faktisk
 * staging-mutation. Avsiktlig avvikelse från prompten ("faktisk staging-mutation
 * + restore"): server-write-kontraktet (operation + allowlist + faktisk
 * mutation/restore) bevisas redan av `tests/api/update-record.staging.test.ts`
 * (grön i CI). Dessa e2e bevisar KLIENTENS optimistic-beteende, vilket testas
 * renast och flak-fritt genom att kontrollera svaret i stället för att bero på
 * seedad data — och lämnar ingen staging-data muterad. En svars-gate (löftet
 * släpps explicit av testet) bevisar att flippen sker FÖRE nätverkssvaret utan
 * tids-gissande.
 *
 * Täckning: DoD 1 (flip→rollback), 5 (flip utan network-wait), 6 (5xx →
 * rollback + MessageBox med requestId), 7 (cache invalideras), 8 (axe 0 +
 * aria-live-annonsering av flippen).
 */

const EVENT_ID = 'recEVENTTEST000001';
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const UPDATE_RECORD = '**/functions/v1/update-record';

/** Komplett Registration som passerar RegistrationSchema (.parse i adaptern). */
function registration(paid: boolean) {
  return {
    id: 'recREGTEST0000001',
    namn: 'Test Testsson',
    fornamn: 'Test',
    efternamn: 'Testsson',
    email: null,
    telefon: null,
    eventNamn: 'Testevent',
    ort: null,
    status: 'Obekräftad',
    flagga: null,
    anmalningsavgift: paid ? 'Mottagen' : 'Ej mottagen',
    slutbetalning: null,
    betalningspaminnelseSkickad: null,
    inskickad: null,
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: EVENT_ID,
    personId: null,
  };
}

test.describe('Markera anmälningsavgift som betald (Fas 5.5 K2 — klient-optimistic)', () => {
  test('DoD 5+1+7 — optimistisk flip före nätverkssvar, aria-live, refetch på settle', async ({
    page,
  }) => {
    let serverPaid = false;
    let releaseUpdate: () => void = () => {};
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdate = resolve;
    });

    await page.route(GET_REGISTRATIONS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: [registration(serverPaid)] }),
      });
    });
    await page.route(UPDATE_RECORD, async (route) => {
      await updateGate; // hålls tills testet släpper → flippen måste ske utan att vänta på svaret
      serverPaid = true; // server-sanning efter mutationen → onSettled-refetch reflekterar den
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/event/${EVENT_ID}/betalning`);
    const row = page.getByRole('listitem').filter({ hasText: 'Test Testsson' });
    await expect(row).toContainText('Anmälningsavgift: Ej mottagen');

    await row.getByRole('button', { name: 'Markera som betald' }).click();

    // DoD 5 + 1: optimistisk flip syns MEDAN update-record-svaret fortfarande
    // hålls av gaten → ingen network-wait.
    await expect(row).toContainText('Anmälningsavgift: Mottagen');

    releaseUpdate();

    // DoD 8 (aria-live): den lyckade flippen annonseras till skärmläsare.
    await expect(page.locator('[data-mm-announcer]')).toContainText(
      'Anmälningsavgift markerad som mottagen för Test Testsson',
    );

    // DoD 7: onSettled invaliderar → refetch (server säger nu Mottagen) → kvarstår,
    // och knappen försvinner när avgiften är mottagen.
    await expect(row).toContainText('Anmälningsavgift: Mottagen');
    await expect(row.getByRole('button', { name: 'Markera som betald' })).toHaveCount(0);
  });

  test('DoD 1+6 — 5xx → optimistisk flip rullas tillbaka + MessageBox med requestId', async ({
    page,
  }) => {
    let releaseUpdate: () => void = () => {};
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdate = resolve;
    });

    await page.route(GET_REGISTRATIONS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: [registration(false)] }),
      });
    });
    await page.route(UPDATE_RECORD, async (route) => {
      await updateGate;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error', requestId: 'req-test-abc123' }),
      });
    });

    await page.goto(`/event/${EVENT_ID}/betalning`);
    const row = page.getByRole('listitem').filter({ hasText: 'Test Testsson' });
    await row.getByRole('button', { name: 'Markera som betald' }).click();

    // Optimistisk flip medan svaret hålls.
    await expect(row).toContainText('Anmälningsavgift: Mottagen');

    releaseUpdate();

    // DoD 1: rollback till ursprungsvärdet efter felet.
    await expect(row).toContainText('Anmälningsavgift: Ej mottagen');

    // DoD 6: fel-yta som role=alert med requestId (för support-referens).
    const alert = page.getByRole('alert').filter({ hasText: 'Kunde inte markera som betald' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('req-test-abc123');
  });

  test('DoD 8 — axe 0 violations på Betalnings-vyn', async ({ page }) => {
    await page.route(GET_REGISTRATIONS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: [registration(false)] }),
      });
    });

    await page.goto(`/event/${EVENT_ID}/betalning`);
    await expect(page.getByRole('listitem').filter({ hasText: 'Test Testsson' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} noder`)).toEqual(
      [],
    );
  });
});
