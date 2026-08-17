// upload-attachment — skarp conformance mot deployad staging-EF (TASK-146.4
// mönster 1, PRD task-146 "Bilage-fundamentet"). Bevisar AC #3 ("bytesen går
// genom edge-funktionen, som skriver dem med förhöjd behörighet plus en
// metadatarad"), AC #5 (server-side auktorisationsbeslut) och AC #6 (fel på
// Lottas språk) som BETEENDE mot skarp staging-data:
//
//   1. allow: giltig liten uppladdning → 201 + SKRIV-BEVIS ur råa
//      record.fields (Namn/'Storlek (bytes)'/Skapad/Event) + domän-shapen
//      (AttachmentSchema) matchar.
//   2. deny: ogiltig eventId-form → 400.
//   3. okänt event (rec-format men finns ej) → 404.
//   4. deny: saknat filnamn → 400.
//   5. deny: fel content-type (inte PDF) → 400, meddelandet nämner PDF.
//   6. deny: fil över mönster 1:s gräns (6 MB) → 400, meddelandet är i MB —
//      ALDRIG en rå bytejämförelse (AC #6).
//   7. deny: tomt bytesBase64 → 400.
//   8. anon (ingen JWT) → 401.
//   9. CORS preflight (tillåten origin) → 200 + speglad origin.
//   10. fel HTTP-metod (GET) → 405.
//
// TASK-275.2 (ADR-118) tillägg — RÄCKVIDDSPARAMETRARNAS strikta Zod-
// validering (AC #2), "allow/deny-testbevis" per DoD-disciplinen:
//   11. allow: rackvidd Kurstyp + kursfamilj/kursniva → 201, Räckvidd/
//       Kursfamilj/Kursnivå SKRIVNA, `Event` FÖRBLIR satt (medveten
//       avgränsning, se upload-attachment/index.ts § filhuvudet).
//   12. allow: rackvidd Alla event (inga kursfält) → 201, Kursfamilj/
//       Kursnivå OSATTA (utelämnade, inte tomsträng).
//   13. deny: rackvidd Kurstyp UTAN kursfamilj → 400.
//   14. deny: kursfamilj angiven trots rackvidd Event (default) → 400.
//   15. deny: okänt rackvidd-värde → 400.
//   16. deny: okänt kursfamilj-värde → 400.
//
// SENTINEL: filnamnet bär en per-körning-unik markör
// (`ZZ-attachment-test-<uuid>.pdf`) → ingen cross-run-kollision. TEARDOWN =
// setup-purge (ADR-060): .purge-staging-policy.json:s
// `upload-attachment-sentineler`-target raderar Bilagor-RADEN (bounded
// ackumulering tolererad, samma mönster som create-event-note-sentineler).
//
// STORAGE-BYTESEN SJÄLVA rensas INTE av purge-skriptet (det purgar bara
// Airtable-rader) — en medveten, öppet bokförd avgränsning: objekten är
// KB-stora syntetiska PDF:er, ligger under den seedade beläggnings-fixturens
// event-prefix, syns aldrig i något UI, och kostar försumbart mot
// Pro-planens 500 GB-tak (ADR-050). Att bygga en dedikerad storage-purge-väg
// för test-bytes är utanför detta korts AC — bokfört som fynd, inte löst här.
//
// ATTACH-MÅL: den permanenta beläggnings-fixturens event (BELAGGNING_EVENT_ID)
// — samma precedent som create-event-note.staging.test.ts.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en
// deployats till staging.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import type { z } from 'zod';
import { AttachmentSchema } from '../../src/domain/schemas';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/upload-attachment';
const SMALL_UPLOAD_MAX_BYTES = 6 * 1024 * 1024;

type Attachment = z.infer<typeof AttachmentSchema>;

interface UploadBody {
  eventId?: string;
  filnamn?: string;
  contentType?: string;
  bytesBase64?: string;
  rackvidd?: unknown;
  kursfamilj?: unknown;
  kursniva?: unknown;
}

