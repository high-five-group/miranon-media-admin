import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import {
  ACTIVITY_OBJECT_TYPES,
  ANTECKNADE_VERB,
  eventActivityName,
  eventObjectId,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
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
 *
 * `eventNamn` (TASK-201.4, AKTIVITETSLOGGEN): hook-bundet som `eventId` —
 * samma motiv som person-anteckningarnas `personNamn` (`useCreatePersonNote`s
 * docblock): `EventNote`-svaret bär ingen eventNamn, måste komma från
 * anroparen.
 */
export function useCreateEventNote(eventId: string, eventNamn: string | null) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();
  const key = queryKeys.events.notes(eventId);

  return useMutation<EventNote, Error, string>({
    // mutationKey scopar mutationen per event (dedup av samtidiga submits);
    // submit isDisabled={isPending} i composern är den primära dubbel-submit-grinden.
    mutationKey: ['create-event-note', eventId],

    mutationFn: (text) => dataSource.createEventNote({ eventId, text }),

    // aria-live för den lyckade skapelsen (ingen annan SR-signal för create-flippen);
    // strömmen synkas av onSettled-invalideringen nedan.
    //
    // AKTIVITETSLOGGEN (TASK-201.4, AC #2): loggar ATT — object.name är
    // `eventActivityName(eventNamn)` (hook-bundet), DELAT `ANTECKNADE_VERB`
    // med `useCreatePersonNote` (samma handling, olika objekt). `onSuccess`
    // destrukturerar MEDVETET inte den skapade `EventNote` (bär `text`)
    // eller mutationens `text`-variabel.
    onSuccess: () => {
      alertScreenReader('Anteckningen har lagts till');
      void recordActivity({
        dataSource,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: ANTECKNADE_VERB,
        object: {
          id: eventObjectId(eventId),
          type: ACTIVITY_OBJECT_TYPES.anteckning,
          name: eventActivityName(eventNamn),
        },
        eventId,
      });
    },

    // Synka mot servern oavsett utfall (ADR-016 komponent E) → strömmen refetchar.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
