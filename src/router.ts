import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { AuthContextValue } from './auth/AuthProvider';
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
 * Router invalideras via router.invalidate() i AuthProvider vid auth-state-byte (login/logout)
 * så beforeLoad-guard re-evalueras och redirect:ar korrekt.
 */
export const router = createRouter({
  routeTree,
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
}
