import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import {
  ACTIVITY_OBJECT_TYPES,
  personActivityName,
  personObjectId,
  UPPDATERADE_ANTECKNING_VERB,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { invalideraPersonregistret } from '@/data/mutations/personregister-invalidering';
import { useDataSource } from '@/data/useDataSource';
import type { PersonDetail } from '@/domain/schemas';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/** Rollback-context (ADR-016 komponent C): snapshot före optimistisk write. */
interface UpdateNoteContext {
  previous: PersonDetail | undefined;
}

/**
 * Optimistisk mutation: "spara fri-text-anteckning på en Person" (Fas 6a L6,
 * ADR-016 fem-komponents-mönster). Mall: `useMarkRegistrationPaid`, anpassad
 * till **enskilt-record-cachen** (persondetalj) i stället för list-`.map`.
 *
 * Skriver Airtable-fältet `Anteckningar` (versal A) via operationen
 * `update-person-note` (server-allowlist + staging-svit gröna sedan L6a/L6b).
 * Cache-mergen sätter schema-fältet `anteckningar` (gemen) på detalj-entryt.
 * Datakällan nås via router-context (`useDataSource`, ADR-055).
 *
 * Anropas med den nya note-strängen; `personId` binds vid hook-anropet (samma
 * id används för både write och cache-nyckel).
 *
 * `personNamn` (TASK-201.4, AKTIVITETSLOGGEN): hook-bundet som `personId`,
 * samma motiv som `useUpdatePersonFlag`s docblock.
 */
export function useUpdatePersonNote(personId: string, personNamn: string | null) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();
  const key = queryKeys.persons.detail(personId);

  return useMutation<void, Error, string, UpdateNoteContext>({
    // A. Operations-baserad write — Airtable-fält-NAMN 'Anteckningar'.
    mutationFn: (note) =>
      dataSource.updateRecord('update-person-note', personId, { Anteckningar: note }),

    // C. Avbryt in-flight refetch, snapshotta, applicera optimistiskt på det
    // enskilda detalj-recordet (inte en lista) — schema-fältet `anteckningar`.
    onMutate: async (note) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PersonDetail>(key);
      queryClient.setQueryData<PersonDetail>(key, (old) =>
        old ? { ...old, anteckningar: note } : old,
      );
      return { previous };
    },

    // D. Rollback. Fel-ytan (MessageBox role=alert) renderas av komponenten ur
    // `mutation.error`. Ingen alertScreenReader här: role=alert annonserar redan
    // assertivt (mallens a11y-avvägning, markRegistrationPaid.ts:49-54).
    onError: (_err, _note, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    // E. Synka mot servern oavsett utfall.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },

    // F. aria-live för den lyckade sparningen (DoD 8) — ingen annan SR-signal
    // finns för att noten persisterats.
    //
    // AKTIVITETSLOGGEN (TASK-201.4, AC #2): loggar ATT en anteckning
    // uppdaterades — object.name är `personActivityName(personNamn)`
    // (hook-bundet). `onSuccess` nedan destrukturerar MEDVETET inte den
    // andra parametern (mutationens `note`-variabel, se `<void, Error,
    // string, ...>` ovan) — den finns då inte i scope att av misstag
    // interpolera in i statementet.
    onSuccess: () => {
      alertScreenReader('Anteckning sparad');
      void recordActivity({
        dataSource,
        queryClient,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: UPPDATERADE_ANTECKNING_VERB,
        object: {
          id: personObjectId(personId),
          type: ACTIVITY_OBJECT_TYPES.anteckning,
          name: personActivityName(personNamn),
        },
        // TASK-201.12: personId hook-bundet, alltid satt — samma uniforma
        // emissions-mönster som `useCreatePersonNote`s motsvarande kommentar
        // förklarar (object.id är redan personen, extensionen emitteras ändå).
        personId,
      });

      // TASK-286.4 (ADR-123 beslut 6) — PERSONREGISTRET. Skrivningen går mot
      // Personer-radens `Anteckningar` (operation `update-person-note`), ett
      // fält register-payloaden FAKTISKT bär (`mapPerson`). Utan detta hade
      // registret burit den gamla texten hela `staleTime` ut.
      invalideraPersonregistret(queryClient);
    },
  });
}
