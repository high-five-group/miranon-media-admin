import type { QueryClient } from '@tanstack/react-query';
import { HEM_SENASTE_AKTIVITET_ANTAL, queryKeys } from '@/queries/keys';

/**
 * EN retry-policy på startvärmningens väg (TASK-451.4 AC #3/#4,
 * `docs/research/kallstarten-diagnoskarta-2026-09-18.md` § 1.7 + § 6 punkt 6).
 *
 * ── BUGGEN DENNA MODUL LAGAR ──────────────────────────────────────────────
 *
 * TVÅ OBEROENDE retry-lager staplades på varje warmup-hämtning:
 *
 * 1. **Transportlagret** — `fetchWithRetry` (`src/data/utils.ts`),
 *    `maxRetries = 3` ⇒ 4 HTTP-försök, backoff 200/400/800 ms + jitter.
 *    Retryar nätverksfel och 5xx; 4xx propageras direkt.
 * 2. **Query-lagret** — routerns globala `retry: 3` (`src/router.ts`), som
 *    `ensureQueryData` i warmup-motorn ärvde. Den globala defaulten gör INGET
 *    4xx-undantag.
 *
 * Värsta fall per warmup-item: **4 × 4 = 16 nätverksanrop** mot en kall Edge
 * Function, och ett 4xx (t.ex. en utgången token under boot) retryades tre
 * gånger med backoff trots att ett omförsök per definition inte kan hjälpa.
 * Diagnoskartan formulerar det rakt: *"4 × 4 = 16 anrop mot en kall EF är
 * inte resiliens, det är kö."*
 *
 * ── VILKET LAGER SOM STÄNGDES AV, OCH VARFÖR DET ──────────────────────────
 *
 * Query-lagret stängs av (`retry: false`); transportlagret behålls som det
 * ENDA. Tre skäl, i fallande vikt:
 *
 * 1. **Transportlagret bär redan 4xx-regeln.** `fetchWithRetry` retryar
 *    ENDAST 5xx och nätverksfel (`utils.ts`, `res.status >= 500`) — alltså
 *    exakt samma regel som husets `husetsRetryPolicy`
 *    (`src/queries/retry-policy.ts`), fast inbyggd i transporten i stället
 *    för upprepad per anropsställe. AC #4 faller ut ur mekaniken, inte ur
 *    ännu en handskriven lambda.
 * 2. **Ett transport-omförsök är billigare än ett query-omförsök.** Varje ny
 *    `queryFn`-körning går om `getAuthHeader()`, som gör en EGEN
 *    `supabase.auth.getSession()` per anrop (diagnoskartan § 1.8). Query-
 *    lagrets retry betalar alltså en extra sessionsrunda per försök; det gör
 *    transportlagrets inte.
 * 3. **Tidsgränsen bor i samma lager som omförsöken.** `callEdgeFunction`s
 *    budget (`HAMTNINGENS_TIDSGRANS_MS`) omsluter hela `fetchWithRetry`-
 *    sekvensen, så fyra försök ryms i EN tidsgräns. Hade query-lagret
 *    retryat ovanpå hade varje försök fått en NY budget, och värsta väggtiden
 *    blivit `retry + 1` gånger gränsen.
 *
 * **VÄRSTA FALLET PER WARMUP-ITEM EFTER DENNA MODUL (AC #3):**
 * 1 `queryFn`-körning × högst 4 HTTP-försök **PER EF-ANROP**, hela
 * försökssekvensen kapad av `HAMTNINGENS_TIDSGRANS_MS`. Ett 4xx ger exakt
 * **1** anrop (transporten retryar inte klient-fel).
 *
 * SEX av de sju itemen gör **exakt ETT** EF-anrop, och för dem är taket
 * alltså **högst 4 nätverksanrop**. Det SJUNDE — `intresserade` — gör det
 * INTE, och den skillnaden var felskriven här fram till runda 2
 * (granskningens fynd 3):
 *
 * `AirtableAdapter.fetchIntresserade` är en KLIENT-SIDIG cursor-walk
 * (`samlaCursorSidor`, `src/data/adapters/cursorWalk.ts`, TASK-350). Varje
 * SIDA är ett eget `callEdgeFunction('get-leads')` med sina EGNA upp till 4
 * HTTP-försök och sin EGEN tidsgräns — budgeten är per sida, inte för hela
 * walken (bokfört i den metodens egen kommentar). Taket för det itemet är
 * därför `4 × antal sidor`, där antalet sidor är
 * `ceil(antal intresserade / 100)` (`INTRESSERADE_MAX_PAGE_SIZE = 100`, EF:ens
 * eget `MAX_PAGE_SIZE`), med `maxSidor = 1000` som yttersta säkerhetstak.
 *
 * Det ÄNDRAR INTE vad denna modul gör, och inte heller dess vinst: före
 * skivan multiplicerade query-lagrets `retry: 3` HELA walken med 4
 * (`4 × 4 × sidor`); efter den är faktorn borta (`4 × sidor`). Den
 * additiva staplingen är alltså tagen bort för alla sju itemen — det som
 * inte håller är enbart den ABSOLUTA siffran "högst 4" för det ena itemet
 * som per konstruktion gör flera anrop. En budget för HELA walken vore en
 * annan ändring (en signal/gräns kring `samlaCursorSidor`), inte en
 * retry-policy, och ligger utanför denna skiva.
 *
 * ── VARFÖR `setQueryDefaults` OCH INTE `retry` VID VARJE ANROPSSTÄLLE ──────
 *
 * Samma resonemang som `intresserade-retry-policy.ts` (TASK-420) och
 * `personregister-farskhet.ts` (TASK-286.4): varje nyckel i warmup-setet har
 * FLERA konsumenter — startvärmningens `ensureQueryData`, list-/kärnvyns
 * `useQuery`, och sedan TASK-451.3 dessutom `delaMedListan`
 * (`src/components/hem/hamtaDashboardData.ts`), som gör ett EGET
 * `ensureQueryData` mot listnyckeln när Hem delar en hämtning i flykt. En
 * `retry` skriven vid ETT av dessa ställen gäller bara där, och vilken policy
 * som FAKTISKT styr ett givet fel avgörs av vem som råkade starta hämtningen
 * först — ett race, inte ett kontrakt. `setQueryDefaults` binder policyn till
 * NYCKELN, så alla tre ärver samma svar.
 *
 * Sidoeffekt, avsedd: detta STÄNGER den kant `hamtaDashboardData.ts` bokförde
 * öppet (att delnings-grenen ärvde listnyckelns globala `retry: 3` utan
 * 4xx-genväg, ~1,4 s extra innan ett 4xx nådde Hem). Delnings-grenen ärver nu
 * samma `retry: false` som warmup.
 *
 * ── SPRIDNINGEN, RÄKNAD ISTÄLLET FÖR ANTAGEN ──────────────────────────────
 *
 * `getQueryDefaults` PREFIX-matchar (`partialMatchKey`), så en default på
 * `['registrations']` gäller även grenar UNDER det prefixet. Kartlagt mot
 * `src/queries/keys.ts`, nyckel för nyckel:
 *
 * | Warmup-nyckel | Värde | Syskongrenar som ÄRVER |
 * |---|---|---|
 * | `events.list` | `['events','list']` | inga (`detail`/`attendance`/`notes` är syskon till `list`, inte barn) |
 * | `registrations.all` | `['registrations']` | **`byEvent(id)`, `detail(id)`** |
 * | `waitlist.all` | `['waitlist']` | inga (enda grenen) |
 * | `intresserade.all` | `['intresserade']` | inga (enda grenen) |
 * | `maillog.all` | `['maillog']` | inga (enda grenen) |
 * | `segment.saved` | `['segment','saved']` | inga (`sendRecipients` är syskon) |
 * | `activityLog.latest(N)` | `['activityLog','latest',N]` | inga (exakt nyckel, inte `latest`-prefixet) |
 *
 * **EN nyckelfamilj sprider: `registrations`.** `registrations.byEvent` och
 * `registrations.detail` ärver `retry: false`. Det är en MEDVETEN accept, inte
 * ett förbiseende: de går genom samma `callEdgeFunction`-transport och får
 * alltså fortfarande sina 4 HTTP-försök på 5xx/nätverksfel — det de förlorar
 * är enbart query-lagrets ADDITIVA omförsök, alltså precis den stapling denna
 * modul finns för att ta bort. Att i stället byta `registrations.all` mot en
 * smalare nyckel hade ändrat invalideringssemantiken
 * (`invalidateQueries({queryKey: registrations.all})` ska med avsikt träffa
 * BÅDA grenarna, se `keys.ts`) — en dyrare ändring för en mindre vinst.
 *
 * Övriga nyckelfamiljer i appen är ORÖRDA, och routerns globala `retry: 3`
 * (`src/router.ts`) är ORÖRD — den gäller alltjämt varje nyckel utanför
 * warmup-setet. Denna modul ändrar alltså INTE appens globala retry-policy;
 * den scopar en avvikelse till de sju nycklar startvärmningen faktiskt hämtar.
 *
 * ── FÖRHÅLLANDET TILL TASK-420 (`intresserade-retry-policy.ts`) ───────────
 *
 * `intresserade.all` bär sedan TASK-420 en egen default (`retry:
 * intresseradeRetryPolicy` = "aldrig 4xx, annars upp till 3 omförsök").
 * Denna modul registreras EFTER den i `src/router.ts` och ersätter därmed
 * den posten med `retry: false` för just den nyckeln. Det är en medveten
 * SKÄRPNING, inte en regression: `retry: false` bevarar TASK-420:s garanti
 * ("4xx retryas aldrig") och lägger till den AC #3 kräver ("högst 4 anrop"),
 * som TASK-420:s form ensam inte kunde ge (den tillät 4 × 4). TASK-420:s
 * modul står kvar oförändrad — den äger fortfarande historiken om
 * dubbelpolicy-racet och exporterar husets 4xx-lambda — men dess
 * REGISTRERING för denna nyckel är sedan TASK-451.4 överskuggad. Se den
 * filens egen § "Överskuggad av warmup-policyn".
 */

