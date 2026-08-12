import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { displayName } from '@/components/registrations/registration-display';
import {
  ACTIVITY_OBJECT_TYPES,
  mailVerb,
  registrationObjectId,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import type {
  SendActionEmailInput,
  SendActionEmailResult,
  SendActionTestEmailInput,
  SendActionTestEmailResult,
} from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * Åtgärdsutskickens mutation (TASK-147.2; EF-kontraktet TASK-147.1).
 *
 * PESSIMISTISK, som `useConfirmAll` (`registrationConfirmation.ts`) — INGEN
 * optimistisk patch: ett bulk-utskick kan vara partiellt, och att markera
 * mottagare som klara innan servern svarat vore exakt den stämplingslögn
 * PRD task-147 river. `GranskningsSida` (`AtgardsSida.tsx`) läser svaret
 * direkt ur mutationens `onSuccess`-callback och bygger sitt eget `Utfall`
 * (fallna kvar markerade, lyckade avmarkerade) — cachen rörs INTE härifrån
 * för det syftet.
 *
 * CACHE-INVALIDERINGEN finns ändå: skrivningen kan flippa `Status` (Bekräftad)
 * eller sätta ett av de tre andra stämpel-fälten (`_shared/send-action-
 * email.ts` § `stampFieldsFor`) — exakt samma två queries som
 * `confirmRegistrations` invaliderar, och av samma skäl: 'Bekräftad
 * beläggning (%)' räknas om när en anmälans Status ändras (event-detaljens
 * beläggningskort). En `bekraftelse`-sändning är server-side identisk med
 * `confirmRegistrations`s fält-skrivning (samma FALT_STATUS/
 * FALT_BEKRAFTELSE_SKICKAD), så samma invalidering gäller.
 *
 * GENERISK ÖVER DE FYRA ÅTGÄRDSTYPERNA (mutationFn tar `actionType`) trots att
 * TASK-147.2 bara kopplar `bekraftelse` mot den — EF-kontraktet är redan
 * generiskt (TASK-147.1), och en fjärde hook per typ hade dupliderat exakt
 * den mekanik TASK-147.3 sedan ärver oförändrad.
 *
 * `mottagare` (TASK-201.3, AKTIVITETSLOGGEN pilot 3/3): FULLA `Registration`-
 * objekt för urvalet — inte bara `registrationIds`. Namn/eventNamn finns
 * ENDAST här (varken `SendActionEmailInput` eller `SendActionEmailResult`
 * bär mer än record-ID:n, SCOPE-KÄRNAN: mottagaren löses server-side och
 * kommer aldrig tillbaka till klienten som andra fält än ID:t — se
 * `verkligtUtfallTillUtfall`s docblock i `AtgardsSida.tsx`). Fältet skickas
 * ALDRIG till servern (`mutationFn` nedan plockar bort det före
 * `dataSource.sendActionEmail`) — det är rent klient-lokalt underlag för
 * `recordActivity`s objekt-namn.
 */
export function useSendActionEmail(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();

  return useMutation<
    SendActionEmailResult,
    Error,
    Omit<SendActionEmailInput, 'eventId' | 'idempotencyKey'> & { mottagare: Registration[] }
  >({
    mutationFn: ({ mottagare: _mottagare, ...vars }) =>
      dataSource.sendActionEmail({
        ...vars,
        eventId,
        idempotencyKey: crypto.randomUUID(),
      }),

    // AKTIVITETSLOGGEN: fire-and-forget, EN post per FAKTISKT skickad
    // mottagare (`result.completed` — "servern är facit", samma disciplin
    // som `registrationConfirmation.ts`). `byId` speglar
    // `verkligtUtfallTillUtfall` i `AtgardsSida.tsx` — samma uppslag, egen
    // liten kopia (denna fils enda konsument av `mottagare`-listan).
    onSuccess: (result, { actionType, mottagare }) => {
      const byId = new Map(mottagare.map((r) => [r.id, r] as const));
      for (const id of result.completed) {
        const reg = byId.get(id);
        if (!reg) continue;
        void recordActivity({
          dataSource,
          actor: { id: user?.id ?? '', name: user?.displayName ?? null },
          verb: mailVerb(actionType),
          object: {
            id: registrationObjectId(reg.id),
            type: ACTIVITY_OBJECT_TYPES.mail,
            name: `${displayName(reg)} (${reg.eventNamn ?? 'okänt event'})`,
          },
          // TASK-201.4: betalar 201.3s deferrade EVENT_ID_EXTENSION_IRI-skuld
          // — eventId var redan hook-bundet (`useSendActionEmail(eventId)`).
          eventId,
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.byEvent(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
    },
  });
}

/**
 * "Skicka test till mig" (TASK-147.10; EF-grenen TASK-147.2s `send-action-
 * email` med `testSend: true`). SAMMA idempotencyKey-genereringsmönster som
 * `useSendActionEmail` ovan, men ÄGER INGEN cache-invalidering: EF-grenen
 * skriver strukturellt aldrig ett fält (`_shared/send-action-email.ts` §
 * `runActionTestSend` tar ingen `ActionFieldWriter`-deps) — ingen anmälan i
 * urvalet berörs, alltså finns inget cache-läge att synka om (AC #2).
 */
export function useSendActionTestEmail(eventId: string) {
  const dataSource = useDataSource();

  return useMutation<
    SendActionTestEmailResult,
    Error,
    Omit<SendActionTestEmailInput, 'eventId' | 'idempotencyKey'>
  >({
    mutationFn: (vars) =>
      dataSource.sendActionTestEmail({
        ...vars,
        eventId,
        idempotencyKey: crypto.randomUUID(),
      }),
  });
}
