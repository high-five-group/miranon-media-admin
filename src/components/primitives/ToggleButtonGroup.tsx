import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode, Ref } from 'react';
import {
  ToggleButton as AriaToggleButton,
  ToggleButtonGroup as AriaToggleButtonGroup,
  type ToggleButtonGroupProps as AriaToggleButtonGroupProps,
  type ToggleButtonProps as AriaToggleButtonProps,
} from 'react-aria-components';
import { cn } from '@/lib/cn';

// Tracket (kapselytan) — S72-facitets grammatik: rounded-full bg-muted med
// 4 px inre luft. Färger uteslutande via semantiska tokens genom Tailwind-
// mappningen (bg-bg-muted → --mm-bg-muted; RadioGroup-precedentens
// token-konsumtion — inga nya komponent-tokens krävs för formen).
const groupVariants = cva('rounded-full bg-bg-muted p-1', {
  variants: {
    // Layout-formen har två belagda konsumenter (S72-facitet):
    // inline = kompakt kapsel (vy-ikon-toggeln, flik-kapslarna),
    // spread = likbreda segment som fyller bredden (period-toggeln).
    spread: {
      true: 'grid w-full auto-cols-fr grid-flow-col',
      false: 'inline-flex',
    },
  },
  defaultVariants: { spread: false },
});

