/**
 * Eventformat-etiketterna (task-19.3; PRD task-19 beslut 5, K83 Marcus:
 * "formatspråket 2 dagar/1 dag"). UI:t talar Roger & Lottas språk — basen talar
 * sitt. Mappningen är EXPLICIT (etikett ≠ record) och görs i klienten ur den
 * BEFINTLIGA format-läsningen (get-event-formats: record-ID + namn) — ingen ny
 * EF, ingen hårdkodad options-lista: posterna kommer alltid från basen, bara
 * deras VISNINGSNAMN översätts här.
 *
 * Bas-namnen är LIVE-VERIFIERADE 2026-07-22 via Airtable-MCP (Eventformat
 * `tbl8qhuJQ5ZWPMRk4`, delat tabell-ID prod/staging):
 *   - "Utbildning - 2 dagar" (Format: Dag 1 + Dag 2) → "2 dagar"
 *   - "Föreläsning"          (Format: Föreläsning)   → "1 dag"
 * Staging bär dessutom sentinel-fixturen `ZZ-create-event-test-format`
 * (ADR-060) som saknar mappning — se fallback-regeln nedan.
 *
 * FALLBACK-RIKTNINGEN (fail-open, medveten): en post UTAN mappning döljs
 * ALDRIG — den visas med sitt bas-namn. Att filtrera bort okända format hade
 * gjort ett helt event omöjligt att skapa så fort basen växer med ett nytt
 * format; en främmande etikett i listan är ett synligt, åtgärdbart tillstånd,
 * en försvunnen rad är det inte. Namnlös post faller tillbaka på record-ID:t
 * (aldrig en tom etikett i dropdownen).
 */

/** Bas-namn → UI-etikett. Nya format läggs till här när basen växer. */
const ETIKETTER: Record<string, string> = {
  'Utbildning - 2 dagar': '2 dagar',
  Föreläsning: '1 dag',
};

/** Visningsnamnet för ett Eventformat i UI:ts språk (se fallback-regeln ovan). */
export function eventformatEtikett(format: { id: string; namn: string | null }): string {
  const namn = format.namn?.trim();
  if (!namn) return format.id;
  return ETIKETTER[namn] ?? namn;
}
