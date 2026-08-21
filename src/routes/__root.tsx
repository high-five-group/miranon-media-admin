import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';
import { Suspense } from 'react';
import type { AuthContextValue } from '@/auth/AuthProvider';
import { AppUpdateBanner, RouteAnnouncer, Sidbytesindikator } from '@/components/AppShell';
import { NotisPrototypVaxlare } from '@/components/dev/NotisPrototypVaxlare';
import type { DataSourceAdapter } from '@/data/adapters/DataSourceAdapter';

interface RouterContext {
  queryClient: QueryClient;
  // Datakälla injicerad via router-context (ADR-055) — DI-kärlet för alla
  // UI→data-anrop; läses route-agnostiskt via useDataSource().
  dataSource: DataSourceAdapter;
  auth: AuthContextValue;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

// Fel-hantering bor INTE här sedan Session 16 K4-konsolideringen: sektions-
// fel tas av defaultErrorComponent (SectionError, src/router.ts) och allt
// ovanför av AppErrorBoundary (src/main.tsx). Sentry.ErrorBoundary:n som
// tidigare wrappade trädet är riven — dess unika täckning var near-zero
// (todo-trådens K0.3b-empiri) och rapporteringen sker via createRoot-hooks.
function RootLayout() {
  return (
    <>
      {/* Uppdaterings-bannern ligger HÄR och inte i AppShell, av exakt samma
          skäl som RouteAnnouncer nedan: en ny appversion rör alla grenar
          (login/dev/inloggat), inte bara det inloggade skalet. Live-regionen
          är alltid monterad och tom tills en uppdatering finns — den syns
          därför inte förrän den har något att säga (ADR-047 § Amendering
          2026-08-13). */}
      <AppUpdateBanner />
      <Suspense
        fallback={
          // TASK-233: INTE längre Forberedelseskarm (appstartens helskärms-
          // splash var fel vikt för en route-chunks in-app-blink — se
          // Sidbytesindikator.tsx:s doc-block för hela rotorsaks-
          // resonemanget). Denna rot-gräns är numera i praktiken en
          // SÄKERHETSNÄT-fallback: `router.ts`s `defaultPendingComponent`
          // aktiverar VARJE routes EGEN Suspense-gräns, så en vanlig
          // route-chunks kast fångas normalt DÄR (samma Sidbytesindikator,
          // renderad utan denna rot-gräns inblandad) INNAN det någonsin
          // bubblar hit. Samma komponent här ändå, för den ovanliga
          // situationen att just DENNA gräns är den som fångar (t.ex.
          // allra första renderingen).
          <Sidbytesindikator />
        }
      >
        <NuqsAdapter>
          <Outlet />
          {/* [PROTOTYPE — KONVERGENS, S109] Notis-växlaren behöver nuqs-
              adaptern och bor därför här, inte bredvid AppUpdateBanner.
              DEV-grindad + egen `?variant`-grind — rivs vid promovering. */}
          {import.meta.env.DEV && <NotisPrototypVaxlare />}
        </NuqsAdapter>
      </Suspense>
      {/* Global, landmark-fri annonsering av route-byten — gäller alla
          grenar (login/dev/inloggat), därför här och inte i AppShell
          (Session 16 K3 STOPPA-utfall A, beslut 2). */}
      <RouteAnnouncer />
      {import.meta.env.DEV && import.meta.env.VITE_DEVTOOLS !== '0' && (
        <>
          {/* Topp-positioner sedan Fas 5: tab baren äger botten-ytan — en
              botten-fäst devtools-knapp skymmer flikarna (axe target-size,
              K3-verifieringsfynd). VITE_DEVTOOLS=0 stänger av knapparna i
              dev-läge — visual-fixturservern (task-36.7) kräver det: dev-
              artefakter hör inte hemma i baselines, och devtools-versioner
              får aldrig driva pixlar. */}
          <TanStackRouterDevtools position="top-right" />
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />
        </>
      )}
    </>
  );
}
