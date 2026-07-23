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
// :hover. Fokusring från base.css globala regel. Speglar Input men flerradigt.
// `resize`/`rounded` bor i `autoGrow`-varianten (aldrig i basen) så exakt EN
// resize-utility och EN radie appliceras per läge — annars avgörs vinnaren av
// CSS-källordning, inte klass-ordning (Tailwind-konflikt-fällan).
const textAreaVariants = cva(
  'w-full border border-(--mm-input-border) bg-(--mm-input-bg) px-3 py-2 font-sans text-(color:--mm-input-text) transition-colors placeholder:text-(color:--mm-input-text-placeholder) data-[disabled]:cursor-not-allowed data-[disabled]:bg-(--mm-input-bg-disabled) data-[invalid]:border-(--mm-input-border-invalid)',
  {
    variants: {
      size: {
        sm: 'min-h-16 text-small',
        md: 'min-h-28 text-body',
        lg: 'min-h-40 text-lg',
      },
      // autoGrow = composer-formen (Linear/Notion/Slack/Jira-branschklassen): rutan
      // VÄXER med innehållet via `field-sizing-content` upp till ett tak (16rem) med
      // intern rull därefter, resize-handtaget utgår, och radien lyfts till kort-radien
      // (rounded-xl) så composern sitter som antecknings-korten. Webbläsare UTAN
      // `field-sizing` (Firefox/äldre Safari) faller till fast `rows`-höjd — funktionellt
      // (min-höjden ur `size` bär reserven). Default = false: oförändrad `resize-y rounded`.
      autoGrow: {
        true: 'field-sizing-content max-h-64 resize-none rounded-xl',
        false: 'resize-y rounded',
      },
    },
    defaultVariants: { size: 'md', autoGrow: false },
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
  /**
   * Composer-form: rutan växer med innehållet (`field-sizing-content`) upp till ett
   * tak (16rem) med intern rull därefter, resize-handtaget utgår och radien lyfts till
   * kort-radien. Webbläsare utan `field-sizing` faller till fast `rows`-höjd (sätt
   * `rows` för reserven). Default `false` = oförändrad `resize-y`-form.
   */
  autoGrow?: boolean;
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
  autoGrow,
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
      <AriaTextArea
        placeholder={placeholder}
        rows={rows}
        className={textAreaVariants({ size, autoGrow })}
      />
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
