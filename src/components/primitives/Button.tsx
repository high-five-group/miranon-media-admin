import { cva, type VariantProps } from 'class-variance-authority';
import type { Ref } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { cn } from '@/lib/cn';

// State-styling sker uteslutande via React Arias data-attribut
// (data-hovered/data-pressed/data-disabled) — inte :hover/:active — så att
// pekar-, tangentbords- och touch-interaktion får identisk semantik.
// Fokusring kommer från den globala *:focus-visible-regeln i base.css
// (--mm-focus-ring, exklusiv färg per ACCESSIBILITY-CHECKLIST §2).
const buttonVariants = cva(
  'inline-flex select-none items-center justify-center rounded font-sans transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
  {
    variants: {
      intent: {
        primary:
          'bg-(--mm-btn-primary-bg) text-(color:--mm-btn-primary-text) data-[hovered]:bg-(--mm-btn-primary-hover) data-[pressed]:bg-(--mm-btn-primary-hover)',
        secondary:
          'border border-(--mm-btn-secondary-border) bg-(--mm-btn-secondary-bg) text-(color:--mm-btn-secondary-text) data-[hovered]:bg-bg-muted data-[pressed]:bg-bg-muted',
        danger: 'bg-error text-text-inverse data-[hovered]:opacity-90 data-[pressed]:opacity-90',
        ghost: 'bg-transparent text-text data-[hovered]:bg-bg-muted data-[pressed]:bg-bg-muted',
      },
      size: {
        sm: 'min-h-8 gap-1.5 px-3 text-small',
        md: 'min-h-10 gap-2 px-4 text-body',
        lg: 'min-h-12 gap-2 px-5 text-lg',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
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
}

/**
 * Knapp-primitiv på react-aria-components-bas (ADR-044) med CVA-varianter.
 *
 * Tillgänglighet: renderar ett riktigt `<button>`-element via React Aria —
 * Enter/Space, fokushantering och `aria-disabled`-semantik följer med utan
 * egen kod. Minsta träffyta ≥ 24×24 px (sm = 32 px hög); använd `md`/`lg`
 * (40/48 px) i primärflöden per ACCESSIBILITY-CHECKLIST §2 (44×44-rekommendation).
 *
 * @example
 * ```tsx
 * <Button intent="primary" size="md" onPress={() => save()}>
 *   Spara
 * </Button>
 * <Button intent="danger" size="sm" isDisabled>
 *   Ta bort
 * </Button>
 * ```
 */
export function Button({ intent, size, className, ref, ...props }: ButtonProps) {
  return (
    <AriaButton {...props} ref={ref} className={cn(buttonVariants({ intent, size }), className)} />
  );
}
