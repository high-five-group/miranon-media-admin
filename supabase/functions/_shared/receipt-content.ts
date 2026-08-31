// Kvittots textinnehåll (TASK-147.7, ADR-109) — REN formatering.
// Node+Deno dual-importable (ingen Deno-global, inget pdf-lib-beroende här).
//
// [TASK-309.5, Del 7:s ADR-083-fynd RÄTTAT HÄR] DEN GAMLA RADEN PÅSTOD ETT
// "MIRROR-KONTRAKT" ("delad mellan PDF-layouten ... och mailtextens
// brödtext ... BÅDA konsumenterna måste visa SAMMA rader, annars är det
// ena en lögn mot det andra") — FALSKT redan INNAN denna skiva.
// `kvittoRader()` var den ENDA verkliga konsumenten (PDF-layouten, via
// `renderKvittoPdf`/pdf-lib, `_shared/receipt-pdf.ts`, nu RIVEN).
// Mailkroppen (`send-receipt-email/index.ts`s `makeRealSender`) har
// ALLTID varit en SEPARAT, hårdkodad sträng ("Hej ${kundnamn}, här kommer
// ditt kvitto…"), som ALDRIG anropat `kvittoRader`. Det fanns alltså
// aldrig två konsumenter att hålla i synk — bara en.
//
// EFTER TASK-309.5 renderas PDF:en INTE LÄNGRE via `kvittoRader` + pdf-lib:
// `preview-receipt/index.ts` och `send-receipt-email/index.ts` anropar nu
// `_shared/mall-data.ts`s `byggKvittoData(spec)` → `_shared/mall-render.ts`s
// `renderaMallPdf('kvitto', …)` (Eta + DocRaptor) i stället.
// `byggKvittoData` ÅTERANVÄNDER denna fils rena primitiv (`beraknaMoms`/
// `formatBelopp`/`formatKvittoDatum`/`kvittoBenamning`/`MIRANON_ORG`) för
// att bygga en STRUKTURERAD data-form åt Eta-mallen — INTE `kvittoRader()`s
// textrad-lista. `kvittoRader()` SJÄLV HAR DÄRMED INGEN PRODUKTIONS-
// KONSUMENT KVAR efter denna skiva (bara sitt eget kontraktstest,
// `receipt-content.test.ts`) — behållen OFÖRÄNDRAD (att riva den ligger
// utanför TASK-309.5:s AC), inte tyst bortglömd: bokfört här, öppet, som
// en kandidat för en framtida mailtext-koppling ELLER rivning — ett beslut
// för en annan skiva.
//
// MOMSSATSEN ÄR BEKRÄFTAD (T170, Marcus kvitterade i klartext 2026-08-22 —
// "Allt på Rogers kvitto stämmer"; se ADR-109 § Updates 2026-08-22). Källa:
// ett SKARPT kvitto ur Rogers fakturasystem
// (`~/Desktop/Miranon Media/exempelpdokument/2026-08-03 kvitto-forlaga.pdf`,
// läst med `pdftotext -layout`) — momsraden `500,00 / 2 000,00 = 25 %`.
// Beslut (c):s momsutelämning (ADR-109) är därmed UPPHÄVD. `beraknaMoms`
// nedan avrundar momsen till närmaste öre och härleder nettot som
// differensen — ORDNINGEN ÄR LÅST, se funktionens egen docstring.
//
// MIRANONS ORG-UPPGIFTER ÄR BEKRÄFTADE (samma källa och kvittens som ovan)
// — sidfoten på Rogers kvitto. `MIRANON_ORG` nedan bär de verkliga
// uppgifterna i stället för en platshållare.
//
// BELOPPSFORMATET MATCHAR ROGERS OCH KÖPARENS E-POST ÄR MED (S108,
// Marcus-beslut 2026-08-22, ordagrant: "matcha Rogers beloppsformat och ta
// med e-posten"; se ADR-109 § Updates 2026-08-22 för den fulla motiveringen).
// `formatBelopp` nedan ger `2 500,00` — sv-SE-tusentalsavgränsare, alltid
// två decimaler, INGEN `kr`-suffix (valutan sätts av `kvittoRader()`, som
// prefixar `SEK` EN gång på BETALT-raden, precis som Roger). `KvittoradSpec`
// bär köparens e-post (`kundEpost`) och `kvittoRader()` skriver den under
// kundnamnet — samma ordning (namn → e-post) som Rogers Fakturaadress-block.
//
// DATUMET ÄR ISO OCH ADRESSEN ÄR TRE FÄLT (S108, Marcus-beslut 2026-08-22,
// slutbild av MARCUS-SEKVENS punkt 2, ordagrant "Kör dina rekommendationer" —
// se `tasks/sessions/2026-08-20-session-108.md` § Del 9 C och ADR-109
// § Updates 2026-08-22). `formatKvittoDatum` gav tidigare `"3 augusti 2026"`;
// kvittot är en BOKFÖRINGSHANDLING, alltså ISO `YYYY-MM-DD` i stället — ingen
// annan konsument i repot vill ha den svenska datumtexten (`git grep
// formatKvittoDatum` gav en enda konsument: `kvittoRader()` nedan; mailets
// brödtext i `send-receipt-email/index.ts` skriver inget datum alls). `
// MIRANON_ORG.adress` (en sträng) radbröt i mallens sidfotskolumn mitt i
// postnumret ("…väg 17, 144 / 63 Rönninge, Sverige", side-by-side mot
// förlagan) — ersatt av `gatuadress`/`postadress`/`land`, Rogers egen
// tre-radersform.
//
// RÄTTELSEVARV (TASK-306, Marcus granskning av `kvitto-prince-306.pdf`,
// 2026-08-23) — TRE domar, verbatim:
//
//   1) "Benämningen är för lång! Den tar ju upp tre rader!! Orginalet tar
//      upp EN rad. Kan vi skriva 'Utbildning 2026-07-25/26, personlig
//      utveckling, meditation' bara och få plats med det på en rad utan att
//      det ser konstigt ut? Lotta får ju plats med det på orginalet, med
//      marginal."
//   2) "Varför har vi fortfarande med ordet 'Slutbetalning'. Det är FEL.
//      Det är bara en betalning, varken slut eller början."
//   3) "på originalkvittot så har hon efter 'Vår referens' skrivit
//      'Miranon Media/Lotta Gotthardsson', vi har i vår mall skrivit
//      'Miranon Media AB'. Ändra det också."
//
// Åtgärdat: (1) `kvittoBenamning` tappar kursnamnet och komprimerar
// datumspannet till Lottas egen kompakta form (se funktionens docstring för
// exemplen) — (2) betalningsetiketten ("Anmälningsavgift"/"Slutbetalning")
// är borttagen ur BÅDE `kvitto.html` (mallen) och `kvittoRader`s Avser-rad
// nedan, `betalning`-fältet i `KvittoradSpec` lever kvar OFÖRÄNDRAT eftersom
// Kvitton-tabellens ledger (`send-receipt-email/index.ts`s
// `makeRealFinalizer`) fortfarande skriver det — (3) `MIRANON_ORG` får ett
// eget `varReferens`-fält, separat från sidfotens `namn` (oförändrad
// "Miranon Media AB").
//
// [TASK-346.5, ADR-128 § Beslut 1/9] KVITTOT AVSER EN INBETALNING —
// "FÖRFALLODATUM" BLIR "BETALNINGSDATUM". Kvittots referensblock hade sedan
// TASK-147.7 en statisk `Förfallodatum: -`-rad, bokförd i
// `docs/mallar/bilagor/README.md` § "Förlage-fält utan källa" som en
// medveten platshållare — "strukturellt konstant för ett KVITTO", eftersom
// ingen datamodell för en enskild betalnings datum fanns. Den modellen
// finns nu (`inbetalningar.betalningsdatum`, ADR-128 beslut 1/3): kvittot
// avser EXAKT EN inbetalning, och den bär ett eget datum. Raden är därför
// GAP-STÄNGD, inte längre en platshållare — `KvittoradSpec.betalningsdatum`
// + `formatBetalningsdatum` nedan. `datum` (ovan) förblir OFÖRÄNDRAT
// utfärdandedagen ("Datum: …") — de två fälten kan avvika, och gör det
// medvetet (ett kvitto utfärdat dagar efter en Swish-betalning).

