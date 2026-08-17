import { createLink } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
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
// CHEVRON höger (18 px, sekundärfärgen, aria-hidden): den tidigare
// ingen-chevron-regeln är RIVEN ÖPPET (task-18.3; S73 K25-prövningens
// Marcus-kvitterade konsekvens, PRD task-18 beslut 15) — chevron betyder
// att raden leder vidare, samma grammatik som eventsidans åtgärdsrader
// (spec §14 bär rivningen). HOVER-BAKGRUNDSÄNDRING
// (hover:bg-bg-emphasized motion-safe:transition-colors): det tidigare
// M3-beslutet ("INGEN hover-bakgrundsändring — prövad och förkastad",
// S64) är RIVET ÖPPET på Marcus omprövning 2026-08-17 (task-273.2, PRD
// task-273 beslut 3) — samma bakgrundsplatta + mjuk övergång som
// eventdetaljens åtgärdsrader (Atgarder.tsx RAD_KLASS) och hem-vyns
// Bevakningsrad (samma --mm-navcard-*-formade kort, redan
// hover:bg-bg-emphasized sedan TASK-243.1) — raden var alltså
// inkonsekvent med sitt eget syskon på samma sida tills denna skiva.
// Fokusringen kommer från den globala *:focus-visible-regeln i
// base.css; kantlinjen blir synlig under prefers-contrast: more;
// övergången är villkorad med motion-safe: (ingen transition vid
// prefers-reduced-motion).
function NavCardLink({ icon: Icon, label, ...props }: NavCardLinkProps) {
  return (
    <AriaLink
      {...props}
      className="text-(color:--mm-navcard-text) flex min-h-12 items-center gap-4 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-4 font-semibold text-body hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-(--mm-navcard-border-contrast)"
    >
      <Icon size={20} aria-hidden className="text-(color:--mm-navcard-icon) shrink-0" />
      <span className="grow">{label}</span>
      <ChevronRight size={18} aria-hidden className="text-(color:--mm-navcard-icon) shrink-0" />
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
 * Tillgänglighet: etiketten bär länknamnet ensam (radikonen OCH chevronen
 * är `aria-hidden`), träffytan är ≈58 px (≥44 px), fokusring via den globala
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
