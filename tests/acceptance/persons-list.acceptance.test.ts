import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { PersonSchema } from '../../src/domain/schemas';
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
  } satisfies z.infer<typeof PersonSchema>;
}

/**
 * Cursor-paginerad mock: tre sidor (00–01 → c1 → 02–03 → c2 → 04 → null).
 *
 * TASK-277 Del 1 — `total` speglar `get-persons`s additiva svarsfält: satt
 * ENBART när cursor saknas (full-walk-semantiken, en gång per vy-/
 * sökladdning), aldrig på en efterföljande sida.
 */
function respondPage(rawUrl: string) {
  const url = new URL(rawUrl);
  const search = url.searchParams.get('search');
  const cursor = url.searchParams.get('cursor');

  // Sökning: enkel namn-substräng-filtrering, en enda sida (ingen cursor).
  if (search) {
    const all = [0, 1, 2, 3, 4].map(person);
    const persons = all.filter((p) => p.namn.toLowerCase().includes(search.toLowerCase()));
    return { persons, nextCursor: null, total: persons.length };
  }

  if (!cursor) return { persons: [person(0), person(1)], nextCursor: 'c1', total: 5 };
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
    await expect(page.getByText('Visar 2 av 5 personer.')).toBeVisible();
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
    await expect(page.getByText('Visar 5 av 5 personer.')).toBeFocused();
  });

  test('DoD 5 — sökning skriver ?q och filtrerar via server-param', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('Visar 2 av 5 personer.')).toBeVisible();

    await page.getByRole('searchbox', { name: 'Sök person' }).fill('Person 00');

    await expect(page).toHaveURL(/[?&]q=Person/);
    // Den promoverade formens copy (ADR-103 B2 steg 1). Den GAMLA lydelsen
    // ("1 person laddade för …") asserterade en grammatikbugg: verbet böjdes
    // efter antalet. Konvergensens k09 rev den genom KONSTRUKTION — "Visar"
    // böjs inte — så buggen kan inte återuppstå, och testet asserterar den
    // därför inte längre.
    await expect(page.getByText('Visar 1 av 1 personer för "Person 00".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(1);
  });

  test('DoD 5 — tom sökning ger "Inga träffar"', async ({ page }) => {
    await page.goto('/personer');
    await page.getByRole('searchbox', { name: 'Sök person' }).fill('Finnsinte');
    // k11 rev tomläget: den gamla grå metaraden (`Inga träffar för "X".`) såg
    // ut som om sidan gått sönder tyst. Formen är nu ett strukturerat,
    // centrerat tomläge — en bärande rad + en dämpad förklaring. BÅDA
    // asserteras, så en halv rendering inte passerar som grön.
    await expect(page.getByText('Inga träffar')).toBeVisible();
    await expect(page.getByText('Ingen person matchar "Finnsinte".')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Personer' }).getByRole('listitem')).toHaveCount(0);
  });

  test('DoD 4 — axe 0 violations på den renderade listan', async ({ page }) => {
    await page.goto('/personer');
    await expect(page.getByText('Visar 2 av 5 personer.')).toBeVisible();

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
    // jitter, `src/data/utils.ts`) och PersonsList ärver QueryClientens
    // `retry: 3` + `retryDelay` 200/400/800 (`src/router.ts:18`). Härledningen i
    // sin helhet bor i `support/acceptance-bas.ts` § SKRIVA ETT TEST I KLASSEN.
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
    // RÄTTAT (TASK-65): termen stod tidigare som 4 × 2100 + 1400 = 9800 ms —
    // en jitter som antogs följa delayen (100+200+400). Mätningen av
    // event-anteckningars identiska kedja falsifierade det: största uppmätta
    // mellanrum på 800-sömnen var 883 ms, inte ~1200. Fyndkortet är rättat vid
    // källan; talet nedan är oförändrat.
    //
    // MÄTT lokalt (darwin, 5 isolerade körningar): 7901 · 7904 · 7916 · 7941 ·
    // 8401 ms. Under full svit steg testets totaltid 9,3 → 10,2 s.
    //
    // DÄRFÖR 20 s OCH INTE 12 s: 12 s ligger bara 3,8 s över det konstruerade
    // värsta fallet, före CI:s långsammare runner och parallell workerlast.
    // (Precedensen på event-anteckningar rad 248 bar 12 s när raden här skrevs;
    // TASK-65 satte den till 20 s — en kedja, ett tal.) Priset för ett för
    // HÖGT tal betalas bara när testet ändå fäller; priset för ett för lågt är
    // en falsk röd — samma signal-förstörelse som task-59.7 höjde jobbets tak för.
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
    //
    // Copyn följer den PROMOVERADE formen (utan punkt, ADR-103 B2 steg 1). Den
    // gamla lydelsen `'Inga personer ännu.'` hade blivit VAKUÖST GRÖN efter
    // promoveringen: strängen med punkt finns inte längre någonstans, så
    // `toHaveCount(0)` kunde aldrig fälla och assertionen hade slutat skydda
    // det den finns för — utan att någonsin bli röd.
    await expect(page.getByText('Inga personer ännu')).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Personer' })).toHaveCount(0);

    // Felet bärs av KOMPONENTENS egen gren, inte av route-ErrorBoundaryn:
    // sökfältet står kvar. Utan denna assertion vore testet grönt även om
    // PersonsList kastade och SectionError tog över — en helt annan yta.
    await expect(page.getByRole('searchbox', { name: 'Sök person' })).toBeVisible();
  });
});
