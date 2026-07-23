import { createAirtableRecord, fetchAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

// create-event-note — skapar en anteckning i eventets ström (task-18.11, ADR-075).
// Skriv-kärnan speglar create-registration:s SÄKERHET (POST→405, requireUser→401,
// allowlist-SSOT via field-allowlists.ts, deny→400, {error}+requestId, central
// loggning) men mot den ADDITIVA Anteckningar-tabellen.
//
// ATTRIBUTIONEN ÄR ADR-075:s KÄRNA: FÖRFATTAREN sätts SERVER-SIDE ur den inloggade
// användarens VERIFIERADE identitet (requireUser har redan verifierat JWT:ns signatur;
// vi läser dess `user_metadata.display_name`-claim, fallback e-post/user-id). Klienten
// skickar ALDRIG författaren — därför kan attributionen inte förfalskas, och till
// skillnad mot Airtable record comments (som bokförs på TOKEN-ägaren, inte den
// inloggade) blir "av vem" äkta per-användar-attribution.
//
// FÄLT-SHAPE byggs SERVER-SIDE ur typad input (`text`) + härledd `forfattare` +
// Event-länken. Skrivbara fält ENDAST per allowlisten (Författare/Anteckning/Event);
// tidpunkten sätts av Airtables createdTime (aldrig ett skrivet fält). INGEN
// idempotensnyckel: en anteckning saknar affärs-unikhet (två identiska "Ringde igen"
// är båda giltiga), så en server-idempotensgrind utan lagring (ADR-059) vore teater —
// klient-sidans dubbel-submit-skydd (mutationKey-dedup + disabled-knapp) bär interimet.

const OPERATION_KEY = 'create-event-note';
const EVENTPLANERING_TABLE = 'Eventplanering';

// Sane längd-tak (deny-by-default mot abuse). En anteckning är minnesstöd, inte ett
// dokument; taket ligger väl under Airtables multilineText-gräns.
const MAX_TEXT_LENGTH = 5000;

/**
 * Läser `user_metadata.display_name` ur den REDAN VERIFIERADE JWT:ns payload
 * (requireUser har verifierat signaturen; vi läser bara en claim — ingen ny
 * nätverks-runda). Base64url + UTF-8-säker avkodning (svenska namn som "Åsa Öberg"
 * får aldrig manglas — Gunilla-principen). null om claimen saknas/är tom/ogiltig.
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
 * Mappar en skapad Anteckningar-rad → domän-EventNote (samma shape som
 * get-event-notes' mapNote → klienten ser ALDRIG Airtable-fältnamn;
 * `EventNoteSchema.parse()` validerar i adaptern, ADR-026). Tidpunkten ur
 * `createdTime` (server-sanning). Lokalt definierad (ADR-026 ≥3-tröskel för
 * _shared-extraktion; endast denna + get-event-notes).
 */
function mapCreatedNote(record: { id: string; fields: Record<string, unknown>; createdTime: string }) {
  const f = record.fields;
  return {
    id: record.id,
    forfattare: scalarString(f['Författare']), // singleLineText
    text: scalarString(f['Anteckning']) ?? '', // multilineText (deny-empty vid write ⇒ alltid satt)
    tidpunkt: record.createdTime, // Airtable createdTime (ISO)
    eventId: Array.isArray(f['Event']) ? (f['Event'][0] as string) : null, // linked record → first ID
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
    const eventId = body?.eventId;
    const text = body?.text;

    // Input-validering (deny-by-default). text: icke-tom sträng under taket.
    if (typeof text !== 'string' || !text.trim()) {
      return badRequest('text is required (non-empty string)', corsHeaders);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return badRequest(`text exceeds ${MAX_TEXT_LENGTH} characters`, corsHeaders);
    }
    // eventId: Airtable-recordId-format (speglar create-registration:s rec-prefix-grind).
    if (typeof eventId !== 'string' || !eventId.startsWith('rec')) {
      return badRequest('Invalid eventId format', corsHeaders);
    }

    // Allowlist-SSOT: hämta operationens tableId + allowedFields (defensiv null-väg).
    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
    }

    // Eventraden måste finnas — null = okänt event → 404 (ärver get-event-kontraktet).
    const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
    if (!eventRecord) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // FÖRFATTAREN härleds SERVER-SIDE ur den verifierade identiteten (ADR-075).
    // display_name (Gunilla-läsbart namn) → e-post → user-id, så fältet aldrig blir tomt.
    const forfattare = readDisplayNameFromJwt(authHeader) ?? user.email ?? user.id;

    // Bygg write-fält SERVER-SIDE (endast de tre allowlistade; createdTime sätts av Airtable).
    const fields: Record<string, unknown> = {
      Författare: forfattare,
      Anteckning: text.trim(),
      Event: [eventId], // länk-fältets NAMN är 'Event' (fldSJ5Vjx8QcBOaYR)
    };

    // SSOT-grind: varje server-byggt fält måste vara på operationens allowlist
    // (defense-in-depth mot framtida kod-drift; deny → 400).
    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[create-event-note] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      return badRequest(
        `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
        corsHeaders,
      );
    }

    console.log(`[create-event-note] ALLOW | caller_user_id=${user.id} | event=${eventId}`);

    const created = await createAirtableRecord(operation.tableId, fields);

    // Dubbel retur: `note` = ren domän-shape (adaptern parse:ar denna, ser aldrig
    // Airtable-fältnamn); `record` = rått skriv-bevis (id + fields + createdTime) så
    // conformance kan asserta att Författare/Anteckning/Event faktiskt skrevs.
    return new Response(
      JSON.stringify({
        note: mapCreatedNote(created),
        record: { id: created.id, fields: created.fields, createdTime: created.createdTime },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'create-event-note',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
