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
