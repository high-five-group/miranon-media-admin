import { createLink } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import type { Ref } from 'react';
import {
  Button as AriaButton,
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components';

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
/**
 * Chevronens geometri — EN KÄLLA, delad av bägge grenarna nedan.
 *
 * Strängen låg tidigare inline i `SidRamLink`. Den bröts ut när `SidRamKnapp`
 * (TASK-322) tillkom, av exakt det skäl `ADR-126` finns för: den föregående
 * kopian av dessa klasser — `GenereringsVy.tsx` § `KromKnapp` — hade en
 * docblock som påstod "EXAKT `DokumentYta`s klasser". Det var sant när den
 * skrevs och FALSKT från och med 2026-08-23, då topp-luften (`mt-2 lg:mt-10`)
 * lades till här men inte där. Marcus såg driften i granskningen 2026-08-24:
 * *"bakåtchevronen sitter för högt upp, jag har varit tydlig med att alla
 * undersidor ska ha samma sidkrom, samma 'grund'."* — samma observation som
 * gav topp-luften från början.
 *
 * En delad konstant kan inte glida isär. En kopierad klass-sträng kan bara
 * det.
 */
const CHEVRON_KLASS =
  'mx-4 mt-2 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted lg:mt-10';

function SidRamLink({ tillbakaEtikett, rubrik, rubrikRef, ...props }: SidRamLinkProps) {
  return (
    <>
      <AriaLink {...props} aria-label={tillbakaEtikett} className={CHEVRON_KLASS}>
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

export interface SidRamKnappProps {
  /** Chevronens tillgängliga namn — ikonen bär ingen synlig text. */
  tillbakaEtikett: string;
  /** Vad "tillbaka" betyder här. */
  onTillbaka: () => void;
}

/**
 * SidRamKnapp — sidkromets chevron för ytor som går tillbaka UTAN att byta
 * route.
 *
 * VARFÖR EN ANDRA GREN OCH INTE EN ANDRA KOMPONENT: `SidRam` är wrappad i
 * TanStack Routers `createLink` och renderar ett riktigt `<a href>`. Det är
 * rätt för de sex ytor som navigerar till en annan route — men fel för en yta
 * som byter läge INOM sin egen route via query-parametrar. Genereringsvyn är
 * den första sådana: `/mer/dokument?vy=generering` går "tillbaka" genom att
 * nolla `vy`, inte genom att gå någon annanstans.
 *
 * Den ytan bar därför en egen handrullad `<button>` (`GenereringsVy.tsx`
 * § `KromKnapp`, riven i TASK-322) — kopia nummer sju av en geometri
 * `ADR-126` just hade samlat i en primitiv, och den enda som inte fick
 * topp-luften när den lades till. Att lappa in `mt-2 lg:mt-10` i kopian hade
 * löst instansen och lämnat nästa drift på plats; Marcus 2026-08-24:
 * *"INGET lappande"*. Grenen här delar `CHEVRON_KLASS` med länk-grenen, så
 * geometrin har en källa oavsett vilken navigeringsform ytan behöver.
 *
 * Tillgänglighet (11): samma kontrakt som länk-grenen — `tillbakaEtikett` är
 * obligatorisk (ikonen är ensam), ikonen `aria-hidden`, träffytan 44 px
 * (`size-11`). react-aria-components `Button` ger tangentbords- och
 * press-semantiken; ett `<button>` är dessutom rätt ELEMENT här, eftersom
 * ingen URL byts — en `<a>` utan `href` hade varit fel för både skärmläsare
 * och mellanklick.
 *
 * @example
 * ```tsx
 * <SidRamKnapp tillbakaEtikett="Tillbaka till Bilagor" onTillbaka={stang} />
 * ```
 */
export function SidRamKnapp({ tillbakaEtikett, onTillbaka }: SidRamKnappProps) {
  return (
    <AriaButton aria-label={tillbakaEtikett} className={CHEVRON_KLASS} onPress={onTillbaka}>
      <ChevronLeft aria-hidden="true" size={26} />
    </AriaButton>
  );
}