import type { Betalning, Betalsatt } from './send-receipt.ts';

/** Miranons org-uppgifter på kvittot. Adressen är TRE fält (S108, se filhuvudet) — Rogers egen radindelning, aldrig en radbruten enradssträng. Källa: Rogers fakturasystem (se filhuvudet). */
export const MIRANON_ORG = {
  namn: 'Miranon Media AB',
  /** [TASK-306 rättelsevarv, Marcus dom 3] "Vår referens" på kvittot — Lottas
   * EGEN skrivning på förlagan (T170): "Miranon Media/Lotta Gotthardsson",
   * snedstreck UTAN mellanslag. Separat fält från `namn` ovan (sidfoten
   * skriver fortsatt "Miranon Media AB" oförändrat) — persondata-noten:
   * efternamnet finns redan publicerat i repot (`schema_reference.md`,
   * `VariantB.tsx` m.fl.), ingen ny T171-persondata-klass. */
  varReferens: 'Miranon Media/Lotta Gotthardsson',
  orgnummer: '559540-5498',
  gatuadress: 'Uttringe Hages väg 17',
  postadress: '144 63 Rönninge',
  land: 'Sverige',
  momsregnummer: 'SE559540549801',
};

/**
 * ISO-datum/-tidsstämpel → `"2026-08-03"` (ISO `YYYY-MM-DD`, UTC-datum —
 * S108, se filhuvudet: kvittot är en bokföringshandling). Ogiltig input →
 * den råa strängen (aldrig kastat). UTC-baserat MEDVETET, inte lokal tid:
 * `2026-12-31T23:30:00.000Z` ger `"2026-12-31"`, inte `"2027-01-01"` —
 * annars hade en körmiljö i en annan tidszon kunnat rulla datumet ett dygn
 * fel runt ett årsskifte (`tests/api/receipt-content.test.ts` bevisar kanten).
 */
