// @ts-nocheck — Deno Edge Function-modul (importerar `airtable-client.ts`,
// som rör Deno-globaler; typas vid deploy, se ADR-010 § Fas 7-åtagande).
// Samma undantags-mönster som `_shared/document-sources.ts`.
//
// BASENS SIDA av betalningsdomänen — TASK-346.4, ADR-128 beslut 5–7.
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD SOM BOR VAR, OCH VARFÖR DENNA FIL FINNS
// ═══════════════════════════════════════════════════════════════════════════
// Inbetalningarna bor i Postgres (ADR-128 beslut 3). Men anmälan, eventet och
// PRISERNA bor kvar i Airtable-basen (beslut 5), och utan priset kan facken
// inte härledas. Varje betalnings-EF behöver därför samma två saker: läsa
// prisbilden ur basen, och skriva spegeln tillbaka dit. De två operationerna
// bor här i stället för att kopieras in i fyra EF:er.
//
// RIKTNINGEN ÄR ENKELRIKTAD (beslut 6): Postgres → basen. Ingen funktion här
// härleder pengar UR spegelvärdena — `lasSpegelvarden` läser dem enbart för
// att kunna JÄMFÖRA med Postgres-summan och visa eftersläpningen.
//
// ═══════════════════════════════════════════════════════════════════════════
// PRISETS TRE NIVÅER — OCH VARFÖR UPPSLAGET INTE ÄR EN LÄNK
// ═══════════════════════════════════════════════════════════════════════════
//   1. `Anmälningar.Avtalat pris (kr)` — per anmälan, vinner när satt.
//   2. `Eventplanering.Pris (kr)` — per event.
//   3. `Eventinnehåll.Pris (kr)` — standarden för (Event × Typ).
//
// Steg 3 är ett UPPSLAG på nyckelparet `Event (source)` × `Typ`, inte en
// länk: det finns ingen lagrad relation Eventplanering→Eventinnehåll
// (`data-model.md` § Stagingbasens additiva tillskott, raden för
// `Eventplanering.Pris (kr)`). Samma uppslag som `fetchDocumentSources`
// (`_shared/document-sources.ts` steg 2) redan gör för bilagemallarna —
// formen är kopierad därifrån med avsikt, inte uppfunnen på nytt.
//
// NOLL VINNER. `valjPris` (`betalningsharledning.ts`) prövar `!== null`, inte
// sanningsvärde. Ett explicit 0-pris är ett satt pris — samma fälla som
// `Saknas (kr)`-formeln gick i och som rättades i TASK-346.2 runda 2
// (`data-model.md` § RUNDA 2-FIX).

import {
  buildEqualsFilter,
  combineWithAnd,
} from './airtable-filter.ts';
import {
  fetchAirtableRecord,
  fetchFromAirtable,
  updateAirtableRecord,
} from './airtable-client.ts';
import { scalarNumber, scalarString, selectName } from './coerce.ts';
import { findDisallowedField, getOperation } from './field-allowlists.ts';
import type {
  AnmalningsavgiftVarde,
  Prisbild,
  SlutbetalningVarde,
} from './betalningsharledning.ts';
import { valjPris } from './betalningsharledning.ts';

const ANMALNINGAR_TABLE = 'Anmälningar';
const EVENTPLANERING_TABLE = 'Eventplanering';
const EVENTINNEHALL_TABLE = 'Eventinnehåll';

/** Allowlist-operationen TASK-346.2 förberedde. Den skrivande EF:en är denna. */
export const SPEGEL_OPERATION = 'write-registration-payment-mirror';

/** Anmälans record-ID-form. Samma uttryck som `inbetalningar_anmalan_record_id_form`. */
export const REC_ID_RE = /^rec[A-Za-z0-9]{14}$/;

export type AnmalanForBetalning = {
  id: string;
  namn: string;
  epost: string | null;
  telefon: string | null;
  status: string | null;
  eventId: string | null;
  /** `Anmälningar.Avtalat pris (kr)`. */
  avtalatPris: number | null;
  /** Spegelns nuvarande värde i basen — LÄSES ENBART för jämförelse. */
  summaInbetaltSpegel: number | null;
  /** Basens `Saknas (kr)`-formel. Lika färsk som spegeln, aldrig färskare. */
  saknasSpegel: number | null;
  deadlineSlutbetalning: string | null;
};

