import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { displayName } from '@/components/registrations/registration-display';
import {
  ACTIVITY_OBJECT_TYPES,
  boendeVerb,
  registrationObjectId,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Bor över-kryssets mutation (task-18.7; PRD task-18 beslut 8 + 20 —
 * kryss-interaktioner är OPTIMISTISKA, ADR-016:s fem-komponents-mönster;
 * mall: `useSetPaymentStatus` i registrationPayments.ts).
 *
 * Servern nås via update-record-operationen `set-registration-lodging`
 * (deny-by-default + allowlist-SSOT): EXAKT fältet 'Bor över' — allowlisten
 * gatar fältet, inte värdet, så samma operation kryssar både i och ur.
 *
 * Optimistiken är HELA poängen med kryss-läget: summeringsradens antal är en
 * HÄRLEDD räkning ur samma cache-rad (aldrig ett lagrat räknefält), så
 * live-räknaren tickar i samma render som krysset flippar. Fallerar skrivningen
 * rullas cachen tillbaka och både kryss och räknare återgår.
 */
export function useSetBorOver(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();
  const key = queryKeys.registrations.byEvent(eventId);

  return useMutation<
    void,
    Error,
    { registration: Registration; borOver: boolean },
    { previous: Registration[] | undefined }
  >({
    mutationFn: ({ registration, borOver }) =>
      dataSource.updateRecord('set-registration-lodging', registration.id, {
        'Bor över': borOver,
      }),

    onMutate: async ({ registration, borOver }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Registration[]>(key);
      queryClient.setQueryData<Registration[]>(key, (old) =>
        old?.map((r) => (r.id === registration.id ? { ...r, borOver } : r)),
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    // aria-live: kryssets visuella tillstånd är flippens enda uttryck
    // (mark-paid-precedentens F-komponent).
    //
    // AKTIVITETSLOGGEN (TASK-201.4): fire-and-forget EFTER den riktiga
    // skrivningen redan lyckats — samma mönster som `useSetPaymentStatus`
    // (`registrationPayments.ts`), loggar BÅDA riktningarna.
    onSuccess: (_data, { registration, borOver }) => {
      alertScreenReader(
        borOver
          ? `${displayName(registration)} markerad som bor över`
          : `${displayName(registration)} markerad som bor inte över`,
      );
      void recordActivity({
        dataSource,
        queryClient,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: boendeVerb(borOver),
        object: {
          id: registrationObjectId(registration.id),
          type: ACTIVITY_OBJECT_TYPES.boende,
          name: `${displayName(registration)} (${registration.eventNamn ?? 'okänt event'})`,
        },
        eventId,
        // TASK-201.12: registration.personId är NULLABLE — se
        // registrationPayments.ts's motsvarande kommentar.
        personId: registration.personId ?? undefined,
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
