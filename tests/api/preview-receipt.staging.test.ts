// preview-receipt — skarp conformance mot deployad staging-EF (TASK-246,
// "Riktigt genererad PDF i Visa-overlayen för mallar (klass B) och
// generatorer (klass C)", klass C-halvan).
//
// preview-receipt LÄSER (ett Eventplanering-record) och SKRIVER ETT
// TRANSIENT Storage-utkast (`_shared/utkast.ts` § `laggUtkast`,
// `ADR-124`/`TASK-302.2`) — INGEN Kvitton-rad, INGET mail (AC #3, hård
// gräns, amenderad i EF:ens filhuvud). Svaret bytte `{ pdfBase64 }` →
// `{ url, utgar }` — en signerad URL i stället för PDF-bytes, eftersom
// Chromes PDF-visare bara scrollar jämnt på en URL serverad av
// nätverkstjänsten (mätt, `ADR-124` § Kontext). Bevisar mot SKARP
// staging-data:
//   1. allow: en RIKTIG, pdf-lib-renderad PDF — HEAD mot den signerade
//      URL:en ger 200/accept-ranges: bytes/content-type: application/pdf
//      (samma disciplin som test-docraptor-render-utkast.staging.test.ts,
//      TASK-302.1), och en GET av bytesen bevisar innehållet med samma
//      inflate+WinAnsi-hex-extraktion som generate-event-attachment.
//      staging.test.ts (TASK-146.5) etablerade, mot kvittots rader
//      (`kvittoRader`, _shared/receipt-content.ts): "FÖRHANDSVISNING"
//      (platshållar-numret), "Exempelperson" (typexemplet, AC #2) och det
//      RIKTIGA eventnamnet (BELAGGNING_EVENT_ID:s "Event (source)"-fält).
//   2. allow: UPSERT-BEVISET + SIDOEFFEKTSFRIHETENS BETEENDE-BEVIS — TVÅ
//      anrop i rad ger IDENTISK objekt-path (`utkast/<eventId>/kvitto.pdf`,
//      upsert: true) OCH exakt samma platshållar-kvittonummer
//      ("FÖRHANDSVISNING") båda gångerna. En RIKTIG allokering
//      (`_shared/receipt-numbering.ts` § allocateReceiptNumber) hade
//      inkrementerat ett löpnummer mellan anropen — att numret INTE ändras
//      är själva beviset att ingen ledger rördes, mätt genom API:t (svart
//      låda), inte bara läst i källkoden.
//   3. deny: saknad/malformad eventId → 400; okänt event (rec-format, finns
//      ej) → 404; anon (ingen JWT) → 401; CORS preflight; fel HTTP-metod
//      (GET) → 405 (deny-triple-klassen, samma tre ben som
//      get-attachment-download-url.staging.test.ts/delete-attachment.
//      staging.test.ts bär för sin egen bevisklass).
//
// TÄCKNINGSGRÄNS, ÖPPET BOKFÖRD: att INGET mail skickas kan inte mätas via
// detta test (ADR-060 — testerna får aldrig ett mail-postlåde-sikte, och
// preview-receipt tar strukturellt ingen `email`-parameter alls — det finns
// bokstavligen ingen mottagare att skicka till). Den garantin vilar på
// KÄLLKODS-GRANSKNING: preview-receipt/index.ts importerar aldrig `resend`
// eller `_shared/send-receipt.ts`s `sendEmail`-väg (se EF:ens eget filhuvud
// för den fulla, verifierade motiveringen, inklusive nyansen kring
// receipt-content.ts:s type-only-import). Samma gränsklass som
// get-attachment-download-url.staging.test.ts:s egen 409-täckningsgräns.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en
// deployats till staging (manuellt, ADR-050 — se index.ts § filhuvud).

import { inflateSync } from 'node:zlib';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { UtkastResultatSchema } from '../../src/domain/schemas';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/preview-receipt';

