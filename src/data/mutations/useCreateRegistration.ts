import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { CreateRegistrationInput, Registration } from '@/domain/models/Registration';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/** Formulär-input (utan eventId/idempotencyKey — hooken äger dem). */
export interface CreateRegistrationFormValues {
  fornamn: string;
  efternamn: string;
  email: string;
  telefon: string | null;
  /** Klient-genererad UUID per submission (ADR-059) — stabil över retries. */
  idempotencyKey: string;
}

/**
 * Mutation: "skapa manuell anmälan" (Fas 6c Leverabel 4). Speglar ADR-016:s
 * STRUKTUR (operations-API via adapter, onSuccess/onSettled-invalidering,
 * aria-live, requestId-propagering via EdgeFunctionError) men MEDVETET UTAN
 * optimistic-insert: en create kan 409:a (dubblett) → en rad ska aldrig dyka upp
 * och försvinna. ADR-016 mandaterar inte optimism för creates — dess egen
 * §Idempotency-stöd visar create som en separat, icke-optimistisk form. Pending→
 * bekräftat är 11/10-UX här; ingen rollback-context behövs (inget optimistiskt
 * state att återställa). Fel-ytan renderas av komponenten ur `mutation.error`
 * (409 inline, 5xx MessageBox med requestId).
 *
 * `idempotencyKey` skickas i input (klient-genererad, stabil över retries av
 * SAMMA submission, ADR-059). I 6c lagras nyckeln inte server-side (Fas E
 * aktiverar storage additivt); affärs-unikhet bärs av EF:ens 409-check.
 */
export function useCreateRegistration(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const key = queryKeys.registrations.byEvent(eventId);

  return useMutation<Registration, Error, CreateRegistrationFormValues>({
    // mutationKey scopar mutationen per event (dedup av samtidiga submits);
    // submit isDisabled={isPending} i formuläret är den primära dubbel-submit-grinden.
    mutationKey: ['create-registration', eventId],

    mutationFn: (values) => {
      const input: CreateRegistrationInput = {
        fornamn: values.fornamn,
        efternamn: values.efternamn,
        email: values.email,
        telefon: values.telefon,
        eventId,
        idempotencyKey: values.idempotencyKey,
      };
      return dataSource.createRegistration(input);
    },

    // aria-live för den lyckade skapelsen (ingen annan SR-signal för create-flippen);
    // rostern synkas av onSettled-invalideringen nedan.
    onSuccess: (created) => {
      const namn =
        created.namn ??
        ([created.fornamn, created.efternamn].filter(Boolean).join(' ') || 'anmälan');
      alertScreenReader(`Anmälan skapad för ${namn}`);
    },

    // Synka mot servern oavsett utfall (ADR-016 komponent E) → rostern refetchar.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
