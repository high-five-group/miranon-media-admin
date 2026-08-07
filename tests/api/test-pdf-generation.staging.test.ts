// test-pdf-generation — skarp conformance mot deployad staging-EF
// (TASK-146.1, "Runtime-beviset").
//
// Detta ÄR den nya kontrakts-skarv PRD-kortet (TASK-146, § Testbeslut)
// begär: "PDF-generering har idag ingen skarv i repot. Den behöver ett
// bevis som körs mot den skarpa runtimen, inte mot en Node-proxy." Precis
// som repots övriga *.staging.test.ts-filer bevisar detta test mot en
// REDAN DEPLOYAD funktion (ADR-050: "ingen deploy-automatik, manuell
// `supabase functions deploy`") — inget CI-steg deployar
// test-pdf-generation, den måste redan ligga på staging.
//
// AC #1 (riktig runtime, ej Node): testet anropar en LIVE HTTP-endpoint på
// staging-projektet — svaret kommer alltid ur den skarpa Supabase Edge
// Runtime (Deno), aldrig ur en lokal Node-process.
//
// AC #2 (svensk text korrekt återgiven): pdf-lib komprimerar sina
// content-streams med FlateDecode som default (`useObjectStreams`, verifierat
// lokalt mot pdf-lib@1.17.1 2026-08-07 — content-strömmen är INTE läsbar
// rå-text). Verifieringen inflaterar därför varje `stream…endstream`-block
// med `node:zlib` (Node-inbyggt, INGEN ny dependency) och letar efter den
// exakta WinAnsi-hex-kodade bytesekvensen för teststrängen — samma
// PDF-hex-string-form pdf-lib faktiskt skriver (`<4B76…>`), verifierat
// byte-för-byte lokalt innan detta test skrevs. WinAnsiEncoding delar
// kodpunkt med Latin-1 för hela å/ä/ö/Å/Ä/Ö-intervallet (0xA0–0xFF); bara
// em-dash (—, U+2014 → 0x97) ligger i CP1252:s egna 0x80–0x9F-intervall,
// därav den egna mappningstabellen nedan i stället för ett generiskt
// Latin-1-antagande.
//
// AC #3 (minne/CPU-tid/kallstart): funktionens svar bär de mätvärden
// EF:en själv kan observera (memory.supported kan vara false — se
// funktionens filhuvud för varför det INTE är ett testfel). Kallstart är
// en EXTERN mätning (första vs andra anrop) och görs manuellt vid
// byggtillfället — se skivans slutrapport, inte detta test (ett
// CI-kört test har ingen kontroll över instans-återanvändning mellan
// körningar och kan därför inte bevisa kallstart repeterbart).
//
// AC #4 (bevis eller falsifiering): detta test ÄR den repeterbara,
// CI-körda delen av beviset — varje framtida CI-körning mot staging
// bevisar på nytt att antagandet håller.

import { inflateSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import { classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/test-pdf-generation';

// Identisk sträng som funktionens SWEDISH_SAMPLE (supabase/functions/
// test-pdf-generation/index.ts) — hålls i synk manuellt, samma mönster
// som andra staging-tester håller fältnamn i synk med EF-koden.
const SWEDISH_SAMPLE = 'Kvitto — Åsa Öberg, Café Söderköping. Moms 25% — Björn Ångström.';

// CP1252/WinAnsiEncoding-avvikelser från Latin-1 (bara de tecken som
// faktiskt förekommer i teststrängen). Allt annat ASCII-tecken (<128)
// mappas 1:1 på sin charCode.
const WINANSI_OVERRIDES: Record<string, number> = {
  '—': 0x97, // em-dash —
};

function winAnsiHex(text: string): string {
  const bytes: number[] = [];
  for (const ch of text) {
    const override = WINANSI_OVERRIDES[ch];
    if (override !== undefined) {
      bytes.push(override);
      continue;
    }
    const code = ch.codePointAt(0);
    if (code === undefined) throw new Error(`Ogiltigt tecken i teststräng: ${ch}`);
    if (code >= 0x100) {
      throw new Error(
        `Tecken utanför WinAnsi/Latin-1-intervallet, lägg till override: ${ch} (U+${code.toString(16)})`,
      );
    }
    bytes.push(code);
  }
  return bytes
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Extraherar och konkatenerar text ur ALLA framgångsrikt inflaterade
 * `stream…endstream`-block i en rå PDF-byteström. pdf-lib komprimerar
 * flera oberoende delar (sid-innehåll, objektström, xref-ström) — vi bryr
 * oss inte om VILKEN som bär vår text, bara att den finns NÅGONSTANS i den
 * sammanslagna, dekomprimerade strömmen (den 60+ tecken långa hex-sekvensen
 * är i praktiken unik för denna PDF).
 */
function extractInflatedText(pdfBytes: Buffer): string {
  const raw = pdfBytes.toString('latin1');
  let decoded = '';
  let searchFrom = 0;
  for (;;) {
    const streamIdx = raw.indexOf('stream', searchFrom);
    if (streamIdx === -1) break;
    let start = streamIdx + 'stream'.length;
    if (raw[start] === '\r') start++;
    if (raw[start] === '\n') start++;
    const endIdx = raw.indexOf('endstream', start);
    if (endIdx === -1) break;
    const chunk = pdfBytes.subarray(start, endIdx);
    try {
      decoded += inflateSync(chunk).toString('latin1');
    } catch {
      // Inte alla stream-block är FlateDecode (eller vårt regex-baserade
      // snitt kan vara off-by-a-few) — det är förväntat, hoppa vidare.
    }
    searchFrom = endIdx + 'endstream'.length;
  }
  return decoded;
}

interface PdfGenerationResponse {
  ok: boolean;
  requestId: string;
  runtime: { deno: { deno: string; v8: string; typescript: string } | null };
  pdfBase64: string;
  pdfSizeBytes: number;
  sampleText: string;
  timings: { generationMs: number; note: string };
  memory:
    | {
        supported: true;
        beforeRssBytes: number;
        afterRssBytes: number;
        beforeHeapUsedBytes: number;
        afterHeapUsedBytes: number;
        deltaRssBytes: number;
      }
    | { supported: false; error: string };
}

test.describe('test-pdf-generation — skarp runtime-bevis (TASK-146.1)', () => {
  test('genererar en giltig PDF i den skarpa Edge Runtime, ej Node', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as PdfGenerationResponse;

    expect(body.ok).toBe(true);
    expect(body.sampleText).toBe(SWEDISH_SAMPLE);
    expect(body.pdfSizeBytes).toBeGreaterThan(0);

    // AC #1 — strukturellt giltig PDF, genererad server-side (Deno Edge
    // Runtime — svaret finns bara om Deno.serve i den skarpa sandlådan
    // körde pdf-lib utan att kasta).
    const pdfBytes = Buffer.from(body.pdfBase64, 'base64');
    expect(pdfBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdfBytes.toString('latin1').trimEnd().endsWith('%%EOF')).toBe(true);

    // AC #2 — svensk text korrekt WinAnsi-kodad i den FAKTISKA genererade
    // filen (inte bara i request-payloaden vi skickade in — vi skickade
    // ingen; strängen är hårdkodad i EF:en och kommer ENDAST tillbaka via
    // den riktiga PDF-byte-strömmen).
    const decoded = extractInflatedText(pdfBytes);
    const expectedHex = winAnsiHex(SWEDISH_SAMPLE);
    expect(
      decoded.toUpperCase().includes(expectedHex),
      `Förväntad WinAnsi-hex-sekvens saknas i dekomprimerad content-ström.\n` +
        `Förväntad (hex): ${expectedHex}\n` +
        `Dekomprimerat innehåll (första 500 tecken): ${decoded.slice(0, 500)}`,
    ).toBe(true);

    // AC #3 — mätvärdena finns bokförda i svaret (de faktiska talen
    // rapporteras i skivans slutrapport, inte som ett tröskel-assert här:
    // riggen mäter, den dömer inte — samma princip som metrics:flake).
    expect(typeof body.timings.generationMs).toBe('number');
    expect(body.timings.generationMs).toBeGreaterThan(0);
    if (body.memory.supported) {
      // MÄTT (2026-08-07, skarpt anrop): Deno.memoryUsage() ÄR anropbart i
      // Supabase Edge Runtime, men `rss` returnerar konsekvent 0 — plattformen
      // populerar inte det fältet i denna sandlådemodell (delad isolate,
      // sannolikt av samma skäl som andra process-nivå-API:er är begränsade
      // här). `heapUsed` ÄR meningsfullt och icke-noll — asserta på det
      // fältet, inte på rss. Detta är ett bokfört plattformsfaktum, inte ett
      // gissat värde.
      expect(body.memory.afterHeapUsedBytes).toBeGreaterThan(0);
      expect(typeof body.memory.afterRssBytes).toBe('number');
    } else {
      // Deno.memoryUsage() overifierad i Edge Runtime — en explicit
      // "unsupported" är ett giltigt, mätt utfall, inte ett testfel.
      expect(typeof body.memory.error).toBe('string');
    }
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.get(`${config.baseUrl}${ENDPOINT}`);
    await classify401Body(res);
  });

  test('CORS preflight: tillåten origin → 200 + Access-Control-Allow-Origin speglar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const res = await request.fetch(`${config.baseUrl}${ENDPOINT}`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