export function formatKvittoDatum(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const ar = d.getUTCFullYear();
  const manad = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dag = String(d.getUTCDate()).padStart(2, '0');
  return `${ar}-${manad}-${dag}`;
}

/**
 * [TASK-346.5] Kvittots "Betalningsdatum"-rad — `formatKvittoDatum` (samma
 * ISO-form som "Datum:") när betalningsdatumet är känt, annars `-`, samma
 * platshållare raden bar innan den fick en källa (se
 * `KvittoradSpec.betalningsdatum`s docstring för VARFÖR `null` kan
 * förekomma — en backfillad historisk inbetalning, ADR-128 beslut 8).
 */
export function formatBetalningsdatum(betalningsdatum: string | null): string {
  return betalningsdatum === null ? '-' : formatKvittoDatum(betalningsdatum);
}

/**
 * "2 500,00" — Rogers format (T170, Marcus-beslut 2026-08-22): sv-SE
 * tusentalsavgränsare, ALLTID två decimaler, INGEN `kr`-suffix. Valutan är
 * konsumentens ansvar — `kvittoRader()` prefixar `SEK` EN gång på
 * BETALT-raden (som Roger), Netto/Moms visas utan valutakod.
 *
 * `Intl.NumberFormat('sv-SE')`s grupperingstecken SKILJER SIG mellan
 * ICU-versioner: U+00A0 (NBSP, äldre CLDR — det Node ger i denna körmiljö,
 * verifierat lokalt) eller U+202F (NNBSP, nyare CLDR — Deno/Supabase Edge
 * Runtime kan mycket väl ge det andra; ej lokalt verifierbart, ingen Deno-
 * binär tillgänglig i byggmiljön). pdf-lib/WinAnsiEncoding
 * (`StandardFonts.Helvetica`, `_shared/receipt-pdf.ts`) kan INTE koda
 * U+202F — verifierat mot en isolerad pdf-lib-installation: `page.drawText`
 * kastar `WinAnsi cannot encode " " (0x202f)`, vilket hade kraschat PDF-
 * renderingen för VARJE belopp ≥ 1000 kr om Deno råkar ge det tecknet.
 * Normalisera därför ALLTID till ett vanligt mellanslag (U+0020), oavsett
 * vilket av de två tecknen körmiljön ger — garanterat pdf-lib- och
 * HTML-säkert, oberoende av ICU-version.
 *
 * [TASK-346.5, förberedd för kreditkvittot i 346.9] SAMMA NORMALISERING
 * GÄLLER MINUSTECKNET. `Intl.NumberFormat('sv-SE')` skriver ett NEGATIVT
 * belopp med U+2212 (MINUS SIGN, det matematiska tecknet), INTE U+002D
 * (HYPHEN-MINUS) — mätt lokalt (`formatBelopp(-2500)` ger ett belopp med
 * U+2212, inte en vanlig bindestreck-minus). Kreditkvittot (ADR-109 §
 * Updates 2026-08-30, beslut d: "återbetalning = en negativ inbetalning")
 * är den FÖRSTA konsumenten av ett negativt `KvittoradSpec.belopp` — samma
 * försiktighetsprincip som grupperingstecknet: normalisera till det vanliga
 * ASCII-tecknet i stället för att lita på att varje typsnitt/rendermotor
 * bär ett glyf för det matematiska minustecknet.
 */
