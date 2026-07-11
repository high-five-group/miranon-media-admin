import type { ReactNode } from 'react';
import { useId } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';

/**
 * Gemensamt card-skal för Hem-översiktens kort — A-skelettets tonala form
 * (task-1.3): tonal yta utan kantlinje, generös hörnradie, `<h2>` som liten
 * etikett ÖVER värdet (FK:s etikett-över-värde-mönster). `tone="primary"`
 * ger primär-tinten (Nästa event, variant C-mixen; TASK-1 beslut 3).
 *
 * Varje card är en egen `<section>` med `<h2>`-rubrik kopplad via
 * `aria-labelledby` (h1 = hälsningen bärs av Greeting → ren rubrik-hierarki).
 * Skalet äger card-chrome + de tre data-tillstånds-ytorna så cards-innehållet
 * bara behöver beskriva den laddade vyn:
 * - `isPending` → `role=status` + `aria-busy` (tillgängligt laddningsbesked).
 * - `isError`   → `role=alert` via MessageBox (samma fel-mönster som 6c-vyerna).
 * - laddat      → `children`.
 *
 * `relative` är bärytan för helkorts-länkar (stretched link `after:inset-0`,
 * NastaEventCard AC #2). Kantlinje-lösa ytor får synlig gräns under
 * `prefers-contrast: more` + utskrift via border-transparent-mönstret
 * (layoutstabilt — samma bredd i alla lägen); accent-tonen bär sin
 * koppar-kontur ALLTID (mörk koppar mot ljus yta är redan en synlig gräns,
 * ≥3:1 — contrast-more-override skulle bara sudda särskiljningen) och faller
 * till border-strong vid utskrift (svartvitt-golvet). Inga hårdkodade
 * färger — chrome via semantiska Tailwind-tokens (DESIGN-SYSTEM §1);
 * `break-inside-avoid` håller cardet samlat vid utskrift (§4 print-golv).
 */

/** Tonala ytan + konturen per ton (K10-facit; accent = task-4.4-kortet). */
const TONE_KLASS = {
  neutral: 'border-transparent bg-bg-muted contrast-more:border-border-strong',
  primary: 'border-transparent bg-primary-tint contrast-more:border-border-strong',
  accent: 'border-accent bg-bg-muted',
} as const;

export function DashboardCard({
  title,
  titleIcon,
  tone = 'neutral',
  isPending,
  isError,
  error,
  loadingLabel,
  errorTitle,
  children,
}: {
  title: string;
  /** Dekor-ikon VID rubriken (K10-facit: koppar-CircleAlert) — anroparen
      sätter `aria-hidden` (texten bär informationen). */
  titleIcon?: ReactNode;
  /** Kortets tonala yta: neutral (bg-muted), primär-tint (Nästa event)
      eller accent (koppar-kontur — Nya anmälningar att hantera). */
  tone?: 'neutral' | 'primary' | 'accent';
  isPending: boolean;
  isError: boolean;
  error: unknown;
  loadingLabel: string;
  errorTitle: string;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={`relative flex min-w-0 break-inside-avoid flex-col gap-2 rounded-2xl border p-4 print:border-border-strong ${TONE_KLASS[tone]}`}
    >
      {/* Kortrubriken per K10-facit (task-4.3): INNE i kortet, text-xl
          semibold, sentence case. Medvetet UTAN färg-utility: facit-färgen ÄR
          @layer-basregelns mörka default (--mm-text, renderat #242424) —
          task-4.1-flytten gjorde utilities vinnande, men här vill vi basen.
          min-w-0 (sektionen) + break-words (rubrik-spannet): långa enskilda
          ord ("anmälningsavgifter") får inte spränga grid-spåret på smal
          skärm — WCAG 1.4.10-reflow (ingen h-scroll, shell DoD 9) är golv;
          ordet radbryts inom kortet i stället. Flex-formen bär titleIcon
          (task-4.4); utan ikon är den layoutneutral. */}
      <h2 id={headingId} className="flex items-center gap-2 font-semibold text-xl">
        {titleIcon}
        <span className="min-w-0 break-words">{title}</span>
      </h2>

      {isPending ? (
        <p role="status" aria-live="polite" aria-busy="true" className="text-small text-text-muted">
          {loadingLabel}
        </p>
      ) : isError ? (
        <MessageBox intent="error" title={errorTitle}>
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      ) : (
        children
      )}
    </section>
  );
}
