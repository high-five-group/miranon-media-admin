import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// get-event-formats — Eventformat-poster som GLOBAL läs-lista (Fas 6f L2) för
// create-event:s Eventtyp-dropdown. Eventtyp (länk → Eventformat) KRÄVS vid create
// (ADR-066 b5) och driver Sessionsmall-lookupen; UI:t behöver record-ID + visningsnamn
// för att kunna välja format utan en hårdkodad (stale) options-lista. Speglar
// get-segments global-läs-mönstret (ingen filter/cursor; tom lista = giltigt tillstånd).
// LÄSER bara — inga fält skrivs.
//
// Tabell per NAMN 'Eventformat' (ej tbl-id) → samma kod prod+staging (ADR-050).

const TABLE_NAME = 'Eventformat';
const FIELDS = ['Namn'];

type EventFormat = { id: string; namn: string | null };

/** Eventformat-rad → { id, namn } (record-ID + visningsnamn för dropdownen). */
function toEventFormat(record: { id: string; fields: Record<string, unknown> }): EventFormat {
  return { id: record.id, namn: scalarString(record.fields['Namn']) };
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
    const eventFormats = records.map(toEventFormat);

    return new Response(JSON.stringify({ eventFormats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-event-formats',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
