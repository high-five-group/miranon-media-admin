import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

const messageBoxVariants = cva(
  'rounded border px-4 py-3 text-(color:--mm-messagebox-body-text) text-body',
  {
    variants: {
      intent: {
        info: 'border-(--mm-messagebox-info-border) bg-(--mm-messagebox-info-bg)',
        success: 'border-(--mm-messagebox-success-border) bg-(--mm-messagebox-success-bg)',
        warning: 'border-(--mm-messagebox-warning-border) bg-(--mm-messagebox-warning-bg)',
        error: 'border-(--mm-messagebox-error-border) bg-(--mm-messagebox-error-bg)',
      },
    },
    defaultVariants: { intent: 'info' },
  },
);

const titleColor = {
  info: 'text-(color:--mm-messagebox-info-text)',
  success: 'text-(color:--mm-messagebox-success-text)',
  warning: 'text-(color:--mm-messagebox-warning-text)',
  error: 'text-(color:--mm-messagebox-error-text)',
} as const;

export interface MessageBoxProps extends VariantProps<typeof messageBoxVariants> {
  /** Rubrik i intent-färg; brödtext (children) är alltid neutral. */
  title?: string;
  children: ReactNode;
  /** Visar en stäng-knapp när satt. */
  onDismiss?: () => void;
  /** Tillgängligt namn på stäng-knappen (i18n-override). */
  dismissLabel?: string;
  className?: string;
}

/**
 * Inline-meddelande-primitiv (ej toast — toast är Fas 5-scope).
 *
 * Semantik per checklist §2 Statushantering: `error`/`warning` renderar
 * `role="alert"` (assertiv annonsering), `info`/`success` renderar
 * `role="status"` (artig). Färg är aldrig ensam informationsbärare —
 * rubrik/brödtext bär alltid innehållet (ARIA-UPGRADE §1 StatusBadge-princip).
 *
 * @example
 * ```tsx
 * <MessageBox intent="error" title="Kunde inte spara" onDismiss={clearError}>
 *   Försök igen, eller kontakta support om felet kvarstår.
 * </MessageBox>
 * ```
 */
export function MessageBox({
  intent,
  title,
  children,
  onDismiss,
  dismissLabel = 'Stäng meddelande',
  className,
}: MessageBoxProps) {
  const role = intent === 'error' || intent === 'warning' ? 'alert' : 'status';
  return (
    <div role={role} className={cn(messageBoxVariants({ intent }), className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {title && (
            <strong className={cn('mb-1 block', titleColor[intent ?? 'info'])}>{title}</strong>
          )}
          {children}
        </div>
        {onDismiss && (
          <Button intent="ghost" size="sm" aria-label={dismissLabel} onPress={onDismiss}>
            <X aria-hidden className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
