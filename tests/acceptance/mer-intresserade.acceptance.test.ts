import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { IntresseradSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * Fas 6e L1 Landning 3 — Intresserade-vy (/mer/intresserade, LÄS-vy via get-leads,
 * GLOBAL lista, strikt lead-formel, Senaste interaktion desc).
 *
 * [OMSKRIVEN TILL DEN PROMOVERADE ANATOMIN, TASK-374.2, ADR-103 B2 steg 1]
 * K0-baslinjen (initialcirkel + namn-rubrik + `<dl>`-fältlista: "Nappat på",
 * "Antal hämtningar", "Senaste interaktion") är riven — den promoverade
 * B3-konvergensformen (`src/components/intresserade/Intresserade.tsx`, git-mv:ad
 * ur `prototype/IntresseradeKonvergens.tsx`) är nu den ENDA vyn på denna
 * adress. Denna fil hävdade tidigare K0-anatomin; det görs inte längre —
 * "Nappat på"-listan (`allaHamtningar`-rollupen) visas inte i den nya formen,
 * så de assertionerna är BORTTAGNA, inte datan (rollup-fältet finns kvar i
 * schemat och i EF-svaret).
 *
 * NY ANATOMI (facit: `tasks/sessions/bilagor/s114-intresserade-konvergens/
 * facit.json`, yta `intresserade-lista`): primär rad (namn, eller e-posten när
 * namnet saknas) + sekundär rad (e-post under ett namn, eller "Namnlös
 * intresserad" dämpat under en e-post) + aktivitetsrad ("N dagar sedan ·
 * <senaste interaktion>") + hämtnings-pill i högerkolumnen. Sök på namn/e-post
 * och en sorteringskontroll (husets `Select`, default "Senaste interaktion",
 * växel "Namn A till Ö") ligger ovanför listan.
 *
 * LIVE-REGION-HÄVDANDET (TASK-374.1 AC #3) ÄR INFLYTTAT HIT. Fram till denna
 * skiva bodde det i en separat fil (`mer-intresserade-konvergens.acceptance.
 * test.ts`) eftersom formen bara nåddes bakom `?variant=a` — nu ÄR formen
 * denna adress, så det separata låset är onödigt: samma hävdande (aria-live=
 * "polite" + aria-atomic="true" på träffräknaren, ingen `role="status"`, och
 * att texten uppdateras vid sökning) ligger i testet
 * "sökning filtrerar och räknaren annonseras" nedan. Den gamla filen är riven
 * i samma commit som denna omskrivning.
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
 * Täckning: primär/sekundär rad (namngiven, namnlös MED e-post), aktivitetsrad,
 * hämtnings-pill (singular/plural), sökning + träffräknare (live-region),
 * sortering (husets Select, listbox), tom-state, sökning utan träff, fel
 * (role=alert, ingen retry), loading aria-busy, axe 0 i alla tre tillstånd
 * (tomt/ifyllt/fel). LÄS-vy → INGEN write-affordans.
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
    dagarSedanSenaste: 5,
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
  // event-anmalda manualRelease (T26 Landning B).
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

test.describe('Intresserade-vy (Fas 6e L1 L3 — LÄS-vy via get-leads, promoverad B3-form)', () => {
  test('roster renderas: primär/sekundär rad + aktivitetsrad + hämtnings-pill; fokus → <h1>', async ({
    page,
    network,
  }) => {
    mockLeads(network, [
      row({
        namn: 'Anna Andersson',
        email: 'anna@example.se',
        senasteInteraktion: 'Laddade ner guide',
        dagarSedanSenaste: 5,
        antalHamtningar: 2,
      }),
      row({
        namn: 'Bo Bengtsson',
        email: 'bo@example.se',
        senasteInteraktion: 'Öppnade välkomstmail',
        dagarSedanSenaste: 1,
        antalHamtningar: 1,
      }),
    ]);
    await page.goto('/mer/intresserade');

    // <h1> = "Intresserade", fokuserad efter async-laddning.
    const heading = page.getByRole('heading', { level: 1, name: 'Intresserade' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att listan anlänt.
    await expect(page.getByText('Intresserade laddade.')).toHaveCount(1);

    // Antal-summa som TEXT (default, ingen sökning).
    await expect(page.getByText('2 intresserade')).toBeVisible();

    // Primär rad = namnet, sekundär rad = e-posten (Anna har båda).
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByText('anna@example.se')).toBeVisible();
    await expect(page.getByText('Bo Bengtsson')).toBeVisible();
    await expect(page.getByText('bo@example.se')).toBeVisible();

    // Aktivitetsraden: "N dagar sedan · <senaste interaktion>".
    await expect(page.getByText('5 dagar sedan · Laddade ner guide')).toBeVisible();
    await expect(page.getByText('i går · Öppnade välkomstmail')).toBeVisible();

    // Hämtnings-pillen: plural (2) och singular (1).
    await expect(page.getByText('2 hämtningar')).toBeVisible();
    await expect(page.getByText('1 hämtning', { exact: true })).toBeVisible();

    // LÄS-vy: ingen write-/markera-kontroll (mailutskick = framtida slice).
    await expect(
      page.getByRole('button', { name: /skicka|markera|spara|ändra|ta bort/i }),
    ).toHaveCount(0);

    // Tillbaka-chevron → Mer-landningen (husets sidram, orörd av promoveringen).
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toHaveAttribute(
      'href',
      '/mer',
    );
  });

  test('namnlös intresserad MED e-post → e-posten primär rad, "Namnlös intresserad" sekundär (dämpat)', async ({
    page,
    network,
  }) => {
    mockLeads(network, [
      row({
        id: 'recINTnamnlos',
        namn: null,
        fornamn: null,
        efternamn: null,
        email: 'namnlos@example.se',
      }),
    ]);
    await page.goto('/mer/intresserade');

    // Primärraden BÄR e-posten (mailklienternas regel: namn saknas → e-post
    // är bästa identifierare) — den gamla K0-formens "Namnlös person - …"
    // finns inte i denna anatomi.
    await expect(page.getByText('namnlos@example.se').first()).toBeVisible();
    // Sekundärraden bär den dämpade etiketten.
    await expect(page.getByText('Namnlös intresserad')).toBeVisible();
  });

  test('tom lista → vänlig tom-text, ej fel', async ({ page, network }) => {
    mockLeads(network, []);
    await page.goto('/mer/intresserade');

    await expect(page.getByRole('heading', { level: 1, name: 'Intresserade' })).toBeVisible();
    await expect(page.getByText('Inga intresserade än.')).toBeVisible();
    await expect(page.getByText('0 intresserade')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('sökning filtrerar och räknaren annonseras (aria-live/aria-atomic, ingen role=status)', async ({
    page,
    network,
  }) => {
    mockLeads(network, [
      row({ namn: 'Anna Andersson', email: 'anna@example.se' }),
      row({
        id: 'recINTnamnlosSok',
        namn: null,
        fornamn: null,
        efternamn: null,
        email: 'bo@example.se',
      }),
    ]);
    await page.goto('/mer/intresserade');

    const raknare = page.getByText('2 intresserade');
    await expect(raknare).toBeVisible();
    await expect(raknare).toHaveAttribute('aria-live', 'polite');
    await expect(raknare).toHaveAttribute('aria-atomic', 'true');
    // Rollen är ORÖRD ("paragraph") — role="status" hade dubbelannonserat
    // (samma teknik som DokumentYta.tsx, se Intresserade.tsx docblock).
    await expect(raknare).not.toHaveAttribute('role', 'status');

    await page.getByRole('searchbox', { name: 'Sök intresserad' }).fill('Anna');
    const traffRaknare = page.getByText('1 träffar av 2 intresserade');
    await expect(traffRaknare).toBeVisible();
    await expect(page.getByText('Namnlös intresserad')).toHaveCount(0);
    // SAMMA nod (React uppdaterar textnoden in place) bär fortfarande attributen.
    await expect(traffRaknare).toHaveAttribute('aria-live', 'polite');
    await expect(traffRaknare).toHaveAttribute('aria-atomic', 'true');
  });

  test('sökning utan träff → "Inga träffar på sökningen."', async ({ page, network }) => {
    mockLeads(network, [row({ namn: 'Anna Andersson', email: 'anna@example.se' })]);
    await page.goto('/mer/intresserade');

    await page.getByRole('searchbox', { name: 'Sök intresserad' }).fill('zzz-ingen-traff');
    await expect(page.getByText('Inga träffar på sökningen.')).toBeVisible();
    await expect(page.getByText('0 träffar av 1 intresserade')).toBeVisible();
  });

  test('sortering via husets Select — "Namn A till Ö" omordnar listan', async ({
    page,
    network,
  }) => {
    // Serverordning (default "Senaste interaktion"): Zebra FÖRE Anna —
    // motsatt alfabetisk ordning, så en reordering vid namn-sort är synlig.
    mockLeads(network, [
      row({ id: 'recINTzebra', namn: 'Zebra Larsson', email: 'zebra@example.se' }),
      row({ id: 'recINTanna', namn: 'Anna Andersson', email: 'anna@example.se' }),
    ]);
    await page.goto('/mer/intresserade');

    // Scopat till ytans egen lista — `getByRole('listitem')` osoperad matchar
    // även app-skalets navigationsmeny (t.ex. "Mer"), som också renderar
    // <li>-element.
    const rader = page.getByTestId('intresserade-yta').getByRole('listitem');
    await expect(rader.first()).toContainText('Zebra Larsson');
    await expect(rader.last()).toContainText('Anna Andersson');

    // Husets Select: tillgängligt namn = värde + etikett ("Senaste
    // interaktion Sortera efter" — se tests/visual/intresserade-
    // promoverings-grind.spec.ts ariaSnapshot-referenserna).
    await page.getByRole('button', { name: 'Senaste interaktion Sortera efter' }).click();
    await page.getByRole('option', { name: 'Namn A till Ö' }).click();

    await expect(rader.first()).toContainText('Anna Andersson');
    await expect(rader.last()).toContainText('Zebra Larsson');
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
    mockLeads(network, []);
    await page.goto('/mer/intresserade');
    await expect(page.getByText('Inga intresserade än.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations på IFYLLD vy (namngiven + namnlös rad, sök + sortering)', async ({
    page,
    network,
  }) => {
    mockLeads(network, [
      row({ namn: 'Anna Andersson', email: 'anna@example.se' }),
      row({
        id: 'recINTnamnlosAxe',
        namn: null,
        fornamn: null,
        efternamn: null,
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
    mockLeads(network, [], { status: 404 });
    await page.goto('/mer/intresserade');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta intresserade');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
