// create-attachment-upload-ticket + finalize-attachment-upload — skarp
// conformance mot deployade staging-EF:er (TASK-146.4 mönster 2, PRD
// task-146 "Bilage-fundamentet"). De två EF:erna testas TILLSAMMANS som EN
// flöde eftersom de är två halvor av samma kontrakt (utfärda → klienten
// laddar upp DIREKT mot lagringen → slutför) — samma "en EF-par, ett flöde"
// -form som test-attachments-storage (TASK-146.3) etablerade.
//
// Bevisar AC #4 ("funktionen utfärdar ett tidsbegränsat, path-scopat
// uppladdnings-tillstånd; klienten laddar upp direkt utan att bytesen
// passerar funktionen") som BETEENDE, inte konfiguration:
//
//   1. allow: ticket → EN RIKTIG PUT direkt mot signedUrl (Playwright
//      `request.put`, INGEN Supabase-SDK, INGEN Authorization-header — bara
//      det token som ticket:en bar) → finalize → 201 + skriv-bevis där
//      'Storlek (bytes)' är den FAKTISKA uppladdade storleken, inte ett
//      klient-påstått tal (AC #5).
//   2. "få veta direkt när filen är för stor" (PRD US11, AC #6): sizeBytes
//      över bucketens faktiska gräns → 400 i MB, INNAN något
//      uppladdningstillstånd utfärdas.
//   3. finalize med ett attachmentId som ALDRIG fick bytes uppladdade →
//      400 "hittades inte" — bevisar att server-side-verifieringen
//      (storage.list, inte ett client-påstående) faktiskt fäller.
//   4. deny/404/401/CORS för båda EF:erna.
//
// TASK-275.2 (ADR-118) tillägg — RÄCKVIDDSPARAMETRARNA trär igenom även
// mönster 2:s finalize-steg (samma AttachmentScopeInputSchema som mönster 1,
// redan uttömmande testad i upload-attachment.staging.test.ts — HÄR bevisas
// bara att TRÅDNINGEN genom ticket→PUT→finalize fungerar, inte varje
// validerings-gren igen):
//   5. allow: rackvidd Kurstyp trär igenom finalize → Räckvidd/Kursfamilj
//      skrivna. [TASK-338.4] Räckvidden landar som 'Gemensam' — legacy-
//      värdet normaliseras av `buildScopeFields` sedan TASK-338.2, med
//      `Kursfamilj` bevarad. Kontraktet ACCEPTERAR fortfarande 'Kurstyp'
//      från en installerad PWA-klient; det är lagringen som bär en modell.
//   6. deny: rackvidd Kurstyp UTAN kursfamilj i finalize-anropet → 400.
//
// SENTINEL + TEARDOWN: samma mönster som upload-attachment.staging.test.ts —
// filnamnet bär `ZZ-attachment-test-<uuid>.pdf`, Bilagor-RADEN purgas av
// .purge-staging-policy.json:s `upload-attachment-sentineler`-target.
// Storage-bytesen rensas inte (samma öppet bokförda avgränsning, se den
// filens header).
//
// ATTACH-MÅL: BELAGGNING_EVENT_ID (samma precedent som create-event-note och
// upload-attachment.staging.test.ts).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import type { z } from 'zod';
import { AttachmentSchema, AttachmentUploadTicketSchema } from '../../src/domain/schemas';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const TICKET_ENDPOINT = '/functions/v1/create-attachment-upload-ticket';
const FINALIZE_ENDPOINT = '/functions/v1/finalize-attachment-upload';
const BUCKET_FILE_SIZE_LIMIT_BYTES = 25 * 1024 * 1024;

type Ticket = z.infer<typeof AttachmentUploadTicketSchema>;
type Attachment = z.infer<typeof AttachmentSchema>;

interface TicketBody {
  eventId?: string;
  filnamn?: string;
  contentType?: string;
  sizeBytes?: number;
}

interface FinalizeBody {
  eventId?: string;
  attachmentId?: string;
  filnamn?: string;
  rackvidd?: unknown;
  kursfamilj?: unknown;
  kursniva?: unknown;
}

function postTicket(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: TicketBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${TICKET_ENDPOINT}`, { headers, data: body });
}

function postFinalize(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: FinalizeBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${FINALIZE_ENDPOINT}`, { headers, data: body });
}

function sentinelFilnamn(): string {
  return `ZZ-attachment-test-${randomUUID()}.pdf`;
}

function buildPseudoPdfBuffer(totalBytes: number): Buffer {
  const header = Buffer.from('%PDF-1.4\n%', 'utf8');
  const footer = Buffer.from('\n%%EOF', 'utf8');
  if (totalBytes < header.length + footer.length) {
    throw new Error(`totalBytes (${totalBytes}) för litet för header+footer`);
  }
  const buffer = Buffer.alloc(totalBytes);
  header.copy(buffer, 0);
  buffer.fill(0x41, header.length, totalBytes - footer.length); // 'A'-fyllnad
  footer.copy(buffer, totalBytes - footer.length);
  return buffer;
}