// Samma teknik som generate-event-attachment.staging.test.ts § winAnsiHex/
// extractInflatedText (TASK-146.5) — duplicerad per den filens eget etablerade
// mönster (test-only-helpers hålls lokalt per svit, inte delade via _shared).
function winAnsiHex(text: string): string {
  const bytes: number[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code === undefined) throw new Error(`Ogiltigt tecken i teststräng: ${ch}`);
    if (code >= 0x100) {
      throw new Error(`Tecken utanför WinAnsi/Latin-1-intervallet: ${ch} (U+${code.toString(16)})`);
    }
    bytes.push(code);
  }
  return bytes
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

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
      // Inte alla stream-block är FlateDecode — förväntat, hoppa vidare.
    }
    searchFrom = endIdx + 'endstream'.length;
  }
  return decoded;
}

/**
 * Dekomprimerar ENDAST DET FÖRSTA stream…endstream-blocket — sidans egen
 * CONTENT STREAM (de faktiskt RITADE `Tj`-textoperatorerna), INTE de SENARE
 * blocken (en komprimerad ObjStm som bär Info-dictionaryt med `/CreationDate`
 * + `/ModDate`, samt en XRef-ström). Skillnaden mot `extractInflatedText`
 * (ovan, som konkatenerar ALLA block) spelar roll HÄR specifikt: två annars
 * IDENTISKA anrop till preview-receipt ger PDF-lib-genererade tidsstämplar
 * som skiljer sig sekund för sekund — ett fullt-blob-likhetstest (som
 * `extractInflatedText` hade gett) hade FLAKAT på den bruskällan ensam,
 * blint för om kvittonumret faktiskt var stabilt eller inte (fångat live,
 * TASK-246-byggsessionens negativa kontrollprov, se testet nedan för
 * instansen). Denna funktion isolerar bort bruset helt: sidans content-
 * stream innehåller INGA datum, bara ritkommandon — deterministisk given
 * identisk textinput.
 */
function extractPageContentStream(pdfBytes: Buffer): string {
  const raw = pdfBytes.toString('latin1');
  const streamIdx = raw.indexOf('stream');
  if (streamIdx === -1) throw new Error('Ingen stream hittad i PDF-bytesen');
  let start = streamIdx + 'stream'.length;
  if (raw[start] === '\r') start++;
  if (raw[start] === '\n') start++;
  const endIdx = raw.indexOf('endstream', start);
  if (endIdx === -1) throw new Error('Ingen endstream hittad i PDF-bytesen');
  const chunk = pdfBytes.subarray(start, endIdx);
  return inflateSync(chunk).toString('latin1');
}

interface PreviewBody {
  eventId?: unknown;
}

