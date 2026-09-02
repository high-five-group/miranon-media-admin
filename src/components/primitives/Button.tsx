import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { cn } from '@/lib/cn';

// State-styling sker uteslutande via React Arias data-attribut
// (data-hovered/data-pressed/data-disabled) — inte :hover/:active — så att
// pekar-, tangentbords- och touch-interaktion får identisk semantik.
// Fokusring kommer från den globala *:focus-visible-regeln i base.css
// (--mm-focus-ring, exklusiv färg per ACCESSIBILITY-CHECKLIST §2).
//
// TVÅDIMENSIONELL variantmodell (spec §19; Marcus beslut A 2026-07-25):
// INTENT styr färgen (semantiken — success/primary/danger), EMPHASIS styr
// vikten per YTKLASS (solid/outline/subtle). De semantiska intenterna bär
// alla tre emphasis-formerna via compoundVariants (inga överlappande
// klasser mellan variant-axlarna — varje kombination äger hela sin visuella
// form). secondary/ghost är NEUTRALA stödformer som står utanför
// emphasis-dimensionen (secondary ÄR en neutral outline, ghost ÄR en
// neutral subtle) — emphasis-propen är en dokumenterad no-op för dem.
const buttonVariants = cva(
  // `relative` (TASK-361 r2): förankrar ladd-lagrets `absolute`-overlay
  // (se render-funktionens kommentar). `inline-flex` är tillbaka till
  // FÖRLAGANS motor (r1:s `inline-grid` + stapel-teknik ÄR RIVEN, se
  // `ButtonProps` §isLoading-amenderingen och docblockets § "STABILA
  // MÅTT UNDER LADDLÄGE" för varför).
  'relative inline-flex select-none items-center justify-center rounded font-sans transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[loading]:cursor-progress',
  {
    variants: {
      intent: {
        primary: '',
        secondary:
          'border border-(--mm-button-secondary-border) bg-(--mm-button-secondary-bg) text-(color:--mm-button-secondary-text) data-[hovered]:bg-(--mm-button-secondary-bg-hover) data-[pressed]:bg-(--mm-button-secondary-bg-pressed)',
        danger: '',
        ghost:
          'bg-(--mm-button-ghost-bg) text-(color:--mm-button-ghost-text) data-[hovered]:bg-(--mm-button-ghost-bg-hover) data-[pressed]:bg-(--mm-button-ghost-bg-pressed)',
        // success = grön (task-19.3; §19 intent-regeln) — handlingen når
        // utomstående (Skicka bekräftelse, utskick, armerad publicering).
        success: '',
      },
      emphasis: {
        solid: '',
        outline: '',
        subtle: '',
      },
      // `gap-*` BOR INTE här (TASK-361, oförändrat sedan r1) — se
      // `CONTENT_GAP` nedan. `gap` verkar mellan FLEX-BARN i den yttre
      // knappen, men etikett-lagret är knappens ENDA flödes-deltagande
      // barn (ladd-overlayn är `absolute`, utanför flödet — se
      // render-kommentaren) — ett `gap` här vore därför dött CSS.
      // Gap-VÄRDENA lever kvar oförändrade, bara på rätt nivå.
      size: {
        sm: 'min-h-8 px-3 text-small',
        md: 'min-h-10 px-4 text-body',
        lg: 'min-h-12 px-5 text-lg',
      },
    },
    compoundVariants: [
      // ── solid (sidnivå/primär handlingsyta — dagens form) ──
      {
        intent: 'primary',
        emphasis: 'solid',
        class:
          'bg-(--mm-button-primary-bg) text-(color:--mm-button-primary-text) data-[hovered]:bg-(--mm-button-primary-bg-hover) data-[pressed]:bg-(--mm-button-primary-bg-pressed)',
      },
      {
        intent: 'danger',
        emphasis: 'solid',
        class:
          'bg-(--mm-button-danger-bg) text-(color:--mm-button-danger-text) data-[hovered]:bg-(--mm-button-danger-bg-hover) data-[pressed]:bg-(--mm-button-danger-bg-pressed)',
      },
      {
        intent: 'success',
        emphasis: 'solid',
        class:
          'bg-(--mm-button-success-bg) text-(color:--mm-button-success-text) data-[hovered]:bg-(--mm-button-success-bg-hover) data-[pressed]:bg-(--mm-button-success-bg-pressed)',
      },
      // ── outline (kort och listrader: intent-färgen bärs av text + kant —
      //    aldrig solid fyllnad inuti kort; §19 emphasis-regeln) ──
      {
        intent: 'primary',
        emphasis: 'outline',
        class:
          'border border-(--mm-button-primary-outline-border) bg-(--mm-button-primary-outline-bg) text-(color:--mm-button-primary-outline-text) data-[hovered]:bg-(--mm-button-primary-outline-bg-hover) data-[pressed]:bg-(--mm-button-primary-outline-bg-pressed)',
      },
      {
        intent: 'danger',
        emphasis: 'outline',
        class:
          'border border-(--mm-button-danger-outline-border) bg-(--mm-button-danger-outline-bg) text-(color:--mm-button-danger-outline-text) data-[hovered]:bg-(--mm-button-danger-outline-bg-hover) data-[pressed]:bg-(--mm-button-danger-outline-bg-pressed)',
      },
      {
        intent: 'success',
        emphasis: 'outline',
        class:
          'border border-(--mm-button-success-outline-border) bg-(--mm-button-success-outline-bg) text-(color:--mm-button-success-outline-text) data-[hovered]:bg-(--mm-button-success-outline-bg-hover) data-[pressed]:bg-(--mm-button-success-outline-bg-pressed)',
      },
      // ── subtle (tabellrader/toolbars, kompakt: svag intent-tonad platta;
      //    contrast-more tänder en kant i intent-färgen — 11-golvet) ──
      {
        intent: 'primary',
        emphasis: 'subtle',
        class:
          'bg-(--mm-button-primary-subtle-bg) text-(color:--mm-button-primary-subtle-text) data-[hovered]:bg-(--mm-button-primary-subtle-bg-hover) data-[pressed]:bg-(--mm-button-primary-subtle-bg-pressed) contrast-more:border contrast-more:border-current',
      },
      {
        intent: 'danger',
        emphasis: 'subtle',
        class:
          'bg-(--mm-button-danger-subtle-bg) text-(color:--mm-button-danger-subtle-text) data-[hovered]:bg-(--mm-button-danger-subtle-bg-hover) data-[pressed]:bg-(--mm-button-danger-subtle-bg-pressed) contrast-more:border contrast-more:border-current',
      },
      {
        intent: 'success',
        emphasis: 'subtle',
        class:
          'bg-(--mm-button-success-subtle-bg) text-(color:--mm-button-success-subtle-text) data-[hovered]:bg-(--mm-button-success-subtle-bg-hover) data-[pressed]:bg-(--mm-button-success-subtle-bg-pressed) contrast-more:border contrast-more:border-current',
      },
    ],
    defaultVariants: {
      intent: 'primary',
      size: 'md',
      emphasis: 'solid',
    },
  },
);

