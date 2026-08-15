import type {
  useDashboardEvents,
  useDashboardRegistrations,
} from '@/components/hem/useDashboardData';

/**
 * [PROTOTYPE-TYPES, TASK-226] Gemensam props-form för de tre varianterna —
 * SAMMA två queries (`useDashboardEvents`/`useDashboardRegistrations`, redan
 * hämtade en gång i routen) skickas in oförändrade, så React Query dedupar
 * mot EN nätverksfetch per query oavsett vilken variant som råkar vara
 * monterad (samma `queryKey`, samma poll-lager — ADR-017).
 */
export interface VariantProps {
  eventsQuery: ReturnType<typeof useDashboardEvents>;
  registrationsQuery: ReturnType<typeof useDashboardRegistrations>;
  /** "Nu", läst EN gång per render i routen — samma referenspunkt i alla tre
      varianter (annars kunde "förfallen" flippa mellan en switch och nästa). */
  nuMs: number;
}
