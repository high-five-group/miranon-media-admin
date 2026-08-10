import { useMutation, useQueryClient } from '@tanstack/react-query';
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
 */
export function useCreatePersonNote(personId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const key = queryKeys.persons.notes(personId);

  return useMutation<PersonNote, Error, string>({
    // mutationKey scopar mutationen per person (dedup av samtidiga submits);
    // submit isDisabled={isPending} i composern är den primära dubbel-submit-grinden.
    mutationKey: ['create-person-note', personId],

    mutationFn: (text) => dataSource.createPersonNote({ personId, text }),

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
