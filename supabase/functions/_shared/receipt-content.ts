// Kvittots textinnehåll (TASK-147.7, ADR-109) — REN formatering, delad mellan
// PDF-layouten (`send-receipt-email/index.ts` § byggKvittoPdf, pdf-lib) och
// mailtextens brödtext. Node+Deno dual-importable (ingen Deno-global, inget
// pdf-lib-beroende här) — samma "mirror-kontraktet" som
// `_shared/send-action-email.ts` § `renderFor` speglar `AtgardsSida.tsx`s
// platshållar-fyllning: BÅDA konsumenterna (PDF och mail) måste visa SAMMA
// rader, annars är det ena en lögn mot det andra.
//
// MOMSRADEN ÄR MEDVETET UTELÄMNAD (Marcus-beslut S102, Implementation Notes
// c) — ÖPPEN ROGER-PUNKT, se ADR-109 § Öppna punkter. Bygget går vidare utan
// den; en momsstatus-bekräftelse krävs FÖRE kvitton går skarpt till kunder.
//
// MIRANONS ORG-UPPGIFTER ÄR EN PLACEHOLDER (ANNAN öppen punkt, samma klass
// som momsraden) — organisationsnummer/postadress finns INTE dokumenterat
// någonstans i repot (sökt `docs/`, `src/`, S102-sessionsdoket — noll
// träffar, ADR-086 premiss-pass 2026-08-10). Roger/Marcus måste bekräfta de
// verkliga uppgifterna innan `MIRANON_ORG_PLACEHOLDER` nedan ersätts.

import type { Betalning, Betalsatt } from './send-receipt.ts';

/** ÖPPEN PUNKT (se filhuvudet) — ersätt med verkliga uppgifter innan skarp drift. */
export const MIRANON_ORG_PLACEHOLDER = {
  namn: 'Miranon Media',
  orgnummer: '[ORGANISATIONSNUMMER EJ BEKRÄFTAT — se ADR-109 § Öppna punkter]',
  adress: '[POSTADRESS EJ BEKRÄFTAD — se ADR-109 § Öppna punkter]',
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

/**
 * Kvittots rader i VISNINGSORDNING — konsumeras av BÅDE PDF-layouten och
 * mailets brödtext (se filhuvudets mirror-kontrakt). Innehållet är EXAKT
 * beslut (c): datum, belopp, betalsätt, event, kundnamn, Miranons
 * org-uppgifter. INGEN momsrad (samma beslut, öppen punkt).
 */
export function kvittoRader(spec: KvittoradSpec): readonly string[] {
  const betalningLabel = spec.betalning === 'avgift' ? 'Anmälningsavgift' : 'Slutbetalning';
  return [
    `Kvitto ${spec.kvittonummer}`,
    '',
    `Kund: ${spec.kundnamn}`,
    `Datum: ${formatKvittoDatum(spec.datum)}`,
    `Belopp: ${formatBelopp(spec.belopp)}`,
    `Betalsätt: ${spec.betalsatt}`,
    `Avser: ${betalningLabel}${spec.eventNamn ? ` — ${spec.eventNamn}` : ''}`,
    '',
    MIRANON_ORG_PLACEHOLDER.namn,
    `Org.nr: ${MIRANON_ORG_PLACEHOLDER.orgnummer}`,
    MIRANON_ORG_PLACEHOLDER.adress,
  ];
}
