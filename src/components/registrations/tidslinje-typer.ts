import type { ComponentType } from 'react';

/**
 * `Tidslinje`s typkontrakt utan JSX: ikon-kontraktet (strukturellt —
 * size/aria-hidden/className, inte låst till lucide-react; NavCardIcon-
 * disciplinen, återanvändbarhet 11) och underradens form.
 *
 * VARFÖR EN EGEN `.ts`-FIL, INTE `Tidslinje.tsx`: typerna konsumeras av rena
 * härledningar (`registrations/handelser.ts`, `betalningar/inbetalnings-
 * handelser.ts`) som i sin tur prövas av creds-fria api-pure-tester under
 * `tsconfig.tests.json` — ett projekt utan `jsx`. Ett `import type` från en
 * `.tsx`-fil fäller där med TS6142 ("'--jsx' is not set"), mätt i CI på
 * PR #2468 (TASK-438) trots grön lokal `tsc -b`. Kontraktet bor därför i en
 * fil som varje tsconfig kan läsa; `Tidslinje.tsx` återexporterar dem.
 * Samma fälla en andra gång i samma PR (granskarfyndets `TidslinjeUnderrad`
 * hamnade först i `.tsx`-filen) — därav filnamnet `-typer`, inte `-ikon`.
 */
export type TidslinjeIkon = ComponentType<{
  size?: number;
  'aria-hidden'?: boolean;
  className?: string;
}>;

/**
 * En underrad i en tidslinje-nod (TASK-438): `id` är radens SLAG ("kvitto",
 * "makulering", "notering") och unikt inom noden — list-nyckel, eftersom
 * texten kan vara Lottas fritext och ordagrant råka lyda som en annan rad
 * (granskarfynd PR #2468 r1); `text` är det som visas.
 */
export interface TidslinjeUnderrad {
  id: string;
  text: string;
}
