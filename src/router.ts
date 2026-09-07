import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { AuthContextValue } from './auth/AuthProvider';
import { Sidbytesindikator } from './components/AppShell';
import { SectionError } from './components/ErrorBoundary';
import { dataSource } from './data/dataSource';
import { registreraIntresseradeRetryPolicy } from './queries/intresserade-retry-policy';
import { PERSIST_MAX_AGE_MS } from './queries/persist';
import { registreraPersonregistretsFarskhet } from './queries/personregister-farskhet';
import { routeTree } from './routeTree.gen';

// QueryClient defaults per docs/specs/STATE-STRATEGY.md §3.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — data anses färsk
      // 24 h — hela cachen persistas (ADR-072); gcTime ≥ persistens maxAge
      // (skyddsräcke 2 — lägre värde kasserar lagrad cache i förtid,
      // dokumenterad GC-fälla). Var 30 min före persist-lagret (task-8.3).
      gcTime: PERSIST_MAX_AGE_MS,
      retry: 3,
      retryDelay: (attempt) => Math.min(200 * 2 ** attempt, 2000),
      refetchOnWindowFocus: true, // Uppdatera när Lotta återvänder
      refetchOnReconnect: 'always', // Uppdatera när internet återgår
      // Explicit per ADR-047 B5 — pausar offline, visar cachad data
      // (numera även restaurerad över appstarter: persist-lagret ADR-072).
      networkMode: 'online',
    },
    mutations: {
      // Explicit per ADR-047 B5 — mutationer pausar offline (köas inte;
      // Background Sync är Fas 8 per ADR-019).
      networkMode: 'online',
    },
  },
});

// TASK-286.4 (ADR-123 beslut 6) — personregistrets EGEN färskhet, 30 min mot
// globalens 5. Registrerad HÄR, direkt efter klienten, så färskhets-policyn
// bor med de övriga query-defaultsen i stället för i en vy-komponent — och så
// att BÅDA konsumenterna av nyckeln (PersonsList:s useQuery och TabBar:s
// prefetch) ärver samma värde. Motiveringen, och varför
// refetchOnWindowFocus/refetchOnReconnect medvetet INTE nämns, står i modulen.
registreraPersonregistretsFarskhet(queryClient);

// TASK-420 (fynd ur PR #2395 review-runda 2) — retry-policyn för
// `intresserade.all` bor på NYCKELN, inte hos ett enskilt anropsställe: två
// konsumenter (denna motorns startvärmning och `Intresserade.tsx`) delade
// tidigare samma cache-post med motstridiga retry-svar på 4xx. Se modulens
// eget filhuvud (`src/queries/intresserade-retry-policy.ts`) för hela
// motiveringen och TanStack Query-källorna.
registreraIntresseradeRetryPolicy(queryClient);

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
 *
 * ═══ TASK-416.10 — defaultPreload: 'intent' (route-CHUNKEN hämtas på avsikt) ═══
 *
 * `@tanstack/router-core` sätter ingen default för `defaultPreload` (typdefaults
 * `false`, källäst `node_modules/@tanstack/router-core/dist/esm/router.d.ts`;
 * bekräftat live: `dist/esm/router.js` sätter `defaultPreloadDelay: 50` men
 * aldrig `defaultPreload` — samma fynd som `src/lib/chunk-laddningsfel.ts`s
 * docblock bokför). Utan denna rad hämtades route-chunken FÖRST vid klick,
 * vilket gav två väntesteg i följd (chunk → data) trots att ADR-078 beslut 3
 * redan värmer DATA på avsikt (`TabBar.tsx`s `varmPersonregister`). TanStack
 * Routers egen preloading-guide (verifierad 2026-09-06,
 * https://tanstack.com/router/latest/docs/framework/react/guide/preloading):
 * *"The simplest way to preload routes for your application is to set the
 * `defaultPreload` option to `intent` for your entire router."* — hover och
 * `touchstart` på varje `<Link>` (t.ex. `TabBar.tsx`s fyra flikar) startar nu
 * chunk-hämtningen, klicket väntar bara om hovern var för kort.
 *
 * `defaultPreloadStaleTime: 0` — samma guide: *"To let an external cache make
 * the freshness decision, set `routerOptions.defaultPreloadStaleTime` ... to
 * `0`."* Router-corets egen default är 30 s (`router.d.ts`
 * `defaultPreloadStaleTime`), men den fristen gäller ROUTE-LOADERNS data, inte
 * chunk-hämtningen (chunken laddas via `loadRouteChunk` oavsett stale-ålder;
 * källäst `node_modules/@tanstack/router-core/dist/esm/load-client.js`
 * — `staleAge` styr bara om en cachad LOADER-datamängd anses färsk). Ingen
 * route har en loader i dag (grep, 2026-09-06) så fältet gör strukturellt
 * ingenting ännu — men sätts explicit till 0 framåtriktat: dyker en loader
 * upp senare ska React Querys `staleTime: 5 * 60 * 1000` ovan äga
 * färskhetsbeslutet, inte routerns egna 30 s-fönster (och beslutet ska INTE
 * tas via `ensureQueryData` i en loader — ADR-078 beslut 1 förbjuder att
 * navigeringen väntar på data).
 *
 * `defaultPreloadDelay` lämnas OSATT — router-corets 50 ms-default
 * (`router.d.ts`, verifierat ovan) matchar guidens egen standardvärde och
 * täcker redan det ärliga hover-avsikts-fönstret; ingen mätning här visar
 * skäl att avvika.
 */
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  // Branded sektions-fallback för alla router-livscykelfel inkl. root-route-fel
  // (ADR-038; uppgraderad till SectionError i Session 16 K4-konsolideringen).
  // Sentry-capture sker via createRoot onCaughtError (main.tsx) — ingen onError
  // här (undviker dubbel-rapport).
  defaultErrorComponent: SectionError,
  // TASK-233: aktiverar VARJE routes egen `React.Suspense`-gräns (TanStack
  // Routers `MatchView`/`ResolvedSuspenseBoundary` blir `React.Suspense`
  // ENDAST om en pendingComponent finns, route-egen eller — som här —
  // router-default). Utan detta bubblar en route-chunks Suspense-kast förbi
  // varje mellanliggande gräns till __root.tsx:s rot-gräns (källäst mot
  // node_modules/@tanstack/react-router/src/Match.tsx v1.170.21) — det var
  // ROTORSAKEN till TASK-233:s mikro-blink (Förberedelseskärmen återanvänd
  // som rot-Suspense-fallback, fel vikt för en vanlig sidbyte). Se
  // `Sidbytesindikator.tsx`s docblock för hela resonemanget, inkl. varför
  // en handrullad CSS-fördröjning INTE löser samma problem.
  //
  // 1000/500 ms är INTE en gissning: matchar ORDLISTA.md "Lugnt laddläge"
  // ("under 1 sekund visas ingen indikation alls", Laddtrappans egen
  // överordnade princip, ADR-113) OCH TanStack Routers egen bibliotekets-
  // default (källäst, `@tanstack/router-core/src/router.ts` rad
  // ~1139–1140) — satt EXPLICIT här (i stället för tyst default) så en
  // framtida biblioteksuppgradering inte kan glida under oss.
  defaultPendingComponent: Sidbytesindikator,
  defaultPendingMs: 1000,
  defaultPendingMinMs: 500,
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
  // (hideShellHeader-flaggan riven S73: appen har ingen shell-header alls —
  // app-regeln bor i AppShell:s dokumentation.)
  interface StaticDataRouteOption {
    title?: string;
  }
}
