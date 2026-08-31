// Bilagornas Eta-ifyllnadsdata (TASK-309.4, ADR-125 § Beslut 4). REN
// mappning + formatering — inget I/O, inget Deno-globalt, ingen Eta-import
// här. Node+Deno dual-importable (samma "mirror-kontraktet" som
// `_shared/receipt-content.ts` redan etablerat) SÅ ATT "ifyllnad"-halvan av
// AC #1:s enhetstest ("ifyllnad + escaping, api-pure, utan nätverk") kan
// köras direkt via `npm run test:api` utan Deno och utan nätverk.
//
// STANDARD/KOPIA-REGELN ÄGS HÄR, EN GÅNG (ADR-125 § 4: "EN renderare — samma
// fallback-regel FÅR inte tolkas på två ställen"): `valjKopia` är den ENDA
// platsen `kopia ?? standard` skrivs ut. Anroparen (`generate-event-
// attachment/index.ts`) importerar `byggBekraftelseData`/
// `byggDeltagarinfoData` HÄRIFRÅN och `renderaMallPdf` separat ur
// `_shared/mall-render.ts` (mall-render.ts importerar INTE denna fil —
// rättat 2026-08-23, TASK-309.5: raden påstod tidigare att mall-render.ts
// gjorde importen självt) — anroparen skickar resultatet rakt in i
// `renderaMallPdf`, som i sin tur ger det till Eta. Mallarna själva
// innehåller ingen fallback-logik, bara `<%= data.x %>`/`<% if (...) %>`.
//
// [TASK-309.5] `byggKvittoData` (nedan, sist i filen) hör till en TREDJE,
// STRUKTURELLT ANNORLUNDA mall: dess indata är `KvittoradSpec`
// (`_shared/receipt-content.ts` — kvittonummer/belopp/betalsätt m.fl.,
// Lotta-inmatat vid sändningstillfället), INTE `DocumentSourcesResult`
// (Airtable-härlett eventinnehåll). Samma fil ändå (uppdragets val,
// ADR-125 § Beslut 4) — alla tre `bygg*Data`-funktionerna är "REN
// Eta-ifyllnadsdata, ingen Eta-import här"-familjen, bara med olika
// källformer.
//
// DATUMFORMATERING ÄR HANDROLLAD, INTE `Intl.DateTimeFormat`:
// `generate-event-attachment/index.ts`s tidigare `formatSvenskDatum` (rivet
// i denna skiva, se filens historik) valde SAMMA väg av samma skäl — ingen
// bekräftad `sv-SE`-ICU-täckning är mätt i Supabase Edge Runtime, och en
// hårdkodad månadsnamn-tabell är billigare att verifiera än att lita på
// plattformens locale-data.
//
// KÄND, MEDVETEN FÖRENKLING (bokförd, inte tyst): veckodagsnamn
// ("lördag-söndag den …", `docs/mallar/bilagor/fixtures/*.exempel.json`s
// gamla granskningsprosa) återges INTE — datumspannet blir "14-15 november
// 2026" utan veckodag. Inget AC i TASK-309.4 provar exakt prosa (AC #4
// mäter sökbar text + inbäddat typsnitt, inte ordalydelse); exakt
// prosa-fidelity mot den 17-varvs-konvergerade förlagan är en
// visuell-QA-fråga för promoverings-skivorna (TASK-309.7/.8), inte denna
// skivas AC.

// [TASK-309.5] Kvitto-halvans byggsten — `receipt-content.ts` är SJÄLV
// Node+Deno dual-importable, noll Deno-globaler (dess eget filhuvud), så
// importen bryter inte denna fils egen dual-import-kontrakt. `Betalning`/
// `Betalsatt` dras in TRANSITIVT via `KvittoradSpec` (en `import type` i
// receipt-content.ts, erad av TypeScript — se receipt-content.ts:s eget
// filhuvud för den fulla motiveringen).
import {
  beraknaMoms,
  formatBelopp,
  formatBetalningsdatum,
  formatKvittoDatum,
  kvittoBenamning,
  kvittoHanvisning,
  type KvittoradSpec,
  kvittoRubrik,
  MIRANON_ORG,
} from './receipt-content.ts';
import { fetMarkera } from './fet-markering.ts';

