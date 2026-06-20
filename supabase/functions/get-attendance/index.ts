import { buildLinkedRecordFilter } from '../_shared/airtable-filter.ts';
import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Tabeller adresseras per NAMN (ej tbl-id) så samma kod fungerar mot prod- och
// staging-bas — tbl-id:n är bas-unika och skiljer sig i en duplicerad bas (ADR-050).
const DELTAGANDEN_TABLE = 'Deltaganden';
const PERSONER_TABLE = 'Personer';

// Max person-ID:n per namn-batch-anrop. Speglar get-person:s HISTORY_BATCH_SIZE-
// mönster EXAKT: en chunk = en kort `OR(RECORD_ID()=…)`-formel (≤50 IDs ≈ ~1.5 kB,
// väl under Airtables formel-/URL-längd) → ETT listanrop per chunk (ej N+1). Ett
// event kan ha hundratals deltaganden men FÅ unika personer; vi dedupar person-
// ID:n FÖRE chunkningen → minimalt antal namn-anrop (ceil(unika/50)). NOLL
// trunkering.
//
// Env-override (`ATTENDANCE_NAME_BATCH_SIZE`) finns ENBART för conformance-
// testbarhet: staging sätter den lågt (=2) så att chunk-merge-vägen exerceras med
// en liten fixtur (bevisar noll-trunkering vid chunk-gräns). Prod sätter inte
// secreten → default 50 (oförändrat beteende). Ogiltigt/saknat värde → default.
function nameBatchSize(): number {
  const raw = Number.parseInt(Deno.env.get('ATTENDANCE_NAME_BATCH_SIZE') ?? '', 10);
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
 * Personer) bär person-record-ID:t — INTE lookup-fältet `Person` (som också ger
 * ID men semantiskt är en lookup-derivat). Session/Status är singleSelect →
 * selectName (namn-strängen matchar AttendanceSession/AttendanceStatus-enum:en).
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
  };
}

/**
 * get-attendance — närvaro (Deltaganden) per event (Fas 6b L3). FILTRERAD LISTA:
 * ärver get-registrations:s eventId-länkfält-filter (buildLinkedRecordFilter mot
 * Deltaganden.Event). LÄSER bara — ingen write/mutation (närvaro-markering är en
 * framtida slice med egna deny/allow-test).
 *
 * NAMN-BERIKNING (VÄGVAL A): Deltaganden bär bara person-record-ID:n; vyn behöver
 * läsbara namn (Gunilla-princip). get-attendance batch-hämtar Personer.Namn ur de
 * unika person-ID:na — speglar get-person:s chunk-merge-mall (env-justerbar
 * batch-storlek, ceil(unika/50) anrop, noll N+1, noll trunkering) och bygger en
 * Map<personId, namn> som fäster `personNamn` per rad. Personer.Namn är primärfält-
 * formeln `TRIM(Förnamn & " " & Efternamn)` (→ "Ej tillgängligt" för namnlös, alltid
 * en sträng) → graciös namnlös-hantering, master-källa.
 *
 * FEL-KONTRAKT: `{ error: <message> }` (klient-fel) — samma etablerade konvention
 * som get-registrations/get-event/auth.ts (400/401 → `{ error }`, 500 →
 * `{ error, requestId }`). Ingen 404: en lista (okänt/tomt event → tom lista, ej fel).
 *
 * ATOMICITET: Deltaganden-fetch + namn-batch är ICKE-atomär (records kan ändras
 * mellan anropen) — acceptabelt för en admin-läsvy, medvetet utan snapshot-
 * isolering (samma disciplin som get-person; Airtable-REST saknar transaktioner).
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

  // Bygg filterByFormula via parameteriserad builder (M5). Builders kastar vid
  // kontrolltecken / ogiltigt recordId-format / för långa strängar / Unicode-
  // bidi-overrides → 400 (klient-fel, inte server-fel). Servern loggar full detail
  // för audit; klient ser generic "Invalid filter input". Speglar get-registrations.
  let filterByFormula: string | undefined;
  try {
    filterByFormula = eventId ? buildLinkedRecordFilter('Event', eventId) : undefined;
  } catch (filterError) {
    console.warn(
      `[get-attendance] DENY invalid filter input: ${(filterError as Error).message}`,
    );
    return new Response(JSON.stringify({ error: 'Invalid filter input' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1) Deltaganden för eventet (fetchFromAirtable offset-vandrar → komplett
    //    oavsett antal sessioner/personer).
    const records = await fetchFromAirtable(DELTAGANDEN_TABLE, { filterByFormula });
    const attendance = records.map(mapAttendance);

    // 2) Namn-berikning: batch-hämta Personer.Namn ur de UNIKA person-ID:na.
    //    Hoppas helt om inga deltaganden bär en person-länk (inget onödigt anrop).
    const uniquePersonIds = [
      ...new Set(
        attendance.map((a) => a.personId).filter((id): id is string => id !== null),
      ),
    ];

    if (uniquePersonIds.length > 0) {
      const nameById = new Map<string, string | null>();
      for (const ids of chunk(uniquePersonIds, nameBatchSize())) {
        const formula = `OR(${ids.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
        const personRecords = await fetchFromAirtable(PERSONER_TABLE, {
          filterByFormula: formula,
          fields: ['Namn'],
        });
        for (const p of personRecords) {
          // Personer.Namn = formel → skalär sträng. scalarString (aldrig array-drop).
          nameById.set(p.id, scalarString(p.fields['Namn']));
        }
      }
      // Fäst namn per rad. Map-miss (person-ID utan träff, bör ej hända) → null.
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
