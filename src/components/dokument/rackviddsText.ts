import { stegEtikett } from '@/components/dokument/nivaSprak';

/* ═══ RÄCKVIDDENS TEXTER — EN KÄLLA, TVÅ UTTRYCK (TASK-338.3, ADR-125 § 1) ═══
 *
 * Räckvidden `Gemensam` är ett filter över tre valfria axlar (Kursfamilj ·
 * Kursnivå · Plats). Två ytor visar samma filter med olika röst:
 *
 *   - BADGEN i listan — KOMPAKT, ska rymmas i en pill bredvid ett filnamn:
 *     "Alla event" · "RIM" · "RIM · Steg 1" · "Rönninge" · "RIM · Rönninge" ·
 *     "RIM · Steg 1 · Rönninge".
 *   - SAMMANFATTNINGEN i uppladdningsdialogen — HEL MENING, ska gå att läsa
 *     högt innan man trycker Ladda upp: "Gäller: alla event i Rönninge".
 *
 * ═══ VARFÖR EN EGEN, REACT-FRI `.ts`-FIL ═══
 *
 * Kortets AC #4 kräver ENHETSTEST PER FORM. Repot har ingen React-
 * komponentprovare — `tests/a11y/*.spec.ts` är Playwright-webbläsartester,
 * och `tests/api/*.test.ts` (den rena, snabba klassen) kör i Node och kan
 * bara importera moduler utan JSX. Samma strukturella skäl som bröt ut
 * `_shared/attachment-filename.ts` ur `_shared/attachments.ts` (TASK-309.22)
 * och `nivaSprak.ts` ur `DokumentYta.tsx`: texten är den testbara kärnan,
 * komponenten runt den är bara en pill. `tests/api/rackvidds-text.test.ts`
 * täcker därför varje form direkt mot produktionskoden.
 *
 * ═══ "STEG", INTE "NIVÅ" — ORDLISTA.md § Steg ═══
 *
 * Basvärdet är `Nivå 1`; det VISADE ordet är `Steg 1`. Översättningen bor i
 * `nivaSprak.ts` och görs HÄR, en gång, för båda ytorna. PRD TASK-338 och
 * kortets beskrivning skriver formerna som "RIM · Nivå 1" men säger i samma
 * mening att etiketten går *"via befintlig `stegEtikett`"* — regeln, inte
 * bokstaven, är det bindande: ORDLISTA.md § Steg slår fast *"Ordet är Steg —
 * aldrig 'Nivå' — överallt"* (Marcus S108, utvidgar S107). Att rendera
 * "Nivå 1" hade varit en REGRESSION av ett landat beslut, inte trohet mot
 * kortet. Divergensen är bokförd i skivans slutrapport.
 *
 * ═══ INGEN MATCHNING HÄR (ADR-057, kortets DoD #6) ═══
 *
 * Funktionerna nedan FORMULERAR ett filter. De avgör aldrig vilka event det
 * träffar — det gör `supabase/functions/_shared/rackvidd-matchning.ts`
 * server-side. Frestelsen att "bara" lägga till en `matchar(event)` här är
 * exakt det lagerbrott ADR-057 förbjuder.
 */

/**
 * De tre axlarna, som de står på bilagan respektive i dialogens formulär.
 * `null`/tom sträng betyder ALLTID "axeln är inte satt, den begränsar
 * inte" — aldrig "okänd" och aldrig "alla".
 */
export interface RackviddsAxlar {
  kursfamilj: string | null;
  kursniva: string | null;
  /** Platsens NAMN (`Platsnamn`-lookupen), inte dess record-ID — texterna
   *  är för Lotta, och ett `rec…` säger henne ingenting. */
  platsNamn: string | null;
}

/** Tom sträng och `null` är samma sak: axeln är inte satt. */
function satt(varde: string | null | undefined): varde is string {
  return typeof varde === 'string' && varde.trim().length > 0;
}

