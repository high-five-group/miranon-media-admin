import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * Fas 6a — Personer-listan (cursor-paginerad, ADR-056).
 *
 * ACCEPTANCE-KLASSEN (task-59.4, ADR-080): filen flyttades hit ur e2e-sviten
 * med hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade.
 * Klassningen är HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 9
 * restanrop, samtliga typsnitt, noll skarpa.
 *
 * **Deterministisk via `network.use()`** — en överskuggning på fixturvärldens
 * delade normalläge, inte `page.route`. Skälet är inte smak: page-routes prövas
 * FÖRE MSW:s context-routes, så en page.route-mock hade lagt en andra
 * avlyssningsmekanism ovanpå den fixturvärlden bär — precis den tudelning
 * task-54.2 tog bort. Mönstret byggs med `EF('get-persons')` ur
 * handlers-modulen: en egenskriven sträng som inte matchar faller igenom till
 * normalläget UTAN att något fälls, och testet ser då fixturens 17 personer i
 * stället för sina egna fem (den tysta fällan, `hermetic.ts` § Överskugga en
 * delad handler).
 *
 * VARFÖR EN ÖVERSKUGGNING ÖVER HUVUD TAGET, när normalläget redan bär en RIK
 * get-persons-resolver (`fixture-data.ts` § Personer-världen speglar EF:ens
 * search/pageSize/cursor mot 17 personer): testet asserterar EXAKTA
 * sidstorlekar (2 + 2 + 1) och en exakt träffmängd per sökterm. Mot normalläget
 * hade samma bevis blivit ett kopplat påstående om fixturens datamängd, och
 * varje ny fixturperson hade brutit tester som inte handlar om personer utan om
 * cursor-portens round-trip. Överskuggningen håller beviset vid BETEENDET.
 * Formen den svarar i är dock oförändrat EF:ens (`{ persons, nextCursor }`) —
 * snittet ligger kvar vid protokollet.
 *
 * Täckning: DoD 2 (vy mot data), DoD 3 (cursor-round-trip via "Ladda fler"),
 * DoD 4 (axe 0), DoD 5 (useInfiniteQuery + getNextPageParam), plus a11y bortom
 * axe: fokus-behållning på "Ladda fler" + aria-live-annonsering av antal nya rader.
 */

/** Komplett Person som passerar PersonSchema (.parse i adaptern). */
function person(i: number) {
  const namn = `Person ${String(i).padStart(2, '0')}`;
  return {
    id: `recPERSONTEST${String(i).padStart(7, '0')}`,
    namn,
    fornamn: `Person`,
    efternamn: String(i).padStart(2, '0'),
    email: `person.${String(i).padStart(2, '0')}@example.test`,
    telefon: null,
    ort: ['Skövde'],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar: null,
    antalAnmalningar: i % 5,
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
  };
}

/** Cursor-paginerad mock: tre sidor (00–01 → c1 → 02–03 → c2 → 04 → null). */
function respondPage(rawUrl: string) {
  const url = new URL(rawUrl);
  const search = url.searchParams.get('search');
  const cursor = url.searchParams.get('cursor');

  // Sökning: enkel namn-substräng-filtrering, en enda sida (ingen cursor).
  if (search) {
    const all = [0, 1, 2, 3, 4].map(person);
    const persons = all.filter((p) => p.namn.toLowerCase().includes(search.toLowerCase()));
    return { persons, nextCursor: null };
  }

  if (!cursor) return { persons: [person(0), person(1)], nextCursor: 'c1' };
  if (cursor === 'c1') return { persons: [person(2), person(3)], nextCursor: 'c2' };
  if (cursor === 'c2') return { persons: [person(4)], nextCursor: null };
  return { persons: [], nextCursor: null };
}

