// @ts-nocheck — Deno Edge Function (Deno-globaler; typas vid deploy av
// `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som send-email/index.ts och test-pdf-generation/index.ts.
// INGÅR INTE i tsconfig.edge-shared.json (den lilla listan pure
// _shared-filer som FÅR äkta tsc).
//
// test-static-files — TASK-309.1 "Skiva 0: minimaltest — bundlade
// mallfiler i en Edge Function via staging-deploy (static_files)".
//
// STAGING-ONLY testharness-EF, samma mönster som test-pdf-generation/
// test-attachments-storage: MEDVETET UTELÄMNAD ur
// .prod-functions-allowlist.conf — får ALDRIG nå produktion (Fas 7-skuld,
// tasks/lessons.md L115). Rör inte den filen för denna funktion.
//
// SYFTE (ADR-125 § Beslut 4): ADR-125 sätter `static_files` som PRIMÄR
// bundlingsväg för `supabase/functions/_shared/mallar/` — men maskinen
// som deployar saknar Docker (mätt: `command -v docker` → command not
// found, `pgrep docker` tomt), så `supabase functions deploy` går via
// CLI:ts API-bundling, för vilken static_files-stödet var OBELAGT
// (research-passet `mallar-server-side-docraptor-prod-2026-08-23.md`
// § Delfråga 1 + § Vad jag inte kunde belägga). Denna funktion mätte,
// I ORDNING, samtliga tre vägar ADR-125 § 4 pekar ut:
//
//   (a) static_files + `Deno.readFile(new URL('../_shared/mallar/x', …))`.
//       UTFALL (mätt 2026-08-23): FALLERAR. CLI:t laddar upp filerna som
//       "assets" vid deploy (loggat verbatim), men den körande Edge
//       Runtime-sandlådan svarar `NotFound` på `Deno.readFile` för den
//       exakta bundlade sökvägen, och `NotSupported` på
//       `Deno.readDir`/`Deno.stat` — även för funktionens EGEN mapp. I
//       denna API-bundlings-väg (ingen Docker) placeras static_files-
//       filerna INTE i den körande instansens filsystem. Mätt HÄR ändå
//       (staticFiles-nyckeln i svaret) som ett levande negativt kvitto,
//       inte bara ett historiskt fynd i denna kommentar.
//   (b) text-import `with { type: 'text' }`. UTFALL (mätt 2026-08-23):
//       FALLERAR HÅRDARE ÄN (a) — deployen SJÄLV nekas (400 Bad Request,
//       "The import attribute type of 'text' is unsupported"). Denna
//       bundlare stödjer inte import-attribut alls. Koden för detta
//       försök togs bort igen (en trasig import stoppar HELA bundlen —
//       kan inte samexistera med (c) i samma funktion); det skarpa
//       CLI-felmeddelandet är bokfört verbatim i ADR-125 § Updates i
//       stället.
//   (c) genererade TS-strängmoduler (`minimaltest.text.ts`,
//       `carlito-regular.base64.ts` — vanliga `export const`, ingen
//       import-attribut-syntax). UTFALL: mäts av `matTsStrangmodulVagen`
//       nedan — se svaret. Detta är en REN ES-modul-import, samma
//       mekanism som varje `_shared/*.ts`-import redan använder i detta
//       repo, så den förväntas fungera oavsett bundlingsläge.
//
// AUTENTISERING: samma gateway-försvar som test-pdf-generation
// (requireUser, verify_jwt=true i config.toml). Funktionen rör ingen
// Airtable-data och ingen Storage — bara kastbara filer i sitt eget bundle.

import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
// Fallback (c) — vanliga TS-modulexporter, genererade av byggsessionen
// (se filhuvud). Kastbara, samma klass som resten av `_shared/mallar/` i
// denna minimaltest-skiva.
import { carlitoRegularBase64 } from '../_shared/mallar/carlito-regular.base64.ts';
import { minimaltestHtml as minimaltestHtmlViaTsModul } from '../_shared/mallar/minimaltest.text.ts';

const HTML_URL = new URL('../_shared/mallar/minimaltest.html', import.meta.url);
const TTF_URL = new URL('../_shared/mallar/Carlito-Regular.ttf', import.meta.url);

function magicHex(bytes: Uint8Array): string {
  return Array.from(bytes.slice(0, 4))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
}

async function matStaticFilesVagen(): Promise<Record<string, unknown>> {
  try {
    const htmlBytes = await Deno.readFile(HTML_URL);
    const html = new TextDecoder('utf-8').decode(htmlBytes);
    const ttfBytes = await Deno.readFile(TTF_URL);
    return {
      ok: true,
      html: { bytes: htmlBytes.byteLength, forstaRad: html.split('\n')[0] ?? '' },
      ttf: { bytes: ttfBytes.byteLength, magic: magicHex(ttfBytes) },
    };
  } catch (e) {
    return {
      ok: false,
      errorName: e instanceof Error ? e.name : 'unknown',
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function matTsStrangmodulVagen(): Record<string, unknown> {
  try {
    const html = minimaltestHtmlViaTsModul;
    const htmlBytes = new TextEncoder().encode(html).byteLength;
    const ttfBytes = base64ToBytes(carlitoRegularBase64);
    return {
      ok: true,
      html: { bytes: htmlBytes, forstaRad: html.split('\n')[0] ?? '' },
      ttf: { bytes: ttfBytes.byteLength, magic: magicHex(ttfBytes) },
    };
  } catch (e) {
    return {
      ok: false,
      errorName: e instanceof Error ? e.name : 'unknown',
      errorMessage: e instanceof Error ? e.message : String(e),
    };
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
    const staticFiles = await matStaticFilesVagen();
    const tsStrangmodul = matTsStrangmodulVagen();

    return new Response(JSON.stringify({ staticFiles, tsStrangmodul }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'test-static-files',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
