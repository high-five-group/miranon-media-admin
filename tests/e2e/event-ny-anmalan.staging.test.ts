import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * task-18.12 — den SKARPA manuell anmälan-sidan (ManuellAnmalanForm), som ersätter
 * prototyp-grenen på /event/$eventId/ny-anmalan.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt). DETERMINISTISK via `page.route`:
 * get-event (kontextraden) och create-registration (201 / 409) mockas. Inga skarpa
 * staging-skrivningar i e2e — server-write-kontraktet (Källa=Manuell, EventKey/Event
 * server-side, Antal platser + Notering) bevisas av
 * tests/api/create-registration.staging.test.ts.
 *
 * Täckning (facit + DoD): renderar per facit (formklassen + sex fält), fyll →
 * submit 201 → bekräftelseläge (POST bär antalPlatser + notering), 409-väg
 * (inline-fel, formuläret kvar), required-validering (e-post), axe 0.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const CREATE_REGISTRATION = /\/functions\/v1\/create-registration/;
const EVENT_ID = 'recNYANM0000001';

type Row = Record<string, unknown>;

function eventRow(overrides: Row = {}): Row {
  return {
    id: EVENT_ID,
    eventlabel: 'RIM 1 (e2e)',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-07-31',
    slutdatum: '2026-08-01',
    tidKvarTillEvent: '1 vecka',
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 0.67,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 5,
    antalSlutbetalningar: 2,
    antalSlutbetalningFelande: 6,
    status: 'Planerat',
    eventKey: 'Event-21',
    ...overrides,
  };
}

function registrationRow(overrides: Row = {}): Row {
  return {
    id: 'recANMSKAPAD0001',
    namn: 'Ny Manuell',
    fornamn: 'Ny',
    efternamn: 'Manuell',
    email: 'ny@example.se',
    telefon: null,
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Obekräftad',
    flagga: null,
    anmalningsavgift: null,
    slutbetalning: null,
    betalningspaminnelseSkickad: null,
    inskickad: '2026-07-23T09:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 3,
    notering: 'Ringde in — betalar via faktura.',
    eventId: EVENT_ID,
    personId: null,
    ...overrides,
  };
}

interface CreateMock {
  createStatus?: number;
}

async function mockEndpoints(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  { createStatus = 201 }: CreateMock = {},
): Promise<() => Record<string, unknown> | null> {
  let lastCreateBody: Record<string, unknown> | null = null;

  await page.route(GET_EVENT, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: eventRow() }),
    });
  });

  await page.route(
    CREATE_REGISTRATION,
    async (route: {
      fulfill: (r: unknown) => Promise<void>;
      request: () => { postDataJSON: () => Record<string, unknown> };
    }) => {
      lastCreateBody = route.request().postDataJSON();
      if (createStatus === 201) {
        const created = registrationRow();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ registration: created, record: { id: created.id, fields: {} } }),
        });
      } else {
        await route.fulfill({
          status: createStatus,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Personen är redan anmäld till eventet',
            existingName: 'Ny Manuell',
            requestId: 'req_test_409',
          }),
        });
      }
    },
  );

  return () => lastCreateBody;
}

test.describe('Manuell anmälan-sidan — skarp (task-18.12)', () => {
  test('renderar per facit: formklassen + sex fält + kontextrad', async ({ page }) => {
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    // h1 = sidrubriken (fokuserad efter mount).
    const heading = page.getByRole('heading', { level: 1, name: 'Lägg till manuell anmälan' });
    await expect(heading).toBeVisible();

    // Kontextraden: vilket event anmälan gäller (get-event-mocken).
    await expect(page.getByText('RIM 1 (e2e)')).toBeVisible();

    // Chevron tillbaka till eventet.
    const back = page.getByRole('link', { name: 'Tillbaka till eventet' });
    await expect(back).toHaveAttribute('href', `/event/${EVENT_ID}`);

    // Grupprubrikerna (DetaljGrupp).
    await expect(page.getByRole('heading', { level: 2, name: 'Deltagare' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Anmälan' })).toBeVisible();

    // Facit-formens sex fält.
    await expect(page.getByLabel('Förnamn (obligatorisk)')).toBeVisible();
    await expect(page.getByLabel('Efternamn (obligatorisk)')).toBeVisible();
    await expect(page.getByLabel('E-post (obligatorisk)')).toBeVisible();
    await expect(page.getByLabel('Mobilnummer')).toBeVisible();
    await expect(page.getByLabel('Antal platser')).toBeVisible();
    await expect(page.getByLabel('Notering')).toBeVisible();

    // Knappraden: primär först.
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Avbryt' })).toBeVisible();
  });

  test('fyll → submit 201 → bekräftelseläge (POST bär antalPlatser + notering)', async ({
    page,
  }) => {
    const getBody = await mockEndpoints(page, { createStatus: 201 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn (obligatorisk)').fill('Ny');
    await page.getByLabel('Efternamn (obligatorisk)').fill('Manuell');
    await page.getByLabel('E-post (obligatorisk)').fill('ny@example.se');
    await page.getByLabel('Mobilnummer').fill('070-1234567');
    // Antal platser: default 1 → öka till 3 via stepparen (RAC NumberField).
    await page.getByRole('button', { name: 'Öka' }).click();
    await page.getByRole('button', { name: 'Öka' }).click();
    await page.getByLabel('Notering').fill('Ringde in — betalar via faktura.');

    await page.getByRole('button', { name: 'Spara anmälan' }).click();

    // Bekräftelseläget ersätter formuläret.
    await expect(page.getByRole('heading', { level: 2, name: 'Deltagare' })).toBeHidden();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();
    await expect(page.getByText('Anmälan sparad')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tillbaka till eventet' })).toBeVisible();

    // POST-kroppen bar de nya fälten (Källa/EventKey/Event sätts server-side, ej i kroppen).
    const body = getBody();
    expect(body?.fornamn).toBe('Ny');
    expect(body?.efternamn).toBe('Manuell');
    expect(body?.email).toBe('ny@example.se');
    expect(body?.antalPlatser).toBe(3);
    expect(body?.notering).toBe('Ringde in — betalar via faktura.');
    expect(typeof body?.idempotencyKey).toBe('string');
  });

  test('409 (dubblett) → inline-fel, formuläret kvar', async ({ page }) => {
    await mockEndpoints(page, { createStatus: 409 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn (obligatorisk)').fill('Ny');
    await page.getByLabel('Efternamn (obligatorisk)').fill('Manuell');
    await page.getByLabel('E-post (obligatorisk)').fill('ny@example.se');
    await page.getByRole('button', { name: 'Spara anmälan' }).click();

    await expect(page.getByRole('alert')).toContainText('redan anmäld');
    // Formuläret kvar (ingen bekräftelse).
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toBeVisible();
    await expect(page.getByTestId('bekraftelse')).toBeHidden();
  });

  test('required-validering: tom e-post → fält-fel, ingen submit', async ({ page }) => {
    const getBody = await mockEndpoints(page, { createStatus: 201 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn (obligatorisk)').fill('Ny');
    await page.getByLabel('Efternamn (obligatorisk)').fill('Manuell');
    // E-post lämnas tom.
    await page.getByRole('button', { name: 'Spara anmälan' }).click();

    await expect(page.getByText('Fyll i en giltig e-postadress')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toBeVisible();
    // create-registration aldrig nådd.
    expect(getBody()).toBeNull();
  });

  test('axe 0 violations på den skarpa formen', async ({ page }) => {
    await mockEndpoints(page);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Lägg till manuell anmälan' }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
