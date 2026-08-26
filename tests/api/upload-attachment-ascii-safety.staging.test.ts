// upload-attachment — ASCII-/Storage-säkerhet för icke-ASCII filnamn
// (TASK-309.22). Skarp conformance mot deployad staging-EF, ett FOKUSERAT
// regressionstest för ETT specifikt symptom — INTE en duplicering av
// upload-attachment.staging.test.ts:s breda conformance-svit (auth/CORS/
// deny-triple täcks redan där).
//
// ROTORSAK (Marcus prod-röktest 2026-08-26): uppladdning av
// `2025-HörlurarMiranonMedia.pdf` gav `Edge Function "upload-attachment"
// 502: Uppladdningen misslyckades: Invalid key:
// alla-event/…-2025-HörlurarMiranonMedia.pdf` (requestId
// `ee14ee34-05c9-4fbe-a18c-402673b561f5`). Supabase Storages nyckel-regex
// (`supabase/storage` `src/storage/limits.ts`, `VALID_OBJECT_KEY`) tillåter
// bara `/^[A-Za-z0-9_/!.*'() &$=@;:+,?-]*$/` — å/ä/ö ligger utanför.
// FIXEN: `sanitizeFilnamn` (nu `_shared/attachment-filename.ts`) faller
// icke-Storage-säkra tecken till ASCII innan Storage-nyckeln byggs; se den
// filens docblock för hela algoritmen och `tests/api/
// attachment-filename.test.ts` för den rena enhetstäckningen (båda
// riktningar, rött-först-bevisad).
//
// DENNA SVIT bevisar END-TO-END mot SKARP staging-EF (inte bara den rena
// funktionen i isolation) att EXAKT det rapporterade fallet nu fungerar:
//   1. allow: uppladdning med filnamnet "2025-HörlurarMiranonMedia.pdf"
//      (rotorsaks-substrängen, inbäddad i en per-körning-unik sentinel — se
//      § SENTINEL nedan) → 201, INTE 502.
//   2. Bilagor-radens `Namn` = filnamnet OFÖRÄNDRAT (klienten ser sitt eget
//      namn, oavsett Storage-nyckeltransformationen).
//   3. Storage-OBJEKTET FINNS FAKTISKT — bevisat genom att hämta en
//      signerad nedladdnings-URL (get-attachment-download-url) och GÖRA ett
//      FAKTISKT HTTP-anrop mot den (samma "åtkomst, inte konfiguration"-
//      disciplin som get-attachment-download-url.staging.test.ts § fall 1),
//      med byte-längd som matchar exakt vad som laddades upp.
//
// SENTINEL: filnamnet är `ZZ-attachment-filename-test-<uuid>-
// 2025-HörlurarMiranonMedia.pdf` — INTE den nakna rapporterade strängen.
// `upload-attachment-sentineler`-purge-targeten (upload-attachment.staging.
// test.ts) matchar bara ett UUID-only-suffix (`^ZZ-attachment-test-
// <uuid>\.pdf$`) och kan därför inte bära den extra, meningsbärande
// bugg-substrängen. Denna svit har DÄRFÖR en EGEN
// `.purge-staging-policy.json`-target
// (`attachment-filename-ascii-safety-sentineler`) — se den targetens
// `_TASK-309.22`-not för det fulla resonemanget.
//
// TEARDOWN, BÄLTE + HÄNGSLEN:
//   - HÄNGSLEN (normalfallet): testet städar sin EGEN rad via
//     delete-attachment i ett `finally`-block — SAMMA mönster som
//     get-attachment-download-url.staging.test.ts redan etablerar
//     ("självstädande, ingen ny purge-target behövs" — fast HÄR behövs en,
//     se ovan, som SÄKERHETSNÄT för bältet nedan).
//   - BÄLTE (kraschfallet): raden registreras ÄNDÅ i ägar-manifestet
//     (`tests/support/kastbara-poster.ts`, ADR-060 punkt 3) OMEDELBART
//     efter skapelse — kraschar testet INNAN `finally` hinner köra
//     (t.ex. ett timeout mitt i download-url-anropet), städar
//     `purge:staging:efter` den ändå. Under normal drift är raden redan
//     borta när den purgen kör (`registreraKastbarPost`-docblockets
//     "redan raderat ID... no-op-rad" — inte ett fel).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en
// deployats till staging.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { AttachmentSchema } from '../../src/domain/schemas';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const UPLOAD_ENDPOINT = '/functions/v1/upload-attachment';
const DELETE_ENDPOINT = '/functions/v1/delete-attachment';
const DOWNLOAD_URL_ENDPOINT = '/functions/v1/get-attachment-download-url';

