// generate-event-attachment — skarp conformance mot deployad staging-EF
// (TASK-146.5, "Klass B — event-mallad generering ur systemmall").
//
// generate-event-attachment SKRIVER (POST → riktig PDF i privat Storage +
// ny Bilagor-rad). Bevisar mot SKARP staging-data:
//   1. AC #1 (landar som en bilaga med samma metadata som en uppladdad):
//      201 + SKRIV-BEVIS ur råa record.fields — EXAKT de fem fälten
//      Bilagor-tabellen bär (Namn/'Storlek (bytes)'/Skapad/Event/
//      Lagringsnyckel), inga fler. Lagringsnyckel tillkom additivt i
//      TASK-147.5 (merge c55e8fb2) — se § "fem fält" nedan för fyndet som
//      gjorde det gamla fyra-fälts-antagandet falskt.
//   2. AC #4 (de tre dokumentklasserna oskiljbara i metadatat): record.fields
//      NYCKLARNA (inte bara värdena) matchar exakt samma set som create-event-note/
//      create-registration:s skrivningar skulle producera för samma tabell — inget
//      extra "Klass"/"Källa"-fält som avslöjar att raden kom från generering i
//      stället för uppladdning.
//   3. AC #3 (svenska tecken korrekta i den genererade filen): samma
//      inflate+WinAnsi-hex-extraktion mot den FAKTISKT returnerade
//      `pdfBase64` som test-pdf-generation.staging.test.ts (TASK-146.1)
//      etablerade — mot systemmallens hårdkodade svenska brödtext
//      (SYSTEMMALL_BRODTEXT), inte en syntetisk sidosträng.
//   4. deny: saknad/malformad eventId → 400; okänt event (rec-format, finns ej) → 404;
//      anon (ingen JWT) → 401; CORS preflight.
//   5. [TASK-246] `preview: true` → 200, INTE 201 — och SIDOEFFEKTSFRIHETEN
//      BEVISAD, inte bara påstådd: svaret saknar `attachment`/`record`/
//      `storagePath` HELT (strukturellt bevis — koden nådde aldrig
//      persisterings-grenen), OCH ett get-event-attachments-anrop FÖRE/EFTER
//      visar att Bilagor-radantalet för eventet är EXAKT oförändrat (funk-
//      tionellt bevis — ingen ny rad landade, oavsett vad svaret PÅSTÅR).
//      [ÄNDRAD, ADR-124, TASK-302.2] Svaret bytte `{ pdfBase64 }` →
//      `{ url, utgar }` — en signerad URL till ett TRANSIENT Storage-utkast
//      (`_shared/utkast.ts` § `laggUtkast`, `typ: 'deltagarinformation'`)
//      i stället för PDF-bytes, eftersom Chromes PDF-visare bara scrollar
//      jämnt på en URL serverad av nätverkstjänsten (mätt, `ADR-124` §
//      Kontext). HEAD mot URL:en + en GET av bytesen bevisar samma
//      inflate+WinAnsi-bevis som allow-testet ovan — "riktigt genererad",
//      inte en attrapp.
//
// ATTACH-MÅL: den permanenta beläggnings-fixturens event (BELAGGNING_EVENT_ID) —
// SAMMA konvention som create-event-note.staging.test.ts och (verifierat live
// mot staging 2026-08-10 via Airtable MCP innan detta test skrevs) TASK-146.4:s
// egna upload-attachment-sentineler: BELAGGNING_EVENT_ID:s Bilagor-spegelfält bar
// redan sex 'ZZ-attachment-test-*'-rader vid detta korts byggtillfälle. Eventets
// Eventlabel-formel ("Ort – Typ – Kursnamn – Datum") EMBEDDAR Orten
// ('ZZ-belaggning-fixtur') — vilket gör den genererade bilagans Namn-fält
// naturligt sentinel-matchbart utan att funktionen behöver ett klient-styrt
// test-only-fält (generate-event-attachment tar INGEN annan input än eventId).
//
// SENTINEL + TEARDOWN (ADR-060): `.purge-staging-policy.json`s
// `generate-event-attachment-sentineler`-target matchar Namn-mönstret
// "Deltagarinformation – ZZ-belaggning-fixtur…" — bounded ackumulering
// tolererad (samma mönster som create-event-note-sentineler); testet får
// ALDRIG Airtable-token. Storage-objektet (privat bucket "bilagor") lämnas
// medvetet OPURGAT av denna policy (ingen storage-purge-mekanism finns ännu i
// repot) — bokfört som känd, avgränsad kvarleva, samma klass av avvägning som
// TASK-146.3s egna testobjekt.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en
// deployats till staging (manuellt, ADR-050 — se index.ts § filhuvud).

