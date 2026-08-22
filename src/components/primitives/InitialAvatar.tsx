/**
 * Initialerna för avatar-cirkeln ("AA" ur "Anna Andersson") — max två,
 * versala. Privat, egen instans: en primitiv i biblioteks-hemvisten importerar
 * inte från en produktspecifik katalog (`hem/`) — lager-oberoendet
 * (`~/.claude/CLAUDE.md` § "Bygg i oberoende lager"). Samma korta, rena
 * funktion lever redan som avsiktlig per-fil-duplicering på flera ställen i
 * huset (`PersonsList.tsx`, `PersonMiniKort.tsx`, m.fl. —
 * `hem-derivations.ts` § `initialer` dokumenterar mönstret); de sex
 * kvarvarande inline-renderingarna av cirkeln migreras INTE av denna flytt
 * (PRD `TASK-299` § Implementationsbeslut punkt 7 — de sitter i
 * facit-stämplade filer och väntar på visuella vakter).
 */
function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * InitialAvatar — avatar-cirkeln (PersonsList.tsx k13-facit; TASK-243.1,
 * promoverad ur `dev/hem-prototyp/ui.tsx` InitialAvatar, ADR-102/103).
 *
 * REN FLYTT (TASK-299.1, ADR-124): ur `hem/InitialAvatar.tsx` till
 * biblioteks-hemvisten, samma klasser, noll visuell förändring — kodens
 * eget villkor var redan skrivet och uppfyllt (`PersonMiniKort.tsx` bär
 * *"promoveras till primitives/ vid andra konsumenten"*, och
 * `PersonsList.tsx` säger *"Personlistan ÄR den andra"*); lyftet var
 * uppskjutet enbart i väntan på Marcus-godkännande, som kom 2026-08-10
 * (sessionsdok S111 Del 2 § C punkt 4).
 *
 * Konsumeras i dag av Hems två "Nya anmälningar"-/"Förfallna
 * betalningar"-block (`NyaAnmalningar.tsx`, `ForfallnaBetalningar.tsx`) —
 * två faktiska konsumenter, ingen spekulativ abstraktion.
 *
 * Tillgänglighet (11): cirkeln är rent dekorativ (`aria-hidden`) — namnet
 * bärs av den omgivande radens egen text, aldrig av initialerna själva.
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
