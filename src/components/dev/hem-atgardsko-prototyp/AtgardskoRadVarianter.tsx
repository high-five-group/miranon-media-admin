import { createLink } from '@tanstack/react-router';
import { ChevronRight, Link2Off } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link as AriaLink, type LinkProps as AriaLinkProps } from 'react-aria-components';
import { atgardskoText } from '@/components/hem/hem-derivations';

/**
 * [TASK-291 AC #1] Divergens-varianter av åtgärdskö-radens INNEHÅLL —
 * QA-fynd 284.5: raden bar NOLL visuell särskiljning mot eventinfo-raden
 * (samma `--mm-navcard-*`-tokens, samma chevron, ingen ikon,
 * `Bevakningsrad.tsx:232-248` mot `:191`, båda radnumren disk-verifierade
 * 2026-08-22 — ingen glidning). Tre sätt att särskilja raden UTAN att låna
 * notistrappans varningsfärg/ikon (ADR-122 beslut 8, DESIGN-SYSTEM-SPEC
 * §22 — arbetsobjekt/notis-familjegränsen). Varje variant bär skillnaden i
 * minst en ICKE-FÄRG-kanal (284.4 AC #5-golvet, icke förhandlingsbart):
 *
 *   A "Ikon"     — ledande ikon-platta (`Link2Off`).      Kanal: IKONFORM.
 *   B "Etikett"  — ledande textrad ("Kräver åtgärd").      Kanal: TEXT.
 *   C "Räknare"  — ledande siffer-platta (talet, cirkel).  Kanal: FORM.
 *
 * DELAD SKAL (`AtgardskoRadSkal`): identisk yttre form som produktionens
 * `AtgardskoRadLink` (`Bevakningsrad.tsx`) — samma `--mm-navcard-*`-yta,
 * samma chevron, samma länk-primitiv (`AriaLink`+`createLink`,
 * `NavCard`-mönstret som `Bevakningsrad.tsx` redan följer). Bara
 * INNEHÅLLET mellan öppnande tagg och chevronen skiljer sig per variant —
 * exakt den yta fyndet pekar ut. Ingen variant lånar `bg-warning-bg`/
 * `text-warning`/`TriangleAlert`/`CircleAlert` (notisfamiljens paletter,
 * se `StatusBadge.tsx` ton="warning" för vad som INTE återanvänds här).
 *
 * FRISTÅENDE, INGEN IMPORT FRÅN `dev/hem-prototyp/`: TASK-226-substratets
 * `demoData.ts`/`VariantRo.tsx` m.fl. bär sitt EGET throwaway-kontrakt
 * (rivs med förlorarna/vid facit-skrivning) och är dessutom under aktiv
 * ändring av en parallell agent (TASK-299.1, `InitialAvatar.tsx`-flytten)
 * vid tidpunkten denna fil skrevs — noll beroende dit håller båda passen
 * fria från varandra.
 *
 * THROWAWAY-KONTRAKT (marcus-system:prototype-skillen, UI-gren): denna fil
 * hör till DIVERGENSFASEN. Förlorarna rivs efter Marcus val (AC #2); den
 * vinnande formen promoveras till `Bevakningsrad.tsx`s `AtgardskoRadLink`
 * i ett SEPARAT kort (AC #3) — INTE denna commit. Skarp yta
 * (`Bevakningsrad.tsx`) är HELT ORÖRD av denna fil.
 */

type AtgardskoInnehallProps = {
  /** Räknat antal (aldrig gissat) — se `atgardskoText`. */
  antal: number;
};

function AtgardskoRadSkal({
  children,
  ...props
}: Omit<AriaLinkProps, 'children' | 'className' | 'style'> & {
  children: React.ReactNode;
}) {
  return (
    <AriaLink
      {...props}
      className="text-(color:--mm-navcard-text) flex min-h-12 w-full items-center gap-3 rounded-2xl border border-(--mm-navcard-border) bg-(--mm-navcard-bg) px-4 py-3 text-left hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-(--mm-navcard-border-contrast)"
    >
      {children}
      <ChevronRight
        aria-hidden="true"
        size={18}
        className="text-(color:--mm-navcard-icon) shrink-0"
      />
    </AriaLink>
  );
}
const AtgardskoLinkSkal = createLink(AtgardskoRadSkal);

