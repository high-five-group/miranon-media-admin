import { cva, type VariantProps } from 'class-variance-authority';
import {
  TextArea as AriaTextArea,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Label,
  Text,
  TextField,
} from 'react-aria-components';
import { cn } from '@/lib/cn';

// Fält-state via React Arias data-attribut (data-invalid/data-disabled) — inte
// :hover. Fokusring från base.css globala regel. Speglar Input men flerradigt:
// `resize-y` + min-höjd så långa mailtexter får plats utan att spränga layouten.
const textAreaVariants = cva(
  'w-full resize-y rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 py-2 font-sans text-(color:--mm-input-text) transition-colors placeholder:text-(color:--mm-input-text-placeholder) data-[disabled]:cursor-not-allowed data-[disabled]:bg-(--mm-input-bg-disabled) data-[invalid]:border-(--mm-input-border-invalid)',
  {
    variants: {
      size: {
        sm: 'min-h-16 text-small',
        md: 'min-h-28 text-body',
        lg: 'min-h-40 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface TextAreaProps
  extends Omit<AriaTextFieldProps, 'className'>,
    VariantProps<typeof textAreaVariants> {
  /** Fältets etikett — obligatorisk för tillgänglighet (checklist §2). */
  label: string;
  /** Döljer den visuella etiketten; `label` blir då `aria-label`. */
  hideLabel?: boolean;
  /** Hjälptext — kopplas via aria-describedby (läses alltid av skärmläsare). */
  description?: string;
  /** Felmeddelande — visas och annonseras endast när `isInvalid` är satt. */
  errorMessage?: string;
  placeholder?: string;
  /** Antal synliga rader (textarea rows-attribut). */
  rows?: number;
  className?: string;
}

/**
 * Flerradigt textfält-primitiv på react-aria-components TextField + TextArea
 * (ADR-044). Identisk a11y-kontrakt som `Input`: Label/description/fel id-wiras av
 * React Aria — felmeddelandet associeras via FieldError/`aria-describedby` och
 * `aria-invalid` sätts automatiskt vid `isInvalid` (ADR-046). Skiljer sig från
 * `Input` enbart i att inmatningen är flerradig (t.ex. mailtext, anteckningar).
 *
 * @example
 * ```tsx
 * <TextArea
 *   label="Mailtext"
 *   description="Texten som skickas till mottagarna"
 *   errorMessage="Mailtext får inte vara tom"
 *   isInvalid={!!error}
 *   isRequired
 *   rows={8}
 * />
 * ```
 */
export function TextArea({
  label,
  hideLabel,
  description,
  errorMessage,
  placeholder,
  rows,
  size,
  className,
  ...props
}: TextAreaProps) {
  return (
    <TextField
      {...props}
      aria-label={hideLabel ? label : undefined}
      className={cn('flex w-full flex-col gap-1', className)}
    >
      {!hideLabel && (
        <Label className="text-(color:--mm-input-label-text) text-small">{label}</Label>
      )}
      <AriaTextArea placeholder={placeholder} rows={rows} className={textAreaVariants({ size })} />
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
