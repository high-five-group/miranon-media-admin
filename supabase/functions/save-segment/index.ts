import { createAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import {
  InvalidSegmentRuleError,
  parseSegmentRule,
  type SegmentRule,
} from '../_shared/segment-membership.ts';

// save-segment — sparar en namngiven segment-regel som en NY rad i Segment-tabellen
// (Fas 6g L3, ADR-065). REPOTS FÖRSTA 6g-WRITE. Speglar create-registration:s
// säkerhets-kontrakt (POST→405, requireUser→401, allowlist-SSOT via field-allowlists.ts,
// deny→400, {error}+requestId, central loggning) men för en CREATE av en segment-rad.
//
// FÄLT-SHAPE byggs SERVER-SIDE ur typade inputs — klienten skickar ALDRIG en rå
// `fields`-map. Endast de TRE app-skrivbara fälten sätts (live-verifierade skrivbara
// Session 36 pass 3 STEG 0): 'Namn på segment', 'App-segmentregel', 'Segmentdefinition'.
// Make-LEGACY-fälten (Segmentformel / Antal i segment / Beräkna / Mailutskick / Används
// för utskick) sätts ALDRIG (ADR-065 beslut 3) — de ligger utanför allowlisten.
//
// REGEL-PERSISTENS: 'App-segmentregel' bär JSON.stringify(rule), där rule är den typade
// { include: Par[], exclude: Par[] } (parseSegmentRule-validerad, samma form som
// compute-segment läser). 'Segmentdefinition' bär den svenska klartext-speglingen.
//
// INGEN idempotens/409-dedup (till skillnad mot create-registration): ett sparat segment
// är en admin-namngiven rad; dubbletter hanteras av operatören, ej server-side unikhet.
//
// Tabell per NAMN 'Segment' (ej tbl-id) → samma kod prod+staging (ADR-050).

const OPERATION_KEY = 'save-segment';

type Fields = Record<string, unknown>;

interface SaveSegmentBody {
  namn?: unknown;
  rule?: unknown;
  definition?: unknown;
}

/**
 * Skapad Segment-rad → domän-SavedSegment (samma shape som get-segments mappar →
 * klienten ser ALDRIG Airtable-fältnamn; `SavedSegmentSchema.parse()` i adaptern,
 * ADR-026). `rule` återges från den validerade inputen (inte re-parsad ur skriv-svaret).
 */
function mapSavedSegment(recordId: string, namn: string, rule: SegmentRule, definition: string) {
  return { id: recordId, namn, rule, definition };
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

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  // Body-parsning (felformad JSON → 400 klient-fel).
  let body: SaveSegmentBody;
  try {
    body = (await req.json()) as SaveSegmentBody;
  } catch {
    return badRequest('Invalid JSON body', corsHeaders);
  }

  // Input-validering (deny-by-default). namn/definition först, sedan regel-formen.
  if (typeof body?.namn !== 'string' || !body.namn.trim()) {
    return badRequest('namn is required (non-empty string)', corsHeaders);
  }
  if (typeof body?.definition !== 'string') {
    return badRequest('definition is required (string)', corsHeaders);
  }
  const namn = body.namn.trim();
  const definition = body.definition;

  // Regel-form: BÅDE felformad rule OCH ogiltig modalitet/Par → 400 (klient-fel),
  // skilt från Airtable-fel (→ 500 via mapErrorToResponse). Samma validator som
  // compute-segment (parseSegmentRule i _shared/segment-membership.ts).
  let rule: SegmentRule;
  try {
    rule = parseSegmentRule(body.rule);
  } catch (error) {
    const message =
      error instanceof InvalidSegmentRuleError ? error.message : 'Invalid rule';
    return badRequest(message, corsHeaders);
  }

  try {
    // Allowlist-SSOT: hämta operationens tableId + allowedFields.
    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
    }

    // Bygg write-fält SERVER-SIDE — endast de tre app-skrivbara fälten.
    const fields: Fields = {
      'Namn på segment': namn,
      'App-segmentregel': JSON.stringify(rule),
      Segmentdefinition: definition,
    };

    // SSOT-grind: varje server-byggt fält måste vara på operationens allowlist
    // (defense-in-depth mot framtida kod-drift; deny → 400).
    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[save-segment] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      return badRequest(
        `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
        corsHeaders,
      );
    }

    console.log(`[save-segment] ALLOW | caller_user_id=${user.id} | namn=${namn}`);

    const created = await createAirtableRecord(operation.tableId, fields);

    // Dubbel retur: `segment` = ren domän-shape (adaptern parse:ar denna); `record` =
    // rå skriv-bevis (id + fields) så conformance kan asserta att 'App-segmentregel' +
    // 'Namn på segment' faktiskt skrevs (create-registration-mönstret).
    return new Response(
      JSON.stringify({
        segment: mapSavedSegment(created.id, namn, rule, definition),
        record: { id: created.id, fields: created.fields },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'save-segment',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
