import { useQuery } from '@tanstack/react-query';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

/**
 * Delade läs-queries för Hem-aggregeringen (Fas 6d L1) — STATISK hämtning.
 * Poll-lagret (refetchInterval 60s + visibility-trigger, ADR-017) tillkommer i L2;
 * dessa hooks bär INGEN polling än.
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

/** Alla anmälningar (event-lösa grenen av get-registrations — inget eventId). */
export function useDashboardRegistrations() {
  const dataSource = useDataSource();
  return useQuery({
    queryKey: queryKeys.dashboard.registrations,
    queryFn: () => dataSource.fetchRegistrations(),
    retry: noRetryOn4xx,
  });
}

/** Hela eventlistan (get-events — global, inga params). */
export function useDashboardEvents() {
  const dataSource = useDataSource();
  return useQuery({
    queryKey: queryKeys.dashboard.events,
    queryFn: () => dataSource.fetchEvents(),
    retry: noRetryOn4xx,
  });
}
