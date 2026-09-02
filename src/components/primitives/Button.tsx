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
  // `inline-grid` (INTE `inline-flex`, sedan TASK-361): bärare av
  // laddlägets STABILA-MÅTT-stapling, se `ButtonProps` §isLoading och
  // render-funktionens kommentar. `inline-` bevarar knappens
  // krymp-till-innehåll-storlek (shrink-to-fit, samma flödesroll som
  // `inline-flex` hade) — bara DISPLAY-motorn byts, inte hur knappen sitter
  // i sidflödet.
  'inline-grid select-none items-center justify-center rounded font-sans transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[loading]:cursor-progress',
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
      // `gap-*` BOR INTE här längre (TASK-361) — se `CONTENT_GAP` nedan.
      // Motivet: `gap` verkar mellan GRID-SPÅR, och stapel-lagren delar
      // ETT enda spår (`[grid-area:1/1]`), så ett `gap` på denna nivå vore
      // dött CSS. Samma gap-VÄRDEN per storlek lever kvar, bara flyttade
      // till lagren som faktiskt har två sida-vid-sida-barn (ikon + text).
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

// Gap-VÄRDET per storlek som `size`-varianten bar innan TASK-361 flyttade
// det ned till de två stapel-lagren (etikett-laget och ladd-laget) — se
// `buttonVariants`s size-kommentar. Egen konstant, inte en tredje cva, för
// att båda lagren garanterat använder EXAKT samma gap-skala som förut utan
// att duplicera talen på två ställen.
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
   * tillåter på sin egen `<Button>`. Stapel-tekniken (se render-kommentaren
   * nedan) monterar `children` i en PLAIN `<span>`, som bara accepterar
   * `ReactNode` — och render-prop-formen (hover/press/focus-state) passar
   * oavsett inte kontraktet "samma innehåll syns i två lager, ett åt
   * gången". Ingen befintlig konsument använder funktionsformen (grep,
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
   * AMENDERING (TASK-361, 2026-09-02): knappen bytte tidigare `children` MOT
   * spinner+`loadingText` — två helt olika innehåll med två olika bredder,
   * så knappen hoppade i bredd (och ibland höjd) exakt i det ögonblick den
   * gick in i laddläge (Marcus prod-röktest-fynd, S113 resume 8). Fixad på
   * BIBLIOTEKSNIVÅ, se `Button`s render-kommentar för stapel-tekniken —
   * denna props kontrakt (namn, default, annonsering) är OFÖRÄNDRAT.
   */
  isLoading?: boolean;
  /**
   * Texten som visas OCH annonseras (polite, `role="status"`) medan
   * `isLoading` är true — t.ex. "Loggar in …". Default "Laddar …" för
   * konsumenter som inte bryr sig om ordvalet.
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
 * STABILA MÅTT UNDER LADDLÄGE (TASK-361, `§ isLoading`-amenderingen ovan):
 * etiketten och ladd-innehållet (spinner + `loadingText`) STAPLAS i SAMMA
 * grid-cell (`inline-grid` + `[grid-area:1/1]` på båda lagren, se
 * render-funktionens kommentar) i stället för att ETT av dem villkorat
 * monteras. Knappens mått blir därmed alltid det BREDASTE/HÖGSTA av de två
 * lagren, oavsett vilket som är synligt — bredd och höjd är identiska i
 * vila och i laddläge, även när `loadingText` är LÄNGRE än etiketten (en
 * konsument som vill ha en smal viloknapp väljer själv en kort
 * `loadingText` — knappen är i så fall lika bred i vila som i laddläge,
 * det är den medvetna avvägningen, inte en bugg).
 *
 * VALD TEKNIK, mot tre branschkällor (`docs/research/...` kommer inte hit —
 * se PR-kroppen för fulla citat): React Aria Components egen
 * `isPending`-vägledning ("to reserve space for the label while pending,
 * either set it to `visibility: hidden`… or `opacity: 0`…" —
 * react-aria.adobe.com/Button) och MUI:s `LoadingButton` (spinnern
 * `position: absolute`, etiketten kvar i flödet men dold) löser samma
 * problem via ABSOLUT POSITIONERING av spinnern ovanpå en dold-men-
 * platsbevarande etikett. CSS Grid-stapling (denna fils val) är en
 * ekvivalent, MER EXPLICIT variant av samma idé — ingen `position:
 * relative`-förälder att komma ihåg, ingen risk att glömma `absolute` på
 * den nytillkomna spinner-noden — dokumenterad av bl.a. Wes Bos
 * (`grid-template-areas:stack` + `grid-area:stack` + `visibility`-toggle,
 * "allows the largest item to size the button, and keeps the button text
 * accessible") och matchar Chakra UI:s dokumenterade, explicita löfte att
 * `isLoading` "leave[s] the button's width unchanged". `visibility`
 * (Tailwinds `invisible`), INTE `opacity`/`display:none`: ett lager som
 * INTE animeras eller behöver vara i den tillgänglighets-trädet SAMTIDIGT
 * som det andra — RAC:s egen varning mot `visibility:hidden` gäller bara
 * när ett SYNLIGT-FÖRDRÖJT läge ska vara i a11y-trädet FÖRE det visas
 * (ett fall Button inte har: `isLoading` växlar synligt OCH
 * a11y-trädsmedlemskap i SAMMA ögonblick, exakt som den gamla
 * villkorade renderingen redan gjorde) — se § isLoading-amenderingen.
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
      {/* STABILA MÅTT (TASK-361): BÅDA lagren renderas ALLTID — bara
          `invisible` (visibility:hidden) + `aria-hidden` växlar mellan dem.
          `[grid-area:1/1]` staplar dem i knappens ENDA grid-cell (satt av
          `inline-grid` i `buttonVariants`), så cellens mått = MAX(bredd,
          höjd) av de två lagren — identiskt oavsett vilket som syns. Se
          komponentens docblock § "STABILA MÅTT UNDER LADDLÄGE" för
          källorna bakom valet (RAC/MUI/Wes Bos/Chakra) och varför
          `visibility` (inte `opacity`/`display:none`) är rätt val här.

          `w-full` på båda: en grid-item stretchar normalt redan till
          cellens fulla bredd (`justify-items: normal` ≈ `stretch` för
          `width:auto`-boxar), men satt EXPLICIT i stället för att förlita
          sig på det implicita grid-defaultvärdet — enklare att läsa och
          garanterat samma resultat i varje motor.

          `aria-hidden` växlar SYNKRONT med `invisible`, ALDRIG fördröjt:
          det håller exakt samma timing som den gamla villkorade
          renderingen (ett lager går ur/in i a11y-trädet i samma ögonblick
          det slutar/börjar synas) — se docblockets RAC-varnings-stycke för
          varför just DEN timingen är vad som gör `visibility` säkert här. */}
      <span
        className={cn(
          'inline-flex w-full items-center justify-center [grid-area:1/1]',
          CONTENT_GAP[resolvedSize],
          isLoading && 'invisible',
        )}
        aria-hidden={isLoading || undefined}
      >
        {children}
      </span>
      <span
        className={cn(
          'inline-flex w-full items-center justify-center [grid-area:1/1]',
          CONTENT_GAP[resolvedSize],
          !isLoading && 'invisible',
        )}
        aria-hidden={!isLoading || undefined}
      >
        {/* `motion-safe:animate-spin` VILLKORAT på `isLoading` (TASK-361,
            upptäckt av denna PR:s EGEN `test:webblasarbeteende`-körning:
            `notisfamiljen-rorelsefri.test.ts` fällde tre helt orelaterade
            komponenter på `document.getAnimations().length` — en
            SIDO-BRED räkning, inte scopad till testets eget element).
            Rotorsaken: `visibility:hidden` (till skillnad från
            `display:none`) STOPPAR INTE en pågående CSS-animation — bara
            målningen. Ladd-laget är ALLTID monterat (stapel-tekniken), så
            en ovillkorad `animate-spin` hade snurrat Loader2-ikonen
            EVIGT i bakgrunden även när knappen aldrig laddar, en tyst
            CPU/batteri-läcka OCH exakt den globala animationsräkning
            rörelsefrihets-sviten vaktar. */}
        <Loader2
          aria-hidden="true"
          className={cn('size-4 shrink-0', isLoading && 'motion-safe:animate-spin')}
        />
        {/* `role="status"` + `aria-live="polite"` VÄXLAR MED `isLoading`
            (TASK-361, upptäckt av denna PR:s EGEN `test:a11y`-körning: en
            första version av fixen höll dessa attribut PERMANENT satta,
            vilket lämnade ett dolt men attribut-matchbart
            `[aria-live="polite"]`/`[role="status"]` kvar i DOM:en även i
            vila — `InstallPrompt.spec.ts`s egen `[aria-live="polite"]`-
            räknare fällde på exakt detta, eftersom CSS-attributselektorer
            inte respekterar `aria-hidden`/`visibility` som skärmläsare
            gör). Elementet (spannet, texten)
            är ALLTID monterat — det är stapel-teknikens hela poäng — men
            själva LIVE-REGION-KONTRAKTET existerar bara medan `isLoading`
            är sant, exakt som förlagans villkorade rendering: attribut OCH
            ancestor-synlighet flippar i SAMMA render, vilket är den mest
            tillförlitliga triggern för en AT-annonsering (se docblockets
            RAC-stycke). Bär knappens tillgängliga NAMN (när ingen
            `aria-label` är satt) och den oberoende
            live-region-annonseringen — se `ButtonProps`§isLoading. */}
        <span role={isLoading ? 'status' : undefined} aria-live={isLoading ? 'polite' : undefined}>
          {loadingText}
        </span>
      </span>
    </AriaButton>
  );
}
