import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { SavePlaceInput } from '@/domain/schemas';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Mutation: REN plats-redigering UTAN event (TASK-309.7 AC #3, Mer-sidans
 * Platser-yta, ADR-125 § 7) — till skillnad från `useSavePlaceStandard`
 * (som alltid går via ett event och tar `eventId` som hook-argument), tar
 * denna hooken inget argument: `platsId`/`namn` bärs av mutationens INPUT,
 * eftersom Platser-ytan äger vilken rad (befintlig eller ny) som redigeras
 * — samma form som `useSaveEventContent` redan etablerar för Eventinnehåll.
 *
 * INVALIDERAR BÅDA `queryKeys.places.list` (denna ytas egen lista) OCH
 * `queryKeys.documentSources.all` (samma skäl som `useSavePlaceStandard`:
 * en plats standard kan gälla FLERA event, och klienten känner inte till
 * vilka).
 */
export function useSavePlace() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<void, Error, SavePlaceInput>({
    mutationKey: ['save-place'],

    mutationFn: (input) => dataSource.savePlace(input),

    onSuccess: () => {
      alertScreenReader('Platsen sparad.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.documentSources.all });
    },
  });
}
