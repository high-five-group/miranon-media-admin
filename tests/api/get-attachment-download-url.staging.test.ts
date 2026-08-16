// get-attachment-download-url — skarp conformance mot deployad staging-EF
// (TASK-245 "Signerad nedladdnings-EF för bilagor — Visa-overlayens saknade
// fil-URL"). SAMMA ägarskaps-guard-mönster som delete-attachment
// (TASK-147.11) — denna svit speglar delete-attachment.staging.test.ts:s
// struktur, men bevisar en LÄSNING (GET, ingen mutation) i stället för en
// radering. Bevisar mot SKARP staging-data:
//
//   1. allow: en RIKTIG bilaga (skapad via upload-attachment-EF:en, samma
//      sentinel-mönster som delete-attachment.staging.test.ts) ger en
//      signerad URL → 200 { url, expiresInSeconds: 300 } — och URL:en
//      PRÖVAS FAKTISKT (ett andra, orelaterat HTTP-anrop MOT signerad-URL:en
//      själv, ingen Authorization-header) ger 200 med EXAKT samma
//      byte-längd som uppladdades. Detta är BETEENDE-beviset (samma
//      disciplin som test-attachments-storage/index.ts § SYFTE: "En giltig
//      signerad länk ger filen... prövade som ÅTKOMST, inte som
//      konfiguration") — inte bara ett grönt svar med en plausibel JSON-form.
//   2. deny: ÄGARSKAPS-GUARDEN — en riktig bilaga hörande till
//      BELAGGNING_EVENT_ID kan INTE få en URL genom att skicka ett ANNAT,
//      giltigt event-id (ARBETSKO_EVENT_ID) → 403.
//   3. deny: ogiltig eventId-form → 400.
//   4. deny: ogiltig attachmentId-form → 400.
//   5. okänt attachmentId (rec-format men finns ej) → 404.
//   6. anon (ingen JWT) → 401.
//   7. CORS preflight (tillåten origin) → 200 + speglad origin.
//   8. fel HTTP-metod (POST — EF:en är GET, till skillnad mot
//      delete-attachment) → 405.
//
// (6)+(7)+(8) = deny-triple-klass-beviset (samma tre icke-lyckade-vägar som
// delete-attachment.staging.test.ts/upload-attachment.staging.test.ts bär
// för samma bevisklass).
//
// TÄCKNINGSGRÄNS, ÖPPET BOKFÖRD: EF:ens 409-väg (Bilagor-rad utan
// `Lagringsnyckel`, pre-TASK-147.5 legacy-data) prövas INTE här — testerna
// får aldrig Airtable-token (ADR-060) och kan därför inte skapa en rad som
// saknar fältet; varje rad denna svit skapar går via upload-attachment, som
// ALLTID sätter `Lagringsnyckel`. Koden verifieras i stället genom
// källkods-granskning (samma gräns delete-attachment.staging.test.ts bär
// för sin egen best-effort-gren mot samma fält).
//
// SENTINEL + TEARDOWN: samma mönster som delete-attachment.staging.test.ts
// — setup-uppladdningarna återanvänder `ZZ-attachment-test-<uuid>.pdf`
// (`.purge-staging-policy.json`s `upload-attachment-sentineler`-target som
// säkerhetsnät), och varje test städar sin egen bilaga via delete-attachment
// som sista steg (självstädande, ingen ny purge-target behövs).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en
// deployats till staging.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { AttachmentSchema } from '../../src/domain/schemas';
import { ARBETSKO_EVENT_ID, BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const UPLOAD_ENDPOINT = '/functions/v1/upload-attachment';
const DELETE_ENDPOINT = '/functions/v1/delete-attachment';
const DOWNLOAD_URL_ENDPOINT = '/functions/v1/get-attachment-download-url';

const SENTINEL_BYTES = 2048;

function getDownloadUrl(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  params: { eventId?: string | null; attachmentId?: string | null },
): Promise<APIResponse> {
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  const query = new URLSearchParams();
  if (params.eventId != null) query.set('eventId', params.eventId);
  if (params.attachmentId != null) query.set('attachmentId', params.attachmentId);
  const qs = query.toString();
  return request.get(`${config.baseUrl}${DOWNLOAD_URL_ENDPOINT}${qs ? `?${qs}` : ''}`, {
    headers,
  });
}

/** Per-körning-unikt sentinel-filnamn — SAMMA mönster som delete-attachment.staging.test.ts. */
function sentinelFilnamn(): string {
  return `ZZ-attachment-test-${randomUUID()}.pdf`;
}

/** Minimal, storlekskontrollerad base64-PDF-liknande sträng — samma teknik som
 * delete-attachment.staging.test.ts § buildPseudoPdfBase64. */
function buildPseudoPdfBase64(totalBytes: number): string {
  const header = '%PDF-1.4\n%';
  const footer = '\n%%EOF';
  const fillLength = totalBytes - header.length - footer.length;
  const content = header + 'A'.repeat(fillLength) + footer;
  return Buffer.from(content, 'utf8').toString('base64');
}

/** Skapar en RIKTIG bilaga via upload-attachment-EF:en — setup-hjälpare, delad
 * av flera fall i denna svit. Returnerar attachmentId (Bilagor-record-ID). */
async function skapaBilaga(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      eventId,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(SENTINEL_BYTES),
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup-uppladdning misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as { attachment: unknown };
  return AttachmentSchema.parse(body.attachment).id;
}

/** Rader denna svit skapar städas via delete-attachment — självstädande. */
async function stadaBilaga(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  attachmentId: string,
): Promise<void> {
  const res = await request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { eventId, attachmentId },
  });
  expect(res.status(), `städning misslyckades: ${await res.text()}`).toBe(200);
}