import { inflateSync } from 'node:zlib';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { UtkastResultatSchema } from '../../src/domain/schemas';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/generate-event-attachment';

// Identisk källa som funktionens SYSTEMMALL_BRODTEXT (supabase/functions/
// generate-event-attachment/index.ts) — hålls i synk manuellt, samma
// mönster som test-pdf-generation.staging.test.ts håller SWEDISH_SAMPLE i
// synk med EF-koden. Raderna med å/ä/ö (mallen är hårdkodad, AC #2 —
// ingen mall-editor i v1, så det finns inget skarvat ställe att LÄSA denna
// lista ifrån i stället för att duplicera den).
const SYSTEMMALL_SWENSKA_RADER = [
  'Välkommen till kursen!',
  'Här är information du behöver inför ditt deltagande.',
  'Kom gärna i god tid och hör av dig till oss om något är oklart.',
  'Hälsningar,',
];

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

/**
 * Extraherar och konkatenerar text ur ALLA framgångsrikt inflaterade
 * `stream…endstream`-block i en rå PDF-byteström (samma metod som
 * test-pdf-generation.staging.test.ts, TASK-146.1 — se den filens
 * kommentar för det fulla resonemanget).
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
      // Inte alla stream-block är FlateDecode — förväntat, hoppa vidare.
    }
    searchFrom = endIdx + 'endstream'.length;
  }
  return decoded;
}

interface GenerateBody {
  eventId?: unknown;
  preview?: unknown;
}

interface GenerateResponse {
  attachment: {
    id: string;
    namn: string;
    storlekBytes: number;
    skapad: string;
    eventId: string;
    dokumentklass: string | null;
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
 * [TASK-246] SIDOEFFEKTSFRIHETS-MÄTAREN — antalet Bilagor-rader länkade till
 * eventet vars `namn` bär generate-event-attachment:s EGEN, unika
 * naming-signatur (`Deltagarinformation – …`), via get-event-attachments
 * (befintlig, oförändrad EF, TASK-147.5). Räknat FÖRE och EFTER ett
 * `preview: true`-anrop ska ge SAMMA tal — det funktionella beviset att
 * INGEN ny klass B-rad landade.
 *
 * FILTRERAD, INTE TOTAL RÄKNING — MEDVETET (fångat live, TASK-246-byggets
 * första `npm run test:api`-körning, 2026-08-16): BELAGGNING_EVENT_ID är en
 * DELAD fixtur som `upload-attachment`/`delete-attachment`/`get-attachment-
 * download-url`s egna staging-sviter ALLA skapar/raderar `ZZ-attachment-
 * test-*.pdf`-rader på, PARALLELLT (olika testfiler, olika Playwright-
 * workers). Ett TOTALT antal fällde en gång på 40→41 — inte en riktig
 * sidoeffekt, utan en ANNAN fils legitima uppladdning som råkade landa i
 * mätfönstret. Endast generate-event-attachment producerar namnet
 * "Deltagarinformation – …" (ingen annan EF/testfil gör det) — filtrerat på
 * just den signaturen är räkningen immun mot samtidig, orelaterad churn.
 */
const KLASS_B_NAMN_PREFIX = 'Deltagarinformation – ';

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
  return body.attachments.filter(
    (a) => typeof a.namn === 'string' && a.namn.startsWith(KLASS_B_NAMN_PREFIX),
  ).length;
}

