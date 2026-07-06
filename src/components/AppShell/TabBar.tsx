import { Link } from '@tanstack/react-router';
import { CalendarDays, Ellipsis, House, Users } from 'lucide-react';

/**
 * Flikdefinition för huvudnavigationen. `to` är typad mot routerns
 * registrerade routes — en flik mot en obefintlig route är ett typfel.
 * Ikonval följer flikarnas domänbegrepp (task-1.2, PRD beslut 8): Hem = hus,
 * Event = kalender (kurser/föreläsningar är datumburna), Personer = människor,
 * Mer = "•••" (FK:s exakta Mer-form, referens IMG_1538).
 */
const TABS = [
  { to: '/hem', label: 'Hem', icon: House },
  { to: '/event', label: 'Event', icon: CalendarDays },
  { to: '/personer', label: 'Personer', icon: Users },
  { to: '/mer', label: 'Mer', icon: Ellipsis },
] as const;

/**
 * Botten-fäst tab bar — huvudnavigationens fyra flikar, FK-mönstret
 * (task-1.2; referens `docs/reference/fk-referens/IMG_1538.PNG`): ikon ÖVER
 * etikett per flik, aktiv flik markerad med pill-formad tonal bakgrund
 * (primär-tinten — Miranon-identiteten på FK:s struktur) + fetstil — FORM
 * och vikt, aldrig enbart färg (WCAG 1.4.1, AC #1).
 *
 * Tillgänglighet: navigation är `<nav aria-label>` + länk-lista med
 * `aria-current="page"` på aktiv flik — INTE ARIA-tabs-rollerna, som är
 * avsedda för innehållspaneler i samma vy, inte sidnavigation
 * (K3-promptens mönsterval). Ikonerna är dekorativa (`aria-hidden`) —
 * etiketten ensam bär länknamnet (samma accessible names som före
 * uppgraderingen → skärmläsar-upplevelsen är stabil). Touch-targets ≥ 44 px
 * (`min-h-11` på pill-länken). Inga animationer utöver `transition-colors`
 * (neutraliseras globalt under `prefers-reduced-motion`, base.css);
 * `prefers-contrast: more` ger starkare gränser + kantlinje på aktiva pillen
 * via `contrast-more:`-varianterna.
 *
 * Layout: botten-fäst på alla breakpoints (mobil-först per byggplanens
 * "Lotta på telefon i mötet"); på bred vy centreras flikraden mot samma
 * 600 px-maxbredd som innehållsytan. Inga hårdkodade färger — allt via
 * semantiska tokens (noll nya tokens; beslut 2).
 */
export function TabBar() {
  return (
    <nav
      aria-label="Huvudnavigation"
      className="fixed inset-x-0 bottom-0 border-border border-t bg-surface contrast-more:border-border-strong"
    >
      <ul className="mx-auto my-0 flex w-full max-w-[600px] list-none p-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex flex-1 justify-center py-1.5">
              <Link
                to={tab.to}
                activeProps={{ 'aria-current': 'page' }}
                className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-full border border-transparent px-4 py-1 text-caption text-text-secondary transition-colors data-[status=active]:bg-primary-tint data-[status=active]:font-semibold data-[status=active]:text-text contrast-more:text-text contrast-more:data-[status=active]:border-border-strong"
              >
                <Icon aria-hidden="true" size={20} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