function postUpload(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: UploadBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${ENDPOINT}`, { headers, data: body });
}

/** Per-körning-unikt sentinel-filnamn (purge-target matchar exakt detta mönster). */
function sentinelFilnamn(): string {
  return `ZZ-attachment-test-${randomUUID()}.pdf`;
}

/** Bygger en minimal, storlekskontrollerad base64-PDF-liknande sträng — ingen riktig
 * PDF-struktur krävs (EF:en parsar inte innehållet), bara en giltig %PDF-header och
 * en EXAKT total längd (för gräns-provet). Samma teknik som
 * test-attachments-storage/index.ts buildPseudoPdf, men klientsidan/base64. */
function buildPseudoPdfBase64(totalBytes: number): string {
  const header = '%PDF-1.4\n%';
  const footer = '\n%%EOF';
  if (totalBytes < header.length + footer.length) {
    throw new Error(`totalBytes (${totalBytes}) för litet för header+footer`);
  }
  const fillLength = totalBytes - header.length - footer.length;
  const content = header + 'A'.repeat(fillLength) + footer;
  return Buffer.from(content, 'utf8').toString('base64');
}

test.describe('upload-attachment — skarp conformance (TASK-146.4 mönster 1)', () => {
  test('allow: giltig liten uppladdning → 201 + skriv-bevis (Namn/Storlek/Event/Skapad)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const filnamn = sentinelFilnamn();
    const bytesBase64 = buildPseudoPdfBase64(2048);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn,
      contentType: 'application/pdf',
      bytesBase64,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as {
      attachment: unknown;
      record: { id: string; fields: Record<string, unknown>; createdTime: string };
    };

    // (i) SKRIV-BEVIS ur råa record.fields — EF:en satte fälten i Airtable.
    expect(body.record.id.startsWith('rec')).toBe(true);
    expect(body.record.fields.Namn).toBe(filnamn);
    expect(body.record.fields['Storlek (bytes)']).toBe(2048);
    expect(body.record.fields.Event).toEqual([BELAGGNING_EVENT_ID]);
    expect(typeof body.record.fields.Skapad).toBe('string');
    expect(Number.isNaN(Date.parse(body.record.fields.Skapad as string))).toBe(false);
    // [TASK-147.12] mönster 1 (denna EF) ÄR klass A per definition.
    expect(body.record.fields.Dokumentklass).toBe('Uppladdad');
    // [TASK-275.2] rackvidd UTELÄMNAD i requesten → default 'Event' (dagens
    // beteende, oförändrat); Kursfamilj/Kursnivå OSATTA.
    expect(body.record.fields.Räckvidd).toBe('Event');
    expect(body.record.fields.Kursfamilj).toBeUndefined();
    expect(body.record.fields.Kursnivå).toBeUndefined();

    // (ii) Domän-shape (adapterns parse-väg).
    const attachment: Attachment = AttachmentSchema.parse(body.attachment);
    expect(attachment.namn).toBe(filnamn);
    expect(attachment.storlekBytes).toBe(2048);
    expect(attachment.eventId).toBe(BELAGGNING_EVENT_ID);
    expect(attachment.dokumentklass).toBe('Uppladdad');
    expect(attachment.rackvidd).toBe('Event');
    expect(attachment.kursfamilj).toBeNull();
    expect(attachment.kursniva).toBeNull();
  });

  test('deny: ogiltig eventId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: 'inteEttRecordId',
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
    });
    expect(res.status()).toBe(400);
  });

  test('okänt event (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: 'recZZZZZZZZZZZZZZ',
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
    });
    expect(res.status()).toBe(404);
  });

  test('deny: saknat filnamn → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
    });
    expect(res.status()).toBe(400);
  });

  test('deny: fel content-type (inte PDF) → 400, meddelandet nämner PDF', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'image/png',
      bytesBase64: buildPseudoPdfBase64(1024),
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/PDF/i);
  });

  test('deny: fil över mönster 1:s gräns (6 MB) → 400, felet är i MB (AC #6, inte byte)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const overLimitBytes = SMALL_UPLOAD_MAX_BYTES + 1024;
    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(overLimitBytes),
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(400);
    const body = JSON.parse(raw) as { error?: string };
    // AC #6: läsbart för Lotta — "MB", inte en rå bytejämförelse.
    expect(body.error).toMatch(/MB/);
    expect(body.error).not.toMatch(/\d{5,}\s*byte/i);
  });

  test('deny: tomt bytesBase64 → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: '',
    });
    expect(res.status()).toBe(400);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        eventId: BELAGGNING_EVENT_ID,
        filnamn: 'x.pdf',
        contentType: 'application/pdf',
        bytesBase64: 'AAAA',
      },
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
    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });

  // TASK-275.2 (ADR-118) — räckviddsparametrarnas strikta Zod-validering (AC #2).
  test('allow: rackvidd Kurstyp + kursfamilj/kursniva → 201, fälten skrivna, Event FÖRBLIR satt', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Kurstyp',
      kursfamilj: 'RIM',
      kursniva: 'Nivå 1',
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };

    expect(body.record.fields.Räckvidd).toBe('Kurstyp');
    expect(body.record.fields.Kursfamilj).toBe('RIM');
    expect(body.record.fields.Kursnivå).toBe('Nivå 1');
    // MEDVETET: Event förblir satt (storage-path-ankaret) — se
    // upload-attachment/index.ts § filhuvudet.
    expect(body.record.fields.Event).toEqual([BELAGGNING_EVENT_ID]);
  });

  test('allow: rackvidd Alla event (inga kursfält) → 201, Kursfamilj/Kursnivå UTELÄMNADE', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Alla event',
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };

    expect(body.record.fields.Räckvidd).toBe('Alla event');
    expect(body.record.fields.Kursfamilj).toBeUndefined();
    expect(body.record.fields.Kursnivå).toBeUndefined();
  });

  test('deny: rackvidd Kurstyp UTAN kursfamilj → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Kurstyp',
    });
    expect(res.status()).toBe(400);
  });

  test('deny: kursfamilj angiven trots rackvidd Event (default) → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      kursfamilj: 'RIM',
    });
    expect(res.status()).toBe(400);
  });

  test('deny: okänt rackvidd-värde → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Alla kurser',
    });
    expect(res.status()).toBe(400);
  });

  test('deny: okänt kursfamilj-värde → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Kurstyp',
      kursfamilj: 'RIM 4',
    });
    expect(res.status()).toBe(400);
  });
});
