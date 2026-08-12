import type { Person } from '../models/Person';
import type { ActivityStatement } from '../schemas/ActivityStatement.schema';
import type { ActivityLogFilters } from './Filters';

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

/**
 * Parametrar för aktivitetsloggens paginerade läsning (TASK-201.5). Flat form
 * (filterfälten upprepade, inte `ActivityLogFilters & {...}`) — speglar
 * `ListParams` medvetet: den kombinerar redan `search`/`cursor`/`pageSize`
 * inline i stället för att komponera en separat `PersonFilters`.
 */
export interface ActivityLogParams extends ActivityLogFilters {
  /** Opak framåt-cursor (keyset `occurred_at|id`, se get-activity-log-EF:en). */
  cursor?: string;
  /** Önskat antal rader/sida. EF:en klampar mot sitt tak (100). */
  pageSize?: number;
}

/**
 * En cursor-paginerad sida med xAPI-statements (TASK-201.5). `statements`
 * ÄTERANVÄNDER `ActivityStatement` rakt av — ingen parallell "flat"-typ
 * (samma disciplin som EF:ens svarsform, se dess filhuvud). `nextCursor ===
 * null` betyder sista sidan, opak precis som `PersonsPage`.
 */
export interface ActivityLogPage {
  statements: ActivityStatement[];
  nextCursor: string | null;
}
