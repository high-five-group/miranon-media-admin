import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { AuthContextValue } from './auth/AuthProvider';
import { SectionError } from './components/ErrorBoundary';
import { dataSource } from './data/dataSource';
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
      // Explicit per ADR-047 B5 — pausar offline, visar cachad data;
      // persistQueryClient defer till Fas 6/8.
      networkMode: 'online',
    },
    mutations: {
      // Explicit per ADR-047 B5 — mutationer pausar offline (köas inte;
      // Background Sync är Fas 8 per ADR-019).
      networkMode: 'online',
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
  // Branded sektions-fallback för alla router-livscykelfel inkl. root-route-fel
  // (ADR-038; uppgraderad till SectionError i Session 16 K4-konsolideringen).
  // Sentry-capture sker via createRoot onCaughtError (main.tsx) — ingen onError
  // här (undviker dubbel-rapport).
  defaultErrorComponent: SectionError,
  // `dataSource` injiceras som statisk modul-instans (som `queryClient`) — DI via
  // router-context, ADR-055. `auth` är det enda per-render-bootstrappade värdet
  // (fylls av InnerApp i main.tsx). Hela route-trädets `context.dataSource` typas
  // härifrån via Register-interfacet nedan.
  context: {
    queryClient,
    dataSource,
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
