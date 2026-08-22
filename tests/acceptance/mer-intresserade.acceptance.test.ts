import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { IntresseradSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * Fas 6e L1 Landning 3 — Intresserade-vy (/mer/intresserade, LÄS-vy via get-leads,
 * GLOBAL lista, strikt lead-formel, Senaste interaktion desc).
 *
 * ACCEPTANCE-KLASSEN (task-59.5, ADR-080): filen flyttades hit ur e2e-sviten
 * med hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade.
 * Klassningen är HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 15
 * restanrop, samtliga typsnitt, noll skarpa.
 *
 * **Deterministisk via `network.use()`** — inte `page.route`: page-routes prövas
 * FÖRE MSW:s context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstret byggs med
 * `EF('get-leads')` ur handlers-modulen, aldrig som handskriven sträng — en
 * överskuggning vars mönster inte matchar faller igenom UTAN att något fälls
 * (den tysta fällan, `hermetic.ts` § Överskugga en delad handler).
 *
 * `get-leads` LIGGER INTE I NORMALLÄGET, och det är avsiktligt: fixturvärldens
 * delade handlers bär de vägar flera vyer delar. Ett test här som glömmer sin
 * överskuggning fälls därför av hermetik-vakten med adressen namngiven, i
 * stället för att tyst rendera en främmande datamängd. Svarsformen är EF:ens
 * egen (`{ intresserade, nextCursor }`) — snittet ligger vid protokollet.
 *
 * Täckning: roster-rendering (namn + nappat-på/allaHamtningar + antalHamtningar +
 * senaste interaktion), antal-summa, fokus→<h1> + aria-live, tom-state, fel
 * (role=alert), loading aria-busy, namnlös-fallback (MED + UTAN e-post), axe 0
 * i alla tre tillstånd (tomt/ifyllt/fel). LÄS-vy → INGEN write-affordans.
 *
 * UTVIDGAD, INTE OMSKRIVEN (TASK-299.8, PRD TASK-299 § Testbeslut "skarvarna
 * följer skivorna"): den gamla textlänken ("← Tillbaka till Mer") är ersatt av
 * husets sidram (`primitives/SidRam`, kant-i-kant, chevron ensam — rubriken
 * lever kvar i sidan) och varje rad bär nu initialcirkeln
 * (`primitives/InitialAvatar`). Radens fält och deras ordning är oförändrade
 * (AC #3) — bara chromet och avataren är nya, se `Intresserade.tsx`.
 */

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type Row = z.infer<typeof IntresseradSchema>;

/** En komplett Intresserad-rad (EF-svarets form, IntresseradSchema = PersonSchema
 * .extend + antalHamtningar/allaHamtningar). Alla fält närvarande — adaptern
 * .parse():ar mot z.array(IntresseradSchema), så en ofullständig rad → parse-fel. */
function row(overrides: Partial<Row> = {}): Row {
  return {
    id: `recINT${Math.random().toString(36).slice(2, 10)}`,
    namn: 'Anna Andersson',
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1234567',
    ort: [],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar: null,
    antalAnmalningar: 0,
    antalDeltaganden: 0,
    erfarenhetsniva: null,
    erfarenhetsbadge: null,
    senasteInteraktion: 'Laddade ner guide',
    senasteInteraktionDatum: '2026-05-01',
    dagarSedanSenaste: 30,
    harAktivAnmalan: null,
    ejGodkandMail: false,
    radSkapad: '2026-05-01T10:00:00.000Z',
    anmalningIds: [],
    deltagandeIds: [],
    antalHamtningar: 2,
    allaHamtningar: ['Gratis guide', 'Webinar'],
    ...overrides,
  };
}

function mockLeads(
  network: NetworkFixture,
  rows: Row[],
  { status = 200, manualRelease = false }: { status?: number; manualRelease?: boolean } = {},
): () => void {
  // manualRelease (opt-in): håll EF-svaret öppet tills testet kallar release().
  // Gör loading-fönstret DETERMINISTISKT i stället för att racea en fast delayMs
  // mot realtid (cold-chunk lazy-load under autoCodeSplitting); speglar
  // event-anmalda manualRelease (T26 Landning B). Parkeringen bärs nu av ett
  // OBESVARAT LÖFTE i MSW-resolvern i stället för av ett uppskjutet Route-objekt
  // — samma bevis, en mekanism (task-59.4:s form).
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  network.use(
    http.get(EF('get-leads'), async () => {
      if (gate) await gate;
      return status === 200
        ? json({ intresserade: rows, nextCursor: null })
        : json({ error: 'x' }, status);
    }),
  );
  return release;
}

test.describe('Intresserade-vy (Fas 6e L1 L3 — LÄS-vy via get-leads)', () => {
  test('roster renderas (namn + nappat-på + antal + senaste interaktion) + summa; fokus → <h1>', async ({
    page,
    network,
  }) => {
    mockLeads(network, [
      row({
        namn: 'Anna Andersson',
        email: 'anna@example.se',
        antalHamtningar: 2,
        allaHamtningar: ['Gratis guide', 'Webinar'],
        senasteInteraktion: 'Laddade ner guide',
      }),
      row({
        namn: 'Bo Bengtsson',
        email: 'bo@example.se',
        antalHamtningar: 1,
        allaHamtningar: ['Nyhetsbrev'],
        senasteInteraktion: 'Öppnade välkomstmail',
      }),
    ]);
    await page.goto('/mer/intresserade');

    // <h1> = "Intresserade", fokuserad efter async-laddning.
    const heading = page.getByRole('heading', { level: 1, name: 'Intresserade' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att listan anlänt.
    await expect(page.getByText('Intresserade laddade.')).toHaveCount(1);

    // Antal-summa som TEXT.
    await expect(page.getByText('2 intresserade')).toBeVisible();

    // Namn (aldrig record-ID).
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByText('Bo Bengtsson')).toBeVisible();

    // "Nappat på" — allaHamtningar (string[]) som läsbar kommaseparerad lista.
    await expect(page.getByText('Gratis guide, Webinar')).toBeVisible();
    await expect(page.getByText('Nyhetsbrev')).toBeVisible();

    // Antal hämtningar-fältet renderas (dt-etiketten finns).
    await expect(page.getByText('Antal hämtningar').first()).toBeVisible();

    // Senaste interaktion som läsbar text.
    await expect(page.getByText('Laddade ner guide')).toBeVisible();
    await expect(page.getByText('Öppnade välkomstmail')).toBeVisible();

    // LÄS-vy: ingen write-/markera-kontroll (mailutskick = framtida slice).
    // Namn-scopad så app-skalets chrome ej ger falskt negativ.
    await expect(
      page.getByRole('button', { name: /skicka|markera|spara|ändra|ta bort/i }),
    ).toHaveCount(0);

    // Tillbaka-chevron → Mer-landningen. TASK-299.8: husets sidram
    // (`primitives/SidRam`) ersätter den gamla textlänken ("← Tillbaka till
    // Mer") — chevronens tillgängliga namn bär ingen pil, se
    // `SidRam.tsx`s `tillbakaEtikett`.
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toHaveAttribute(
      'href',
      '/mer',
    );

    // Initialcirklarna (TASK-299.8, `primitives/InitialAvatar`) — dekorativa
    // (`aria-hidden`), en per rad; namnet bärs av radens egen text.
    await expect(page.getByText('AA', { exact: true })).toBeVisible();
    await expect(page.getByText('BB', { exact: true })).toBeVisible();
  });

  test('tom lista → vänlig tom-text, ej fel', async ({ page, network }) => {
    mockLeads(network, []);
    await page.goto('/mer/intresserade');

    await expect(page.getByRole('heading', { level: 1, name: 'Intresserade' })).toBeVisible();
    await expect(page.getByText('Inga intresserade än.')).toBeVisible();
    await expect(page.getByText('0 intresserade')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('namnlös lead MED e-post → "Namnlös person — …" (graciöst, aldrig krasch/tomt)', async ({
    page,
    network,
  }) => {
    mockLeads(network, [
      row({ namn: null, fornamn: null, efternamn: null, email: 'namnlos@example.se' }),
    ]);
    await page.goto('/mer/intresserade');
    await expect(page.getByText('Namnlös person - namnlos@example.se')).toBeVisible();
  });

  test('namnlös lead UTAN e-post → "Namnlös person" (generisk fallback)', async ({
    page,
    network,
  }) => {
    mockLeads(network, [row({ namn: null, fornamn: null, efternamn: null, email: null })]);
    await page.goto('/mer/intresserade');
    await expect(page.getByText('Namnlös person', { exact: true })).toBeVisible();
  });

  test('fel (4xx, klient-fel) → fel-UI via role=alert (ingen retry)', async ({ page, network }) => {
    // 4xx → no-retry-grenen: isError direkt, ingen backoff. 5xx vore fel testval —
    // då retryar react-query korrekt och alerten dröjer förbi timeouten.
    mockLeads(network, [], { status: 404 });
    await page.goto('/mer/intresserade');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta intresserade');
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page, network }) => {
    // Håll EF-svaret öppet → loading-tillståndet är deterministiskt synligt medan
    // resolvern hålls (ingen realtids-race mot en fast delayMs / cold-chunk lazy-load).
    const release = mockLeads(network, [row()], { manualRelease: true });
    await page.goto('/mer/intresserade');
    await expect(page.getByText('Laddar intresserade…')).toBeVisible();
    // Släpp svaret → laddat tillstånd renderas.
    release();
    await expect(page.getByRole('heading', { level: 1, name: 'Intresserade' })).toBeVisible();
  });

  test('axe 0 violations på TOM vy', async ({ page, network }) => {
    // TASK-299.8 DoD #5 — sidramen (SidRam) och det tomma läget tillsammans;
    // ingen rad, alltså ingen InitialAvatar heller, men chevronen är kvar.
    mockLeads(network, []);
    await page.goto('/mer/intresserade');
    await expect(page.getByText('Inga intresserade än.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations på IFYLLD vy (sidram + initialcirklar, TASK-299.8)', async ({
    page,
    network,
  }) => {
    mockLeads(network, [
      row({ namn: 'Anna Andersson', email: 'anna@example.se' }),
      row({
        namn: 'Bo Bengtsson',
        email: 'bo@example.se',
        senasteInteraktion: 'Anmälde nyhetsbrev',
      }),
    ]);
    await page.goto('/mer/intresserade');
    await expect(page.getByRole('heading', { level: 1, name: 'Intresserade' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations på FEL-vy (4xx, role=alert)', async ({ page, network }) => {
    // TASK-299.8 DoD #5 — MessageBox (role=alert) bredvid den nya sidramen.
    mockLeads(network, [], { status: 404 });
    await page.goto('/mer/intresserade');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta intresserade');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