/** Rotorsaks-substrängen, VERBATIM ur Marcus prod-röktest 2026-08-26. */
const ROTORSAK_FILNAMN = '2025-HörlurarMiranonMedia.pdf';

/** Per-körning-unikt, purge-targetbart sentinel-filnamn — se § SENTINEL. */
function sentinelFilnamn(): string {
  return `ZZ-attachment-filename-test-${randomUUID()}-${ROTORSAK_FILNAMN}`;
}

/** Samma minimala pseudo-PDF-teknik som upload-attachment.staging.test.ts. */
function buildPseudoPdfBase64(totalBytes: number): string {
  const header = '%PDF-1.4\n%';
  const footer = '\n%%EOF';
  const fillLength = totalBytes - header.length - footer.length;
  const content = header + 'A'.repeat(fillLength) + footer;
  return Buffer.from(content, 'utf8').toString('base64');
}

function postUpload(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  filnamn: string,
  bytesBase64: string,
): Promise<APIResponse> {
  return request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { eventId: BELAGGNING_EVENT_ID, filnamn, contentType: 'application/pdf', bytesBase64 },
  });
}

async function hamtaNedladdningsUrl(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  attachmentId: string,
): Promise<string> {
  const query = new URLSearchParams({ eventId: BELAGGNING_EVENT_ID, attachmentId });
  const res = await request.get(`${config.baseUrl}${DOWNLOAD_URL_ENDPOINT}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const raw = await res.text();
  expect(res.status(), `get-attachment-download-url misslyckades: ${raw}`).toBe(200);
  const body = JSON.parse(raw) as { url?: string };
  expect(typeof body.url).toBe('string');
  return body.url as string;
}

async function stadaBilaga(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  attachmentId: string,
): Promise<void> {
  const res = await request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { eventId: BELAGGNING_EVENT_ID, attachmentId },
  });
  expect(res.status(), `städning misslyckades: ${await res.text()}`).toBe(200);
}

test.describe('upload-attachment — ASCII-/Storage-säkerhet för icke-ASCII filnamn (TASK-309.22)', () => {
  test('allow: filnamn med å/ä/ö → 201 (INTE 502 "Invalid key"), Namn oförändrat, Storage-objektet finns', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const filnamn = sentinelFilnamn();
    const bytes = 2048;

    const uploadRes = await postUpload(request, config, jwt, filnamn, buildPseudoPdfBase64(bytes));
    const uploadRaw = await uploadRes.text();
    // Rött-först-innebörden: FÖRE TASK-309.22 gav EXAKT detta anrop 502
    // "Invalid key" (å/ä/ö i filnamnet). Detta assert är alltså SJÄLVA
    // regressionsbeviset, inte bara en formalitet.
    expect(uploadRes.status(), uploadRaw).toBe(201);

    const uploadBody = JSON.parse(uploadRaw) as {
      attachment: unknown;
      record: { id: string; fields: Record<string, unknown> };
    };
    const attachmentId = uploadBody.record.id;

    // BÄLTE — se filhuvudet § TEARDOWN. Registreras INNAN några vidare
    // anrop görs, så ett krasch i download-url-steget nedan ändå fångas.
    registreraKastbarPost(attachmentId, 'upload-attachment-ascii-safety/Bilagor');

    try {
      // (i) SKRIV-BEVIS: Namn = klientens ORIGINALFILNAMN, ORÖRT — bara
      // Storage-nyckeln (Lagringsnyckel) transformeras, aldrig det
      // användarsynliga fältet.
      expect(uploadBody.record.fields.Namn).toBe(filnamn);
      const attachment = AttachmentSchema.parse(uploadBody.attachment);
      expect(attachment.namn).toBe(filnamn);
      expect(attachment.id).toBe(attachmentId);

      // (ii) STORAGE-OBJEKTET FINNS FAKTISKT — hämta en signerad
      // nedladdnings-URL och gör ett RIKTIGT HTTP-anrop mot den (åtkomst,
      // inte konfiguration — samma disciplin som
      // get-attachment-download-url.staging.test.ts § fall 1).
      const signedUrl = await hamtaNedladdningsUrl(request, config, jwt, attachmentId);
      const fileRes = await request.get(signedUrl);
      expect(fileRes.status(), 'signerad URL gav inte filen').toBe(200);
      const fileBuffer = await fileRes.body();
      expect(fileBuffer.length).toBe(bytes);
    } finally {
      // HÄNGSLEN — se filhuvudet § TEARDOWN.
      await stadaBilaga(request, config, jwt, attachmentId);
    }
  });
});
