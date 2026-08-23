// @ts-nocheck — Deno Edge Function shared module (Deno-globaler via
// airtable-client.ts; typas vid deploy av `deno check`/`deno lint`, se
// ADR-010 § Fas 7-åtagande). Samma undantags-mönster som övriga
// _shared-filer som körs i Deno-runtimen.
//
// fetchDocumentSources — TASK-309.4, extraherad ur
// get-document-sources/index.ts (TASK-309.2 AC #4, ADR-125 § 2) så att
// BÅDA konsumenterna (den läsande EF:en OCH generate-event-attachment/
// index.ts, som behöver EXAKT samma underlag för att rendera en bilaga)
// delar EN läsväg i stället för att duplicera Airtable-uppslaget. ADR-125
// § Beslut 5 säger det uttryckligen: "extrahera läslogiken till _shared om
// den sitter i EF:en, så båda EF:erna delar den."
//
// BETEENDET ÄR OFÖRÄNDRAT mot get-document-sources/index.ts:s tidigare
// inline-kod — denna fil är en REN FLYTT, ingen omdesign. Se
// get-document-sources/index.ts för HTTP-lagret (auth, 400/404, JSON-svar)
// som nu bara anropar denna funktion.

import { fetchAirtableRecord, fetchFromAirtable } from './airtable-client.ts';
import { buildEqualsFilter, combineWithAnd } from './airtable-filter.ts';
import { EVENTPLANERING_TABLE } from './attachments.ts';
import { scalarString, selectName } from './coerce.ts';
// [TASK-309.4] `DocumentSourcesResult` bor i `_shared/mall-data.ts` (ren
// typkoll-teknisk anledning, se den filens docblock ovanför interfacet) —
// importerad TILLBAKA hit och re-exporterad så konsumenter av DENNA fil
// inte behöver veta var typen egentligen bor.
import type { DocumentSourcesResult } from './mall-data.ts';
export type { DocumentSourcesResult };

const EVENTINNEHALL_TABLE = 'Eventinnehåll';
const PLATSER_TABLE = 'Platser';
const AGENDAPUNKTER_TABLE = 'Agendapunkter';

// Eventplanerings omvända länkfält (auto-fött, ADR-125 § 2 "Agendapunkter
// (länk, auto-född spegel)") som bär eventets EGNA Agendapunkter-record-ID:n.
const EVENT_AGENDA_LINK_FIELD = 'Agendapunkter';
// Eventinnehålls omvända länkfält (auto-fött vid Agendapunkter.Eventinnehåll-
// skapelsen) som bär standardagendans Agendapunkter-record-ID:n.
const EVENTINNEHALL_AGENDA_LINK_FIELD = 'Agendapunkter';

const BILAGETEXT_SUFFIX = ' (bilagetext)';

type Fields = Record<string, unknown>;
type AirtableRow = { id: string; fields: Fields };

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Batch-hämta record-ID:n ur Agendapunkter (samma get-event-attachments-mall). */
async function fetchAgendapunkterByRecordIds(ids: readonly string[]): Promise<AirtableRow[]> {
  const out: AirtableRow[] = [];
  for (const idChunk of chunk(ids, 50)) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = (await fetchFromAirtable(AGENDAPUNKTER_TABLE, {
      filterByFormula,
      fields: ['Text', 'Dag', 'Ordning', 'Tid', 'Meditation'],
    })) as AirtableRow[];
    out.push(...records);
  }
  return out;
}

type AgendaRad = { text: string; tid: string; meditation: boolean };

/** Mappa + sortera (Ordning) + dela upp Agendapunkter-rader per dag (1/2). */
function splitAgendaByDag(rows: AirtableRow[]): { dag1: AgendaRad[]; dag2: AgendaRad[] } {
  const sorted = [...rows].sort((a, b) => {
    const oa = typeof a.fields['Ordning'] === 'number' ? (a.fields['Ordning'] as number) : 0;
    const ob = typeof b.fields['Ordning'] === 'number' ? (b.fields['Ordning'] as number) : 0;
    return oa - ob;
  });
  const toRad = (r: AirtableRow): AgendaRad => ({
    text: scalarString(r.fields['Text']) ?? '',
    tid: scalarString(r.fields['Tid']) ?? '',
    meditation: r.fields['Meditation'] === true,
  });
  return {
    dag1: sorted.filter((r) => r.fields['Dag'] === 1).map(toRad),
    dag2: sorted.filter((r) => r.fields['Dag'] === 2).map(toRad),
  };
}

