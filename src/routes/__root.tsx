import type { AuthContextValue } from '@/auth/AuthProvider';
import * as Sentry from '@sentry/react';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Suspense } from 'react';

interface RouterContext {
  queryClient: QueryClient;
  auth: AuthContextValue;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

// JSDoc-not: Suspense + ErrorBoundary-fallbacks är tillfälliga inline-komponenter.
// Ersätts av Mm-Spinner + Mm-ErrorState från Fas 3 (designsystem).
function RootLayout() {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div role="alert" className="p-4">
          <h1 className="text-2xl font-bold">Något gick fel</h1>
          <p className="mt-2">Vi kunde inte ladda sidan. Försök ladda om.</p>
          <button
            type="button"
            onClick={() => {
              resetError();
              window.location.reload();
            }}
            className="mt-4 rounded bg-primary px-4 py-2 text-white"
          >
            Ladda om
          </button>
        </div>
      )}
    >
      <Suspense
        fallback={
          <div role="status" aria-live="polite" className="p-4">
            Laddar…
          </div>
        }
      >
        <Outlet />
      </Suspense>
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      )}
    </Sentry.ErrorBoundary>
  );
}
