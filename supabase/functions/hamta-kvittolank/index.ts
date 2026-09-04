// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande).
//
// hamta-kvittolank — "Visa" på inbetalningens rad. TASK-346.4 AC #1,
// PRD berättelse 12 ("se och skicka om ett kvitto från raden, så att jag kan
// svara 'vad skickade vi till Bengt?' utan att be Bengt vidarebefordra").
//
// ═══════════════════════════════════════════════════════════════════════════
// SIGNERAD LÄNK, INTE EN PUBLIK URL
// ═══════════════════════════════════════════════════════════════════════════
// Bucketen `bilagor` är PRIVAT (TASK-146.3). En signerad länk är
// tidsbegränsad och kan inte gissas — och klienten rör aldrig lagrings-API:t
// direkt, vilket är ADR-057 klausul a i praktiken (mekaniskt vaktat av
// `tests/api/attachment-layer-independence.test.ts`).
//
// SAMMA LEVERANSFORM som `get-attachment-download-url`: `{ url, utgar }`.
// Klienten får aldrig lagringsnyckeln — den är en intern adress, inte en
// resurs.

import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { BILAGOR_BUCKET_ID, SIGNED_DOWNLOAD_URL_TTL_SECONDS } from '../_shared/attachments.ts';
import {
  KVITTO_KOLUMNER,
  KVITTON_TABELL,
  radTillKvitto,
  skapaAdminKlient,
} from '../_shared/betalningar-db.ts';

const LOGG = '[hamta-kvittolank]';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed. Use GET.' }, 405, corsHeaders);
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const url = new URL(req.url);
  const kvittoId = url.searchParams.get('kvittoId');
  if (kvittoId === null || !UUID_RE.test(kvittoId)) {
    return jsonResponse({ error: 'kvittoId krävs (UUID)' }, 400, corsHeaders);
  }

  try {
    const db = skapaAdminKlient();

    const { data, error } = await db
      .from(KVITTON_TABELL)
      .select(KVITTO_KOLUMNER)
      .eq('id', kvittoId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return jsonResponse({ error: `Kvittot hittades inte: ${kvittoId}` }, 404, corsHeaders);
    }

    const kvitto = radTillKvitto(data);
    if (kvitto.lagringsnyckel === null) {
      // Numret är allokerat men PDF:en är inte sparad än — jobbet är kvar i
      // sin PDF-fas, eller avbröts. 409 skiljer det från "kvittot finns
      // inte" (404), så ytan kan säga "kvittot är på väg" i stället för
      // "hittades inte".
      return jsonResponse(
        {
          error: 'Kvittots PDF är inte sparad än.',
          code: 'pdf_saknas',
          kvittonummer: kvitto.kvittonummer,
        },
        409,
        corsHeaders,
      );
    }

    const { data: signerad, error: signeringsFel } = await db.storage
      .from(BILAGOR_BUCKET_ID)
      .createSignedUrl(kvitto.lagringsnyckel, SIGNED_DOWNLOAD_URL_TTL_SECONDS);
    if (signeringsFel) throw signeringsFel;
    if (!signerad?.signedUrl) {
      throw new Error('Storage returnerade ingen signerad länk.');
    }

    const utgar = new Date(Date.now() + SIGNED_DOWNLOAD_URL_TTL_SECONDS * 1000).toISOString();

    console.log(
      `${LOGG} OK | caller_user_id=${user.id} | requestId=${requestId} | ` +
        `kvitto=${kvitto.kvittonummer}`,
    );

    return jsonResponse(
      { url: signerad.signedUrl, utgar, kvittonummer: kvitto.kvittonummer },
      200,
      corsHeaders,
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'hamta-kvittolank',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