export function formatBelopp(belopp: number): string {
  const formaterat = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(belopp);
  return formaterat.replace(/[\u00a0\u202f]/g, ' ').replace(/\u2212/g, '-');
}

export type KvittoradSpec = {
  kvittonummer: string;
  kundnamn: string;
  /** Köparens e-post — skrivs ut under kundnamnet (Rogers Fakturaadress-ordning: namn → e-post). */
  kundEpost: string;
  belopp: number;
  betalsatt: Betalsatt;
  /** [TASK-306 rättelsevarv, Marcus dom 2] Konsumeras INTE längre av
   * `kvittoBenamning`/`kvittoRader` (etiketten "Anmälningsavgift"/
   * "Slutbetalning" är borttagen ur kvittots synliga text) — fältet lever
   * kvar OFÖRÄNDRAT eftersom Kvitton-tabellens ledger
   * (`send-receipt-email/index.ts`s `makeRealFinalizer`) fortfarande skriver
   * det till Airtable. */
  betalning: Betalning;
  /** Kursnamnet — Event-tabellens `Event (source)` (selectName). [TASK-306
   * rättelsevarv] INTE längre en del av `kvittoBenamning` (Marcus dom 1) —
   * fältet lever kvar för andra konsumenter (t.ex. Kvitton-tabellen). */
  eventNamn: string | null;
  /** ISO — datumet som skrivs ut ("Datum: …"), INTE nödvändigtvis dagens datum om kvittot avser en tidigare betalning. */
  datum: string;
  /** [TASK-306] Eventtyp-klass — Event-tabellens `Typ` (Utbildning/Föreläsning), selectName. */
  eventTyp: string | null;
  /** [TASK-306] ISO — Event-tabellens `Startdatum`. */
  eventStart: string | null;
  /** [TASK-306] ISO — Event-tabellens `Slutdatum`. */
  eventSlut: string | null;
  /** [TASK-306] Lottas fria bokföringskategoriord — frivilligt Event-fält
   * `Bokföringstext (kvitto)`. Ifyllt → sist i benämningen (`kvittoBenamning`
   * nedan); tomt → utelämnat. */
  bokforingstext: string | null;
  /** [TASK-346.5, ADR-128 § Beslut 1/9] ISO-datum (`YYYY-MM-DD`) ur
   * INBETALNINGEN — skrivs på kvittots "Betalningsdatum"-rad (ersätter
   * den tidigare statiska "Förfallodatum: -"-raden, se
   * `formatBetalningsdatum` nedan). SKILT från `datum` ovan, som förblir
   * UTFÄRDANDEDAGEN ("Datum: …") — de två kan avvika (ett kvitto som
   * utfärdas dagar efter en Swish-betalning). `null` när betalningsdatumet
   * är okänt — en backfillad historisk inbetalning utan känt datum
   * (ADR-128 beslut 8, betalsätt `Historik`) — raden visar då `-`, samma
   * platshållartext fältet bar innan det fick en källa. */
  betalningsdatum: string | null;
  /** [TASK-346.5 FÖRBEREDER, TASK-346.9 AKTIVERAR — ADR-109 § Updates
   * 2026-08-30 beslut d] Dokumenttyp: `'kvitto'` (default) eller
   * `'kreditkvitto'`. Styr ENDAST rubriken (`kvittoRubrik` nedan) —
   * INGEN anropare sätter `'kreditkvitto'` ännu (`jobb-konsument/index.ts`,
   * `preview-receipt/index.ts`, `send-receipt-email/index.ts` bygger alla
   * fortfarande bara vanliga kvitton). Valfritt fält, EXAKT för att inte
   * tvinga en ändring på de tre befintliga anropssiterna för en funktion
   * som ännu inte finns — se `byggKvittoData`s default nedan.
   */
  typ?: 'kvitto' | 'kreditkvitto';
  /** [TASK-346.5 FÖRBEREDER, TASK-346.9 AKTIVERAR — ADR-109 § Updates
   * 2026-08-30 beslut d: "kreditkvitto med nästa nummer i samma serie och
   * hänvisning till originalet"] Originalkvittots nummer, satt av
   * kreditkvittot. `null`/utelämnat för ett vanligt kvitto (`hanvisning`-
   * raden döljs helt, se `kvitto.html`s villkorade block). INGEN anropare
   * sätter detta ännu — se `typ` ovan för samma resonemang.
   */
  hanvisningTillKvittonummer?: string | null;
};

