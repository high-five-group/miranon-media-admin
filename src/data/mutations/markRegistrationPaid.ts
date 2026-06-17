import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus } from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/** Rollback-context (ADR-016 komponent C): snapshot före optimistisk write. */
interface MarkPaidContext {
  previous: Registration[] | undefined;
}

/**
 * Optimistisk mutation: "markera anmälningsavgift som mottagen" (Fas 5.5 K2,
 * ADR-016 fem-komponents-mönster + ADR-049 fält-val). Mall för Fas 6:s
 * mutationer.
 *
 * Skriver fältet `Anmälningsavgift = 'Mottagen'` via operationen
 * `mark-registration-fee-paid` (server-allowlist + staging-svit gröna sedan
 * Session 18/19). Datakällan nås via router-context (`useDataSource`, ADR-055).
 *
 * Anropas med hela `Registration`-objektet så hooken har både `id` (för write +
 * cache-match) och `namn` (för aria-live-annonseringen) utan extra lookup.
 */
export function useMarkRegistrationPaid(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const key = queryKeys.registrations.byEvent(eventId);

  return useMutation<void, Error, Registration, MarkPaidContext>({
    // A. Operations-baserad write — INTE executeOperation, INTE Status.
    mutationFn: (registration) =>
      dataSource.updateRecord('mark-registration-fee-paid', registration.id, {
        Anmälningsavgift: PaymentStatus.MOTTAGEN,
      }),

    // C. Avbryt in-flight refetch, snapshotta, applicera optimistiskt.
    onMutate: async (registration) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Registration[]>(key);
      queryClient.setQueryData<Registration[]>(key, (old) =>
        old?.map((r) =>
          r.id === registration.id ? { ...r, anmalningsavgift: PaymentStatus.MOTTAGEN } : r,
        ),
      );
      return { previous };
    },

    // D. Rollback. Fel-ytan (MessageBox role=alert) renderas av komponenten ur
    // `mutation.error` (EdgeFunctionError med requestId). Ingen alertScreenReader
    // här: MessageBox role=alert annonserar redan assertivt — en andra assertiv
    // annonsering vore dubbel (a11y-avvägning, avviker medvetet från prompt F:s
    // fel-gren; success-grenen nedan behåller aria-live då ingen visuell
    // success-indikator finns).
    onError: (_err, _registration, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    // F. aria-live för den lyckade status-flippen (DoD 8) — ingen annan
    // SR-signal finns för flippen.
    onSuccess: (_data, registration) => {
      const namn = registration.namn ?? registration.fornamn ?? 'anmälan';
      alertScreenReader(`Anmälningsavgift markerad som mottagen för ${namn}`);
    },

    // E. Synka mot servern oavsett utfall.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
