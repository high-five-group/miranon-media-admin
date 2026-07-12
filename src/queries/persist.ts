import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

/**
 * Klient-persist av query-cachen (ADR-072): appen öppnar med senast kända
 * data direkt — kallstarten upphör i praktiken (varm start renderar ur
 * lagringen medan den tysta bakgrundshämtningen uppdaterar per
 * osynlighets-mekaniken, B3/task-4.5). HELA cachen persistas (beslut 1);
 * selektiv persist via `shouldDehydrateQuery` är den förberedda — ej
 * inkopplade — ratten om enskilda queries ska undantas (beslut 6).
 *
 * Skyddsräckena (ADR-072 beslut 2–4):
 * 1. Logout-rensning: utloggning tömmer via `queryClient.clear()`
 *    (AuthProvider.logout) — minnescachen synkas då TOM till lagringen av
 *    throttle-synken. Manuell radering av lagringsnyckeln används ALDRIG
 *    (racear mot throttle-synken ~1 s, maintainer-bekräftat).
 * 2. Livslängd: maxAge 24 h, och gcTime för persistade queries ≥ maxAge
 *    (dokumenterad GC-fälla: lägre gcTime kasserar lagrad cache i förtid) —
 *    konsumeras av router.ts (global default) + useDashboardData.ts.
 * 3. Versionsgräns: buster = den build-injicerade app-versionen
 *    (`__APP_VERSION__`, vite.config define — samma källa som versionsraden
 *    på Hem); cache skriven av annan version kastas vid restore.
 *
 * Hotmodellen (PII okrypterad i localStorage) är öppet bokförd i ADR-072 —
 * omprövningsvillkoret är explicit (ändrad enhetsmodell).
 *
 * Poll-kontraktet (ADR-017) ändras INTE: restaurerad data är stale per
 * gällande staleTime → omedelbar tyst bakgrundshämtning (beslut 5).
 */
export const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 h (skyddsräcke 2)

// Synkron localStorage-persister (PRD TASK-8 implementationsbeslut 1).
// Bibliotekets defaults gäller: nyckel REACT_QUERY_OFFLINE_CACHE,
// throttle-synk 1 s, JSON-serialisering.
const persister = createSyncStoragePersister({ storage: window.localStorage });

/** Konsumeras av PersistQueryClientProvider i main.tsx. */
export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: PERSIST_MAX_AGE_MS,
  buster: __APP_VERSION__,
};
