import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';
import { PERSIST_MAX_AGE_MS } from '@/queries/persist';
import { husetsRetryPolicy } from '@/queries/retry-policy';
import { hamtaDashboardEvents, hamtaDashboardRegistrations } from './hamtaDashboardData';

/**
 * Delade läs-queries för Hem-aggregeringen (Fas 6d) — med poll-lagret (L2).
 *
 * Båda speglar 6a/6c-konsumtionsmönstret (router-context-DI via `useDataSource`,
 * ADR-055 + `useQuery`).
 *
 * RETRY: `husetsRetryPolicy` (`@/queries/retry-policy`). Filen bar fram till
 * TASK-451.4 runda 3 en EGEN kopia av regeln (`noRetryOn4xx`); den är borta,
 * och regeln delas nu med resten av frågelagret. Två garantier följer med:
 * 4xx retryas aldrig (som förut), och ett uttömt tidsbudget-fel
 * (`TidsgransFel`, 160 s) retryas aldrig (NYTT). Det senare är bärande just
 * här: med 60 s-pollen nedan gav den gamla regeln upp till fyra körningar à en
 * egen 160 s-budget, alltså ~640 s väggtid för EN poll-omgång. Nu är värsta
 * väggtiden per fråga EN budget.
 *
 * `useDashboardRegistrations` konsumeras av BÅDE NyaAnmalningar- och Obetalda-
 * cardet; samma `queryKey` ⇒ React Query dedupar till EN nätverksfetch.
 *
 * queryFn:erna nedan går via `hamtaDashboardEvents`/`hamtaDashboardRegistrations`
 * (`./hamtaDashboardData.ts`, TASK-451.3) — EGEN modul, inte inline här, av
 * hermetisk-testbarhetsskäl (se den filens huvud): DENNA fil importerar
 * `@/queries/persist` som kör `window.localStorage`-kod vid modul-laddning,
 * så `hamtaDashboardData.ts` får aldrig importera från HÄR.
 */

/**
 * Polling per ADR-017 (se erratum 2026-06-23). Realtime kommer i Fas E.
 *
 * Delade per-query-options för dashboard-grenens queries (DRY — håll polling-
 * kontraktet på ETT ställe):
 * - `refetchInterval: 60_000` + `refetchIntervalInBackground: false` (§1: 60s,
 *   pausar i bakgrundsflik).
 * - `staleTime: 30_000` (§3 per erratum): BÄRANDE. Global staleTime är 5 min;
 *   utan denna override skulle global `refetchOnWindowFocus: true` (router.ts) inte
 *   refetcha vid återkomst förrän efter 5 min. v5:s focusManager lyssnar själv på
 *   `visibilitychange` och refetchar vid fokus ENDAST om queryn är stale → 30s ger
 *   ADR-017 §3:s "refetch om data > 30s" UTAN egen handler.
 * - `gcTime: PERSIST_MAX_AGE_MS` (24 h): ADR-072 skyddsräcke 2 ersätter öppet
 *   erratum-§4-värdet (300_000) så länge hela cachen persistas — gcTime under
 *   persistens maxAge kasserar lagrad cache i förtid (dokumenterad GC-fälla),
 *   och Hem-datat ÄR persist-lagrets primära nytta. Poll-BETEENDET (§1 60s-
 *   intervall, §3 staleTime/fokus-semantik) är orört — gcTime är cache-
 *   retention, inte polling.
 * - `placeholderData: keepPreviousData` (B3, task-4.5 — facit-mekaniken per
 *   PRD-beslut 10/S55 Del 11): tidigare data renderas orörd under tyst
 *   omhämtning. Ärligt bokfört: med dagens STATISKA nycklar bär React Querys
 *   SWR-default + tracked-props redan osynligheten (e2e-identitetsbeviset är
 *   grönt utan raden); optionen kodifierar kontraktet i själva poll-lagret
 *   och håller osynligheten om en query-nyckel blir parametrisk. Kall
 *   första-laddning är opåverkad (ingen tidigare data → isPending →
 *   laddläget, kortets ärliga undantag).
 */
const DASHBOARD_POLLING = {
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
  staleTime: 30_000,
  gcTime: PERSIST_MAX_AGE_MS,
  placeholderData: keepPreviousData,
} as const;

/** Alla anmälningar (event-lösa grenen av get-registrations — inget eventId).
 * queryFn går via {@link hamtaDashboardRegistrations} (TASK-451.3) — delar
 * startvärmningens hämtning i flykt i stället för att starta ett andra
 * anrop, se den funktionens JSDoc. */
export function useDashboardRegistrations() {
  const dataSource = useDataSource();
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.dashboard.registrations,
    queryFn: () => hamtaDashboardRegistrations(qc, dataSource),
    retry: husetsRetryPolicy,
    ...DASHBOARD_POLLING,
  });
}

/** Hela eventlistan (get-events — global, inga params). queryFn går via
 * {@link hamtaDashboardEvents} (TASK-451.3) — se den funktionens JSDoc. */
export function useDashboardEvents() {
  const dataSource = useDataSource();
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.dashboard.events,
    queryFn: () => hamtaDashboardEvents(qc, dataSource),
    retry: husetsRetryPolicy,
    ...DASHBOARD_POLLING,
  });
}
