import { initialer } from './hem-derivations';

/**
 * Avatar-cirkeln (PersonsList.tsx k13-facit) — Morgonkollens listradernas
 * ankare (TASK-243.1, promoverad ur `dev/hem-prototyp/ui.tsx` InitialAvatar,
 * ADR-102/103). Delad mellan "Nya anmälningar"- och "Förfallna betalningar"-
 * blockens rader — två faktiska konsumenter, ingen spekulativ abstraktion.
 */
export function InitialAvatar({ namn }: { namn: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
    >
      {initialer(namn)}
    </span>
  );
}
