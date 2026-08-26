import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * task-1.4 — Samlade anmälningslistan (/mer/anmalningar, LÄS-vy via
 * get-registrations event-lösa gren, GLOBAL lista, senaste först via
 * klient-sort på Inskickad). FK-listmönstret: ETT KORT PER RAD med namn +
 * event + datum; rad med event-koppling är LÄNK till eventets anmälda-vy,
 * rad utan visas olänkad med "Utan event" (PRD beslut 4 + 6).
 *
 * ACCEPTANCE-KLASSEN (task-59.5, ADR-080): filen flyttades hit ur e2e-sviten
 * med hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade.
 * Klassningen är HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 11
 * restanrop, samtliga typsnitt, noll skarpa.
 *
 * **Deterministisk via `network.use()`** — inte `page.route`: page-routes prövas
 * FÖRE MSW:s context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstret byggs med
 * `EF('get-registrations')` ur handlers-modulen, aldrig som handskriven sträng:
 * en överskuggning som inte matchar faller igenom till normalläget UTAN att
 * något fälls, och testet hade då sett fixturens egna anmälningar i stället för
 * sina (den tysta fällan, `hermetic.ts` § Överskugga en delad handler).
 *
 * VARFÖR EN ÖVERSKUGGNING NÄR `get-registrations` REDAN LIGGER I NORMALLÄGET:
 * testerna asserterar EXAKT sorteringsordning (tre namn i DOM-ordning), exakt
 * antal ("3 anmälningar") och en rad UTAN eventkoppling. Mot normalläget hade
 * beviset blivit ett kopplat påstående om fixturens datamängd, och varje ny
 * fixturanmälan hade brutit tester som handlar om klient-sorten. Svarsformen är
 * oförändrat EF:ens (`{ registrations }`) — snittet ligger kvar vid protokollet.
 *
 * Täckning: list-rendering senaste-först (namn + event + tid per rad),
 * nåbar från Mer-landningens länklista, rad-klick → anmälda-vyn,
 * "Utan event"-rad olänkad, tom-state, fel (4xx role=alert), fokus→<h1>,
 * axe 0. LÄS-vy → ingen write-affordans (utom resolutionen, se nedan).
 * INGET delayMs-loading-test (mönstret är lastkänsligt — TASK-3).
 *
 * ── UTVIDGAD, INTE OMSKRIVEN (TASK-299.5) ────────────────────────────────
 *
 * Formen på `/mer/anmalningar` är promoverad ur konvergensfasens variant B
 * (`ADR-103` B1/B2). Denna fil äger fortfarande SIDANS KONTRAKT — vägen in,
 * sorteringen, fokus, tom- och felläget — och det kontraktet överlevde
 * promoveringen oförändrat. TVÅ assertioner justerades, båda för att de
 * beskrev den RIVNA formen och ingenting annat:
 *
 *   1. Radens lokator är `<li>` i stället för länken. Den synliga
 *      länktexten är numera bara NAMNET; identiteten och tiden är syskon i
 *      raden, och hela `<li>` är klickytan (`after:absolute after:inset-0`).
 *   2. Datumet (`2026-06-22`) är utbytt mot en relativ tidsform ("för N
 *      dagar sedan"). Marcus formbeslut i konvergensen, inte en tappad
 *      uppgift.
 *
 * TILLKOMMET: radanatomin (`AC 4`) och att en åtgärdsrad leder till
 * resolutionen (`AC 5`). Formens DETALJER — filtrets fyra axlar, höjdlåset,
 * mobilradens bredd — bor i syskonfilen
 * `mer-anmalningar-form.acceptance.test.ts`, som flyttades hit från
 * prototypen med sitt bevisinnehåll intakt.
 */

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type Row = z.infer<typeof RegistrationSchema>;

/** En komplett Registration-rad (EF-svarets form, Registration.schema). */
function reg(overrides: Partial<Row> = {}): Row {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-20T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEvent1',
    personId: 'recPerson1',
    ...overrides,
  };
}

/**
 * Överskuggar get-registrations för DETTA test. Synkron: `network.use()` är en
 * ren tillståndsändring i handlers-controllern (ingen route-registrering att
 * invänta, till skillnad från `page.route`).
 */
