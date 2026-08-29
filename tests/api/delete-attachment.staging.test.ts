// delete-attachment — skarp conformance mot deployad staging-EF (TASK-147.11
// "Äkta ersätt och radera för bilagor", uppföljning av TASK-147.6:s fynd 3).
// Repots ANDRA delete-operation (LedgerRemover, `_shared/receipt-numbering.ts`,
// TASK-147.7, var den FÖRSTA). Bevisar mot SKARP staging-data:
//
//   1. allow: en RIKTIG bilaga (skapad via upload-attachment-EF:en, samma
//      sentinel-mönster som upload-attachment.staging.test.ts) raderas →
//      200 { deleted: true }, och raden är FAKTISKT borta — ett andra
//      delete-anrop mot SAMMA attachmentId ger 404 (idempotens-/existens-
//      bevis, inte bara ett grönt svar första gången).
//   2. deny: ÄGARSKAPS-GUARDEN — en riktig bilaga hörande till
//      BELAGGNING_EVENT_ID kan INTE raderas genom att skicka ett ANNAT,
//      giltigt event-id (ARBETSKO_EVENT_ID) → 403, och raden finns
//      FORTFARANDE kvar efteråt (get-event-attachments verifierar) — bevisar
//      att guarden faktiskt BLOCKERADE, inte bara svarade fel medan
//      raderingen skedde ändå.
//   3. Ersätt-flödet ände-till-ände: SAMMA ordning som useReplaceAttachment.ts
//      (ladda upp NYA filen FÖRST, radera GAMLA posten EFTER) — bevisar mot
//      get-event-attachments att den gamla raden är borta och den nya finns
//      kvar. Uppdragets efterfrågade "upload → ersätt → gamla borta"-bevis.
//   4. deny: ogiltig eventId-form → 400.
//   5. deny: ogiltig attachmentId-form → 400.
//   6. okänt attachmentId (rec-format men finns ej) → 404.
//   7. anon (ingen JWT) → 401.
//   8. CORS preflight (tillåten origin) → 200 + speglad origin.
//   9. fel HTTP-metod (GET) → 405.
//
// TASK-275.2 (ADR-118 beslut 3) tillägg — GEMENSAMMA bilagors olycksskydd,
// bevisat i BÅDA riktningar (uppdragets krav, ej bara "att grinden är grön"):
//   10. deny: en GEMENSAM bilaga (räckvidd Kurstyp) kan INTE raderas med
//       `eventId` angiven ("ur eventkontext") → 403, raden orörd.
//   11. allow: SAMMA bilaga raderas UTAN `eventId` ("i räckviddsläge") → 200,
//       raden FAKTISKT borta.
//   12. deny: en Event-räckviddig bilaga UTAN `eventId` → 400 (oförändrat
//       beteende — regressionsskydd, "eventId krävs" gäller fortfarande för
//       den vanliga vägen).
//
// TASK-275.3 (ADR-118 beslut 5) tillägg — EVENT-LÖS STORAGE-ANKARE:
//   13. allow: en GENUINT EVENT-LÖS gemensam bilaga (ingen `Event`-länk
//       alls, `kurstyp/<kursfamilj>`-storage-ankaret) raderas i
//       räckviddsläge → 200, raden FAKTISKT borta. Fall 11 ovan bevisar
//       samma sak för en bilaga som RÅKAR bära en `Event`-länk (275.2:s
//       väg); detta fall bevisar den ANDRA storage-anker-grenen.
//
// (7)+(8)+(9) = deny-triple-klass-beviset (samma tre icke-lyckade-vägar som
// upload-attachment.staging.test.ts bär för samma bevisklass).
//
// SENTINEL: setup-uppladdningarna återanvänder EXAKT upload-attachment.
// staging.test.ts:s filnamnsmönster (`ZZ-attachment-test-<uuid>.pdf`) —
// samma `.purge-staging-policy.json`-target (`upload-attachment-
// sentineler`) fångar dem som säkerhetsnät OM ett test kraschar mitt i.
// Normalfallet behöver INGEN purge: raderingen SJÄLV är teardown (testet
// äter sin egen disk-data), vilket gör denna svit renare än upload-
// attachment.staging.test.ts (som lämnar Storage-bytes kvar per sitt eget
// docblock) — delete-attachment städar BÅDE Storage OCH Airtable-raden.
//
// ATTACH-MÅL: BELAGGNING_EVENT_ID (happy path + guard-offret) och
// ARBETSKO_EVENT_ID (guardens "fel event"-part) — samma två permanenta
// fixturer create-event-note.staging.test.ts/upload-attachment.staging.
// test.ts redan etablerat som par.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en
// deployats till staging.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
// [TASK-338.2, SMALNAD TASK-338.4] Läser EF-svaret med testsidans schema —
// numera BARA en strikt `plats`-överskrivning (räckvidden går via
// domänschemat rakt av sedan `AttachmentScope` bär `GEMENSAM`). Se
// `attachment-staging-schema.ts` § VAD SOM ÄR KVAR för varför strikt HÄR och
// lenient i klienten är två avsikter, inte en inkonsekvens.
import { StagingAttachmentSchema } from './attachment-staging-schema';
import { ARBETSKO_EVENT_ID, BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const UPLOAD_ENDPOINT = '/functions/v1/upload-attachment';
const DELETE_ENDPOINT = '/functions/v1/delete-attachment';

interface DeleteBody {
  eventId?: string;
  attachmentId?: string;
}

function postDelete(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: DeleteBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, { headers, data: body });
}

