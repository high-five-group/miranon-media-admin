import { fetchAirtableRecord, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarNumber, scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
const EVENTPLANERING_TABLE = 'Eventplanering';
const DELTAGANDEN_TABLE = 'Deltaganden';
const PERSONER_TABLE = 'Personer';

// Fält att hämta ur Deltaganden för närvaro-vyn (ett urval → litet batch-svar).
// 'Person (länk)' bär person-record-ID:t (namn-batchas separat); 'Event'/'Anmälan'
// är länkar → ID; Session/Status singleSelect; Noteringar/Avstämt skalärer.
const ATTENDANCE_FIELDS = [
  'Session',
  'Status',
  'Noteringar',
  'Avstämt',
  'Person (länk)',
  'Event',
  'Anmälan',
  // Närvaropoäng (task-18.9, fldwuo94BY46VUOm4) — basens formel: 1 om Status ∈
  // {Närvarande, Deltog online}, annars 0. Närvaro-registret läser poängen RÅ ur
  // basen (aldrig klient-omräknad) så registrets % matchar rollup-kedjan exakt.
  'Närvaropoäng',
];

// Max record-ID:n per batch-anrop (gäller BÅDA batcharna: Deltaganden-ID:n och
// Person-ID:n). En chunk = en kort `OR(RECORD_ID()=…)`-formel (≤50 IDs ≈ ~1.5 kB,
// väl under Airtables formel-/URL-längd) → ETT listanrop per chunk (ej N+1).
// ceil(N/50) anrop, NOLL trunkering. Spegel av get-person:s HISTORY_BATCH_SIZE.
//
// Env-override (`ATTENDANCE_BATCH_SIZE`) finns ENBART för conformance-testbarhet:
// staging sätter den lågt (=2) så chunk-merge-vägen exerceras med en liten fixtur
// (bevisar noll-trunkering vid chunk-gräns). Prod sätter inte secreten → default 50.
function attendanceBatchSize(): number {
  const raw = Number.parseInt(Deno.env.get('ATTENDANCE_BATCH_SIZE') ?? '', 10);
  return Number.isInteger(raw) && raw > 0 ? raw : 50;
}

type Fields = Record<string, unknown>;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Länkfält → första record-ID (linked record → ID; samma form som get-registrations). */
function firstLinkedId(value: unknown): string | null {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'string'
    ? value[0]
    : null;
}

/**
 * Mappar en Deltaganden-rad → Attendance-form (utan namn; `personNamn` fästs av
 * callern ur namn-batchen). `Person (länk)` (fldiU06kbTxSafkm4, A11-satt länk →
 * Personer) bär person-record-ID:t. Session/Status är singleSelect → selectName
 * (namn-strängen matchar AttendanceSession/AttendanceStatus-enum:en).
 */
function mapAttendance(record: { id: string; fields: Fields }) {
  const f = record.fields;
  return {
    id: record.id,
    anmalanId: firstLinkedId(f['Anmälan']), // linked record → ID
    eventId: firstLinkedId(f['Event']), // linked record → ID
    personId: firstLinkedId(f['Person (länk)']), // A11-satt länk → Personer-ID
    personNamn: null as string | null, // fästs av namn-batchen nedan
    session: selectName(f['Session']), // singleSelect → enum-namn
    status: selectName(f['Status']), // singleSelect → enum-namn
    noteringar: scalarString(f['Noteringar']), // multilineText (skalär)
    avstamt: scalarString(f['Avstämt']), // dateTime (skalär ISO-sträng)
    narvaropoang: scalarNumber(f['Närvaropoäng']), // formel → 0/1 (poäng-mappningen rå ur basen)
  };
}

/** Batch-hämta record-ID:n ur en tabell via chunkad `OR(RECORD_ID()=…)` (get-person-mall). */
async function fetchByRecordIds(
  table: string,
  ids: readonly string[],
  fields: readonly string[] | undefined,
): Promise<{ id: string; fields: Fields }[]> {
  const out: { id: string; fields: Fields }[] = [];
  for (const idChunk of chunk(ids, attendanceBatchSize())) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = await fetchFromAirtable(
      table,
      fields ? { filterByFormula, fields: [...fields] } : { filterByFormula },
    );
    out.push(...records);
  }
  return out;
}

/**
 * get-attendance — närvaro (Deltaganden) per event (Fas 6b L3). RECORD-ID-BATCH
 * FRÅN EVENT-HÅLLET (speglar get-person:s historik-batch): hämtar eventraden,
 * läser dess `Närvaro (records)`-länk (Deltaganden-record-ID:n) och batch-hämtar
 * dem via chunkad `OR(RECORD_ID()=…)`. ANVÄNDER MEDVETET INTE
 * `buildLinkedRecordFilter` — den matchar länkens primär-display (eventlabel), inte
 * record-ID (T15-klass-bugg). Record-ID = enda tillförlitliga nyckeln (ingen
 * ARRAYJOIN-fälla, ingen label-formel-skörhet, ingen Eventkey-kollision). LÄSER bara.
 *
 * NAMN-BERIKNING (VÄGVAL A, oförändrad): Deltaganden bär bara person-record-ID:n;
 * vyn behöver läsbara namn (Gunilla-princip). Andra record-ID-batchen hämtar
 * Personer.Namn ur de unika person-ID:na → Map<personId,namn> fäster `personNamn`.
 * Personer.Namn = primärfält-formeln `TRIM(Förnamn & " " & Efternamn)` → "Ej
 * tillgängligt" graciöst för namnlös, alltid en sträng.
 *
 * FEL-KONTRAKT: `{ error }` (klient-fel) — samma konvention som get-event/get-person
 * (400/401/404 → `{ error }`, 500 → `{ error, requestId }`). 404 = okänt eventId
 * (ärver get-event-kontraktet); event utan `Närvaro (records)` → tom lista (ej fel).
 *
 * ATOMICITET: event-fetch + Deltaganden-batch + namn-batch är ICKE-atomär — acceptabelt
 * för en admin-läsvy, medvetet utan snapshot-isolering (samma disciplin som get-person).
 */
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

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
    // 1) Eventraden — ETT single-get. null = 404 (ärver get-event-kontraktet).
    const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
    if (!eventRecord) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Eventets Deltaganden-record-ID:n ur `Närvaro (records)`-länken. Tom/saknad
    //    → tom närvaro-lista (ej fel; event utan deltaganden är ett giltigt tillstånd).
    const deltagandeIds: string[] = Array.isArray(eventRecord.fields['Närvaro (records)'])
      ? (eventRecord.fields['Närvaro (records)'] as string[])
      : [];

    const attendance =
      deltagandeIds.length > 0
        ? (await fetchByRecordIds(DELTAGANDEN_TABLE, deltagandeIds, ATTENDANCE_FIELDS)).map(
            mapAttendance,
          )
        : [];

    // 3) Namn-berikning: andra record-ID-batchen, mot Personer ur unika person-ID:n.
    const uniquePersonIds = [
      ...new Set(attendance.map((a) => a.personId).filter((id): id is string => id !== null)),
    ];
    if (uniquePersonIds.length > 0) {
      const nameById = new Map<string, string | null>();
      for (const p of await fetchByRecordIds(PERSONER_TABLE, uniquePersonIds, ['Namn'])) {
        // Personer.Namn = formel → skalär sträng. scalarString (aldrig array-drop).
        nameById.set(p.id, scalarString(p.fields['Namn']));
      }
      for (const a of attendance) {
        a.personNamn = a.personId ? (nameById.get(a.personId) ?? null) : null;
      }
    }

    return new Response(JSON.stringify({ attendance }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-attendance',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
