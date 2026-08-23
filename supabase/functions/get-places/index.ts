// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som övriga _shared-konsumerande EF:er.
//
// get-places — TASK-309.7 AC #3, ADR-125 § 7. GLOBAL läs-lista över SAMTLIGA
// Platser-rader (Mer-sidans Platser-yta) — speglar get-event-formats
// global-läs-mönstret (ingen filter/cursor; tom lista är giltig, om än
// osannolik: Rönninge är permanent seedad, data-model.md § Bilagornas
// datamodell).
//
// LÄSER bara — ingen skrivning, ingen allowlist-grind behövs.

import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { EVENT_TEXT_BASFALT, PLATS_FALT_KEYS } from '../_shared/eventinnehall-falt.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

const PLATSER_TABLE = 'Platser';

type AirtableRow = { id: string; fields: Record<string, unknown> };

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

  try {
    const rows = (await fetchFromAirtable(PLATSER_TABLE, {
      fields: ['Namn', ...PLATS_FALT_KEYS.map((k) => EVENT_TEXT_BASFALT[k])],
      sort: [{ field: 'Namn', direction: 'asc' }],
    })) as AirtableRow[];

    const places = rows.map((row) => ({
      id: row.id,
      namn: scalarString(row.fields['Namn']) ?? '',
      falt: Object.fromEntries(
        PLATS_FALT_KEYS.map((k) => [k, scalarString(row.fields[EVENT_TEXT_BASFALT[k]])]),
      ),
    }));

    return new Response(JSON.stringify({ places }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-places',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
