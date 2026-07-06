import { useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { OfflineIndicator } from './OfflineIndicator';
import { SkipLink } from './SkipLink';
import { TabBar } from './TabBar';

export interface AppShellProps {
  /** Sidinnehållet — renderas i `<main id="main">`. */
  children: ReactNode;
}

/**
 * App-skal för de inloggade vyerna (Fas 5, byggplan §4): skip-länk →
 * header-landmark med app-titel → `<main id="main" tabIndex={-1}>`
 * (skip-länkens programmatiska fokusmål) → botten-fäst tab bar.
 *
 * Monteras på _authenticated-layouten, INTE __root — login/dev-ytorna bär
 * egna `<main>`-landmarks och tab bar för utloggad användare vore död
 * navigation (Session 16 K3 STOPPA-utfall A).
 *
 * - Innehållsytan är max 600 px (byggplanens content-area) och centrerad;
 *   responsiv 375/768/1024 utan breakpoint-specialfall.
 * - App-titeln är medvetet INTE en rubrik — varje sida äger sin h1.
 * - Skalet har inga animationer/transitions (prefers-reduced-motion
 *   respekteras genom att inget rör sig); `prefers-contrast: more`
 *   förstärker gränserna via `contrast-more:`-varianterna.
 * - `pb-24` på main ger frihöjd ovanför den fixerade tab baren.
 */
export function AppShell({ children }: AppShellProps) {
  // [PROTOTYPE] Design-granskningsläge (T65-konvergensen, S55): för
  // prototyp-varianter BORTOM baslinjen K1 avstår skalet sitt chrome
  // (header + tabbar) och 600px-breddlåset — varianten bär eget adaptivt
  // chrome (K2:s vänstermeny/mock-tabbar). K1 behåller skarpa skalet
  // (exakt-kopia-baslinjen). Tas bort med prototypen.
  const bareVariant = useRouterState({
    select: (s) => {
      const v = new URLSearchParams(s.location.searchStr).get('variant');
      return v !== null && v !== 'k1';
    },
  });
  if (import.meta.env.DEV && bareVariant) {
    return (
      <>
        <SkipLink />
        <OfflineIndicator />
        <main id="main" tabIndex={-1} className="w-full">
          {children}
        </main>
      </>
    );
  }
  return (
    <>
      <SkipLink />
      <header className="border-border border-b bg-surface contrast-more:border-border-strong">
        <div className="mx-auto flex min-h-12 w-full max-w-[600px] items-center px-4">
          <span className="font-semibold">Miranon Media Admin</span>
        </div>
      </header>
      <OfflineIndicator />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[600px] px-4 py-4 pb-24">
        {children}
      </main>
      <TabBar />
    </>
  );
}
