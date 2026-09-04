// supabase/functions/_shared/fet-markering.ts — säker **fet**-markering i
// bilagornas fritext.
//
// ═══ VARFÖR FILEN FINNS ═══
//
// Bekräftelsebilagans förlaga (~/Desktop/Miranon Media/exempelpdokument/
// bekräftelsebilaga-exempel.pdf) har flera ord i kursbeskrivningen satta i
// FETSTIL — "Resor i Medvetandet", "djupa meditationer", "Utanför
// Verkligheten", "Additiv meditation", "Punktmedvetandet" m.fl.
//
// Vår mall hade dem också, hårdkodade som <strong> i HTML:en, fram till
// TASK-309.4 (commit 10f006b6) som gjorde beskrivningen datadriven. Efter det
// kommer texten ur Airtable-fältet `Beskrivning` (multilineText, INTE rich
// text) och renderas med `<%= %>` under `autoEscape: true` — all formatering
// gick förlorad, och ingen märkte det förrän Marcus fångade det 2026-08-27:
// "den saknar även fetstilt och sådant på ord i kursbeskrivningen, allt sådant
// var på plats förut innan vi började ändra saker." Han hade rätt.
//
// ═══ VARFÖR INTE BARA SLÄPPA IGENOM HTML ═══
//
// Den enkla vägen — byta `<%= %>` mot `<%~ %>` för beskrivningen — hade
// öppnat en injektionsyta rakt in i ett dokument som mailas till deltagare.
// `autoEscape: true` är inte en slump: mall-render.ts § Eta-instansen slår
// fast disciplinen "`<%= %>` (aldrig `<%~ %>`) på VARJE fält som ytterst
// härstammar från Airtable-fritext", grundad i research-passets § Delfråga 4.
//
// Formen här bevarar den disciplinen med en WHITELIST i två steg:
//
//   1. HELA strängen escapas först — < > & " ' blir entiteter. Efter detta
//      steg finns ingen HTML kvar i texten, oavsett vad någon skrivit i
//      Airtable.
//   2. DÄREFTER återinförs exakt EN tagg, <strong>, och bara där mönstret
//      **…** matchar. Inget annat kan uppstå: `<script>` blev `&lt;script&gt;`
//      i steg 1 och rörs aldrig av steg 2.
//
// Det gör utdatan säker att rendera rått (`<%~ %>`) — men BARA utdatan från
// denna funktion. Ett fält som inte gått genom `fetMarkera()` ska fortsatt
// använda `<%= %>`.
//
// ═══ VARFÖR MARKDOWN-KONVENTION OCH INTE RICH TEXT-FÄLTET ═══
//
// Airtable kan göra `Beskrivning` till rich text (`isRichText`), men det
// kräver en fältmigrering i BÅDA baserna plus att all befintlig text skrivs
// om — och rich text kommer ändå ut som markdown över API:t. `**…**` i ett
// vanligt multilineText ger samma resultat utan migrering, och texten förblir
// läsbar för Roger och Lotta i Airtables vanliga redigerare.

/** Escapar de fem tecken som kan bryta ut ur HTML-kontext. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapar `text` fullständigt och konverterar sedan `**…**` till `<strong>`.
 *
 * Resultatet är säkert att rendera rått i Eta (`<%~ %>`) — och ENDAST
 * resultatet från denna funktion är det.
 *
 * Mönstret kräver minst ett tecken mellan markörerna och tillåter inte
 * radbrytning inuti: en asterisk-par som spänner över stycken är nästan
 * alltid ett skrivfel, inte en avsikt, och ska då synas som literal text i
 * stället för att svälja ett helt stycke i fetstil. Oparade markörer lämnas
 * orörda av samma skäl.
 */
export function fetMarkera(text: string): string {
  return escapeHtml(text).replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
}
