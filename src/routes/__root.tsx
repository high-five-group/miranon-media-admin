import * as Sentry from '@sentry/react';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';
import { Suspense } from 'react';
import type { AuthContextValue } from '@/auth/AuthProvider';
import { RouteAnnouncer } from '@/components/AppShell';

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
          <h1 className="font-bold text-2xl">Något gick fel</h1>
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
        <NuqsAdapter>
          <Outlet />
        </NuqsAdapter>
      </Suspense>
      {/* Global, landmark-fri annonsering av route-byten — gäller alla
          grenar (login/dev/inloggat), därför här och inte i AppShell
          (Session 16 K3 STOPPA-utfall A, beslut 2). */}
      <RouteAnnouncer />
      {import.meta.env.DEV && (
        <>
          {/* Topp-positioner sedan Fas 5: tab baren äger botten-ytan — en
              botten-fäst devtools-knapp skymmer flikarna (axe target-size,
              K3-verifieringsfynd). */}
          <TanStackRouterDevtools position="top-right" />
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />
        </>
      )}
    </Sentry.ErrorBoundary>
  );
}
