import { createLink } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { Link as AriaLink, type LinkProps as AriaLinkProps } from 'react-aria-components';

/** Initialerna för cirkeln ("AA" ur "Anna Andersson") — max två, versala. */
function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

// className/style/children är förseglade: radens form är facit-låst
// (S83-facitet) och konsumenter komponerar inte om den — API:t växer additivt
// vid verkligt behov (NavCard-primitivens försegling, över-engineering-vakten).
interface PersonMiniKortLinkProps extends Omit<AriaLinkProps, 'children' | 'className' | 'style'> {
  /** Visningsnamnet (callern äger namnlös-fallbacken, displayName-disciplinen). */
  namn: string;
  /** Relationsrollen ("Medföljande (+1)", "Personkort", …) — underraden. */
  roll: string;
}

function PersonMiniKortLink({ namn, roll, ...props }: PersonMiniKortLinkProps) {
  return (
    <div className="flex flex-col py-2">
      <AriaLink
        {...props}
        className="-mx-2 flex w-auto items-center gap-3 rounded-xl border border-transparent bg-surface px-3 py-2.5 hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-border-strong"
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
        >
          {initialer(namn)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-body">{namn}</span>
          <span className="text-caption text-text-muted">{roll}</span>
        </span>
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="ml-auto shrink-0 text-text-secondary"
        />
      </AriaLink>
    </div>
  );
}

/**
 * [BIBLIOTEKS-KANDIDAT] PersonMiniKort — relationslänk som litet kort i kortet
 * (task-18.17 byggkrav 7; CRM-record-idiomet): initial-cirkel + namn +
 * roll-underrad + chevron, HELA ytan klickbar. Ersätter understrukna
 * textlänkar för person-/anmälningsrelationer. Nyskriven mot facit
 * (throwaway-kontraktet — prototypkod absorberas aldrig); promoveras till
 * primitives/ vid andra konsumenten (rule of three-disciplinen).
 *
 * Byggd på react-aria-components `Link` (ADR-044) wrappad i TanStack Routers
 * `createLink` (NavCard-primitivens exakta mekanism): `to`/`params` typas mot
 * registrerade routes, renderar ett riktigt `<a href>` — router-navigering,
 * hover/press-semantik och fokushantering utan egen kod.
 *
 * A11y (11): initial-cirkeln och chevronen är aria-hidden (dekor — namnet +
 * rollen bär det tillgängliga namnet: "Anna Andersson, Medföljande (+1)").
 * Hover-plattan är åtgärdsradernas grammatik (K56-familjen: bg-emphasized +
 * motion-safe) — relationsraden LEDER VIDARE, till skillnad från NavCard-
 * raderna (medvetet hover-fria, M3). Träffytan är ≈52 px (≥44 px-golvet).
 *
 * @example
 * ```tsx
 * <PersonMiniKort
 *   namn="Anna Andersson"
 *   roll="Medföljande (+1)"
 *   to="/event/$eventId/anmalan/$registrationId"
 *   params={{ eventId, registrationId }}
 * />
 * ```
 */
export const PersonMiniKort = createLink(PersonMiniKortLink);