test.describe('create-attachment-upload-ticket + finalize-attachment-upload — skarp conformance (TASK-146.4 mönster 2)', () => {
  test('allow: ticket → RIKTIG direkt PUT mot signedUrl (ingen SDK, inget auth-token) → finalize → 201', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const filnamn = sentinelFilnamn();
    const bytes = buildPseudoPdfBuffer(7 * 1024 * 1024); // 7 MB — över mönster 1:s 6 MB-gräns

    const ticketRes = await postTicket(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn,
      contentType: 'application/pdf',
      sizeBytes: bytes.length,
    });
    const ticketRaw = await ticketRes.text();
    expect(ticketRes.status(), ticketRaw).toBe(200);
    const ticketBody = JSON.parse(ticketRaw) as { ticket: unknown };
    const ticket: Ticket = AttachmentUploadTicketSchema.parse(ticketBody.ticket);

    // AUKTORISATIONSBESLUTET är server-side (AC #5): path/attachmentId är
    // SERVER-DERIVERADE, aldrig klient-valda — kontrollera formen.
    expect(ticket.path.startsWith(`${BELAGGNING_EVENT_ID}/`)).toBe(true);
    expect(ticket.path).toContain(ticket.attachmentId);
    expect(ticket.maxBytes).toBe(BUCKET_FILE_SIZE_LIMIT_BYTES);
    // Empiriskt verifierat 2026-08-10 (se src/domain/schemas/Attachment.schema.ts).
    expect(ticket.expiresInSec).toBe(7200);

    // BYTESEN PASSERAR ALDRIG EN EF (AC #4): detta är en RIKTIG PUT direkt
    // mot lagringens signerade URL — Playwright `request.put`, INGEN
    // Supabase-SDK inblandad, INGEN Authorization-header (tokenet i
    // signedUrl:en är den enda auktoriseringen).
    const putRes = await request.put(ticket.signedUrl, {
      headers: { 'Content-Type': 'application/pdf' },
      data: bytes,
    });
    const putRaw = await putRes.text();
    expect(putRes.status(), putRaw).toBeLessThan(300);

    const finalizeRes = await postFinalize(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: ticket.attachmentId,
      filnamn,
    });
    const finalizeRaw = await finalizeRes.text();
    expect(finalizeRes.status(), finalizeRaw).toBe(201);
    const finalizeBody = JSON.parse(finalizeRaw) as {
      attachment: unknown;
      record: { id: string; fields: Record<string, unknown>; createdTime: string };
    };

    // (i) SKRIV-BEVIS — storleken är LAGRINGENS FAKTISKA storlek (AC #5:
    // server läser den, litar aldrig på ett klient-påstått tal).
    expect(finalizeBody.record.id.startsWith('rec')).toBe(true);
    expect(finalizeBody.record.fields.Namn).toBe(filnamn);
    expect(finalizeBody.record.fields['Storlek (bytes)']).toBe(bytes.length);
    expect(finalizeBody.record.fields.Event).toEqual([BELAGGNING_EVENT_ID]);
    // [TASK-147.12] mönster 2 är fortfarande klass A (samma uppladdningshandling,
    // bara stor fil) — samma värde som mönster 1 (upload-attachment.staging.test.ts).
    expect(finalizeBody.record.fields.Dokumentklass).toBe('Uppladdad');

    // (ii) Domän-shape.
    const attachment: Attachment = AttachmentSchema.parse(finalizeBody.attachment);
    expect(attachment.storlekBytes).toBe(bytes.length);
    expect(attachment.eventId).toBe(BELAGGNING_EVENT_ID);
    expect(attachment.dokumentklass).toBe('Uppladdad');
  });

  // TASK-183 — finalize-attachment-upload saknade idempotensnyckel: ett
  // klient-retry efter timeout (samma ticket, samma attachmentId) kunde
  // skapa TVÅ Bilagor-rader för samma fil. Fixen använder Lagringsnyckel
  // (deterministisk — <attachmentId>-<filnamn>, se index.ts § IDEMPOTENS)
  // som Airtable-upsert-merge-fält (ADR-066:s mönster).
  //
  // BEVISAT TVÅSIDIGT (AC #1): (a) SAMMA attachmentId retry:as → matchar →
  // EN rad, INGEN dubblett; (b) TVÅ OLIKA attachmentId (två genuint skilda
  // uppladdningar, varsin egen ticket) → TVÅ separata rader — mekanismen
  // dedupar bara äkta retries, den slår aldrig ihop olika filer.
  test('IDEMPOTENS: samma attachmentId (retry) → EN rad; olika attachmentId (ny uppladdning) → TVÅ rader', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const filnamn = sentinelFilnamn();
    const bytes = buildPseudoPdfBuffer(1024);

    const ticketRes = await postTicket(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn,
      contentType: 'application/pdf',
      sizeBytes: bytes.length,
    });
    const ticketBody = JSON.parse(await ticketRes.text()) as { ticket: unknown };
    const ticket: Ticket = AttachmentUploadTicketSchema.parse(ticketBody.ticket);

    const putRes = await request.put(ticket.signedUrl, {
      headers: { 'Content-Type': 'application/pdf' },
      data: bytes,
    });
    expect(putRes.status(), await putRes.text()).toBeLessThan(300);

    const finalizeBody = {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: ticket.attachmentId,
      filnamn,
    };

    // (1) Första finalize → 201, ny rad (createdRecords).
    const first = await postFinalize(request, config, jwt, finalizeBody);
    const firstRaw = await first.text();
    expect(first.status(), firstRaw).toBe(201);
    const firstJson = JSON.parse(firstRaw) as { record: { id: string }; created: boolean };
    expect(firstJson.created).toBe(true);
    const firstId = firstJson.record.id;

    // (2) RETRY — EXAKT samma (eventId, attachmentId, filnamn) som en klient
    // skulle skicka efter en nätverkstimeout (fetchWithRetry, src/data/utils.ts).
    // Samma Lagringsnyckel deriveras → upsert MATCHAR → 200, updatedRecords,
    // SAMMA record-ID. Ingen dubblett.
    const retry = await postFinalize(request, config, jwt, finalizeBody);
    const retryRaw = await retry.text();
    expect(retry.status(), retryRaw).toBe(200);
    const retryJson = JSON.parse(retryRaw) as { record: { id: string }; created: boolean };
    expect(retryJson.created).toBe(false);
    expect(retryJson.record.id).toBe(firstId);

    // (3) En GENUINT NY uppladdning — egen ticket, eget attachmentId, SAMMA
    // filnamn — får en ANNAN Lagringsnyckel (attachmentId är prefixet) och
    // ska INTE matcha (1)/(2):s rad. Mekanismen dedupar retries, den slår
    // aldrig ihop två olika filer bara för att filnamnet råkar vara likt.
    const ticketRes2 = await postTicket(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn,
      contentType: 'application/pdf',
      sizeBytes: bytes.length,
    });
    const ticketBody2 = JSON.parse(await ticketRes2.text()) as { ticket: unknown };
    const ticket2: Ticket = AttachmentUploadTicketSchema.parse(ticketBody2.ticket);
    expect(ticket2.attachmentId).not.toBe(ticket.attachmentId);

    const putRes2 = await request.put(ticket2.signedUrl, {
      headers: { 'Content-Type': 'application/pdf' },
      data: bytes,
    });
    expect(putRes2.status(), await putRes2.text()).toBeLessThan(300);

    const second = await postFinalize(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: ticket2.attachmentId,
      filnamn,
    });
    const secondRaw = await second.text();
    expect(second.status(), secondRaw).toBe(201);
    const secondJson = JSON.parse(secondRaw) as { record: { id: string }; created: boolean };
    expect(secondJson.created).toBe(true);
    expect(secondJson.record.id).not.toBe(firstId);
  });

  test('deny: sizeBytes över bucketens faktiska gräns → 400 i MB, INNAN ticket utfärdas (AC #6/PRD US11)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postTicket(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      sizeBytes: BUCKET_FILE_SIZE_LIMIT_BYTES + 1024,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(400);
    const body = JSON.parse(raw) as { error?: string };
    expect(body.error).toMatch(/MB/);
    expect(body.error).not.toMatch(/\d{6,}\s*byte/i);
  });

  test('deny: ogiltig sizeBytes → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postTicket(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      sizeBytes: -5,
    });
    expect(res.status()).toBe(400);
  });

  test('deny: fel content-type (inte PDF) → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postTicket(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'text/plain',
      sizeBytes: 1024,
    });
    expect(res.status()).toBe(400);
  });

  test('okänt event (rec-format men finns ej) → 404 (ticket)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postTicket(request, config, jwt, {
      eventId: 'recZZZZZZZZZZZZZZ',
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      sizeBytes: 1024,
    });
    expect(res.status()).toBe(404);
  });

  test('deny: finalize med ett attachmentId som ALDRIG fick bytes uppladdade → 400 (server-side-verifiering fäller)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postFinalize(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: randomUUID(), // giltig UUID-form, men INGET laddades upp under den
      filnamn: sentinelFilnamn(),
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(400);
    const body = JSON.parse(raw) as { error?: string };
    expect(body.error).toMatch(/hittades inte|inte.*slutförts/i);
  });

  test('deny: finalize med ogiltigt attachmentId-format → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postFinalize(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: 'inte-en-uuid',
      filnamn: sentinelFilnamn(),
    });
    expect(res.status()).toBe(400);
  });

  test('okänt event (rec-format men finns ej) → 404 (finalize)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postFinalize(request, config, jwt, {
      eventId: 'recZZZZZZZZZZZZZZ',
      attachmentId: randomUUID(),
      filnamn: sentinelFilnamn(),
    });
    expect(res.status()).toBe(404);
  });

  test('anon (ingen JWT) → 401 (ticket)', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${TICKET_ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        eventId: BELAGGNING_EVENT_ID,
        filnamn: 'x.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
      },
    });
    await classify401Body(res);
  });

  test('anon (ingen JWT) → 401 (finalize)', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${FINALIZE_ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { eventId: BELAGGNING_EVENT_ID, attachmentId: randomUUID(), filnamn: 'x.pdf' },
    });
    await classify401Body(res);
  });

  test('CORS preflight (ticket): tillåten origin → 200 + speglad origin', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.fetch(`${config.baseUrl}${TICKET_ENDPOINT}`, {
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

  test('CORS preflight (finalize): tillåten origin → 200 + speglad origin', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.fetch(`${config.baseUrl}${FINALIZE_ENDPOINT}`, {
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

  test('fel HTTP-metod (GET) → 405 (ticket)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(`${config.baseUrl}${TICKET_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });

  test('fel HTTP-metod (GET) → 405 (finalize)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(`${config.baseUrl}${FINALIZE_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });

  // TASK-275.2 (ADR-118) — räckviddsparametrarna trär igenom mönster 2:s
  // finalize-steg (se filhuvudets tillägg-stycke för avgränsningen).
  // [TASK-338.4, ADR-125 § Beslut 1] Vad som SKRIVS är numera 'Gemensam' —
  // se assertionen nedan.
  test('allow: rackvidd Kurstyp trär igenom finalize → sparas som Gemensam med Kursfamilj bevarad', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const filnamn = sentinelFilnamn();
    const bytes = buildPseudoPdfBuffer(1024);

    const ticketRes = await postTicket(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn,
      contentType: 'application/pdf',
      sizeBytes: bytes.length,
    });
    const ticketBody = JSON.parse(await ticketRes.text()) as { ticket: unknown };
    const ticket: Ticket = AttachmentUploadTicketSchema.parse(ticketBody.ticket);

    const putRes = await request.put(ticket.signedUrl, {
      headers: { 'Content-Type': 'application/pdf' },
      data: bytes,
    });
    expect(putRes.status(), await putRes.text()).toBeLessThan(300);

    const finalizeRes = await postFinalize(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: ticket.attachmentId,
      filnamn,
      rackvidd: 'Kurstyp',
      kursfamilj: 'RIM',
    });
    const raw = await finalizeRes.text();
    expect(finalizeRes.status(), raw).toBe(201);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };
    // [TASK-338.4] SPARAS SOM 'Gemensam', inte 'Kurstyp'. Sedan TASK-338.2
    // (#2084) NORMALISERAR `buildScopeFields` legacy-värdet på VÄGEN IN —
    // basen bär EN modell (ADR-063), toleransen sitter i kontraktet, inte i
    // lagringen. `Kursfamilj` bevaras: det var precis vad Kurstyp-räckvidden
    // betydde, och axlarna följer med (rackvidd-matchning.ts §
    // normaliseraRackvidd). Denna förväntan stod kvar på 'Kurstyp' och gjorde
    // staging-klassen RÖD på main tills detta kort landade.
    expect(body.record.fields.Räckvidd).toBe('Gemensam');
    expect(body.record.fields.Kursfamilj).toBe('RIM');
    expect(body.record.fields.Event).toEqual([BELAGGNING_EVENT_ID]);
  });

  test('deny: rackvidd Kurstyp UTAN kursfamilj i finalize-anropet → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const filnamn = sentinelFilnamn();
    const bytes = buildPseudoPdfBuffer(1024);

    const ticketRes = await postTicket(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn,
      contentType: 'application/pdf',
      sizeBytes: bytes.length,
    });
    const ticketBody = JSON.parse(await ticketRes.text()) as { ticket: unknown };
    const ticket: Ticket = AttachmentUploadTicketSchema.parse(ticketBody.ticket);

    const putRes = await request.put(ticket.signedUrl, {
      headers: { 'Content-Type': 'application/pdf' },
      data: bytes,
    });
    expect(putRes.status(), await putRes.text()).toBeLessThan(300);

    const finalizeRes = await postFinalize(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      attachmentId: ticket.attachmentId,
      filnamn,
      rackvidd: 'Kurstyp',
    });
    expect(finalizeRes.status()).toBe(400);
  });
});
