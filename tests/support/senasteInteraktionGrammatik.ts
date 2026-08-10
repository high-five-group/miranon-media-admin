// Grammatik-kontraktet för `senasteInteraktion` — den mänskliga meningen som
// Airtables formler bygger FÄRDIG (appen renderar verbatim, se kommentaren
// "Texten kommer FÄRDIGFORMAD ur basen" i PersonsListPrototyp.tsx). Basen är
// enda källan till kompositionen (ADR-063); detta är formens KONTRAKT, inte
// en parser — appen parsar aldrig strängen (se ADR-108).
//
// Formen ändrades 2026-08-10 (två steg samma dag):
//   1. `TASK-184`: la till kurs+ort i anmälningsgrenen, prick-formad
//      ("Anmälde sig · RIM 1, Rönninge · 19 apr 2026").
//   2. Samma dag, senare: datumet togs bort och prickarna ersattes av
//      grammatiska prepositioner ("Anmälde sig till RIM 1 i Rönninge").
// Källa: live `describe_table` mot staging (`apphjj8Q7lkXCMsL4`) 2026-08-10 —
// `Anmälningar.Senaste anmälan (sammanfattning)` (`fldwgo1fJirUwUiOC`) och
// `Deltaganden.Deltog sammanfattning` (`fldKaxHf6UzcHN94v`); se
// `docs/decisions/ADR-108-*.md` för den fulla formeltexten och avvägningen.
//
// Regexerna nedan uttrycker SHAPE, inte en exakt sträng — de ska hålla för
// GODTYCKLIG kurs/ort, bara den grammatiska formen (verb + preposition +
// kurs + preposition + ort) är rätt. Exakta strängar hör hemma i de två
// permanenta staging-fixturernas pin-test (`tests/api/*.staging.test.ts`),
// aldrig här.

/**
 * Anmälningsgrenen. Formelns exakta struktur (live-verifierad):
 *   "Anmälde sig" & IF(kurs, " till " & kortform, "") & IF(ort, " i " & ort, "")
 * Alla fyra kombinationer av kurs/ort (båda · endast kurs · endast ort ·
 * ingen) är giltiga — matchar formelns egna IF-grenar.
 */
export const ANMALAN_MENING = /^Anmälde sig(?: till [^\n]+?)?(?: i [^\n]+)?$/;

/**
 * Deltagandegrenen. Formelns exakta struktur (live-verifierad):
 *   "Deltog" & IF(kurs,
 *     " på " & kortform & IF(ort, " i " & ort, ""),
 *     " · " & {Event sammanfattning}      ← prick-formen BEVARAD med avsikt
 *   )
 * Prick-fallbacken är INTE en kvarleva av den gamla formen — den är formelns
 * egen, medvetna reservväg när Kursnamn-lookupen är tom (se ADR-108).
 */
export const DELTAGANDE_MENING = /^Deltog(?: på [^\n]+?(?: i [^\n]+)?| · [^\n]+)$/;

/**
 * Regressionsvakt, oberoende av gren: datumet ("YYYY-MM-DD HH:MM – ") som
 * satt FÖRST i strängen fram till 2026-08-10 ska aldrig komma tillbaka —
 * `senasteInteraktionDatum` är ett eget fält sedan dess, och en sträng som
 * återigen bär datumet dubblerar informationen (skälet den togs bort,
 * `PersonsListPrototyp.tsx` rad ~522-526).
 */
export const GAMMALT_DATUMPREFIX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} – /;
