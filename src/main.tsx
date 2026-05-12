import * as Sentry from '@sentry/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Validera env-variabler vid uppstart — kraschar direkt om något saknas.
import './env';

import './styles/base.css';
import './styles/tailwind.css';

import { AuthProvider } from './auth/AuthProvider';
import { reportWebVitals } from './lib/report-web-vitals';
import { initSentry } from './observability/sentry';
import { routeTree } from './routeTree.gen';

// M7: initiera Sentry FÖRE React mountas så att tidiga fel
// (env-validering, root-element-fel, ...) fångas. Skip i lokal dev.
initSentry();

// QueryClient med defaults per STATE-STRATEGY.md §3.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — data anses färsk
      gcTime: 30 * 60 * 1000, // 30 min — cachad data lever kvar
      retry: 3,
      retryDelay: (attempt) => Math.min(200 * 2 ** attempt, 2000),
      refetchOnWindowFocus: true, // Uppdatera när Lotta återvänder
      refetchOnReconnect: 'always', // Uppdatera när internet återgår
    },
  },
});

// Router instantierad på modul-scope. context.auth fylls per-render i App-komponenten
// nedan (TanStack Router-rekommendation för auth-context-pattern).
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: { user: null, isLoading: false }, // K2-skelett: overrides i App via useAuth() i K3
  },
});

// Type-safe router registreras globalt.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  // I K2 är AuthProvider-skelettet trivialt (statiskt value). K3 byter till useAuth()-hook
  // från src/auth/useAuth.ts som dynamiskt läser context.
  return (
    <RouterProvider
      router={router}
      context={{
        auth: { user: null, isLoading: false },
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