function mockRegistrations(
  network: NetworkFixture,
  rows: Row[],
  { status = 200 }: { status?: number } = {},
): void {
  network.use(
    http.get(EF('get-registrations'), () =>
      status === 200 ? json({ registrations: rows }) : json({ error: 'x' }, status),
    ),
  );
}

test.describe('Samlade anmälningslistan (task-1.4 — /mer/anmalningar)', () => {
  test('AC 1 — nås från Mer-landningen; rader senaste först med namn + event + datum; fokus → <h1>', async ({
    page,
    network,
  }) => {
    mockRegistrations(network, [
      reg({ fornamn: 'Bo', efternamn: 'Bengtsson', inskickad: '2026-06-21T10:00:00.000Z' }),
      reg({ fornamn: 'Carl', efternamn: 'Carlsson', inskickad: '2026-06-22T10:00:00.000Z' }),
      reg({ fornamn: 'Disa', efternamn: 'Dahl', inskickad: '2026-06-20T10:00:00.000Z' }),
    ]);
    await page.goto('/mer');
    await page.getByRole('link', { name: 'Anmälningar' }).click();

    await expect(page).toHaveURL(/\/mer\/anmalningar$/);
    const h1 = page.getByRole('heading', { level: 1, name: 'Anmälningar' });
    await expect(h1).toBeVisible();
    await expect(h1).toBeFocused();

    // Senaste först (klient-sort på Inskickad, fallande): Carl (22:e) före
    // Bo (21:a) före Disa (20:e) — DOM-ordningen bevisar sorteringen.
    //
    // LOKATORN ÄR `<li>`, INTE länken (TASK-299.5): i den promoverade formen
    // är den synliga länktexten bara NAMNET — resten av raden (identiteten,
    // tiden, chevronen) är syskon, och klickytan görs total med
    // `after:absolute after:inset-0`. Sorteringen den bevisar är densamma.
    const rader = page.getByRole('list', { name: 'Anmälningar' }).locator('li');
    await expect(rader.nth(0)).toContainText('Carl Carlsson');
    await expect(rader.nth(1)).toContainText('Bo Bengtsson');
    await expect(rader.nth(2)).toContainText('Disa Dahl');

    // Namn + event + TID per rad. Datumet (`2026-06-22`) är utbytt mot en
    // relativ tidsform — Marcus formbeslut i konvergensen ("för N dagar
    // sedan", `relativTid`), inte en tappad uppgift. Eventnamnet står kvar,
    // nu via `eventIdentitet` som faller tillbaka på anmälans egen
    // `eventNamn` när eventet inte går att slå upp.
    await expect(rader.nth(0)).toContainText('Resor i medvetandet 1');
    await expect(rader.nth(0)).toContainText(/sedan|igår|nyss|\d{2}:\d{2}/);

    // Antal som TEXT (översikt, aldrig enbart färg). `exact` — filterpanelens
    // räknare ("Visar 3 av 3 anmälningar") bär samma delsträng.
    await expect(page.getByText('3 anmälningar', { exact: true })).toBeVisible();
  });

  test('AC 3 — rad-klick → eventets anmälda-vy; rad utan event olänkad med "Utan event"', async ({
    page,
    network,
  }) => {
    mockRegistrations(network, [
      reg({ fornamn: 'Carl', efternamn: 'Carlsson', eventId: 'recEvent1' }),
      reg({
        fornamn: 'Eva',
        efternamn: 'Ek',
        eventId: null,
        eventNamn: null,
        inskickad: '2026-06-19T10:00:00.000Z',
      }),
    ]);
    await page.goto('/mer/anmalningar');

    // "Utan event"-raden: synlig men OLÄNKAD (uppgiften saknas synligt).
    await expect(page.getByText('Eva Ek')).toBeVisible();
    await expect(page.getByText(/Utan event/)).toBeVisible();
    const lista = page.getByRole('list', { name: 'Anmälningar' });
    await expect(lista.getByRole('link')).toHaveCount(1); // endast Carl-raden

    await page.getByRole('link', { name: /Carl Carlsson/ }).click();
    await expect(page).toHaveURL(/\/event\/recEvent1\/anmalda/);
  });

  test('tomt läge → vänlig text, inga fel', async ({ page, network }) => {
    mockRegistrations(network, []);
    await page.goto('/mer/anmalningar');

    await expect(page.getByRole('heading', { level: 1, name: 'Anmälningar' })).toBeVisible();
    await expect(page.getByText('Inga anmälningar än.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('fel (4xx) → fel-UI via role=alert', async ({ page, network }) => {
    mockRegistrations(network, [], { status: 404 });
    await page.goto('/mer/anmalningar');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta anmälningarna');
  });

  test('AC 4 — radanatomin: initialcirkel, namnet som helradslänk, identitet, tid, chevron', async ({
    page,
    network,
  }) => {
    // Den promoverade formen bär personlistans radanatomi med
    // anmälningsdata (`ADR-103`-promoveringen av variant B). Assertionerna
    // nedan är radens FYRA bärande delar — inte en pixeljämförelse, utan de
    // element Lotta faktiskt scannar efter.
    mockRegistrations(network, [
      reg({ fornamn: 'Carl', efternamn: 'Carlsson', inskickad: '2026-06-22T10:00:00.000Z' }),
    ]);
    await page.goto('/mer/anmalningar');

    const rad = page.getByRole('list', { name: 'Anmälningar' }).locator('li').first();

    // 1. Initialcirkeln (InitialAvatar-primitiven) — dekorativ, så den bär
    //    initialerna som text men inget tillgängligt namn av egen kraft.
    await expect(rad.getByText('CC', { exact: true })).toBeVisible();
    // 2. Namnet ÄR länken, och den är radens enda interaktiva yta.
    await expect(rad.getByRole('link', { name: 'Carl Carlsson' })).toBeVisible();
    await expect(rad.getByRole('button')).toHaveCount(0);
    // 3. Identiteten under namnet (eventIdentitet — här anmälans egen
    //    eventNamn, eftersom `recEvent1` inte går att slå upp).
    await expect(rad).toContainText('Resor i medvetandet 1');
    // 4. Tiden i egen kolumn, relativ form.
    await expect(rad).toContainText(/sedan|igår|nyss|\d{2}:\d{2}/);
    // Ingen statusbadge på en OK-rad — den bärs villkorat, inte reserverat.
    await expect(rad.getByText('Behöver kopplas')).toHaveCount(0);
  });

  test('AC 5 — en åtgärdsrad bär markören och LEDER till resolutionen', async ({
    page,
    network,
  }) => {
    // Åtgärdsradens väg är formens kärnfunktion (PRD TASK-299 AC #4): raden
    // ÄR sin egen trigger — inget separat knappelement som syskon till ett
    // länk-kort, vilket den rivna formen bar. Predikatet är det DELADE
    // `behoverAtgard` (registration-display.ts), samma som Hem-vyns räknare
    // läser — aldrig en egen tolkning i vyn (kortets AC #6).
    mockRegistrations(network, [
      reg({
        fornamn: 'Bo',
        efternamn: 'Bengtsson',
        eventmatchning: 'Avviker',
        inskickad: '2026-06-22T10:00:00.000Z',
      }),
    ]);
    await page.goto('/mer/anmalningar');

    const rad = page.getByRole('list', { name: 'Anmälningar' }).locator('li').first();
    // Markören bär TEXT, aldrig enbart färg (WCAG 1.4.1).
    await expect(rad.getByText('Behöver kopplas')).toBeVisible();
    // Exakt EN interaktiv yta, och den är en riktig <button> — noll länkar,
    // så `nested-interactive` inte ens kan uppstå.
    await expect(rad.getByRole('button')).toHaveCount(1);
    await expect(rad.getByRole('link')).toHaveCount(0);

    await rad.getByRole('button').click();
    await expect(page.getByRole('dialog', { name: 'Koppla till rätt event' })).toBeVisible();
  });

  test('axe 0 violations på den renderade listan', async ({ page, network }) => {
    mockRegistrations(network, [
      reg(),
      reg({ fornamn: 'Eva', efternamn: 'Ek', eventId: null, eventNamn: null }),
    ]);
    await page.goto('/mer/anmalningar');
    await expect(page.getByRole('heading', { level: 1, name: 'Anmälningar' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
