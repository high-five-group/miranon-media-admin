// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande). Samma undantags-mönster som
// send-receipt-email/index.ts m.fl.
//
// MÄTT INERT för `npm run typecheck` (S105, 2026-08-14): denna fil ingår
// inte i någon tsconfig-graf (varken tsconfig.app.json/src,
// tsconfig.tests.json/tests, eller den enumererade filistan i
// tsconfig.edge-shared.json) och tas därför aldrig upp av `tsc -b` —
// empiriskt: `npm run typecheck` förblir exit 0 med pragmat borttaget.
// Pragmat behålls ändå, som markör för ADR-010 § Fas 7-åtagandets
// `deno check` (som RESPEKTERAR @ts-nocheck och alltså faktiskt bryr sig
// om det den dagen kopplas in). Syskonet get-activity-log/index.ts saknar
// pragmat men är i dag LIKA inert av samma skäl — asymmetrin har alltså
// ingen funktionell effekt just nu. Huruvida syskonet BEHÖVER pragmat när
// Fas 7 kopplar in `deno check` är OPRÖVAT (ingen Deno-CLI tillgänglig för
// att mäta här) och lämnas öppet, inte gissat.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth.ts';
import {
  ActivityStatementSchema,
  REQUEST_ID_EXTENSION_IRI,
} from '../_shared/activity-statement-schema.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// log-activity — aktivitetsloggens skrivväg (TASK-201.3, ADR-110/ADR-111).
//
// TRACER BULLET: förebilden är send-receipt-email/index.ts (ADR-109-
// landningen) för EF-formen (requireUser → validera → skriv → svara), men
// SKRIVMÅLET är Supabase Postgres (`activity_log`), inte Airtable — samma
// "kan aldrig komma från klienten"-princip för AKTÖRENS NAMN som
// create-person-note/create-event-note (ADR-075) tillämpas här på
// `actor.name`: klienten skickar ett bästa-möjligt värde
// (`recordActivity.ts`), men EF:en härleder det AUKTORITATIVA namnet
// SERVER-SIDE ur JWT:ns `user_metadata.display_name` och skriver över det
// klient-buret värdet innan insert. `actor.account.name` (Supabase
// auth-UUID:t) är STRIKTARE än en attribution-override: statementet AVVISAS
// (403) om det inte matchar den anropande JWT:ns `user.id` — annars hade en
// kompromissad klient kunnat logga aktivitet SOM någon annan.
//
// SKRIVGRINDEN ÄR STRUKTURELL, INTE BARA KOD-KONVENTION: `service_role` har
// enbart SELECT+INSERT-grant på `activity_log`
// (`supabase/migrations/20260812143131_grant_service_role_activity_log.sql`)
// — ett UPDATE/DELETE-försök härifrån hade fått 403 av Postgres oavsett vad
// koden gjorde. Denna EF försöker aldrig något annat än INSERT.

const ACTIVITY_LOG_TABLE = 'activity_log';

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return jsonResponse({ error: message }, 400, corsHeaders);
}

/**
 * Läser `user_metadata.display_name` ur den REDAN VERIFIERADE JWT:ns payload
 * — IDENTISK i sak med create-person-note/create-event-note/invite-user:s
 * kopior (ADR-026 ≥3-tröskel för _shared-extraktion nämns i de filerna, men
 * den är redan BRUTEN av tre befintliga kopior innan denna fjärde — se
 * slutrapportens § Avvikelser för det observerade, ej åtgärdade, gapet).
 * Denna fil håller sig till samma etablerade (om än ofullständigt
 * tillämpade) mönster snarare än att refaktorera tre orörda EF:er in i
 * denna skivas scope.
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

/** Första nyckelns värde ur en Language Map — `sv-SE` om den finns, annars
 * första förekommande (schemat garanterar minst en nyckel). */
function firstDisplayValue(map: Record<string, string>): string {
  return map['sv-SE'] ?? Object.values(map)[0] ?? '';
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405, corsHeaders);
  }

  const authHeader = req.headers.get('Authorization');
  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body', corsHeaders);
  }

  // AC #2: SAMMA Zod-schema server-side. Ett ogiltigt statement avvisas HÄR
  // — det når aldrig `createClient`/insert-anropet nedan.
  const result = ActivityStatementSchema.safeParse(body);
  if (!result.success) {
    console.warn(
      `[log-activity] DENY invalid statement | caller_user_id=${user.id} | issues=${JSON.stringify(result.error.issues.slice(0, 5))}`,
    );
    return badRequest(`Invalid activity statement: ${result.error.issues[0]?.message ?? 'validation failed'}`, corsHeaders);
  }
  const statement = result.data;

  // IDENTITETSBINDNINGEN: aktören MÅSTE vara anroparen själv — ett
  // statement som påstår att någon annan agerade avvisas (403, INTE 400 —
  // det är en behörighetsfråga, inte en formfråga).
  if (statement.actor.account.name !== user.id) {
    console.warn(
      `[log-activity] DENY actor mismatch | caller_user_id=${user.id} | claimed_actor=${statement.actor.account.name}`,
    );
    return jsonResponse(
      { error: 'Statement actor must match the authenticated caller.' },
      403,
      corsHeaders,
    );
  }

  // AUKTORITATIV NAMN-ATTRIBUTION (ADR-075-mönstret): klientens `actor.name`
  // skrivs ALDRIG rakt in — servern härleder det ur JWT:n, fallback e-post/
  // user-id (identisk fallback-ordning som create-person-note).
  const authoritativeName = readDisplayNameFromJwt(authHeader) ?? user.email ?? user.id;
  const finalStatement = {
    ...statement,
    actor: { ...statement.actor, name: authoritativeName },
  };

  const clientRequestId = statement.context.extensions[REQUEST_ID_EXTENSION_IRI];

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const row = {
      id: finalStatement.id,
      actor_name: finalStatement.actor.name,
      actor_account_name: finalStatement.actor.account.name,
      verb_id: finalStatement.verb.id,
      verb_display: firstDisplayValue(finalStatement.verb.display),
      object_id: finalStatement.object.id,
      object_type: finalStatement.object.definition.type,
      object_name: firstDisplayValue(finalStatement.object.definition.name),
      request_id: clientRequestId,
      occurred_at: finalStatement.timestamp,
      statement: finalStatement,
    };

    const { error: insertError } = await supabaseAdmin.from(ACTIVITY_LOG_TABLE).insert(row);
    if (insertError) {
      throw insertError;
    }

    console.log(
      `[log-activity] ALLOW | caller_user_id=${user.id} | requestId=${clientRequestId} | ` +
        `verb=${finalStatement.verb.id} | object=${finalStatement.object.id}`,
    );

    return jsonResponse(
      { id: finalStatement.id, requestId: clientRequestId, occurredAt: finalStatement.timestamp },
      201,
      corsHeaders,
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'log-activity',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
