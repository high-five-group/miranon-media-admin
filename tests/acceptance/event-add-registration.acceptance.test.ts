import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * Fas 6c L4 — "Lägg till anmälan"-modalen (create-registration via formulär).
 *
 * ACCEPTANCE-KLASSEN (task-59.6, ADR-080): filen flyttades hit ur e2e-sviten med
 * hela sitt bevisinnehåll intakt — a11y-assertionen inkluderad. Klassningen är
 * HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 11 restanrop,
 * samtliga typsnitt, noll skarpa.
 *
 * **Deterministisk via `network.use()`** — inte `page.route`: page-routes prövas
 * FÖRE MSW:s context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstren byggs med `EF(namn)`
 * ur handlers-modulen och svaren med `json(...)`, aldrig som handskrivna strängar
 * — en överskuggning vars mönster inte matchar faller igenom UTAN att något fälls
 * (den tysta fällan, `hermetic.ts` § Överskugga en delad handler). VERBEN ÄR
 * VERIFIERADE mot appens anropsväg, inte antagna: `get-registrations` går via
 * `callEdgeFunction` (GET), `create-registration` via `postEdgeFunction` (POST).
 *
 * get-registrations (roster) mockas STATEFULLT (1 rad → 2 rader efter create).
 *
 * `create-registration` SKRIVER INTE SKARPT: anropet är avlyssnat av fixturvärlden,
 * och det som bevisas är klientflödet (fyll → submit → roster-refetch → modal
 * stänger) plus gränssnittets reaktion på 409. Server-write-kontraktet bevisas i
 * API-sviten och ligger kvar där (`tests/api/create-registration.staging.test.ts`
 * — INTE i denna diff). Handlern är AVSIKTLIGT inte i normalläget: en delad
 * skrivväg hade gjort tyst lyckad mutation till default för hela klassen — här
 * överskuggas den per test, och ett test som skapar utan överskuggning fälls av
 * hermetik-vakten.
 *
 * Täckning (DoD): öppna formulär, fyll, submit→201 (roster uppdateras + modal stänger),
 * 409-väg (inline-fel, modal kvar), required-validering (e-post), fokus-hantering
 * (autoFocus in + retur-fokus till triggern vid Escape), aria-live submit-state, axe 0.
 */

const EVENT_ID = 'recADDREG00000001';

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type Row = z.infer<typeof RegistrationSchema>;

function row(overrides: Partial<Row> = {}): Row {
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

function mockEndpoints(
  network: NetworkFixture,
  { createStatus = 201 }: { createStatus?: number } = {},
) {
  let created = false;

  network.use(
    http.get(EF('get-registrations'), () =>
      json({
        registrations: created
          ? [row({ namn: 'Anna Andersson' }), NY_ROW]
          : [row({ namn: 'Anna Andersson' })],
      }),
    ),
    http.post(EF('create-registration'), () => {
      if (createStatus === 201) {
        created = true;
        return json({ registration: NY_ROW, record: { id: NY_ROW.id, fields: {} } }, 201);
      }
      return json(
        {
          error: 'Personen är redan anmäld till eventet',
          existingName: 'Ny Person',
          requestId: 'req_test_409',
        },
        createStatus,
      );
    }),
  );
}

test.describe('Lägg till anmälan-modal (Fas 6c L4)', () => {
  test('öppna → fyll → submit 201 → roster uppdateras + modal stänger', async ({
    page,
    network,
  }) => {
    mockEndpoints(network, { createStatus: 201 });
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

  test('409 (dubblett) → inline-fel, modalen stannar öppen', async ({ page, network }) => {
    mockEndpoints(network, { createStatus: 409 });
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

  test('required-validering: tom e-post → fält-fel, ingen submit', async ({ page, network }) => {
    mockEndpoints(network, { createStatus: 201 });
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
    network,
  }) => {
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/anmalda`);

    const trigger = page.getByRole('button', { name: 'Lägg till anmälan' });
    await trigger.click();
    await expect(page.getByLabel('Förnamn')).toBeFocused(); // autoFocus in i modalen

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(trigger).toBeFocused(); // fokus-retur till triggern (React Aria)
  });

  test('axe 0 violations på den öppna modalen', async ({ page, network }) => {
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/anmalda`);
    await page.getByRole('button', { name: 'Lägg till anmälan' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
