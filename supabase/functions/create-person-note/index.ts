import { createAirtableRecord, fetchAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

// create-person-note — skapar en anteckning i personens ström (S103, T97-bygg-
// spåret). Skriv-kärnan speglar create-event-note EXAKT (samma tabell, samma
// server-side-attribution) — enda skillnaden är Person i stället för Event.
//
// ATTRIBUTIONEN ÄR ADR-075:s KÄRNA (ärvd oförändrad): FÖRFATTAREN sätts SERVER-
// SIDE ur den inloggade användarens VERIFIERADE identitet (requireUser har redan
// verifierat JWT:ns signatur; vi läser dess `user_metadata.display_name`-claim,
// fallback e-post/user-id). Klienten skickar ALDRIG författaren.
//
// FÄLT-SHAPE byggs SERVER-SIDE ur typad input (`text`) + härledd `forfattare` +
// Person-länken. Skrivbara fält ENDAST per allowlisten (Författare/Anteckning/
// Person); tidpunkten sätts av Airtables createdTime (aldrig ett skrivet fält).
//
// INVARIANTEN (kritisk, testad i tests/api/notes-event-person-isolation.staging.
// test.ts): en Anteckningar-rad bär Event ELLER Person, aldrig båda. Denna EF
// sätter STRUKTURELLT bara `Person` i `fields` — `Event` nämns aldrig, så en
// person-anteckning kan aldrig av misstag dyka upp i ett events omvända länk.
//
// INGEN idempotensnyckel: samma motivering som create-event-note (en anteckning
// saknar affärs-unikhet; klient-sidans dubbel-submit-skydd bär interimet).

const OPERATION_KEY = 'create-person-note';
const PERSONER_TABLE = 'Personer';

// Samma tak som create-event-note (en anteckning är minnesstöd, inte ett dokument).
const MAX_TEXT_LENGTH = 5000;

/**
 * Läser `user_metadata.display_name` ur den REDAN VERIFIERADE JWT:ns payload —
 * IDENTISK kopia av create-event-note:s helper (ADR-026 ≥3-tröskel för _shared-
 * extraktion; två callsites håller sig under den). Base64url + UTF-8-säker
 * avkodning (svenska namn manglas aldrig — Gunilla-principen).
 */
function readDisplayNameFromJwt(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const parts = authHeader.slice('Bearer '.length).trim().split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as {
      user_metadata?: { display_name?: unknown };
    };
    const raw = claims.user_metadata?.display_name;
    return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Mappar en skapad Anteckningar-rad → domän-PersonNote (samma shape som
 * get-person-notes' mapNote → klienten ser ALDRIG Airtable-fältnamn;
 * `PersonNoteSchema.parse()` validerar i adaptern, ADR-026). Lokalt definierad
 * (ADR-026 ≥3-tröskel — endast denna + get-person-notes).
 */
function mapCreatedNote(record: { id: string; fields: Record<string, unknown>; createdTime: string }) {
  const f = record.fields;
  return {
    id: record.id,
    forfattare: scalarString(f['Författare']), // singleLineText
    text: scalarString(f['Anteckning']) ?? '', // multilineText (deny-empty vid write ⇒ alltid satt)
    tidpunkt: record.createdTime, // Airtable createdTime (ISO)
    personId: Array.isArray(f['Person']) ? (f['Person'][0] as string) : null, // linked record → first ID
  };
}

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

  const authHeader = req.headers.get('Authorization');
  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const body = (await req.json()) as Record<string, unknown> | null;
    const personId = body?.personId;
    const text = body?.text;

    // Input-validering (deny-by-default). text: icke-tom sträng under taket.
    if (typeof text !== 'string' || !text.trim()) {
      return badRequest('text is required (non-empty string)', corsHeaders);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return badRequest(`text exceeds ${MAX_TEXT_LENGTH} characters`, corsHeaders);
    }
    // personId: Airtable-recordId-format (speglar create-event-note:s rec-prefix-grind).
    if (typeof personId !== 'string' || !personId.startsWith('rec')) {
      return badRequest('Invalid personId format', corsHeaders);
    }

    // Allowlist-SSOT: hämta operationens tableId + allowedFields (defensiv null-väg).
    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
    }

    // Person-raden måste finnas — null = okänd person → 404 (ärver get-person-kontraktet).
    const personRecord = await fetchAirtableRecord(PERSONER_TABLE, personId);
    if (!personRecord) {
      return new Response(JSON.stringify({ error: 'Person not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // FÖRFATTAREN härleds SERVER-SIDE ur den verifierade identiteten (ADR-075).
    const forfattare = readDisplayNameFromJwt(authHeader) ?? user.email ?? user.id;

    // Bygg write-fält SERVER-SIDE (endast de tre allowlistade; createdTime sätts av
    // Airtable). `Event` sätts ALDRIG — det är invariantens mekaniska garanti.
    const fields: Record<string, unknown> = {
      Författare: forfattare,
      Anteckning: text.trim(),
      Person: [personId], // länk-fältets NAMN är 'Person' (fldXvBRt7OE9tem4o staging)
    };

    // SSOT-grind: varje server-byggt fält måste vara på operationens allowlist
    // (defense-in-depth mot framtida kod-drift; deny → 400).
    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[create-person-note] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      return badRequest(
        `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
        corsHeaders,
      );
    }

    console.log(`[create-person-note] ALLOW | caller_user_id=${user.id} | person=${personId}`);

    const created = await createAirtableRecord(operation.tableId, fields);

    // Dubbel retur: `note` = ren domän-shape (adaptern parse:ar denna, ser aldrig
    // Airtable-fältnamn); `record` = rått skriv-bevis (id + fields + createdTime) så
    // conformance kan asserta att Författare/Anteckning/Person faktiskt skrevs.
    return new Response(
      JSON.stringify({
        note: mapCreatedNote(created),
        record: { id: created.id, fields: created.fields, createdTime: created.createdTime },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'create-person-note',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
