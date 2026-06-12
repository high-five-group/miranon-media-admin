import { Link } from '@tanstack/react-router';

/**
 * Flikdefinition för huvudnavigationen. `to` är typad mot routerns
 * registrerade routes — en flik mot en obefintlig route är ett typfel.
 */
const TABS = [
  { to: '/hem', label: 'Hem' },
  { to: '/event', label: 'Event' },
  { to: '/personer', label: 'Personer' },
  { to: '/mer', label: 'Mer' },
] as const;

/**
 * Botten-fäst tab bar — huvudnavigationens fyra flikar (byggplan §4 Fas 5).
 *
 * Tillgänglighet: navigation är `<nav aria-label>` + länk-lista med
 * `aria-current="page"` på aktiv flik — INTE ARIA-tabs-rollerna, som är
 * avsedda för innehållspaneler i samma vy, inte sidnavigation
 * (K3-promptens mönsterval). Touch-targets ≥ 44 px (`min-h-11`).
 *
 * Layout: botten-fäst på alla breakpoints (mobil-först per byggplanens
 * "Lotta på telefon i mötet"); på bred vy centreras flikraden mot samma
 * 600 px-maxbredd som innehållsytan. Aktiv flik markeras med färg + tjockare
 * topplinje (inte enbart färg, WCAG 1.4.1). `prefers-contrast: more` ger
 * starkare gränser via `contrast-more:`-varianterna.
 */
export function TabBar() {
  return (
    <nav
      aria-label="Huvudnavigation"
      className="fixed inset-x-0 bottom-0 border-border border-t bg-surface contrast-more:border-border-strong"
    >
      <ul className="mx-auto my-0 flex w-full max-w-[600px] list-none p-0">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <Link
              to={tab.to}
              activeProps={{ 'aria-current': 'page' }}
              className="flex min-h-11 items-center justify-center border-transparent border-t-2 px-2 text-small text-text-secondary data-[status=active]:border-primary data-[status=active]:font-semibold data-[status=active]:text-text contrast-more:text-text"
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