test.describe('generate-event-attachment — skarp conformance (TASK-146.5)', () => {
  test('allow: giltig generering → 201 + skriv-bevis (fem fält, exakt) + svensk PDF-text', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, { eventId: BELAGGNING_EVENT_ID });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as GenerateResponse;

    // AC #1 — landar som en bilaga: record.id är en riktig Airtable-rad,
    // länkad till EXAKT det event vi bad om.
    expect(body.record.id.startsWith('rec')).toBe(true);
    expect(body.record.fields['Event']).toEqual([BELAGGNING_EVENT_ID]);
    expect(typeof body.record.fields['Namn']).toBe('string');
    expect(body.record.fields['Namn']).toMatch(/^Deltagarinformation – ZZ-belaggning-fixtur/);
    expect(body.record.fields['Storlek (bytes)']).toBeGreaterThan(0);
    // Storleken record.fields bär är den FAKTISKT skrivna filens längd — samma
    // tal som attachment.storlekBytes och base64-payloadens avkodade längd.
    expect(body.record.fields['Storlek (bytes)']).toBe(body.attachment.storlekBytes);
    expect(Number.isNaN(Date.parse(body.record.fields['Skapad'] as string))).toBe(false);

    // [RÄTTAD, TASK-147.12] AC #4 (task-146.5) krävde tidigare att
    // NYCKELMÄNGDEN skulle vara exakt {Namn, 'Storlek (bytes)', Skapad,
    // Event, Lagringsnyckel} — INGET extra "Klass"-fält, som ett mekaniskt
    // bevis på att de tre dokumentklasserna var oskiljbara i metadatat. Den
    // odelbarheten visade sig vara en DEFEKT (task-147.6:s granskning:
    // Dokument-ytan kunde inte visa verklig klass), inte en egenskap att
    // bevara — Marcus-GO 2026-08-16 (ADR-063, löses I BASEN) lade till
    // `Dokumentklass` just för att BRYTA odelbarheten. Detta testet bevisar
    // nu den NYA kontraktsformen i stället: SEX fält, och `Dokumentklass`
    // bär exakt värdet 'Event-mallad' (aldrig 'Uppladdad' — det hade varit
    // fel klass för en genererad rad).
    //
    // FEM FÄLT (2026-08-10, TASK-147.5) → SEX FÄLT (2026-08-16, TASK-147.12)
    // — historiken (fyra → fem, rad ~164 i denna fil tidigare) visar att
    // mängden verkligen ändras när fältuppsättningen växer; det är därför
    // testet håller den EXAKT, inte "minst dessa", och kommer fälla igen
    // den dag ett sjunde fält tillkommer utan att detta test uppdateras.
    expect(new Set(Object.keys(body.record.fields))).toEqual(
      new Set(['Namn', 'Storlek (bytes)', 'Skapad', 'Event', 'Lagringsnyckel', 'Dokumentklass']),
    );
    expect(body.record.fields['Dokumentklass']).toBe('Event-mallad');

    // Domän-envelope (attachment) — samma sakuppgifter i klientvänlig form.
    expect(body.attachment.id).toBe(body.record.id);
    expect(body.attachment.eventId).toBe(BELAGGNING_EVENT_ID);
    expect(body.attachment.namn).toBe(body.record.fields['Namn']);
    expect(body.attachment.dokumentklass).toBe('Event-mallad');

    // AC #3 — svenska tecken korrekta i DEN FAKTISKT GENERERADE FILEN (inte i
    // request/response-JSON — pdfBase64 är den riktiga byte-strömmen som
    // också skrevs till Storage, se index.ts § pdfBase64).
    const pdfBytes = Buffer.from(body.pdfBase64, 'base64');
    expect(pdfBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    const decoded = extractInflatedText(pdfBytes);
    for (const rad of SYSTEMMALL_SWENSKA_RADER) {
      const expectedHex = winAnsiHex(rad);
      expect(
        decoded.toUpperCase().includes(expectedHex),
        `Rad saknas i dekomprimerad content-ström: "${rad}"\n` +
          `Förväntad (hex): ${expectedHex}\n` +
          `Dekomprimerat innehåll (första 800 tecken): ${decoded.slice(0, 800)}`,
      ).toBe(true);
    }
  });

  // [TASK-302.3, ADR-124 § Beslut 2] AC #1: "Skarp generering/sändning för
  // event E tar bort utkast/E/ — utkast finns FÖRE, saknas EFTER, skarp
  // operation lyckas ÄVEN OM remove fallerar." De två första leden bevisas
  // HÄR mot RIKTIG staging-Storage (positiv väg — best-effort-fallet, "lyckas
  // trots ett remove-fel", är strukturellt garanterat av `rensaUtkast`s eget
  // try/catch (_shared/utkast.ts) och bevisat vid enhetsnivå för klass C i
  // tests/api/send-receipt.test.ts § cleanupDraft — samma disciplin som
  // delete-attachment/index.ts's Storage-borttagning, ALDRIG live-forcerad
  // i denna testsvit).
  test('AC #1 (TASK-302.3): utkastet finns FÖRE skarp generering, saknas EFTER (rensaUtkast)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // 1) Skapa ett utkast via preview-läget — samma väg som testet ovan.
    const previewRes = await postGenerate(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      preview: true,
    });
    expect(previewRes.status(), await previewRes.text()).toBe(200);
    const previewBody = UtkastResultatSchema.parse(await previewRes.json());

    // FÖRE: den signerade URL:en ger 200 — utkastet existerar i Storage.
    const before = await request.head(previewBody.url);
    expect(before.status(), 'utkastet borde ha existerat direkt efter preview').toBe(200);

    // 2) Skarp generering för SAMMA event — internt anropar detta
    // `rensaUtkast(supabaseAdmin, eventId)` EFTER lyckad persistering
    // (generate-event-attachment/index.ts, den persisterande grenen).
    const sharpRes = await postGenerate(request, config, jwt, { eventId: BELAGGNING_EVENT_ID });
    const sharpRaw = await sharpRes.text();
    expect(sharpRes.status(), sharpRaw).toBe(201);

    // EFTER: SAMMA (nu inaktuella) signerade URL ger INTE längre 200 —
    // Storage-objektet den pekade på är borttaget. Den skarpa operationen
    // OVAN lyckades (201) OAVSETT vad denna städning gjorde — ordningen
    // (städning EFTER lyckad persistering) är själva AC:et.
    const after = await request.head(previewBody.url);
    expect(
      after.status(),
      `utkastet borde ha tagits bort av rensaUtkast efter skarp generering — fick ${after.status()}`,
    ).not.toBe(200);
  });

  test('allow: preview-läge (TASK-246) → 200 + riktig PDF + INGEN Bilagor-rad skapas', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const foreCount = await countKlassBAttachments(request, config, jwt, BELAGGNING_EVENT_ID);

    const res = await postGenerate(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      preview: true,
    });
    const raw = await res.text();
    // 200, INTE 201 — inget skapades (201 hade varit fel semantik för en
    // förhandsvisning).
    expect(res.status(), raw).toBe(200);
    const rawBody = JSON.parse(raw) as Record<string, unknown>;

    // STRUKTURBEVIS: svaret bär url+utgar+requestId — koden nådde ALDRIG
    // persisterings-grenen (annars hade attachment/record/storagePath
    // funnits, se GenerateResponse ovan), och den GAMLA pdfBase64-formen
    // (ADR-124, TASK-302.2 — amenderar AC #3) är verifierat BORTA.
    expect(rawBody.pdfBase64).toBeUndefined();
    expect(rawBody.attachment).toBeUndefined();
    expect(rawBody.record).toBeUndefined();
    expect(rawBody.storagePath).toBeUndefined();
    const body = UtkastResultatSchema.parse(rawBody);
    expect(new Date(body.utgar).getTime()).toBeGreaterThan(Date.now());

    // Sökvägen är den DETERMINISTISKA `utkast/<eventId>/<typ>.pdf`-formen
    // (`_shared/utkast.ts`) — `typ: 'deltagarinformation'` eftersom det ÄR
    // systemmallens namn (`MALL_NAMN`), inte en gissning.
    expect(new URL(body.url).pathname).toContain(
      `utkast/${BELAGGNING_EVENT_ID}/deltagarinformation.pdf`,
    );

    // ÅTKOMST-BEVISET: URL:en prövas faktiskt, inte bara plausibel form.
    const head = await request.head(body.url);
    expect(head.status(), 'signerad URL gav inte 200 på HEAD').toBe(200);
    expect(head.headers()['accept-ranges']).toBe('bytes');
    expect(head.headers()['content-type']).toMatch(/^application\/pdf/);

    // FUNKTIONELLT BEVIS: antalet klass B-rader (namn-prefixet) för eventet
    // är EXAKT oförändrat — orört av samtidig, orelaterad churn (se
    // countKlassBAttachments § docblock).
    const efterCount = await countKlassBAttachments(request, config, jwt, BELAGGNING_EVENT_ID);
    expect(efterCount, 'preview: true skapade en klass B-rad — sidoeffekt!').toBe(foreCount);

    // "RIKTIGT GENERERAD", inte en attrapp — SAMMA svenska-tecken-bevis som
    // allow-testet ovan, mot DEN FAKTISKT LAGRADE utkasts-PDF:en.
    const pdfResponse = await request.get(body.url);
    const pdfBytes = Buffer.from(await pdfResponse.body());
    expect(pdfBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    const decoded = extractInflatedText(pdfBytes);
    for (const rad of SYSTEMMALL_SWENSKA_RADER) {
      const expectedHex = winAnsiHex(rad);
      expect(decoded.toUpperCase().includes(expectedHex), `Rad saknas: "${rad}"`).toBe(true);
    }
  });

  test('deny: saknad eventId → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, {});
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/eventId/i);
  });

  test('deny: ogiltig eventId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, { eventId: 'inteEttRecordId' });
    expect(res.status()).toBe(400);
  });

  test('okänt event (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postGenerate(request, config, jwt, { eventId: 'recZZZZZZZZZZZZZZ' });
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

  // [TASK-246] Deny-triple-klassens tredje ben (anon 401 + CORS ovan + denna)
  // saknades i denna svit före TASK-246 — lagd till här eftersom EF:en
  // ÄNDRADES i detta kort (preview-grenen), samma krav som varje ny/ändrad
  // EF-väg bär (se get-attachment-download-url.staging.test.ts för
  // referensformen).
  test('fel HTTP-metod (GET) → 405', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(`${config.baseUrl}${ENDPOINT}?eventId=${BELAGGNING_EVENT_ID}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });
});
