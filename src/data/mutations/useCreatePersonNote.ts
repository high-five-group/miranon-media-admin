import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import {
  ACTIVITY_OBJECT_TYPES,
  ANTECKNADE_VERB,
  personActivityName,
  personObjectId,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { useDataSource } from '@/data/useDataSource';
import type { PersonNote } from '@/domain/models/PersonNote';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Mutation: "skapa anteckning på en person" (S103, T97-bygg-spåret). Speglar
 * `useCreateEventNote` EXAKT (samma additiva Anteckningar-tabell, ADR-075
 * utökad med ett Person-länkfält) — MEDVETET ICKE-optimistisk: en create kan
 * fela (nät/5xx) → en rad ska aldrig dyka upp och försvinna. pending→bekräftat
 * är 11/10-UX; ingen rollback-context behövs. Fel-ytan renderas av komponenten
 * ur `mutation.error`.
 *
 * `forfattare` skickas ALDRIG från klienten — EF:en sätter den server-side ur
 * den inloggade användarens verifierade identitet (ADR-075). Hooken skickar
 * bara `text`; `personId` binds vid hook-anropet (samma id för write + cache-nyckel).
 *
 * `personNamn` (TASK-201.4, AKTIVITETSLOGGEN): hook-bundet som `personId`,
 * samma motiv som `useUpdatePersonFlag`s docblock.
 */
export function useCreatePersonNote(personId: string, personNamn: string | null) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();
  const key = queryKeys.persons.notes(personId);

  return useMutation<PersonNote, Error, string>({
    // mutationKey scopar mutationen per person (dedup av samtidiga submits);
    // submit isDisabled={isPending} i composern är den primära dubbel-submit-grinden.
    mutationKey: ['create-person-note', personId],

    mutationFn: (text) => dataSource.createPersonNote({ personId, text }),

    // aria-live för den lyckade skapelsen (ingen annan SR-signal för create-flippen);
    // strömmen synkas av onSettled-invalideringen nedan.
    //
    // AKTIVITETSLOGGEN (TASK-201.4, AC #2): loggar ATT — object.name är
    // `personActivityName(personNamn)` (hook-bundet), `onSuccess`
    // destrukturerar MEDVETET inte den skapade `PersonNote` (som bär `text`)
    // eller mutationens `text`-variabel, samma disciplin som
    // `useUpdatePersonNote`.
    onSuccess: () => {
      alertScreenReader('Anteckningen har lagts till');
      void recordActivity({
        dataSource,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: ANTECKNADE_VERB,
        object: {
          id: personObjectId(personId),
          type: ACTIVITY_OBJECT_TYPES.anteckning,
          name: personActivityName(personNamn),
        },
      });
    },

    // Synka mot servern oavsett utfall (ADR-016 komponent E) → strömmen refetchar.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
