import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

/**
 * Diskret offline-banner (Fas 5, ADR-047 B5) — prenumererar på TanStacks
 * onlineManager (samma källa som pausar queries vid networkMode 'online')
 * så banner och query-beteende aldrig divergerar.
 *
 * Live-regionen är ALLTID monterad och innehållet växlar — en region som
 * skapas först vid offline-händelsen annonseras inte tillförlitligt av
 * skärmläsare. Tom region är osynlig (ingen padding/border när online).
 * Inga animationer (prefers-reduced-motion respekteras genom frånvaro);
 * `contrast-more:` förstärker gränsen.
 */
export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    (onStoreChange) => onlineManager.subscribe(onStoreChange),
    () => onlineManager.isOnline(),
  );
  return (
    <div role="status" aria-live="polite">
      {!isOnline && (
        <p className="border-warning border-b bg-warning-bg px-4 py-2 text-center text-small contrast-more:border-b-2">
          Du är offline — visar senast hämtade data.
        </p>
      )}
    </div>
  );
}
