import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';
import { husetsRetryPolicy } from '@/queries/retry-policy';

/**
 * Intresserade-nyckelns retry-policy (TASK-420, fynd ur review-runda 2 på
 * PR #2395 / TASK-416.8).
 *
 * ── BUGGEN DENNA MODUL LAGAR ──────────────────────────────────────────────
 *
 * `queryKeys.intresserade.all` hade TVÅ KONSUMENTER med MOTSTRIDIGA
 * retry-policyer på samma cache-post: `startvarmningen.ts`s `ensureQueryData`
 * (ingen override → ärver routerns BLINDA `retry: 3`, `src/router.ts`, retryar
 * även 4xx) och `Intresserade.tsx`s `useQuery` (egen override, aldrig retry på
 * 4xx). Vilken policy som FAKTISKT gällde för ett givet fel berodde på vem som
 * råkade starta hämtningen först — ett race, inte ett kontrakt. Ett 4xx (t.ex.
 * utgången session) kunde därför retryas tre gånger med backoff ur
 * startvärmningen fast Intresserade-vyn själv aldrig skulle ha gjort det;
 * granskaren observerade fyra `get-leads`-anrop vid en sidladdning som
 * fastnade i just detta race.
 *
 * ── VARFÖR `setQueryDefaults` OCH INTE EN `retry` VID VARJE ANROPSSTÄLLE ──
 *
 * Samma resonemang som `personregister-farskhet.ts` (`registrations.register`,
 * TASK-286.4): en nyckel med FLERA konsumenter kan inte ha sin policy
 * spridd över anropsställena utan att de riskerar glida isär — `setQueryDefaults`
 * binder policyn till NYCKELN i stället, så varje konsument (nuvarande och
 * framtida) ärver samma svar på "ska detta fel retryas?".
 *
 * Källäst mot den installerade `@tanstack/query-core` (5.102.2) och TanStack
 * Querys egen referensdokumentation (context7 `/tanstack/query/v5.90.3`,
 * `docs/reference/QueryClient.md`, 2026-09-07): `QueryCache.build()` skapar
 * varje `Query` med `options: client.defaultQueryOptions(options)` OCH
 * `defaultOptions: client.getQueryDefaults(queryKey)` — SAMMA byggväg för
 * `useQuery` OCH `ensureQueryData`/`fetchQuery` (ensureQueryData anropar
 * `fetchQuery` när cachen är tom, `queryClient.ts` källa). Merge-ordningen är
 * `{...defaultOptions.queries, ...getQueryDefaults(key), ...anropsställets
 * options}` — anropsställets EGNA options vinner alltid
 * ("if a specific useQuery call has an explicit retry count set, that value
 * will take precedence", `docs/framework/react/guides/testing.md`). Det är
 * SKÄLET till att `Intresserade.tsx`s inline-override måste bort (se den
 * filens `useQuery`-anrop) — annars hade komponentens egen `retry` fortsatt
 * skugga denna default, och bara startvärmningens sida av racet lagats.
 *
 * `getQueryDefaults` PREFIX-matchar (`partialMatchKey`) — precis som
 * `persons.register`, men `intresserade.all` (`['intresserade']`,
 * `src/queries/keys.ts`) har i dag INGA syskongrenar (`detail`/`notes`
 * o.dyl.) under samma prefix, så prefix-matchningen är i praktiken en exakt
 * matchning. Öppet för framtiden: en eventuell `intresserade.detail(id)`
 * skulle ÄRVA samma retry-policy — rimligt (samma EF-familj), men värt att
 * ha i minnet om en sådan gren någonsin läggs till.
 *
 * ── DUPLICERINGEN ÄR UPPLÖST (TASK-451.4 runda 3, 2026-09-19) ─────────────
 *
 * Här stod fram till runda 3 en rubrik med motsatt innehåll: "VARFÖR LAMBDAN
 * ÄR DUPLICERAD, INTE EXTRAHERAD TILL EN DELAD EXPORT". Argumentet var att
 * husets EF-medvetna lambda redan låg duplicerad över tre-fyra mönster, och
 * att en delad export här hade uppfunnit ett femte i stället för att följa ett
 * av de befintliga. Den öppna frågan bokfördes i TASK-420s notes.
 *
 * Runda 3 besvarade den, och falsifierade premissen samtidigt: argumentet höll
 * bara så länge regeln var STABIL. När ett uttömt tidsbudget-fel (`TidsgransFel`)
 * måste bli slutgiltigt i HELA frågelagret blev de 18 identiska kopiorna 18
 * ställen att ändra i takt — alltså 18 chanser att missa ett, tyst. Regeln bor
 * sedan dess i `src/queries/retry-policy.ts`, och `intresseradeRetryPolicy`
 * nedan ÄR den modulens `husetsRetryPolicy` (samma funktionsreferens, inte en
 * kopia av den). Mekaniskt vaktat av `tests/api/retry-vakt.test.ts`.
 *
 * ── ÖVERSKUGGAD AV WARMUP-POLICYN (TASK-451.4, 2026-09-18) ────────────────
 *
 * `registreraIntresseradeRetryPolicy` nedan anropas fortfarande i
 * `src/router.ts`, men dess post för `intresserade.all` ERSÄTTS direkt
 * efteråt av `registreraWarmupRetryPolicy`
 * (`src/queries/warmup-retry-policy.ts`), som sätter `retry: false` på hela
 * warmup-setet — `intresserade.all` inkluderad.
 *
 * Det är en SKÄRPNING av denna moduls mål, inte en rivning av det.
 * Dubbelpolicy-racet som beskrivs ovan är fortsatt löst (policyn bor på
 * NYCKELN, inte på anropsställena), 4xx-garantin är fortsatt uppfylld
 * (`retry: false` retryar ingenting alls), och till det kommer TASK-451.4:s
 * AC #3: värsta fallet per warmup-item ska vara högst 4 nätverksanrop. Denna
 * moduls form tillät `4 × 4 = 16` vid 5xx, eftersom `failureCount < 3` lät
 * query-lagret retrya ovanpå `fetchWithRetry`s egna fyra försök.
 *
 * Modulen står kvar OFÖRÄNDRAD i sak: den äger historiken om racet, och
 * `intresseradeRetryPolicy` nedan är fortfarande husets 4xx-medvetna
 * referenslambda. Raden dokumenteras här i stället för att lämnas outtalad —
 * en registrering som tyst skrivs över av en senare rad är exakt den sortens
 * drift ADR-083 finns för att förhindra.
 */
export const intresseradeRetryPolicy = husetsRetryPolicy;

/**
 * Registrerar retry-policyn för `intresserade.all` på klienten — anropas en
 * gång, direkt efter `queryClient`-instansieringen (`src/router.ts`), samma
 * plats och mönster som `registreraPersonregistretsFarskhet`.
 */
export function registreraIntresseradeRetryPolicy(queryClient: QueryClient): void {
  queryClient.setQueryDefaults(queryKeys.intresserade.all, { retry: husetsRetryPolicy });
}
