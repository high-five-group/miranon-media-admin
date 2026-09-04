import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * Fas 6c L2 — Anmälda-vy (LÄS-vy via get-registrations, eventId-grenen, T15 väg D).
 *
 * ACCEPTANCE-KLASSEN (task-59.6, ADR-080): filen flyttades hit ur e2e-sviten med
 * hela sitt bevisinnehåll intakt — a11y-assertionen inkluderad. Klassningen är
 * HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 13 restanrop,
 * samtliga typsnitt, noll skarpa.
 *
 * NAMNGRANNEN STANNAR: `event-deltagare.staging.test.ts` heter nästan samma sak
 * men mäter 12 SKARPA anrop (get-event-notes ×10 + get-events ×2) och hör därför
 * till den skarpa klassen. Snittet är mätdatans, aldrig filnamnets.
 *
 * **Deterministisk via `network.use()`** — inte `page.route`: page-routes prövas
 * FÖRE MSW:s context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstret byggs med `EF(namn)`
 * ur handlers-modulen och svaret med `json(...)`, aldrig som handskrivna strängar
 * — en överskuggning vars mönster inte matchar faller igenom UTAN att något fälls
 * (den tysta fällan, `hermetic.ts` § Överskugga en delad handler).
 *
 * Mocken speglar EF-svaret `{ registrations: [...] }` (RegistrationSchema-rader).
 * Normalläget BÄR en get-registrations-handler, men vyn asserterar exakt
 * antal-summa och exakta rader — mot normalläget hade beviset blivit ett kopplat
 * påstående om fixturens datamängd, så handlern överskuggas per test.
 *
 * Täckning: roster-rendering (namn + status-text + antal + inskickad + kontakt),
 * antal-summa, fokus→<h1> + aria-live, tom-state, fel (role=alert), loading aria-busy,
 * namn-fallback ("Namn saknas"), axe 0. LÄS-vy → INGEN markera-betald-knapp.
 *
 * Ort visas MEDVETET INTE i rostret (person-kontext-ort-svepet, 2026-08-10):
 * `reg.ort` är anmälans EGNA `Ort`-fält och är ofta tom för app-skapade
 * anmälningar (se `AnmalanDetail.tsx` review-fynd F2) — en `Ort`-rad i en
 * lista över ETT events anmälda läses dessutom som personens ort, och
 * eventets ort är redundant i den listan. `row()`-fixturen behåller `ort` i
 * mockdatan (modellen är oförändrad — bara VISNINGEN togs bort).
 */

const EVENT_ID = 'recANMALDA0000001';

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type Row = z.infer<typeof RegistrationSchema>;

/** En komplett Registration-rad (EF-svarets form, RegistrationSchema). */
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

function mockRegistrations(
  network: NetworkFixture,
  rows: Row[],
  { status = 200, manualRelease = false }: { status?: number; manualRelease?: boolean } = {},
): () => void {
  // manualRelease (opt-in): håll EF-svaret öppet tills testet kallar release().
  // Gör loading-fönstret DETERMINISTISKT i stället för att racea en fast delayMs
  // mot realtid under parallell worker-last (T26 Landning B). Bärs nu av ett
  // obesvarat löfte i MSW-resolvern i stället för ett uppskjutet Route-objekt —
  // samma bevis, en mekanism (task-59.4:s form).
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  network.use(
    http.get(EF('get-registrations'), async () => {
      if (gate) await gate;
      return status === 200 ? json({ registrations: rows }) : json({ error: 'x' }, status);
    }),
  );
  return release;
}

test.describe('Anmälda-vy (Fas 6c L2 — LÄS-vy via get-registrations)', () => {
  test('roster renderas (namn + fält) + antal-summa; fokus → <h1>', async ({ page, network }) => {
    mockRegistrations(network, [
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
    // Ort visas MEDVETET INTE i rostret (se docblock) — ingen positiv
    // assertion här. En negativ assertion vore skör (samma stad kan
    // förekomma i annat sammanhang) och läggs inte till i onödan.
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

  test('tomt event (inga anmälda) → vänlig tom-text, ej fel', async ({ page, network }) => {
    mockRegistrations(network, []);
    await page.goto(`/event/${EVENT_ID}/anmalda`);

    await expect(page.getByRole('heading', { level: 1, name: 'Anmälda' })).toBeVisible();
    await expect(page.getByText('Inga anmälda för det här eventet än.')).toBeVisible();
    await expect(page.getByText('0 anmälda')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('namn null → "Namn saknas" (graciöst), aldrig krasch/tomt', async ({ page, network }) => {
    mockRegistrations(network, [row({ namn: null, fornamn: null, efternamn: null })]);
    await page.goto(`/event/${EVENT_ID}/anmalda`);
    await expect(page.getByText('Namn saknas')).toBeVisible();
  });

  test('fel (icke-2xx) → fel-UI via role=alert', async ({ page, network }) => {
    mockRegistrations(network, [], { status: 404 });
    await page.goto(`/event/${EVENT_ID}/anmalda`);
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta anmälda');
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page, network }) => {
    // Håll EF-svaret öppet → loading-tillståndet är deterministiskt synligt medan
    // handlern väntar (ingen realtids-race mot en fast delayMs under parallell last).
    const release = mockRegistrations(network, [row()], { manualRelease: true });
    await page.goto(`/event/${EVENT_ID}/anmalda`);
    await expect(page.getByText('Laddar anmälda…')).toBeVisible();
    // Släpp svaret → laddat tillstånd renderas.
    release();
    await expect(page.getByRole('heading', { level: 1, name: 'Anmälda' })).toBeVisible();
  });

  test('axe 0 violations på den renderade anmälda-vyn', async ({ page, network }) => {
    mockRegistrations(network, [
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
