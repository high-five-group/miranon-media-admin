import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Validera env-variabler vid uppstart — kraschar direkt om något saknas.
import './env';

import './styles/base.css';
import './styles/tailwind.css';

import { AuthProvider } from './auth/AuthProvider';
import { reportWebVitals } from './lib/report-web-vitals';
import { initSentry } from './observability/sentry';
import { queryClient, router } from './router';

// M7: initiera Sentry FÖRE React mountas så att tidiga fel
// (env-validering, root-element-fel, ...) fångas. Skip i lokal dev.
initSentry();

function App() {
  // K3.1: hardcoded K2-skelett-context behålls tills K3.2 byter till InnerApp-pattern.
  // K3.2 ersätter detta med useAuth()-baserat context från en InnerApp-wrapper
  // + router.invalidate() vid auth-state-byte.
  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          user: null,
          isLoading: false,
          isAuthenticated: false,
          login: async () => {
            throw new Error('K3.1 skelett — login implementeras i K3.2');
          },
          logout: async () => {
            throw new Error('K3.1 skelett — logout implementeras i K3.2');
          },
        },
      }}
    />
  );
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
        <App />
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
