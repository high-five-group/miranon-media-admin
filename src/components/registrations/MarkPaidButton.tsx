import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useMarkRegistrationPaid } from '@/data/mutations/markRegistrationPaid';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus } from '@/domain/types/Status';

interface MarkPaidButtonProps {
  registration: Registration;
  eventId: string;
}

/**
 * "Markera som betald"-knapp för en anmälan (Fas 5.5 K2). Döljs när avgiften
 * redan är `Mottagen` — status-texten i listan bär då utfallet (knappen vore en
 * no-op). Vid fel renderas en MessageBox (`role="alert"`, assertiv) med
 * requestId så Lotta kan referera felet till support; cache-rollbacken sköts av
 * mutation-hooken.
 */
export function MarkPaidButton({ registration, eventId }: MarkPaidButtonProps) {
  const mutation = useMarkRegistrationPaid(eventId);

  // Dold när redan mottagen (prompt: disabled/dold när 'Mottagen').
  if (registration.anmalningsavgift === PaymentStatus.MOTTAGEN) {
    return null;
  }

  const requestId =
    mutation.error instanceof EdgeFunctionError ? mutation.error.requestId : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Button
        intent="primary"
        size="sm"
        onPress={() => mutation.mutate(registration)}
        isDisabled={mutation.isPending}
      >
        Markera som betald
      </Button>

      {mutation.isError && (
        <MessageBox
          intent="error"
          title="Kunde inte markera som betald"
          onDismiss={() => mutation.reset()}
        >
          Försök igen.{requestId ? ` Fel-ID: ${requestId}.` : ''}
        </MessageBox>
      )}
    </div>
  );
}
