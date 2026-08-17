// Kursnamnsmappningen — kursfamilj + kursnivå per Event (source)-kursnamn
// (TASK-249.4, ADR-115, data-model.md § "Staging- och prodbasens additiva
// tillskott 2026-08-17"). EXAKT samma mappning som prototypens KURS_KARTA
// (src/components/segment/prototyp/VariantD.tsx) — den mappning
// backfillens källa redan speglade (data-model.md, samma sektion): "mappningen
// = prototypens KURS_KARTA". EN mapping, EN sanningskälla, delad mellan den
// redan körda backfillen och denna framåtriktade skrivväg (create-event).
//
// Live-verifierat mot staging (apphjj8Q7lkXCMsL4, Eventplanering,
// mcp__airtable__list_records 2026-08-17) INNAN denna modul skrevs:
//   "Resor i medvetandet 1" → Kursfamilj RIM, Kursnivå "Nivå 1"
//   "Resor i medvetandet 2" → Kursfamilj RIM, Kursnivå "Nivå 2"
//   "Resor i medvetandet 3" → Kursfamilj RIM, Kursnivå "Nivå 3"
//   "Fjärrskådning"         → Kursfamilj Fjärrskådning, Kursnivå TOM
// — matchar exakt VariantD.tsx:s KURS_KARTA och nedanstående tabell.
//
// KURSNAMN UTANFÖR MAPPNINGEN (okänt kursnamn): `lookupCourseDimensions`
// returnerar `null` explicit — INGEN gissning, INGEN fallback-familj.
// Anroparen (create-event) UTELÄMNAR då fälten ur write-shapen och loggar
// öppet (console.warn) — samma "hanteras öppet, försvinner aldrig tyst"-krav
// som OkandaKurser-mönstret i prototypen uttrycker för samma lucka
// (VariantD.tsx docblock ovan KURS_KARTA). Att SKRIVA `null`/en gissad familj
// på en NY rad vore fel: utelämnande är den korrekta formen för "ingen känd
// familj", exakt som `publicera`-flaggans utelämningsmönster i create-event.
export interface CourseDimensions {
  /** Airtable Kursfamilj-värdet (singleSelect: RIM · Fjärrskådning · Psionautics). */
  kursfamilj: string;
  /** Airtable Kursnivå-värdet (Intro · Nivå 1 · Nivå 2 · Nivå 3), eller `null` för
   *  nivålösa familjer (Fjärrskådning/Psionautics) — TOMT är korrekt per design,
   *  inte en lucka. */
  kursniva: string | null;
}

const KURS_KARTA: Readonly<Record<string, CourseDimensions>> = {
  Fjärrskådning: { kursfamilj: 'Fjärrskådning', kursniva: null },
  'Resor i medvetandet': { kursfamilj: 'RIM', kursniva: 'Intro' },
  'Resor i medvetandet 1': { kursfamilj: 'RIM', kursniva: 'Nivå 1' },
  'Resor i medvetandet 2': { kursfamilj: 'RIM', kursniva: 'Nivå 2' },
  'Resor i medvetandet 3': { kursfamilj: 'RIM', kursniva: 'Nivå 3' },
  Psionautics: { kursfamilj: 'Psionautics', kursniva: null },
};

/**
 * Slår upp kursfamilj/kursnivå för ett Event (source)-kursnamn (exakt
 * strängmatchning — samma form som prototypens KURS_KARTA-uppslag).
 * Okänt kursnamn → `null` (öppet, aldrig gissat — se moduldoc ovan).
 */
export function lookupCourseDimensions(eventNamn: string): CourseDimensions | null {
  return KURS_KARTA[eventNamn] ?? null;
}