// Gap-VÄRDET per storlek (TASK-361, oförändrat sedan r1) — etikett-lagret
// är knappens enda flex-lager med SIDA-VID-SIDA-barn (t.ex. en konsuments
// egen ikon + text), och behöver därför sin egen gap-skala. Egen konstant,
// inte en tredje cva, så värdena inte duplicerar sig.
const CONTENT_GAP: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2',
};

export interface ButtonProps
  extends Omit<AriaButtonProps, 'className' | 'children'>,
    VariantProps<typeof buttonVariants> {
  /** Extra klasser som merge:as in efter variant-klasserna (tailwind-merge). */
  className?: string;
  /**
   * SMALARE ÄN `AriaButtonProps['children']` (TASK-361): ren `ReactNode`,
   * INTE render-prop-formen (`(renderProps) => ReactNode`) React Aria
   * tillåter på sin egen `<Button>`. Etikett-lagret (se render-kommentaren
   * nedan) monterar `children` i en PLAIN `<span>`, som bara accepterar
   * `ReactNode`. Ingen befintlig konsument använder funktionsformen (grep,
   * 2026-09-02); en framtida konsument som vill åt press/hover-state i sin
   * knapptext bygger det UTANFÖR `children` (t.ex. eget state via `Button`s
   * `data-pressed`/`data-hovered` på ett omslutande element).
   */
  children?: ReactNode;
  /** Ref till det underliggande <button>-elementet (React 19-stil). */
  ref?: Ref<HTMLButtonElement>;
  /**
   * Laddtrappans steg 2 (ADR-113): true medan knappen utför en arbetande
   * mutation (submit, spara, radera). Byter innehållet mot en knapp-intern
   * spinner + `loadingText`, spärrar klick och Enter/Space, och annonserar
   * `loadingText` till skärmläsare — allt inbyggt EN gång på biblioteksnivå
   * i stället för handbyggt per konsument (se PRD TASK-219 berättelse 6).
   *
   * MEDVETET INTE `isDisabled`/react-aria-components' `isPending`: båda
   * renderar native `disabled`-attribut (`isDisabled`) resp. tvingar en
   * `aria-live="assertive"`-annonsering (`isPending`s interna
   * `announce(…, 'assertive')`, verifierat i källkoden) — assertive är
   * samma aggressiva klass som FK:s eget `role="alert"`-mönster, som
   * research-passet fann VARA STRÄNGARE än WAI-ARIA-praxis rekommenderar
   * (`docs/research/loading-indikator-branschpraxis-2026-08-15.md` § 4;
   * ADR-113 § Beslut punkt 2 väljer uttryckligen polite). Klick spärras i
   * stället via `aria-disabled` (fokus bevaras — knappen tas ALDRIG bort ur
   * tabordningen, till skillnad från native `disabled`) + att `onPress`
   * kopplas bort + att `type="submit"` tillfälligt blir `type="button"`
   * (stoppar webbläsarens implicita andra-submit via Enter i ETT annat
   * fält, utan att röra fokus).
   *
   * AMENDERING r1 (TASK-361, 2026-09-02): knappen bytte tidigare `children`
   * MOT spinner+`loadingText` — två helt olika innehåll med två olika
   * bredder, så knappen hoppade i bredd (och ibland höjd) exakt i det
   * ögonblick den gick in i laddläge (Marcus prod-röktest-fynd, S113 resume
   * 8).
   *
   * AMENDERING r2 (TASK-361, samma dag, granskningsfynd PR #2212 runda 1,
   * risk HÖG): r1:s fix (CSS Grid-stapling, båda lagren alltid monterade
   * och staplade i samma cell) löste laddläges-hoppet men införde en NY,
   * ALLVARLIGARE bugg — knappens mått blev PERMANENT MAX(etikett,
   * ladd-lager) ÄVEN I VILA, eftersom grid-spårets storlek beräknas av
   * BÅDA lagren oavsett synlighet. En knapp som `<Button isLoading={x}
   * loadingText="Loggar in …">Logga in</Button>` blev därför BREDARE än
   * "Logga in" REDAN INNAN `x` någonsin blivit sant — exakt den
   * knappbredd-klass Marcus dömde ut, fast permanent i stället för ett
   * hopp, och otäckt av någon visuell baseline (ingen av de 42 CI-spårade
   * baselinerna renderar en `Button isLoading`-instans). Se `Button`s
   * render-kommentar för den rättade tekniken (etiketten äger måttet
   * ensam, ladd-laget är `absolute` och kan aldrig påverka layouten).
   *
   * Propens kontrakt (namn, default, annonsering) är OFÖRÄNDRAT genom båda
   * amenderingarna.
   */
  isLoading?: boolean;
  /**
   * Texten som ANNONSERAS (polite, `role="status"`, sr-only) medan
   * `isLoading` är true — t.ex. "Loggar in …". Default "Laddar …" för
   * konsumenter som inte bryr sig om ordvalet.
   *
   * SYNS ALDRIG (TASK-361 r2): en synlig `loadingText` kan vara LÄNGRE än
   * etiketten och skulle då spränga knappens bredd — precis den bugg r1
   * införde (se `isLoading`-amenderingen ovan). ADR-113 kräver inte synlig
   * text: beslut 2 kräver "spinner + spärrat klickläge + skärmläsarbesked"
   * (inget ord om VISUELL text), och beslut 4 sanktionerar uttryckligen
   * "sr-only-besked parat med synlig indikator" som "fortsatt normformen"
   * — precis vad detta är (spinnern är den synliga indikatorn,
   * `loadingText` är sr-only-beskedet). Samma par som t.ex.
   * `Waitlist.tsx`s redan etablerade `role="status" aria-live="polite"
   * sr-only`-mönster.
   */
  loadingText?: string;
}

