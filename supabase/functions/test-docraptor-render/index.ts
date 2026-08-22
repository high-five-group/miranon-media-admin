// @ts-nocheck — Deno Edge Function (Deno-globaler; typas vid deploy av
// `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som send-email/index.ts och test-pdf-generation/index.ts.
//
// test-docraptor-render — S108 MARCUS-SEKVENS punkt 3, ADR-119 beslut 7
// "minimaltestet"; UTBYGGD TASK-302.1 (PRD TASK-302, `ADR-124`) med en andra
// leveransväg.
//
// STAGING-ONLY testharness-EF, exakt samma mönster som test-pdf-generation/
// test-invite-completion: MEDVETET UTELÄMNAD ur
// .prod-functions-allowlist.conf — får ALDRIG nå produktion (test-auth-
// precedenten, Fas 7-skuld, tasks/lessons.md L115). Rör inte den filen för
// denna funktion.
//
// SYFTE (ADR-119 beslut 7, det UR SPRUNGLIGA syftet, oförändrat): ett skarpt
// anrop från en Edge Function i staging INNAN någon mall byggs mot DocRaptor
// på riktigt. `leverans: 'bytes'` (default) ÄR fortfarande det anropet —
// tar emot redan självbärande HTML (scripts/docraptor-sjalvbarande.mjs),
// skickar den vidare till DocRaptor, returnerar PDF-bytesen. Mätningen
// (a)-(d) beslut 7 kräver (sökbar text, latens, filstorlek, ärligt
// felbeteende) görs av anroparen (scripts/docraptor-minimaltest.mjs) mot
// DENNA gren — funktionen själv mäter bara (b) via x-docraptor-ms.
//
// BÅDA LEVERANSVÄGARNA, OCH VARFÖR (TASK-302.1): `leverans: 'utkast'`
// (kräver `eventId` + `typ`) lägger i stället den nyss renderade PDF:en som
// ett TRANSIENT utkast i Storage (`_shared/utkast.ts` § `laggUtkast`) och
// svarar JSON `{ url, utgar }` — en kort signerad URL i stället för rå
// PDF-bytes. ANLEDNINGEN, mätt: Chromes PDF-visare scrollar bara jämnt på en
// URL SERVERAD AV NÄTVERKSTJÄNSTEN. `blob:` (klientens tidigare väg), en
// Service Worker som fångar svaret, och båda med `noopener` mättes ALLA
// laggiga (sex armar, headed Chrome 151,
// `tasks/sessions/2026-08-20-session-108.md` Del 10 § B punkt 3 + Del 11).
// `bytes`-grenen (ADR-119 beslut 7:s ursprungliga mätinstrument) och
// `utkast`-grenen (prototypens leveransväg, TASK-302.1 AC #2) delar SAMMA
// DocRaptor-anrop — bara vad som händer med resultat-bytesen efteråt skiljer
// dem.
//
// AUTENTISERING: samma gateway-försvar som test-pdf-generation
// (requireUser, verify_jwt=true i config.toml). Funktionen rör ingen
// Airtable-data i NÅGON av de två grenarna — `utkast`-grenen skriver bara
// till den redan-privata `bilagor`-bucketen (service-role, samma mönster
// som `upload-attachment`), ingen Bilagor-rad, inget mail.
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
// valideringsfel (saknad html/namn, ogiltig `leverans`, saknad/ogiltig
// `eventId`/`typ` i utkast-grenen) OCH `utkast`-grenens Storage-fel följer i
// stället repots vanliga `{ error, requestId }`-kontrakt via
// _shared/errors.ts, eftersom de INTE är en av de fyra DocRaptor-felklasserna
// beslut 7 pekar ut.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse, ValidationError } from '../_shared/errors.ts';
import { laggUtkast, type UtkastTyp } from '../_shared/utkast.ts';

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
    let body: {
      html?: unknown;
      namn?: unknown;
      leverans?: unknown;
      eventId?: unknown;
      typ?: unknown;
    };
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Ogiltig JSON-body');
    }

    const { html, namn, leverans: leveransRaw, eventId: eventIdRaw, typ: typRaw } = body;
    if (typeof html !== 'string' || html.length === 0) {
      throw new ValidationError('Fältet "html" krävs och måste vara en icke-tom sträng');
    }
    if (typeof namn !== 'string' || namn.length === 0) {
      throw new ValidationError('Fältet "namn" krävs och måste vara en icke-tom sträng');
    }

    // [TASK-302.1] `leverans` — 'bytes' (default, ADR-119 beslut 7:s
    // ursprungliga beteende, OFÖRÄNDRAT) eller 'utkast' (denna skivas
    // tillägg, se filhuvudet). Ett angivet men okänt värde är ett
    // klientfel, inte en tyst fallback.
    if (
      leveransRaw !== undefined &&
      leveransRaw !== 'bytes' &&
      leveransRaw !== 'utkast'
    ) {
      throw new ValidationError('Fältet "leverans" måste vara "bytes" eller "utkast"');
    }
    const leverans: 'bytes' | 'utkast' = leveransRaw === 'utkast' ? 'utkast' : 'bytes';

    // NÄRVARO-kontrollen (fälten krävs) sitter HÄR — FÖRE DocRaptor-anropet,
    // så en trasig begäran inte betalar en DocRaptor-rundtur i onödan.
    // FORM-kontrollen (rec-form/enum) sitter i `laggUtkast` (delad med
    // TASK-302.2:s skarpa EF:er, en formel).
    if (leverans === 'utkast') {
      if (typeof eventIdRaw !== 'string' || eventIdRaw.length === 0) {
        throw new ValidationError('Fältet "eventId" krävs när leverans är "utkast"');
      }
      if (typeof typRaw !== 'string' || typRaw.length === 0) {
        throw new ValidationError('Fältet "typ" krävs när leverans är "utkast"');
      }
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

    // [TASK-302.1] `utkast`-grenen: lagra de nyss renderade bytesen som ett
    // transient utkast och svara med en signerad URL i stället för
    // bytesen själva — se filhuvudet för VARFÖR (Chrome-scroll-mätningen).
    if (leverans === 'utkast') {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { url: utkastUrl, utgar } = await laggUtkast(supabaseAdmin, {
        eventId: eventIdRaw as string,
        typ: typRaw as UtkastTyp,
        bytes: pdfBytes,
      });
      return new Response(JSON.stringify({ url: utkastUrl, utgar }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'x-docraptor-ms': String(ms),
          'x-pdf-bytes': String(pdfBytes.byteLength),
          'x-docraptor-test-mode': String(arPlatshallare),
        },
      });
    }

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