/**
 * `DocumentSourcesResult` — den fulla ifyllnadsunderlags-formen
 * `get-document-sources`/`generate-event-attachment` delar
 * (`_shared/document-sources.ts`s `fetchDocumentSources`).
 *
 * [TASK-309.4] DEFINIERAD HÄR, INTE I `document-sources.ts` (typens
 * "naturliga" hem) — och `document-sources.ts` importerar typen TILLBAKA
 * (`import type { DocumentSourcesResult } from './mall-data.ts'`). Skälet
 * är rent typkoll-tekniskt, inte semantiskt: `document-sources.ts` rör
 * Deno transitivt (`airtable-client.ts`s `Deno.env.get`, INGEN
 * `@ts-nocheck`-svit där) — hade DENNA fil (som MÅSTE vara Node-tsc-
 * körbar, se filhuvudets mirror-kontrakt) importerat typen FRÅN
 * `document-sources.ts`, hade `tsc -b` för `tests/api/mall-data.test.ts`
 * dragit in HELA den Deno-rörande grafen transitivt och fällt med
 * TS2304 ("Cannot find name 'Deno'") — mätt skarpt under denna skivas
 * bygge (samma felklass `tsconfig.edge-shared.json`s filhuvud dokumenterar
 * för `segment-resolution.ts`). Ägarskapet vänt löser det: en `import
 * type` FRÅN en `@ts-nocheck`-Deno-fil är ofarlig (den filen typchecka
 * aldrig ändå), en `import type` FRÅN en Node-tsc-körbar fil till en
 * Deno-fil är också ofarlig eftersom `document-sources.ts` aldrig ingår i
 * något strikt tsc-projekt.
 */
export interface DocumentSourcesResult {
  event: {
    id: string;
    eventNamn: string | null;
    typ: string | null;
    ort: string | null;
    startdatum: string | null;
    slutdatum: string | null;
    eventKey?: string;
    eventlabel: string;
  };
  eventinnehall: { id: string; namn: string } | null;
  plats: { id: string; namn: string } | null;
  agenda: {
    dag1: { standard: AgendaPunktData[]; kopia: AgendaPunktData[] | null };
    dag2: { standard: AgendaPunktData[]; kopia: AgendaPunktData[] | null };
  };
  kopior: {
    tid: { standard: string | null; kopia: string | null };
    pris: { standard: string | null; kopia: string | null };
    anmalningsavgift: { standard: string | null; kopia: string | null };
    resterandeBelopp: { standard: string | null; kopia: string | null };
    sistaBetalningsdag: { standard: string; kopia: string | null };
    beskrivning: { standard: string | null; kopia: string | null };
    forberedelser: { standard: string | null; kopia: string | null };
    tagMed: { standard: string | null; kopia: string | null };
    rokning: { standard: string | null; kopia: string | null };
    parfym: { standard: string | null; kopia: string | null };
    mat: { standard: string | null; kopia: string | null };
    overnattning: { standard: string | null; kopia: string | null };
    utrustning: { standard: string | null; kopia: string | null };
    adress: { standard: string | null; kopia: string | null };
    parkering: { standard: string | null; kopia: string | null };
    transport: { standard: string | null; kopia: string | null };
    klader: { standard: string | null; kopia: string | null };
  };
}

const MANADSNAMN = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

