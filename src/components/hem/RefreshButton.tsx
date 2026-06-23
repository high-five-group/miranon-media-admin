import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/primitives/Button';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Manuell uppdatera-översikt-kontroll (Fas 6d L2) — ADR-017 §2 pull-to-refresh,
 * nyanserad per erratum 2026-06-23 till en `<RefreshButton>` i stället för
 * touch-gesture: en knapp är tangentbordsnåbar + skärmläsbar (a11y-11) och
 * testbar utan touch-emulering (touch-drag kan adderas som progressiv förbättring
 * senare). STATE-STRATEGY §5b:s precedens.
 *
 * `invalidateQueries({ queryKey: dashboard.all })` markerar HELA dashboard-grenen
 * stale (åsidosätter `staleTime`) + refetchar de renderade queryerna i bakgrunden
 * — rätt semantik för manuell refresh. `useIsFetching` på samma gren ger
 * pending-feedback (disabled + "Uppdaterar…") medan refetchen pågår.
 *
 * Ingen animation → `prefers-reduced-motion` trivialt uppfyllt (text-feedback, ej
 * spinner). Lyckad refresh annonseras i `aria-live` via `alertScreenReader`
 * (samma mönster som Fas 5.5-mutationen).
 */
export function RefreshButton() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: queryKeys.dashboard.all }) > 0;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    alertScreenReader('Översikten uppdaterad.');
  };

  return (
    <Button intent="secondary" size="sm" isDisabled={isFetching} onPress={handleRefresh}>
      {isFetching ? 'Uppdaterar…' : 'Uppdatera översikt'}
    </Button>
  );
}