/** Per-körning-unikt sentinel-filnamn — SAMMA mönster som upload-attachment.staging.test.ts
 * (purge-target `upload-attachment-sentineler` matchar exakt detta). */
function sentinelFilnamn(): string {
  return `ZZ-attachment-test-${randomUUID()}.pdf`;
}

/** Minimal, storlekskontrollerad base64-PDF-liknande sträng — samma teknik som
 * upload-attachment.staging.test.ts § buildPseudoPdfBase64. */
function buildPseudoPdfBase64(totalBytes: number): string {
  const header = '%PDF-1.4\n%';
  const footer = '\n%%EOF';
  const fillLength = totalBytes - header.length - footer.length;
  const content = header + 'A'.repeat(fillLength) + footer;
  return Buffer.from(content, 'utf8').toString('base64');
}

/** Skapar en RIKTIG bilaga via upload-attachment-EF:en — setup-hjälpare, delad
 * av flera fall i denna svit. Returnerar attachmentId (Bilagor-record-ID).
 * `scope` (TASK-275.2, ADR-118) — utelämnad default:ar till räckvidd Event. */
async function skapaBilaga(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  scope: { rackvidd?: string; kursfamilj?: string; kursniva?: string } = {},
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      eventId,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(2048),
      ...scope,
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup-uppladdning misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as { attachment: unknown };
  return StagingAttachmentSchema.parse(body.attachment).id;
}