/**
 * [TASK-346.5, förberedd för 346.9] Kvittots rubrik — "Kvitto" (default)
 * eller "Kreditkvitto" när `spec.typ === 'kreditkvitto'`. Ren, egen
 * funktion (samma mönster som `formatBetalningsdatum`) så 346.9 kan
 * enhetstesta den isolerat utan att röra `byggKvittoData`.
 */
export function kvittoRubrik(typ: KvittoradSpec['typ']): string {
  return typ === 'kreditkvitto' ? 'Kreditkvitto' : 'Kvitto';
}

/**
 * [TASK-346.5, förberedd för 346.9] Kreditkvittots hänvisningstext —
 * `''` (INTE `null`, se `KvittoMallData`s "varje fält en sträng"-
 * konvention) när `hanvisningTillKvittonummer` saknas, annars "Kvitto
 * <nummer>" — samma prefix-form som README-tabellens "Vårt ordernr"/
 * "Kvitto-/OCR-nr" redan använder för att referera till ett kvittonummer.
 */
export function kvittoHanvisning(hanvisningTillKvittonummer: string | null | undefined): string {
  return hanvisningTillKvittonummer ? `Kvitto ${hanvisningTillKvittonummer}` : '';
}

/** Momssatsen i procent, för visning på kvittot ("Moms (25 %)"). Källa: filhuvudet. */
export const MOMSSATS_PROCENT = 25;

/**
 * Momsandelen av ett BRUTTObelopp (inkl. moms) vid 25 % moms. INTE 0,25 —
 * `brutto = netto × 1,25`, alltså `moms = brutto × 0,25/1,25 = brutto × 0,2`.
 */
const MOMSANDEL_AV_BRUTTO = 0.2;

export type MomsSplit = { readonly moms: number; readonly netto: number };

/**
 * Delar ett kundbetalt BRUTTObelopp (`KvittoradSpec.belopp` — Lotta-inmatat,
 * `send-receipt.ts` rad 57: "Kronor, positivt heltal eller decimal") i moms
 * och netto vid 25 % moms.
 *
 * ORDNINGEN ÄR LÅST, INTE VALFRI: momsen avrundas till närmaste ÖRE FÖRST
 * (heltalsaritmetik — `bruttoOre` och `momsOre` är alltid heltal, ingen
 * flyttalsdrift i det steget), och nettot HÄRLEDS som differensen
 * `brutto − moms`, aldrig avrundat oberoende av momsen.
 *
 * Att avrunda BÅDA delarna var för sig direkt ur bruttot (t.ex.
 * `moms = avrunda(brutto × 0,2)` OCH separat `netto = avrunda(brutto × 0,8)`,
 * ingen av dem härledd ur den andra) är en BOKFÖRINGSDEFEKT, inte en
 * avrundningsdetalj — raderna kan då sluta INTE summera exakt till bruttot.
 * Konkret motexempel (bevisat i `tests/api/receipt-content.test.ts`): vid
 * brutto 100,09 kr ger den oberoende varianten `20,02 + 80,07 =
 * 100,08999999999999 ≠ 100,09`. Denna funktions låsta ordning ger SAMMA
 * delbelopp (20,02 / 80,07) men håller invarianten `netto + moms === brutto`
 * exakt, eftersom nettot aldrig avrundas för sig — det ÄR bruttot minus den
 * redan avrundade momsen.
 */
