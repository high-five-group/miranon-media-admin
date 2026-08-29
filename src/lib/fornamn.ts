/**
 * Förnamnet ur ett fullt visningsnamn (`AuthUser.displayName`,
 * `AuthProvider.tsx`). Ursprungligen Hem-hälsningens visningslogik
 * (TASK-220); FLYTTAD hit ur `src/components/hem/hem-derivations.ts`
 * (TASK-309.38) eftersom dokumentgenereringens väntetext (`GenereringsVy.tsx`,
 * `DokumentYta.tsx`) annars hade behövt importera ur `hem/` — ett
 * feature→feature-beroende (`~/.claude/CLAUDE.md` § Instruktioner, "Bygg i
 * oberoende lager"). Ren strängfunktion utan koppling till någon av ytorna;
 * `Hem.tsx` importerar den nu härifrån i stället för via `hem-derivations`.
 */
export function fornamn(helaNamnet: string): string {
  return helaNamnet.trim().split(/\s+/)[0];
}
