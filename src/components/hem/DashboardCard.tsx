import type { ReactNode } from 'react';
import { useId } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';

/**
 * Gemensamt card-skal för Hem-aggregeringens översikts-kort (Fas 6d L1).
 *
 * Varje card är en egen `<section>` med en `<h2>`-rubrik kopplad via
 * `aria-labelledby` (h1 = "Hem" bärs av Hem-containern → ren rubrik-hierarki).
 * Skalet äger card-chrome + de tre data-tillstånds-ytorna så cards-innehållet
 * bara behöver beskriva den laddade vyn:
 * - `isPending` → `role=status` + `aria-busy` (tillgängligt laddningsbesked).
 * - `isError`   → `role=alert` via MessageBox (samma fel-mönster som 6c-vyerna).
 * - laddat      → `children`.
 *
 * Inga hårdkodade färger — chrome via semantiska Tailwind-tokens (DESIGN-SYSTEM
 * §1); `break-inside-avoid` håller cardet samlat vid utskrift (§4 print-golv).
 */
export function DashboardCard({
  title,
  isPending,
  isError,
  error,
  loadingLabel,
  errorTitle,
  children,
}: {
  title: string;
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
      className="flex break-inside-avoid flex-col gap-3 rounded-lg border border-text-muted/20 p-4"
    >
      <h2 id={headingId} className="font-semibold text-lg">
        {title}
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
