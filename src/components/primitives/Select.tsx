import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  SelectValue,
} from 'react-aria-components';
import { cn } from '@/lib/cn';

// Trigger delar fält-utseende med Input (--mm-input-*); list-states via
// React Arias data-attribut (data-focused/data-selected) — inte :hover.
const triggerVariants = cva(
  'flex w-full items-center justify-between gap-2 rounded border border-(--mm-input-border) bg-(--mm-input-bg) font-sans text-(color:--mm-input-text) transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:bg-(--mm-input-bg-disabled) data-[invalid]:border-(--mm-input-border-invalid)',
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

export interface SelectProps<T extends object>
  extends Omit<AriaSelectProps<T>, 'className' | 'children'>,
    VariantProps<typeof triggerVariants> {
  /** Fältets etikett — obligatorisk för tillgänglighet (checklist §2). */
  label: string;
  /** Döljer den visuella etiketten; `label` blir då `aria-label`. */
  hideLabel?: boolean;
  /** Felmeddelande — visas och annonseras endast när `isInvalid` är satt. */
  errorMessage?: string;
  items?: Iterable<T>;
  children: ReactNode | ((item: T) => ReactNode);
  className?: string;
}

/**
 * Select-primitiv på react-aria-components Select (ADR-044): trigger-knapp +
 * Popover/ListBox med full tangentbordsnavigation (piltangenter, type-ahead,
 * Escape). Felmeddelandet associeras via FieldError/`aria-describedby` på
 * triggern (ADR-046; explicit aria-errormessage-wiring riven — attributet
 * droppades av trigger-kontexten och nådde aldrig DOM). Använd
 * `<SelectItem>` för alternativen.
 *
 * @example
 * ```tsx
 * <Select label="Status" placeholder="Välj status" onSelectionChange={setStatus}>
 *   <SelectItem id="anmald">Anmäld</SelectItem>
 *   <SelectItem id="betald">Betald</SelectItem>
 * </Select>
 * ```
 */
export function Select<T extends object>({
  label,
  hideLabel,
  errorMessage,
  items,
  children,
  size,
  className,
  ...props
}: SelectProps<T>) {
  return (
    <AriaSelect
      {...props}
      aria-label={hideLabel ? label : undefined}
      className={cn('flex w-full flex-col gap-1', className)}
    >
      {!hideLabel && (
        <Label className="text-(color:--mm-input-label-text) text-small">{label}</Label>
      )}
      <AriaButton className={triggerVariants({ size })}>
        <SelectValue className="data-[placeholder]:text-(color:--mm-input-text-placeholder) truncate" />
        <ChevronDown aria-hidden className="size-4 shrink-0" />
      </AriaButton>
      <FieldError className="text-(color:--mm-input-error-text) text-caption">
        {errorMessage}
      </FieldError>
      <Popover className="min-w-(--trigger-width) rounded border border-(--mm-select-popover-border) bg-(--mm-select-popover-bg) p-1 shadow-lg">
        <ListBox items={items} className="max-h-60 overflow-auto outline-none">
          {children}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

/** Alternativ i Select — stylad ListBoxItem med fokus-/vald-state via tokens. */
export function SelectItem(props: ListBoxItemProps) {
  return (
    <ListBoxItem
      {...props}
      className={cn(
        'text-(color:--mm-select-item-text) flex cursor-default items-center gap-2 rounded px-3 py-2 text-body outline-none data-[focused]:bg-(--mm-select-item-bg-focused) data-[selected]:bg-(--mm-select-item-bg-selected) data-[disabled]:opacity-50',
        typeof props.className === 'string' ? props.className : undefined,
      )}
    />
  );
}
