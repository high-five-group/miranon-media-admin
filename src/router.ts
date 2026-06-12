import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { AuthContextValue } from './auth/AuthProvider';
import { RouteErrorFallback } from './components/RouteErrorFallback';
import { routeTree } from './routeTree.gen';

// QueryClient defaults per docs/specs/STATE-STRATEGY.md §3.
export const queryClient = new QueryClient({
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

/**
 * Router instantierad på modul-scope. context.auth fylls per-render via InnerApp-komponenten
 * i main.tsx (TanStack-rekommenderat mönster för auth-context). queryClient är statisk
 * modul-singleton.
 *
 * Router invalideras via router.invalidate() i InnerApp (main.tsx) vid auth-state-byte
 * (login/logout) så beforeLoad-guard re-evalueras och redirect:ar korrekt.
 *
 * `auth: undefined as unknown as AuthContextValue`-cast är TanStack-etablerat mönster.
 * InnerApp fyller den faktiska auth-context-värdet innan någon route kör.
 * (Alternativet `undefined!` non-null-assertion bryter biome's noNonNullAssertion-regel.)
 */
export const router = createRouter({
  routeTree,
  // Branded fallback för alla router-livscykelfel inkl. root-route-fel (ADR-038).
  // Ersätter TanStacks obrandade default ("Something went wrong!"). Sentry-capture
  // sker via createRoot onCaughtError (main.tsx) — ingen onError här (undviker dubbel-rapport).
  defaultErrorComponent: RouteErrorFallback,
  context: {
    queryClient,
    auth: undefined as unknown as AuthContextValue,
  },
});

// Type-safe router registreras globalt för useNavigate/Link/redirect-funktionalitet.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  // Title-konvention (Fas 5, Session 16 K3): varje route deklarerar sin
  // sidtitel via staticData. RouteAnnouncer (__root) annonserar den till
  // skärmläsare och sätter document.title vid klient-navigationer.
  interface StaticDataRouteOption {
    title?: string;
  }
}
