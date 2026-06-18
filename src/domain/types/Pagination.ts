import type { Person } from '../models/Person';

/**
 * Parametrar för cursor-paginerade list-portar (ADR-056). Källa-agnostisk:
 * Airtable-adaptern översätter `cursor` till en offset-token, Postgres-adaptern
 * (Fas E) till en keyset-cursor — klienten skickar samma form till båda.
 */
export interface ListParams {
  /** Fritext-sökterm (server-side filter). */
  search?: string;
  /** Opak framåt-cursor från föregående sidas `nextCursor`; utelämnad = första sidan. */
  cursor?: string;
  /** Önskat antal rader/sida. Adaptern klampar mot sin backends tak. */
  pageSize?: number;
}

/**
 * En cursor-paginerad sida med personer (ADR-056). `nextCursor === null`
 * betyder sista sidan. `nextCursor` är opak — klienten behandlar den som en
 * black box och skickar tillbaka den oförändrad för nästa sida.
 */
export interface PersonsPage {
  persons: Person[];
  nextCursor: string | null;
}
