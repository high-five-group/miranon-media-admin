import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { displayName } from '@/components/registrations/registration-display';
import {
  ACTIVITY_OBJECT_TYPES,
  registrationObjectId,
  SKAPADE_ANMALAN_VERB,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { invalideraPersonregistret } from '@/data/mutations/personregister-invalidering';
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
  /**
   * Facit-formens två fält (task-18.12). ADDITIVT-OPTIONAL: den skarpa
   * manuell-anmälan-sidan skickar dem alltid, modal-callern (AddRegistrationModal)
   * utelämnar dem och står därmed orörd.
   */
  antalPlatser?: number;
  notering?: string | null;
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
  const { user } = useAuth();
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
        antalPlatser: values.antalPlatser,
        notering: values.notering,
        eventId,
        idempotencyKey: values.idempotencyKey,
      };
      return dataSource.createRegistration(input);
    },

    // aria-live för den lyckade skapelsen (ingen annan SR-signal för create-flippen);
    // rostern synkas av onSettled-invalideringen nedan.
    //
    // AKTIVITETSLOGGEN (TASK-201.4): fire-and-forget EFTER den riktiga
    // skrivningen redan lyckats. `created` är EF-svarets fulla Registration
    // (samma disciplin som `useUpdateEvent`) — inget extra behövs för
    // namn/eventNamn. "Lade till person" ingår HÄR (PRD § Implementations-
    // beslut) — inget separat statement när skapandet implicit skapade en ny
    // Person-rad.
    onSuccess: (created) => {
      const namn =
        created.namn ??
        ([created.fornamn, created.efternamn].filter(Boolean).join(' ') || 'anmälan');
      alertScreenReader(`Anmälan skapad för ${namn}`);
      void recordActivity({
        dataSource,
        queryClient,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: SKAPADE_ANMALAN_VERB,
        object: {
          id: registrationObjectId(created.id),
          type: ACTIVITY_OBJECT_TYPES.anmalan,
          name: `${displayName(created)} (${created.eventNamn ?? 'okänt event'})`,
        },
        eventId,
        // TASK-201.12: created.personId är NULLABLE (EF-svarets Person-länk
        // kan sakna motsvarighet i vissa fel-/gränsfall) — se
        // registrationPayments.ts's motsvarande kommentar.
        personId: created.personId ?? undefined,
      });

      // TASK-286.4 (ADR-123 beslut 6) — PERSONREGISTRET. Detta är svepets
      // primära träff: en ny anmälan är det ENDA som får en person att entra
      // registret (`BAS_FILTER = '{Antal anmälningar (totalt)} > 0'`), och den
      // ändrar dessutom `harAktivAnmalan`, `senasteInteraktion` och `ort` för
      // en person som redan finns där. A2:s latens gör att effekten syns först
      // vid nästa hämtning — se modulens docblock § Känd kant.
      invalideraPersonregistret(queryClient);
    },

    // Synka mot servern oavsett utfall (ADR-016 komponent E) → rostern refetchar.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
