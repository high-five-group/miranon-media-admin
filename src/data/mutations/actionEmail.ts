import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { SendActionEmailInput, SendActionEmailResult } from '@/domain/schemas';
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
 */
export function useSendActionEmail(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<
    SendActionEmailResult,
    Error,
    Omit<SendActionEmailInput, 'eventId' | 'idempotencyKey'>
  >({
    mutationFn: (vars) =>
      dataSource.sendActionEmail({
        ...vars,
        eventId,
        idempotencyKey: crypto.randomUUID(),
      }),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.byEvent(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
    },
  });
}
