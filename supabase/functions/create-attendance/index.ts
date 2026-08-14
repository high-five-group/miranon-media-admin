import {
  createAirtableRecord,
  fetchAirtableRecord,
  fetchFromAirtable,
} from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

// create-attendance — skapar en Deltaganden-rad atomärt när dörren möter en
// anmälan utan förskapad rad (TASK-214.1, PRD task-214). BACKUP-vägen för
// dörr-ögonblicket: rotorsaken (anmälningar utan Person-länk, "fälla 16/21"-
// klassen) läks i basen via task-213.12 — denna EF finns bara för att dörren
// aldrig ska säga nej.
//
// SÄKERHET: speglar create-event-note:s kontrakt (POST→405, requireUser→401,
// allowlist-SSOT via field-allowlists.ts, deny→400, {error}+requestId, central
// loggning) mot Deltaganden i stället för Anteckningar.
//
// IDEMPOTENT AV DESIGN (inte bara atomärt): innan en ny rad skapas kontrollerar
// EF:en om ANMÄLAN redan bär en Deltagande-rad för samma Session — om ja
// returneras den BEFINTLIGA raden (200) i stället för en dubblett (201). Detta
// skyddar mot en verklig produktionsrisk (dubbel-tryck vid dörren ska aldrig ge
// två Deltaganden-rader för samma person+session) och gör operationen säker att
// anropa upprepade gånger mot samma fixtur i test (ADR-060: testet är EF-only,
// ingen Airtable-token — se create-attendance.staging.test.ts filhuvud för hela
// resonemanget om varför idempotens ersätter sentinel+purge här).
//
// VIKTIGT, LIVE-VERIFIERAT (data-model.md §Kända fällor 23): Deltagandens EGNA
// `RECORD_ID({Anmälan})`-formelfält ("Anmälan (ID)") returnerar radens EGET
// record-ID, inte den länkade Anmälans — därför läses dubblett-kollen via
// ANMÄLANS "Deltaganden"-reverslänk (fldgKGmudjmdD6eQJ), samma
// record-ID-batch-mönster som get-attendance/get-registrations redan använder,
// ALDRIG via det trasiga formelfältet.
//
// Person-länken sätts ALDRIG av denna EF — den ägs av automationen A11 (samma
// avgränsning som set-attendance-status-operationen). 'Avstämt' skrivs ALDRIG —
// automationen A8 äger tidsstämpeln.

const OPERATION_KEY = 'create-attendance';
const DELTAGANDEN_TABLE = 'Deltaganden';
const ANMALNINGAR_TABLE = 'Anmälningar';
const EVENTPLANERING_TABLE = 'Eventplanering';

// Deltaganden.Session (fldBPZnsDL0bNIRHx) — de tre enda giltiga valen
// (data-model.md § Deltaganden write-fält, live-verifierat describe_table 2026-08-14).
const VALID_SESSIONS = ['Dag 1', 'Dag 2', 'Föreläsning'] as const;
type Session = (typeof VALID_SESSIONS)[number];

function isValidSession(value: unknown): value is Session {
  return typeof value === 'string' && (VALID_SESSIONS as readonly string[]).includes(value);
}

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface DeltagandeRecord {
  id: string;
  fields: Record<string, unknown>;
}

/**
 * Finns redan en Deltagande-rad för denna (anmalanId, session)-kombination?
 * Läser ANMÄLANS "Deltaganden"-reverslänk (aldrig Deltagandets egna trasiga
 * RECORD_ID({Anmälan})-formelfält, §Kända fällor 23) för att hitta kandidat-
 * ID:n, batch-hämtar dem via samma `OR(RECORD_ID()=…)`-mönster som
 * get-attendance/get-person redan använder (RECORD_ID() UTAN argument är INTE
 * den trasiga formen), och letar efter en rad vars Session matchar.
 */
async function findExistingAttendance(
  anmalanRecord: { fields: Record<string, unknown> },
  session: Session,
): Promise<DeltagandeRecord | null> {
  const linkedDeltagandeIds = Array.isArray(anmalanRecord.fields['Deltaganden'])
    ? (anmalanRecord.fields['Deltaganden'] as string[])
    : [];
  if (linkedDeltagandeIds.length === 0) return null;

  const filterByFormula = `OR(${linkedDeltagandeIds.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
  const candidates = await fetchFromAirtable(DELTAGANDEN_TABLE, { filterByFormula });
  return candidates.find((r) => r.fields['Session'] === session) ?? null;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const body = (await req.json()) as Record<string, unknown> | null;
    const anmalanId = body?.anmalanId;
    const eventId = body?.eventId;
    const session = body?.session;

    // Input-validering (deny-by-default), speglar create-event-note:s form.
    if (typeof anmalanId !== 'string' || !anmalanId.startsWith('rec')) {
      return badRequest('Invalid anmalanId format', corsHeaders);
    }
    if (typeof eventId !== 'string' || !eventId.startsWith('rec')) {
      return badRequest('Invalid eventId format', corsHeaders);
    }
    if (!isValidSession(session)) {
      return badRequest(`session must be one of: ${VALID_SESSIONS.join(', ')}`, corsHeaders);
    }

    // Allowlist-SSOT: hämta operationens tableId + allowedFields (defensiv null-väg).
    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
    }

    // Anmälan måste finnas — null = okänd anmälan → 404.
    const anmalanRecord = await fetchAirtableRecord(ANMALNINGAR_TABLE, anmalanId);
    if (!anmalanRecord) {
      return new Response(JSON.stringify({ error: 'Registration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Eventet måste finnas — null = okänt event → 404 (ärver get-event-kontraktet).
    const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
    if (!eventRecord) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // IDEMPOTENT-KOLL: redan en Deltagande-rad för denna anmälan+session?
    const existing = await findExistingAttendance(anmalanRecord, session);
    if (existing) {
      console.log(
        `[create-attendance] ALLOW idempotent (redan skapad) | caller_user_id=${user.id} | anmalanId=${anmalanId} | eventId=${eventId} | session=${session} | record=${existing.id}`,
      );
      return new Response(
        JSON.stringify({ record: { id: existing.id, fields: existing.fields }, created: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Bygg write-fält SERVER-SIDE (endast de fyra allowlistade). Status sätts
    // ALLTID till 'Närvarande' — det är hela skälet till att denna EF finns.
    const fields: Record<string, unknown> = {
      Anmälan: [anmalanId],
      Event: [eventId],
      Session: session,
      Status: 'Närvarande',
    };

    // SSOT-grind: varje server-byggt fält måste vara på operationens allowlist
    // (defense-in-depth mot framtida kod-drift; deny → 400).
    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[create-attendance] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      return badRequest(
        `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
        corsHeaders,
      );
    }

    console.log(
      `[create-attendance] ALLOW create | caller_user_id=${user.id} | anmalanId=${anmalanId} | eventId=${eventId} | session=${session}`,
    );

    const created = await createAirtableRecord(operation.tableId, fields);

    return new Response(
      JSON.stringify({ record: { id: created.id, fields: created.fields }, created: true }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'create-attendance',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
