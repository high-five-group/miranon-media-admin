import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { resolveRuleMembers } from '../_shared/segment-resolution.ts';
import {
  InvalidSegmentRuleError,
  parseSegmentRule,
  type SegmentRule,
} from '../_shared/segment-membership.ts';

// compute-segment — beräknat segment-medlemskap från KÄLLAN (Deltaganden),
// strikt Närvaropoäng=1, regel-utvärderad (ADR-064; AND/DNF ADR-115). Repots
// första POST-LÄS-only-EF: regeln (include[]/exclude[] över taxonomin) ryms ej
// i query-params. LÄSER bara Airtable — ingen skrivning, ingen
// field-allowlists.ts-post. Consent FILTRERAS EJ — ejGodkandMail bärs med (L4).
//
// REGELFORMEN (ADR-115, TASK-249.2): `include` är DNF — varje villkor är
// antingen ett enkelt par (ren OR, oförändrad) eller en Konjunkt-grupp (AND,
// Par[]); `exclude` förblir platt. Servern ÄGER hela expansionen och
// konjunktionen — en klient behöver aldrig fler än ETT anrop, oavsett hur
// många AND-grupper regeln har (ingen klient-side snitt-genväg, T50).
// Svaret bär `via: Par[]` per medlem (EF-krav 1) — vilka par som gjorde just
// den personen medlem, så en fördelning (vilken grupp/kurs) kräver ingen
// andra fråga.
//
// UPPLÖSNINGEN (Deltaganden-walk → algebra → Personer-berikning) bor sedan Fas 6h
// L2b i _shared/segment-resolution.ts (resolveRuleMembers), delad med send-email så
// EN väg löser medlemskap. Denna handler är nu en tunn POST→regel→resolve-wrapper;
// beteendet är identiskt med pre-extraktion (samma källfråga, samma algebra, samma
// berikning) plus `via` per medlem.
//
// Tabeller per NAMN (ej tbl-id) → samma kod prod+staging (ADR-050).

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

  // Regel-parsning + validering. BÅDE felformad JSON OCH ogiltig regel-form →
  // 400 (klient-fel), skilt från Airtable-fel (→ 500 via mapErrorToResponse).
  let rule: SegmentRule;
  try {
    rule = parseSegmentRule(await req.json());
  } catch (error) {
    const message =
      error instanceof InvalidSegmentRuleError ? error.message : 'Invalid JSON body';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Källa → ren medlemskaps-algebra → namn/e-post/consent-berikning (extraherad väg).
    const members = await resolveRuleMembers(rule);

    return new Response(JSON.stringify({ members, count: members.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'compute-segment',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
