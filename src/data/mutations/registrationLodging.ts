import { useMutation, useQueryClient } from '@tanstack/react-query';
import { displayName } from '@/components/registrations/registration-display';
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
    onSuccess: (_data, { registration, borOver }) => {
      alertScreenReader(
        borOver
          ? `${displayName(registration)} markerad som bor över`
          : `${displayName(registration)} markerad som bor inte över`,
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
