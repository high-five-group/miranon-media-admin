import { useQuery } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

/**
 * Mer-sidans Platser-yta (TASK-309.7 AC #3, ADR-125 § 7) — GLOBAL läs-lista
 * över SAMTLIGA Platser-rader. Speglar `events.formats`s "STABIL nyckel,
 * hämtar allt"-mönster (`CreateEventForm.tsx`).
 *
 * Invalideras av `useSavePlace`s `onSettled` (samma yta äger både läsning
 * och skrivning) — se den hookens docblock.
 */
export function usePlacesList() {
  const dataSource = useDataSource();
  return useQuery({
    queryKey: queryKeys.places.list,
    queryFn: () => dataSource.getPlaces(),
  });
}
