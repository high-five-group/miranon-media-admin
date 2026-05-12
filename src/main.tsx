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
    router.invalidate();
  }, [auth.isAuthenticated, auth.isLoading]);

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

// [GA] Registrera service worker (tom skelett i Fas 0, Workbox i Fas 5)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Tyst fallback — service workern utökas med Workbox i Fas 5
    });
  });
}

// [GA] Rapportera Core Web Vitals
reportWebVitals();