export function beraknaMoms(brutto: number): MomsSplit {
  const bruttoOre = Math.round(brutto * 100);
  const momsOre = Math.round(bruttoOre * MOMSANDEL_AV_BRUTTO);
  const moms = momsOre / 100;
  const netto = brutto - moms;
  return { moms, netto };
}

/**
 * [TASK-306 rättelsevarv] Komprimerar ett datumspann till Lottas EGEN
 * kompakta skrivning i stället för att skriva ut båda datumen i sin helhet
 * (den formen tog tre rader i Prince-kolumnen, se `kvittoBenamning`s
 * docstring för Marcus mätning mot förlagans EN rad). `slut` null eller
 * samma som `start` → endagars, `start` returneras oförändrat.
 *
 *   - Samma år+månad, olika dag → `"2026-07-25/26"` (bara slutdagen)
 *   - Samma år, olika månad     → `"2026-07-31/08-01"` (månad-dag)
 *   - Olika år                  → `"2026-12-31/2027-01-01"` (hela slutdatumet)
 */
function formaterDatumspann(start: string, slut: string | null): string {
  if (!slut || slut === start) return start;
  const aarStart = start.slice(0, 4);
  const manadStart = start.slice(5, 7);
  const aarSlut = slut.slice(0, 4);
  const manadSlut = slut.slice(5, 7);
  if (aarStart === aarSlut && manadStart === manadSlut) {
    return `${start}/${slut.slice(8)}`; // bara dagen (DD)
  }
  if (aarStart === aarSlut) {
    return `${start}/${slut.slice(5)}`; // månad-dag (MM-DD)
  }
  return `${start}/${slut}`; // hela slutdatumet (YYYY-MM-DD)
}

/**
 * [TASK-306 rättelsevarv, Marcus dom 1, 2026-08-23] Kvittots BENÄMNING —
 * ordagrant: "Benämningen är för lång! Den tar ju upp tre rader!! Orginalet
 * tar upp EN rad. Kan vi skriva 'Utbildning 2026-07-25/26, personlig
 * utveckling, meditation' bara och få plats med det på en rad utan att det
 * ser konstigt ut? Lotta får ju plats med det på orginalet, med marginal."
 *
 * Formen är `<Typ> <Datumspann>, <Bokföringstext>` (se `formaterDatumspann`
 * ovan för datumkompressionen) — TVÅ ändringar mot den tidigare fyrledade
 * formen:
 *
 *   - INGET kursnamn. Lottas EGEN rad saknar det redan (hennes
 *     bokföringssystem är per ARTIKEL — bokföringstexten ENSAM identifierar
 *     raden där; se `fixtures/kvitto.exempel.json` § `_kalla` för det fulla
 *     resonemanget om VARFÖR vårt system tidigare lade till det).
 *   - Typ och datumspann skiljs av ETT MELLANSLAG, inte ett kommatecken —
 *     `"Utbildning 2026-07-25/26"`, inte `"Utbildning, 2026-07-25/26"`.
 *
 * VARJE led är VALFRITT — saknas ett fält UTELÄMNAS LEDET, ALDRIG en
 * platshållare. Endagars-event (samma start-/slutdatum, eller slutdatum
 * saknas): ETT datum, inget intervall (`formaterDatumspann`).
 */
