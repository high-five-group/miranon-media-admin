import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';

/**
 * [PROTOTYPE, TASK-299.3] Delade typer för anmälningssidans
 * divergens-prototyp (`/dev/anmalningar-prototyp`, tre varianter × tre
 * lägen — PRD `TASK-299` AC #1–#2). Throwaway-kontraktet gäller (ADR-102/
 * 103): filen rivs med resten av `dev/anmalningar-prototyp/` när Marcus
 * valt variant.
 */

/** Sidans tre lägen (AC #2) — URL-nyckeln i `?lage=` (ADR-074 vy-axeln). */
export type AnmalningarLage = 'lista' | 'atgardskon' | 'tomt';

/**
 * Delad props-form för VariantA/B/C. Datan hämtas EN gång på routen
 * (samma `queryKeys.registrations.all`-nyckel som produktionssidan, så
 * React Query dedupar mot en eventuell samtidig `/mer/anmalningar`-flik)
 * och filtreras per `lage` INNAN den når varianterna — varje variant
 * bestämmer bara PRESENTATIONEN, aldrig urvalet (samma ansvarsgräns som
 * produktionens `AnmalningarList`).
 */
export interface VariantProps {
  /** Redan lage-filtrerad och senaste-först-sorterad (tomt läge ⇒ `[]`). */
  rader: Registration[];
  /** Sidans nuvarande läge — styr rubrik-copy och tomt-lägets text. */
  lage: AnmalningarLage;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  /** "Nu", läst EN gång vid sidmontering (hem-prototyp-precedentet) — samma
      referenspunkt i alla tre varianter, så "N dagar sedan" inte flippar
      mellan en variantväxling och nästa utan att datan faktiskt ändrats. */
  nuMs: number;
  /** HELA eventlistan (samma `queryKeys.events.list`-nyckel som
      EventsList/EventValjare — dedupar mot startvärmningen, ingen extra
      EF-rundtur). Endast Variant B konsumerar den i dagsläget (Marcus
      review 2026-08-22: eventnamnet i undertexten + kommande/tidigare-
      filtret byggs i B) — A/C tar emot fältet men läser det aldrig. */
  events: Event[];
}
