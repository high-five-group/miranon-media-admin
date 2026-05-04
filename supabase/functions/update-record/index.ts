import { updateAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

// Operations-baserad write-API (M4).
//
// Klient skickar { operationKey, recordId, fields }. operationKey
// matchas mot OPERATIONS-registret i _shared/field-allowlists.ts.
// Okänd operation → 400. Fält utanför operationens allowedFields → 400.
// Deny-by-default på alla nivåer.
//
// Operations-registret är tomt idag (Discovery 2026-05-04 visade att
// inga UI-callers finns). Operations läggs till när Fas 5.5+
// produktionsslicen faktiskt anropar dem. Se §F i
// tasks/sessions/2026-05-04-security-hardening.md.

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
    const { operationKey, recordId, fields } = await req.json();

    // 1. Validera input-shape.
    if (typeof operationKey !== 'string' || !operationKey) {
      return new Response(JSON.stringify({ error: 'operationKey is required (string)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (typeof recordId !== 'string' || !recordId) {
      return new Response(JSON.stringify({ error: 'recordId is required (string)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
      return new Response(JSON.stringify({ error: 'fields is required (object)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Verifiera att operationen finns på allowlisten.
    const operation = getOperation(operationKey);
    if (!operation) {
      console.warn(
        `[update-record] DENY unknown operation | caller_user_id=${user.id} | operationKey=${operationKey}`,
      );
      return new Response(JSON.stringify({ error: `Unknown operation: ${operationKey}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. recordId-format-check (befintligt beteende, behållet).
    if (!recordId.startsWith('rec')) {
      return new Response(JSON.stringify({ error: 'Invalid recordId format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Verifiera att alla fält i payload är på operationens allowedFields.
    const disallowed = findDisallowedField(operation, fields as Record<string, unknown>);
    if (disallowed !== null) {
      console.warn(
        `[update-record] DENY field not in allowlist | caller_user_id=${user.id} | operationKey=${operationKey} | field=${disallowed}`,
      );
      return new Response(
        JSON.stringify({
          error: `Field "${disallowed}" not allowed for operation "${operationKey}"`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log(
      `[update-record] ALLOW | caller_user_id=${user.id} | operationKey=${operationKey} | record=${recordId} | fields=${JSON.stringify(fields)}`,
    );

    const updated = await updateAirtableRecord(
      operation.tableId,
      recordId,
      fields as Record<string, unknown>,
    );

    return new Response(JSON.stringify({ record: { id: updated.id, fields: updated.fields } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'update-record',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
