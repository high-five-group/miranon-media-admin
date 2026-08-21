import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

// ═══ PROMOVERAD FORM (ADR-103 B2 steg 1, S109-facit) ═══
//
// Formen är LÅST: tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/
// facit.json § yta "meddelanderutan" (varv 4, "godkand": null ännu —
// väntar på TASK-285.10/HITL). Denna primitiv promoveras strukturellt HIT
// (ADR-103 B2 steg 1: villkoret flippas så variant-formen blir den
// ovillkorliga), men steg 2–4 (Marcus-granskning, godkännande, rivning av
// prototyp/flagga) väntar fortfarande — `MessageBoxPrototyp.tsx` och
// `/dev/notis-prototyp` RIVS INTE av denna skiva.
//
// INGEN KONTUR (varv 3:s tonala kontur FÖRKASTADES av Marcus varv 4): en
// 4 px vänsterkant i intent-färgen + tonad bakgrund bär formen i vila.
// `contrast-more:border` tänder en kontur i FULL intent-färg — 11-golvet
// (CLAUDE.md § Design-system) är inte förhandlingsbart, kanten får aldrig
// försvinna för den som behöver den.
const messageBoxVariants = cva(
  'rounded border-l-4 px-4 py-3 text-(color:--mm-messagebox-body-text) text-body contrast-more:border',
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

export type MessageBoxIntent = keyof typeof titleColor;

interface MessageBoxBasProps {
  /** Rubrik i intent-färg, font-semibold; brödtext (children) är alltid neutral. */
  title?: string;
  children: ReactNode;
  /**
   * Knapprad, högerställd under texten (`mt-3 flex justify-end gap-2`,
   * S109-facit). Konsumenter placerar ALDRIG en egen knapp bredvid/under
   * `MessageBox` — `SectionError` konsumerar denna slot i stället för sin
   * tidigare egenplacerade "Försök igen"-knapp.
   */
  actions?: ReactNode;
  /** Tillgängligt namn på stäng-knappen (i18n-override). */
  dismissLabel?: string;
  className?: string;
}

/**
 * KRYSS-REGELN (S109-facit, familjeregel): `error`/`warning` bär ALDRIG en
 * stäng-knapp — de försvinner när ORSAKEN är borta (ny lyckad åtgärd,
 * refetch), aldrig genom ett manuellt klick. `info`/`success` FÅR stängas.
 *
 * Enforcement i TVÅ lager, ingen som ensam räcker:
 * 1. TYPEN (denna diskriminerade union): `onDismiss` på `error`/`warning`
 *    typar till `never` — ett bokstavligt `intent="error"`/`"warning"` med
 *    `onDismiss` stoppas redan av `npm run typecheck`.
 * 2. RENDER-KROPPEN (nedan): `kanAvvisas` kontrollerar `intent` oavsett vad
 *    typen sa — en obetypad/`as any`-konsument som ändå skickar `onDismiss`
 *    för `error`/`warning` får ALDRIG krysset synligt, och i DEV kastar
 *    komponenten ett tydligt fel i stället för att tyst rendera fel form.
 */
export type MessageBoxProps<I extends MessageBoxIntent = MessageBoxIntent> = MessageBoxBasProps &
  (I extends 'error' | 'warning'
    ? { intent: I; onDismiss?: never }
    : { intent?: I; onDismiss?: () => void });

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
 * <MessageBox intent="error" title="Kunde inte spara" actions={<Button ...>Försök igen</Button>}>
 *   Kontrollera att du är uppkopplad och prova igen.
 * </MessageBox>
 * <MessageBox intent="success" title="Skickat" onDismiss={clear}>
 *   Bekräftelsen har skickats.
 * </MessageBox>
 * ```
 */
export function MessageBox<I extends MessageBoxIntent = 'info'>({
  intent,
  title,
  children,
  actions,
  onDismiss,
  dismissLabel = 'Stäng meddelande',
  className,
}: MessageBoxProps<I>) {
  const role = intent === 'error' || intent === 'warning' ? 'alert' : 'status';
  const kanAvvisas = intent !== 'error' && intent !== 'warning';

  if (import.meta.env.DEV && !kanAvvisas && onDismiss) {
    throw new Error(
      `MessageBox: onDismiss är inte tillåtet för intent="${intent}". Fel och varningar kan ` +
        'inte stängas manuellt — de försvinner när orsaken är borta (S109-facit, ' +
        'familjeregeln). Ta bort onDismiss eller byt intent.',
    );
  }

  const visaKryss = kanAvvisas && Boolean(onDismiss);

  return (
    <div role={role} className={cn(messageBoxVariants({ intent }), className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title && (
            <strong className={cn('mb-1 block font-semibold', titleColor[intent ?? 'info'])}>
              {title}
            </strong>
          )}
          {children}
        </div>
        {visaKryss && (
          // Indraget (-mt/-mr) så krysset linjerar optiskt med rubrikens
          // linje och rutans högerkant i stället för knappens egen
          // inre marginal (S109-facit varv 2).
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
