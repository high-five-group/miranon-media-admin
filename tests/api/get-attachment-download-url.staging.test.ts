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
// TASK-275.3 (ADR-118 beslut 5) TILLÄGG — RÄCKVIDDSMEDVETEN GUARD ("testbevis
// i båda riktningarna", uppdragets egen formulering):
//   9.  allow: GEMENSAM bilaga (Kurstyp), öppnad UTAN eventId (räckvidds-
//       läget) → 200 — inget ägarskaps-guard alls för gemensamma bilagor.
//   10. allow: GEMENSAM bilaga, öppnad från ETT ANNAT (giltigt, orelaterat)
//       event än det den skapades i → 200 — detta ÄR buggen AC #2 kräver
//       fixad ("förhandsvisning/nedladdning av ÄRVDA dokument MÅSTE
//       fungera"; INNAN denna rättning gav samma anrop 403).
//   11. allow: en GENUINT EVENT-LÖS gemensam bilaga (TASK-275.3s event-lösa
//       uppladdning, ingen Event-länk alls) → 200, och URL:EN GER FAKTISKT
//       FILEN (samma åtkomst-bevis som fall 1) — bevisar att path-ANKARET
//       (`kurstyp/<kursfamilj>`) deriveras IDENTISKT vid uppladdning och
//       nedladdning, annars 502/tomt svar.
//   12. REGRESSION: en Event-räckviddig bilaga NEKAS FORTFARANDE (403) från
//       fel event — samma fall som (2) ovan, bevisar att relaxeringen är
//       RÄCKVIDDSMEDVETEN, inte en total avstängning av guarden.
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
// [TASK-338.2] Läser EF-svaret med testsidans vidare schema — se
// `attachment-staging-schema.ts` för varför domänens `AttachmentSchema`
// inte längre kan parsa en gemensam bilaga (`rackvidd: 'Gemensam'`).
import { StagingAttachmentSchema } from './attachment-staging-schema';
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
  return StagingAttachmentSchema.parse(body.attachment).id;
}

/** Rader denna svit skapar städas via delete-attachment — självstädande.
 * [TASK-275.3] `eventId: null` = räckviddsläge (gemensam bilaga, ADR-118
 * beslut 3) — samma `string | null`-kontrakt som `deleteAttachment` bär. */
async function stadaBilaga(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string | null,
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

  // TASK-275.3 (ADR-118 beslut 5) — RÄCKVIDDSMEDVETEN GUARD, se filhuvudets
  // TILLÄGG-stycke för fallen 9–12.
  test('allow: GEMENSAM bilaga (Kurstyp), öppnad UTAN eventId (räckviddsläget) → 200', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const uploadRes = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: {
        eventId: BELAGGNING_EVENT_ID,
        filnamn: sentinelFilnamn(),
        contentType: 'application/pdf',
        bytesBase64: buildPseudoPdfBase64(SENTINEL_BYTES),
        rackvidd: 'Kurstyp',
        kursfamilj: 'Fjärrskådning',
      },
    });
    expect(uploadRes.status(), await uploadRes.text()).toBe(201);
    const attachmentId = StagingAttachmentSchema.parse((await uploadRes.json()).attachment).id;

    try {
      const res = await getDownloadUrl(request, config, jwt, { attachmentId });
      const raw = await res.text();
      expect(res.status(), raw).toBe(200);
      const body = JSON.parse(raw) as { url?: string };
      expect(typeof body.url).toBe('string');
    } finally {
      await stadaBilaga(request, config, jwt, null, attachmentId);
    }
  });

  test('allow: GEMENSAM bilaga öppnad från ETT ANNAT event än den skapades i → 200 (AC #2, ärvda dokument)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    // Skapad i BELAGGNING_EVENT_ID:s kontext (275.2:s "Event förblir satt"-
    // beteende) men räckvidden är Alla event — ska vara öppningsbar från
    // ARBETSKO_EVENT_ID (ett HELT ANNAT, orelaterat event) ändå.
    const uploadRes = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: {
        eventId: BELAGGNING_EVENT_ID,
        filnamn: sentinelFilnamn(),
        contentType: 'application/pdf',
        bytesBase64: buildPseudoPdfBase64(SENTINEL_BYTES),
        rackvidd: 'Alla event',
      },
    });
    expect(uploadRes.status(), await uploadRes.text()).toBe(201);
    const attachmentId = StagingAttachmentSchema.parse((await uploadRes.json()).attachment).id;

    try {
      const res = await getDownloadUrl(request, config, jwt, {
        eventId: ARBETSKO_EVENT_ID,
        attachmentId,
      });
      const raw = await res.text();
      expect(res.status(), raw).toBe(200);
      const body = JSON.parse(raw) as { url?: string };
      expect(typeof body.url).toBe('string');
    } finally {
      // [RÄTTAT, RÖTT-FÖRST-BELÄGG mot skarp staging] Städas i RÄCKVIDDSLÄGE
      // (eventId UTELÄMNAD) — INTE i sitt eventkontext. Denna kommentar sade
      // tidigare att bilagan kunde städas via BELAGGNING_EVENT_ID eftersom
      // den "BÄR fortfarande en Event-länk" — det påståendet är sant men
      // IRRELEVANT: delete-attachment/index.ts:s auktorisation läser
      // bilagans `Räckvidd` (Alla event = gemensam), ALDRIG om en `Event`-
      // länk råkar finnas (se den filens § filhuvud, "AUKTORISATIONEN —
      // läser bilagans EGEN Räckvidd, ALDRIG Event"). Ett verkligt
      // testkörning mot staging fällde detta (403 "Gemensamma bilagor kan
      // bara raderas i sitt räckviddsläge…") innan rättningen.
      await stadaBilaga(request, config, jwt, null, attachmentId);
    }
  });

  test('allow: GENUINT EVENT-LÖS gemensam bilaga → 200, URL:en ger FAKTISKT filen (anker-symmetri upload↔download)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const uploadRes = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: {
        filnamn: sentinelFilnamn(),
        contentType: 'application/pdf',
        bytesBase64: buildPseudoPdfBase64(SENTINEL_BYTES),
        rackvidd: 'Alla event',
      },
    });
    expect(uploadRes.status(), await uploadRes.text()).toBe(201);
    const attachmentId = StagingAttachmentSchema.parse((await uploadRes.json()).attachment).id;

    try {
      const res = await getDownloadUrl(request, config, jwt, { attachmentId });
      const raw = await res.text();
      expect(res.status(), raw).toBe(200);
      const body = JSON.parse(raw) as { url?: string };
      expect(typeof body.url).toBe('string');

      // ÅTKOMST-BEVISET (samma disciplin som fall 1 ovan) — INTE bara ett
      // plausibelt svar: den signerade URL:en måste FAKTISKT ge bytesen på
      // den path uppladdningen skrev till (`alla-event/<leaf>`).
      const fileRes = await request.get(body.url as string);
      expect(fileRes.status(), `signerad URL gav inte filen: ${await fileRes.text()}`).toBe(200);
      expect((await fileRes.body()).byteLength).toBe(SENTINEL_BYTES);
    } finally {
      await stadaBilaga(request, config, jwt, null, attachmentId);
    }
  });

  test('REGRESSION: Event-räckviddig bilaga NEKAS FORTFARANDE (403) från fel event', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID);

    try {
      const res = await getDownloadUrl(request, config, jwt, {
        eventId: ARBETSKO_EVENT_ID,
        attachmentId,
      });
      expect(res.status(), await res.text()).toBe(403);
    } finally {
      await stadaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, attachmentId);
    }
  });
});
