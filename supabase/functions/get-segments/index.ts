import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { parseSegmentRule, type SegmentRule } from '../_shared/segment-membership.ts';

// get-segments — app-sparade segment som GLOBAL läs-lista (Fas 6g L3, ADR-065).
// Speglar get-mail-log/get-waitlist global-läs-mönstret (ingen filter/cursor; tom
// lista = giltigt tillstånd). LÄSER bara — inga formel-/Make-fält skrivs.
//
// LEGACY-HANTERING (L193 — assertera mot KONTRAKTET, ej mot fixturens rikedom):
// Segment-tabellen bär de 9 befintliga Make-segmenten som har `Segmentformel` men
// TOMT `App-segmentregel`. En sparad app-rad bär en typad regel; en legacy-rad gör
// det inte. Vi läser därför 'App-segmentregel' som NULLBART (scalarString) och
// FILTRERAR bort rader utan en giltig regel — appens lista visar app-sparade segment,
// inte Make-legacy-rader. Att anta att varje rad har en regel skulle krascha mot de
// 9 legacy-raderna; kontraktet säger att fältet KAN vara tomt.
//
// Tabell per NAMN 'Segment' (ej tbl-id) → samma kod prod+staging (ADR-050).

const TABLE_NAME = 'Segment';
const FIELDS = ['Namn på segment', 'App-segmentregel', 'Segmentdefinition'];

type Fields = Record<string, unknown>;

type SavedSegment = {
  id: string;
  namn: string | null;
  rule: SegmentRule;
  definition: string | null;
};

/**
 * Segment-rad → SavedSegment, ELLER null för en LEGACY-/ogiltig rad. Tomt
 * `App-segmentregel` (Make-legacy) → null. Närvarande men oparsbar/ogiltig JSON →
 * null + server-warn (data-form-avvikelse, aldrig tyst förvanskad eller kraschar).
 */
function toSavedSegment(record: { id: string; fields: Fields }): SavedSegment | null {
  const raw = scalarString(record.fields['App-segmentregel']);
  if (raw === null) return null; // legacy-rad (Make-formel, ingen app-regel)
  let rule: SegmentRule;
  try {
    rule = parseSegmentRule(JSON.parse(raw));
  } catch {
    console.warn(`[get-segments] hoppar rad ${record.id}: App-segmentregel oparsbar/ogiltig`);
    return null;
  }
  return {
    id: record.id,
    namn: scalarString(record.fields['Namn på segment']),
    rule,
    definition: scalarString(record.fields['Segmentdefinition']),
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
    const records = await fetchFromAirtable(TABLE_NAME, { fields: FIELDS });
    const segments = records
      .map(toSavedSegment)
      .filter((s): s is SavedSegment => s !== null);

    return new Response(JSON.stringify({ segments }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-segments',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
