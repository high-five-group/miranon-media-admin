import type { ErrorComponentProps } from '@tanstack/react-router';

/**
 * Branded fallback för router-livscykelfel (loader/beforeLoad/route-render samt
 * root-route-render-fel), kopplad via `defaultErrorComponent` i `src/router.ts` (ADR-038).
 *
 * Visuellt identisk med Sentry.ErrorBoundary-fallbacken i `__root.tsx` — användaren ska se
 * samma fallback oavsett fångst-väg. Designen är medvetet **duplicerad** (ej extraherad)
 * eftersom `__root.tsx` hålls orörd i K0.3b; Fas 3:s Mm-ErrorState ersätter båda (se
 * `tasks/todo.md` — fel-hanterings-arkitektur-konsolidering).
 *
 * Exponerar inte rå `error`/stack i UI (matchar `__root.tsx`-fallbacken). Sentry-capture sker
 * via `createRoot` `onCaughtError` i `main.tsx` — ingen capture här (undviker dubbel-rapportering).
 */
export function RouteErrorFallback({ reset }: ErrorComponentProps) {
  return (
    <div role="alert" className="p-4">
      <h1 className="font-bold text-2xl">Något gick fel</h1>
      <p className="mt-2">Vi kunde inte ladda sidan. Försök ladda om.</p>
      <button
        type="button"
        onClick={() => {
          reset();
          window.location.reload();
        }}
        className="mt-4 rounded bg-primary px-4 py-2 text-white"
      >
        Ladda om
      </button>
    </div>
  );
}