/** Härledd sista betalningsdag: Startdatum − 14 dagar (ADR-125 § 2). Parsas
 *  som UTC-midnatt så subtraktionen är tidszons-oberoende; tomt Startdatum
 *  (bör aldrig inträffa — se create-fältet i data-model.md) ger tom sträng
 *  i stället för att kasta. */
function harledSistaBetalningsdag(startdatumIso: string | null): string {
  if (!startdatumIso) return '';
  const d = new Date(`${startdatumIso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() - 14);
  return d.toISOString().slice(0, 10);
}

/** { standard, kopia } — kopia null när tomt (ADR-125 beslut 1: "tomt
 *  kopia-fält = standarden gäller"). */
function standardKopia<T>(standard: T, kopiaRaw: string | null): { standard: T; kopia: T | null } {
  return { standard, kopia: (kopiaRaw as unknown as T) ?? null };
}

/**
 * Hämtar bilagornas fulla ifyllnadsunderlag för ETT event — SAMMA form
 * `get-document-sources/index.ts` tidigare byggde inline. `null` = eventet
 * finns inte (anroparen avgör själv 404-formuleringen).
 */
export async function fetchDocumentSources(eventId: string): Promise<DocumentSourcesResult | null> {
  // 1) Eventraden — single-get. null = eventet finns inte.
  const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
  if (!eventRecord) {
    return null;
  }
  const ef = eventRecord.fields;

  const eventSource = selectName(ef['Event (source)']);
  const typ = selectName(ef['Typ']);
  const startdatum = scalarString(ef['Startdatum']);

  // 2) Uppslaget Eventinnehåll (Event × Typ, ADR-125 § 2 — uppslag, inte
  //    länk). Körs bara om eventet faktiskt bär BÅDA nycklarna.
  const platsIds = Array.isArray(ef['Plats']) ? (ef['Plats'] as string[]) : [];
  const eventAgendaIds = Array.isArray(ef[EVENT_AGENDA_LINK_FIELD])
    ? (ef[EVENT_AGENDA_LINK_FIELD] as string[])
    : [];

  const [eventinnehallRows, platsRecord, eventAgendaRows] = await Promise.all([
    eventSource && typ
      ? (fetchFromAirtable(EVENTINNEHALL_TABLE, {
          filterByFormula: combineWithAnd([
            buildEqualsFilter('Event', eventSource),
            buildEqualsFilter('Typ', typ),
          ]),
          maxRecords: 1,
        }) as Promise<AirtableRow[]>)
      : Promise.resolve([]),
    platsIds.length > 0 ? fetchAirtableRecord(PLATSER_TABLE, platsIds[0]) : Promise.resolve(null),
    eventAgendaIds.length > 0 ? fetchAgendapunkterByRecordIds(eventAgendaIds) : Promise.resolve([]),
  ]);

  const eventinnehallRecord = eventinnehallRows[0] ?? null;
  const eif = eventinnehallRecord?.fields ?? {};
  const pf = platsRecord?.fields ?? {};

  // 3) Standardagendans Agendapunkter — via Eventinnehåll-radens omvända
  //    spegelfält (inga extra Airtable-anrop utöver ett record-ID-batch).
  const standardAgendaIds = Array.isArray(eif[EVENTINNEHALL_AGENDA_LINK_FIELD])
    ? (eif[EVENTINNEHALL_AGENDA_LINK_FIELD] as string[])
    : [];
  const standardAgendaRows =
    standardAgendaIds.length > 0 ? await fetchAgendapunkterByRecordIds(standardAgendaIds) : [];

  const standardAgenda = splitAgendaByDag(standardAgendaRows);
  // Eventets egen agenda-KOPIA är hela-agendan-eller-inget (ADR-125
  // beslut 7 — "aldrig tyst regenerering", samma "explicit val"-disciplin
  // tillämpad på vad "har en kopia" betyder): noll egna Agendapunkter-
  // rader ⇒ kopia null för BÅDA dagarna (standarden gäller helt); minst en
  // rad ⇒ kopia är den (möjligen dag-ojämna) mängden, aldrig null.
  const eventHarEgenAgenda = eventAgendaRows.length > 0;
  const eventAgenda = eventHarEgenAgenda ? splitAgendaByDag(eventAgendaRows) : null;

  const bilagetext = (basNamn: string): string | null =>
    scalarString(ef[`${basNamn}${BILAGETEXT_SUFFIX}`]);

  return {
    event: {
      id: eventRecord.id,
      eventNamn: eventSource,
      typ,
      ort: scalarString(ef['Ort']),
      startdatum,
      slutdatum: scalarString(ef['Slutdatum']),
      eventKey: typeof ef['EventKey'] === 'string' ? ef['EventKey'] : undefined,
      eventlabel: typeof ef['Eventlabel'] === 'string' ? ef['Eventlabel'] : eventRecord.id,
    },
    eventinnehall: eventinnehallRecord
      ? { id: eventinnehallRecord.id, namn: scalarString(eif['Namn']) ?? '' }
      : null,
    plats: platsRecord ? { id: platsRecord.id, namn: scalarString(pf['Namn']) ?? '' } : null,
    // Agenda-kopian är hela-agendan-eller-inget (se eventHarEgenAgenda
    // ovan) — EN delad "har kopia?"-boolean, inte per-fält null-
    // koalescering, så `standardKopia` (skalär-formen) inte passar här.
    agenda: {
      dag1: { standard: standardAgenda.dag1, kopia: eventAgenda ? eventAgenda.dag1 : null },
      dag2: { standard: standardAgenda.dag2, kopia: eventAgenda ? eventAgenda.dag2 : null },
    },
    kopior: {
      tid: standardKopia(scalarString(eif['Tid']), bilagetext('Tid')),
      pris: standardKopia(scalarString(eif['Pris']), bilagetext('Pris')),
      anmalningsavgift: standardKopia(
        scalarString(eif['Anmälningsavgift']),
        bilagetext('Anmälningsavgift'),
      ),
      resterandeBelopp: standardKopia(
        scalarString(eif['Resterande belopp']),
        bilagetext('Resterande belopp'),
      ),
      sistaBetalningsdag: {
        standard: harledSistaBetalningsdag(startdatum),
        kopia: scalarString(ef[`Sista betalningsdag${BILAGETEXT_SUFFIX}`]),
      },
      beskrivning: standardKopia(scalarString(eif['Beskrivning']), bilagetext('Beskrivning')),
      forberedelser: standardKopia(scalarString(eif['Förberedelser']), bilagetext('Förberedelser')),
      tagMed: standardKopia(scalarString(eif['Tag med']), bilagetext('Tag med')),
      rokning: standardKopia(scalarString(eif['För dig som röker']), bilagetext('För dig som röker')),
      parfym: standardKopia(
        scalarString(eif['Parfym och kosmetika']),
        bilagetext('Parfym och kosmetika'),
      ),
      mat: standardKopia(scalarString(eif['Mat/fika']), bilagetext('Mat/fika')),
      overnattning: standardKopia(scalarString(eif['Övernattning']), bilagetext('Övernattning')),
      utrustning: standardKopia(scalarString(eif['Utrustning']), bilagetext('Utrustning')),
      adress: standardKopia(scalarString(pf['Adress']), bilagetext('Adress')),
      parkering: standardKopia(scalarString(pf['Parkering']), bilagetext('Parkering')),
      transport: standardKopia(scalarString(pf['Transport']), bilagetext('Transport')),
      klader: standardKopia(scalarString(pf['Kläder']), bilagetext('Kläder')),
    },
  };
}
