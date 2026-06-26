import { useQuery } from '@tanstack/react-query';
import { MessageBox } from '@/components/primitives/MessageBox';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

/**
 * Lista över app-sparade segment (Fas 6g L3, ADR-065). Egen query
 * (`queryKeys.segment.saved`) → SegmentBuilder:s spara-mutation invaliderar nyckeln
 * och listan refetchar. Legacy Make-rader (utan App-segmentregel) exkluderas
 * server-side (get-segments) → varje rad bär en typad regel; `namn`/`definition`
 * kan dock vara null (kontraktet, L193) → neutral fallback-etikett.
 *
 * A11y: `<h2>`-rubrik, `role="status"`/aria-live för laddning, `aria-live` på listan
 * (nya segment annonseras när de dyker upp efter spara).
 */
export function SavedSegmentsList() {
  const dataSource = useDataSource();

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.segment.saved,
    queryFn: () => dataSource.listSegments(),
    // 4xx är klient-fel → meningslöst att retrya (speglar SegmentBuilder/Intresserade).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  return (
    <section
      className="flex flex-col gap-2 border-text-muted/20 border-t pt-4"
      aria-label="Sparade segment"
    >
      <h2 className="font-medium text-lg">Sparade segment</h2>

      {isPending ? (
        <p role="status" aria-live="polite" className="text-small text-text-muted">
          Laddar sparade segment…
        </p>
      ) : isError ? (
        <MessageBox intent="error" title="Kunde inte hämta sparade segment">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      ) : data.length === 0 ? (
        <p className="text-small text-text-muted">Inga sparade segment än.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {data.map((segment) => (
            <li key={segment.id} className="border-text-muted/20 border-b pb-2">
              <p className="text-body">
                <strong>{segment.namn ?? '(namnlöst segment)'}</strong>
              </p>
              {segment.definition && (
                <p className="text-small text-text-muted">{segment.definition}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
