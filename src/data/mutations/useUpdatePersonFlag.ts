import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import {
  ACTIVITY_OBJECT_TYPES,
  personActivityName,
  personObjectId,
  UPPDATERADE_FLAGGA_VERB,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { invalideraPersonregistret } from '@/data/mutations/personregister-invalidering';
import { useDataSource } from '@/data/useDataSource';
import type { PersonDetail } from '@/domain/schemas';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Cache-shapen efter en flagg-skrivning. `flagga` är MEDVETET INTE en del av
 * det delade `PersonDetail`-schemat i denna landning — en parallell agent äger
 * `src/domain/schemas/PersonDetail.schema.ts`/`get-person` i samma S103-svep
 * (T97-bygg-spåret) och lägger fältet där. Denna lokala intersection-typ håller
 * hooken fristående av den ändringen: `PersonDetail & { flagga }` är strukturellt
 * en SUPERMÄNGD av `PersonDetail` oavsett om det delade schemat redan bär fältet
 * eller ej — när det landar blir denna rad en no-op-utvidgning (samma typ),
 * aldrig en konflikt eller ett dubbelt-definierat fält.
 */
type PersonDetailWithFlagga = PersonDetail & { flagga: string | null };

/** Rollback-context (ADR-016 komponent C): snapshot före optimistisk write. */
interface UpdateFlagContext {
  previous: PersonDetail | undefined;
}

/**
 * Optimistisk mutation: "spara Lottas fritext-flagga på en Person" (S103,
 * Marcus GO 2026-08-10). Mall: `useUpdatePersonNote` (ADR-016 fem-komponents-
 * mönster), anpassad till SAMMA enskilt-record-cache (persondetalj).
 *
 * Skriver Airtable-fältet `Flagga` (singleLineText, NYTT 2026-08-10) via
 * operationen `update-person-flag` (server-allowlist, `field-allowlists.ts`).
 * Fritext med avsikt — INGEN lista att välja ur (Marcus, ordagrant: "det ska
 * vara en flagga som Lotta själv skriver i fritext"). Cache-mergen sätter
 * schema-fältet `flagga` (gemen) på detalj-entryt. Datakällan nås via
 * router-context (`useDataSource`, ADR-055).
 *
 * Anropas med den nya flagg-strängen; `personId` binds vid hook-anropet (samma
 * id används för både write och cache-nyckel).
 *
 * `personNamn` (TASK-201.4, AKTIVITETSLOGGEN): hook-bundet precis som
 * `personId` — mutationens variabel-typ är redan `string` (bara flaggan), så
 * en TVariables-omskrivning (`mottagare`-mönstret) hade tvingat fram en
 * bredare ändring av `.mutate()`-anropen än att bara utöka hook-anropet.
 * Personens namn finns aldrig i EF-svaret (`void`) — måste komma från
 * anroparen, som redan har `PersonDetail` laddad.
 */
export function useUpdatePersonFlag(personId: string, personNamn: string | null) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();
  const key = queryKeys.persons.detail(personId);

  return useMutation<void, Error, string, UpdateFlagContext>({
    // A. Operations-baserad write — Airtable-fält-NAMN 'Flagga'.
    mutationFn: (flagga) =>
      dataSource.updateRecord('update-person-flag', personId, { Flagga: flagga }),

    // C. Avbryt in-flight refetch, snapshotta, applicera optimistiskt på det
    // enskilda detalj-recordet (inte en lista) — schema-fältet `flagga`.
    onMutate: async (flagga) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PersonDetail>(key);
      queryClient.setQueryData<PersonDetailWithFlagga>(key, (old) =>
        old ? { ...old, flagga } : old,
      );
      return { previous };
    },

    // D. Rollback. Fel-ytan renderas av komponenten ur `mutation.error`. Ingen
    // alertScreenReader här: samma a11y-avvägning som markRegistrationPaid/
    // useUpdatePersonNote (role=alert annonserar redan assertivt).
    onError: (_err, _flagga, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    // E. Synka mot servern oavsett utfall.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },

    // F. aria-live för den lyckade sparningen — ingen annan SR-signal finns för
    // att flaggan persisterats.
    //
    // AKTIVITETSLOGGEN (TASK-201.4): fire-and-forget EFTER skrivningen redan
    // lyckats. INGET eventId — en person är inte scopad till ett event.
    onSuccess: () => {
      alertScreenReader('Flagga sparad');
      void recordActivity({
        dataSource,
        queryClient,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: UPPDATERADE_FLAGGA_VERB,
        object: {
          id: personObjectId(personId),
          type: ACTIVITY_OBJECT_TYPES.flagga,
          name: personActivityName(personNamn),
        },
        // TASK-201.12: personId hook-bundet, alltid satt — samma uniforma
        // emissions-mönster som `useCreatePersonNote`s motsvarande kommentar
        // förklarar (object.id är redan personen, extensionen emitteras ändå).
        personId,
      });

      // TASK-286.4 (ADR-123 beslut 6) — PERSONREGISTRET. `Flagga` ligger i dag
      // utanför registrets payload (`mapPerson` bär `manuellFlagga` ur det
      // döda `Manuella flagga`), så detta är i dag en invalidering utan synlig
      // effekt. Den finns ändå: AC #1 säger "alla person-ändrande skrivvägar",
      // detta är den enda ANDRA skrivningen mot Personer-tabellen, och flaggan
      // är på väg mot listan. Kostnad noll — registret är omonterat härifrån.
      invalideraPersonregistret(queryClient);
    },
  });
}
