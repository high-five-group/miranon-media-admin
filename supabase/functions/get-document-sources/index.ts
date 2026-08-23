// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande. Samma
// undantags-mönster som övriga _shared-konsumerande EF:er.
//
// get-document-sources — TASK-309.2 AC #4, ADR-125 § 2. Läsvägen för
// bilagornas ifyllnadsunderlag: för ETT event returnerar den allt en
// renderare (eller en förhandsgranskande klientvy) behöver — eventets egna
// fält, den uppslagna Eventinnehåll-standarden (Event × Typ, ADR-125 § 2
// "Uppslag, inte länk"), den länkade Platsen, agendan och en enhetlig
// standard/kopia-form för varje redigerbart block (ADR-125 beslut 1+6:
// "tomt kopia-fält = standarden gäller").
//
// [TASK-309.4] Läslogiken FLYTTAD till `_shared/document-sources.ts`
// (`fetchDocumentSources`) — ADR-125 § Beslut 5: "extrahera läslogiken till
// _shared om den sitter i EF:en, så båda EF:erna delar den." Denna fil är
// nu enbart HTTP-lagret (auth, 404, JSON-svar); `generate-event-attachment/
// index.ts` anropar samma delade funktion för att bygga bilagans
// ifyllnadsdata. Beteendet mot klienten är OFÖRÄNDRAT — samma svarsform,
// samma 404-kontrakt.
//
// LÄSER bara — ingen skrivning, ingen allowlist-grind behövs (skrivvägarna
// hör till TASK-309.3).

import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { fetchDocumentSources } from '../_shared/document-sources.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use GET.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Missing eventId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const sources = await fetchDocumentSources(eventId);
    if (!sources) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(sources), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-document-sources',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
