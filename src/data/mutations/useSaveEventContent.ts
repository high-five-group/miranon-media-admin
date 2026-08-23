import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { SaveEventContentInput } from '@/domain/schemas';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Mutation: spara Eventinnehållets standardtexter/-agenda (TASK-309.3
 * AC #3, Mer-sidan, ADR-125 § 7). Speglar `useSaveEventText`s form.
 *
 * INVALIDERAR ROTEN (`queryKeys.documentSources.all`), av samma skäl som
 * `useSavePlaceStandard`: en Eventinnehåll-rads standard delas av VARJE
 * event med samma Event×Typ-kombination (ADR-125 § 2 — uppslag, inte
 * länk), och klienten känner inte till vilka events det är.
 *
 * Hooken tar INGET `eventId` (till skillnad mot de andra två) — den
 * redigerar en Eventinnehåll-RAD direkt (`eventinnehallId`), inte ett
 * enskilt events kopia; Mer-sidans redigeringsyta (ADR-125 § 7) äger vilken
 * rad som redigeras.
 *
 * AC #4 kräver ENDAST invalidering — se `useSaveEventText`s docblock för
 * varför ingen aktivitetslogg-integration byggs i denna skiva.
 */
export function useSaveEventContent() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<void, Error, SaveEventContentInput>({
    mutationKey: ['save-event-content'],

    mutationFn: (input) => dataSource.saveEventContent(input),

    onSuccess: () => {
      alertScreenReader('Ändringarna sparade.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documentSources.all });
    },
  });
}