export type EventForBetalning = {
  id: string;
  namn: string | null;
  typ: string | null;
  startdatum: string | null;
  slutdatum: string | null;
  bokforingstext: string | null;
  pris: number | null;
  anmalningsavgift: number | null;
};

/** Läser anmälan. `null` = raden finns inte (anroparen formulerar sin 404). */
export async function lasAnmalan(anmalanRecordId: string): Promise<AnmalanForBetalning | null> {
  const record = await fetchAirtableRecord(ANMALNINGAR_TABLE, anmalanRecordId);
  if (!record) return null;
  const f = record.fields;
  const fornamn = scalarString(f['Förnamn']) ?? '';
  const efternamn = scalarString(f['Efternamn']) ?? '';
  const eventLank = f['Event'];
  const eventIds = Array.isArray(eventLank)
    ? eventLank.filter((v): v is string => typeof v === 'string')
    : [];

  return {
    id: record.id,
    namn: `${fornamn} ${efternamn}`.trim(),
    epost: scalarString(f['E-post']),
    telefon: scalarString(f['Mobilnummer']),
    status: selectName(f['Status'] ?? null),
    eventId: eventIds[0] ?? null,
    avtalatPris: scalarNumber(f['Avtalat pris (kr)']),
    summaInbetaltSpegel: scalarNumber(f['Summa inbetalt (kr)']),
    saknasSpegel: scalarNumber(f['Saknas (kr)']),
    deadlineSlutbetalning: scalarString(f['Deadline slutbetalning']),
  };
}

/**
 * Läser eventet OCH dess Eventinnehåll-standard, och löser prisets nivå 2–3.
 * Två Airtable-anrop: eventraden, sedan uppslaget (bara när eventet bär båda
 * nycklarna).
 */
export async function lasEvent(eventId: string): Promise<EventForBetalning | null> {
  const record = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
  if (!record) return null;
  const f = record.fields;

  const eventSource = selectName(f['Event (source)']);
  const typ = selectName(f['Typ']);

  const eventPris = scalarNumber(f['Pris (kr)']);
  const eventAvgift = scalarNumber(f['Anmälningsavgift (kr)']);

  // Uppslaget körs BARA när båda nycklarna finns OCH minst ett av prisen
  // faktiskt saknas — ett anrop som ändå inte kan ändra utfallet är slöseri
  // med basens delade anropstak (5/sekund, ADR-063 § S91-not).
  let standardPris: number | null = null;
  let standardAvgift: number | null = null;
  if (eventSource && typ && (eventPris === null || eventAvgift === null)) {
    const rader = await fetchFromAirtable(EVENTINNEHALL_TABLE, {
      filterByFormula: combineWithAnd([
        buildEqualsFilter('Event', eventSource),
        buildEqualsFilter('Typ', typ),
      ]),
      maxRecords: 1,
    });
    const eif = rader[0]?.fields ?? {};
    standardPris = scalarNumber(eif['Pris (kr)']);
    standardAvgift = scalarNumber(eif['Anmälningsavgift (kr)']);
  }

  return {
    id: record.id,
    namn: eventSource,
    typ,
    startdatum: scalarString(f['Startdatum']),
    slutdatum: scalarString(f['Slutdatum']),
    bokforingstext: scalarString(f['Bokföringstext (kvitto)']),
    pris: valjPris(null, eventPris, standardPris),
    anmalningsavgift: valjPris(null, eventAvgift, standardAvgift),
  };
}

/** Sätter ihop prisbilden härledningen behöver. */
export function byggPrisbild(
  anmalan: AnmalanForBetalning,
  event: EventForBetalning | null,
): Prisbild {
  return {
    avtalatPris: anmalan.avtalatPris,
    eventPris: event?.pris ?? null,
    anmalningsavgift: event?.anmalningsavgift ?? null,
    eventTyp: event?.typ ?? null,
  };
}

export type SpegelFalt = {
  summaInbetalt: number;
  anmalningsavgift: AnmalningsavgiftVarde | null;
  slutbetalning: SlutbetalningVarde | null;
  /** Sätts bara när ett kvitto utfärdats. `undefined` = rör inte fältet. */
  kvittonummer?: string;
  /** Sätts bara när Lotta angav ett avtalat pris i samma operation. */
  avtalatPris?: number;
};