function postPreview(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: PreviewBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${ENDPOINT}`, { headers, data: body });
}

/** Extraherar den dekomprimerade textens hex-representation — ett kort hjälp-
 * verb för `expect(...).toContain(winAnsiHex(...))`-anrop nedan. */
function decodedHexIncludes(pdfBytes: Buffer, text: string): boolean {
  const decoded = extractInflatedText(pdfBytes).toUpperCase();
  return decoded.includes(winAnsiHex(text));
}

test.describe('preview-receipt — skarp conformance (TASK-246)', () => {
  test('allow: giltig förhandsvisning → 200 + riktig PDF (platshållarnummer + typexempel + riktigt eventnamn)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postPreview(request, config, jwt, { eventId: BELAGGNING_EVENT_ID });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const rawBody = JSON.parse(raw) as Record<string, unknown>;

    // STRUKTURBEVIS — svaret bär url+utgar+requestId, inget persistens-fält,
    // och den GAMLA pdfBase64-formen (ADR-124, TASK-302.2) är verifierat
    // BORTA — inte bara utbytt i typen.
    expect(rawBody.pdfBase64).toBeUndefined();
    expect(rawBody.receiptId).toBeUndefined();
    expect(rawBody.kvittonummer).toBeUndefined();
    expect(rawBody.status).toBeUndefined();
    const body = UtkastResultatSchema.parse(rawBody);
    expect(new Date(body.utgar).getTime()).toBeGreaterThan(Date.now());
    expect(new URL(body.url).pathname).toContain(`utkast/${BELAGGNING_EVENT_ID}/kvitto.pdf`);

    // ÅTKOMST-BEVISET: URL:en prövas faktiskt (HEAD), inte bara plausibel
    // form — samma disciplin som test-docraptor-render-utkast.staging.test.ts.
    const head = await request.head(body.url);
    expect(head.status(), 'signerad URL gav inte 200 på HEAD').toBe(200);
    expect(head.headers()['accept-ranges']).toBe('bytes');
    expect(head.headers()['content-type']).toMatch(/^application\/pdf/);

    const pdfResponse = await request.get(body.url);
    const pdfBytes = Buffer.from(await pdfResponse.body());
    expect(pdfBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    // "FÖRHANDSVISNING" — ALDRIG ett riktigt "MM-<år>-N"-nummer.
    expect(decodedHexIncludes(pdfBytes, 'Kvitto FÖRHANDSVISNING')).toBe(true);
    // Typexemplet (AC #2, bokfört beslut) — se preview-receipt/index.ts § PERSONDATA.
    expect(decodedHexIncludes(pdfBytes, 'Kund: Exempelperson')).toBe(true);
    // Eventets namn ÄR verkligt — 'Event (source)' för BELAGGNING_EVENT_ID är
    // 'Fjärrskådning' (live-verifierat mot staging via Airtable MCP innan
    // detta test skrevs, ADR-086 premiss-pass — DENNA sträng, INTE
    // Eventlabel-formelns 'ZZ-belaggning-fixtur…', är vad
    // `selectName(f['Event (source)'])` faktiskt läser). Å-tecknet (WinAnsi
    // 0xE5) bevisar samtidigt att preview-receipt hanterar svenska tecken i
    // EVENTDATA, inte bara i den hårdkodade mall-brödtexten (den bevisningen
    // gäller enbart klass B, se generate-event-attachment.staging.test.ts).
    expect(decodedHexIncludes(pdfBytes, 'Fjärrskådning')).toBe(true);

    // [TASK-306, AC #3] LIVE-BEVIS: preview-receipt läser Typ/Startdatum/
    // Slutdatum/Bokföringstext (kvitto) ur SAMMA Eventplanering-rad (utöver
    // Event (source) ovan) och bygger benämningen via kvittoBenamning().
    // BELAGGNING_EVENT_ID:s fyra fält (live-verifierat mot staging via
    // Airtable MCP innan detta test skrevs, ADR-086 premiss-pass): Typ =
    // "Utbildning", Startdatum = "2025-11-20", Slutdatum = "2025-11-21" —
    // INGET "Bokföringstext (kvitto)"-fält satt (fixturen föregår TASK-306).
    // Det BEVISAR "tomt → utelämnat" (beslut a) LIVE, mot en verklig rad,
    // utan att mutera den delade fixturen (TASK-6-klassen: delade staging-
    // fixturer muteras ALDRIG) — "ifyllt → i benämningen"-halvan är fullt
    // täckt av `kvittoBenamning()`s enhetstester
    // (tests/api/receipt-content.test.ts § "kvittoBenamning") plus en
    // ENGÅNGS live-verifiering mot ett temporärt sentinel-event (skapat och
    // raderat via Airtable MCP), bokförd i TASK-306:s slutrapport — inget
    // EF-skrivbart fält finns för denna manuella, Lotta-ifyllda kolumn
    // (`_shared/field-allowlists.ts` saknar en 'Bokföringstext (kvitto)'-
    // post för `create-event`/`update-event`, verifierat), så en andra
    // automatiserad "ifyllt"-gren hade krävt en NY testhärnas-EF enbart för
    // detta — scope-creep utanför detta korts gräns.
    expect(decodedHexIncludes(pdfBytes, 'Utbildning, 2025-11-20 - 2025-11-21, Fjärrskådning')).toBe(
      true,
    );
  });

  test('allow: TVÅ anrop i rad → SAMMA platshållarnummer båda gångerna (beteende-bevis: ingen ledger rörd)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res1 = await postPreview(request, config, jwt, { eventId: BELAGGNING_EVENT_ID });
    expect(res1.status(), await res1.text()).toBe(200);
    const body1 = UtkastResultatSchema.parse(await res1.json());
    const pdfRes1 = await request.get(body1.url);
    const pdf1 = Buffer.from(await pdfRes1.body());

    const res2 = await postPreview(request, config, jwt, { eventId: BELAGGNING_EVENT_ID });
    expect(res2.status(), await res2.text()).toBe(200);
    const body2 = UtkastResultatSchema.parse(await res2.json());
    const pdfRes2 = await request.get(body2.url);
    const pdf2 = Buffer.from(await pdfRes2.body());

    // UPSERT-BEVISET (samma teknik som test-docraptor-render-utkast.
    // staging.test.ts, TASK-302.1): samma eventId+typ ⇒ IDENTISK objekt-path
    // trots olika signerings-token.
    expect(
      new URL(body2.url).pathname,
      'andra anropet skapade ett NYTT objekt i stället för upsert',
    ).toBe(new URL(body1.url).pathname);

    // BÅDA innehåller platshållaren (substring-check, delad grund).
    expect(decodedHexIncludes(pdf1, 'Kvitto FÖRHANDSVISNING')).toBe(true);
    expect(decodedHexIncludes(pdf2, 'Kvitto FÖRHANDSVISNING')).toBe(true);

    // DET SKARPA BEVISET: sidans CONTENT STREAM (extractPageContentStream —
    // INTE hela blobben, se den funktionens docblock för varför) är
    // BYTE-FÖR-BYTE IDENTISK mellan de två anropen. Två negativa
    // kontrollprov under TASK-246-byggsessionen (2026-08-16), båda körda
    // mot en medvetet trasig staging-deploy INNAN den här formen skrevs:
    //   1. En substring-check ENSAM (raderna ovan) FÅNGADE INTE att
    //      kvittonumret suffixades med `crypto.randomUUID()` i EF:en — det
    //      gamla testet förblev GRÖNT (en äkta blind fläck: "innehåller
    //      FÖRHANDSVISNING" är sant även om strängen är
    //      "FÖRHANDSVISNING-<uuid>").
    //   2. Ett FULLT blob-likhetstest (`extractInflatedText(pdf1) ===
    //      extractInflatedText(pdf2)`, alla stream-block konkatenerade)
    //      FÅNGADE regressionen — men hade FLAKAT även mot KORREKT kod: PDF-
    //      lib stämplar `/CreationDate`/`/ModDate` i en separat, komprimerad
    //      ObjStm, och de skiljer sig sekund för sekund mellan två annars
    //      identiska anrop (empiriskt observerat i kontrollprovets diff).
    // `extractPageContentStream` isolerar bort den bruskällan helt (bara
    // ritkommandon, inga datum) — fångar VARJE avvikelse i det RITADE
    // innehållet (extra tecken, ett inkrementerande löpnummer) utan att
    // flaka på PDF-metadatats naturliga icke-determinism.
    expect(extractPageContentStream(pdf1)).toBe(extractPageContentStream(pdf2));
  });

  test('deny: saknad eventId → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postPreview(request, config, jwt, {});
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/eventId/i);
  });

  test('deny: ogiltig eventId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postPreview(request, config, jwt, { eventId: 'inteEttRecordId' });
    expect(res.status()).toBe(400);
  });

  test('okänt event (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postPreview(request, config, jwt, { eventId: 'recZZZZZZZZZZZZZZ' });
    expect(res.status()).toBe(404);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { eventId: BELAGGNING_EVENT_ID },
    });
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
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('fel HTTP-metod (GET) → 405', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(`${config.baseUrl}${ENDPOINT}?eventId=${BELAGGNING_EVENT_ID}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });
});
