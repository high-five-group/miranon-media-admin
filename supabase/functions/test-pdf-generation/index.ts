// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande. Samma
// undantags-mönster som send-email/index.ts och
// send-registration-confirmation/index.ts (esm.sh-import av tredjepartslib).
//
// test-pdf-generation — TASK-146.1 "Runtime-beviset".
//
// STAGING-ONLY testharness-EF, samma mönster som test-auth/
// test-invite-completion: MEDVETET UTELÄMNAD ur
// .prod-functions-allowlist.conf — får ALDRIG nå produktion (Fas 7-skuld,
// tasks/lessons.md L115). Rör inte den filen för denna funktion.
//
// SYFTE: research-passet (docs/research/utskicks-bilage-arkitektur-2026-08-03.md
// § Delfråga 3 + § Vad jag inte kunde belägga) mätte att `pdf-lib` renderar
// svensk text (å/ä/ö/Å/Ä/Ö) korrekt med sitt inbyggda WinAnsi-typsnitt — men
// UNDER NODE, som medveten proxy, eftersom Deno-CLI saknades i den
// körmiljön. Beteendet SPECIFIKT inuti den skarpa Supabase Edge Runtime
// (Deno, inte Node) lämnades öppet overifierat. Den här funktionen kör
// EXAKT samma mätning — samma bibliotek, samma version, samma
// standardtypsnitt utan anpassad inbäddning, samma svenska teststräng —
// men INUTI den skarpa runtimen. Anropas av
// tests/api/test-pdf-generation.staging.test.ts, som är den nya
// kontrakts-skarv PRD-kortet (TASK-146) begär: "PDF-generering har idag
// ingen skarv i repot. Den behöver ett bevis som körs mot den skarpa
// runtimen, inte mot en Node-proxy."
//
// MÄTER (AC #3 — minne, CPU-tid, kallstart), och de plattformsgränser detta
// jämförs mot (docs/research/…#delfråga-2, Supabase Edge Functions limits):
// 256 MB minne / 2 s CPU-tid / 150 s (Free) / 400 s (Paid) wall-clock.
//
//   - `Deno.memoryUsage()` före/efter PDF-byggnaden. Detta ÄR den enda
//     minnes-mätpunkt Edge Runtime exponerar till funktionskoden själv —
//     wrappas i try/catch: OM API:t saknas eller kastar i den skarpa
//     sandlådan (overifierat innan denna funktion faktiskt körts) rapporteras
//     `memory.supported: false` + felmeddelandet, aldrig ett gissat tal.
//   - `performance.now()`-diff runt `PDFDocument.create()`→`save()`.
//     REDOVISAS UTTRYCKLIGEN SOM EN PROXY, INTE ÄKTA CPU-TID: Deno Edge
//     Runtime exponerar ingen CPU-tids-API till funktionskod — CPU-taket
//     verkställs av supervisorn UTANFÖR sandlådan (samma supervisor som
//     "cancelled by supervisor"-risken, se nedan). Wall-clock-generering
//     är den bästa tillgängliga approximationen inifrån funktionen.
//   - Kallstart kan INTE mätas av funktionen själv (den vet inte om den
//     egna instansen just startades). Mäts EXTERNT av anroparen: första
//     anrop efter deploy/idle jämfört med efterföljande — se
//     slutrapporten för de faktiska talen.
//
// KÄND ÖPPEN RISK (kortets egen instruktion): ett avbrytande fel i
// runtimen — "cancelled by supervisor" — är rapporterat i Supabases egen
// GitHub-diskussion (orgs/supabase/discussions/19824) utan känd rotorsak.
// Träffas den, kastar Deno.serve-hanteraren och `mapErrorToResponse`
// loggar den strukturerat (errorName/errorMessage) — ingen gissning om
// orsak görs här.
//
// Ingen auth-bypass: samma gateway-försvar (verify_jwt=true, config.toml)
// + requireUser som repots övriga data-funktioner — se test-invite-
// completion-precedenten i config.toml för samma resonemang.

import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { PDFDocument, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

// Identisk teststräng som research-passets Node-mätning (samma å/ä/ö/Å/Ö,
// em-dash och accenttecken) — samma mätning, annan runtime, direkt
// jämförbart resultat.
const SWEDISH_SAMPLE =
  'Kvitto — Åsa Öberg, Café Söderköping. Moms 25% — Björn Ångström.';

/** Base64 utan spridningsoperator (`...bytes`) — undviker call-stack-tak på stora arrayer. */
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/** Deno.memoryUsage() är overifierad i Edge Runtime — mät försiktigt, gissa aldrig. */
function safeMemoryUsage(): { supported: true; usage: Deno.MemoryUsage } | { supported: false; error: string } {
  try {
    return { supported: true, usage: Deno.memoryUsage() };
  } catch (error) {
    return { supported: false, error: error instanceof Error ? error.message : String(error) };
  }
}

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
    const memBefore = safeMemoryUsage();
    const t0 = performance.now();

    const doc = await PDFDocument.create();
    const page = doc.addPage([400, 200]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText(SWEDISH_SAMPLE, { x: 20, y: 150, size: 12, font });
    page.drawText('TASK-146.1 runtime-bevis — Supabase Edge Runtime (Deno)', {
      x: 20,
      y: 100,
      size: 9,
      font,
    });
    const pdfBytes = await doc.save();

    const t1 = performance.now();
    const memAfter = safeMemoryUsage();

    return new Response(
      JSON.stringify({
        ok: true,
        requestId,
        runtime: {
          // Deno.version finns i CLI-Deno; overifierat i Edge Runtime tills körd —
          // samma försiktighetsprincip som memoryUsage.
          deno: (() => {
            try {
              return Deno.version;
            } catch {
              return null;
            }
          })(),
        },
        pdfBase64: toBase64(pdfBytes),
        pdfSizeBytes: pdfBytes.byteLength,
        sampleText: SWEDISH_SAMPLE,
        timings: {
          generationMs: t1 - t0,
          note: 'wall-clock-proxy för CPU-tid — Edge Runtime exponerar ingen äkta CPU-tids-API till funktionskod',
        },
        memory: memBefore.supported && memAfter.supported
          ? {
              supported: true,
              beforeRssBytes: memBefore.usage.rss,
              afterRssBytes: memAfter.usage.rss,
              beforeHeapUsedBytes: memBefore.usage.heapUsed,
              afterHeapUsedBytes: memAfter.usage.heapUsed,
              deltaRssBytes: memAfter.usage.rss - memBefore.usage.rss,
            }
          : {
              supported: false,
              error: !memBefore.supported ? memBefore.error : !memAfter.supported ? memAfter.error : 'unknown',
            },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'test-pdf-generation',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
