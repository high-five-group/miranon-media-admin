import { fetchAirtableRecord, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// get-person-notes — personens anteckningar (Anteckningar-tabellen) per person
// (S103, T97-bygg-spåret; ADR-075-tabellen utökad med ett Person-länkfält).
// Speglar get-event-notes EXAKT (RECORD-ID-BATCH FRÅN PERSON-HÅLLET): hämtar
// person-raden, läser dess omvända länk och batch-hämtar de länkade Anteckningar-
// raderna via chunkad `OR(RECORD_ID()=…)`. ANVÄNDER MEDVETET INTE ett länkfält-
// filter på Anteckningar-tabellen — länkfilter matchar länkens primär-display,
// inte record-ID (T15-klass-bugg, samma skäl som get-event-notes). Record-ID =
// enda tillförlitliga nyckeln. LÄSER bara.
//
// INVARIANTEN (kritisk, se tests/api/notes-event-person-isolation.staging.test.ts):
// en Anteckningar-rad bär Event ELLER Person, aldrig båda. Den här funktionen kan
// STRUKTURELLT inte returnera en event-anteckning: den läser bara record-ID:n ur
// PERSONENS egen omvända länk (`Anteckningar 2`) — en rad som bara har Event satt
// dyker aldrig upp i den länken, oavsett innehåll i Anteckningar-tabellen.
//
// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas (ADR-050).

const PERSONER_TABLE = 'Personer';
const ANTECKNINGAR_TABLE = 'Anteckningar';

// ⚠️ Personens omvända länkfält heter 'Anteckningar 2' — INTE 'Anteckningar'.
// Airtable auto-namnger en omvänd länk efter käll-tabellen, men Personer bar
// REDAN ett fält kallat 'Anteckningar' (fldWGlNr3ujRHo85w, det gamla odelade
// fritext-fältet) — kollisionen löses av Airtable genom att döpa den NYA länken
// 'Anteckningar 2'. LIVE-VERIFIERAT 2026-08-10 (S103) via describe_table mot
// BÅDA baserna: staging fldgz1pFKGs0a3np0, prod fldkEnLpYjB9tsAtQ. Att anta
// namnet 'Anteckningar' hade tyst läst FEL fält (det gamla fritext-fältet är
// inte ens en länk-typ, så läsningen hade gett en tom lista, inte ett fel).
const NOTES_LINK_FIELD = 'Anteckningar 2';

// Fält att hämta ur Anteckningar (tidpunkten bärs av record.createdTime, inte ett fält).
const NOTE_FIELDS = ['Författare', 'Anteckning', 'Person'];

// Max record-ID:n per batch-anrop — samma gräns/motiv som get-event-notes.
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

/** Länkfält → första record-ID (samma form som get-event-notes/get-attendance). */
function firstLinkedId(value: unknown): string | null {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'string'
    ? value[0]
    : null;
}

/**
 * Mappar en Anteckningar-rad → domän-PersonNote. `forfattare` singleLineText
 * (skalär); `text` multilineText (skalär, deny-empty vid write ⇒ alltid en
 * sträng); `tidpunkt` ur `createdTime` (server-sanning); `personId` = första
 * Person-länken.
 */
function mapNote(record: AirtableRow) {
  const f = record.fields;
  return {
    id: record.id,
    forfattare: scalarString(f['Författare']),
    text: scalarString(f['Anteckning']) ?? '',
    tidpunkt: record.createdTime,
    personId: firstLinkedId(f['Person']),
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
  const personId = url.searchParams.get('personId');
  if (!personId) {
    return new Response(JSON.stringify({ error: 'Missing personId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1) Person-raden — ETT single-get. null = 404 (ärver get-person-kontraktet).
    const personRecord = await fetchAirtableRecord(PERSONER_TABLE, personId);
    if (!personRecord) {
      return new Response(JSON.stringify({ error: 'Person not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Personens Anteckningar-record-ID:n ur den omvända länken. Tom/saknad →
    //    tom lista (ej fel; en person utan anteckningar är ett giltigt tillstånd).
    const noteIds: string[] = Array.isArray(personRecord.fields[NOTES_LINK_FIELD])
      ? (personRecord.fields[NOTES_LINK_FIELD] as string[])
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
      function: 'get-person-notes',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
