// Bilagornas Eta-ifyllnadsdata (TASK-309.4, ADR-125 § Beslut 4). REN
// mappning + formatering — inget I/O, inget Deno-globalt, ingen Eta-import
// här. Node+Deno dual-importable (samma "mirror-kontraktet" som
// `_shared/receipt-content.ts` redan etablerat) SÅ ATT "ifyllnad"-halvan av
// AC #1:s enhetstest ("ifyllnad + escaping, api-pure, utan nätverk") kan
// köras direkt via `npm run test:api` utan Deno och utan nätverk.
//
// STANDARD/KOPIA-REGELN ÄGS HÄR, EN GÅNG (ADR-125 § 4: "EN renderare — samma
// fallback-regel FÅR inte tolkas på två ställen"): `valjKopia` är den ENDA
// platsen `kopia ?? standard` skrivs ut. `_shared/mall-render.ts` (Deno,
// esm.sh-Eta) importerar `byggBekraftelseData`/`byggDeltagarinfoData` och
// skickar resultatet rakt in i Eta — mallarna själva innehåller ingen
// fallback-logik, bara `<%= data.x %>`/`<% if (...) %>`.
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
        .filter((stycke) => stycke.length > 0);

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
