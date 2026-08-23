import { useQuery } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

/**
 * Mer-sidans Eventinnehåll-yta (TASK-309.7 AC #2, ADR-125 § 7) — GLOBAL
 * läs-lista över SAMTLIGA Eventinnehåll-rader (de sju Event×Typ-
 * kombinationerna, data-model.md § Bilagornas datamodell). Speglar
 * `events.formats`s "STABIL nyckel, hämtar allt"-mönster (`CreateEventForm.tsx`).
 *
 * Invalideras av `useSaveEventContent`s `onSettled` (den hooken invaliderar
 * `queryKeys.documentSources.all`, INTE denna nyckel — se filhuvudets not
 * där om varför en Eventinnehåll-standard kan gälla flera event). Denna
 * ytas egen mutation (samma `useSaveEventContent`-hook) måste alltså ÄVEN
 * invalidera `queryKeys.eventinnehall.list` för att listan känns av en
 * nyss sparad ändring utan en manuell omladdning — se hookens egen
 * `onSettled`.
 */
export function useEventinnehallList() {
  const dataSource = useDataSource();
  return useQuery({
    queryKey: queryKeys.eventinnehall.list,
    queryFn: () => dataSource.getEventContents(),
  });
}
