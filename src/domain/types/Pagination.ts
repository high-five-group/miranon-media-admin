import type { ActivityStatement } from '../schemas/ActivityStatement.schema';
import type { ActivityLogFilters } from './Filters';

/**
 * [RIVNA, TASK-286.3] `ListParams` och `PersonsPage` bodde här och bar
 * personlistans cursor-port (ADR-056) — `search`/`cursor`/`pageSize` in,
 * `{ persons, nextCursor, total? }` ut. Sista konsumenten (`listPersons` i
 * båda adaptrarna) försvann när personlistan bytte till det förladdade
 * registret (TASK-286.2, ADR-123 beslut 1), och `total?` hade dessutom
 * förlorat sin producent: EF:ens full-walk är riven i samma skiva
 * (`get-persons/index.ts`).
 *
 * Aktivitetsloggens typer nedan ÄRVDE formen och bär den vidare — de är
 * sedan denna rivning appens enda cursor-paginerade läs-port. Den rivna
 * formen finns i git (`git log -p -- src/domain/types/Pagination.ts`).
 */

/**
 * Parametrar för aktivitetsloggens paginerade läsning (TASK-201.5). Flat form
 * (filterfälten upprepade, inte `ActivityLogFilters & {...}`) — ärvd från den
 * rivna `ListParams`, som på samma sätt kombinerade `search`/`cursor`/
 * `pageSize` inline i stället för att komponera en separat filtertyp.
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
 * null` betyder sista sidan; cursorn är opak, klienten behandlar den som en
 * black box och skickar tillbaka den oförändrad för nästa sida.
 */
export interface ActivityLogPage {
  statements: ActivityStatement[];
  nextCursor: string | null;
  /**
   * Totalantal poster i HELA filtermängden (TASK-225.2, statusradens
   * "Visar 20 av 347"). VALFRITT med avsikt — skew-säkert: en klient mot en
   * äldre EF-deploy utan fältet faller till interimsformen, aldrig en krasch
   * (Vercel Skew-klassen, S105 C-listan).
   */
  total?: number;
}
