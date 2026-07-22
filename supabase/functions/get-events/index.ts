import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarNumber, scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
const TABLE_NAME = 'Eventplanering';
const REGISTRATIONS_TABLE = 'Anmälningar';

// Max record-ID:n per batch-anrop — en chunk = en kort `OR(RECORD_ID()=…)`-formel
// (≤50 IDs, väl under Airtables formel-/URL-längd) → ETT listanrop per chunk (ej
// N+1), ceil(N/50) anrop, NOLL trunkering. Samma mall som get-event/
// get-registrations (medveten duplicering — EF:er delar kod endast via _shared;
// extraktion hör till en egen refaktor-landning).
const BATCH_SIZE = 50;

type Fields = Record<string, unknown>;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Länk-fältets record-ID-array ur eventraden (frånvarande/ickearray → tom). */
function linkedIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** Batch-hämta record-ID:n ur en tabell via chunkad `OR(RECORD_ID()=…)` (get-event-mall). */
async function fetchByRecordIds(
  table: string,
  ids: readonly string[],
  fields: readonly string[],
): Promise<{ id: string; fields: Fields }[]> {
  const out: { id: string; fields: Fields }[] = [];
  for (const idChunk of chunk(ids, BATCH_SIZE)) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = await fetchFromAirtable(table, { filterByFormula, fields: [...fields] });
    out.push(...records);
  }
  return out;
}

/**
 * Bor över-summeringen PER EVENT (task-17.5, PRD task-18 beslut 8 / task-17
 * story 9): HÄRLEDD räkning av ikryssade 'Bor över' bland varje events länkade
 * Anmälningar — listkortets säng-rad läser den. Inget lagrat räknefält (ADR-063:
 * härleds ALLTID ur kryssen; fältet fött task-18.7).
 *
 * Alla events länk-ID:n samlas EN gång och batch-hämtas chunkat (get-event:s
 * fetchBelaggning-mönster, lyft till list-nivå) — ceil(N/50) anrop för HELA
 * listan, ej per event (aldrig N+1). Checkbox: Airtable UTELÄMNAR en okryssad
 * ruta → `=== true` normaliserar (aldrig null; samma mappning som
 * get-registrations). Saknar basen fältet (t.ex. prod före den separat
 * auktoriserade fält-deployen) → utelämnat → 0, aldrig fel.
 */
async function fetchBorOverAntalByEvent(
  records: readonly { id: string; fields: Fields }[],
): Promise<Map<string, number>> {
  const idsByEvent = new Map<string, string[]>();
  const allRegIds = new Set<string>();
  for (const record of records) {
    const ids = linkedIds(record.fields['Anmälningar (länkat fält)']);
    idsByEvent.set(record.id, ids);
    for (const id of ids) allRegIds.add(id);
  }

  const regs =
    allRegIds.size > 0
      ? await fetchByRecordIds(REGISTRATIONS_TABLE, [...allRegIds], ['Bor över'])
      : [];
  const borOverById = new Map<string, boolean>();
  for (const reg of regs) borOverById.set(reg.id, reg.fields['Bor över'] === true);

  const result = new Map<string, number>();
  for (const [eventId, ids] of idsByEvent) {
    let antal = 0;
    for (const id of ids) if (borOverById.get(id) === true) antal += 1;
    result.set(eventId, antal);
  }
  return result;
}

// Fältnamn från Airtable → ren API-respons (kanonisk coercion ur _shared/coerce).
function mapEvent(record: { id: string; fields: Record<string, unknown> }, borOverAntal: number) {
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
    // coercar det till null så .parse() håller (konsekvent över get-event/get-events).
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
    // eventKey (task-18.1): formel "Event-" & {Event-nr}. Håll i synk med get-event —
    // saknas värdet UTELÄMNAS nyckeln (JSON.stringify droppar undefined; aldrig
    // null — fältet är OPTIONAL i EventSchema, så z.array-parsen håller ändå);
    // båda EF:erna bär fältet sedan samma leverans.
    eventKey: typeof f['EventKey'] === 'string' ? f['EventKey'] : undefined,
    // Bor över-summeringen (task-17.5): härlett antal ikryssade 'Bor över' bland
    // eventets länkade Anmälningar (listkortets säng-rad). Aggregeras per event ur
    // registrerings-batchen (fetchBorOverAntalByEvent) och skickas in här. Håll i
    // synk med get-event mapEvent (samma härledning).
    borOverAntal,
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const records = await fetchFromAirtable(TABLE_NAME);
    // Bor över-summeringen (task-17.5): EN batch-läsning av alla events länkade
    // Anmälningar → antal ikryssade 'Bor över' per event (aldrig N+1).
    const borOverByEvent = await fetchBorOverAntalByEvent(records);
    const events = records.map((record) => mapEvent(record, borOverByEvent.get(record.id) ?? 0));

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-events',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