test.describe('get-attachment-download-url — skarp conformance (TASK-245)', () => {
  test('allow: signerad URL för en riktig bilaga → 200, och URL:en ger FAKTISKT filen', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID);

    try {
      const res = await getDownloadUrl(request, config, jwt, {
        eventId: BELAGGNING_EVENT_ID,
        attachmentId,
      });
      const raw = await res.text();
      expect(res.status(), raw).toBe(200);
      const body = JSON.parse(raw) as { url?: string; expiresInSeconds?: number };
      expect(typeof body.url).toBe('string');
      expect(body.url).toMatch(/^https:\/\//);
      // TTL — se _shared/attachments.ts § SIGNED_DOWNLOAD_URL_TTL_SECONDS.
      expect(body.expiresInSeconds).toBe(300);

      // ÅTKOMST-BEVISET: URL:en är prövad, inte bara plausibel. Ett HELT
      // FRISTÅENDE anrop UTAN vår Authorization-header — den signerade URL:en
      // bär sin egen, separata token — måste ändå ge filen tillbaka.
      const fileRes = await request.get(body.url as string);
      expect(fileRes.status(), `signerad URL gav inte filen: ${await fileRes.text()}`).toBe(200);
      const fileBytes = await fileRes.body();
      expect(fileBytes.byteLength).toBe(SENTINEL_BYTES);
    } finally {
      await stadaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, attachmentId);
    }
  });

  test('deny: ägarskaps-guarden — fel eventId på en riktig bilaga → 403', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID);

    try {
      // Bilagan hör till BELAGGNING_EVENT_ID — vi skickar ARBETSKO_EVENT_ID
      // (ett ANNAT, giltigt event) och förväntar oss en nekad guard.
      const res = await getDownloadUrl(request, config, jwt, {
        eventId: ARBETSKO_EVENT_ID,
        attachmentId,
      });
      const raw = await res.text();
      expect(res.status(), raw).toBe(403);
      const body = JSON.parse(raw) as { error?: string; url?: string };
      expect(body.url).toBeUndefined();
    } finally {
      await stadaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, attachmentId);
    }
  });

  test('deny: ogiltig eventId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await getDownloadUrl(request, config, jwt, {
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

    const res = await getDownloadUrl(request, config, jwt, {
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

    const res = await getDownloadUrl(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: 'recZZZZZZZZZZZZZZ',
    });
    expect(res.status()).toBe(404);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await getDownloadUrl(request, config, undefined, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: 'recANY',
    });
    await classify401Body(res);
  });

  test('CORS preflight: tillåten origin → 200 + Access-Control-Allow-Origin speglar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const res = await request.fetch(`${config.baseUrl}${DOWNLOAD_URL_ENDPOINT}`, {
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

  test('fel HTTP-metod (POST) → 405', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.post(`${config.baseUrl}${DOWNLOAD_URL_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: { eventId: BELAGGNING_EVENT_ID, attachmentId: 'recANY' },
    });
    expect(res.status()).toBe(405);
  });
});
