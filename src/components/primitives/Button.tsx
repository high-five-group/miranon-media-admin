import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type { Ref } from 'react';
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
  'inline-flex select-none items-center justify-center rounded font-sans transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[loading]:cursor-progress',
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
      size: {
        sm: 'min-h-8 gap-1.5 px-3 text-small',
        md: 'min-h-10 gap-2 px-4 text-body',
        lg: 'min-h-12 gap-2 px-5 text-lg',
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

export interface ButtonProps
  extends Omit<AriaButtonProps, 'className'>,
    VariantProps<typeof buttonVariants> {
  /** Extra klasser som merge:as in efter variant-klasserna (tailwind-merge). */
  className?: string;
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
      {isLoading ? (
        <>
          <Loader2 aria-hidden="true" className="size-4 shrink-0 motion-safe:animate-spin" />
          <span role="status" aria-live="polite">
            {loadingText}
          </span>
        </>
      ) : (
        children
      )}
    </AriaButton>
  );
}
