import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { delay, http } from 'msw';
import type { z } from 'zod';
import type { PersonSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * Personer-listan — förladdat register, sök i klienten (TASK-286.2, ADR-123).
 *
 * [OMSKRIVEN, TASK-286.2] Filen testade tidigare `listPersons`s cursor-port
 * (ADR-056): varje sökterm/"Ladda fler" var en EGEN mockad EF-sida. Sedan
 * ADR-123 läser `PersonsList` HELA registret EN gång
 * (`get-persons?register=true`) och söker/paginerar i minnet
 * (`src/lib/person-sok.ts`) — fixturen bär nu HELA registret, inte sidor.
 * Mocken är därför en EKALL, statisk responder (ingen sök-/cursor-parsning
 * kvar att replikera).
 *
 * REGISTRET (55 syntetiska personer, `PAGE_SIZE` = 50 i `PersonsList.tsx`)
 * är medvetet större än en sida: den ENDA vägen att bevisa AC #5 ("Ladda
 * fler" utökar ur den filtrerade arrayen) är ett register som faktiskt
 * spänner över fönstergränsen.
 *
 * AC #1 ("noll nätverksanrop vid skrivning") bevisas INTE genom att räkna
 * handler-anrop — klassens egen disciplin (`acceptance-bas.ts`: "Klassen
 * testar EXTERNT BETEENDE — aldrig att en handler anropades eller hur många
 * gånger. Det vore att testa fixturen.") förbjuder just den formen. Beviset
 * är i stället BETEENDE: en konstgjord, lång fördröjning på registret gör
 * "krävde detta ett NYTT anrop?" till en tidsfråga — filtreringen (odebouncad,
 * `useDeferredValue`, ADR-123 beslut 5) måste besvaras långt under
 * fördröjningen för att vara nätverksfri. En regression som återinförde ett
 * anrop per tecken hade fällt assertionens KORTA timeout, inte förlängt den.
 *
 * [UTÖKAD, TASK-286.3] Sist i filen ligger sorterings-blocket (AC #1/#2):
 * svensk kollation med namnlös-sentinelen sist, och räknarraden räknad ur
 * arrayen. Dess fixtur levereras medvetet i AIRTABLES ordning — den ordning
 * EF:en faktiskt returnerar, med Å bland A:na — så en yta som renderar
 * hämtningens ordning rakt av fäller testet.
 *
 * [SÖK-SEMANTIKEN BYTTE, TASK-286.7 — 2026-08-22] Klientfiltret är sedan
 * Marcus JA på TASK-286.5 DIAKRITIK-TOLERANT ("asa" hittar Åsa), likvärdigt
 * med eventväljarens filter. Denna fils söktermer valdes redan av TASK-286.3
 * mot just det kommande bytet och är därför opåverkade — se sorterings-
 * blockets egen not om varför termen är "j".
 *
 * TÄCKER INTE här (egna skarvar): AC #3 (matchningens semantik — sedan
 * TASK-286.7 likvärdighet med eventväljarens filter, inte längre paritet med
 * EF:ens SEARCH()-formel) — `tests/api/person-sok.test.ts` (pure) + `tests/api/
 * get-persons-sok-paritet.staging.test.ts` (skarpt mot staging). AC #4
 * (prefetch på hover/fokus, Personer-fliken) —
 * `tests/acceptance/tabbar-personer-prefetch.acceptance.test.ts`. AC #7
 * (facit-formen) — `tests/visual/personer-promoverings-grind.spec.ts`
 * (ariaSnapshot-referenserna) + `tests/visual/personer.spec.ts`.
 */

/**
 * Komplett Person som passerar PersonSchema (.parse i adaptern).
 *
 * BUNDEN MED `satisfies`, inte med en returtyp (TASK-63) — se `acceptance-bas.ts`
 * § fogen. Skälet är precision: `PersonSchema.namn` är nullable, så en explicit
 * returtyp hade vidgat `namn` till `string | null` och tvingat fram en null-check
 * i sök-filtret nedan — trots att fabriken alltid sätter en sträng. `satisfies`
 * kontrollerar fältnamn och fälttyper mot schemat men behåller den snävare
 * inferensen, så en glidning fälls utan att beviset görs luddigare.
 */
function person(i: number) {
  const namn = `Person ${String(i).padStart(2, '0')}`;
  return {
    id: `recPERSONTEST${String(i).padStart(7, '0')}`,
    namn,
    fornamn: 'Person',
    efternamn: String(i).padStart(2, '0'),
    email: `person.${String(i).padStart(2, '0')}@example.test`,
    telefon: null,
    ort: ['Skövde'],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar: null,
    antalAnmalningar: 1,
    antalDeltaganden: 0,
    erfarenhetsniva: null,
    erfarenhetsbadge: null,
    senasteInteraktion: null,
    senasteInteraktionDatum: null,
    dagarSedanSenaste: null,
    harAktivAnmalan: null,
    ejGodkandMail: false,
    radSkapad: null,
    anmalningIds: [],
    deltagandeIds: [],
  } satisfies z.infer<typeof PersonSchema>;
}

/** Större än `PAGE_SIZE` (50, `PersonsList.tsx`) — spänner över fönstergränsen. */
const REGISTER_ANTAL = 55;
const REGISTRET = Array.from({ length: REGISTER_ANTAL }, (_, i) => person(i));

const SOKFALT = 'Sök person';

test.describe('Personer-listan (TASK-286.2 — förladdat register, sök i klienten)', () => {
  // Överskuggningen läggs per test. `network` är test-scopad och byggs om för
  // varje test, så isoleringen är strukturell — inget städsteg krävs och nästa
  // test ser aldrig denna handler.
  test.beforeEach(async ({ network }) => {
    network.use(http.get(EF('get-persons'), () => json({ persons: REGISTRET })));
  });

  test('AC #2/#5 — 50 renderas initialt; "Ladda fler" avslöjar resten ur arrayen', async ({
    page,
  }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });
    const loadMore = page.getByRole('button', { name: 'Ladda fler' });

    // Fönster 1: 50 av 55, ingen skelettvisning kvar (första laddningen klar).
    await expect(list.getByRole('listitem')).toHaveCount(50);
    await expect(page.getByText(`Visar 50 av ${REGISTER_ANTAL} personer.`)).toBeVisible();
    await expect(loadMore).toBeVisible();

    // "Ladda fler" avslöjar de återstående 5 UR SAMMA i minnet laddade array —
    // synkront (ingen ny EF-rundtur, se filhuvudets AC #1-resonemang).
    await loadMore.click();
    await expect(list.getByRole('listitem')).toHaveCount(REGISTER_ANTAL);
    // A11y: aria-live annonserar antal NYA rader.
    await expect(page.getByText(`5 fler personer laddade, ${REGISTER_ANTAL} totalt.`)).toHaveCount(
      1,
    );
    // Sista sidan nådd — knappen försvinner, fokus flyttas till statusraden.
    await expect(loadMore).toHaveCount(0);
    await expect(
      page.getByText(`Visar ${REGISTER_ANTAL} av ${REGISTER_ANTAL} personer.`),
    ).toBeFocused();
  });

  test('AC #1 — noll nätverksanrop vid skrivning i sökrutan (konstgjord fördröjning)', async ({
    page,
    network,
  }) => {
    network.use(
      http.get(EF('get-persons'), async () => {
        await delay(4000);
        return json({ persons: REGISTRET });
      }),
    );

    await page.goto('/personer');
    // Vänta ut FÖRSTA (och enda tillåtna) laddningen.
    await expect(page.getByText(`Visar 50 av ${REGISTER_ANTAL} personer.`)).toBeVisible({
      timeout: 6000,
    });

    // Ett EVENTUELLT nytt anrop hade tagit minst 4 s (samma fördröjning) —
    // denna assertion ges medvetet en KORT timeout, långt under det, så att
    // en regression som återinför ett anrop per tecken FÄLLER testet i
    // stället för att bara göra det långsammare.
    await page.getByRole('searchbox', { name: SOKFALT }).fill('Person 00');
    await expect(page.getByText('Visar 1 av 1 personer för "Person 00".')).toBeVisible({
      timeout: 500,
    });
  });

  test('AC #3/#6 — sökning filtrerar i klienten och skriver ?q (debounced)', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText(`Visar 50 av ${REGISTER_ANTAL} personer.`)).toBeVisible();

    await page.getByRole('searchbox', { name: SOKFALT }).fill('Person 00');

    await expect(page).toHaveURL(/[?&]q=Person/);
    await expect(page.getByText('Visar 1 av 1 personer för "Person 00".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(1);
  });

  test('AC #6 — sökningen återställs vid omladdning (?q i adressen)', async ({ page }) => {
    await page.goto('/personer?q=Person%2000');

    await expect(page.getByRole('searchbox', { name: SOKFALT })).toHaveValue('Person 00');
    await expect(page.getByText('Visar 1 av 1 personer för "Person 00".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(1);
  });

  test('tom sökning ger "Inga träffar"', async ({ page }) => {
    await page.goto('/personer');
    await page.getByRole('searchbox', { name: SOKFALT }).fill('Finnsinte');
    // k11 rev tomläget: den gamla grå metaraden (`Inga träffar för "X".`) såg
    // ut som om sidan gått sönder tyst. Formen är nu ett strukturerat,
    // centrerat tomläge — en bärande rad + en dämpad förklaring. BÅDA
    // asserteras, så en halv rendering inte passerar som grön.
    await expect(page.getByText('Inga träffar')).toBeVisible();
    await expect(page.getByText('Ingen person matchar "Finnsinte".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(0);
  });

  test('AC #8 — axe 0 violations på den renderade listan', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText(`Visar 50 av ${REGISTER_ANTAL} personer.`)).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

/**
 * SVENSK SORTERING (TASK-286.3 AC #1, ADR-123 beslut 4) — EGEN describe med
 * EGEN fixtur, av samma skäl som läs-felet nedan: blocket ovan lägger sin
 * register-överskuggning i en `beforeEach`, och ett bevis som vilar på
 * handler-precedens i stället för på att bara EN handler finns är ett
 * svagare bevis.
 *
 * FIXTUREN ÄR VALD MOT DET SOM KAN GÅ FEL, inte mot det som är lätt att
 * skriva. Den levereras i AIRTABLES ordning (`Namn`-asc, samma ordning EF:en
 * faktiskt returnerar) — där Å ligger bland A:na och sentinelen på sin
 * alfabetiska plats. Renderas den ordningen rakt av är testet rött. Bara en
 * verklig `Intl.Collator('sv')` i klienten ger den förväntade ordningen.
 */
const SORTERINGSFIXTUR = [
  // Airtables ordning: Å bland A (fälla 51), sentinelen mellan Bo och Östen.
  'Anna Andersson',
  'Åsa Ask',
  'Bo Berg',
  'Ej tillgängligt',
  'Örjan Öman',
  'Ärla Älv',
].map((namn, i) => ({ ...person(i), id: `recSORT${String(i).padStart(9, '0')}`, namn }));

/** A till Z, sedan Å, Ä, Ö — och sentinelen sist, ur sin alfabetiska plats. */
const FORVANTAD_ORDNING = [
  'Anna Andersson',
  'Bo Berg',
  'Åsa Ask',
  'Ärla Älv',
  'Örjan Öman',
  'Ej tillgängligt',
];

test.describe('Personer-listan — svensk sortering (TASK-286.3)', () => {
  test.beforeEach(async ({ network }) => {
    network.use(http.get(EF('get-persons'), () => json({ persons: SORTERINGSFIXTUR })));
  });

  test('AC #1 — A till Z, sedan Å, Ä, Ö, med namnlös-sentinelen sist', async ({ page }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });
    await expect(list.getByRole('listitem')).toHaveCount(FORVANTAD_ORDNING.length);

    // Länkens tillgängliga namn ÄR radens namn — samma nyckel sorteringen
    // använder (`personVisningsnamn`), så ordningen som mäts är den Lotta ser.
    await expect(list.getByRole('link')).toHaveText(FORVANTAD_ORDNING);
  });

  test('AC #1 — sorteringen överlever en sökning: filtrering bevarar ordningen', async ({
    page,
  }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });
    await expect(list.getByRole('listitem')).toHaveCount(FORVANTAD_ORDNING.length);

    // SÖKTERMEN ÄR VALD FÖR ATT VARA DIAKRITIK-NEUTRAL, och det är ingen
    // slump: `TASK-286.5` beslutades JA (Marcus 2026-08-22) och `TASK-286.7`
    // GENOMFÖRDE breddningen — sökningen ÄR nu diakritik-tolerant. En term
    // som "ä" hade fungerat före bytet och blivit röd efter (tolerant
    // matchning låter "ä" träffa även a/å — mätt: "ä" ger alla sex rader mot
    // denna fixtur), och sett ut som en sorteringsregression fast sorteringen
    // var orörd. Detta test äger SORTERINGEN, inte sökningens
    // diakritik-semantik, och ska inte kunna fällas av den.
    //
    // FÖRUTSÄGELSEN HÖLL: raden nedan var grön både före och efter
    // TASK-286.7, utan en enda ändring i detta block.
    //
    // TERMEN MÅSTE UNDVIKA ALLA FYRA SÖKFÄLTEN utom namnet, och det brände
    // ett första försök: `person()`-fabrikens e-post är `person.NN@example.test`,
    // så bokstäverna i "person", "example" och "test" träffar VARENDA rad
    // oavsett namn (ett försök med "n" gav alla sex). Orten är "Skövde".
    // Kvar som säkra är bland andra b, c, f, g, h, i, j, q, u, w, y, z.
    //
    // "j" träffar exakt två: "Ej tillgängligt" och "Örjan Öman". Ingen svensk
    // diakritisk bokstav normaliseras till j, så mängden är densamma före och
    // efter TASK-286.5.
    //
    // Och paret är valt så att ordningen faktiskt PRÖVAS: fixturen LEVERERAR
    // dem som sentinelen först, Örjan sedan — sorterat ska de komma i omvänd
    // ordning. En filtrering som tappat sorteringen, eller som filtrerar det
    // OSORTERADE registret, ger alltså exakt fel ordning här.
    await page.getByRole('searchbox', { name: SOKFALT }).fill('j');
    await expect(list.getByRole('link')).toHaveText(['Örjan Öman', 'Ej tillgängligt']);
  });

  test('AC #2 — räknarraden räknas ur arrayen, både N och TOTAL', async ({ page }) => {
    await page.goto('/personer');
    // Hela registret ryms i render-fönstret (6 < PAGE_SIZE 50) → N === TOTAL.
    await expect(
      page.getByText(`Visar ${FORVANTAD_ORDNING.length} av ${FORVANTAD_ORDNING.length} personer.`),
    ).toBeVisible();

    // Vid sökning är TOTAL träffantalet, inte registrets längd — det är vad
    // "Visar N av TOTAL personer" betyder på en filtrerande yta.
    //
    // Samma diakritik-neutrala term som testet ovan, av samma skäl
    // (TASK-286.5 beslutad JA, genomförd i TASK-286.7): räknarraden ska mätas
    // mot arrayen, inte mot en sök-semantik som ändrades under tiden.
    await page.getByRole('searchbox', { name: SOKFALT }).fill('j');
    await expect(page.getByText('Visar 2 av 2 personer för "j".')).toBeVisible();
  });
});

/**
 * Läs-felet — EGEN describe, INTE en test i blocket ovan. Det blocket lägger sin
 * lyckade sid-överskuggning i en `beforeEach` som gäller alla dess tester; en
 * andra `network.use()` inuti testkroppen hade visserligen vunnit (`use()`
 * prependar, första träffen vinner — `hermetic.ts` § PRECEDENSEN), men beviset
 * hade då vilat på en ordningsregel i stället för på att bara EN handler finns.
 */
test.describe('Personer-listan — läs-fel (get-persons 500)', () => {
  test('500 → felytan visas; varken laddläge eller falsk tom lista blir kvar', async ({
    page,
    network,
  }) => {
    // Kroppen är EF:ens felform (`{ error, requestId }`,
    // supabase/functions/_shared/errors.ts) — samma form `edgeFunctionError`
    // parsar skarpt. En rå sträng hade gett ett annat `message` än produktion.
    network.use(
      http.get(EF('get-persons'), () =>
        json({ error: 'Internal error', requestId: 'req-personer-500' }, 500),
      ),
    );

    await page.goto('/personer');

    // TIMEOUTEN ÄR RÄKNAD OCH MÄTT, INTE ÄRVD. 500 är retry-bart i BÅDA lagren:
    // `fetchWithRetry` gör 4 HTTP-försök per anrop (sleep 200/400/800 ms +
    // jitter, `src/data/utils.ts`) och QueryClientens `retry: 3` +
    // `retryDelay` 200/400/800 (`src/router.ts:18`, gäller `useQuery` exakt
    // som `useInfiniteQuery` tidigare — retry-logiken är en global
    // QueryClient-default, oberoende av vilken hook som frågar).
    // PersonsList har INGEN egen 4xx-undantagsgren som Waitlist/Anteckningar —
    // ingen statuskod ger en genväg förbi kedjan. Felytan kan alltså först dyka
    // upp efter 16 förfrågningar.
    //
    // KONSTRUERAT VÄRSTA FALL, enbart sömnerna: 4 × 1700 + 1400 = 8200 ms
    // (bästa fall 4 × 1400 + 1400 = 7000 ms) — plus 16 round-trips. Jittret är
    // `Math.random() * (baseDelay / 2)` med `baseDelay = 200`, alltså KONSTANT
    // 0–100 ms per sömn: det skalar INTE med den exponentiella delayen. Därav
    // 1400 + 3 × 100 = 1700 ms per anrop.
    //
    // MÄTT lokalt (darwin, 5 isolerade körningar): 7901 · 7904 · 7916 · 7941 ·
    // 8401 ms. Under full svit steg testets totaltid 9,3 → 10,2 s.
    //
    // DÄRFÖR 20 s OCH INTE 12 s: 12 s ligger bara 3,8 s över det konstruerade
    // värsta fallet, före CI:s långsammare runner och parallell workerlast.
    // 20 s ryms med marginal under Playwrights test-timeout på 30 s (config
    // sätter ingen egen), så ett trasigt felläge fäller fortfarande på
    // assertionen och inte på testramen.
    const alert = page.getByRole('alert').filter({ hasText: 'Kunde inte hämta personer' });
    await expect(alert).toBeVisible({ timeout: 20_000 });
    // Fel-ID:t når användaren → support kan binda vyn mot EF-loggen
    // (EdgeFunctionError.requestId).
    await expect(alert).toContainText('req-personer-500');

    // Fastnade INTE i laddläget — den ena felformen felytan finns för att utesluta.
    await expect(page.getByText('Laddar personer…')).toHaveCount(0);

    // Ser INTE ut som "det finns inga personer" — den andra, farligare felformen:
    // ett tomt svar och ett trasigt svar får aldrig se likadana ut för Lotta.
    await expect(page.getByText('Inga personer ännu')).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Personer' })).toHaveCount(0);

    // Felet bärs av KOMPONENTENS egen gren, inte av route-ErrorBoundaryn:
    // sökfältet står kvar. Utan denna assertion vore testet grönt även om
    // PersonsList kastade och SectionError tog över — en helt annan yta.
    await expect(page.getByRole('searchbox', { name: SOKFALT })).toBeVisible();
  });
});

/**
 * BOKSTAVSRADEN (TASK-283.2) — EGET describe med EGEN fixtur, av samma skäl
 * som sorterings-blocket ovan: registret bakom bokstavsraden ska bevisa
 * hinkarna, inte råka fungera på en fixtur som byggdes för paginering.
 *
 * FIXTUREN BÄR DE SVÅRA FALLEN, och PRD:ns testbeslut räknar upp dem:
 *
 *   - minst en person per bokstav som ska vara aktiv  → A, B, E, K (två), Å
 *   - minst en bokstav UTAN personer                  → Q, Ä, Ö (och 21 till)
 *   - minst TVÅ namnlösa                              → två `Ej tillgängligt`
 *   - minst ett namn som börjar på Å                  → `Åsa Ask`
 *
 * Utan Å-posten kan den diakritik-korrekta hinkjämförelsen inte fällas, och
 * utan de två sentinel-posterna kan E-undantaget (fälla 43/51) inte bevisas:
 * strängen `Ej tillgängligt` börjar bokstavligen på E, och ett naivt
 * E-filter hade dragit med sig samtliga 186 av prods 559.
 *
 * TVÅ på K är inte pynt: en hink som råkar returnera "första träffen" i
 * stället för "alla i hinken" är grön mot en ensam post.
 */
const BOKSTAVSFIXTUR = [
  'Anna Andersson',
  'Bo Berg',
  'Emma Eklund',
  'Ej tillgängligt',
  'Kalle Karlsson',
  'Karin Krona',
  'Åsa Ask',
  'Ej tillgängligt',
].map((namn, i) => ({ ...person(i), id: `recBOKSTAV${String(i).padStart(6, '0')}`, namn }));

const RADENS_ETIKETT = 'Filtrera på första bokstaven';

/** De 29 bokstäverna plus hinken sist — radens fulla, oföränderliga längd. */
const RADENS_TEXT = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Å', 'Ä', 'Ö', 'Utan namn'];

/** Samma rad, sedd som en skärmläsare ser den. */
const RADENS_NAMN = [
  ...[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Å', 'Ä', 'Ö'].map(
    (b) => `Visa personer som börjar på ${b}`,
  ),
  'Visa personer utan namn',
];

test.describe('Personer-listan — bokstavsraden (TASK-283.2)', () => {
  test.beforeEach(async ({ network }) => {
    network.use(http.get(EF('get-persons'), () => json({ persons: BOKSTAVSFIXTUR })));
  });

  /** Radens knappar, i DOM-ordning. */
  const raden = (page: Page) => page.getByRole('toolbar', { name: RADENS_ETIKETT });

  test('AC #1 — raden ligger under sökrutan i ordningen A till Ö, hinken sist', async ({
    page,
  }) => {
    await page.goto('/personer');
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();

    // ORDNINGEN mäts som en LISTA, inte som 30 enskilda närvaro-assertions:
    // en rad där Ö råkat hamna före Å hade passerat det senare.
    await expect(raden(page).getByRole('button')).toHaveText(RADENS_TEXT);

    // ... och samma ordning i det TILLGÄNGLIGA namnet. Två assertions, inte en:
    // etiketten är det en skärmläsare läser upp, den synliga texten är det
    // ögat läser, och WCAG 2.5.3 (Label in Name) kräver att den ena rymmer
    // den andra. Glider de isär ska det synas här.
    const namn = await raden(page)
      .getByRole('button')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
    expect(namn).toEqual(RADENS_NAMN);

    // "Direkt under sökrutan" — DOM-ordningen är den ordning både ögat och
    // skärmläsaren läser, så den ÄR påståendet. Mätt som positionen i ytans
    // egen ordning, inte som en pixelkoordinat.
    const ordning = await page.getByTestId('personer-yta').evaluate((yta) => {
      const sok = yta.querySelector('input[type="search"]');
      const rad = yta.querySelector('[role="toolbar"]');
      if (!sok || !rad) return 'saknas';
      return sok.compareDocumentPosition(rad) & Node.DOCUMENT_POSITION_FOLLOWING
        ? 'raden-efter-sokrutan'
        : 'raden-fore-sokrutan';
    });
    expect(ordning).toBe('raden-efter-sokrutan');
  });

  test('AC #11 — ett tryck filtrerar den laddade arrayen och räknarraden följer med', async ({
    page,
  }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });
    await expect(list.getByRole('listitem')).toHaveCount(8);

    await raden(page).getByRole('button', { name: 'Visa personer som börjar på K' }).click();

    await expect(list.getByRole('link')).toHaveText(['Kalle Karlsson', 'Karin Krona']);
    await expect(page.getByText('Visar 2 av 2 personer.')).toBeVisible();
  });

  test('AC #2 — ett andra tryck på samma bokstav släpper filtret', async ({ page }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });
    const kKnapp = raden(page).getByRole('button', { name: 'Visa personer som börjar på K' });

    await kKnapp.click();
    await expect(list.getByRole('listitem')).toHaveCount(2);

    await kKnapp.click();
    await expect(list.getByRole('listitem')).toHaveCount(8);
    // Filtret släppte HELT: parametern lämnar adressen, den blir inte tom.
    await expect(page).not.toHaveURL(/[?&]bokstav=/);
  });

  test('AC #3 — vald bokstav bär aria-pressed, och bara den', async ({ page }) => {
    await page.goto('/personer');
    const kKnapp = raden(page).getByRole('button', { name: 'Visa personer som börjar på K' });
    const aKnapp = raden(page).getByRole('button', { name: 'Visa personer som börjar på A' });

    await expect(kKnapp).toHaveAttribute('aria-pressed', 'false');

    await kKnapp.click();
    await expect(kKnapp).toHaveAttribute('aria-pressed', 'true');
    await expect(aKnapp).toHaveAttribute('aria-pressed', 'false');

    // APG:s toggle-krav: etiketten byter ALDRIG med tillståndet. Hade den gjort
    // det skulle en skärmläsaranvändare höra en annan knapp än den hen tryckte.
    await expect(kKnapp).toHaveText('K');
  });

  test('DoD #7 — sentinelen är undantagen ur E och bor i sin egen hink', async ({ page }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });

    // E ger bara det verkliga E-namnet. Skulle sentinelen läcka in vore det
    // TRE rader här, och i prod 186 stycken.
    await raden(page).getByRole('button', { name: 'Visa personer som börjar på E' }).click();
    await expect(list.getByRole('link')).toHaveText(['Emma Eklund']);

    // ... och båda sentinel-posterna finns kvar, i hinken.
    await raden(page).getByRole('button', { name: 'Visa personer utan namn' }).click();
    await expect(list.getByRole('link')).toHaveText(['Ej tillgängligt', 'Ej tillgängligt']);
  });

  test('hinkjämförelsen är diakritik-korrekt: Å är inte A', async ({ page }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });

    // Basens SORTERING veckar Å mot A (fälla 51) och sökningen viker å mot a
    // (TASK-286.7). Hinken gör VARKEN — det är modulens tredje axel.
    await raden(page).getByRole('button', { name: 'Visa personer som börjar på A' }).click();
    await expect(list.getByRole('link')).toHaveText(['Anna Andersson']);

    await raden(page).getByRole('button', { name: 'Visa personer som börjar på Å' }).click();
    await expect(list.getByRole('link')).toHaveText(['Åsa Ask']);
  });

  test('AC #4 — bokstav och fritext smalnar av TILLSAMMANS', async ({ page }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });

    await raden(page).getByRole('button', { name: 'Visa personer som börjar på K' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(2);

    // "arin" finns varken i fabrikens e-post (`person.NN@example.test`) eller i
    // orten (`Skövde`) — den kan alltså bara träffa via namnet, vilket är vad
    // som gör kombinationen mätbar.
    await page.getByRole('searchbox', { name: SOKFALT }).fill('arin');
    await expect(list.getByRole('link')).toHaveText(['Karin Krona']);
    await expect(page.getByText('Visar 1 av 1 personer för "arin".')).toBeVisible();
  });

  test('AC #4 — tomt utfall ger TOMLÄGET, aldrig en tom sida', async ({ page }) => {
    await page.goto('/personer');

    // (a) Bokstav UTAN träffar. Den gamla grenen läste bara söktermen och hade
    //     svarat "Personer dyker upp här när någon anmäler sig" — osant när
    //     Lotta just tryckt på Ö.
    //
    //     [UPPDATERAD, TASK-283.3] Vägen HIT är en annan sedan tomma bokstäver
    //     tonas ned: Ö har inga personer i fixturen, så knappen går inte
    //     längre att trycka på (det är 283.3 AC #1). Tillståndet är däremot
    //     inte borta — det nås via URL:en, som ett bokmärke eller en delad
    //     länk, och tomlägets copy måste vara lika sann då. Att i stället
    //     byta testet till en FYLLD bokstav hade tappat täckningen helt,
    //     eftersom en fylld bokstav per definition inte ger ett tomläge.
    await page.goto('/personer?bokstav=%C3%96');
    await expect(page.getByText('Inga träffar')).toBeVisible();
    await expect(page.getByText('Ingen person börjar på Ö.')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' })).toHaveCount(0);

    // (b) Bokstav PLUS fritext utan träffar — båda fasetterna i beskedet.
    await raden(page).getByRole('button', { name: 'Visa personer som börjar på K' }).click();
    await page.getByRole('searchbox', { name: SOKFALT }).fill('zzz');
    await expect(page.getByText('Ingen person på K matchar "zzz".')).toBeVisible();

    // (c) Hinken utan träffar läses som en mening, inte som sitt tekniska värde.
    await page.getByRole('searchbox', { name: SOKFALT }).fill('');
    await raden(page).getByRole('button', { name: 'Visa personer utan namn' }).click();
    await page.getByRole('searchbox', { name: SOKFALT }).fill('zzz');
    await expect(page.getByText('Ingen person utan namn matchar "zzz".')).toBeVisible();
  });

  test('AC #5 — valet lever i URL:en och överlever öppna-person-och-backa', async ({ page }) => {
    await page.goto('/personer');
    await raden(page).getByRole('button', { name: 'Visa personer som börjar på K' }).click();
    await expect(page).toHaveURL(/[?&]bokstav=K/);

    // Öppna en person ...
    await page.getByRole('link', { name: 'Kalle Karlsson' }).click();
    await expect(page).toHaveURL(/\/personer\/recBOKSTAV/);

    // ... och backa: SAMMA filtrerade lista, inte hela registret.
    await page.goBack();
    await expect(page).toHaveURL(/[?&]bokstav=K/);
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('link')).toHaveText([
      'Kalle Karlsson',
      'Karin Krona',
    ]);
    await expect(
      raden(page).getByRole('button', { name: 'Visa personer som börjar på K' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('AC #5 — en direkt-URL med ?bokstav återställer läget', async ({ page }) => {
    await page.goto('/personer?bokstav=utan-namn');
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('link')).toHaveText([
      'Ej tillgängligt',
      'Ej tillgängligt',
    ]);
    await expect(
      raden(page).getByRole('button', { name: 'Visa personer utan namn' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('ett skräpvärde i ?bokstav ger hela listan, inte en tom', async ({ page }) => {
    // Ett gammalt bokmärke eller en handredigerad adress får aldrig se ut som
    // "det finns inga personer" — det är det tystare av de två felen.
    await page.goto('/personer?bokstav=xyz');
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(8);
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();
  });

  test('AC #6 — hela raden är ETT tabbsteg, och pilarna rör sig inuti den', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();

    const forsta = raden(page).getByRole('button', { name: 'Visa personer som börjar på A' });
    const andra = raden(page).getByRole('button', { name: 'Visa personer som börjar på B' });

    // Ett steg IN: från sökrutan landar Tab på radens första knapp.
    await page.getByRole('searchbox', { name: SOKFALT }).focus();
    await page.keyboard.press('Tab');
    await expect(forsta).toBeFocused();

    // Pilarna manövrerar INUTI raden (APG:s toolbar-mönster).
    await page.keyboard.press('ArrowRight');
    await expect(andra).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(forsta).toBeFocused();

    // Ett steg UT: nästa Tab lämnar raden HELT — inte till knapp nummer två.
    // Mätt på var fokus FAKTISKT hamnade, inte på vilken knapp som slapp
    // fokus: 30 negativa assertions hade varit gröna även om fokus stannat
    // kvar på en 31:a kontroll inuti raden.
    await page.keyboard.press('Tab');
    const fokusInutiRaden = await page.evaluate(
      () => document.activeElement?.closest('[role="toolbar"]') != null,
    );
    expect(fokusInutiRaden).toBe(false);
  });

  /**
   * AC #7 + DoD #6 — MÄTT I RENDERAD YTA, aldrig läst ur en klass.
   *
   * Tre bredder, var och en med ett eget skäl:
   *   320 px — WCAG 2.2 SC 1.4.10:s egen siffra, och appens smalaste fall.
   *   375 px — iPhone SE/13 mini stående, den vanligaste telefonbredden.
   *  1280 px — skrivbord. Tas med för att `AppShell.tsx:45` kapar
   *            innehållskolumnen vid `max-w-[600px]`, så raden bryts även
   *            HÄR. Utan detta fallet hade en läsare kunnat tro att
   *            radbrytningen var ett rent mobilfenomen.
   */
  for (const viewport of [320, 375, 1280]) {
    test(`AC #7 / DoD #6 — träffytan mätt i renderad yta vid ${viewport} px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport, height: 900 });
      await page.goto('/personer');
      await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();

      const rutor = await raden(page)
        .getByRole('button')
        .evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { hoger: r.right, bredd: r.width, hojd: r.height, rad: Math.round(r.y) };
          }),
        );

      expect(rutor).toHaveLength(RADENS_TEXT.length);

      // WCAG 2.5.8 Target Size (Minimum), nivå AA: 24 x 24 CSS-px.
      // MÄTT är 28 x 28; assertionen låser GOLVET, inte det exakta talet, så
      // en medveten storleksjustering inte behöver röra testet — men en
      // regression under golvet fäller.
      for (const ruta of rutor) {
        expect(ruta.bredd).toBeGreaterThanOrEqual(24);
        expect(ruta.hojd).toBeGreaterThanOrEqual(24);
      }

      // VALET, LÅST: radbrytning — INTE en horisontellt rullande behållare.
      // Ingen knapp når utanför viewporten, och raden ligger på fler än en
      // y-position. Byts formen till en scroll-container fälls den ena eller
      // den andra av dessa två.
      expect(Math.max(...rutor.map((r) => r.hoger))).toBeLessThanOrEqual(viewport);
      expect(new Set(rutor.map((r) => r.rad)).size).toBeGreaterThan(1);

      // Och SIDAN rullar aldrig i sidled av raden (WCAG 2.2 SC 1.4.10).
      const sidbredd = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        klient: document.documentElement.clientWidth,
      }));
      expect(sidbredd.scroll).toBeLessThanOrEqual(sidbredd.klient);

      test.info().annotations.push({
        type: 'matning',
        description: `${viewport} px: ${rutor.length} knappar, ${new Set(rutor.map((r) => r.rad)).size} rader, minsta träffyta ${Math.min(...rutor.map((r) => r.bredd))}x${Math.min(...rutor.map((r) => r.hojd))} px`,
      });
    });
  }

  test('AC #9 — axe 0 violations med ett bokstavsfilter valt', async ({ page }) => {
    await page.goto('/personer');
    await raden(page).getByRole('button', { name: 'Visa personer som börjar på K' }).click();
    await expect(page.getByText('Visar 2 av 2 personer.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('ADR-078 — raden finns redan i laddläget, så listan aldrig hoppar', async ({
    page,
    network,
  }) => {
    // Raden har SAMMA GEOMETRI i alla tre grenarna. Hade den monterats först
    // när registret landade skulle listan flyttats nedåt vid varje sidladdning
    // — precis det layouthopp ADR-078 förbjuder. [TASK-283.3] Nedtoningen
    // ändrar färg på knappar, aldrig antalet: räkningen nedan är därför
    // oförändrad, och att INGEN knapp tonas ned under laddning har sitt eget
    // fall i 283.3-blocket längre ned.
    network.use(
      http.get(EF('get-persons'), async () => {
        await delay(3000);
        return json({ persons: BOKSTAVSFIXTUR });
      }),
    );

    await page.goto('/personer');
    await expect(page.getByText('Laddar personer…')).toBeAttached();
    await expect(raden(page).getByRole('button')).toHaveCount(RADENS_TEXT.length);
  });
});

/**
 * NEDTONADE BOKSTÄVER (TASK-283.3) — samma fixtur som blocket ovan, och det
 * är avsiktligt: `BOKSTAVSFIXTUR` byggdes redan av TASK-283.2 med raden
 * *"minst en bokstav UTAN personer → Q, Ä, Ö (och 21 till)"*, vilket är exakt
 * det kortets AC #5 kräver. Att bygga en andra fixtur för samma egenskap hade
 * bara gett två sanningar att hålla i synk.
 *
 * FIXTURENS FACIT, räknat ur namnen (`Anna`, `Bo`, `Emma`, `Ej tillgängligt`,
 * `Kalle`, `Karin`, `Åsa`, `Ej tillgängligt`):
 *
 *   fyllda   A · B · E · K · Å · Utan namn        6 av 30
 *   tomma    de övriga 24, däribland Q, Ä och Ö
 *
 * AC #5 låses av `FYLLDA` nedan tillsammans med räkningen i första testet:
 * krymper fixturen så att varje bokstav får en person blir de testerna röda,
 * i stället för tyst meningslösa.
 */

/** Hinkarna som HAR minst en person i `BOKSTAVSFIXTUR`. Allt annat tonas ned. */
const FYLLDA = [
  'Visa personer som börjar på A',
  'Visa personer som börjar på B',
  'Visa personer som börjar på E',
  'Visa personer som börjar på K',
  'Visa personer som börjar på Å',
  'Visa personer utan namn',
];

test.describe('Personer-listan — nedtonade bokstäver (TASK-283.3)', () => {
  test.beforeEach(async ({ network }) => {
    network.use(http.get(EF('get-persons'), () => json({ persons: BOKSTAVSFIXTUR })));
  });

  const raden = (page: Page) => page.getByRole('toolbar', { name: RADENS_ETIKETT });

  /**
   * Hela radens nedtoningstillstånd som ETT värde: etikett → `aria-disabled`.
   *
   * Mäts som en karta och inte som enskilda assertions därför att AC #2:s
   * fråga är "rörde sig NÅGOT?" — och 30 separata påståenden kan alla vara
   * gröna medan den 31:a knappen bytt tillstånd osett.
   */
  const nedtoningskarta = (page: Page) =>
    raden(page)
      .getByRole('button')
      .evaluateAll((els) =>
        Object.fromEntries(
          els.map((el) => [el.getAttribute('aria-label') ?? '', el.getAttribute('aria-disabled')]),
        ),
      );

  test('AC #1 + AC #5 — tomma bokstäver tonas ned, fyllda gör det inte', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();

    const karta = await nedtoningskarta(page);
    expect(Object.keys(karta)).toHaveLength(RADENS_TEXT.length);

    const aktiva = Object.keys(karta).filter((namn) => karta[namn] === 'false');
    const nedtonade = Object.keys(karta).filter((namn) => karta[namn] === 'true');

    expect([...aktiva].sort()).toEqual([...FYLLDA].sort());

    // AC #5: fixturen MÅSTE bära minst en tom bokstav, annars bevisar sviten
    // ingenting. Den bär 24 — och de tre kortet namnger vid namn.
    expect(nedtonade).toHaveLength(RADENS_TEXT.length - FYLLDA.length);
    expect(nedtonade).toContain('Visa personer som börjar på Q');
    expect(nedtonade).toContain('Visa personer som börjar på Ä');
    expect(nedtonade).toContain('Visa personer som börjar på Ö');
  });

  test('AC #1 — ett tryck på en nedtonad bokstav gör ingenting alls', async ({ page }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });
    await expect(list.getByRole('listitem')).toHaveCount(8);

    // `force: true` MED AVSIKT. Playwrights egen aktiverbarhets-kontroll
    // behandlar `aria-disabled` som "inte klickbar", så ett vanligt `click()`
    // hade bevisat att PLAYWRIGHT vägrar — inte att VÅR spärr håller. Med
    // force går ett verkligt klick-event hela vägen fram till elementet, och
    // det som mäts är komponentens `onClick`-retur.
    await raden(page)
      .getByRole('button', { name: 'Visa personer som börjar på Ö' })
      .click({ force: true });

    await expect(page).not.toHaveURL(/[?&]bokstav=/);
    await expect(list.getByRole('listitem')).toHaveCount(8);
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();
  });

  test('AC #2 — nedtoningen rör sig INTE när Lotta skriver', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();
    const fore = await nedtoningskarta(page);

    await page.getByRole('searchbox', { name: SOKFALT }).fill('karl');
    await expect(page.getByText('Visar 1 av 1 personer för "karl".')).toBeVisible();

    // KORTETS ICKE FÖRHANDLINGSBARA RAD. Vore nedtoningen bunden till
    // söktermen hade 29 av 30 knappar slocknat här, och raden hade flimrat
    // vid varje tangenttryck.
    expect(await nedtoningskarta(page)).toEqual(fore);

    // Spetsen på samma sak: A står kvar TÄND fast ingen Anna är kvar i listan.
    const aKnapp = raden(page).getByRole('button', { name: 'Visa personer som börjar på A' });
    await expect(aKnapp).toHaveAttribute('aria-disabled', 'false');

    // ... och den går fortfarande att trycka på, vilket är hela poängen:
    // bokstaven byter fasett i stället för att vara en återvändsgränd.
    await aKnapp.click();
    await expect(page).toHaveURL(/[?&]bokstav=A/);
  });

  test('AC #2 — nedtoningen rör sig INTE heller när ett bokstavsfilter väljs', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();
    const fore = await nedtoningskarta(page);

    await raden(page).getByRole('button', { name: 'Visa personer som börjar på K' }).click();
    await expect(page.getByText('Visar 2 av 2 personer.')).toBeVisible();

    // K var redan tänd, så kartan ska vara BYTE FÖR BYTE densamma — filtret
    // smalnar av listan, aldrig raden.
    expect(await nedtoningskarta(page)).toEqual(fore);
  });

  test('AC #4 — en nedtonad bokstav nås med piltangent och är märkt otillgänglig', async ({
    page,
  }) => {
    await page.goto('/personer');
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();

    const a = raden(page).getByRole('button', { name: 'Visa personer som börjar på A' });
    const c = raden(page).getByRole('button', { name: 'Visa personer som börjar på C' });

    await page.getByRole('searchbox', { name: SOKFALT }).focus();
    await page.keyboard.press('Tab');
    await expect(a).toBeFocused();

    // C har inga personer i fixturen. DETTA är skillnaden mot native
    // `disabled`: react-arias fokus-filter matchar `button:not([disabled])`
    // (`utils/isFocusable.mjs`) och hade hoppat rakt över bokstaven, så en
    // skärmläsaranvändare aldrig mött den. Med `aria-disabled` ligger den
    // kvar på pilresan och annonseras som nedtonad.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(c).toBeFocused();
    await expect(c).toHaveAttribute('aria-disabled', 'true');
    // APG:s toggle-krav gäller fortfarande: etiketten byter aldrig med läget.
    await expect(c).toHaveText('C');

    // ... och Enter på den gör ingenting. Tangentbordet behöver ingen egen
    // spärr — Enter på en `<button>` går genom samma `click`-event som musen.
    await page.keyboard.press('Enter');
    await expect(page).not.toHaveURL(/[?&]bokstav=/);
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();
  });

  test('AC #4 — knappen ligger KVAR i tillgänglighetsträdet, märkt otillgänglig', async ({
    page,
  }) => {
    await page.goto('/personer');
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();

    // Playwrights ariaSnapshot ÄR tillgänglighetsträdet. Vore knappen borta
    // ur trädet (`hidden`, `display:none`, `aria-hidden`) fanns ingen rad alls
    // att matcha — och `[disabled]` är den märkning kravet begär.
    const trad = await raden(page).ariaSnapshot();
    expect(trad).toContain('- button "Visa personer som börjar på Ö" [disabled]');
    expect(trad).toContain('- button "Visa personer som börjar på Ä" [disabled]');
    // Den fyllda grannen bär INTE märkningen — annars vore assertionen ovan
    // grön även om allt vore nedtonat.
    expect(trad).not.toContain('- button "Visa personer som börjar på A" [disabled]');
  });

  test('okänt är inte tomt — under laddning tonas INGEN bokstav ned', async ({ page, network }) => {
    network.use(
      http.get(EF('get-persons'), async () => {
        await delay(3000);
        return json({ persons: BOKSTAVSFIXTUR });
      }),
    );

    await page.goto('/personer');
    await expect(page.getByText('Laddar personer…')).toBeAttached();

    // Registret är OKÄNT, inte tomt. Hade laddläget tonat ned allt skulle
    // raden blivit en grå vägg som sedan tänds — ett flimmer i exakt den rad
    // kortet säger aldrig får flimra.
    const karta = await nedtoningskarta(page);
    expect(Object.values(karta)).toHaveLength(RADENS_TEXT.length);
    expect(Object.values(karta).every((v) => v === 'false')).toBe(true);
  });

  test('ett KÄNT tomt register tonar ned samtliga 30', async ({ page, network }) => {
    network.use(http.get(EF('get-persons'), () => json({ persons: [] })));

    await page.goto('/personer');
    await expect(page.getByText('Inga personer ännu')).toBeVisible();

    // Motsatsen till fallet ovan, och skälet till att `null` inte fick
    // representeras av en tom mängd: här VET vi att ingen bokstav har någon.
    const karta = await nedtoningskarta(page);
    expect(Object.values(karta).every((v) => v === 'true')).toBe(true);
  });

  test('en VALD men tom hink tonas aldrig ned — annars går filtret inte att släppa', async ({
    page,
  }) => {
    // Vägen hit är verklig: ett bokmärke på `?bokstav=Ö`, eller den sista
    // Ö-personen som tas bort medan filtret står kvar. Någon separat
    // rensa-knapp finns medvetet inte (TASK-283.2), så vore den valda knappen
    // inert vore adressfältet Lottas enda reträtt.
    await page.goto('/personer?bokstav=%C3%96');

    const oKnapp = raden(page).getByRole('button', { name: 'Visa personer som börjar på Ö' });
    await expect(oKnapp).toHaveAttribute('aria-pressed', 'true');
    await expect(oKnapp).toHaveAttribute('aria-disabled', 'false');
    await expect(page.getByText('Ingen person börjar på Ö.')).toBeVisible();

    await oKnapp.click();
    await expect(page).not.toHaveURL(/[?&]bokstav=/);
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(8);

    // ... och NU, när den inte längre är vald, tonas den ned igen.
    await expect(oKnapp).toHaveAttribute('aria-disabled', 'true');
  });

  /**
   * AC #3 — RADEN BYTER ALDRIG LÄNGD, MÄTT I RENDERAD YTA.
   *
   * Samma fem bredder som TASK-283.2 mätte, av samma skäl: `AppShell.tsx:45`
   * kapar innehållskolumnen vid 568 px, så raden bryts även på skrivbord och
   * 1280 px är därför inte ett duplikat av 768 px utan ett eget bevis.
   *
   * Mätningen är en HELGEOMETRI, inte en bredd: radens egen rect plus varje
   * knapps rect, som en sträng per knapp. Alla fyra tillstånden jämförs mot
   * det första. En regression som flyttade en enda knapp en halv pixel fälls
   * här, medan en assertion på enbart radens bredd hade släppt igenom den.
   */
  for (const viewport of [320, 375, 430, 768, 1280]) {
    test(`AC #3 — radens geometri står still vid tillståndsbyten, ${viewport} px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport, height: 900 });

      const geometri = async () => {
        const rad = await raden(page).evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, bredd: r.width, hojd: r.height };
        });
        const knappar = await raden(page)
          .getByRole('button')
          .evaluateAll((els) =>
            els.map((el) => {
              const r = el.getBoundingClientRect();
              return `${r.x},${r.y},${r.width},${r.height}`;
            }),
          );
        const sidan = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          klient: document.documentElement.clientWidth,
        }));
        return { rad, knappar, sidan };
      };

      await page.goto('/personer');
      await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();
      const utgang = await geometri();

      // Tillstånd 2: ett bokstavsfilter valt (K byter till det tryckta
      // utseendet — annan färg, samma låda).
      await raden(page).getByRole('button', { name: 'Visa personer som börjar på K' }).click();
      await expect(page.getByText('Visar 2 av 2 personer.')).toBeVisible();
      const medFilter = await geometri();

      // Tillstånd 3: filtret släppt, en sökterm med träffar.
      await raden(page).getByRole('button', { name: 'Visa personer som börjar på K' }).click();
      await page.getByRole('searchbox', { name: SOKFALT }).fill('karl');
      await expect(page.getByText('Visar 1 av 1 personer för "karl".')).toBeVisible();
      const medSokning = await geometri();

      // Tillstånd 4: tomläget — listan byts mot ett helt annat innehåll under
      // raden. Det är det hårdaste fallet, eftersom sidans höjd ändras mest.
      await page.getByRole('searchbox', { name: SOKFALT }).fill('zzz');
      await expect(page.getByText('Inga träffar')).toBeVisible();
      const iTomlage = await geometri();

      for (const [namn, matning] of [
        ['bokstavsfilter valt', medFilter],
        ['sökterm med träffar', medSokning],
        ['tomläge', iTomlage],
      ] as const) {
        expect(matning.rad, `radens rect ändrades i tillståndet: ${namn}`).toEqual(utgang.rad);
        expect(matning.knappar, `en knapps rect ändrades i tillståndet: ${namn}`).toEqual(
          utgang.knappar,
        );
      }

      // DoD #6 — golvet gäller ÄVEN de nedtonade knapparna. Mätt i renderad
      // yta, aldrig läst ur en klass.
      const rutor = utgang.knappar.map((s) => s.split(',').map(Number));
      for (const [, , bredd, hojd] of rutor) {
        expect(bredd).toBeGreaterThanOrEqual(24);
        expect(hojd).toBeGreaterThanOrEqual(24);
      }

      // Och sidan rullar aldrig i sidled (WCAG 2.2 SC 1.4.10), i något läge.
      for (const matning of [utgang, medFilter, medSokning, iTomlage]) {
        expect(matning.sidan.scroll).toBeLessThanOrEqual(matning.sidan.klient);
      }

      const rader = new Set(rutor.map(([, y]) => Math.round(y))).size;
      test.info().annotations.push({
        type: 'matning',
        description: `${viewport} px: raden ${utgang.rad.bredd}x${utgang.rad.hojd} px, ${rader} rad(er), minsta träffyta ${Math.min(...rutor.map(([, , b]) => b))}x${Math.min(...rutor.map(([, , , h]) => h))} px — identisk i alla fyra tillstånden`,
      });
    });
  }

  /**
   * NEDTONINGENS KONTRAST, MÄTT — inte antagen.
   *
   * En `aria-disabled`-knapp är fokuserbar, och en fokuserbar kontroll är
   * INTE undantagen WCAG 1.4.3 så som en inaktiv är. Det är priset för valet
   * i `PersonsList.tsx` § BokstavsKnapp, och det betalas här i stället för
   * att antas: färgen läses ur den renderade ytan, bakgrunden härleds genom
   * att gå uppåt till första opaka förälder, och kvoten räknas.
   */
  for (const lage of ['no-preference', 'more'] as const) {
    test(`nedtonad text klarar kontrastgolvet, prefers-contrast: ${lage}`, async ({ page }) => {
      // `reducedMotion` är INTE pynt här utan det som gör mätningen ärlig.
      // Knapparna bär `motion-safe:transition-colors`, så när registret
      // landar tonar 24 av dem över till sitt nedtonade utseende. En mätning
      // mitt i den övergången läser ett MELLANLÄGE — första försöket fångade
      // `rgba(245, 245, 243, 0.306)` som "egen bakgrund" och en textfärg som
      // ännu inte hunnit fram, och talen varierade mellan körningar.
      // `prefers-reduced-motion: reduce` släcker övergången helt, så det som
      // mäts är VILOLÄGET — de färger Lotta faktiskt sitter och tittar på.
      await page.emulateMedia({ contrast: lage, reducedMotion: 'reduce' });
      await page.goto('/personer');
      await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();

      const mat = (namn: string) =>
        raden(page)
          .getByRole('button', { name: namn })
          .evaluate((el) => {
            const kanal = (v: number) => {
              const s = v / 255;
              return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
            };
            const tal = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
            const lum = (c: number[]) =>
              0.2126 * kanal(c[0]) + 0.7152 * kanal(c[1]) + 0.0722 * kanal(c[2]);

            let bakgrund = [255, 255, 255];
            const kedja: string[] = [];
            for (let nod: Element | null = el; nod; nod = nod.parentElement) {
              const rutan = getComputedStyle(nod).backgroundColor;
              kedja.push(`${nod.tagName.toLowerCase()}=${rutan}`);
              const delar = tal(rutan);
              // Kräver FULL opacitet. En halvgenomskinlig yta är ingen
              // bakgrund att räkna kontrast mot — den släpper igenom det som
              // ligger under, och att läsa dess RGB och kasta alfan hade gett
              // ett tal som inte motsvarar någonting på skärmen.
              if (delar.length >= 3 && (delar.length < 4 || delar[3] >= 0.999)) {
                bakgrund = delar;
                break;
              }
            }
            const text = tal(getComputedStyle(el).color);
            const [hog, lag] = [lum(text), lum(bakgrund)].sort((a, b) => b - a);
            return {
              text: getComputedStyle(el).color,
              egenBakgrund: getComputedStyle(el).backgroundColor,
              bakgrund: `rgb(${bakgrund.slice(0, 3).join(', ')})`,
              kedja: kedja.join(' < '),
              nedtonad: el.getAttribute('aria-disabled'),
              vald: el.getAttribute('aria-pressed'),
              kvot: Math.round(((hog + 0.05) / (lag + 0.05)) * 100) / 100,
            };
          });

      const nedtonad = await mat('Visa personer som börjar på Ö');
      const aktiv = await mat('Visa personer som börjar på A');

      // Mätningen är bara meningsfull om de två knapparna FAKTISKT står i de
      // lägen namnen påstår. Utan denna kontroll hade testet kunnat jämföra
      // två aktiva knappar med varandra och rapportera det som en kontrast.
      expect(
        { nedtonad: nedtonad.nedtonad, aktiv: aktiv.nedtonad, url: page.url() },
        'fel utgångsläge — mätningen jämför inte nedtonad mot aktiv',
      ).toEqual({ nedtonad: 'true', aktiv: 'false', url: page.url() });

      // WCAG 1.4.3 (AA), normal text: 4,5:1.
      expect(nedtonad.kvot).toBeGreaterThanOrEqual(4.5);
      expect(aktiv.kvot).toBeGreaterThanOrEqual(4.5);

      // Nedtoningen måste förbli SYNLIG i båda lägena — en `contrast-more`
      // som lyfte den nedtonade texten hela vägen till den aktivas färg hade
      // uppfyllt kontrastkravet och samtidigt raderat informationen.
      expect(nedtonad.text).not.toBe(aktiv.text);

      test.info().annotations.push({
        type: 'matning',
        description: `prefers-contrast: ${lage} — nedtonad ${nedtonad.text} på ${nedtonad.bakgrund} = ${nedtonad.kvot}:1 · aktiv ${aktiv.text} på ${aktiv.bakgrund} = ${aktiv.kvot}:1`,
      });
      test.info().annotations.push({
        type: 'matning-bakgrund',
        description: `${lage} — nedtonad(aria-disabled=${nedtonad.nedtonad}, pressed=${nedtonad.vald}) egen bakgrund ${nedtonad.egenBakgrund}, kedja: ${nedtonad.kedja} || aktiv(aria-disabled=${aktiv.nedtonad}) egen bakgrund ${aktiv.egenBakgrund} @ ${page.url()}`,
      });
    });
  }

  test('axe 0 violations med nedtonade bokstäver i raden', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('Visar 8 av 8 personer.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
