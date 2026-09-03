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
// Node-typkollad via `tsconfig.edge-shared.json` (transitivt Deno-fri: importerna är
// `coerce.ts` och `betalningsharledning.ts`, som båda redan står i den listan —
// den senare tillkom med `pris` nedan och drar bara in `betalningsbelopp.ts`,
// också i listan, så grafen stannar innanför den).

import { valjPris } from './betalningsharledning.ts';
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
export function mapEventBas(record: AirtableRecord, standardPris: number | null = null) {
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
    // EVENTETS PRIS (TASK-368.7) — prisets NIVÅ 2 och 3, aldrig nivå 1.
    //
    // `valjPris(null, perEvent, standard)` är EXAKT `betalningar-bas.ts`
    // § `lasEvent` gör (`pris: valjPris(null, eventPris, standardPris)`), och
    // det är avsiktligt samma funktion och inte en andra formulering: serverns
    // `harledBetalning` räknar ombokningens `prisskillnad` ur just det talet,
    // och två prisregler hade kunnat glida isär tyst.
    //
    // FÖRSTA ARGUMENTET ÄR ALLTID `null` — nivå 1 (`Anmälningar.Avtalat pris
    // (kr)`) hör till en ANMÄLAN, inte till ett event, och finns inte på denna
    // rad. Ett event bär alltså aldrig någons avtalade pris.
    //
    // `standardPris` är Eventinnehåll-standarden (nivå 3), som anroparen slår
    // upp och skickar in — uppslaget är I/O och kan därför inte bo i denna
    // rena modul (`_shared/eventpris.ts` § `hamtaStandardpriser`). Utelämnas
    // parametern faller värdet tillbaka på per-event-priset ensamt; det är
    // INTE ett läge någon av de tre läs-EF:erna kör i (samtliga skickar
    // uppslaget), utan defaultens enda uppgift är att hålla anropare som
    // aldrig kan göra I/O ärliga i stället för att tvinga dem ljuga ett tal.
    //
    // 0 ÄR ETT SATT PRIS: `valjPris` prövar `!== null`, inte sanningsvärde
    // (`betalningsharledning.ts` § NOLL). `scalarNumber` ger `null` för ett
    // tomt fält och för Airtables `{specialValue}`-objekt.
    pris: valjPris(null, scalarNumber(f['Pris (kr)']), standardPris),
  };
}

/**
 * Uppslagsnyckeln för Eventinnehåll-standarden: paret `Event (source) × Typ`.
 *
 * SSOT för nyckelns FORM, delad av uppslaget (`_shared/eventpris.ts`) och av
 * varje anropare som ska matcha en eventrad mot en hämtad standard. Steg 3 i
 * prisets tre nivåer är ett UPPSLAG, inte en länk — det finns ingen lagrad
 * relation Eventplanering→Eventinnehåll (`data-model.md` § Stagingbasens
 * additiva tillskott; samma uppslag `_shared/document-sources.ts` steg 2 gör
 * för bilagemallarna).
 *
 * `null` när endera halvan saknas: ett par med ett tomt led kan inte slå upp
 * någon rad, och att låtsas att `'Fjärrskådning|'` vore en nyckel hade gjort
 * två prislösa event till varandras standard.
 *
 * JSON-formen (inte `a + '|' + b`) är avsiktlig: ett `|` i ett Airtable-
 * optionsnamn hade annars kunnat göra två skilda par till samma nyckel.
 */
export function eventinnehallNyckel(
  eventSource: string | null,
  typ: string | null,
): string | null {
  if (eventSource === null || typ === null) return null;
  return JSON.stringify([eventSource, typ]);
}

/** Samma nyckel, läst direkt ur en Airtable-eventrad. `null` = kan inte slås upp. */
export function eventinnehallNyckelFor(record: AirtableRecord): string | null {
  return eventinnehallNyckel(selectName(record.fields['Event (source)']), selectName(record.fields['Typ']));
}

/**
 * Har eventraden ett EGET pris? Uppslaget mot Eventinnehåll behövs bara för
 * de rader som INTE har det — ett anrop som ändå inte kan ändra utfallet är
 * slöseri med basens delade anropstak (5/sekund, ADR-063 § S91-not). Samma
 * villkorade form som `betalningar-bas.ts` § `lasEvent` redan bär.
 */
export function harEgetPris(record: AirtableRecord): boolean {
  return scalarNumber(record.fields['Pris (kr)']) !== null;
}

/**
 * Vilka `Event (source) × Typ`-par en läsning FAKTISKT behöver slå upp.
 *
 * Tom mängd ⇒ uppslaget hoppas över helt (`_shared/eventpris.ts`
 * § `hamtaStandardpriser`): varje rad har antingen ett eget pris eller saknar
 * en nyckel att slå upp med, och standarden kan då inte ändra ett enda utfall.
 *
 * REN, och därför testbar utan staging — I/O:t bor i `eventpris.ts`, som är
 * Deno-bunden via `airtable-client.ts`. Samma snitt som `hojdanpassning.ts`
 * och `kvitto-kombination.ts` fick när deras moduler var otestbara i Node.
 */
export function standardprisNycklar(records: readonly AirtableRecord[]): Set<string> {
  const nycklar = new Set<string>();
  for (const record of records) {
    if (harEgetPris(record)) continue;
    const nyckel = eventinnehallNyckelFor(record);
    if (nyckel !== null) nycklar.add(nyckel);
  }
  return nycklar;
}

/**
 * Eventinnehåll-radernas priser, indexerade på uppslagsnyckeln — begränsat
 * till `nycklar`, alltså till de par läsningen faktiskt frågade efter.
 *
 * En rad utan pris hamnar ALDRIG i mappen: `valjPris` skiljer inte på "ingen
 * post" och "posten saknar värde", och båda ska betyda att standarden inte
 * bidrar. 0 är däremot ett SATT pris och tas med
 * (`betalningsharledning.ts` § NOLL).
 *
 * FÖRSTA RADEN PER NYCKEL VINNER vid dubbletter. Paret ska vara unikt i basen
 * (`data-model.md` § Bilagornas datamodell: de sju Event×Typ-kombinationerna),
 * och att tyst låta en senare rad skriva över hade gjort utfallet beroende av
 * Airtables radordning — samma disciplin som `lasEvent`s `maxRecords: 1`.
 */
export function byggStandardpriser(
  eventinnehallRader: readonly AirtableRecord[],
  nycklar: ReadonlySet<string>,
): Map<string, number> {
  const standardpriser = new Map<string, number>();
  for (const rad of eventinnehallRader) {
    const nyckel = eventinnehallNyckel(
      selectName(rad.fields['Event']),
      selectName(rad.fields['Typ']),
    );
    if (nyckel === null || !nycklar.has(nyckel) || standardpriser.has(nyckel)) continue;
    const pris = scalarNumber(rad.fields['Pris (kr)']);
    if (pris !== null) standardpriser.set(nyckel, pris);
  }
  return standardpriser;
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
