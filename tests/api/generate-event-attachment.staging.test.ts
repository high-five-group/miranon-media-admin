// generate-event-attachment — skarp conformance mot deployad staging-EF
// (TASK-146.5, PROMOVERAD i TASK-309.4 ADR-125 § Beslut 4+5: pdf-lib +
// hårdkodad systemmall → Eta-mallar + DocRaptor, mall-parameter, ersatt-läge).
//
// Bevisar mot SKARP staging-data:
//   1. AC #3 (TASK-309.4): båda mallarna ('bekraftelse'/'deltagarinfo') ger
//      201 + Bilagor-rad med Dokumentklass 'Event-mallad', Mall (rätt
//      singleSelect-namn) och Källhash (64 hex-tecken, SHA-256).
//   2. AC #4 (TASK-309.4): PDF:en i Storage har SÖKBAR åäö-text (verifierad
//      via pdfjs-dist, INTE pdftotext/poppler — se § VERIFIERINGSMETOD) och
//      ett INBÄDDAT typsnitt (`/FontFile2` i den råa byteströmmen — Prince
//      subsettar och bäddar in TrueType-typsnitten som CID-fonter, en helt
//      annan intern struktur än pdf-lib:s WinAnsi/Latin-1-kodning den GAMLA
//      versionen av detta test verifierade — den metoden fungerar INTE
//      längre och är RIVEN, inte bara bytt ut för syns skull).
//   3. Ersatt-läget (ADR-125 § 3): regenererar SAMMA Bilagor-rad (samma
//      attachmentId) — INTE `useReplaceAttachment.ts`s upload-nytt-
//      radera-gammalt-mönster (TASK-147.11, ett annat flöde för klientens
//      manuella filersättning).
//   4. deny: saknad eventId/mall, ogiltigt mall-värde, okänt event → 404,
//      anon → 401, CORS preflight, fel HTTP-metod → 405, ersatt-lägets
//      ägarskaps-guard och mall-matchning.
//   5. [ADR-124, TASK-302.3, OFÖRÄNDRAT FLÖDE] utkastet finns FÖRE skarp
//      generering, saknas EFTER (rensaUtkast).
//
// VERIFIERINGSMETOD (VARFÖR INTE poppler-utils/pdftotext, som
// `scripts/docraptor-minimaltest.mjs`/minimaltestet 2026-08-22 använde):
// `poppler-utils` är INTE förinstallerat på GitHub Actions ubuntu-24.04-
// runnern (verifierat mot `actions/runner-images`s Ubuntu2404-Readme.md,
// 2026-08-23 — noll träffar på "poppler"/"pdftotext"/"pdffonts") och
// `docraptor-minimaltest.mjs` var ALDRIG CI-wirat (bara ett `npm run`-
// devskript). Att lägga till ett NYTT systembinär-beroende i CI för denna
// grind hade krävt en `apt-get install`-rad i ci-suite.yml — en STÖRRE,
// mindre portabel ändring än att använda `pdfjs-dist` (Mozillas PDF.js,
// ren JS, redan branschledarmässig, `npm view pdfjs-dist` visar >150M
// veckovisa nedladdningar) för EXAKT samma verifiering. Provat SKARPT mot
// en riktig Prince-genererad PDF (self-bearing HTML med ett inbäddat
// Carlito-typsnitt, hämtad via den då ännu befintliga
// `test-docraptor-render`) INNAN detta test skrevs — `getTextContent()`
// gav exakt "Åäö minimaltest för pdfjs-dist ÅÄÖ räksmörgås" och den råa
// byteströmmen innehöll `/FontFile2`.
//
// FIXTUR: DOKUMENTUNDERLAG_EVENT_ID (tests/api/fixtures.ts, TASK-309.2) —
// INTE BELAGGNING_EVENT_ID (den gamla, pdf-lib-eran-fixturen): den nya
// fixturen är länkad till en RIKTIGT SEEDAD Eventinnehåll-rad ("Resor i
// medvetandet 1 · Utbildning", verbatim Rogers original-prosa, ADR-125 §
// 2) och bär redan minst en ÖVERSTYRD kopia (Tid/Pris) samt en egen
// agenda-rad — precis den blandning av standard/kopia AC #4 behöver för
// att bevisa att renderaren FAKTISKT använder `_shared/mall-data.ts`s
// `valjKopia`-resolution, inte bara standardvärden. Sentinel + teardown:
// `.purge-staging-policy.json`s `generate-event-attachment-sentineler`-
// target (uppdaterad TASK-309.4 till det nya Namn-mönstret,
// "Bekräftelsebilaga –"/"Deltagarinformation –" + "ZZ-dokumentunderlag-
// fixtur") — bounded ackumulering tolererad, samma disciplin som
// create-event-note-sentineler. Storage-objekten är MEDVETET OPURGADE
// (ingen storage-purge-mekanism finns ännu), samma avgränsning som
// TASK-146.3s egna testobjekt.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).

