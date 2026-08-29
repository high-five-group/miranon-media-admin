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
//   6. [TASK-340.1, PRD `TASK-340` § A + E] preview-svaret bär `kallhash`;
//      Skapa med samma hash PROMOVERAR utkastet (den sparade filens SHA-256
//      är IDENTISK med utkastets bytes — mätt, inte antaget); en hash som
//      inte stämmer ger omrendering + `underlagAndrat`; utan utkast renderas
//      det tyst; och ett upprepat Skapa går ersätt-vägen i stället för att
//      föda en dubblett.
//
// STATUSKODEN ÄR INTE LÄNGRE ALLTID 201 (TASK-340.1 § E). Ett Skapa mot ett
// event som REDAN har en Event-mallad rad för mallen går ersätt-vägen och
// svarar 200 med `ersatte: true`; först när ingen sådan rad finns skapas en
// ny och svaret blir 201. Den permanenta fixturen HAR sådana rader (23
// Bekräftelsebilaga + 4 Deltagarinformation mättes 2026-08-29), så 200 är
// normalfallet här. Testerna asserterar därför INVARIANTEN — `201 ⇔ ersatte
// === false` — via `skapaSkarpt` nedan, inte en fast kod. Det är en STARKARE
// kontroll än den gamla `toBe(201)`: den fångar både en felaktig kod OCH en
// felaktig flagga.
//
// VARFÖR "EXAKT EN RAD KVAR" (kortets AC #3) MÄTS SOM "INGEN NY RAD": den
// permanenta fixturen delas av alla staging-körningar och bär historiska
// dubbletter födda FÖRE denna skiva — 27 länkade Bilagor-rader vid mätningen.
// Att kräva exakt en hade tvingat testet att RADERA data det inte skapat
// (och radera-vägen för Event-mallade rader är uttryckligen ett eget beslut,
// PRD § Utanför omfattningen). Invarianten som faktiskt bär kortets syfte —
// att inga NYA dubbletter kan uppstå — mäts direkt: antalet rader för
// (event × mall) är oförändrat efter ett andra Skapa.
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

import { createHash } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { UtkastResultatSchema } from '../../src/domain/schemas';
import { DOKUMENTUNDERLAG_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/generate-event-attachment';
const DOWNLOAD_URL_ENDPOINT = '/functions/v1/get-attachment-download-url';

/** SHA-256 (hex) över en byteström — INTE byte-ANTAL. Skillnaden är hela
 *  poängen med AC #1: repots egen tidigare determinism-källa mätte
 *  `x-pdf-bytes` (en STORLEK) och kallade det "byte-för-byte identiska",
 *  vilket är precis den ADR-083-klass detta test finns för att undvika
 *  (research `forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md`
 *  § 2.3). Ett `/ID` med fast längd ändrar inte storleken — bara hashen. */
function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

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
  /** [TASK-340.1] Klientens påstående om vilket underlag den granskade. */
  kallhash?: unknown;
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
  /** [TASK-340.1] SAKNAS när svaret är en promovering — bytesen kopierades
   *  server-side och passerade aldrig EF:en. Se EF:ens filhuvud. */
  pdfBase64?: string;
  promoverad: boolean;
  underlagAndrat: boolean;
  ersatte: boolean;
  requestId: string;
}

