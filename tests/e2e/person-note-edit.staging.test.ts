import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6a L6c — klient edit-in-place för `Personer.Anteckningar` (optimistisk).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr mark-paid.staging.test.ts).
 *
 * **Deterministiska via `page.route`-interception** — INTE faktisk
 * staging-mutation. Server-write-kontraktet (operation + allowlist + faktisk
 * mutation/restore) bevisas redan av `tests/api/update-record.staging.test.ts`
 * (grön i CI mot staging-v5). Dessa e2e bevisar KLIENTENS optimistic-beteende:
 * flip utan network-wait, rollback + fel-yta vid 5xx, avbryt utan mutation, axe
 * 0 i både read- och edit-läge. En svars-gate (löftet släpps explicit) bevisar
 * att flippen sker FÖRE nätverkssvaret utan tids-gissande.
 */

const GET_PERSON = /\/functions\/v1\/get-person\?/;
const UPDATE_RECORD = '**/functions/v1/update-record';
const PERSON_ID = 'recNOTEEDIT000001';

type PersonDetailMock = Record<string, unknown>;

/** Komplett PersonDetail som passerar PersonDetailSchema (.parse i adaptern). */
function personDetail(anteckningar: string | null): PersonDetailMock {
  return {
    id: PERSON_ID,
    namn: 'Nora Notesson',
    fornamn: 'Nora',
    efternamn: 'Notesson',
    email: 'nora@example.test',
    telefon: null,
    ort: ['Skövde'],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar,
    antalAnmalningar: 1,
    antalDeltaganden: 1,
    erfarenhetsniva: null,
    erfarenhetsbadge: null,
    senasteInteraktion: null,
    senasteInteraktionDatum: null,
    dagarSedanSenaste: null,
    harAktivAnmalan: null,
    ejGodkandMail: false,
    radSkapad: '2026-01-01T00:00:00.000Z',
    anmalningIds: ['recANM0000000001'],
    deltagandeIds: ['recDLT0000000001'],
    aterkommande: 'Nej',
    nastaEvent: null,
    antalGenomfordaEvent: 1,
    senasteDeltagandeDatum: '2026-01-15',
    antalHamtningar: 0,
    allaHamtningar: [],
    motivering: null,
    inbjudenCommunity: false,
    skapatKontoCommunity: false,
    historik: [],
  };
}

test.describe('Persondetalj — edit-in-place Anteckningar (Fas 6a L6c)', () => {
  test('optimistisk flip: Spara → read-vyn visar nya noten utan network-wait', async ({ page }) => {
    let serverNote = 'Ursprunglig not';
    let releaseUpdate: () => void = () => {};
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdate = resolve;
    });

    await page.route(GET_PERSON, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ person: personDetail(serverNote) }),
      });
    });
    await page.route(UPDATE_RECORD, async (route) => {
      await updateGate; // hålls → flippen måste ske utan att vänta på svaret
      serverNote = 'Ny anteckning'; // server-sanning efter mutationen (onSettled-refetch)
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/personer/${PERSON_ID}`);
    await expect(page.getByText('Ursprunglig not')).toBeVisible();

    await page.getByRole('button', { name: 'Redigera' }).click();
    const textarea = page.getByRole('textbox', { name: 'Anteckning' });
    await expect(textarea).toBeFocused(); // fokus → textarea vid edit-start
    await textarea.fill('Ny anteckning');
    await page.getByRole('button', { name: 'Spara' }).click();

    // Optimistisk flip MEDAN update-record-svaret hålls av gaten → ingen
    // network-wait. Read-vyn (cache-värdet) visar nya noten, textarean borta.
    await expect(page.getByText('Ny anteckning')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Anteckning' })).toHaveCount(0);

    releaseUpdate();

    // aria-live: den lyckade sparningen annonseras.
    await expect(page.locator('[data-mm-announcer]')).toContainText('Anteckning sparad');
    // onSettled invaliderar → refetch (server säger nu 'Ny anteckning') → kvarstår.
    await expect(page.getByText('Ny anteckning')).toBeVisible();
    // Fokus-retur (WCAG) → "Redigera"-knappen.
    await expect(page.getByRole('button', { name: 'Redigera' })).toBeFocused();
  });

  test('rollback: 5xx → noten återgår + MessageBox role=alert + edit-läget kvar med input', async ({
    page,
  }) => {
    const serverNote = 'Ursprunglig not';
    let releaseUpdate: () => void = () => {};
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdate = resolve;
    });

    await page.route(GET_PERSON, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ person: personDetail(serverNote) }),
      });
    });
    await page.route(UPDATE_RECORD, async (route) => {
      await updateGate;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error', requestId: 'req-note-xyz789' }),
      });
    });

    await page.goto(`/personer/${PERSON_ID}`);
    await page.getByRole('button', { name: 'Redigera' }).click();
    await page.getByRole('textbox', { name: 'Anteckning' }).fill('Misslyckad ändring');
    await page.getByRole('button', { name: 'Spara' }).click();

    // Optimistisk flip medan svaret hålls.
    await expect(page.getByText('Misslyckad ändring')).toBeVisible();

    releaseUpdate();

    // Fel → edit-läget kvar med användarens text bevarad (ingen input tappad).
    const textarea = page.getByRole('textbox', { name: 'Anteckning' });
    await expect(textarea).toHaveValue('Misslyckad ändring');
    // Fel-yta som role=alert med Fel-ID (support-referens).
    const alert = page.getByRole('alert').filter({ hasText: 'Kunde inte spara anteckningen' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('req-note-xyz789');
    // textarean är kopplad till fel-ytan + markerad ogiltig.
    await expect(textarea).toHaveAttribute('aria-invalid', 'true');

    // Avbryt → rollback bevisad: read-vyn visar ORIGINALET (ej den misslyckade).
    await page.getByRole('button', { name: 'Avbryt' }).click();
    await expect(page.getByText('Ursprunglig not')).toBeVisible();
    await expect(page.getByText('Misslyckad ändring')).toHaveCount(0);
  });

  test('avbryt (Esc): ingen mutation, originalet kvar', async ({ page }) => {
    let updateCalled = false;

    await page.route(GET_PERSON, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ person: personDetail('Ursprunglig not') }),
      });
    });
    await page.route(UPDATE_RECORD, async (route) => {
      updateCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/personer/${PERSON_ID}`);
    await page.getByRole('button', { name: 'Redigera' }).click();
    const textarea = page.getByRole('textbox', { name: 'Anteckning' });
    await textarea.fill('Ändring som ångras');
    await textarea.press('Escape');

    // Tillbaka i read-vyn med originalet; ingen write skickad; fokus → knappen.
    await expect(page.getByText('Ursprunglig not')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Anteckning' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Redigera' })).toBeFocused();
    expect(updateCalled).toBe(false);
  });

  test('axe 0 violations — read-läge OCH edit-läge', async ({ page }) => {
    await page.route(GET_PERSON, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ person: personDetail('Ursprunglig not') }),
      });
    });

    await page.goto(`/personer/${PERSON_ID}`);
    await expect(page.getByText('Ursprunglig not')).toBeVisible();

    const readResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(readResults.violations).toEqual([]);

    // Edit-läget: textarea + Spara/Avbryt + label.
    await page.getByRole('button', { name: 'Redigera' }).click();
    await expect(page.getByRole('textbox', { name: 'Anteckning' })).toBeVisible();

    const editResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(editResults.violations).toEqual([]);
  });
});