/**
 * BADGE-TEXTEN — bara de SATTA axlarna, sammanfogade med mittpunkt.
 *
 * Noll satta axlar ger "Alla event", vilket är den enda formen som inte är
 * en uppräkning: den säger vad frånvaron BETYDER i stället för att visa en
 * tom pill.
 *
 * ═══ "ALLA STEG" SKRIVS INTE LÄNGRE UT, OCH DET ÄR ETT MEDVETET BYTE ═══
 *
 * Fram till denna skiva renderade badgen "RIM · Alla steg" för en
 * familjebunden bilaga utan nivå (ADR-118 beslut 1, "EXPLICIT utskriven i
 * stället för underförstådd"). Med tre axlar håller den formen inte: kortets
 * egen formlista bär "RIM · Rönninge" — alltså familj + plats UTAN ett
 * "Alla steg" emellan. Att skriva ut tomma axlar konsekvent hade gett
 * "RIM · Alla steg · Rönninge" och, för en platsbunden bilaga utan familj,
 * "Alla familjer · Alla steg · Rönninge" — en pill som mest består av det
 * den INTE begränsar.
 *
 * Regeln är därför: badgen visar VAD SOM BEGRÄNSAR. Den fulla meningen med
 * alla nyanser bor i dialogens sammanfattningsrad, där det finns plats för
 * den. Ytan ändras alltså synligt mot facit — bokfört som PRD-avsiktlig
 * ändring i kortets AC #3.
 */
export function rackviddsBadgeText(axlar: RackviddsAxlar): string {
  const delar: string[] = [];
  if (satt(axlar.kursfamilj)) delar.push(axlar.kursfamilj);
  // `stegEtikett` returnerar basvärdet oförändrat för ett okänt alternativ
  // (basen kan få ett nytt innan kartan uppdateras) — då är basens eget ord
  // ett ärligare svar än tystnad. Se nivaSprak.ts.
  if (satt(axlar.kursniva)) delar.push(stegEtikett(axlar.kursniva) ?? axlar.kursniva);
  if (satt(axlar.platsNamn)) delar.push(axlar.platsNamn);
  return delar.length === 0 ? 'Alla event' : delar.join(' · ');
}

/**
 * SAMMANFATTNINGEN — hel mening, Gunilla-läsbar, uppdateras live medan Lotta
 * väljer (kortets AC #1). De fyra formerna kortet räknar upp:
 *
 *   "Gäller: alla event"                        — inga axlar
 *   "Gäller: alla event i Rönninge"             — bara plats
 *   "Gäller: RIM-event i Rönninge"              — familj + plats
 *   "Gäller: RIM-event, Steg 1, i Rönninge"     — alla tre
 *
 * SUBJEKTET bär familjen ("RIM-event" / "alla event"), så meningen aldrig
 * blir en uppräkning av filtervillkor — Lotta ska inte behöva förstå ordet
 * "filter" för att förstå vad hon valt (PRD TASK-338, berättelse 6).
 *
 * Steget sätts som en INSKJUTEN SATS mellan kommatecken i stället för att
 * fogas till subjektet ("RIM-event Steg 1 i Rönninge" läser som ett
 * egennamn). Kommatecknet FÖRE "i Rönninge" i tre-axel-formen är därför
 * inte en slarvkomma utan den stängande halvan av inskottet.
 *
 * NIVÅ UTAN FAMILJ kan dialogen inte producera (Steg-väljaren är `inert`
 * tills en nivåbärande familj är vald) och EF:ens write-schema avvisar det.
 * Funktionen är ändå TOTAL och ger "Gäller: alla event, Steg 1" — en ren
 * funktion ska inte kasta på ett läge en framtida anropare kan konstruera.
 */
export function rackviddsSammanfattning(axlar: RackviddsAxlar): string {
  const subjekt = satt(axlar.kursfamilj) ? `${axlar.kursfamilj}-event` : 'alla event';
  const steg = satt(axlar.kursniva) ? (stegEtikett(axlar.kursniva) ?? axlar.kursniva) : null;
  const plats = satt(axlar.platsNamn) ? `i ${axlar.platsNamn}` : null;

  if (steg === null && plats === null) return `Gäller: ${subjekt}`;
  if (plats === null) return `Gäller: ${subjekt}, ${steg}`;
  if (steg === null) return `Gäller: ${subjekt} ${plats}`;
  return `Gäller: ${subjekt}, ${steg}, ${plats}`;
}
