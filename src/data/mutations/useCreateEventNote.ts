import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { EventNote } from '@/domain/models/EventNote';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Mutation: "skapa anteckning på ett event" (task-18.11, ADR-075). Speglar
 * `useCreateRegistration`:s STRUKTUR (operations-API via adapter, onSettled-
 * invalidering, aria-live) och är MEDVETET ICKE-optimistisk: en create kan fela
 * (nät/5xx) → en rad ska aldrig dyka upp och försvinna. ADR-016 mandaterar inte
 * optimism för creates; pending→bekräftat är 11/10-UX här och ingen
 * rollback-context behövs (inget optimistiskt state att återställa). Fel-ytan
 * renderas av komponenten ur `mutation.error`.
 *
 * `forfattare` skickas ALDRIG från klienten — EF:en sätter den server-side ur den
 * inloggade användarens verifierade identitet (ADR-075). Hooken skickar bara
 * `text`; `eventId` binds vid hook-anropet (samma id för write + cache-nyckel).
 */
export function useCreateEventNote(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const key = queryKeys.events.notes(eventId);

  return useMutation<EventNote, Error, string>({
    // mutationKey scopar mutationen per event (dedup av samtidiga submits);
    // submit isDisabled={isPending} i composern är den primära dubbel-submit-grinden.
    mutationKey: ['create-event-note', eventId],

    mutationFn: (text) => dataSource.createEventNote({ eventId, text }),

    // aria-live för den lyckade skapelsen (ingen annan SR-signal för create-flippen);
    // strömmen synkas av onSettled-invalideringen nedan.
    onSuccess: () => {
      alertScreenReader('Anteckningen har lagts till');
    },

    // Synka mot servern oavsett utfall (ADR-016 komponent E) → strömmen refetchar.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