export function kvittoBenamning(
  spec: Pick<KvittoradSpec, 'eventTyp' | 'eventStart' | 'eventSlut' | 'bokforingstext'>,
): string {
  const typDatumDelar: string[] = [];

  if (spec.eventTyp) {
    typDatumDelar.push(spec.eventTyp);
  }

  if (spec.eventStart) {
    typDatumDelar.push(formaterDatumspann(spec.eventStart, spec.eventSlut));
  }

  const delar: string[] = [];

  if (typDatumDelar.length > 0) {
    delar.push(typDatumDelar.join(' '));
  }

  if (spec.bokforingstext) {
    delar.push(spec.bokforingstext);
  }

  return delar.join(', ');
}

/**
 * Kvittots rader i VISNINGSORDNING. [TASK-309.5, se filhuvudet] Fram till
 * denna skiva var detta PDF-layoutens ENDA konsument (via `renderKvittoPdf`/
 * pdf-lib, nu riven) — ALDRIG mailets brödtext, som alltid varit en separat
 * hårdkodad sträng. Sedan TASK-309.5 har `kvittoRader` INGEN produktions-
 * konsument alls (PDF:en byggs av `_shared/mall-data.ts`s `byggKvittoData`
 * i stället) — behållen för sitt eget kontraktstest, se filhuvudet. Momsen
 * (25 %, se `beraknaMoms`) redovisas som TRE Gunilla-läsbara rader (Netto / Moms /
 * Betalt) i stället för Rogers sex kolumner (Benämning/Antal/Enhet/A-pris/
 * Summa + Netto/Exkl. moms/Moms/Öresavr/SEK/BETALT) — se PR-beskrivningen
 * för resonemanget bakom exakt vilka av Rogers uppgifter som tas med.
 *
 * BELOPPSFORMAT + E-POST (S108, Marcus-beslut 2026-08-22, se filhuvudet):
 * Netto/Moms visas UTAN valutakod (`formatBelopp` — "2 000,00"), BETALT
 * bär `SEK` som prefix EN gång (som Rogers BETALT-kolumn). Köparens e-post
 * (`spec.kundEpost`) skrivs direkt under kundnamnet — samma ordning
 * (namn → e-post) som Rogers Fakturaadress-block.
 *
 * DATUM + ORG-ADRESS (S108, Marcus-beslut 2026-08-22, se filhuvudet):
 * `Datum:`-raden är ISO (`formatKvittoDatum`), och org-adressen är TRE
 * rader (`MIRANON_ORG.gatuadress`/`postadress`/`land`) i stället för en —
 * Rogers egen radindelning.
 *
 * AVSER-RADEN (TASK-306 rättelsevarv, Marcus dom 2, 2026-08-23) — ordagrant:
 * "Varför har vi fortfarande med ordet 'Slutbetalning'. Det är FEL. Det är
 * bara en betalning, varken slut eller början." Etiketten
 * ("Anmälningsavgift"/"Slutbetalning") är BORTTAGEN ur raden — den skriver
 * nu bara benämningen (`kvittoBenamning`). `spec.betalning` självt rör
 * ingenting här längre (se `KvittoradSpec.betalning`s docstring för var det
 * fortfarande används).
 */
export function kvittoRader(spec: KvittoradSpec): readonly string[] {
  const { moms, netto } = beraknaMoms(spec.belopp);
  const benamning = kvittoBenamning(spec);
  return [
    `Kvitto ${spec.kvittonummer}`,
    '',
    `Kund: ${spec.kundnamn}`,
    `E-post: ${spec.kundEpost}`,
    `Datum: ${formatKvittoDatum(spec.datum)}`,
    `Netto: ${formatBelopp(netto)}`,
    `Moms (${MOMSSATS_PROCENT} %): ${formatBelopp(moms)}`,
    `Betalt: SEK ${formatBelopp(spec.belopp)}`,
    `Betalsätt: ${spec.betalsatt}`,
    benamning ? `Avser: ${benamning}` : 'Avser:',
    '',
    MIRANON_ORG.namn,
    `Org.nr: ${MIRANON_ORG.orgnummer}`,
    MIRANON_ORG.gatuadress,
    MIRANON_ORG.postadress,
    MIRANON_ORG.land,
    `Momsreg.nr: ${MIRANON_ORG.momsregnummer}`,
  ];
}