import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { UtkastResultatSchema } from '../../src/domain/schemas';
import { DOKUMENTUNDERLAG_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/generate-event-attachment';

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
 *  refererades. Latin1-avkodning håller varje byte-värde intakt (samma
 *  teknik som den gamla pdf-lib-eran-hex-extraktionen använde). */
function hasEmbeddedFont(pdfBytes: Buffer): boolean {
  const raw = pdfBytes.toString('latin1');
  return /\/FontFile[23]?\b/.test(raw);
}

interface GenerateBody {
  eventId?: unknown;
  mall?: unknown;
  preview?: unknown;
  ersatt?: unknown;
}

interface GenerateResponse {
  attachment: {
    id: string;
    namn: string;
    storlekBytes: number;
    skapad: string;
    eventId: string;
    dokumentklass: string | null;
    mall: string | null;
    kallhash: string | null;
  };
  record: { id: string; fields: Record<string, unknown> };
  storagePath: string;
  pdfBase64: string;
  requestId: string;
}

function postGenerate(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: GenerateBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${ENDPOINT}`, { headers, data: body });
}

/**
 * [TASK-246, oförändrad mätare] Antalet Bilagor-rader länkade till eventet
 * vars `namn` bär generate-event-attachment:s EGEN naming-signatur för
 * NÅGON av de två mallarna — se den ursprungliga versionen av denna fil
 * (TASK-146.5) för VARFÖR filtrerad räkning (inte total) är nödvändig:
 * DOKUMENTUNDERLAG_EVENT_ID delas READ-ONLY av get-document-sources-
 * sviten, men ANDRA staging-sviter kör parallellt mot HELT ANDRA event —
 * en filtrerad räkning är ändå immun mot den churnen.
 */
const KLASS_B_NAMN_PREFIXES = ['Bekräftelsebilaga – ', 'Deltagarinformation – '];

async function countKlassBAttachments(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
): Promise<number> {
  const res = await request.get(
    `${config.baseUrl}/functions/v1/get-event-attachments?eventId=${eventId}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  const raw = await res.text();
  expect(res.status(), `get-event-attachments misslyckades: ${raw}`).toBe(200);
  const body = JSON.parse(raw) as { attachments: { namn?: unknown }[] };
  return body.attachments.filter((a) => {
    const namn = a.namn;
    return (
      typeof namn === 'string' && KLASS_B_NAMN_PREFIXES.some((prefix) => namn.startsWith(prefix))
    );
  }).length;
}

test.describe('generate-event-attachment — skarp conformance (TASK-309.4, ADR-125)', () => {
  test('allow: mall="bekraftelse" → 201 + skriv-bevis (Mall/Källhash) + sökbar text + inbäddat typsnitt', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as GenerateResponse;

    expect(body.record.id.startsWith('rec')).toBe(true);
    expect(body.record.fields['Event']).toEqual([DOKUMENTUNDERLAG_EVENT_ID]);
    expect(body.record.fields['Namn']).toMatch(/^Bekräftelsebilaga – ZZ-dokumentunderlag-fixtur/);
    expect(body.record.fields['Dokumentklass']).toBe('Event-mallad');
    expect(body.record.fields['Mall']).toBe('Bekräftelsebilaga');
    expect(typeof body.record.fields['Källhash']).toBe('string');
    expect(body.record.fields['Källhash']).toMatch(/^[0-9a-f]{64}$/);
    expect(body.record.fields['Storlek (bytes)']).toBe(body.attachment.storlekBytes);

    // ÅTTA FÄLT (Mall+Källhash tillkom TASK-309.4, ovanpå de sex TASK-147.12
    // etablerade) — samma "exakt mängd, inte minst dessa"-disciplin som den
    // ursprungliga versionen av detta test höll för fem→sex-övergången.
    expect(new Set(Object.keys(body.record.fields))).toEqual(
      new Set([
        'Namn',
        'Storlek (bytes)',
        'Skapad',
        'Event',
        'Lagringsnyckel',
        'Dokumentklass',
        'Mall',
        'Källhash',
      ]),
    );

    expect(body.attachment.mall).toBe('Bekräftelsebilaga');
    expect(body.attachment.kallhash).toBe(body.record.fields['Källhash']);

    const pdfBytes = Buffer.from(body.pdfBase64, 'base64');
    expect(pdfBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(hasEmbeddedFont(pdfBytes), 'PDF:en saknar ett inbäddat typsnitt (/FontFile2)').toBe(
      true,
    );

    const text = await extractPdfText(pdfBytes);
    // Statisk organisationstext (Swish/kontakt), ALLTID närvarande oavsett
    // Eventinnehåll — å/ä/ö i "Frågor"/"önskar". Dynamiskt Eventinnehåll-
    // innehåll (kopior.tid = "ZZ-override-tid", se fixturens facit) bevisar
    // ATT den mall-resolvda datan faktiskt nådde Eta, inte bara statisk mall.
    expect(text).toContain('Frågor mejla till');
    expect(text).toContain('ZZ-override-tid');
    expect(text).toContain('Roger');
  });

  test('allow: mall="deltagarinfo" → 201 + rätt Mall-värde + sökbar Eventinnehåll-text', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'deltagarinfo',
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as GenerateResponse;

    expect(body.record.fields['Namn']).toMatch(/^Deltagarinformation – ZZ-dokumentunderlag-fixtur/);
    expect(body.record.fields['Mall']).toBe('Deltagarinformation');
    expect(body.record.fields['Dokumentklass']).toBe('Event-mallad');

    const pdfBytes = Buffer.from(body.pdfBase64, 'base64');
    expect(hasEmbeddedFont(pdfBytes)).toBe(true);
    const text = await extractPdfText(pdfBytes);
    // Verbatim ur den seedade Eventinnehåll-raden (get-document-sources.
    // staging.test.ts:s facit-fixture), å-tecken i "Kom".
    expect(text).toContain('Kom som du är');
    expect(text).toContain('Förberedelser');
  });

  test('ersatt-läget (ADR-125 § 3): regenererar SAMMA rad — samma attachmentId, 200 inte 201', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const first = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    const firstRaw = await first.text();
    expect(first.status(), firstRaw).toBe(201);
    const firstBody = JSON.parse(firstRaw) as GenerateResponse;
    const attachmentId = firstBody.record.id;

    const second = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
      ersatt: attachmentId,
    });
    const secondRaw = await second.text();
    expect(second.status(), secondRaw).toBe(200);
    const secondBody = JSON.parse(secondRaw) as GenerateResponse;

    expect(secondBody.record.id).toBe(attachmentId);
    expect(secondBody.attachment.id).toBe(attachmentId);
    expect(secondBody.record.fields['Mall']).toBe('Bekräftelsebilaga');
    expect(secondBody.record.fields['Källhash']).toMatch(/^[0-9a-f]{64}$/);
    // SAMMA lagringsnyckel — filen skrevs över, ingen ny path allokerades.
    expect(secondBody.record.fields['Lagringsnyckel']).toBe(
      firstBody.record.fields['Lagringsnyckel'],
    );

    const pdfBytes = Buffer.from(secondBody.pdfBase64, 'base64');
    expect(pdfBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  test('ersatt-läget: fel eventId (ägarskaps-guard) → 403', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const created = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    expect(created.status(), await created.text()).toBe(201);
    const attachmentId = (JSON.parse(await created.text()) as GenerateResponse).record.id;

    const res = await postGenerate(request, config, jwt, {
      eventId: 'recZZZZZZZZZZZZZZ',
      mall: 'bekraftelse',
      ersatt: attachmentId,
    });
    expect(res.status()).toBe(403);
  });

  test('ersatt-läget: mall matchar inte radens Mall → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const created = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    expect(created.status(), await created.text()).toBe(201);
    const attachmentId = (JSON.parse(await created.text()) as GenerateResponse).record.id;

    const res = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'deltagarinfo',
      ersatt: attachmentId,
    });
    expect(res.status()).toBe(400);
  });

  test('ersatt-läget: okänt attachmentId → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
      ersatt: 'recZZZZZZZZZZZZZZ',
    });
    expect(res.status()).toBe(404);
  });

  test('AC (TASK-302.3, oförändrat flöde): utkastet finns FÖRE skarp generering, saknas EFTER (rensaUtkast)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const previewRes = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
      preview: true,
    });
    expect(previewRes.status(), await previewRes.text()).toBe(200);
    const previewBody = UtkastResultatSchema.parse(await previewRes.json());

    const before = await request.head(previewBody.url);
    expect(before.status(), 'utkastet borde ha existerat direkt efter preview').toBe(200);

    const sharpRes = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    expect(sharpRes.status(), await sharpRes.text()).toBe(201);

    const after = await request.head(previewBody.url);
    expect(
      after.status(),
      `utkastet borde ha tagits bort av rensaUtkast efter skarp generering — fick ${after.status()}`,
    ).not.toBe(200);
  });

  test('allow: preview-läge → 200 + riktig PDF + INGEN Bilagor-rad skapas', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const foreCount = await countKlassBAttachments(request, config, jwt, DOKUMENTUNDERLAG_EVENT_ID);

    const res = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'deltagarinfo',
      preview: true,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const rawBody = JSON.parse(raw) as Record<string, unknown>;

    expect(rawBody.pdfBase64).toBeUndefined();
    expect(rawBody.attachment).toBeUndefined();
    expect(rawBody.record).toBeUndefined();
    expect(rawBody.storagePath).toBeUndefined();
    const body = UtkastResultatSchema.parse(rawBody);
    expect(new Date(body.utgar).getTime()).toBeGreaterThan(Date.now());
    expect(new URL(body.url).pathname).toContain(
      `utkast/${DOKUMENTUNDERLAG_EVENT_ID}/deltagarinformation.pdf`,
    );

    const head = await request.head(body.url);
    expect(head.status(), 'signerad URL gav inte 200 på HEAD').toBe(200);
    expect(head.headers()['content-type']).toMatch(/^application\/pdf/);

    const efterCount = await countKlassBAttachments(
      request,
      config,
      jwt,
      DOKUMENTUNDERLAG_EVENT_ID,
    );
    expect(efterCount, 'preview: true skapade en klass B-rad — sidoeffekt!').toBe(foreCount);
  });

  test('deny: saknad eventId → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, { mall: 'bekraftelse' });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/eventId/i);
  });

  test('deny: saknad mall → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, { eventId: DOKUMENTUNDERLAG_EVENT_ID });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/mall/i);
  });

  test('deny: ogiltigt mall-värde → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'kvitto',
    });
    expect(res.status()).toBe(400);
  });

  test('deny: ogiltig eventId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, {
      eventId: 'inteEttRecordId',
      mall: 'bekraftelse',
    });
    expect(res.status()).toBe(400);
  });

  test('okänt event (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, {
      eventId: 'recZZZZZZZZZZZZZZ',
      mall: 'bekraftelse',
    });
    expect(res.status()).toBe(404);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { eventId: DOKUMENTUNDERLAG_EVENT_ID, mall: 'bekraftelse' },
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
    const res = await request.get(
      `${config.baseUrl}${ENDPOINT}?eventId=${DOKUMENTUNDERLAG_EVENT_ID}&mall=bekraftelse`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    expect(res.status()).toBe(405);
  });
});
