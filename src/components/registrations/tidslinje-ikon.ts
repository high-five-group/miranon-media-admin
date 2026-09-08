import type { ComponentType } from 'react';

/**
 * Ikon-kontraktet för `Tidslinje` — strukturellt (size/aria-hidden/className),
 * inte låst till lucide-react (NavCardIcon-disciplinen; återanvändbarhet 11).
 *
 * VARFÖR EN EGEN `.ts`-FIL, INTE `Tidslinje.tsx`: typen konsumeras av rena
 * härledningar (`registrations/handelser.ts`, `betalningar/inbetalnings-
 * handelser.ts`) som i sin tur prövas av creds-fria api-pure-tester under
 * `tsconfig.tests.json` — ett projekt utan `jsx`. Ett `import type` från en
 * `.tsx`-fil fäller där med TS6142 ("'--jsx' is not set"), mätt i CI på
 * PR #2468 (TASK-438) trots grön lokal `tsc -b`. Kontraktet bor därför i en
 * fil som varje tsconfig kan läsa; `Tidslinje.tsx` återexporterar den.
 */
export type TidslinjeIkon = ComponentType<{
  size?: number;
  'aria-hidden'?: boolean;
  className?: string;
}>;
