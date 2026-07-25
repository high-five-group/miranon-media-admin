import type { PersonHistoryEntry } from '@/domain/schemas';

/**
 * GENOMFÖRD kurs-rad (basens `Genomfört event`-formel, fldRfc4i7HHfc1dFU):
 * närvaro (Närvaropoäng = 1) OCH Session ∈ {Dag 1, Föreläsning} — Dag 2
 * räknas aldrig (dedup för tvådagars-event). EN definition, delade
 * konsumenter (Gruppdynamiks kurshistorik-härledning + RIM-behörigheten,
 * task-18.17 review-fynd F6) — ändras basens formel ändras predikatet HÄR,
 * aldrig i två filer (shotgun surgery-vakten; kursfarg-precedentens
 * ETT-uppslag-disciplin).
 */
export function arGenomford(entry: PersonHistoryEntry): boolean {
  return entry.narvaro && (entry.session === 'Dag 1' || entry.session === 'Föreläsning');
}