/**
 * Nycklarna startvärmningen hämtar (`WARMUP_ITEMS` i
 * `src/data/warmup/startvarmningen.ts`). Listan speglar motorns sju items och
 * ska hållas i takt med den: läggs ett item till där utan att nyckeln läggs
 * till här får det itemet tillbaka den globala `retry: 3` och därmed
 * 16-anrops-staplingen igen. `warmup-retry-policy.test.ts` mäter pariteten mot
 * motorns egen nyckelmängd i stället för att lita på att båda listorna
 * uppdateras samtidigt.
 */
export const WARMUP_NYCKLAR = [
  queryKeys.events.list,
  queryKeys.registrations.all,
  queryKeys.waitlist.all,
  queryKeys.intresserade.all,
  queryKeys.maillog.all,
  queryKeys.segment.saved,
  queryKeys.activityLog.latest(HEM_SENASTE_AKTIVITET_ANTAL),
] as const;

/**
 * Registrerar EN-lager-retryn för warmup-setets nycklar på klienten — anropas
 * en gång, direkt efter `queryClient`-instansieringen (`src/router.ts`),
 * samma plats och mönster som `registreraPersonregistretsFarskhet` och
 * `registreraIntresseradeRetryPolicy`.
 *
 * `retry: false` är det ENDA fältet som sätts. Varje annat query-fält
 * (`staleTime`, `gcTime`, `refetchOnWindowFocus`, `networkMode` …) saknas i
 * objektet och kan därför per konstruktion inte skugga routerns globala
 * värden — merge-ordningen är `{...defaultOptions.queries,
 * ...getQueryDefaults(key), ...anropsställets options}` (källäst i
 * `@tanstack/query-core` 5.102.2 `queryClient.js` § `defaultQueryOptions`,
 * samma verifiering `personregister-farskhet.ts` bokför).
 */
export function registreraWarmupRetryPolicy(queryClient: QueryClient): void {
  for (const nyckel of WARMUP_NYCKLAR) {
    queryClient.setQueryDefaults(nyckel, { retry: false });
  }
}
