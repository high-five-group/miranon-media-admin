// _shared/event-map.ts — TASK-23. SSOT för eventets LÄS-mappning (Airtable-fält →
// domän-Event) och för `Månad/år`-härledningen, delad av de fyra event-EF:erna.
//
// VARFÖR FILEN FINNS: samma bas-mappning låg i FYRA kopior — get-events, get-event,
// update-event (den berikade läs-shapen) och create-event (`deriveManadAr`) — och
// håll-i-synk-plikten bars av kod-kommentarer i varje kopia. Driftrisken växte per
// kopia och per nytt läs-fält (kortets Implementation Notes bokför tre tillfällen då
// kopiorna hölls i synk för hand). `_shared` är Supabase egen anvisade väg:
// "One common pattern when developing Functions is that you need to share code
// between two or more Functions. To do this, you can store any shared code in a
// folder prefixed with an underscore (`_`)."
// (supabase.com/docs/guides/functions/development-tips). Deployen bär den utan
// extra åtgärd: "The CLI bundles the function and its dependencies into an ESZip
// file" (supabase.com/docs/guides/functions/architecture) — modulgrafen följer den
// relativa importen.
//
// BETEENDE-BEVARANDE: extraktionen är REN. Före landningen var bas-delens 21 nycklar
// mekaniskt verifierat identiska (uttryck för uttryck) i alla tre läs-kopior, och
// kategorifältens 4 nycklar identiska i get-event + update-event; `deriveManadAr` +
// `MANAD_AR_MONTHS` var BYTE-identiska (408 tecken) i create-event + update-event.
// NYCKELORDNINGEN är därtill bevarad i varje anropare (spread först, funktions-
// specifika fält efter) — JSON.stringify bevarar insättningsordning, så svaren är
// byte-identiska med föregående version, inte bara semantiskt lika.
//
// GRÄNSEN GÅR VID DET GEMENSAMMA. create-event:s `mapCreatedEvent` bär en ANNAN
// (mindre) shape — `manadAr`/`eventNr` som ingen annan har, inga formel-/rollup-fält,
// och `eventKey: … ?? null` i stället för utelämning. Den mappningen ligger därför
// KVAR i sin EF och delar bara `deriveManadAr` härifrån; att tvinga in den i basen
// hade varit en beteendeändring, inte en refaktor.
//
// Node-typkollad via `tsconfig.edge-shared.json` (transitivt Deno-fri: enda importen
// är `coerce.ts`, som redan står i den listan).

import { scalarNumber, scalarString, selectName } from './coerce.ts';

/** Airtable-radens form som mappningen läser (samma i list-, single-get- och PATCH-svar). */
type AirtableRecord = { id: string; fields: Record<string, unknown> };

// Svenska månadsnamn (kapitaliserade) för `Månad/år`-härledningen. Basens singleSelect
// bär options på formen "Mars 2026" → vi bygger samma sträng ur Startdatum. NB: options-
// listan i basen är ändlig (range Nov 2025 – Dec 2026 i nuläget); ett datum utanför den
// gör att `typecast:false`-upserten FELAR (→ 500) i stället för att tyst skapa en option.
// Det är medvetet: basens manuella Månad/år-fält är en designbrist (§Kända fällor 36,
// LIVE-bekräftad som fälla 45) och en out-of-range-träff ska SYNAS, inte maskeras.
// Maximerings-kandidat T16.
const MANAD_AR_MONTHS = [
  'Januari',
  'Februari',
  'Mars',
  'April',
  'Maj',
  'Juni',
  'Juli',
  'Augusti',
  'September',
  'Oktober',
  'November',
  'December',
];

/** Härleder `Månad/år`-värdet ("Mars 2026") ur ett ISO-datum (YYYY-MM-DD). */
export function deriveManadAr(isoDate: string): string {
  const [year, month] = isoDate.split('-');
  return `${MANAD_AR_MONTHS[Number(month) - 1]} ${year}`;
}

