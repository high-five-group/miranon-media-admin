import type { Event } from '@/domain/models/Event';

/**
 * Långdatum-spann (task-18.1; S73-facit K10; rev. review-våg 4 2026-07-23):
 * sv-SE, aldrig rå ISO (Gunilla). En dag → "31 juli 2026"; spann inom samma
 * månad KOLLAPSAS → "15-16 augusti 2026"; samma år → "31 juli - 2 augusti
 * 2026"; över årsskifte → båda med år. Ogiltigt/saknat → "Datum ej satt".
 *
 * RIVET DIREKTIV (Marcus 2026-08-09, task-172 notes, MARCUS-BESLUT vid paus
 * 10): denna kommentar dokumenterade tidigare ett äldre "Marcus-direktiv"
 * ("tätt tankstreck, svenska skrivregler") för datumspann-separatorn. Det
 * direktivet stod i konflikt mot task-172s blankettinstruktion (alla långa
 * bindestreck i användarsynlig text bort) — konflikten flaggades öppen i
 * kortets notes och avgjordes skarpt av Marcus samma dag: "ALLA 15 långa
 * bindestreck i användarsynlig text MÅSTE bort" — korta streck vinner även
 * i datumspann. Separatorn är därför kort bindestreck (-), inte en-dash,
 * i samtliga tre grenar nedan.
 */
const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
/** Dag + månad utan år ("17 juli") — delas med Betalningars deadline/historik (task-18.8). */
export const DAGMANAD = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' });
/** Månad + år ("augusti 2026") — samma-månad-kollapsens svans. */
const MANADAR = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' });

export function datumSpannText(e: Pick<Event, 'startdatum' | 'slutdatum'>): string {
  if (!e.startdatum) return 'Datum ej satt';
  const start = new Date(e.startdatum);
  if (Number.isNaN(start.getTime())) return 'Datum ej satt';
  if (!e.slutdatum || e.slutdatum === e.startdatum) return LANGDATUM.format(start);
  const end = new Date(e.slutdatum);
  if (Number.isNaN(end.getTime())) return LANGDATUM.format(start);
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getDate()}-${end.getDate()} ${MANADAR.format(end)}`;
  }
  return start.getFullYear() === end.getFullYear()
    ? `${DAGMANAD.format(start)} - ${LANGDATUM.format(end)}`
    : `${LANGDATUM.format(start)} - ${LANGDATUM.format(end)}`;
}