/** [TASK-340.1] Preview-svarets form — `UtkastResultatSchema` + hashen. */
interface PreviewResponse {
  url: string;
  utgar: string;
  kallhash: string;
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
 * [TASK-340.1] Ett SKARPT anrop plus statuskodens invariant: `201 ⇔ ersatte
 * === false`. Se filhuvudets § STATUSKODEN — en fast `toBe(201)` går inte
 * längre att skriva, och detta är en starkare kontroll än den var.
 */
async function skapaSkarpt(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  body: GenerateBody,
): Promise<GenerateResponse> {
  const res = await postGenerate(request, config, jwt, body);
  const raw = await res.text();
  expect([200, 201], raw).toContain(res.status());
  const parsed = JSON.parse(raw) as GenerateResponse;
  expect(
    res.status(),
    `statuskoden måste följa ersatte-flaggan (201 = ny rad, 200 = ersatt rad): ${raw}`,
  ).toBe(parsed.ersatte ? 200 : 201);
  return parsed;
}

/** [TASK-340.1] Ett PREVIEW-anrop; svaret bär nu `kallhash` (AC #1). */
async function forhandsgranska(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  mall: 'bekraftelse' | 'deltagarinfo',
): Promise<PreviewResponse> {
  const res = await postGenerate(request, config, jwt, {
    eventId: DOKUMENTUNDERLAG_EVENT_ID,
    mall,
    preview: true,
  });
  const raw = await res.text();
  expect(res.status(), raw).toBe(200);
  const body = JSON.parse(raw) as PreviewResponse;
  // Den gamla formen (`{ url, utgar }`) måste fortsatt validera — hashen är
  // ADDITIV, inte en ersättning (bakåtkompatibilitet mot en klient som ännu
  // inte känner fältet; `DocumentPreviewSchema` är icke-strikt och strippar
  // det tyst).
  UtkastResultatSchema.parse({ url: body.url, utgar: body.utgar });
  expect(body.kallhash, `preview-svaret saknar kallhash: ${raw}`).toMatch(/^[0-9a-f]{64}$/);
  return body;
}

/** Hämtar den SPARADE filens bytes via den signerade nedladdnings-URL:en —
 *  samma väg appen använder, aldrig direkt mot Storage (ADR-057). */
async function laddaNerSparadFil(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  attachmentId: string,
): Promise<Buffer> {
  const res = await request.get(
    `${config.baseUrl}${DOWNLOAD_URL_ENDPOINT}?eventId=${DOKUMENTUNDERLAG_EVENT_ID}&attachmentId=${attachmentId}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  const raw = await res.text();
  expect(res.status(), `get-attachment-download-url misslyckades: ${raw}`).toBe(200);
  const { url } = JSON.parse(raw) as { url: string };
  const fil = await request.get(url);
  expect(fil.status(), 'signerad nedladdnings-URL gav inte 200').toBe(200);
  return await fil.body();
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

/**
 * [TASK-340.1] `prefixes` gjordes valfri: AC #3 behöver räkna rader för EN
 * mall (Bekräftelsebilaga) för att kunna bevisa att ett andra Skapa inte
 * föder en dubblett, medan preview-testet fortsatt räknar BÅDA mallarna.
 * Default är oförändrat beteende.
 */
async function countKlassBAttachments(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  prefixes: readonly string[] = KLASS_B_NAMN_PREFIXES,
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
    return typeof namn === 'string' && prefixes.some((prefix) => namn.startsWith(prefix));
  }).length;
}

test.describe('generate-event-attachment — skarp conformance (TASK-309.4, ADR-125)', () => {
  test('allow: mall="bekraftelse" → skriv-bevis (Mall/Källhash) + sökbar text + inbäddat typsnitt', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // [TASK-340.1] Statuskoden asserteras nu som invariant mot `ersatte`
    // (se filhuvudets § STATUSKODEN) i stället för som en fast 201 — den
    // permanenta fixturen har redan rader, så ersätt-vägen är normalfallet.
    const body = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    // Utan `kallhash` renderas det ALLTID — dagens klient, och detta test.
    expect(body.promoverad).toBe(false);
    expect(body.underlagAndrat).toBe(false);
    expect(body.pdfBase64, 'en RENDERAD generering måste fortsatt bära pdfBase64').toBeDefined();

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

    const pdfBytes = Buffer.from(body.pdfBase64 as string, 'base64');
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

  test('allow: mall="deltagarinfo" → rätt Mall-värde + sökbar Eventinnehåll-text', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const body = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'deltagarinfo',
    });

    expect(body.record.fields['Namn']).toMatch(/^Deltagarinformation – ZZ-dokumentunderlag-fixtur/);
    expect(body.record.fields['Mall']).toBe('Deltagarinformation');
    expect(body.record.fields['Dokumentklass']).toBe('Event-mallad');

    const pdfBytes = Buffer.from(body.pdfBase64 as string, 'base64');
    expect(hasEmbeddedFont(pdfBytes)).toBe(true);
    const text = await extractPdfText(pdfBytes);
    // Verbatim ur den seedade Eventinnehåll-raden (get-document-sources.
    // staging.test.ts:s facit-fixture), å-tecken i "Kom".
    expect(text).toContain('Kom som du är');
    expect(text).toContain('Förberedelser');
  });

  test('ersatt-läget (ADR-125 § 3): EXPLICIT ersatt regenererar SAMMA rad — samma attachmentId, 200', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const firstBody = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
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
    // [TASK-340.1] Ett EXPLICIT `ersatt` bär också `ersatte: true` — flaggan
    // beskriver VAD som hände (en rad ersattes), inte VEM som valde raden.
    expect(secondBody.ersatte).toBe(true);
    // SAMMA lagringsnyckel — filen skrevs över, ingen ny path allokerades.
    expect(secondBody.record.fields['Lagringsnyckel']).toBe(
      firstBody.record.fields['Lagringsnyckel'],
    );

    const pdfBytes = Buffer.from(secondBody.pdfBase64 as string, 'base64');
    expect(pdfBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  test('ersatt-läget: fel eventId (ägarskaps-guard) → 403', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const created = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    const attachmentId = created.record.id;

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

    const created = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    const attachmentId = created.record.id;

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

    const previewBody = await forhandsgranska(request, config, jwt, 'bekraftelse');

    const before = await request.head(previewBody.url);
    expect(before.status(), 'utkastet borde ha existerat direkt efter preview').toBe(200);

    // UTAN `kallhash` — alltså rendering, precis som före TASK-340.1.
    // `rensaUtkast` städar oavsett väg.
    await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });

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

    // [TASK-340.1] Hashen är ADDITIV i preview-svaret — de tre sidoeffekts-
    // bevisen nedan är oförändrade.
    expect(rawBody.kallhash).toMatch(/^[0-9a-f]{64}$/);
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

  // ── TASK-340.1: promoveringen och ersätt-vägen ──────────────────────────

  test('AC #1 (TASK-340.1): preview bär kallhash → Skapa med samma hash PROMOVERAR — sparad fil är BYTE-IDENTISK med utkastet', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // 1. Förhandsgranska — svaret bär hashen EF:en redan räknat ut.
    const preview = await forhandsgranska(request, config, jwt, 'bekraftelse');

    // 2. Hämta utkastets EXAKTA bytes via den signerade URL:en, INNAN Skapa.
    const utkastRes = await request.get(preview.url);
    expect(utkastRes.status(), 'utkastets signerade URL gav inte 200').toBe(200);
    const utkastBytes = await utkastRes.body();
    expect(utkastBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    // 3. Skapa med hashen → promovering, ingen rendering.
    const skarp = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
      kallhash: preview.kallhash,
    });
    expect(skarp.promoverad, `Skapa med matchande hash måste promovera: ${skarp.requestId}`).toBe(
      true,
    );
    expect(skarp.underlagAndrat).toBe(false);
    // En promovering renderar aldrig, så bytesen passerar aldrig EF:en —
    // därav ingen pdfBase64 (se EF-filhuvudets not).
    expect(skarp.pdfBase64).toBeUndefined();
    expect(skarp.record.fields['Källhash']).toBe(preview.kallhash);
    expect(skarp.attachment.storlekBytes).toBe(utkastBytes.byteLength);

    // 4. HELA POÄNGEN: den SPARADE filens SHA-256 = utkastets SHA-256.
    //    Mätt över faktiska bytes, aldrig över ett byte-ANTAL.
    const sparadBytes = await laddaNerSparadFil(request, config, jwt, skarp.attachment.id);
    expect(
      sha256(sparadBytes),
      'den sparade filen är INTE de bytes Lotta granskade — promoveringen håller inte',
    ).toBe(sha256(utkastBytes));

    // 5. Utkastet är konsumerat och städat (rensaUtkast, ADR-124 § Beslut 2).
    const efter = await request.head(preview.url);
    expect(efter.status(), 'utkastet skulle ha städats efter promoveringen').not.toBe(200);
  });

  test('AC #2 (TASK-340.1): hash som INTE stämmer → omrendering + underlagAndrat, aldrig promovering av fel underlag', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // Bekräftelsebilagans utkast läggs FÖRST, deltagarinformationens sedan —
    // båda finns samtidigt (ett utkast per event OCH typ, ADR-124 § 2). Vi
    // skickar sedan DELTAGARINFORMATIONENS hash till en bekräftelse-Skapa:
    // ett VÄLFORMAT, äkta, aktuellt hash-värde över ett ANNAT underlag.
    //
    // VARFÖR SÅ, OCH INTE GENOM ATT PATCH:A ETT EVENTFÄLT (kortets "t.ex."):
    // den permanenta fixturen delas av parallella staging-sviter, och
    // `skapa-om-event-bilaga.staging.test.ts` muterar den redan (dess
    // `Anmälningsavgift (bilagetext)`-fönster). En ANDRA muterande svit mot
    // samma rad hade skapat en ny, äkta flake-klass mellan två filer som
    // körs i olika workers — precis den sorts rött CONTRIBUTING.md § Rött-
    // först vill undvika. Ledet "ändrat underlag ⇒ annan hash" bevisas redan
    // mot skarp staging-data i just den sviten (dess steg 3–4); det som
    // saknades var ledet "annan hash ⇒ ingen promovering, och Lotta får veta
    // det", och DET är vad detta test isolerar.
    const bekraftelse = await forhandsgranska(request, config, jwt, 'bekraftelse');
    const deltagarinfo = await forhandsgranska(request, config, jwt, 'deltagarinfo');
    expect(deltagarinfo.kallhash).not.toBe(bekraftelse.kallhash);

    // Bekräftelse-utkastet finns FORTFARANDE — så det som blockerar
    // promoveringen är hash-jämförelsen, inte ett saknat utkast.
    const utkastFinns = await request.head(bekraftelse.url);
    expect(utkastFinns.status(), 'bekräftelse-utkastet skulle ha funnits kvar').toBe(200);

    const skarp = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
      kallhash: deltagarinfo.kallhash,
    });
    expect(skarp.promoverad, 'en hash som inte stämmer får ALDRIG promovera').toBe(false);
    expect(skarp.underlagAndrat, 'skillnaden måste sägas i klartext').toBe(true);
    expect(skarp.pdfBase64, 'omrenderingen måste ha skett').toBeDefined();
    // Raden bär serverns EGEN omräkning, aldrig klientens påstående.
    expect(skarp.record.fields['Källhash']).toBe(bekraftelse.kallhash);
    expect(skarp.record.fields['Källhash']).not.toBe(deltagarinfo.kallhash);
  });

  test('AC #2 (TASK-340.1): utkastet saknas → rendering TYST (degradering, aldrig fel)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // Ett skarpt Skapa städar alla utkast för eventet (rensaUtkast) OCH
    // returnerar serverns aktuella `Källhash` — alltså en hash som stämmer,
    // för ett event som just nu SAKNAR utkast. Exakt fall (c).
    const forsta = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    const aktuellHash = forsta.attachment.kallhash;
    expect(aktuellHash).toMatch(/^[0-9a-f]{64}$/);

    const andra = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
      kallhash: aktuellHash as string,
    });
    expect(andra.promoverad, 'utan utkast finns inga bytes att promovera').toBe(false);
    // TYST: inget besked om ändrat underlag — underlaget ÄR oförändrat, det
    // är bara utkastet som är borta. (Skulle detta falla i CI: kontrollera
    // om `skapa-om-event-bilaga.staging.test.ts` muterade fixturen exakt i
    // fönstret mellan de två anropen — det är den enda kända vägen till ett
    // äkta `true` här, och Playwrights två CI-retries absorberar den.)
    expect(andra.underlagAndrat).toBe(false);
    expect(andra.pdfBase64, 'det tysta fallet renderar').toBeDefined();
  });

  test('AC #2 (TASK-340.1): MISSFORMAD kallhash → 400, aldrig en tyst fallback', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    for (const trasig of ['inte-en-hash', 'A'.repeat(64), 'a'.repeat(63), 42, true]) {
      const res = await postGenerate(request, config, jwt, {
        eventId: DOKUMENTUNDERLAG_EVENT_ID,
        mall: 'bekraftelse',
        kallhash: trasig,
      });
      expect(res.status(), `kallhash=${JSON.stringify(trasig)} borde ha gett 400`).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toMatch(/kallhash/i);
    }
  });

  test('AC #3 (TASK-340.1, PRD § E): andra Skapa går ersätt-vägen — samma attachmentId, INGEN ny rad', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const forsta = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    const efterForsta = await countKlassBAttachments(
      request,
      config,
      jwt,
      DOKUMENTUNDERLAG_EVENT_ID,
      ['Bekräftelsebilaga – '],
    );

    const andra = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });

    expect(andra.ersatte, 'ett andra Skapa måste gå ersätt-vägen, inte skapa en rad').toBe(true);
    expect(andra.attachment.id, 'ersätt-vägen behåller SAMMA attachmentId').toBe(
      forsta.attachment.id,
    );
    expect(andra.record.fields['Lagringsnyckel']).toBe(forsta.record.fields['Lagringsnyckel']);
    expect(andra.storagePath).toBe(forsta.storagePath);

    const efterAndra = await countKlassBAttachments(
      request,
      config,
      jwt,
      DOKUMENTUNDERLAG_EVENT_ID,
      ['Bekräftelsebilaga – '],
    );
    expect(
      efterAndra,
      'ett andra Skapa födde en DUBBLETT — E-uppslaget håller inte (se filhuvudets § VARFÖR)',
    ).toBe(efterForsta);
  });

  test('AC #3 (TASK-340.1): ersätt-uppslaget är MALL-SPECIFIKT — deltagarinfo rör aldrig bekräftelsens rad', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const bekraftelse = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
    });
    const deltagarinfo = await skapaSkarpt(request, config, jwt, {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'deltagarinfo',
    });

    expect(deltagarinfo.attachment.id).not.toBe(bekraftelse.attachment.id);
    expect(deltagarinfo.record.fields['Mall']).toBe('Deltagarinformation');
    expect(bekraftelse.record.fields['Mall']).toBe('Bekräftelsebilaga');
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