/** ISO-datum ("2026-10-31") → "31 oktober 2026". Ogiltig/saknad input → null. */
export function formatSvenskDatum(iso: string | null | undefined): string | null {
  if (typeof iso !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const [, year, monthStr, dayStr] = match;
  const monthIdx = Number(monthStr) - 1;
  const manad = MANADSNAMN[monthIdx];
  if (!manad) return null;
  return `${Number(dayStr)} ${manad} ${year}`;
}

/**
 * Datumspann, svensk prosa: samma dag → "31 oktober 2026"; samma
 * år+månad → "14-15 november 2026" (bara slutdagen upprepas inte
 * månad/år); i övrigt → "31 oktober 2026 - 1 november 2026". Tomt/ogiltigt
 * start → tom sträng (anroparen avgör om det är ett fel).
 */
export function formatSvenskDatumspann(
  startIso: string | null | undefined,
  slutIso: string | null | undefined,
): string {
  const startMatch = typeof startIso === 'string' ? /^(\d{4})-(\d{2})-(\d{2})/.exec(startIso) : null;
  if (!startMatch) return '';
  const start = formatSvenskDatum(startIso);
  if (!start) return '';
  if (!slutIso || slutIso === startIso) return start;

  const slutMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(slutIso);
  if (!slutMatch) return start;
  const [, sAr, sManad, sDag] = startMatch;
  const [, eAr, eManad, eDag] = slutMatch;
  const manadNamn = MANADSNAMN[Number(eManad) - 1];
  if (sAr === eAr && sManad === eManad && manadNamn) {
    return `${Number(sDag)}-${Number(eDag)} ${manadNamn} ${eAr}`;
  }
  const slut = formatSvenskDatum(slutIso);
  return slut ? `${start} - ${slut}` : start;
}

/** `kopia ?? standard` — DEN ENDA platsen fallback-regeln skrivs (se filhuvudet). */
export function valjKopia<T>(pair: { standard: T; kopia: T | null }): T {
  return pair.kopia ?? pair.standard;
}

/** Sant när strängen är null, undefined eller (efter trim) tom. */
function tomt(varde: string | null | undefined): boolean {
  return varde === null || varde === undefined || varde.trim().length === 0;
}

export interface AgendaPunktData {
  text: string;
  tid: string;
  meditation: boolean;
}

export interface BekraftelseMallData {
  kursnamn: string;
  datumTid: string;
  plats: string;
  pris: string;
  anmalningsavgift: string;
  visaResterande: boolean;
  resterandeBelopp: string;
  sistaBetalningsdatum: string;
  beskrivning: string[];
  dagEttAgenda: AgendaPunktData[];
  dagTvaAgenda: AgendaPunktData[];
}

export interface DeltagarinfoMallData {
  kursnamn: string;
  datumTid: string;
  plats: string;
  forberedelser: string | null;
  klader: string | null;
  tagMed: string | null;
  rokning: string | null;
  parfym: string | null;
  mat: string | null;
  overnattning: string | null;
  parkering: string | null;
  transport: string | null;
  utrustning: string | null;
}

/** "Uttringe Hages väg 17, Rönninge" (adress + platsnamn) eller bara
 *  platsnamnet när ingen adress är satt — se fixturen
 *  `docs/mallar/bilagor/fixtures/bekraftelsebilaga.exempel.json`s
 *  `"plats"`-fält för facit-formen. */
function byggPlatsText(sources: DocumentSourcesResult): string {
  const platsNamn = sources.plats?.namn ?? '';
  const adress = valjKopia(sources.kopior.adress);
  if (adress && !tomt(adress)) {
    return platsNamn ? `${adress}, ${platsNamn}` : adress;
  }
  return platsNamn;
}

/** Datumspannet plus den fria "Tid"-texten ("kl. 10:00 - 17:00"), om satt. */
function byggDatumTidText(sources: DocumentSourcesResult): string {
  const spann = formatSvenskDatumspann(sources.event.startdatum, sources.event.slutdatum);
  const tid = valjKopia(sources.kopior.tid);
  if (tid && !tomt(tid)) {
    return spann ? `${spann}, ${tid}` : tid;
  }
  return spann;
}

function byggAgendaData(rows: readonly { text: string; tid: string; meditation: boolean }[]): AgendaPunktData[] {
  return rows.map((r) => ({ text: r.text, tid: r.tid, meditation: r.meditation }));
}

export function byggBekraftelseData(sources: DocumentSourcesResult): BekraftelseMallData {
  const resterandeBelopp = valjKopia(sources.kopior.resterandeBelopp);
  const sistaBetalningsdagIso = valjKopia(sources.kopior.sistaBetalningsdag);
  const sistaBetalningsdatum = formatSvenskDatum(sistaBetalningsdagIso) ?? '';
  const visaResterande = !tomt(resterandeBelopp) && sistaBetalningsdatum.length > 0;

  const beskrivningRaw = valjKopia(sources.kopior.beskrivning);
  const beskrivning = tomt(beskrivningRaw)
    ? []
    : (beskrivningRaw as string)
        .split(/\n{2,}/)
        .map((stycke) => stycke.trim())
        .filter((stycke) => stycke.length > 0)
        // Escapar OCH konverterar **fet** — se fet-markering.ts. Utdatan är
        // därför färdig HTML och renderas med `<%~ %>` i mallen, till skillnad
        // från alla andra fält.
        .map(fetMarkera);

  const dagEttRows = sources.agenda.dag1.kopia ?? sources.agenda.dag1.standard;
  const dagTvaRows = sources.agenda.dag2.kopia ?? sources.agenda.dag2.standard;

  return {
    kursnamn: sources.event.eventNamn ?? '',
    datumTid: byggDatumTidText(sources),
    plats: byggPlatsText(sources),
    pris: valjKopia(sources.kopior.pris) ?? '',
    anmalningsavgift: valjKopia(sources.kopior.anmalningsavgift) ?? '',
    visaResterande,
    resterandeBelopp: resterandeBelopp ?? '',
    sistaBetalningsdatum,
    beskrivning,
    dagEttAgenda: byggAgendaData(dagEttRows),
    dagTvaAgenda: byggAgendaData(dagTvaRows),
  };
}

export function byggDeltagarinfoData(sources: DocumentSourcesResult): DeltagarinfoMallData {
  const block = (pair: { standard: string | null; kopia: string | null }): string | null => {
    const varde = valjKopia(pair);
    return tomt(varde) ? null : varde;
  };

  return {
    kursnamn: sources.event.eventNamn ?? '',
    datumTid: byggDatumTidText(sources),
    plats: byggPlatsText(sources),
    forberedelser: block(sources.kopior.forberedelser),
    klader: block(sources.kopior.klader),
    tagMed: block(sources.kopior.tagMed),
    rokning: block(sources.kopior.rokning),
    parfym: block(sources.kopior.parfym),
    mat: block(sources.kopior.mat),
    overnattning: block(sources.kopior.overnattning),
    parkering: block(sources.kopior.parkering),
    transport: block(sources.kopior.transport),
    utrustning: block(sources.kopior.utrustning),
  };
}

/**
 * [TASK-309.5, ADR-125 § Beslut 4-5] `kvitto.html`s Eta-`data`-form — se
 * filhuvudets not om varför indatan är `KvittoradSpec`
 * (`_shared/receipt-content.ts`), inte `DocumentSourcesResult`. Varje fält
 * här är EXAKT tokenytan i `docs/mallar/bilagor/kvitto.html` (se den
 * mallens filhuvud + README.md § "Kvittots dynamiska yta" för käll-
 * tabellen) — lägg ALDRIG till ett fält här utan en motsvarande
 * `<%= data.x %>` i mallen (samma "1:1"-krav § Beslut 4 redan ställer för
 * de två andra mallarna).
 *
 * [TASK-346.5] `betalningsdatum` TILLKOM här — kortets AC #1 pekar bara ut
 * `kvitto.html`/`kvitto.css`/`receipt-content.ts` som rörda filer, men
 * tokenet måste igenom DENNA byggsten för att nå mallen (samma väg som
 * varje annat fält ovan). Bokfört öppet i slutrapporten, inte tyst utökat
 * scope.
 *
 * [TASK-346.5, förberedd för 346.9, AC #5] `rubrik`/`hanvisning` TILLKOM
 * också — kreditkvittots mallvariant förberedd som TOKEN, inte aktiverad.
 * BÅDA fälten är, liksom alla andra här, ALLTID en `string` (aldrig
 * `null`/`undefined`) — `hanvisning` är TOM STRÄNG när ingen hänvisning
 * finns, se `kvitto.html`s villkorade block (`<% if (data.hanvisning) %>`,
 * det ENDA villkoret i annars flat-substitution-mallen).
 */
export interface KvittoMallData {
  kvittonummer: string;
  datum: string;
  /** [TASK-346.5] "Betalningsdatum"-raden — `formatBetalningsdatum(spec.betalningsdatum)`, `-` när okänt. */
  betalningsdatum: string;
  orgReferens: string;
  kundnamn: string;
  kundEpost: string;
  /** [TASK-346.5, förberedd för 346.9] "Kvitto" eller "Kreditkvitto" — `kvittoRubrik(spec.typ)`. */
  rubrik: string;
  benamning: string;
  netto: string;
  moms: string;
  brutto: string;
  orgNamn: string;
  orgGatuadress: string;
  orgPostadress: string;
  orgLand: string;
  orgNummer: string;
  orgMomsregnummer: string;
  /** [TASK-346.5, förberedd för 346.9] "Kvitto <nummer>" eller `''` — `kvittoHanvisning(spec.hanvisningTillKvittonummer)`. */
  hanvisning: string;
}

/**
 * Bygger kvittots Eta-ifyllnadsdata. REN funktion av `spec` — ÅTERANVÄNDER
 * `receipt-content.ts`s redan enhetstestade primitiv
 * (`beraknaMoms`/`formatBelopp`/`formatKvittoDatum`/`kvittoBenamning`/
 * `MIRANON_ORG`) i stället för att duplicera formateringslogiken. Detta är
 * INTE `kvittoRader()` (samma fil) omskrivet till ett objekt — `kvittoRader`
 * formaterar en TEXTRAD-LISTA (mailtext-formen); denna funktion bygger en
 * STRUKTURERAD form för Eta-mallen. De två delar samma underliggande tal
 * (moms/netto/kvittonummer/…) men är olika KONSUMENTER av samma primitiv,
 * se `receipt-content.ts`s eget filhuvud för den fulla ägarskaps-
 * uppdelningen efter TASK-309.5.
 */
export function byggKvittoData(spec: KvittoradSpec): KvittoMallData {
  const { moms, netto } = beraknaMoms(spec.belopp);
  return {
    kvittonummer: spec.kvittonummer,
    datum: formatKvittoDatum(spec.datum),
    betalningsdatum: formatBetalningsdatum(spec.betalningsdatum),
    orgReferens: MIRANON_ORG.varReferens,
    kundnamn: spec.kundnamn,
    kundEpost: spec.kundEpost,
    rubrik: kvittoRubrik(spec.typ),
    benamning: kvittoBenamning(spec),
    netto: formatBelopp(netto),
    moms: formatBelopp(moms),
    brutto: formatBelopp(spec.belopp),
    orgNamn: MIRANON_ORG.namn,
    orgGatuadress: MIRANON_ORG.gatuadress,
    orgPostadress: MIRANON_ORG.postadress,
    orgLand: MIRANON_ORG.land,
    orgNummer: MIRANON_ORG.orgnummer,
    orgMomsregnummer: MIRANON_ORG.momsregnummer,
    hanvisning: kvittoHanvisning(spec.hanvisningTillKvittonummer),
  };
}