/**
 * VARIANT A — "Ikon": en ledande rund ikon-platta (`Link2Off`, "bruten
 * länk" — matchar felets natur: anmälningen kunde inte KOPPLAS till rätt
 * event) före textraden. Icke-färg-kanalen är IKONENS FORM (synlig i
 * gråskala/high-contrast — plattan bär dessutom en kant i
 * `contrast-more`, tonen ensam bär inget).
 */
export function AtgardskoRadIkon({ antal }: AtgardskoInnehallProps) {
  return (
    <AtgardskoLinkSkal to="/mer/anmalningar" search={{ visa: 'atgardskon' }}>
      <span
        aria-hidden="true"
        className="text-(color:--mm-primary) flex size-8 shrink-0 items-center justify-center rounded-full bg-(--mm-primary-tint) contrast-more:border contrast-more:border-(--mm-navcard-border-contrast)"
      >
        <Link2Off size={16} />
      </span>
      <span className="line-clamp-2 min-w-0 grow font-semibold text-body">
        {atgardskoText(antal)}
      </span>
    </AtgardskoLinkSkal>
  );
}

/**
 * VARIANT B — "Etikett": en ledande liten versal-etikett ("Kräver åtgärd")
 * ovanför textraden. Icke-färg-kanalen är TEXTEN SJÄLV — och till
 * skillnad från ikon-/räknar-varianternas dekorativa platta är etiketten
 * INTE `aria-hidden`: länkens tillgängliga namn ("Kräver åtgärd, 12
 * anmälningar …") bär skillnaden för skärmläsare också, inte bara
 * visuellt.
 */
export function AtgardskoRadEtikett({ antal }: AtgardskoInnehallProps) {
  return (
    <AtgardskoLinkSkal to="/mer/anmalningar" search={{ visa: 'atgardskon' }}>
      <span className="grid min-w-0 grow gap-y-0.5">
        <span className="font-semibold text-caption text-text-secondary uppercase tracking-wide">
          Kräver åtgärd
        </span>
        <span className="line-clamp-2 min-w-0 font-semibold text-body">{atgardskoText(antal)}</span>
      </span>
    </AtgardskoLinkSkal>
  );
}

/**
 * VARIANT C — "Räknare": en ledande rund platta med SIFFRAN i stället för
 * en ikon — strukturell omkastning (talet blir radens FÖRSTA visuella
 * element, textraden tappar sin fetstil eftersom plattan nu bär
 * betoningen). Icke-färg-kanalen är FORMEN (cirkel + siffra) — plattan
 * delar navcard-radens egna neutrala bakgrund/kant, ingen tonad färg
 * alls.
 */
export function AtgardskoRadRaknare({ antal }: AtgardskoInnehallProps) {
  return (
    <AtgardskoLinkSkal to="/mer/anmalningar" search={{ visa: 'atgardskon' }}>
      <span
        aria-hidden="true"
        className="text-(color:--mm-navcard-text) flex size-8 shrink-0 items-center justify-center rounded-full border border-(--mm-navcard-border-contrast) bg-(--mm-navcard-bg) font-semibold text-small tabular-nums"
      >
        {antal > 99 ? '99+' : antal}
      </span>
      <span className="line-clamp-2 min-w-0 grow text-body">{atgardskoText(antal)}</span>
    </AtgardskoLinkSkal>
  );
}

export type AtgardskoVariantKey = 'a' | 'b' | 'c';

/** Route-hemvisten slår upp variant-komponenten via denna karta i stället
    för en switch-sats — en ny variant kräver bara en rad här. */
export const ATGARDSKO_VARIANTER: Record<
  AtgardskoVariantKey,
  ComponentType<AtgardskoInnehallProps>
> = {
  a: AtgardskoRadIkon,
  b: AtgardskoRadEtikett,
  c: AtgardskoRadRaknare,
};
