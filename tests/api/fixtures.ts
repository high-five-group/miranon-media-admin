// Delade staging-fixtur-konstanter för API-testerna (single-source, L120).
//
// Permanenta, namngivna staging-records (P-mönster, ingen PII) som flera
// *.staging.test.ts-filer delar. En enda hemvist så ett fixtur-ID aldrig kan
// dupliceras och driva isär mellan konsumenter (anti-mönstret: två kopior av
// samma 'rec…' som råkar uppdateras i bara den ena filen).
//
// Växer per Fas 6-sub-fas allteftersom fler tester konsumerar samma fixturer.

/**
 * `ZZ-History Person 01` — permanent historik-fixtur i staging-Personer.
 * 3 Deltaganden (RIM 1/2/3, distinkta datum) + 2 Anmälningar i olika orter.
 * Konsumeras av get-person.staging.test (skarp historik-/ort-conformance) och
 * update-record.staging.test (Anteckningar-write mot ett känt record).
 * STÄDA INTE bort den.
 */
export const HISTORY_PERSON_ID = 'recqxaFNwHAdQlAqb';

/**
 * `ZZ-belaggning-fixtur` — permanent beläggnings-fixtur i staging-Eventplanering
 * (task-18.2; seedad via MCP 2026-07-21, Ort 'ZZ-belaggning-fixtur' — medvetet
 * SKILD från ADR-060-purgens sentinel-markör). Bär K16-modellens samtliga
 * per-källa-fall mot kända värden:
 *   Max antal platser 10 · Extra platser 2 (reserverade) · Manuella platser 1
 *   4 länkade Anmälningar: 2 × Källa TOM (via formulär) · 1 × Källa '+1'
 *   (medföljande) · 1 × Källa 'Manuell' (bevisar exkludering ur båda räkningarna)
 *   2 Väntelista-rader via nya länkfältet 'Event (länk)': 1 aktiv + 1 med
 *   Flyttad till anmälan (bevisar aktiv-filtret i vantelista-räkningen)
 * Basens formel 'Antal anmälda' = 4 länkar + 1 manuella = 5 (summerings-beviset).
 * Konsumeras av get-event.staging.test (per-källa-conformance, AC #1).
 * Ingen EF kan skriva Källa TOM/'+1' eller vänteliste-länken → seedad fixtur är
 * enda deterministiska vägen (get-waitlist-fixturens precedent). STÄDA INTE.
 */
export const BELAGGNING_EVENT_ID = 'recIFrxHZw165ycXk';
export const BELAGGNING_EXPECTED = {
  maxPlatser: 10,
  reserverade: 2,
  manuelltTillagda: 1,
  viaFormular: 2,
  medfoljande: 1,
  vantelista: 1,
  antalAnmalda: 5,
} as const;
