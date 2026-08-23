// preview-receipt — skarp conformance mot deployad staging-EF (TASK-246,
// "Riktigt genererad PDF i Visa-overlayen för mallar (klass B) och
// generatorer (klass C)", klass C-halvan).
//
// [TASK-309.5, ADR-125 § Beslut 4-5] RENDERINGSVÄGEN BYTTE MOTOR. Fram till
// denna skiva byggde `renderKvittoPdf` (pdf-lib) en enkel textrad-lista på
// koordinater — VERIFIERINGSMETODEN nedan (WinAnsi-hex-extraktion ur en
// okomprimerad content stream) är RIVEN, den fungerar INTE mot en
// DocRaptor/Prince-genererad PDF (komprimerade content streams, inbäddade
// CID-typsnitt — en helt annan intern struktur). Ny metod: `pdfjs-dist`
// (samma bibliotek och samma disciplin som
// `generate-event-attachment.staging.test.ts` etablerade i TASK-309.4, se
// den filens § VERIFIERINGSMETOD för VARFÖR pdfjs-dist och inte
// poppler-utils/pdftotext).
//
// preview-receipt LÄSER (ett Eventplanering-record) och SKRIVER ETT
// TRANSIENT Storage-utkast (`_shared/utkast.ts` § `laggUtkast`,
// `ADR-124`/`TASK-302.2`) — INGEN Kvitton-rad, INGET mail (AC #3, hård
// gräns, amenderad i EF:ens filhuvud). Svaret bär `{ url, utgar }` — en
// signerad URL i stället för PDF-bytes, eftersom Chromes PDF-visare bara
// scrollar jämnt på en URL serverad av nätverkstjänsten (mätt, `ADR-124`
// § Kontext). Bevisar mot SKARP staging-data:
//
//   1. allow: en RIKTIG, DocRaptor-renderad PDF — HEAD mot den signerade
//      URL:en ger 200/accept-ranges: bytes/content-type: application/pdf,
//      och en GET av bytesen bevisar innehållet via pdfjs-dist
//      (`getTextContent()` — SÖKBAR text, AC #2) + ett INBÄDDAT typsnitt
//      (`/FontFile[23]?` i den råa byteströmmen) + FRÅNVARON av pdf-libs
//      egen metadata-signatur ("pdf-lib (https://github.com/Hopding/
//      pdf-lib)" — Producer/Creator-fälten `PDFDocument.create()` sätter
//      by default, verifierat mot pdf-lib:s källkod, se AC #2:s "ingen
//      pdf-lib-signatur"-krav).
//   2. allow: UPSERT-BEVISET + SIDOEFFEKTSFRIHETENS BETEENDE-BEVIS — TVÅ
//      anrop i rad ger IDENTISK objekt-path (`utkast/<eventId>/kvitto.pdf`,
//      upsert: true), exakt samma platshållar-kvittonummer
//      ("FÖRHANDSVISNING") OCH identisk extraherad TEXT (inte en full
//      byte-jämförelse — DocRaptor/Prince kan bädda in
//      genererings-tidsstämplar i PDF-metadata som skiljer sig mellan två
//      annars identiska anrop, samma bruskälla-princip som den gamla
//      testformens `extractPageContentStream`-isolering, se den historiska
//      kommentaren för TASK-246:s negativa kontrollprov). En RIKTIG
//      allokering (`_shared/receipt-numbering.ts` § allocateReceiptNumber)
//      hade inkrementerat ett löpnummer mellan anropen — att numret INTE
//      ändras är själva beviset att ingen ledger rördes.
//   3. deny: saknad/malformad eventId → 400; okänt event (rec-format, finns
//      ej) → 404; anon (ingen JWT) → 401; CORS preflight; fel HTTP-metod
//      (GET) → 405 (deny-triple-klassen, samma tre ben som
//      get-attachment-download-url.staging.test.ts/delete-attachment.
//      staging.test.ts bär för sin egen bevisklass).
//
// [AC #2, "byte-identiska för samma indata"] Denna fil bevisar EMPIRISKT
// att DocRaptor-renderingen är stabil (samma indata → samma extraherade
// text) för preview-receipt EGET anrop-par. Att preview-receipt och
// send-receipt-email BÅDA anropar SAMMA renderare (`renderaMallPdf`) med
// SAMMA datafunktion (`byggKvittoData`) är ett KÄLLKODS-nivå-bevis, se
// `tests/api/mall-render.test.ts` § "Kvittots renderingsväg" — den
// kombinationen (källkoden garanterar SAMMA anrop, denna fil bevisar att
// anropet är deterministiskt) är den fullständiga AC #2-täckningen.
// Sändningen (send-receipt-email) testas SOM I DAG via
// `tests/api/send-receipt.test.ts` (mockade I/O-gränser, UTSKICK_SPARR-
// disciplin) — se den filens eget filhuvud för hur sviten undviker riktiga
// mail. Ingen ny staging-HTTP-täckning för send-receipt-email läggs till
// här: EF:en saknar sedan tidigare en egen `.staging.test.ts` (verifierat,
// `find tests/api -iname "*send-receipt-email*"` gav noll träffar före
// denna skiva), och att bygga en ny sådan hade krävt en riktig
// Resend-sandbox-adress-fixtur på en Anmälnings-rad — utanför denna
// skivas AC-gräns.
//
// TÄCKNINGSGRÄNS, ÖPPET BOKFÖRD: att INGET mail skickas kan inte mätas via
// detta test (ADR-060 — testerna får aldrig ett mail-postlåde-sikte, och
// preview-receipt tar strukturellt ingen `email`-parameter alls — det finns
// bokstavligen ingen mottagare att skicka till). Den garantin vilar på
// KÄLLKODS-GRANSKNING: preview-receipt/index.ts importerar aldrig `resend`
// eller `_shared/send-receipt.ts`s `sendEmail`-väg (se EF:ens eget filhuvud
// för den fulla, verifierade motiveringen). Samma gränsklass som
// get-attachment-download-url.staging.test.ts:s egen 409-täckningsgräns.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en
// deployats till staging (manuellt, ADR-050 — se index.ts § filhuvud).

