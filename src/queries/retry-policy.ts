import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { TidsgransFel } from '@/data/utils';

/**
 * Husets retry-regler för FRÅGELAGRET, på ETT ställe (TASK-451.4 runda 3,
 * Marcus beslut "väg A" 2026-09-19).
 *
 * ── BUGGEN DENNA MODUL LAGAR ──────────────────────────────────────────────
 *
 * `HAMTNINGENS_TIDSGRANS_MS` (160 s, `src/data/utils.ts`) appliceras
 * VILLKORSLÖST på varje GET (`callEdgeFunction`, `supabase-client.ts`). När
 * budgeten är uttömd kastas {@link TidsgransFel} — och den är INTE en
 * `EdgeFunctionError`. Husets 4xx-regel såg därför ett uttömt tidsbudget-fel
 * som "okänt fel, alltså transient" och retryade det upp till tre gånger.
 *
 * Värsta väggtid per fråga blev `4 × 160 s ≈ 640 s`. Mätt på Hems 60 s-poll
 * (`useDashboardData.ts`, granskningens runda 2-fynd på PR #2551), men
 * felklassen var APP-BRED: routerns globala default och samtliga 18 kopior av
 * 4xx-lambdan bar samma blindhet.
 *
 * ── REGELN: ETT UTTÖMT TIDSBUDGET-FEL ÄR SLUTGILTIGT ──────────────────────
 *
 * Ett omförsök efter en uttömd budget är fel i två oberoende led:
 *
 * 1. **Det multiplicerar budgeten.** Tidsgränsen är satt för att kapa en
 *    hämtning vid 160 s. Ett query-lager som startar om efter varje fälld
 *    budget gör taket till `retry + 1` gånger gränsen, alltså exakt det tak
 *    gränsen fanns för att sätta.
 * 2. **Det försöker om mot en vägg som sannolikt står kvar.** Träffade vi
 *    160 s för att Airtable höll oss i 429-lockout
 *    (`supabase/functions/_shared/airtable-retry.ts`) pågår lockouten
 *    fortfarande när omförsöket startar.
 *
 * TRANSPORTEN följer redan regeln: `fetchWithRetry` ger upp direkt när
 * signalen är abortad (`utils.ts`, bevisat i
 * `tests/api/avbrutet-anrop-retryas-aldrig.test.ts`). Frågelagret bröt mot
 * den. Denna modul gör regeln till EN regel, i BÅDA lagren.
 *
 * ── VARFÖR EN DELAD MODUL NU, NÄR TRE FILER SAGT NEJ TILL DET ─────────────
 *
 * `useBetalningar.ts` (TASK-346.7.1), `useDashboardData.ts` och
 * `intresserade-retry-policy.ts` (TASK-420) bokförde alla EXPLICIT att de
 * KOPIERADE 4xx-lambdan hellre än att extrahera en delad export, med samma
 * argument: en delad export hade "uppfunnit ett femte mönster där fyra redan
 * finns". Det argumentet höll så länge regeln var STABIL — en frusen
 * one-liner kostar inget att duplicera.
 *
 * Runda 3 falsifierade premissen: regeln var inte stabil. Den behövde ett
 * nytt villkor, och det villkoret måste gälla ALLA 18 ställena samtidigt. Vid
 * den punkten är duplicering inte längre billig utan direkt farlig — 18
 * ställen som ska ändras i takt är 18 chanser att missa ett, tyst. TASK-420
 * lämnade frågan öppen i sina notes ("husets bredare duplicering ... är öppen
 * ... inte åtgärdad här"); detta är svaret på den.
 *
 * Mekaniskt vaktad: `tests/api/retry-vakt.test.ts` källtextläser `src/` och
 * fäller om ett `retry:`-ställe i frågelagret varken är `false` eller går
 * genom detta modulens exporter. En nittonde kopia kan alltså inte smyga in.
 *
 * ── VAD SOM INTE ÄNDRAS ───────────────────────────────────────────────────
 *
 * Skrivvägen. `postEdgeFunction` bär med avsikt ingen tidsgräns (se den
 * funktionens docblock), och INGEN mutation i appen sätter `retry` alls
 * (grep, 2026-09-19) — de ärver TanStacks mutations-default `retry: 0`.
 * Denna modul rör därför enbart läsvägen.
 */

