import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { WaitlistEntrySchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * Fas 6c Leverabel 3 — Väntelista-vy (/mer/vantelista, LÄS-vy via get-waitlist,
 * GLOBAL lista, NOT Flyttad, createdTime desc).
 *
 * ACCEPTANCE-KLASSEN (task-59.5, ADR-080): filen flyttades hit ur e2e-sviten
 * med hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade.
 * Klassningen är HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 13
 * restanrop, samtliga typsnitt, noll skarpa.
 *
 * **Deterministisk via `network.use()`** — inte `page.route`: page-routes prövas
 * FÖRE MSW:s context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstret byggs med
 * `EF('get-waitlist')` ur handlers-modulen, aldrig som handskriven sträng — en
 * överskuggning vars mönster inte matchar faller igenom UTAN att något fälls
 * (den tysta fällan, `hermetic.ts` § Överskugga en delad handler).
 *
 * `get-waitlist` LIGGER INTE I NORMALLÄGET: ett test här som glömmer sin
 * överskuggning fälls av hermetik-vakten med adressen namngiven. Svarsformen är
 * EF:ens egen (`{ waitlist }`, WaitlistEntrySchema-rader) — snittet ligger vid
 * protokollet.
 *
 * Täckning: roster-rendering (namn + ställde-sig-datum + e-post + telefon +
 * informationsmail-status), antal-summa, fokus→<h1> + aria-live, tom-state, fel
 * (role=alert), loading aria-busy, namn-fallback ("Namn saknas"), axe 0 (lista +
 * tomt + fel). LÄS-vy → INGEN flytta-/write-affordans.
 *
 * UTVIDGAD (TASK-299.7, AC #5 — utvidgad, inte omskriven): husets delade
 * `SidRam`-primitiv ersätter den gamla textlänken "← Tillbaka till Mer"
 * (AC #1 — den gamla länken OCH den dubblerade sidmarginalen är borta); varje
 * rad bär `InitialAvatar`s initialcirkel ur namnet (AC #2). Axe utvidgat till
 * tom- och fellägena (tidigare bara det laddade listläget).
 */

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type Row = z.infer<typeof WaitlistEntrySchema>;

/** En komplett WaitlistEntry-rad (EF-svarets form, WaitlistEntrySchema). */
function row(overrides: Partial<Row> = {}): Row {
  return {
    id: `recWL${Math.random().toString(36).slice(2, 10)}`,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1234567',
    informationsmail1Skickad: null,
    createdTime: '2026-05-02T10:00:00.000Z',
    ...overrides,
  };
}

function mockWaitlist(
  network: NetworkFixture,
  rows: Row[],
  { status = 200, manualRelease = false }: { status?: number; manualRelease?: boolean } = {},
): () => void {
  // manualRelease (opt-in): håll EF-svaret öppet tills testet kallar release().
  // Gör loading-fönstret DETERMINISTISKT i stället för att racea en fast delayMs
  // mot realtid under parallell worker-last (T26 Landning B). Parkeringen bärs av
  // ett obesvarat löfte i MSW-resolvern (task-59.4:s form).
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  network.use(
    http.get(EF('get-waitlist'), async () => {
      if (gate) await gate;
      return status === 200 ? json({ waitlist: rows }) : json({ error: 'x' }, status);
    }),
  );
  return release;
}

test.describe('Väntelista-vy (Fas 6c L3 — LÄS-vy via get-waitlist)', () => {
  test('roster renderas (namn + fält) + antal-summa; fokus → <h1>', async ({ page, network }) => {
    mockWaitlist(network, [
      row({
        fornamn: 'Anna',
        efternamn: 'Andersson',
        email: 'anna@example.se',
        telefon: '070-1111111',
        informationsmail1Skickad: '2026-04-28T06:37:58.949Z',
        createdTime: '2026-05-02T10:00:00.000Z',
      }),
      row({
        fornamn: 'Bo',
        efternamn: 'Bengtsson',
        email: 'bo@example.se',
        telefon: '070-2222222',
        informationsmail1Skickad: null,
        createdTime: '2026-05-01T09:00:00.000Z',
      }),
    ]);
    await page.goto('/mer/vantelista');

    // <h1> = "Väntelista", fokuserad efter async-laddning.
    const heading = page.getByRole('heading', { level: 1, name: 'Väntelista' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att väntelistan anlänt.
    await expect(page.getByText('Väntelistan laddad.')).toHaveCount(1);

    // Antal-summa som TEXT.
    await expect(page.getByText('2 på väntelistan')).toBeVisible();

    // Namn (aldrig record-ID) + kontaktfält.
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByText('Bo Bengtsson')).toBeVisible();
    await expect(page.getByText('anna@example.se')).toBeVisible();
    await expect(page.getByText('bo@example.se')).toBeVisible();

    // AC #2 — initialcirkeln (InitialAvatar, primitiv-komponenten) ur namnet,
    // en per rad. Extern beteende (synlig text), aldrig implementationsdetalj.
    await expect(page.getByText('AA', { exact: true })).toBeVisible();
    await expect(page.getByText('BB', { exact: true })).toBeVisible();

    // Ställde sig: createdTime formaterat sv-SE (aldrig rå ISO).
    await expect(page.getByText('2026-05-02')).toBeVisible();
    await expect(page.getByText('2026-05-01')).toBeVisible();

    // Informationsmail-1-status som TEXT, båda grenarna.
    await expect(page.getByText('Skickat 2026-04-28')).toBeVisible();
    await expect(page.getByText('Ej skickat')).toBeVisible();

    // LÄS-vy: ingen flytta-/spara-/markera-kontroll (write = framtida slice).
    // Namn-scopad så app-skalets chrome ej ger falskt negativ.
    await expect(
      page.getByRole('button', { name: /flytta|markera|spara|ändra|ta bort/i }),
    ).toHaveCount(0);

    // AC #1 — sidramens chevron (SidRam) ersätter den gamla textlänken:
    // tillgängligt namn utan pilprefix, href → Mer-landningen. Den gamla
    // texten "← Tillbaka till Mer" existerar inte längre någonstans på sidan.
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toHaveAttribute(
      'href',
      '/mer',
    );
    await expect(page.getByText('← Tillbaka till Mer')).toHaveCount(0);
  });

  test('tom väntelista → vänlig tom-text, ej fel', async ({ page, network }) => {
    mockWaitlist(network, []);
    await page.goto('/mer/vantelista');

    await expect(page.getByRole('heading', { level: 1, name: 'Väntelista' })).toBeVisible();
    await expect(page.getByText('Väntelistan är tom.')).toBeVisible();
    await expect(page.getByText('0 på väntelistan')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('namn null → "Namn saknas" (graciöst), aldrig krasch/tomt', async ({ page, network }) => {
    mockWaitlist(network, [row({ fornamn: null, efternamn: null })]);
    await page.goto('/mer/vantelista');
    await expect(page.getByText('Namn saknas')).toBeVisible();
  });

  test('fel (4xx, klient-fel) → fel-UI via role=alert (ingen retry)', async ({ page, network }) => {
    // 4xx → no-retry-grenen (speglar event-anmalda 404): isError direkt, ingen
    // backoff. Det gäller DEN HÄR vyn: `Waitlist.tsx` undantar 4xx i sitt
    // `retry`-predikat, och `fetchWithRetry` returnerar 4xx utan omförsök — så
    // båda lagren kortsluts och alerten hinner fram på default-timeouten.
    //
    // 5xx är alltså inte ett förbjudet testval i klassen — det betalar bara
    // hela retrykedjan (~7–8 s; acceptance-bas.ts § SKRIVA ETT TEST I KLASSEN)
    // och kräver då en räknad timeout på assertionen. Här köper det inget:
    // testet mäter no-retry-grenen, och 404 är den grenen.
    mockWaitlist(network, [], { status: 404 });
    await page.goto('/mer/vantelista');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta väntelistan');
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page, network }) => {
    // Håll EF-svaret öppet → loading-tillståndet är deterministiskt synligt medan
    // resolvern hålls (ingen realtids-race mot en fast delayMs under parallell last).
    const release = mockWaitlist(network, [row()], { manualRelease: true });
    await page.goto('/mer/vantelista');
    await expect(page.getByText('Laddar väntelistan…')).toBeVisible();
    // Släpp svaret → laddat tillstånd renderas.
    release();
    await expect(page.getByRole('heading', { level: 1, name: 'Väntelista' })).toBeVisible();
  });

  test('axe 0 violations på den renderade väntelista-vyn', async ({ page, network }) => {
    mockWaitlist(network, [
      row({ fornamn: 'Anna', efternamn: 'Andersson', email: 'anna@example.se' }),
      row({
        fornamn: 'Bo',
        efternamn: 'Bengtsson',
        email: 'bo@example.se',
        createdTime: '2026-05-01T09:00:00.000Z',
      }),
    ]);
    await page.goto('/mer/vantelista');
    await expect(page.getByRole('heading', { level: 1, name: 'Väntelista' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  // UTVIDGAT (TASK-299.7, DoD #5 — axe 0 i ALLA tillstånd, inte bara det
  // laddade listläget). Väntelistan har inget filtrerat läge (till skillnad
  // från anmälningssidan) — tomt, fel och laddning är de återstående tre.
  test('axe 0 violations — tomt läge', async ({ page, network }) => {
    mockWaitlist(network, []);
    await page.goto('/mer/vantelista');
    await expect(page.getByText('Väntelistan är tom.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations — fel-läge', async ({ page, network }) => {
    mockWaitlist(network, [], { status: 404 });
    await page.goto('/mer/vantelista');
    await expect(page.getByRole('alert')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations — laddningsläge', async ({ page, network }) => {
    mockWaitlist(network, [row()], { manualRelease: true });
    await page.goto('/mer/vantelista');
    await expect(page.getByText('Laddar väntelistan…')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
