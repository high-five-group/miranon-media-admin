import type { Event } from '../domain/models/Event';
import { type Modalitet, ModalitetSchema, type Par } from '../domain/schemas';

// Segment-byggar-ytans taxonomi härleds från EVENT-DOMÄNEN (get-events =
// Eventplanering), inte från närvaro-snapshoten och inte hårdkodad (ADR-064
// beslut 2) — rymden växer självmant när basen får nya event/kurser. JOIN-
// nyckeln (kurs = Event(source)) är teckenexakt = compute-segments Kursnamn
// (lookup) (live-cross-checkad Session 36).

/** Stabil identitetsnyckel för ett par (kurs × modalitet) — för urvals-state. */
export function parKey(par: Par): string {
  return `${par.kurs}|${par.modalitet}`;
}

/**
 * Distinkta (kurs × modalitet)-par ur get-events-datan. `kurs` = `eventNamn`
 * (Event(source)-singleSelect), `modalitet` = `typ` (Typ-singleSelect). Par med
 * saknad kurs eller modalitet UTANFÖR {Utbildning, Föreläsning} filtreras bort
 * (event utan giltig taxonomi-axel hör inte i byggaren). Deterministisk sortering
 * (kurs, sedan modalitet) → stabil UI-ordning + stabila tester.
 */
export function deriveTaxonomy(events: readonly Pick<Event, 'eventNamn' | 'typ'>[]): Par[] {
  const seen = new Map<string, Par>();
  for (const event of events) {
    const kurs = event.eventNamn;
    if (!kurs) continue;
    const parsed = ModalitetSchema.safeParse(event.typ);
    if (!parsed.success) continue; // typ null eller utanför enum → hoppa
    const par: Par = { kurs, modalitet: parsed.data };
    const key = parKey(par);
    if (!seen.has(key)) seen.set(key, par);
  }
  return [...seen.values()].sort(
    (a, b) => a.kurs.localeCompare(b.kurs, 'sv') || a.modalitet.localeCompare(b.modalitet, 'sv'),
  );
}

const MODALITET_GEMENER: Record<Modalitet, string> = {
  Utbildning: 'utbildning',
  Föreläsning: 'föreläsning',
};

/**
 * Gunilla-läsbar etikett för ett par: "{kurs} ({modalitet i gemener})".
 *
 * FÄLLA-35-disambiguering (data-model.md §Kända fällor #35): det nakna kursnamnet
 * "Resor i medvetandet" (utan siffra) med modalitet Föreläsning är ett DISTINKT
 * kursnamn skilt från RIM 1/2/3-serien → utan förtydligande är sammanblandning
 * trolig. Det paret får en omisskännlig etikett. Borttagbar när bas-maximeringen
 * (ADR-063, post-Fas-6) löser ut fälla 35 i basen.
 */
export function labelForPar(par: Par): string {
  if (par.kurs === 'Resor i medvetandet' && par.modalitet === 'Föreläsning') {
    return 'Resor i medvetandet — fristående föreläsning (ej del 1/2/3)';
  }
  return `${par.kurs} (${MODALITET_GEMENER[par.modalitet]})`;
}
