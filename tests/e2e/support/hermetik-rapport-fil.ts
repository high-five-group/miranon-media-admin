/**
 * Sökvägen till hermetik-rapportens JSONL — EN källa (S91, mätningens steg 1).
 *
 * Egen fil av ett skäl: skrivaren (`test-bas.ts`, i testprocessen) och läsaren
 * (`tests/global-teardown.ts`, efter hela runnet) är två olika körkontexter, och
 * en dubblerad sträng hade gått isär TYST — teardown hade inte hittat filen,
 * returnerat sin no-op-gren och rapporterat ingenting, utan att något fel syns.
 * Ett mätinstrument som tystnar när det går sönder är värre än inget.
 *
 * Konstanten bor här i stället för i `test-bas.ts` så att teardown kan läsa den
 * utan att importera testfixturen (och därmed köra `test.extend` vid import).
 */
export const HERMETIK_RAPPORT_FIL = 'test-results/hermetik-rapport.jsonl';
