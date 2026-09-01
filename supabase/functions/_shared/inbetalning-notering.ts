/**
 * Noteringen på en inbetalning — normalisering och tak.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR EN EGEN MODUL OCH INTE EN FUNKTION I `betalningar-db.ts`
 * ═══════════════════════════════════════════════════════════════════════════
 * `betalningar-db.ts` importerar `https://esm.sh/@supabase/supabase-js@2`, och
 * en Node-körd testsvit kan inte ladda den ("Only URLs with a scheme in: file
 * and data are supported by the default ESM loader"). Det är därför INGEN
 * hermetisk svit i `tests/api/` importerar den modulen — och varför ren logik
 * som ska bevisas utan deploy hör hemma i en modul UTAN fjärr-import.
 *
 * Samma form som `betalningsbelopp.ts` redan bär, av exakt samma skäl: den
 * mest felbenägna tolkningen ligger på servern, men den bevisas hermetiskt
 * (`tests/api/inbetalning-notering.test.ts`).
 *
 * Mätt 2026-09-01, inte antaget: funktionen låg först i `betalningar-db.ts`
 * och sviten föll på just den fjärr-importen innan den flyttades hit.
 */

/**
 * Noteringens längdtak — SAMMA tal som makulerings-skälets `SKAL_MAX_LANGD`
 * (`hantera-inbetalning/index.ts`) och samma tal som databasens check
 * `inbetalningar_notering_form`.
 *
 * Talet står på tre ställen med avsikt, inte av slarv: Edge Function-vägen
 * avvisar FÖRST och ger Lotta ett begripligt meddelande, databasen fäller det
 * som ändå tar sig förbi (backfill, import, manuell SQL). Att bara ha det ena
 * hade betytt antingen ett råt databasfel i hennes ansikte, eller en regel som
 * bara gäller den ena vägen in.
 */
export const NOTERING_MAX_LANGD = 500;

export type NoteringsLasning =
  | { ok: true; varde: string | null }
  | { ok: false; skal: 'typ' }
  | { ok: false; skal: 'langd'; langd: number };

/**
 * Rå notering → det som får skrivas till kolumnen.
 *
 * `null` returneras för frånvaro OCH för tomt/blankt. Kolumnen har en check som
 * förbjuder den tomma strängen, så "ingen notering" har exakt EN representation
 * i databasen — annars hade `undefined`, `''` och `'   '` blivit tre olika
 * värden som varje läsare måste hantera var för sig.
 *
 * TRIMNINGEN SKER FÖRE MÄTNINGEN mot taket. Omgivande blanksteg är inte
 * innehåll och ska aldrig kunna fälla en notering som ryms.
 *
 * Kastar ALDRIG, och SKILJER DE TVÅ FELEN ÅT: fel typ (någon skickade ett tal
 * eller ett objekt) är ett annat fel än för lång text. Lotta ska inte få
 * "högst 500 tecken" när felet var att fältet inte var text alls. Anroparen
 * formulerar meddelandet ur `skal` och får längden för att kunna säga den.
 */
export function lasNotering(ra: unknown): NoteringsLasning {
  if (ra === undefined || ra === null) return { ok: true, varde: null };
  if (typeof ra !== 'string') return { ok: false, skal: 'typ' };
  const trimmad = ra.trim();
  if (trimmad === '') return { ok: true, varde: null };
  if (trimmad.length > NOTERING_MAX_LANGD) {
    return { ok: false, skal: 'langd', langd: trimmad.length };
  }
  return { ok: true, varde: trimmad };
}
