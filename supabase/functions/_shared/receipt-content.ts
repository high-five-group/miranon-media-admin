// Kvittots textinnehåll (TASK-147.7, ADR-109) — REN formatering, delad mellan
// PDF-layouten (`send-receipt-email/index.ts` § byggKvittoPdf, pdf-lib) och
// mailtextens brödtext. Node+Deno dual-importable (ingen Deno-global, inget
// pdf-lib-beroende här) — samma "mirror-kontraktet" som
// `_shared/send-action-email.ts` § `renderFor` speglar `AtgardsSida.tsx`s
// platshållar-fyllning: BÅDA konsumenterna (PDF och mail) måste visa SAMMA
// rader, annars är det ena en lögn mot det andra.
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

import type { Betalning, Betalsatt } from './send-receipt.ts';

/** Miranons org-uppgifter på kvittot. Adressen är TRE fält (S108, se filhuvudet) — Rogers egen radindelning, aldrig en radbruten enradssträng. Källa: Rogers fakturasystem (se filhuvudet). */
export const MIRANON_ORG = {
  namn: 'Miranon Media AB',
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
 */
export function formatBelopp(belopp: number): string {
  const formaterat = new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(belopp);
  return formaterat.replace(/[  ]/g, ' ');
}

export type KvittoradSpec = {
  kvittonummer: string;
  kundnamn: string;
  /** Köparens e-post — skrivs ut under kundnamnet (Rogers Fakturaadress-ordning: namn → e-post). */
  kundEpost: string;
  belopp: number;
  betalsatt: Betalsatt;
  betalning: Betalning;
  eventNamn: string | null;
  /** ISO — datumet som skrivs ut ("Datum: …"), INTE nödvändigtvis dagens datum om kvittot avser en tidigare betalning. */
  datum: string;
};

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
 * Kvittots rader i VISNINGSORDNING — konsumeras av BÅDE PDF-layouten och
 * mailets brödtext (se filhuvudets mirror-kontrakt). Momsen (25 %, se
 * `beraknaMoms`) redovisas som TRE Gunilla-läsbara rader (Netto / Moms /
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
 */
export function kvittoRader(spec: KvittoradSpec): readonly string[] {
  const betalningLabel = spec.betalning === 'avgift' ? 'Anmälningsavgift' : 'Slutbetalning';
  const { moms, netto } = beraknaMoms(spec.belopp);
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
    `Avser: ${betalningLabel}${spec.eventNamn ? ` — ${spec.eventNamn}` : ''}`,
    '',
    MIRANON_ORG.namn,
    `Org.nr: ${MIRANON_ORG.orgnummer}`,
    MIRANON_ORG.gatuadress,
    MIRANON_ORG.postadress,
    MIRANON_ORG.land,
    `Momsreg.nr: ${MIRANON_ORG.momsregnummer}`,
  ];
}
