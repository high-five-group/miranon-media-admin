import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/primitives';
import { cn } from '@/lib/cn';

/**
 * [PROTOTYPE — KONVERGENS, S109] Meddelanderutan i flödet, startad som EXAKT
 * kopia av `primitives/MessageBox.tsx` och itererad mot notis-facit
 * (`tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`).
 *
 * FRÅGAN: hur ska rutan i flödet (fel, varning, kvitto, info — inklusive
 * `SectionError`) se ut så att den talar SAMMA designspråk som den låsta
 * uppdateringsnotisen, utan att tappa sin roll som inline-meddelande?
 *
 * Varv 1 (skillnader mot skarpa, allt annat identiskt):
 * - Neutral ram + 4 px intent-kant till vänster (notis-facitets accentform)
 *   i stället för helfärgad intent-ram.
 * - Rubrik semibold i intent-färg (oförändrat), brödtext neutral (oförändrat).
 * - NY `actions`-slot: knappraden högerställd under texten, samma rad-form som
 *   notisen — i dag placerar varje konsument sin knapp själv.
 */
const variants = cva(
  'rounded border border-border border-l-4 px-4 py-3 text-(color:--mm-messagebox-body-text) text-body contrast-more:border-border-strong',
  {
    variants: {
      intent: {
        info: 'border-l-(--mm-messagebox-info-border) bg-(--mm-messagebox-info-bg)',
        success: 'border-l-(--mm-messagebox-success-border) bg-(--mm-messagebox-success-bg)',
        warning: 'border-l-(--mm-messagebox-warning-border) bg-(--mm-messagebox-warning-bg)',
        error: 'border-l-(--mm-messagebox-error-border) bg-(--mm-messagebox-error-bg)',
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

export interface MessageBoxPrototypProps extends VariantProps<typeof variants> {
  title?: string;
  children: ReactNode;
  /** Knappraden — högerställd under texten, som i notis-facit. */
  actions?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}

export function MessageBoxPrototyp({
  intent,
  title,
  children,
  actions,
  onDismiss,
  dismissLabel = 'Stäng meddelande',
  className,
}: MessageBoxPrototypProps) {
  const role = intent === 'error' || intent === 'warning' ? 'alert' : 'status';
  return (
    <div role={role} className={cn(variants({ intent }), className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title && (
            <strong className={cn('mb-1 block font-semibold', titleColor[intent ?? 'info'])}>
              {title}
            </strong>
          )}
          {children}
        </div>
        {onDismiss && (
          // Varv 2: knappen dras in (-mt/-mr) så krysset linjerar optiskt med
          // rubrikens linje och rutans högerkant i stället för med knappens
          // egen inre marginal. Familjeregel (varv 2, Marcus-fråga): fel och
          // varningar bär ALDRIG kryss — de försvinner när orsaken är borta;
          // kvitton och info får stängas.
          <Button
            intent="ghost"
            size="sm"
            aria-label={dismissLabel}
            onPress={onDismiss}
            className="-mt-1.5 -mr-2 shrink-0"
          >
            <X aria-hidden className="size-4" />
          </Button>
        )}
      </div>
      {actions && <div className="mt-3 flex justify-end gap-2">{actions}</div>}
    </div>
  );
}