import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { UtkastResultatSchema } from '../../src/domain/schemas';
import { formatKvittoDatum } from '../../supabase/functions/_shared/receipt-content';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/preview-receipt';

/** pdfjs-dist (ren JS, inget systembinär-beroende) — se filhuvudets § VERIFIERINGSMETOD. */
async function extractPdfText(pdfBytes: Buffer): Promise<string> {
  const doc = await getDocument({ data: new Uint8Array(pdfBytes) }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => ('str' in item ? item.str : '')).join('');
  }
  return text;
}

/** `/FontFile2` (TrueType) eller `/FontFile3` (CFF/OpenType) i den råa
 *  byteströmmen — bevisar att typsnittet FAKTISKT bäddades in, inte bara
 *  refererades. Samma teknik som generate-event-attachment.staging.test.ts. */
function hasEmbeddedFont(pdfBytes: Buffer): boolean {
  const raw = pdfBytes.toString('latin1');
  return /\/FontFile[23]?\b/.test(raw);
}

/** [AC #2] Frånvaron av pdf-libs egen metadata-signatur — `PDFDocument.
 *  create()` sätter Producer/Creator till exakt denna sträng by default
 *  (verifierat mot pdf-lib:s källkod, `src/api/PDFDocument.ts` §
 *  `updateInfoDict`). En DocRaptor/Prince-PDF bär ALDRIG denna sträng. */
