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
 * TÄCKER INTE här (egna skarvar): AC #3 (parity mot EF:ens SEARCH()-formel) —
 * `tests/api/person-sok.test.ts` (pure) + `tests/api/
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
