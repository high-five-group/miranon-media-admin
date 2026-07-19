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
 * `<main id="main" tabIndex={-1}>` (skip-länkens programmatiska fokusmål)
 * → botten-fäst tab bar.
 *
 * APP-REGEL (Marcus-beslut S73, stängde klass C-punkten "headerns öde
 * app-brett" från S55): appen har INGEN shell-header — ingen sida, någonsin.
 * Varje sida äger sin synliga h1 (rubrikpolicyn S64); app-identiteten bär
 * login-ytan/manifestet. Per-vy-flaggan `hideShellHeader` (task-4.2) är
 * riven — regeln är global, inte per vy.
 *
 * Monteras på _authenticated-layouten, INTE __root — login/dev-ytorna bär
 * egna `<main>`-landmarks och tab bar för utloggad användare vore död
 * navigation (Session 16 K3 STOPPA-utfall A).
 *
 * - Innehållsytan är max 600 px (byggplanens content-area) och centrerad;
 *   responsiv 375/768/1024 utan breakpoint-specialfall.
 * - Skalet har inga animationer/transitions (prefers-reduced-motion
 *   respekteras genom att inget rör sig); `prefers-contrast: more`
 *   förstärker gränserna via `contrast-more:`-varianterna.
 * - `pb-24` på main ger frihöjd ovanför den fixerade tab baren.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <SkipLink />
      <OfflineIndicator />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[600px] px-4 py-4 pb-24">
        {children}
      </main>
      <TabBar />
    </>
  );
}