test.describe('Personer-listan (Fas 6a — cursor-port)', () => {
  // Överskuggningen läggs per test. `network` är test-scopad och byggs om för
  // varje test, så isoleringen är strukturell — inget städsteg krävs och nästa
  // test ser aldrig denna handler.
  test.beforeEach(async ({ network }) => {
    network.use(http.get(EF('get-persons'), ({ request }) => json(respondPage(request.url))));
  });

  test('DoD 2+3+5 — cursor-round-trip via "Ladda fler"', async ({ page }) => {
    await page.goto('/personer');
    const list = page.getByRole('list', { name: 'Personer' });
    const loadMore = page.getByRole('button', { name: 'Ladda fler' });

    // Sida 1.
    await expect(list.getByRole('listitem')).toHaveCount(2);
    await expect(page.getByText('2 personer laddade (fler finns).')).toBeVisible();
    await expect(loadMore).toBeVisible();

    // Sida 2 appendas (cursor c1). Knappen finns kvar (fler sidor).
    await loadMore.click();
    await expect(list.getByRole('listitem')).toHaveCount(4);
    // A11y: fokus BEHÅLLS på "Ladda fler" efter laddning.
    await expect(loadMore).toBeFocused();
    // A11y: aria-live annonserar antal nya rader.
    await expect(page.getByText('2 fler personer laddade, 4 totalt.')).toHaveCount(1);

    // Sida 3 appendas (cursor c2) → sista sidan (nextCursor null) → knappen borta.
    await loadMore.click();
    await expect(list.getByRole('listitem')).toHaveCount(5);
    await expect(loadMore).toHaveCount(0);
    // A11y: fokus tappas inte — flyttas till status-raden när knappen försvinner.
    await expect(page.getByText('5 personer laddade.')).toBeFocused();
  });

  test('DoD 5 — sökning skriver ?q och filtrerar via server-param', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('2 personer laddade (fler finns).')).toBeVisible();

    await page.getByRole('searchbox', { name: 'Sök person' }).fill('Person 00');

    await expect(page).toHaveURL(/[?&]q=Person/);
    await expect(page.getByText('1 person laddade för "Person 00".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(1);
  });

  test('DoD 5 — tom sökning ger "Inga träffar"', async ({ page }) => {
    await page.goto('/personer');
    await page.getByRole('searchbox', { name: 'Sök person' }).fill('Finnsinte');
    await expect(page.getByText('Inga träffar för "Finnsinte".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(0);
  });

  test('DoD 4 — axe 0 violations på den renderade listan', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('2 personer laddade (fler finns).')).toBeVisible();

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
    // jitter 0–baseDelay/2, `src/data/utils.ts`) och PersonsList ärver
    // QueryClientens `retry: 3` + `retryDelay` 200/400/800 (`src/router.ts:18`).
    // PersonsList har INGEN egen 4xx-undantagsgren som Waitlist/Anteckningar —
    // ingen statuskod ger en genväg förbi kedjan. Felytan kan alltså först dyka
    // upp efter 16 förfrågningar.
    //
    // KONSTRUERAT VÄRSTA FALL, enbart sömnerna: 4 × 2100 + 1400 = 9800 ms
    // (bästa fall 4 × 1400 + 1400 = 7000 ms) — plus 16 round-trips. Jittret är
    // `Math.random()`, så det övre talet kräver ingen otur utöver tre höga drag
    // per försök; det är ett normalutfall, inte en svans.
    //
    // MÄTT lokalt (darwin, 5 isolerade körningar): 7901 · 7904 · 7916 · 7941 ·
    // 8401 ms. Under full svit steg testets totaltid 9,3 → 10,2 s.
    //
    // DÄRFÖR 20 s OCH INTE PRECEDENSENS 12 s (event-anteckningar rad 248): 12 s
    // ligger bara 2,2 s över det konstruerade värsta fallet, före CI:s
    // långsammare runner och parallell workerlast. Priset för ett för HÖGT tal
    // betalas bara när testet ändå fäller; priset för ett för lågt är en falsk
    // röd — samma signal-förstörelse som task-59.7 höjde jobbets tak för.
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
    await expect(page.getByText('Inga personer ännu.')).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Personer' })).toHaveCount(0);

    // Felet bärs av KOMPONENTENS egen gren, inte av route-ErrorBoundaryn:
    // sökfältet står kvar. Utan denna assertion vore testet grönt även om
    // PersonsList kastade och SectionError tog över — en helt annan yta.
    await expect(page.getByRole('searchbox', { name: 'Sök person' })).toBeVisible();
  });
});