/**
 * Knapp-primitiv på react-aria-components-bas (ADR-044) med CVA-varianter.
 *
 * TVÅ DIMENSIONER (DESIGN-SYSTEM-SPEC §19; Marcus beslut A 2026-07-25):
 * - `intent` styr FÄRGEN efter vad handlingen GÖR: `success` når utomstående ·
 *   `primary` internt · `danger` destruktivt. `secondary`/`ghost` är neutrala
 *   stödformer utanför emphasis-dimensionen (emphasis är no-op för dem).
 * - `emphasis` styr VIKTEN efter ytklassen: `solid` (default) på sidnivå/
 *   primär handlingsyta · `outline` i kort och listrader (intent-färgen bärs
 *   av text + kant — aldrig solid fyllnad inuti kort) · `subtle` i
 *   tabellrader/toolbars (kompakt tonplatta).
 *
 * Tillgänglighet: renderar ett riktigt `<button>`-element via React Aria —
 * Enter/Space, fokushantering och `aria-disabled`-semantik följer med utan
 * egen kod. Minsta träffyta ≥ 24×24 px (sm = 32 px hög); använd `md`/`lg`
 * (40/48 px) i primärflöden per ACCESSIBILITY-CHECKLIST §2 (44×44-rekommendation).
 * `subtle` tänder en kant i intent-färgen under prefers-contrast: more.
 *
 * `isLoading` (Laddtrappans steg 2, ADR-113): knapp-intern spinner + spärrat
 * klickläge med bevarat fokus + polite skärmläsarbesked, se `ButtonProps`
 * §isLoading för det fulla resonemanget kring varför INTE `isPending`.
 * Respekterar `prefers-reduced-motion` (spinnern animeras endast via
 * `motion-safe:`, samma gating som Skeleton-primitivens shimmer).
 *
 * STABILA MÅTT UNDER LADDLÄGE (TASK-361 r2 — se `ButtonProps`
 * §isLoading/§loadingText-amenderingarna för HELA historiken, inklusive
 * varför r1:s teknik revs):
 *
 * ETIKETTEN (`children`) ÄGER KNAPPENS MÅTT ENSAM, ALLTID — i vila OCH i
 * laddläge. Den renderas i det NORMALA FLÖDET oavsett `isLoading` (bara
 * `invisible` under laddning, vilket döljer den UTAN att ta bort dess
 * layout-utrymme). Ladd-lagret (spinner + sr-only `loadingText`) är
 * `absolute inset-0` — HELT UTANFÖR FLÖDET — och kan därför STRUKTURELLT
 * ALDRIG påverka knappens bredd eller höjd, i NÅGOT läge. Detta skiljer sig
 * medvetet från r1:s "MAX av båda lagren"-stapling (som gjorde måttet
 * `loadingText`-beroende även i vila — den nya buggen r2 fixar).
 *
 * VALD TEKNIK, mot branschkällorna (fulla citat i PR-kroppen för TASK-361):
 * MUI:s `LoadingButton` positionerar sin `loadingIndicator` `position:
 * absolute` ovanpå ett barn-spann vars synlighet togglas men som förblir i
 * flödet och ensamt bestämmer bredden. React Aria Components egen
 * `isPending`-vägledning (react-aria.adobe.com/Button) säger samma sak:
 * "to reserve space for the button's label while pending... set it to
 * `visibility: hidden`" — ETIKETTEN reserverar utrymmet, inte en
 * sammanslagning av båda lagren. Shopify Polaris `Spinner`-dokumentationen
 * bekräftar mönstret för knappar explicit. Chakra UI:s Button
 * (`isLoading`) lovar uttryckligen "leave[s] the button's width unchanged"
 * — konsistent med "bredden = etikettens bredd, punkt", inte
 * "bredden = det bredaste av två alternativ".
 *
 * `loadingText` SYNS ALDRIG (se `ButtonProps`§loadingText) — bara ett
 * `role="status" aria-live="polite" sr-only`-spann, sanktionerat av
 * ADR-113 § Beslut punkt 4 ("sr-only-besked parat med synlig indikator är
 * fortsatt normformen"). Ladd-lagret MONTERAS ENDAST när `isLoading` är
 * sant (villkorad rendering, inte alltid-monterat + attribut-toggling) —
 * det löser TVÅ sido-fynd från r1 PÅ EN GÅNG:
 * - `role`/`aria-live` fanns tidigare KVAR som DOM-attribut i vila (dolda
 *   för skärmläsare via `aria-hidden`, men fortfarande matchbara av en
 *   CSS-attributselektor som `[aria-live="polite"]` — `InstallPrompt.spec.ts`
 *   fällde exakt på detta).
 * - `Loader2`s `motion-safe:animate-spin` fortsatte SNURRA i bakgrunden i
 *   vila, eftersom `visibility:hidden` stoppar MÅLNING men INTE en pågående
 *   CSS-animation — `notisfamiljen-rorelsefri.test.ts`s sidobreda
 *   `document.getAnimations()`-räkning fällde tre orelaterade tester.
 * Med villkorad montering existerar ladd-lagrets DOM-nod, attribut och
 * animation bara medan `isLoading` faktiskt är sant — ingen toggling
 * behövs, inget att glömma.
 *
 * @example
 * ```tsx
 * <Button intent="primary" size="md" onPress={() => save()}>
 *   Spara
 * </Button>
 * <Button intent="success" emphasis="outline" size="sm" onPress={() => sendMail()}>
 *   Skicka bekräftelse
 * </Button>
 * <Button intent="danger" size="sm" isDisabled>
 *   Ta bort
 * </Button>
 * <Button type="submit" size="lg" isLoading={isSubmitting} loadingText="Loggar in …">
 *   Logga in
 * </Button>
 * ```
 */
