import { useQuery } from '@tanstack/react-query';
import { MessageBox } from '@/components/primitives/MessageBox';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import { queryKeys } from '@/queries/keys';
import { MarkPaidButton } from './MarkPaidButton';

interface RegistrationsListProps {
  eventId: string;
}

/** Sammansatt visningsnamn ur de namnfält Airtable kan leverera. */
function displayName(reg: Registration): string {
  if (reg.namn) return reg.namn;
  const composed = [reg.fornamn, reg.efternamn].filter(Boolean).join(' ');
  return composed || 'Okänt namn';
}

/**
 * Anmälda-lista med betalnings-status + "Markera som betald" per rad (Fas 5.5
 * K2). Datakällan nås via router-context (`useDataSource`, ADR-055); samma
 * queryKey som mutationens optimistiska cache-ops så flippen syns direkt.
 *
 * Betalnings-status renderas som **text** (inte enbart färg) — färg är aldrig
 * ensam informationsbärare (ACCESSIBILITY-CHECKLIST §1). Ingen StatusBadge-
 * primitiv finns ännu; text räcker för kvalitetsribban här.
 */
export function RegistrationsList({ eventId }: RegistrationsListProps) {
  const dataSource = useDataSource();
  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.registrations.byEvent(eventId),
    queryFn: () => dataSource.fetchRegistrations({ eventId }),
  });

  if (isPending) {
    return (
      <p role="status" aria-live="polite">
        Laddar anmälningar…
      </p>
    );
  }

  if (isError) {
    return (
      <MessageBox intent="error" title="Kunde inte hämta anmälningar">
        {error instanceof Error ? error.message : 'Okänt fel.'}
      </MessageBox>
    );
  }

  if (data.length === 0) {
    return <p>Inga anmälningar för det här eventet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.map((reg) => (
        <li key={reg.id} className="flex flex-col gap-1 border-b pb-3">
          <span className="font-medium">{displayName(reg)}</span>
          <span className="text-small">Anmälningsavgift: {reg.anmalningsavgift ?? 'Okänd'}</span>
          <MarkPaidButton registration={reg} eventId={eventId} />
        </li>
      ))}
    </ul>
  );
}