/**
 * Eventets BAS-shape — de 21 fält som get-events, get-event och update-event
 * mappar IDENTISKT (kanonisk coercion ur `_shared/coerce.ts`). Anroparen spreadar
 * detta FÖRST och lägger sina egna fält efter, så nyckelordningen i svaret är
 * oförändrad mot de tidigare inline-kopiorna.
 *
 * update-event kan använda samma mappning som läs-vägen därför att Airtables
 * PATCH-svar bär ALLA fält (inkl. formler/rollups) — write-svaret kan alltså bära
 * läs-vägens domän-shape och klienten cache-sätta direkt.
 */
export function mapEventBas(record: AirtableRecord) {
  const f = record.fields;

  return {
    id: record.id,
    eventlabel: f['Eventlabel'] ?? null, // formula (primary)
    eventNamn: selectName(f['Event (source)']), // singleSelect
    typ: selectName(f['Typ']), // singleSelect
    ort: scalarString(f['Ort']), // text (eget fält, skalärt)
    startdatum: f['Startdatum'] ?? null, // date
    slutdatum: f['Slutdatum'] ?? null, // date
    tidKvarTillEvent: f['Tid kvar till event'] ?? null, // formula → text
    // Number-fält via scalarNumber: Airtable ger formel-/procent-fält som blir
    // NaN/Infinity (0/0, osatt maxPlatser) som OBJEKT {specialValue} — scalarNumber
    // coercar det till null så .parse() håller.
    maxPlatser: scalarNumber(f['Max antal platser']), // number (osatt → null)
    antalAnmalda: scalarNumber(f['Antal anmälda']) ?? 0, // formel → number
    platserKvar: scalarNumber(f['Platser kvar']), // formel → number|null
    anmaldBelaggning: scalarNumber(f['Anmäld beläggning (%)']), // formel-% (NaN→null)
    bekraftadBelaggning: scalarNumber(f['Bekräftad beläggning (%)']), // formel-% (NaN→null)
    antalNyaAnmalningar: scalarNumber(f['Antal nya anmälningar']) ?? 0, // rollup → number
    antalAnmalningsavgifter: scalarNumber(f['Antal mottagna anmälningsavgifter']) ?? 0, // rollup
    antalSlutbetalningar: scalarNumber(f['Antal mottagna slutbetalningar']) ?? 0, // rollup
    antalSlutbetalningFelande: scalarNumber(f['Antal slutbetalning saknas']) ?? 0, // formel
    status: selectName(f['Status'] ?? null), // singleSelect (om det finns)
    // eventKey (task-18.1): formel "Event-" & {Event-nr}. Saknas värdet UTELÄMNAS
    // nyckeln (JSON.stringify droppar undefined; aldrig null — fältet är OPTIONAL i
    // EventSchema, så z.array-parsen håller ändå).
    eventKey: typeof f['EventKey'] === 'string' ? f['EventKey'] : undefined,
    // Basdimensionerna (TASK-249.4, ADR-115): direkta singleSelect-fält, alltid lästa —
    // selectName ger string|null (aldrig gissat).
    kursfamilj: selectName(f['Kursfamilj']),
    kursniva: selectName(f['Kursnivå']),
  };
}

/**
 * Beläggningens TVÅ skrivbara kategorifält + auto-utskickets TVÅ fält (task-18.2 K16,
 * task-18.6) — de fyra nycklar som get-event och update-event bär men get-events inte.
 *
 * Osatt i basen → nyckeln UTELÄMNAS (undefined droppas av JSON.stringify; eventKey-
 * formen — aldrig null, OPTIONAL i EventSchema). Opt-out-krysset är undantaget:
 * Airtable utelämnar en OKRYSSAD checkbox ur svaret, så det normaliseras till FALSE
 * (aldrig undefined) — krysset ska alltid ha ett definit läge att rendera.
 */
export function mapEventKategorifalt(record: AirtableRecord) {
  const f = record.fields;

  return {
    reserverade: scalarNumber(f['Extra platser']) ?? undefined, // 'Extra platser'
    manuelltTillagda: scalarNumber(f['Manuella platser']) ?? undefined, // 'Manuella platser'
    deltagarinfoSchemalagd: scalarString(f['Deltagarinfo schemalagd']) ?? undefined,
    deltagarinfoAutoAvstangt: f['Deltagarinfo auto-utskick avstängt'] === true,
  };
}
