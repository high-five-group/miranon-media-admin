import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { displayName } from '@/components/registrations/registration-display';
import {
  ACTIVITY_OBJECT_TYPES,
  registrationObjectId,
  SKICKADE_KVITTO_VERB,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import type { SendReceiptInput, SendReceiptResult } from '@/domain/schemas';

/**
 * Kvittosändningens mutation (TASK-147.7, ADR-109; EF-kontraktet
 * `send-receipt-email`). SAMMA idempotencyKey-genereringsmönster som
 * `useSendActionEmail`/`useSendActionTestEmail` (`actionEmail.ts`).
 *
 * INGEN CACHE-INVALIDERING AV ANMÄLNINGAR: kvittot skriver strukturellt inget
 * fält på Anmälningar (`_shared/send-receipt.ts` filhuvud — "INGEN
 * FÄLT-SKRIVNING PÅ ANMÄLNINGAR") — dess enda skrivmål är den FRISTÅENDE
 * Kvitton-tabellen, som ingen befintlig query läser. Att invalidera
 * `registrations.byEvent` här hade varit en overksam kopiering av
 * `useSendActionEmail`s mönster, inte en verklig synk-plikt.
 *
 * `queryClient` hämtas ändå (TASK-210) — men INTE för den cachen. Den skickas
 * vidare till `recordActivity`, som invaliderar AKTIVITETSLOGGENS egen gren
 * efter en lyckad loggning; se den filens § CACHE-INVALIDERINGEN. Stycket
 * ovan gäller alltjämt oförändrat: denna mutation invaliderar fortfarande
 * ingenting själv.
 *
 * PESSIMISTISK (som `useSendActionEmail`): ingen optimistisk UI-state — en
 * kvittosändning kan misslyckas (Resend-avvisning), och att visa "skickat"
 * innan servern bekräftat vore samma stämplingslögn PRD task-147 river för
 * åtgärdsutskicken.
 *
 * `registration` (TASK-201.4, AKTIVITETSLOGGEN, `mottagare`-mönstret ur
 * `actionEmail.ts` § `useSendActionEmail`): FULL `Registration` för namn/
 * eventNamn — varken `SendReceiptInput` eller `SendReceiptResult` bär mer än
 * `registrationId`/`kvittonummer`. Fältet skickas ALDRIG till servern
 * (`mutationFn` nedan plockar bort det) — rent klient-lokalt underlag för
 * `recordActivity`s objekt-namn.
 */
export function useSendReceipt() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();

  return useMutation<
    SendReceiptResult,
    Error,
    Omit<SendReceiptInput, 'idempotencyKey'> & { registration: Registration }
  >({
    mutationFn: ({ registration: _registration, ...vars }) =>
      dataSource.sendReceipt({
        ...vars,
        idempotencyKey: crypto.randomUUID(),
      }),

    // AKTIVITETSLOGGEN: fire-and-forget, ENDAST när servern faktiskt skickade
    // kvittot ("servern är facit" — samma disciplin som
    // `registrationConfirmation.ts`/`actionEmail.ts`; `status: 'failed'`
    // loggas inte som om det hänt).
    onSuccess: (result, { registration, eventId }) => {
      if (result.status !== 'sent') return;
      void recordActivity({
        dataSource,
        queryClient,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: SKICKADE_KVITTO_VERB,
        object: {
          id: registrationObjectId(registration.id),
          type: ACTIVITY_OBJECT_TYPES.kvitto,
          name: `${displayName(registration)} (${registration.eventNamn ?? 'okänt event'})`,
        },
        eventId,
        // TASK-201.12: registration.personId är NULLABLE — se
        // registrationPayments.ts's motsvarande kommentar.
        personId: registration.personId ?? undefined,
      });
    },
  });
}
