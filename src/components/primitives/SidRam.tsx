import { createLink } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import type { Ref } from 'react';
import { Link as AriaLink, type LinkProps as AriaLinkProps } from 'react-aria-components';

/**
 * SidRam — husets KANT-I-KANT sidkrom (TASK-299.1; PRD `TASK-299`
 * beslut 2–3, grillad samsyn S111 Del 2 § C): rund `size-11`-chevron
 * indragen `mx-4`, tillbaka till föregående yta — kortytan/innehållsytan
 * som följer stannar kant i kant mot `<main>`s egen padding, ingen extra
 * inramning läggs på.
 *
 * HÄRKOMST: klass för klass identisk med den geometri som redan lever i
 * `PersonDetail.tsx` § `sidRam` och `EventCheckin.tsx` (chevron `mx-4`) samt
 * `ManuellAnmalanForm.tsx`/`AtgardsSida.tsx` § `Sidhuvud` (rubrikblockets
 * form, `border-border border-b px-4 pb-5`) — ingen ny form mintas, sex
 * kopierade sidkrom-instanser lyfts till en delad primitiv (ADR-126; numret
 * stod som ADR-124 fram till TASK-299.6 — det hann tas av
 * förhandsgranskningens leveransväg medan detta beslut ännu var omintat).
 *
 * RUBRIKBLOCKET ÄR VALFRITT (AC #1): satt `rubrik` — sidramen äger
 * rubrikblocket också (den BREDARE omfattningen, `Sidhuvud`-formen med
 * avgränsande linje under). Utelämnad — sidramen äger bara chevronen (den
 * SMALARE omfattningen); callern renderar sitt eget rubrikblock separat och
 * ansvarar själv för att hålla det `px-4`-indraget så helheten läser som
 * kant-i-kant.
 *
 * OMFATTNINGEN ÄR LÅST sedan 2026-08-22 (`TASK-299.2`, Marcus; PRD
 * `TASK-299` § OMFATTNINGEN LÅST punkt 2): huset bär den SMALARE — bara
 * sidkromet, rubriken lever kvar i varje sida. Den rubrik-ägande grenen har
 * därmed NOLL skarpa konsumenter och renderas enbart på `/dev/primitives`,
 * där den också axe-provas. Den behålls med avsikt: att bredda en primitiv
 * senare är billigt, att smalna av den betyder att plocka isär varje
 * konsument (`ADR-126` B3). Formen och familjegränsen:
 * `docs/specs/DESIGN-SYSTEM-SPEC.md` § 23.
 *
 * Byggd på react-aria-components `Link` (ADR-044) wrappad i TanStack
 * Routers `createLink` (samma mekanism som `NavCard`/`PersonMiniKort`):
 * `to`/`params` typas mot registrerade routes, renderar ett riktigt
 * `<a href>` — router-navigering, hover/press-semantik och fokushantering
 * följer med utan egen kod.
 *
 * Tillgänglighet (11): chevronen är ikon-ENSAM och kräver därför ett
 * tillgängligt namn från callern (`tillbakaEtikett`, obligatorisk — ingen
 * tyst standard som kan bli fel för en given yta); ikonen själv är
 * `aria-hidden`. Rubrikens `<h1>` tar valfri `rubrikRef` för fokusflytt vid
 * datalandning (samma mönster som `PersonDetail`/`ManuellAnmalanForm`).
 * Träffytan är 44 px (`size-11` = golvet exakt).
 *
 * @example
 * ```tsx
 * // Smalare omfattning — sidramen äger bara chevronen.
 * <SidRam to="/personer" tillbakaEtikett="Tillbaka till personer" />
 * <header className="flex flex-col gap-2 px-4">
 *   <h1 className="font-semibold text-3xl">{namn}</h1>
 * </header>
 *
 * // Bredare omfattning — sidramen äger rubrikblocket också.
 * <SidRam
 *   to="/mer"
 *   tillbakaEtikett="Tillbaka till Mer"
 *   rubrik="Dokument"
 *   rubrikRef={headingRef}
 * />
 * ```
 */
interface SidRamLinkProps
  extends Omit<AriaLinkProps, 'children' | 'className' | 'style' | 'aria-label'> {
  /** Chevronens tillgängliga namn — ikonen bär ingen synlig text. */
  tillbakaEtikett: string;
  /** Rubrikens text. Satt: sidramen äger rubrikblocket (bredare omfattning).
      Utelämnad: sidramen äger bara chevronen (smalare omfattning). */
  rubrik?: string;
  /** Ref till rubrikens `<h1>` — fokusflytt vid datalandning. Ignoreras om `rubrik` saknas. */
  rubrikRef?: Ref<HTMLHeadingElement>;
}

/**
 * TOPP-LUFTEN ÄGS AV SIDRAMEN (Marcus 2026-08-23, fönster 3-QA: *"Alla
 * chevrons vi nu satt dit, inklusive anmälningssidan sitter ju mycket högre
 * upp än alla andra, eventdetaljsidan, manuell anmälan etc sitter ju korrekt
 * lite längre ned. … Flytta ner alla. Tanken med sidkromet som komponent var
 * ju att alla 'undersidor' skulle se likadana ut i 'grunden'."*). Mätt i
 * koden: varje undersida med egen inline-chevron (EventDetail,
 * ManuellAnmalanForm, AtgardsSida, CreateEventForm, AnmalanDetail) bär
 * `pt-2 lg:pt-10` på sin sektion — 8 px mobil, 40 px desktop — medan
 * Mer-sidorna som fick SidRam saknade det. `mt-2 lg:mt-10` på chevronen ger
 * samma offset (marginal på första flex-barnet = padding på sektionen, ingen
 * kollaps i flex), och konsumenten ska INTE själv lägga topp-padding före
 * SidRam — persondetaljen och check-in släppte sin sektions-`pt` i samma
 * landning, nettonoll där.
 */
function SidRamLink({ tillbakaEtikett, rubrik, rubrikRef, ...props }: SidRamLinkProps) {
  return (
    <>
      <AriaLink
        {...props}
        aria-label={tillbakaEtikett}
        className="mx-4 mt-2 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted lg:mt-10"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </AriaLink>
      {rubrik != null && (
        <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
          <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
            {rubrik}
          </h1>
        </header>
      )}
    </>
  );
}

export const SidRam = createLink(SidRamLink);
export type { SidRamLinkProps as SidRamProps };
