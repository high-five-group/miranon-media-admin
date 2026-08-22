import AxeBuilder from '@axe-core/playwright';
import { delay, http } from 'msw';
import type { z } from 'zod';
import type { PersonSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

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
