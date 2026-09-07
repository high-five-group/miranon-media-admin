import type { QueryClient } from '@tanstack/react-query';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { queryKeys } from '@/queries/keys';

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
 * ── VARFÖR LAMBDAN ÄR DUPLICERAD, INTE EXTRAHERAD TILL EN DELAD EXPORT ──
 *
 * Samma form som `Waitlist.tsx`/`MailLog.tsx`/`SavedSegmentsList.tsx`/
 * `AnmalningarSida.tsx`/`EventDetail.tsx`/`PersonDetail.tsx` m.fl. redan bär
 * inline, och `src/data/betalningar/useBetalningar.ts`s `husetsRetryPolicy`
 * kopierad hit av SAMMA skäl som den filen bokför (TASK-346.7.1): husets
 * EF-medvetna retry-lambda är redan duplicerad över tre-fyra mönster i
 * repot, och en delad export här hade uppfunnit ett femte i stället för att
 * följa ett av de befintliga. Denna modul löser ETT problem (dubbelpolicy på
 * EN nyckel via `setQueryDefaults`), inte husets bredare duplicering — den
 * frågan är öppen och bokförs i TASK-420s notes, inte åtgärdad här.
 */
export const intresseradeRetryPolicy = (failureCount: number, err: Error): boolean =>
  !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) && failureCount < 3;

/**
 * Registrerar retry-policyn för `intresserade.all` på klienten — anropas en
 * gång, direkt efter `queryClient`-instansieringen (`src/router.ts`), samma
 * plats och mönster som `registreraPersonregistretsFarskhet`.
 */
export function registreraIntresseradeRetryPolicy(queryClient: QueryClient): void {
  queryClient.setQueryDefaults(queryKeys.intresserade.all, { retry: intresseradeRetryPolicy });
}