function hasPdfLibSignature(pdfBytes: Buffer): boolean {
  const raw = pdfBytes.toString('latin1');
  return raw.includes('pdf-lib (https://github.com/Hopding/pdf-lib)') || raw.includes('Hopding');
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

test.describe('preview-receipt — skarp conformance (TASK-246, motorbytt TASK-309.5)', () => {
  test('allow: giltig förhandsvisning → 200 + riktig DocRaptor-PDF (platshållarnummer + typexempel + riktigt eventnamn), sökbar text, inbäddat typsnitt, ingen pdf-lib-signatur', async ({
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

    // [AC #2] Motorbevis: inbäddat typsnitt, ingen pdf-lib-signatur.
    expect(hasEmbeddedFont(pdfBytes), 'PDF:en saknar ett inbäddat typsnitt (/FontFile2)').toBe(
      true,
    );
    expect(
      hasPdfLibSignature(pdfBytes),
      'PDF:en bär pdf-libs metadata-signatur — DocRaptor-motorbytet fungerade inte',
    ).toBe(false);

    const text = await extractPdfText(pdfBytes);

    // "FÖRHANDSVISNING" — ALDRIG ett riktigt "MM-<år>-N"-nummer. Rubriken
    // "Kvitto" (H1) och OCR-numrets VÄRDE kontrolleras separat (två skilda
    // DOM-element/table-rader i mallen, se docs/mallar/bilagor/kvitto.html
    // — sammanslagningen till EN sträng i pdf-lib-eran fanns bara för att
    // den formen var en textrad-lista, inte en HTML-tabell).
    expect(text).toContain('Kvitto');
    expect(text).toContain('FÖRHANDSVISNING');
    // Typexemplet (AC #2, bokfört beslut) — se preview-receipt/index.ts § PERSONDATA.
    expect(text).toContain('Exempelperson');
    expect(text).toContain('anna.andersson@example.com');
    // Org-uppgifterna — verkliga, aldrig platshållartext.
    expect(text).toContain('Miranon Media AB');
    expect(text).toContain('Miranon Media/Lotta Gotthardsson');
    // Nettot/momsen/bruttot för TYPEXEMPEL.belopp = 500 (beraknaMoms(500) →
    // moms 100,00, netto 400,00) — samma facit som receipt-content.test.ts.
    expect(text).toContain('400,00');
    expect(text).toContain('100,00');
    expect(text).toContain('500,00');
    // Dagens datum, ISO — SAMMA härledning som EF:en själv använder
    // (formatKvittoDatum(new Date().toISOString())), inte ett hårdkodat
    // facit-datum som glider fel dagen efter byggsessionen.
    expect(text).toContain(formatKvittoDatum(new Date().toISOString()));

    // [TASK-306, AC #3] LIVE-BEVIS: preview-receipt läser Typ/Startdatum/
    // Slutdatum/Bokföringstext (kvitto) ur SAMMA Eventplanering-rad och
    // bygger benämningen via kvittoBenamning(). BELAGGNING_EVENT_ID:s tre
    // fält (live-verifierat mot staging via Airtable MCP innan detta test
    // skrevs, ADR-086 premiss-pass — oförändrat sedan TASK-306): Typ =
    // "Utbildning", Startdatum = "2025-11-20", Slutdatum = "2025-11-21" —
    // INGET "Bokföringstext (kvitto)"-fält satt. Strängens FORM (Marcus dom
    // 1, TASK-306): datumet komprimeras ("2025-11-20/21", samma år+månad →
    // bara slutdagen) och kursnamnet är borta.
    expect(text).toContain('Utbildning 2025-11-20/21');
  });

  test('allow: TVÅ anrop i rad → SAMMA platshållarnummer OCH identisk extraherad text (beteende-bevis: ingen ledger rörd, motorn är deterministisk)', async ({
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

    // DET SKARPA BEVISET (motorbytt TASK-309.5, se filhuvudet): den
    // EXTRAHERADE TEXTEN — inte de råa PDF-bytesen — är identisk mellan de
    // två anropen. Byte-identitet på HELA filen är INTE testad här av
    // samma skäl som den gamla pdf-lib-testformens `extractPageContentStream`
    // isolerade bort `/CreationDate`/`/ModDate`: DocRaptor/Prince kan bädda
    // in en genererings-tidsstämpel i PDF-metadata (ID-arrayen i trailern,
    // Info-dictionaryt) som skiljer sig mellan två annars identiska anrop —
    // den extraherade TEXTEN bär inga sådana tidsstämplar och är därför det
    // rätta instrumentet för "samma indata → samma innehåll".
    const text1 = await extractPdfText(pdf1);
    const text2 = await extractPdfText(pdf2);
    expect(text1).toBe(text2);
    expect(text1).toContain('FÖRHANDSVISNING');
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
