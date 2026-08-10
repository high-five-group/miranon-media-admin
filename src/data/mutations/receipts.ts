import { useMutation } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { SendReceiptInput, SendReceiptResult } from '@/domain/schemas';

/**
 * Kvittosändningens mutation (TASK-147.7, ADR-109; EF-kontraktet
 * `send-receipt-email`). SAMMA idempotencyKey-genereringsmönster som
 * `useSendActionEmail`/`useSendActionTestEmail` (`actionEmail.ts`).
 *
 * INGEN CACHE-INVALIDERING: kvittot skriver strukturellt inget fält på
 * Anmälningar (`_shared/send-receipt.ts` filhuvud — "INGEN FÄLT-SKRIVNING PÅ
 * ANMÄLNINGAR") — dess enda skrivmål är den FRISTÅENDE Kvitton-tabellen, som
 * ingen befintlig query läser. Att invalidera `registrations.byEvent` här
 * hade varit en overksam kopiering av `useSendActionEmail`s mönster, inte en
 * verklig synk-plikt.
 *
 * PESSIMISTISK (som `useSendActionEmail`): ingen optimistisk UI-state — en
 * kvittosändning kan misslyckas (Resend-avvisning), och att visa "skickat"
 * innan servern bekräftat vore samma stämplingslögn PRD task-147 river för
 * åtgärdsutskicken.
 */
export function useSendReceipt() {
  const dataSource = useDataSource();

  return useMutation<SendReceiptResult, Error, Omit<SendReceiptInput, 'idempotencyKey'>>({
    mutationFn: (vars) =>
      dataSource.sendReceipt({
        ...vars,
        idempotencyKey: crypto.randomUUID(),
      }),
  });
}
