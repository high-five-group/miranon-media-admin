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

import type { Betalning, Betalsatt } from './send-receipt.ts';

/** Miranons org-uppgifter på kvittot. Källa: Rogers fakturasystem (se filhuvudet). */
export const MIRANON_ORG = {
  namn: 'Miranon Media AB',
  orgnummer: '559540-5498',
  adress: 'Uttringe Hages väg 17, 144 63 Rönninge, Sverige',
  momsregnummer: 'SE559540549801',
};

const MANADSNAMN = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

/** ISO-datum/-tidsstämpel → "10 augusti 2026". Ogiltig input → den råa strängen (aldrig kastat). */
export function formatKvittoDatum(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const manad = MANADSNAMN[d.getUTCMonth()];
  return `${d.getUTCDate()} ${manad} ${d.getUTCFullYear()}`;
}

/** "1250 kr" — heltal utan decimaler visas utan ören, annars två decimaler med komma (sv-SE-konvention). */
export function formatBelopp(belopp: number): string {
  const heltal = Number.isInteger(belopp);
  const tal = heltal
    ? belopp.toString()
    : belopp.toFixed(2).replace('.', ',');
  return `${tal} kr`;
}

export type KvittoradSpec = {
  kvittonummer: string;
  kundnamn: string;
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
 */
export function kvittoRader(spec: KvittoradSpec): readonly string[] {
  const betalningLabel = spec.betalning === 'avgift' ? 'Anmälningsavgift' : 'Slutbetalning';
  const { moms, netto } = beraknaMoms(spec.belopp);
  return [
    `Kvitto ${spec.kvittonummer}`,
    '',
    `Kund: ${spec.kundnamn}`,
    `Datum: ${formatKvittoDatum(spec.datum)}`,
    `Netto: ${formatBelopp(netto)}`,
    `Moms (${MOMSSATS_PROCENT} %): ${formatBelopp(moms)}`,
    `Betalt: ${formatBelopp(spec.belopp)}`,
    `Betalsätt: ${spec.betalsatt}`,
    `Avser: ${betalningLabel}${spec.eventNamn ? ` — ${spec.eventNamn}` : ''}`,
    '',
    MIRANON_ORG.namn,
    `Org.nr: ${MIRANON_ORG.orgnummer}`,
    MIRANON_ORG.adress,
    `Momsreg.nr: ${MIRANON_ORG.momsregnummer}`,
  ];
}