/**
 * Är felet SLUTGILTIGT — kan ett omförsök per definition inte hjälpa?
 *
 * "Minst `TidsgransFel`" är dagens hela svar, och den smalheten är avsiktlig:
 * predikatet är den ENDA platsen en framtida slutgiltig felklass behöver
 * läggas till för att gälla i hela frågelagret. Ett kandidatfall som medvetet
 * INTE ligger här: `AuthError`. Den är slutgiltig för det enskilda anropet men
 * läks av en sessionsförnyelse, alltså en annan mekanism än "ge upp" — den
 * frågan är öppen, inte avgjord.
 *
 * `unknown` och inte `Error`: TanStack typar `retry`-callbackens andra
 * argument som `Error`, men `instanceof` är sant/falskt för vad som helst, och
 * ett predikat som inte kan anropas med ett okänt värde vore svårare att
 * återanvända utanför query-lagret.
 */
export function arSlutgiltigtFel(err: unknown): boolean {
  return err instanceof TidsgransFel;
}

/**
 * Är felet ett KLIENT-fel (4xx) — något Lotta aldrig kan läka genom att vänta?
 *
 * Husets sedan länge etablerade regel, oförändrad i sak. Bor här i stället för
 * i 18 kopior; `EdgeFunctionError` bär statusen (`supabase-client.ts` kastar
 * den vid varje non-2xx-svar).
 */
function arKlientfel(err: unknown): boolean {
  return err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500;
}

/**
 * HUSETS retry-policy för EF-backade läsfrågor: aldrig ett slutgiltigt fel,
 * aldrig ett 4xx, annars upp till tre omförsök (alltså högst fyra
 * `queryFn`-körningar).
 *
 * Ersätter de tre namngivna kopiorna (`husetsRetryPolicy` i
 * `useBetalningar.ts`, `noRetryOn4xx` i `useDashboardData.ts`,
 * `intresseradeRetryPolicy` i `intresserade-retry-policy.ts`) och de 15
 * inline-lambdorna i komponentlagret. Alla 18 var TECKEN-FÖR-TECKEN identiska
 * före denna skiva (mätt med helradsmatchning, runda 3) — det fanns alltså
 * ingen medveten skillnad att bevara.
 *
 * `failureCount < 3` ger fyra körningar: TanStack anropar `retry` med en
 * NOLLBASERAD räknare efter varje misslyckande (mätt mot en riktig
 * `QueryClient` i `tests/api/intresserade-retry-policy.test.ts` § 3, inte
 * härlett ur dokumentationen).
 */
export const husetsRetryPolicy = (failureCount: number, err: Error): boolean =>
  !arSlutgiltigtFel(err) && !arKlientfel(err) && failureCount < 3;

/**
 * Den GLOBALA defaultens policy (`src/router.ts`).
 *
 * Skiljer sig från {@link husetsRetryPolicy} på EN punkt, med avsikt: den är
 * fortsatt BLIND på 4xx och retryar dem som förut. Det är inte en glömska
 * utan skivans scope-gräns — runda 3 ska lägga till slutgiltighets-regeln
 * överallt, inte samtidigt skärpa 4xx-beteendet för varje nyckel i appen som
 * i dag saknar egen override. En sådan skärpning vore sannolikt rätt, men den
 * ändrar felläget för yta efter yta som ingen mätt här, och den hör därför
 * till ett eget kort.
 *
 * Följden är att `retry: 3` och denna funktion är EKVIVALENTA för varje fel
 * utom {@link TidsgransFel} — vilket är precis vad de tvåsidiga testerna i
 * `tests/api/retry-slutgiltighet.test.ts` § 3 mäter.
 */
export const globalRetryPolicy = (failureCount: number, err: Error): boolean =>
  !arSlutgiltigtFel(err) && failureCount < 3;