/**
 * Spegelskrivningens utfall. `skal` är MUTERBAR med avsikt: anroparen får
 * skärpa texten med kontext bara den känner till — se
 * `registrera-inbetalning` § asymmetrin kring `Avtalat pris (kr)`, där ett
 * fallerat fält är PERMANENT förlorat till skillnad från de självläkande.
 */
export type SpegelUtfall = { skrivet: boolean; forsok: number; skal: string | null };

/** Hur många gånger spegelskrivningen försöks innan eftersläpningen bokförs. */
export const SPEGEL_FORSOK = 3;

/**
 * Skriver spegeln till basen med OMFÖRSÖK (ADR-128 beslut 5).
 *
 * KASTAR ALDRIG. Postgres-raden är redan skriven när denna funktion anropas,
 * och ett Airtable-fel får inte göra en registrerad inbetalning till ett
 * misslyckande för Lotta — det vore att låta spegeln bestämma över
 * sanningen, precis tvärtemot beslut 6. Utfallet returneras i stället, och
 * anroparen skickar med det i svaret så att eftersläpningen SYNS i appen i
 * stället för att tystas.
 *
 * `null`-värden HOPPAS ÖVER, de rensar inte. Härledningen returnerar `null`
 * för ett fack den inte kan avgöra (okänt pris), och att då skriva ett tomt
 * värde hade raderat information basen redan hade.
 *
 * ALLOWLIST-KONTROLLEN ÄR INTE CEREMONI: `findDisallowedField` fäller ett
 * fält utanför `write-registration-payment-mirror` INNAN Airtable-anropet, så
 * en framtida kod-drift upptäcks här och inte som en tyst fältskrivning.
 */
export async function skrivSpegel(
  anmalanRecordId: string,
  falt: SpegelFalt,
  loggPrefix: string,
): Promise<SpegelUtfall> {
  const operation = getOperation(SPEGEL_OPERATION);
  if (!operation) {
    return { skrivet: false, forsok: 0, skal: `Okänd operation: ${SPEGEL_OPERATION}` };
  }

  const patch: Record<string, unknown> = {
    'Summa inbetalt (kr)': falt.summaInbetalt,
  };
  if (falt.anmalningsavgift !== null) patch['Anmälningsavgift'] = falt.anmalningsavgift;
  if (falt.slutbetalning !== null) patch['Slutbetalning'] = falt.slutbetalning;
  if (falt.kvittonummer !== undefined) patch['Kvittonummer'] = falt.kvittonummer;
  if (falt.avtalatPris !== undefined) patch['Avtalat pris (kr)'] = falt.avtalatPris;

  const otillatet = findDisallowedField(operation, patch);
  if (otillatet !== null) {
    console.warn(`${loggPrefix} DENY field not in allowlist | field=${otillatet}`);
    return {
      skrivet: false,
      forsok: 0,
      skal: `Fältet "${otillatet}" är inte tillåtet för ${SPEGEL_OPERATION}`,
    };
  }

  let sistaFel = '';
  for (let forsok = 1; forsok <= SPEGEL_FORSOK; forsok += 1) {
    try {
      await updateAirtableRecord(operation.tableId, anmalanRecordId, patch);
      return { skrivet: true, forsok, skal: null };
    } catch (fel) {
      sistaFel = fel instanceof Error ? fel.message : String(fel);
      console.warn(
        `${loggPrefix} spegelskrivning försök ${forsok}/${SPEGEL_FORSOK} misslyckades | ` +
          `anmalan=${anmalanRecordId} | fel=${sistaFel}`,
      );
      if (forsok < SPEGEL_FORSOK) {
        // Kort, växande paus. `airtable-retry.ts` äger husets generella
        // retry-policy för LÄSNINGAR; här räcker en enkel backoff, eftersom
        // fallbacket (eftersläpning som syns) är ofarligt till skillnad från
        // en läsning som saknar data.
        await new Promise((klar) => setTimeout(klar, 250 * forsok));
      }
    }
  }
  return { skrivet: false, forsok: SPEGEL_FORSOK, skal: sistaFel };
}
