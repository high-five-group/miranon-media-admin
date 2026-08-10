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
}

interface GenerateResponse {
  attachment: { id: string; namn: string; storlekBytes: number; skapad: string; eventId: string };
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

    // AC #4 — de tre dokumentklasserna oskiljbara i metadatat: NYCKELMÄNGDEN
    // är exakt {Namn, 'Storlek (bytes)', Skapad, Event, Lagringsnyckel} —
    // inget extra "Klass"/"Källa"-fält som avslöjar att raden genererades i
    // stället för laddades upp. Detta är den mekaniska delen av AC #4
    // (fältformen); fälten skapades via SAMMA field-allowlist-operation
    // ('create-attachment') som en framtida klass A-uppladdning använder
    // (se index.ts § SAMTIDIGHETS-NOT).
    //
    // FEM FÄLT, inte längre fyra (rättat 2026-08-10): TASK-147.5 (merge
    // c55e8fb2) gjorde EF:en additiv — den skriver numera även
    // `Lagringsnyckel` (_shared/attachments.ts § buildAttachmentLeaf), och
    // field-allowlists.ts:s 'create-attachment'-post tillåter fältet. Det
    // gamla fyra-fälts-antagandet härifrån blev därmed falskt och fällde
    // skarpt mot staging (rad ~164, Set saknade 'Lagringsnyckel' i det
    // MOTTAGNA svaret — se PR-beskrivningen för de två oberoende
    // fyndrapporterna). Mängden är fortfarande EXAKT, inte "minst dessa":
    // testet ska fortsatt fälla på en OVÄNTAD sjätte skrivning.
    expect(new Set(Object.keys(body.record.fields))).toEqual(
      new Set(['Namn', 'Storlek (bytes)', 'Skapad', 'Event', 'Lagringsnyckel']),
    );

    // Domän-envelope (attachment) — samma fyra sakuppgifter i klientvänlig form.
    expect(body.attachment.id).toBe(body.record.id);
    expect(body.attachment.eventId).toBe(BELAGGNING_EVENT_ID);
    expect(body.attachment.namn).toBe(body.record.fields['Namn']);

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
});
