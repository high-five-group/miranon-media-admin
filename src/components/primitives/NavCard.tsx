import { createLink } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { Link as AriaLink, type LinkProps as AriaLinkProps } from 'react-aria-components';

/**
 * Ikon-kontraktet är strukturellt (size/aria-hidden/className) — inte låst
 * till lucide-react. Varje ikonbibliotek vars komponenter tar dessa props
 * kan bära raden (återanvändbarhet 11).
 */
export type NavCardIcon = ComponentType<{
  size?: number;
  'aria-hidden'?: boolean;
  className?: string;
}>;

// className/style/children är förseglade: radens form är facit-låst
// (M6, sessionsdok S64 Del 3) och konsumenter komponerar inte om den.
// API:t växer additivt vid verkligt behov (över-engineering-vakten).
interface NavCardLinkProps extends Omit<AriaLinkProps, 'children' | 'className' | 'style'> {
  /** Dekorativ radikon — renderas 20 px, aria-hidden, i sekundärfärgen. */
  icon: NavCardIcon;
  /** Radens etikett (16/600) — bär länknamnet ENSAM (ikonen är tyst). */
  label: string;
}

// Färger uteslutande via komponent-tokens (--mm-navcard-*, components.css).
// INGEN chevron (app-bred regel: navigationsrader bär inte chevron) och
// INGEN hover-bakgrundsändring (M3 prövad och förkastad) — medvetna
// facit-beslut, inte utelämnanden. Fokusringen kommer från den globala
// *:focus-visible-regeln i base.css; kantlinjen blir synlig under
// prefers-contrast: more. Raden är statisk (ingen transition/animation).
function NavCardLink({ icon: Icon, label, ...props }: NavCardLinkProps) {
  return (
    <AriaLink
      {...props}
      className="text-(color:--mm-navcard-text) flex min-h-12 items-center gap-4 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-4 font-semibold text-body contrast-more:border-(--mm-navcard-border-contrast)"
    >
      <Icon size={20} aria-hidden className="text-(color:--mm-navcard-icon) shrink-0" />
      <span className="grow">{label}</span>
    </AriaLink>
  );
}

/**
 * NavCard — navigationsrads-primitiv: hel klickbar kort-rad med dekorativ
 * ikon och router-typad länk (M6-facitet, S64 Del 3; DESIGN-SYSTEM-SPEC §14).
 *
 * Byggd på react-aria-components `Link` (ADR-044) wrappad i TanStack
 * Routers `createLink` (routerns dokumenterade custom-link-mönster) —
 * `to` är typad mot registrerade routes, en rad mot en obefintlig route
 * är ett typfel. Renderar ett riktigt `<a href>`; router-navigering,
 * hover/press-semantik och fokushantering följer med utan egen kod.
 *
 * Tillgänglighet: etiketten bär länknamnet ensam (ikonen `aria-hidden`),
 * träffytan är ≈58 px (≥44 px), fokusring via den globala
 * `:focus-visible`-regeln, synlig kantlinje under `prefers-contrast: more`.
 *
 * Anatomi: NavCard är själva raden — konsumenten äger `<nav aria-label>`
 * → `<ul>` → `<li><NavCard /></li>` (se /dev/primitives-demon).
 *
 * @example
 * ```tsx
 * <nav aria-label="Mer-sidor">
 *   <ul className="flex flex-col gap-2.5">
 *     <li>
 *       <NavCard to="/mer/anmalningar" icon={ClipboardList} label="Anmälningar" />
 *     </li>
 *   </ul>
 * </nav>
 * ```
 */
export const NavCard = createLink(NavCardLink);
