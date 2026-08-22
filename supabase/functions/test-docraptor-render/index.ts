// @ts-nocheck — Deno Edge Function (Deno-globaler; typas vid deploy av
// `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som send-email/index.ts och test-pdf-generation/index.ts.
//
// test-docraptor-render — S108 MARCUS-SEKVENS punkt 3, ADR-119 beslut 7
// "minimaltestet".
//
// STAGING-ONLY testharness-EF, exakt samma mönster som test-pdf-generation/
// test-invite-completion: MEDVETET UTELÄMNAD ur
// .prod-functions-allowlist.conf — får ALDRIG nå produktion (test-auth-
// precedenten, Fas 7-skuld, tasks/lessons.md L115). Rör inte den filen för
// denna funktion.
//
// SYFTE: ADR-119 beslut 7 kräver ett skarpt anrop från en Edge Function i
// staging INNAN någon mall byggs mot DocRaptor på riktigt. Detta ÄR det
// anropet — en ren proxy: tar emot redan självbärande HTML (se
// scripts/docraptor-sjalvbarande.mjs), skickar den vidare till DocRaptor,
// och returnerar PDF-bytesen tillbaka. Ingen Storage-skrivning, ingen
// Airtable-koppling, ingen mall-specifik logik — det är EXAKT vad
// beslut 7 kräver mätning av: (a) sökbar text med korrekt svensk
// teckenkodning, (b) end-to-end-latens, (c) filstorlek, (d) ärligt
// felbeteende. Mätningen (a)-(d) görs av anroparen
// (scripts/docraptor-minimaltest.mjs) mot det denna funktion returnerar —
// funktionen själv mäter bara (b) via x-docraptor-ms.
//
// AUTENTISERING: samma gateway-försvar som test-pdf-generation
// (requireUser, verify_jwt=true i config.toml). Funktionen rör ingen data.
//
// DOCRAPTOR-NYCKELN: läses ur DOCRAPTOR_API_KEY-secret. DocRaptors egen
// tutorial (docraptor.com/documentation/tutorial, läst 2026-08-22) bekräftar
// att `YOUR_API_KEY_HERE` fungerar som testnyckel — gratis men vattenstämplade
// dokument, ingen skarp nyckel krävs för detta pass. `test: true` sätts
// AUTOMATISKT när nyckeln är exakt den platshållaren (aldrig hårdkodat sant
// — en framtida skarp nyckel ska INTE tvinga vattenstämpel).
//
// TIMEOUT-ÖVERSTYRNING (?timeoutMs=<n>): honoreras ENDAST när nyckeln är
// platshållaren. Detta är en MEDVETEN spärr, inte en bekvämlighet: en
// anropare ska inte kunna tvinga fram en absurt kort timeout mot ett SKARPT
// DocRaptor-konto (t.ex. för att dölja ett långsamt men giltigt svar bakom
// en konstruerad timeout-artefakt). Eftersom denna funktion ALDRIG deployas
// till prod och alltid kör mot platshållar-nyckeln i detta pass är spärren
// i praktiken alltid öppen här — men koden är skriven för att vara korrekt
// även om en skarp nyckel någon gång testas manuellt i staging.
//
// FELKONTRAKT för själva DocRaptor-anropet (timeout/4xx/5xx/nätverksfel):
// JSON `{ fel, status, ms }` med samma HTTP-status som body:ns `status`-fält
// — ALDRIG en hängning, ALDRIG ett tyst 200 som gömmer felet. Body-
// valideringsfel (saknad html/namn) följer i stället repots vanliga
// `{ error, requestId }`-kontrakt via _shared/errors.ts, eftersom de INTE
// är en av de fyra DocRaptor-felklasserna beslut 7 pekar ut.

import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse, ValidationError } from '../_shared/errors.ts';

const DOCRAPTOR_PLACEHOLDER_KEY = 'YOUR_API_KEY_HERE';
const DEFAULT_TIMEOUT_MS = 30_000;

function docraptorUrl(apiKey: string): string {
  return `https://${apiKey}@api.docraptor.com/docs`;
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

  try {
    let body: { html?: unknown; namn?: unknown };
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Ogiltig JSON-body');
    }

    const { html, namn } = body;
    if (typeof html !== 'string' || html.length === 0) {
      throw new ValidationError('Fältet "html" krävs och måste vara en icke-tom sträng');
    }
    if (typeof namn !== 'string' || namn.length === 0) {
      throw new ValidationError('Fältet "namn" krävs och måste vara en icke-tom sträng');
    }

    const apiKey = Deno.env.get('DOCRAPTOR_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          fel: 'DOCRAPTOR_API_KEY saknas i staging-secrets',
          status: 500,
          ms: 0,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const arPlatshallare = apiKey === DOCRAPTOR_PLACEHOLDER_KEY;

    const url = new URL(req.url);
    const timeoutMsParam = url.searchParams.get('timeoutMs');
    let timeoutMs = DEFAULT_TIMEOUT_MS;
    if (timeoutMsParam !== null && arPlatshallare) {
      const parsed = Number(timeoutMsParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        timeoutMs = parsed;
      }
    }

    const docraptorBody = {
      test: arPlatshallare,
      document_type: 'pdf',
      document_content: html,
      name: namn,
      javascript: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const t0 = performance.now();
    let docraptorResponse: Response;
    try {
      docraptorResponse = await fetch(docraptorUrl(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docraptorBody),
        signal: controller.signal,
      });
    } catch (fetchError) {
      const t1 = performance.now();
      const ms = t1 - t0;
      const isAbort = fetchError instanceof Error && fetchError.name === 'AbortError';
      return new Response(
        JSON.stringify({
          fel: isAbort
            ? `DocRaptor svarade inte inom ${timeoutMs} ms (timeout)`
            : `Nätverksfel mot DocRaptor: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
          status: isAbort ? 504 : 502,
          ms,
        }),
        {
          status: isAbort ? 504 : 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const t1 = performance.now();
    const ms = t1 - t0;

    if (!docraptorResponse.ok) {
      const feltext = await docraptorResponse.text().catch(() => '');
      return new Response(
        JSON.stringify({
          fel: `DocRaptor svarade ${docraptorResponse.status}: ${feltext.slice(0, 500)}`,
          status: docraptorResponse.status,
          ms,
        }),
        {
          status: docraptorResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const pdfBytes = new Uint8Array(await docraptorResponse.arrayBuffer());

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'x-docraptor-ms': String(ms),
        'x-pdf-bytes': String(pdfBytes.byteLength),
        'x-docraptor-test-mode': String(arPlatshallare),
      },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'test-docraptor-render',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
