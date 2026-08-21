import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CalendarDays, Ellipsis, House, Users } from 'lucide-react';
import { useCallback } from 'react';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

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
 * (grå betonings-ytan `--mm-bg-emphasized`; loop 3: primär-tinten avvisad —
 * kolliderade med Nästa event-kortets ton) + fetstil — FORM och vikt,
 * aldrig enbart färg (WCAG 1.4.1, AC #1).
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
 * Layout: FLYTANDE kapsel (design-review-loopens iterationer, Marcus
 * 2026-07-06 — FK:s tabbar svävar med luft mot skärmens kanter och botten,
 * IMG_1538): rundad container med kantlinje UTAN skugga (loop 2: nedåtriktad
 * shadow-lg avvisad), fäst `bottom-4` med sidomarginaler, centrerad mot
 * innehållsytans maxbredd på bred vy. Aktiv-pillen fyller flikcellens
 * bredd (loop 2: bred stadium-form som FK, inte smal oval).
 * Botten-fäst på alla breakpoints (mobil-först per byggplanens "Lotta på
 * telefon i mötet"); skalets `pb-24` på main ger fortsatt frihöjd. Inga
 * hårdkodade färger — allt via semantiska tokens (noll nya tokens;
 * beslut 2).
 */
export function TabBar() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  // PREFETCH PÅ AVSIKT (ADR-078 beslut 3, ADR-123 beslut 7, TASK-286.2):
  // hover/fokus på Personer-fliken är den tidigaste ärliga signalen om att
  // Lotta ska öppna personregistret — värmningen startar här i stället för
  // vid klicket/mount. Samma nyckel som `PersonsList`s egen `useQuery`
  // (`queryKeys.persons.register`) — React Query dedupar, så en redan varm
  // eller pågående hämtning kostar inget extra anrop. `useCallback` ger
  // stabil identitet (samma skäl som `useForberedEventDetalj`/
  // `useForberedPersonDetalj`), men är här inte last-bärande för någon
  // effekt-dependency — bara vanlig hygien.
  const varmPersonregister = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.persons.register,
      queryFn: () => dataSource.fetchPersonsRegister(),
    });
  }, [dataSource, queryClient]);

  return (
    <nav
      aria-label="Huvudnavigation"
      // print:hidden (task-17.7): navigation är död på papper — GOV.UK-
      // blacklisten via Tailwinds återanvändbara print-variant (idiomets
      // motsvarighet till govuk-!-display-none-print), aldrig engångs-CSS.
      className="fixed inset-x-4 bottom-4 mx-auto max-w-[568px] rounded-full border border-border bg-surface contrast-more:border-border-strong print:hidden"
    >
      <ul className="my-0 flex w-full list-none items-center gap-1 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex flex-1">
              <Link
                to={tab.to}
                activeProps={{ 'aria-current': 'page' }}
                onMouseEnter={tab.to === '/personer' ? varmPersonregister : undefined}
                onFocus={tab.to === '/personer' ? varmPersonregister : undefined}
                className="flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-full border border-transparent px-2 py-1 text-caption text-text-secondary transition-colors data-[status=active]:bg-bg-emphasized data-[status=active]:font-semibold data-[status=active]:text-text contrast-more:text-text contrast-more:data-[status=active]:border-border-strong"
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
