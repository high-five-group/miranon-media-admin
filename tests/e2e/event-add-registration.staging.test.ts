import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6c L4 — "Lägg till anmälan"-modalen (create-registration via formulär).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt). DETERMINISTISK via `page.route`:
 * get-registrations (roster) mockas STATEFULLT (1 rad → 2 rader efter create) och
 * create-registration mockas (201 / 409). Inga skarpa staging-skrivningar i e2e —
 * server-write-kontraktet bevisas separat av tests/api/create-registration.staging.test.ts.
 *
 * Täckning (DoD): öppna formulär, fyll, submit→201 (roster uppdateras + modal stänger),
 * 409-väg (inline-fel, modal kvar), required-validering (e-post), fokus-hantering
 * (autoFocus in + retur-fokus till triggern vid Escape), aria-live submit-state, axe 0.
 */

const GET_REGISTRATIONS = /\/functions\/v1\/get-registrations\?/;
const CREATE_REGISTRATION = /\/functions\/v1\/create-registration/;
const EVENT_ID = 'recADDREG00000001';

type Row = Record<string, unknown>;

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

const NY_ROW = row({
  namn: 'Ny Person',
  fornamn: 'Ny',
  efternamn: 'Person',
  email: 'ny@example.se',
  status: 'Obekräftad',
  personId: null,
});

async function mockEndpoints(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  { createStatus = 201 }: { createStatus?: number } = {},
) {
  let created = false;

  await page.route(GET_REGISTRATIONS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    const rows = created
      ? [row({ namn: 'Anna Andersson' }), NY_ROW]
      : [row({ namn: 'Anna Andersson' })];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: rows }),
    });
  });

  await page.route(
    CREATE_REGISTRATION,
    async (route: { fulfill: (r: unknown) => Promise<void> }) => {
      if (createStatus === 201) {
        created = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ registration: NY_ROW, record: { id: NY_ROW.id, fields: {} } }),
        });
      } else {
        await route.fulfill({
          status: createStatus,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Personen är redan anmäld till eventet',
            existingName: 'Ny Person',
            requestId: 'req_test_409',
          }),
        });
      }
    },
  );
}

test.describe('Lägg till anmälan-modal (Fas 6c L4)', () => {
  test('öppna → fyll → submit 201 → roster uppdateras + modal stänger', async ({ page }) => {
    await mockEndpoints(page, { createStatus: 201 });
    await page.goto(`/event/${EVENT_ID}/anmalda`);
    await expect(page.getByRole('heading', { level: 1, name: 'Anmälda' })).toBeVisible();

    await page.getByRole('button', { name: 'Lägg till anmälan' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.getByLabel('Förnamn').fill('Ny');
    await page.getByLabel('Efternamn').fill('Person');
    await page.getByLabel('E-post').fill('ny@example.se');
    await page.getByRole('button', { name: 'Skapa anmälan' }).click();

    // Modalen stänger och rostern refetchar → nya raden syns. `exact: true` på
    // namnet: aria-live-annonsen ("Anmälan skapad för Ny Person") innehåller också
    // delsträngen → exakt-match isolerar roster-radens span. E-posten är unik för rostern.
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Ny Person', { exact: true })).toBeVisible();
    await expect(page.getByText('ny@example.se')).toBeVisible();
    await expect(page.getByText('2 anmälda')).toBeVisible();
  });

  test('409 (dubblett) → inline-fel, modalen stannar öppen', async ({ page }) => {
    await mockEndpoints(page, { createStatus: 409 });
    await page.goto(`/event/${EVENT_ID}/anmalda`);

    await page.getByRole('button', { name: 'Lägg till anmälan' }).click();
    await page.getByLabel('Förnamn').fill('Ny');
    await page.getByLabel('Efternamn').fill('Person');
    await page.getByLabel('E-post').fill('ny@example.se');
    await page.getByRole('button', { name: 'Skapa anmälan' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible(); // kvar öppen
    await expect(dialog.getByRole('alert')).toContainText('redan anmäld');
  });

  test('required-validering: tom e-post → fält-fel, ingen submit', async ({ page }) => {
    await mockEndpoints(page, { createStatus: 201 });
    await page.goto(`/event/${EVENT_ID}/anmalda`);

    await page.getByRole('button', { name: 'Lägg till anmälan' }).click();
    await page.getByLabel('Förnamn').fill('Ny');
    await page.getByLabel('Efternamn').fill('Person');
    // E-post lämnas tom.
    await page.getByRole('button', { name: 'Skapa anmälan' }).click();

    // Fält-fel visas; modalen kvar (ingen 201-stängning) — create-mock aldrig nådd.
    await expect(page.getByText('E-post får inte vara tom.')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('E-post')).toBeFocused();
  });

  test('fokus-hantering: öppna → fält fokuserat; Escape → retur-fokus till triggern', async ({
    page,
  }) => {
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/anmalda`);

    const trigger = page.getByRole('button', { name: 'Lägg till anmälan' });
    await trigger.click();
    await expect(page.getByLabel('Förnamn')).toBeFocused(); // autoFocus in i modalen

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(trigger).toBeFocused(); // fokus-retur till triggern (React Aria)
  });

  test('axe 0 violations på den öppna modalen', async ({ page }) => {
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/anmalda`);
    await page.getByRole('button', { name: 'Lägg till anmälan' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
