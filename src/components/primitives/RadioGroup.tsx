import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';
import {
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps,
  type RadioProps as AriaRadioProps,
  FieldError,
  Label,
} from 'react-aria-components';
import { cn } from '@/lib/cn';

export interface RadioGroupProps extends Omit<AriaRadioGroupProps, 'className' | 'children'> {
  /** Gruppens etikett — obligatorisk för tillgänglighet (checklist §2). */
  label: string;
  /** Döljer den visuella etiketten; `label` blir då `aria-label`. */
  hideLabel?: boolean;
  /** Felmeddelande — visas och annonseras endast när `isInvalid` är satt. */
  errorMessage?: string;
  children: ReactNode;
  className?: string;
}

/**
 * RadioGroup-primitiv på react-aria-components RadioGroup/Radio: ömsesidigt
 * uteslutande val med full tangentbordsnavigation (piltangenter flyttar val,
 * Tab in/ut ur gruppen) och korrekt roll/`aria-labelledby` ur lådan. Tunn
 * wrapper + cva (jfr Select wrappar AriaSelect) — inga features utöver det
 * react-aria ger. Använd `<Radio>` för alternativen.
 *
 * @example
 * ```tsx
 * <RadioGroup label="Status" value={val} onChange={setVal} orientation="horizontal">
 *   <Radio value="med">Med</Radio>
 *   <Radio value="utan">Utan</Radio>
 * </RadioGroup>
 * ```
 */
export function RadioGroup({
  label,
  hideLabel,
  errorMessage,
  children,
  className,
  ...props
}: RadioGroupProps) {
  return (
    <AriaRadioGroup
      {...props}
      aria-label={hideLabel ? label : undefined}
      className={cn('flex flex-col gap-1.5 data-[orientation=horizontal]:gap-1', className)}
    >
      {!hideLabel && (
        <Label className="text-(color:--mm-input-label-text) text-small">{label}</Label>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 data-[orientation=vertical]:flex-col">
        {children}
      </div>
      <FieldError className="text-(color:--mm-input-error-text) text-caption">
        {errorMessage}
      </FieldError>
    </AriaRadioGroup>
  );
}

// Visuell radioknapp via React Arias data-attribut (data-selected/data-focus-
// visible/data-disabled) — inte :hover/:focus. Ingen hårdkodad färg: ring via
// --mm-input-border, vald markör via --mm-text, fokus via --mm-focus-ring.
const radioVariants = cva(
  'group flex cursor-pointer items-center gap-2 text-(color:--mm-text) text-body data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
);

/** Alternativ i RadioGroup — stylad react-aria Radio med token-baserad markör. */
export function Radio({
  children,
  className,
  ...props
}: Omit<AriaRadioProps, 'children' | 'className'> & { children: ReactNode; className?: string }) {
  return (
    <AriaRadio {...props} className={cn(radioVariants(), className)}>
      <span
        aria-hidden
        className="flex size-4 shrink-0 items-center justify-center rounded-full border border-(--mm-input-border) bg-(--mm-bg) transition-colors group-data-[selected]:border-(--mm-text) group-data-[focus-visible]:outline group-data-[focus-visible]:outline-(--mm-focus-ring) group-data-[focus-visible]:outline-2 group-data-[focus-visible]:outline-offset-2"
      >
        <span className="size-2 rounded-full bg-(--mm-text) opacity-0 transition-opacity group-data-[selected]:opacity-100" />
      </span>
      {children}
    </AriaRadio>
  );
}
