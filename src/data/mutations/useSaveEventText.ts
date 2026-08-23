import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { SaveEventTextInput } from '@/domain/schemas';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/** Formulär-input (utan eventId — hooken äger det). */
export type SaveEventTextFormValues = Omit<SaveEventTextInput, 'eventId'>;

/**
 * Mutation: spara eventets EGNA kopia av ett block (TASK-309.3 AC #1,
 * ADR-125 § 2 — den ännu obyggda genererings-/redigeringsytan, ADR-125
 * § 6, konsumerar denna). Speglar `useUpdateEvent`s form (mutationKey per
 * event, PESSIMISTISK — en sektions-spara/agenda-ersättning är infrekvent
 * och EF-svaret bär inget den optimistiska vägen kan förutsäga).
 *
 * AC #4 kräver ENDAST invalidering av dokumentunderlaget — INGEN
 * aktivitetslogg-integration byggs här (medvetet, dubbelriktad
 * över-engineering-vakt): ytan som ska anropa denna hook finns inte än
 * (ADR-125 § 6+7, en senare skiva), så vilket "objekt"/"verb" en logg-rad
 * borde bära är inte känt ännu. Se slutrapporten § Avvikelser.
 */
export function useSaveEventText(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<void, Error, SaveEventTextFormValues>({
    // mutationKey scopar mutationen per event (dedup av samtidiga submits).
    mutationKey: ['save-event-text', eventId],

    mutationFn: (values) => dataSource.saveEventText({ eventId, ...values }),

    onSuccess: () => {
      alertScreenReader('Ändringarna sparade.');
    },

    // Synka mot servern oavsett utfall (ADR-016 komponent E) — roten
    // (`detail`, inte `all`) räcker: detta block hör bara till DETTA event.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documentSources.detail(eventId) });
    },
  });
}
