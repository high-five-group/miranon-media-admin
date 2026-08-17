/* ═══ "NIVÅ" HETER "STEG" I UI:T — MEN BARA I UI:T ═══
 *
 * Marcus 2026-08-17 (QA 273.5 steg 5): *"Jag vill också ändra ordet 'Nivå'
 * till 'steg'. Vi gör det på dokumentsidan nu och senare globalt i appen och
 * i basen."*
 *
 * VÄRDENA ÄR BASENS, INTE VÅRA. 'Intro' · 'Nivå 1' · 'Nivå 2' · 'Nivå 3' är
 * optionsnamnen i Airtable-fälten `Kursnivå` (Eventplanering + Bilagor), och
 * EF:ens zod-validering (`supabase/functions/_shared/attachments.ts`,
 * `KURSNIVA_VALUES`) avvisar allt annat med 400. Att byta dem i klienten
 * hade alltså inte döpt om något — det hade brutit varje uppladdning.
 *
 * Ordbytet är därför ett PRESENTATIONSLAGER: en ren funktion från lagrat
 * värde till visad text. Samma form som aktivitetshistorikens verb-copy
 * (S106) — en delad modul, inte en parallell datamodell, och inte en
 * beskrivning som kan glida isär mellan ytor.
 *
 * EGEN MODUL, INTE INNE I `DokumentYta.tsx`: `RackviddBadge` behöver samma
 * mappning, och `DokumentYta` importerar `RackviddBadge`. En export åt andra
 * hållet hade gett en cirkulär import.
 *
 * ── NÄR BASEN BYTER ──
 *
 * Då raderas denna fil och värdena talar för sig själva. Tills dess är detta
 * den ENDA platsen ordet översätts.
 *
 * ── ⚠️ ÖPPEN KOLLISION, EJ LÖST HÄR ──
 *
 * Uppladdningsblocket är en WIZARD vars sektioner heter "Steg 1"/"Steg 2",
 * och nivå-fältet sitter INUTI wizardens steg 1. Efter bytet står alltså en
 * select som heter "Steg", med värdet "Steg 1", inuti sektionen "Steg 1".
 * Två olika begrepp, samma ord, samma skärm.
 *
 * Kollisionen är BOKFÖRD, inte åtgärdad — den kräver ett val som inte är
 * agentens att ta: antingen får wizardens sektioner ett annat ord, eller så
 * får RIM-nivåerna det. Marcus är flaggad (S107 Del 8 § B).
 */

const NIVA_TILL_STEG: ReadonlyMap<string, string> = new Map([
  ['Intro', 'Intro'],
  ['Nivå 1', 'Steg 1'],
  ['Nivå 2', 'Steg 2'],
  ['Nivå 3', 'Steg 3'],
]);

/**
 * Lagrat basvärde → visad text.
 *
 * Ett okänt värde returneras OFÖRÄNDRAT, med avsikt: basen kan få ett nytt
 * nivå-alternativ innan denna karta uppdateras, och då är basens eget ord
 * ett ärligt svar. Alternativen — tom sträng eller ett kastat fel — hade
 * antingen dolt data för Lotta eller fällt hela raden för en etikett.
 */
export function stegEtikett(niva: string | null | undefined): string | null {
  if (niva == null) return null;
  return NIVA_TILL_STEG.get(niva) ?? niva;
}
