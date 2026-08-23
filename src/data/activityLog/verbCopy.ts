/**
 * Verb-copy som PRESENTATION — aktivitetsradens händelsetext, mappad på
 * verbets stabila IRI-suffix i stället för radens lagrade `verb.display`
 * (S106 konvergens-passet, Marcus 2026-08-15: "Lotta skapade eventet" →
 * "Lotta skapade ett event").
 *
 * VARFÖR ETT PRESENTATIONSLAGER: `verb.display` fryses per rad när
 * statementet skrivs (xAPI-arkivformatet, orört) — en mappning vid rendering
 * ger även HISTORISKA rader förbättrad text utan datamigrering, och copyn
 * kan fortsätta slipas utan att röra datan.
 *
 * KONSUMENTER: aktivitetshistorik-vyn (S106-prototypen; skarpa vyn vid
 * promoveringen) OCH hem-spalten (`SenasteAktivitet.tsx`) — kopplades på
 * HÄR i PROMOVERINGS-skivan `TASK-225.3` (commit `c62d75b4`, landad via
 * `b924fb1b`, 2026-08-15). Hem-spalten är stämplad skarp yta (k10-facit,
 * `godkand` 2026-08-13) och en copy-ändring där kräver facit-amendering
 * (ADR-102 B3). Riktningen är Marcus-kvitterad 2026-08-15 ("Fixa fynden på
 * bästa möjliga sätt" på konsistensfyndet: hem och historik ska säga samma
 * sak — uppfyllt sedan `TASK-225.3`, båda konsumerar denna mappning).
 *
 * MEDVETET OFÖRÄNDRADE (explicita rader, inte fallback-hål):
 * - "markerade/avmarkerade bor över" — `Bor över` är ordlistefäst kanonisk
 *   term (ORDLISTA.md § Bor över: markeringen per anmälan) och frasen läser
 *   redan naturligt ("markerade [att deltagaren] bor över"); "övernattning"
 *   hade varit ordlisteavvikelsen.
 * - "skickade testmail till sig själv" / "skickade deltagarinformation" —
 *   redan naturliga utan artikel.
 * Verb utanför tabellen (t.ex. staging-testradernas API-kontrolltest)
 * faller till radens lagrade display.
 */

/** Minsta display-uttag — `sv-SE` om den finns, annars första värdet.
 * (Samma logik som vyernas `sprakText`; konsolideras vid promoveringen.) */
function lagradDisplay(display: Record<string, string>): string {
  return display['sv-SE'] ?? Object.values(display)[0] ?? '';
}

const VERB_COPY: Record<string, string> = {
  'skapade-event': 'skapade ett event',
  'uppdaterade-event': 'uppdaterade ett event',
  'skapade-anmalan': 'skapade en anmälan',
  'bekraftade-anmalan': 'bekräftade en anmälan',
  'markerade-betalning': 'markerade en betalning',
  'avmarkerade-betalning': 'avmarkerade en betalning',
  'uppdaterade-betalningsnotering': 'uppdaterade en betalningsnotering',
  'markerade-bor-over': 'markerade bor över',
  'avmarkerade-bor-over': 'avmarkerade bor över',
  'skickade-kvitto': 'skickade ett kvitto',
  'skickade-mail/bekraftelse': 'skickade ett bekräftelsemail',
  'skickade-mail/paminnelse': 'skickade en betalningspåminnelse',
  'skickade-mail/eventinfo': 'skickade deltagarinformation',
  'skickade-mail/fritt': 'skickade ett mail',
  'skickade-testmail': 'skickade testmail till sig själv',
  'skickade-segment-mail': 'skickade mail till ett segment',
  'sparade-segment': 'sparade ett segment',
  antecknade: 'skrev en anteckning',
  'uppdaterade-anteckning': 'uppdaterade en anteckning',
  // Bestämd form med avsikt: en person bär EN flagga (Lottas fritext-fält,
  // useUpdatePersonFlag), och personen står på radens objektrad.
  'uppdaterade-flagga': 'uppdaterade flaggan',
};

/** Radens händelsetext: mappad copy när verbet är känt, lagrad display annars. */
export function verbCopy(verb: { id: string; display: Record<string, string> }): string {
  const suffix = verb.id.split('/verbs/')[1];
  return (suffix && VERB_COPY[suffix]) || lagradDisplay(verb.display);
}