export function Button({
  intent,
  size,
  emphasis,
  className,
  ref,
  isLoading = false,
  loadingText = 'Laddar …',
  type,
  onPress,
  children,
  ...props
}: ButtonProps) {
  // cva:s defaultVariants sätter INTE denna råa `size`-variabel (den lever
  // bara inuti `buttonVariants(...)`s returnerade sträng) — samma
  // `?? 'md'`-upplösning som defaultVariants.size, så `CONTENT_GAP`-slaget
  // nedan aldrig kan bli `undefined`.
  const resolvedSize = size ?? 'md';
  return (
    <AriaButton
      {...props}
      type={isLoading && type === 'submit' ? 'button' : type}
      aria-disabled={isLoading || props['aria-disabled']}
      onPress={isLoading ? undefined : onPress}
      data-loading={isLoading || undefined}
      ref={ref}
      className={cn(buttonVariants({ intent, size, emphasis }), className)}
    >
      {/* ETIKETTEN ÄGER MÅTTET, ENSAM (TASK-361 r2) — `children` renderas
          ALLTID i det normala flödet; `invisible` (visibility:hidden)
          döljer den under laddning UTAN att ta bort dess layout-utrymme,
          så knappens bredd/höjd är IDENTISKA i vila och laddläge. Se
          docblockets § "STABILA MÅTT UNDER LADDLÄGE" för källorna. */}
      <span
        className={cn(
          'inline-flex items-center justify-center',
          CONTENT_GAP[resolvedSize],
          isLoading && 'invisible',
        )}
        aria-hidden={isLoading || undefined}
      >
        {children}
      </span>
      {isLoading && (
        // ÖVERLAGD, ALDRIG I FLÖDET (TASK-361 r2): `absolute inset-0` tar
        // ladd-laget UR layout-beräkningen helt — till skillnad från r1:s
        // stapel-lager (som DELADE knappens grid-spår med etiketten och
        // därmed kunde breddsätta den) kan detta lager STRUKTURELLT aldrig
        // påverka knappens mått, i något läge. `AriaButton`s `relative`
        // (buttonVariants bas-sträng) är förankringen `inset-0` mäter mot.
        // Villkorad montering (inte alltid-monterat + attribut-toggle):
        // löser r1:s BÅDA sido-fynd i samma drag, se `Button`s docblock.
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          data-testid="button-ladd-overlay"
        >
          <Loader2 aria-hidden="true" className="size-4 shrink-0 motion-safe:animate-spin" />
          {/* `loadingText` SYNS ALDRIG — bara sr-only, se `ButtonProps`
              §loadingText för ADR-113-motiveringen. Bär knappens
              tillgängliga NAMN under laddläge (när ingen `aria-label` är
              satt — etikett-spannet ovan är `invisible`, alltså uteslutet
              ur namn-beräkningen) OCH den oberoende
              live-region-annonseringen. Samma `role="status" aria-live=
              "polite" sr-only`-mönster som redan etablerat i t.ex.
              `Waitlist.tsx`. */}
          <span role="status" aria-live="polite" className="sr-only">
            {loadingText}
          </span>
        </span>
      )}
    </AriaButton>
  );
}
