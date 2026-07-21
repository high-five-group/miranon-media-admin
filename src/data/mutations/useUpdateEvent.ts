import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { UpdateEventInput } from '@/domain/schemas';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/** Formulär-input (utan eventId — hooken äger det). Endast satta fält skickas. */
export type UpdateEventFormValues = Omit<UpdateEventInput, 'eventId'>;

/**
 * Mutation: "uppdatera event" (task-18.1 — Om eventet-Ändra; Beläggningens Ändra
 * återanvänder hooken i sin skiva). PESSIMISTISK per ADR-066 b4-klassen: en
 * sektions-spara är infrekvent och högre insats än ett kryss (ADR-016:s optimism
 * är reserverad för frekventa lågrisk-interaktioner), och EF-svaret bär den
 * BERIKADE läs-shapen (inkl. omhärlett Månad/år + formel-härledda fält) som
 * klienten inte kan förutsäga — pending → bekräftat är rätt form.
 *
 * onSuccess cache-sätter detaljen DIREKT ur svaret (samma shape som fetchEvent →
 * morfen stänger mot färsk data utan mellanliggande refetch-flimmer); onSettled
 * invaliderar detalj + lista + dashboard (eventdata visas på Hem) så alla ytor
 * konvergerar mot servern oavsett utfall (ADR-016 komponent E).
 */
export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<Event, Error, UpdateEventFormValues>({
    // mutationKey scopar mutationen per event (dedup av samtidiga submits);
    // submit isDisabled={isPending} i formuläret är den primära dubbel-submit-grinden.
    mutationKey: ['update-event', eventId],

    mutationFn: (values) => dataSource.updateEvent({ eventId, ...values }),

    // aria-live för den lyckade sparningen (ingen annan SR-signal för morf-stängningen).
    // MERGE, inte ersättning (task-18.2): update-event-svaret bär ALDRIG
    // beläggningens aggregerade räkningar (viaFormular/medfoljande/vantelista —
    // endast get-event aggregerar; optional-nycklar är FRÅNVARANDE i det parse:ade
    // svaret och skriver därför inte över) — utan mergen skulle raderna blinka
    // bort ur Beläggningskortet tills onSettled-refetchen landat (lugnt laddläge).
    onSuccess: (updated) => {
      queryClient.setQueryData<Event>(queryKeys.events.detail(eventId), (prev) =>
        prev ? { ...prev, ...updated } : updated,
      );
      alertScreenReader('Ändringarna sparade.');
    },

    // Synka mot servern oavsett utfall (ADR-016 komponent E).
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.events });
    },
  });
}