// Pillens TILLSTÅND uttrycks via React Arias data-attribut
// (data-selected/data-disabled): vald pill lyfter i bg-token + semibold +
// skugga (facitets vita pill), ovald är tyst i sekundärfärgen.
//
// Hover är däremot inte ett tillstånd utan ÅTERKOPPLING på att ytan går att
// klicka — den hör hemma här (Marcus design-review 2026-07-26, S91: flikarna
// saknade den affordansen). Pekaren får plattan, tangentbordet får sin
// motsvarighet ur den globala :focus-visible-regeln (base.css) och touch ska
// inte ha någon alls. Den tredelningen är själva poängen: kanalerna får
// LIKVÄRDIG återkoppling, inte identisk.
//
// Bäraren är `data-[hovered]` (Button/Input-primitivernas precedent), inte
// Tailwinds `hover:`. React Arias useHover sätter attributet endast för
// mus/penna — `pointerType === 'touch'` returnerar tidigt — och kopplas bort
// när knappen är disabled (useHover({ isDisabled }) i RAC:s ToggleButton).
// Touch- och disabled-golvet blir därmed strukturellt, inte en override som
// kan glida. Det är strikt starkare än `@media (hover:hover)`, som är
// enhets-förmåga och ger klibbig hover på hybrid-enheter (touch + mus).
//
// `not-data-[selected]` håller vald pill ORÖRD: den är redan upplyft mot
// tracket, och en hover-platta ovanpå skulle sudda gränsen mellan "vald" och
// "muspekaren är här". Ovald hover går i stället ANDRA vägen (mörkare än
// tracket) medan vald går ljusare — riktningarna kan aldrig förväxlas.
//
// Plattan är ett GENOMSKINLIGT skrim (--mm-state-hover), inte en opak ton.
// Skälet är uppmätt, inte estetiskt: tracket ägs av KONSUMENTEN via
// groupVariants-className, och Betalningar sätter `bg-bg-emphasized` på sitt
// track. En opak bg-emphasized-platta gav där ΔE00 0,00 — hovern försvann
// helt på den ytan. Skrimmet mörknar i stället vilken bakgrund som helst med
// ett konstant steg: ΔE00 2,77 mot bg-muted · 2,60 mot Betalningars
// bg-emphasized · 2,63 mot vit, mot komponentens egen vald/ovald-skillnad på
// ΔE00 2,30. Etiketten håller ≥6,0:1 på samtliga (AA). Under
// prefers-contrast: more dubblas steget via --mm-state-hover-contrast
// (ΔE00 ≈5,4; etikett ≥5,4:1). Branschmönstret är Material 3:s state layers
// och Radix alpha-skalor — samma skäl: återkoppling på okänd bakgrund.
//
// Övergången följer motion-safe-idiomet (EventValjare/TabBar-precedenten) men
// med SMALARE egenskapslista än precedentens `transition-colors`: den listan
// omfattar i Tailwind v4 även `outline-color`, och den globala
// :focus-visible-ringen (base.css) hade då tonat in över 150 ms i stället för
// att stå direkt. Fokusindikatorn ska vara omedelbar — och primitivens
// computed-låsta fokus-test mäter ringens färg i fokusögonblicket. Därför
// `transition-[background-color]`: exakt det hovern faktiskt ändrar.
// prefers-reduced-motion nollas dessutom globalt i base.css.
const itemVariants = cva(
  'select-none rounded-full text-center font-medium text-text-secondary not-data-[selected]:data-[hovered]:bg-(--mm-state-hover) contrast-more:not-data-[selected]:data-[hovered]:bg-(--mm-state-hover-contrast) data-[selected]:bg-bg data-[selected]:font-semibold data-[selected]:text-text data-[selected]:shadow-sm data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 motion-safe:transition-[background-color]',
  {
    variants: {
      size: {
        // sm = flik-kapslarnas form (eventsidans betalningsflikar/filter);
        // md = period-toggelns form. Ikon-konsumenten justerar px via
        // className (px-3.5, vy-toggelns kompakta kapsel).
        sm: 'px-2.5 py-2 text-small',
        md: 'px-5 py-2 text-body',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface ToggleButtonGroupProps<K extends string = string>
  extends Omit<
      AriaToggleButtonGroupProps,
      | 'className'
      | 'children'
      | 'selectionMode'
      | 'disallowEmptySelection'
      | 'orientation'
      | 'selectedKeys'
      | 'defaultSelectedKeys'
      | 'onSelectionChange'
      | 'aria-label'
    >,
    VariantProps<typeof groupVariants> {
  /** Gruppens tillgängliga namn (radiogroup-namnet) — visas aldrig visuellt. */
  label: string;
  /** Vald pill (controlled). */
  selectedKey?: K;
  /** Först vald pill (uncontrolled). */
  defaultSelectedKey?: K;
  /** Anropas med den nya pillens nyckel — aldrig med "inget val" (alltid-ett-val). */
  onSelectionChange?: (key: K) => void;
  children: ReactNode;
  /** Extra klasser som merge:as in efter variant-klasserna (tailwind-merge). */
  className?: string;
  /** Ref till gruppens <div role="radiogroup"> (React 19-stil). */
  ref?: Ref<HTMLDivElement>;
}

/**
 * ToggleButtonGroup — pill-toggel-primitiv på react-aria-components
 * ToggleButtonGroup (ADR-044): kapselformad växlare där exakt ETT alternativ
 * alltid är valt (S72-facitets pill-form; DESIGN-SYSTEM-SPEC §16).
 *
 * Singel-val + alltid-ett-val är förseglade beslut, inte utelämnanden:
 * React Aria ger då radiogroup/radio-semantik (`role="radiogroup"`,
 * `role="radio"` + `aria-checked`) och pill-toggelns kontrakt är att en
 * tidshorisont/vy alltid är aktiv. Multi-val och tömbart val är en annan
 * mönsterklass. Orientering är horisontell (ingen vertikal konsument —
 * över-engineering-vakten; växer additivt vid verkligt behov).
 *
 * Tillgänglighet: `label` bär gruppnamnet (aria-label), pilnavigering
 * Vänster/Höger flyttar fokus inom gruppen, Enter/Space väljer, Tab lämnar
 * gruppen (toolbar-mönstrets enkla tabbstopp). Fokusring via den globala
 * `:focus-visible`-regeln. Ikon-piller bär namn via `aria-label` på
 * `ToggleButton` med `aria-hidden`-ikon som innehåll. Ovald pill får
 * hover-återkoppling för mus/penna (`data-hovered`) — aldrig för touch och
 * aldrig när pillen är disabled; vald pill står orörd.
 *
 * @example
 * ```tsx
 * <ToggleButtonGroup
 *   label="Period"
 *   spread
 *   defaultSelectedKey="upcoming"
 *   onSelectionChange={(key) => setPeriod(key)}
 * >
 *   <ToggleButton id="upcoming">Kommande</ToggleButton>
 *   <ToggleButton id="past">Tidigare</ToggleButton>
 * </ToggleButtonGroup>
 * ```
 */
export function ToggleButtonGroup<K extends string = string>({
  label,
  spread,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  className,
  ...props
}: ToggleButtonGroupProps<K>) {
  return (
    <AriaToggleButtonGroup
      {...props}
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={selectedKey !== undefined ? [selectedKey] : undefined}
      defaultSelectedKeys={defaultSelectedKey !== undefined ? [defaultSelectedKey] : undefined}
      onSelectionChange={(keys) => {
        // Singel-nyckel-API:t (Select-precedenten): setet bär exakt en
        // nyckel vid varje ändring (disallowEmptySelection) — konsumenten
        // slipper Set-mekaniken. Guard för robusthet, inte för ett känt fall.
        const [key] = keys;
        if (key !== undefined) {
          onSelectionChange?.(key as K);
        }
      }}
      className={cn(groupVariants({ spread }), className)}
    />
  );
}

export interface ToggleButtonProps
  extends Omit<AriaToggleButtonProps, 'className' | 'children'>,
    VariantProps<typeof itemVariants> {
  children: ReactNode;
  /** Extra klasser som merge:as in efter variant-klasserna (tailwind-merge). */
  className?: string;
  /** Ref till det underliggande <button>-elementet (React 19-stil). */
  ref?: Ref<HTMLButtonElement>;
}

/** Pill i ToggleButtonGroup — `id` blir nyckeln i `onSelectionChange`. */
export function ToggleButton({ size, className, ...props }: ToggleButtonProps) {
  return <AriaToggleButton {...props} className={cn(itemVariants({ size }), className)} />;
}
