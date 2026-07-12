import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';
import { PERSIST_MAX_AGE_MS } from '@/queries/persist';

/**
 * Delade läs-queries för Hem-aggregeringen (Fas 6d) — med poll-lagret (L2).
 *
 * Båda speglar 6a/6c-konsumtionsmönstret (router-context-DI via `useDataSource`,
 * ADR-055 + `useQuery`). 4xx = klient-fel → ingen retry (samma kontrakt som
 * Waitlist/EventRegistrations).
 *
 * `useDashboardRegistrations` konsumeras av BÅDE NyaAnmalningar- och Obetalda-
 * cardet; samma `queryKey` ⇒ React Query dedupar till EN nätverksfetch.
 */
const noRetryOn4xx = (failureCount: number, err: Error): boolean =>
  !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) && failureCount < 3;

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

/** Alla anmälningar (event-lösa grenen av get-registrations — inget eventId). */
export function useDashboardRegistrations() {
  const dataSource = useDataSource();
  return useQuery({
    queryKey: queryKeys.dashboard.registrations,
    queryFn: () => dataSource.fetchRegistrations(),
    retry: noRetryOn4xx,
    ...DASHBOARD_POLLING,
  });
}

/** Hela eventlistan (get-events — global, inga params). */
export function useDashboardEvents() {
  const dataSource = useDataSource();
  return useQuery({
    queryKey: queryKeys.dashboard.events,
    queryFn: () => dataSource.fetchEvents(),
    retry: noRetryOn4xx,
    ...DASHBOARD_POLLING,
  });
}
