import { registerSW } from 'virtual:pwa-register';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Validera env-variabler vid uppstart — kraschar direkt om något saknas.
import './env';

import './styles/base.css';
import './styles/tailwind.css';

import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import { reportWebVitals } from './lib/report-web-vitals';
import { initSentry } from './observability/sentry';
import { queryClient, router } from './router';

// M7: initiera Sentry FÖRE React mountas så att tidiga fel
// (env-validering, root-element-fel, ...) fångas. Skip i lokal dev.
initSentry();

/**
 * InnerApp-pattern (officiell TanStack-rekommendation):
 * useAuth() kan bara anropas i React-komponent, inte i modul-scope. InnerApp wrappar
 * RouterProvider och passar auth-context dynamiskt. Vid auth-state-byte triggas
 * router.invalidate() så beforeLoad-guarder re-evalueras.
 *
 * Utan router.invalidate() kan _authenticated-routes fortsätta tänka att user är obehörig
 * efter login, eller vice versa efter logout.
 */
function InnerApp() {
  const auth = useAuth();

  // **TRIGGER på BÅDA isAuthenticated OCH isLoading** för router.invalidate().
  // Race-condition utan isLoading-dep (upptäckt via K4.3 regression-test):
  //   1. Initial mount: AuthProvider state är { user: null, isLoading: true, isAuthenticated: false }
  //   2. _authenticated.tsx beforeLoad ser isLoading: true → return (vänta)
  //   3. getSession() settles: { user: null, isLoading: false, isAuthenticated: false }
  //   4. isAuthenticated förblev false (false → false) → useEffect TRIGGAR INTE → guard
  //      re-evalueras ALDRIG → utloggad användare ser /hem (skyddat innehåll, "Not Found"
  //      eller motsvarande beroende på route)
  // Med isLoading i deps: settle-event (true → false) triggar router.invalidate() →
  // guard re-evaluerar → redirect till /login om ej autentiserad.
  // K4.3 Test 4 + Test 6 fångar denna race empiriskt.
  // Effekten KÖR vid state-ändring — router är modul-singleton, refereras inte i body.
  // biome-ignore lint/correctness/useExhaustiveDependencies: medveten TRIGGER på auth-state-byte
  useEffect(() => {
    // Invalidate ENDAST när auth är löst. Under isLoading är <RouterProvider> render-gate:ad
    // (mountas ej, se nedan) → routerns context.auth är fortfarande modul-defaulten (undefined).
    // En invalidate då skulle köra beforeLoad mot undefined auth → krasch. Gaten + invalidate
    // är komplementära: gaten sköter initial resolution, invalidate sköter login/logout
    // (auth-byten EFTER mount, då isLoading redan är false).
    if (!auth.isLoading) {
      router.invalidate();
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  // Render-gate (ADR-037): montera <RouterProvider> först när auth är löst. Invariant:
  // context.auth är definitiv (isLoading=false) när VARJE beforeLoad körs → ingen flash
  // av skyddat innehåll under auth-resolution (Fynd 2+3 + index.tsx-vektorn, K0.2b).
  // Komplementär till invalidate-effekten ovan (initial resolution vs senare auth-byten).
  // Laddningsindikatorn matchar __root.tsx Suspense-fallbacken (role=status, aria-live).
  if (auth.isLoading) {
    return (
      <div role="status" aria-live="polite" className="p-4">
        Laddar…
      </div>
    );
  }

  return <RouterProvider router={router} context={{ auth }} />;
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root-elementet #root saknas i index.html');
}

// React 19 createRoot-hooks integrerar Sentry för root-level error-capture.
// Sentry.ErrorBoundary i __root.tsx fångar UI-render-fel; createRoot-hooks fångar
// allt som passerar förbi (event handlers, async, recoverable errors).
createRoot(rootEl, {
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.error('Uncaught error:', error, errorInfo);
  }),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);

// Registrera Workbox-SW:n (Fas 5, ADR-047) via vite-plugin-pwa.
// registerSW är no-op i dev (devOptions.enabled: false) och guardar själv
// mot miljöer utan serviceWorker-stöd.
registerSW();

// [GA] Rapportera Core Web Vitals
reportWebVitals();
