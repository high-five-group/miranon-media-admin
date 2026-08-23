import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { SavePlaceStandardInput } from '@/domain/schemas';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/** Formulär-input (utan eventId — hooken äger det). */
export type SavePlaceStandardFormValues = Omit<SavePlaceStandardInput, 'eventId'>;

/**
 * Mutation: "spara som platsens standard" (TASK-309.3 AC #2, Del 2 § D
 * beslut 6). Speglar `useSaveEventText`s form.
 *
 * INVALIDERAR ROTEN (`queryKeys.documentSources.all`), INTE bara det
 * redigerade eventets `detail`-post — se `queries/keys.ts` §
 * `documentSources.all`: en platsstandard kan gälla FLERA event, och
 * klienten känner inte till vilka. Roten fångar alla monterade poster;
 * inaktiva (omonterade) events refetchar först vid nästa besök (samma
 * "bara aktiva queries refetchar"-princip som `activityLog.all`).
 *
 * AC #4 kräver ENDAST invalidering — se `useSaveEventText`s docblock för
 * varför ingen aktivitetslogg-integration byggs i denna skiva.
 */
export function useSavePlaceStandard(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<void, Error, SavePlaceStandardFormValues>({
    mutationKey: ['save-place-standard', eventId],

    mutationFn: (values) => dataSource.savePlaceStandard({ eventId, ...values }),

    onSuccess: () => {
      alertScreenReader('Sparat som platsens standard.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documentSources.all });
    },
  });
}