test.describe('delete-attachment — skarp conformance (TASK-147.11)', () => {
  test('allow: radera en riktig bilaga → 200 { deleted: true }, och raden är FAKTISKT borta', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID);

    const res = await postDelete(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const body = JSON.parse(raw) as { deleted?: boolean };
    expect(body.deleted).toBe(true);

    // EXISTENS-BEVIS: ett andra anrop mot SAMMA attachmentId ger 404 — raden
    // finns inte längre, det första svaret var inte bara ett grönt svar utan
    // faktisk effekt.
    const secondRes = await postDelete(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId,
    });
    expect(secondRes.status()).toBe(404);
  });

  test('deny: ägarskaps-guarden — fel eventId på en riktig bilaga → 403, raden orörd', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID);

    // Bilagan hör till BELAGGNING_EVENT_ID — vi skickar ARBETSKO_EVENT_ID
    // (ett ANNAT, giltigt event) och förväntar oss en nekad guard.
    const res = await postDelete(request, config, jwt, {
      eventId: ARBETSKO_EVENT_ID,
      attachmentId,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(403);

    // BLOCKERINGS-BEVIS: raden finns FORTFARANDE — guarden stoppade
    // raderingen, den svarade inte bara fel medan den skedde ändå.
    const listRes = await request.get(
      `${config.baseUrl}/functions/v1/get-event-attachments?eventId=${BELAGGNING_EVENT_ID}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    expect(listRes.status()).toBe(200);
    const listBody = (await listRes.json()) as { attachments: Array<{ id: string }> };
    expect(listBody.attachments.some((a) => a.id === attachmentId)).toBe(true);

    // Städa upp med RÄTT eventId (teardown = den riktiga raderingsvägen,
    // samma disciplin som happy path-testet ovan).
    const cleanupRes = await postDelete(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId,
    });
    expect(cleanupRes.status()).toBe(200);
  });

  test('Ersätt-flödet ände-till-ände: ladda upp NY → radera GAMLA (useReplaceAttachment-ordningen) → gamla borta, nya kvar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // "Gamla" filen — den som Ersätt-knappen sitter på.
    const gamlaId = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID);

    // SAMMA ORDNING som useReplaceAttachment.ts: ladda upp den NYA filen
    // FÖRST (steg 1) — den gamla rörs INTE ännu.
    const nyaId = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID);

    // Steg 2: radera den gamla posten EFTER lyckad uppladdning.
    const deleteRes = await postDelete(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: gamlaId,
    });
    expect(deleteRes.status()).toBe(200);

    // BEVIS: gamla borta, nya kvar — läst ur samma lista Dokument-ytan
    // konsumerar (fetchEventAttachments/get-event-attachments).
    const listRes = await request.get(
      `${config.baseUrl}/functions/v1/get-event-attachments?eventId=${BELAGGNING_EVENT_ID}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    expect(listRes.status()).toBe(200);
    const listBody = (await listRes.json()) as { attachments: Array<{ id: string }> };
    const ids = listBody.attachments.map((a) => a.id);
    expect(ids).not.toContain(gamlaId);
    expect(ids).toContain(nyaId);

    // Städa upp den nya (self-cleaning, samma disciplin som övriga fall).
    const cleanupRes = await postDelete(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: nyaId,
    });
    expect(cleanupRes.status()).toBe(200);
  });

  test('deny: ogiltig eventId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postDelete(request, config, jwt, {
      eventId: 'inteEttRecordId',
      attachmentId: 'recZZZZZZZZZZZZZZ',
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/eventId/i);
  });

  test('deny: ogiltig attachmentId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postDelete(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: 'inteEttRecordId',
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/attachmentId/i);
  });

  test('okänt attachmentId (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postDelete(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: 'recZZZZZZZZZZZZZZ',
    });
    expect(res.status()).toBe(404);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { eventId: BELAGGNING_EVENT_ID, attachmentId: 'recANY' },
    });
    await classify401Body(res);
  });

  test('CORS preflight: tillåten origin → 200 + Access-Control-Allow-Origin speglar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const res = await request.fetch(`${config.baseUrl}${DELETE_ENDPOINT}`, {
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
    const res = await request.get(`${config.baseUrl}${DELETE_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });

  // TASK-275.2 (ADR-118 beslut 3) — gemensamma bilagors olycksskydd, BÅDA riktningar.
  test('deny: gemensam bilaga (Kurstyp) raderas MED eventId ("ur eventkontext") → 403, raden orörd', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Kurstyp',
      kursfamilj: 'Fjärrskådning',
    });

    const res = await postDelete(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(403);

    // BLOCKERINGS-BEVIS: raden finns FORTFARANDE.
    const listRes = await request.get(
      `${config.baseUrl}/functions/v1/get-event-attachments?eventId=${BELAGGNING_EVENT_ID}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    const listBody = (await listRes.json()) as { attachments: Array<{ id: string }> };
    expect(listBody.attachments.some((a) => a.id === attachmentId)).toBe(true);

    // Städa upp via RÄTT väg — räckviddsläge (eventId UTELÄMNAD), samma
    // väg nästa test bevisar explicit.
    const cleanupRes = await postDelete(request, config, jwt, { attachmentId });
    expect(cleanupRes.status()).toBe(200);
  });

  test('allow: samma gemensamma bilaga raderas UTAN eventId ("räckviddsläge") → 200, raden FAKTISKT borta', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Alla event',
    });

    const res = await postDelete(request, config, jwt, { attachmentId });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const body = JSON.parse(raw) as { deleted?: boolean };
    expect(body.deleted).toBe(true);

    // EXISTENS-BEVIS: raden är FAKTISKT borta — ett andra raderings-anrop 404:ar.
    const secondRes = await postDelete(request, config, jwt, { attachmentId });
    expect(secondRes.status()).toBe(404);
  });

  test('deny: Event-räckviddig bilaga UTAN eventId → 400 (regressionsskydd, oförändrat beteende)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID);

    const res = await postDelete(request, config, jwt, { attachmentId });
    expect(res.status()).toBe(400);

    // Städa upp med RÄTT eventId (den vanliga vägen, oförändrad).
    const cleanupRes = await postDelete(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId,
    });
    expect(cleanupRes.status()).toBe(200);
  });

  // [TILLÄGG, TASK-275.3, ADR-118 beslut 5] 13. allow: en GENUINT EVENT-LÖS
  // gemensam bilaga (ingen Event-länk alls vid skapelsen — räckviddslägets
  // egen uppladdning) raderas i räckviddsläge → 200, raden FAKTISKT borta.
  // Bevisar att `buildStorageAnchor`s Kurstyp/Alla-event-gren (`kurstyp/
  // <kursfamilj>`/`alla-event`) FUNGERAR som storage-path-anker vid
  // radering, inte bara den `Event`-länk-buren grenen (fall 11 ovan).
  test('allow: GENUINT event-lös gemensam bilaga raderas i räckviddsläge → 200, raden FAKTISKT borta', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const uploadRes = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: {
        filnamn: sentinelFilnamn(),
        contentType: 'application/pdf',
        bytesBase64: buildPseudoPdfBase64(2048),
        rackvidd: 'Kurstyp',
        kursfamilj: 'Psionautics',
      },
    });
    const uploadRaw = await uploadRes.text();
    expect(uploadRes.status(), `setup-uppladdning misslyckades: ${uploadRaw}`).toBe(201);
    const attachmentId = StagingAttachmentSchema.parse(JSON.parse(uploadRaw).attachment).id;

    const res = await postDelete(request, config, jwt, { attachmentId });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const body = JSON.parse(raw) as { deleted?: boolean };
    expect(body.deleted).toBe(true);

    // EXISTENS-BEVIS: raden är FAKTISKT borta — ett andra raderings-anrop 404:ar.
    const secondRes = await postDelete(request, config, jwt, { attachmentId });
    expect(secondRes.status()).toBe(404);
  });
});
