import { cva, type VariantProps } from 'class-variance-authority';
import type { Ref } from 'react';
import {
  Input as AriaInput,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Label,
  Text,
  TextField,
} from 'react-aria-components';
import { cn } from '@/lib/cn';

// Fält-state via React Arias data-attribut (data-invalid/data-disabled/
// data-hovered) — inte :hover. Fokusring från base.css globala regel,
// PLUS `mm-fokusring-vid-fokus` (TASK-134, 2026-08-04): textfält ska visa
// ring vid VARJE fokus oavsett modalitet (musklick inkluderat) — samma
// spec-heuristik och designsystem-precedent (govuk-frontend/USWDS/Carbon)
// som base.css:s klass-kommentar citerar. Se
// docs/research/focus-ring-auth-musklick-2026-08-03.md.
const inputVariants = cva(
  'w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) font-sans text-(color:--mm-input-text) transition-colors placeholder:text-(color:--mm-input-text-placeholder) mm-fokusring-vid-fokus data-[disabled]:cursor-not-allowed data-[disabled]:bg-(--mm-input-bg-disabled) data-[invalid]:border-(--mm-input-border-invalid)',
  {
    variants: {
      size: {
        sm: 'min-h-8 px-2.5 text-small',
        md: 'min-h-10 px-3 text-body',
        lg: 'min-h-12 px-4 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface InputProps
  extends Omit<AriaTextFieldProps, 'className'>,
    VariantProps<typeof inputVariants> {
  /** Fältets etikett — obligatorisk för tillgänglighet (checklist §2). */
  label: string;
  /** Döljer den visuella etiketten; `label` blir då `aria-label`. */
  hideLabel?: boolean;
  /** Hjälptext — kopplas via aria-describedby (läses alltid av skärmläsare). */
  description?: string;
  /** Felmeddelande — visas och annonseras endast när `isInvalid` är satt. */
  errorMessage?: string;
  placeholder?: string;
  className?: string;
  /**
   * Ref till det underliggande `<input>`-elementet (React 19-stil, som
   * `TextArea`/`Button`). Tillagd S103 (T97-bygg-spåret): `TextArea`s eget
   * docblock hävdade "identisk a11y-kontrakt som `Input`" men bara `TextArea`
   * bar ref-stödet fokus-retur-mönster (t.ex. `PersonNoteEditor`) kräver — ett
   * gap mellan syskon-primitiverna, inte en ny funktion. Rent additivt: ingen
   * befintlig `<Input>`-callsite skickar `ref` idag.
   */
  ref?: Ref<HTMLInputElement>;
}

/**
 * Textfält-primitiv på react-aria-components TextField (ADR-044).
 *
 * Tillgänglighet: Label/description/fel id-wiras av React Aria —
 * felmeddelandet associeras via FieldError/`aria-describedby` och
 * `aria-invalid` sätts automatiskt vid `isInvalid` (ADR-046; explicit
 * aria-errormessage-wiring riven efter DOM-forensik + skärmläsarpass).
 * Använd `lg` (48 px) för sökfält/primärflöden per ARIA-UPGRADE §2.5.8.
 * Fokusring visas vid VARJE fokus (mus, tangentbord, programmatiskt) —
 * WCAG 2.4.7-golvet gäller bara tangentbord, men textfält är webbläsarnas
 * egen spec-heuristik för mus-fokusring också (TASK-134; se base.css
 * `.mm-fokusring-vid-fokus`).
 * MÄRKNING (K84, ACCESSIBILITY-CHECKLIST § Formulär): `isRequired` bär
 * required-status programmatiskt — skriv INTE "(obligatorisk)" i `label`
 * som norm. Visuell märkning sätts på formulärets UNDANTAG: är minoriteten
 * frivillig märks de "(valfritt)", krävs allt märks ingenting.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Namn"
 *   description="Ange personens fullständiga namn"
 *   errorMessage="Namn får inte vara tomt"
 *   isInvalid={!!errors.name}
 *   isRequired
 * />
 * ```
 */
export function Input({
  label,
  hideLabel,
  description,
  errorMessage,
  placeholder,
  size,
  className,
  ref,
  ...props
}: InputProps) {
  return (
    <TextField
      {...props}
      aria-label={hideLabel ? label : undefined}
      className={cn('flex w-full flex-col gap-1', className)}
    >
      {!hideLabel && (
        <Label className="text-(color:--mm-input-label-text) text-small">{label}</Label>
      )}
      <AriaInput ref={ref} placeholder={placeholder} className={inputVariants({ size })} />
      {description && (
        <Text slot="description" className="text-(color:--mm-input-description-text) text-caption">
          {description}
        </Text>
      )}
      <FieldError className="text-(color:--mm-input-error-text) text-caption">
        {errorMessage}
      </FieldError>
    </TextField>
  );
}
