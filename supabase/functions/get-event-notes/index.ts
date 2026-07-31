import { fetchAirtableRecord, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// get-event-notes — eventets anteckningar (Anteckningar-tabellen) per event
// (task-18.11, ADR-075). RECORD-ID-BATCH FRÅN EVENT-HÅLLET (speglar get-attendance):
// hämtar eventraden, läser dess omvända `Anteckningar`-länk (Anteckningar-record-ID:n)
// och batch-hämtar dem via chunkad `OR(RECORD_ID()=…)`. ANVÄNDER MEDVETET INTE ett
// länkfält-filter på Anteckningar-tabellen — länkfilter matchar länkens primär-display,
// inte record-ID (T15-klass-bugg). Record-ID = enda tillförlitliga nyckeln. LÄSER bara.
//
// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas (ADR-050).

const EVENTPLANERING_TABLE = 'Eventplanering';
const ANTECKNINGAR_TABLE = 'Anteckningar';

// Eventets omvända länkfält som bär Anteckningar-record-ID:n (auto-skapat när Event-
// länken lades på Anteckningar; live-verifierat namn 2026-07-23). Speglar
// get-attendance:s `Närvaro (records)`.
const NOTES_LINK_FIELD = 'Anteckningar';

// Fält att hämta ur Anteckningar (tidpunkten bärs av record.createdTime, inte ett fält).
const NOTE_FIELDS = ['Författare', 'Anteckning', 'Event'];

// Max record-ID:n per batch-anrop (kort `OR(RECORD_ID()=…)`-formel, ≤50 IDs väl under
// Airtables formel-/URL-längd) → ETT listanrop per chunk (ej N+1). Spegel av
// get-attendance:s batch-form; noteringar per event är få, men chunkas för robusthet.
const NOTES_BATCH_SIZE = 50;

type Fields = Record<string, unknown>;
type AirtableRow = { id: string; fields: Fields; createdTime: string };

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Länkfält → första record-ID (samma form som get-attendance/get-registrations). */
function firstLinkedId(value: unknown): string | null {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'string'
    ? value[0]
    : null;
}

/**
 * Mappar en Anteckningar-rad → domän-EventNote. `forfattare` singleLineText (skalär);
 * `text` multilineText (skalär, deny-empty vid write ⇒ alltid en sträng); `tidpunkt`
 * ur `createdTime` (server-sanning); `eventId` = första Event-länken.
 */
function mapNote(record: AirtableRow) {
  const f = record.fields;
  return {
    id: record.id,
    forfattare: scalarString(f['Författare']),
    text: scalarString(f['Anteckning']) ?? '',
    tidpunkt: record.createdTime,
    eventId: firstLinkedId(f['Event']),
  };
}

/** Batch-hämta record-ID:n ur Anteckningar via chunkad `OR(RECORD_ID()=…)`. */
async function fetchNotesByRecordIds(ids: readonly string[]): Promise<AirtableRow[]> {
  const out: AirtableRow[] = [];
  for (const idChunk of chunk(ids, NOTES_BATCH_SIZE)) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = (await fetchFromAirtable(ANTECKNINGAR_TABLE, {
      filterByFormula,
      fields: NOTE_FIELDS,
    })) as AirtableRow[];
    out.push(...records);
  }
  return out;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use GET.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Missing eventId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1) Eventraden — ETT single-get. null = 404 (ärver get-event/get-attendance-kontraktet).
    const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
    if (!eventRecord) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Eventets Anteckningar-record-ID:n ur den omvända länken. Tom/saknad → tom
    //    lista (ej fel; ett event utan anteckningar är ett giltigt tillstånd).
    const noteIds: string[] = Array.isArray(eventRecord.fields[NOTES_LINK_FIELD])
      ? (eventRecord.fields[NOTES_LINK_FIELD] as string[])
      : [];

    const notes = noteIds.length > 0 ? (await fetchNotesByRecordIds(noteIds)).map(mapNote) : [];

    // 3) Nyast först — CRM-notes-ordningen (composer överst, nyast först). createdTime
    //    är ISO → lexikografisk sortering == kronologisk.
    notes.sort((a, b) => (a.tidpunkt < b.tidpunkt ? 1 : a.tidpunkt > b.tidpunkt ? -1 : 0));

    return new Response(JSON.stringify({ notes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-event-notes',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
