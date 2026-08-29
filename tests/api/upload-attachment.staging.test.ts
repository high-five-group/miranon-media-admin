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
// validering, "allow/deny-testbevis" per DoD-disciplinen. OMSKRIVET i
// TASK-338.2 (ADR-125 § Beslut 1): räckvidden är nu `Event`/`Gemensam` med
// tre valfria axlar, och de gamla värdena är LEGACY som MAPPAS:
//   11. allow: LEGACY `Kurstyp` + kursfamilj/kursniva → 201, och raden
//       sparas som `Räckvidd: 'Gemensam'` med axlarna BEVARADE. `Event`
//       FÖRBLIR satt (medveten avgränsning, se index.ts § filhuvudet).
//   12. allow: LEGACY `Alla event` (inga kursfält) → 201, sparas som
//       `Gemensam` med Kursfamilj/Kursnivå OSATTA (utelämnade, inte
//       tomsträng).
//   13. deny: LEGACY `Kurstyp` UTAN kursfamilj → 400 (det gamla kontraktet
//       bevaras oförändrat för den gamla klienten).
//   14. deny: kursfamilj angiven trots rackvidd Event (default) → 400.
//   15. deny: okänt rackvidd-värde → 400.
//   16. deny: okänt kursfamilj-värde → 400.
//
// TASK-338.2 (ADR-125 § Beslut 1) tillägg — PLATS-AXELN och den levande
// `Gemensam`-räckvidden, samma allow/deny-disciplin:
//   21. allow: `Gemensam` + plats → 201, `Plats` skriven som LÄNK-array
//       ([recId]), `Platsnamn`-lookupen upplöst i svarets `plats.namn`.
//   22. allow: `Gemensam` UTAN axlar → 201, noll axlar är giltigt.
//   23. allow: `Gemensam` + kursfamilj + plats → 201, båda axlarna skrivna.
//   24. deny: `plats` med giltig rec-form men OKÄND rad → 404 (existens-
//       kontrollen mot Platser, `platsFinns`) — den viktigaste av dem:
//       utan den hade Airtable tystat ID:t och gett en PLATS-LÖS bilaga
//       synlig på ALLA event.
//   25. deny: `plats` med ogiltig FORM (inte rec…) → 400 (Zod).
//   26. deny: `plats` angiven trots räckvidd Event → 400.
//   27. deny: `kursniva` utan `kursfamilj` på `Gemensam` → 400.
//
// TASK-275.3 (ADR-118 beslut 5) tillägg — EVENT-LÖS UPPLADDNING (mönster 1,
// "allow/deny-testbevis" per DoD-disciplinen):
//   17. allow: eventId UTELÄMNAD + rackvidd Kurstyp → 201, `Event`-fältet
//       HELT FRÅNVARANDE i raw record.fields (aldrig en tom länk).
//   18. allow: eventId UTELÄMNAD + rackvidd Alla event → 201, samma.
//   19. deny: eventId UTELÄMNAD + rackvidd Event (default, ingen räckvidd
//       angiven alls) → 400 ("Ogiltigt event-id.") — en event-specifik
//       bilaga utan event är en kontradiktion, inte ett läge.
//
// TASK-316 tillägg — IDEMPOTENS, samma bugg-klass TASK-183 fixade i
// finalize-attachment-upload (rött-först-belagt, se index.ts § IDEMPOTENS
// för varför mekanismen skiljer sig från förlagan — mönster 1 har inget
// klient-hållet attachmentId över ett omförsök):
//   20. IDEMPOTENS: samma request-body (retry) → EN rad; andra bytes (en
//       genuint ny uppladdning, samma filnamn+event) → TVÅ rader.
//
// SENTINEL: filnamnet bär en per-körning-unik markör
// (`ZZ-attachment-test-<uuid>.pdf`) → ingen cross-run-kollision. TEARDOWN =
// setup-purge (ADR-060): .purge-staging-policy.json:s
// `upload-attachment-sentineler`-target raderar Bilagor-RADEN (bounded
// ackumulering tolererad, samma mönster som create-event-note-sentineler).
// De TVÅ event-lösa testerna (17/18) städar SIG SJÄLVA via delete-attachment
// i räckviddsläge (samma väg get-event-attachments.staging.test.ts redan
// bevisar) — de skapade raderna behöver aldrig vänta på setup-purgen.
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
// [TASK-338.2, SMALNAD TASK-338.4] Läser EF-svaret med testsidans schema —
// numera BARA en strikt `plats`-överskrivning (räckvidden går via
// domänschemat rakt av sedan `AttachmentScope` bär `GEMENSAM`). Se
// `attachment-staging-schema.ts` § VAD SOM ÄR KVAR för varför strikt HÄR och
// lenient i klienten är två avsikter, inte en inkonsekvens.
import { StagingAttachmentSchema } from './attachment-staging-schema';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/upload-attachment';
const DELETE_ENDPOINT = '/functions/v1/delete-attachment';
const SMALL_UPLOAD_MAX_BYTES = 6 * 1024 * 1024;

// [TASK-338.2] Den PERMANENTA Platser-raden skrivvägens plats-axel prövas mot
// (samma fixtur create-event.staging.test.ts vilar på; live-läst mot staging
// 2026-08-29). Testet skapar aldrig en Platser-rad — det hade bara lämnat
// skräp bakom sig i en tabell utan purge-target för denna svit.
const PLATS_ID = 'recVWAYh1cbVQKxi7';
const PLATS_NAMN = 'ZZ-plats-unik-fixtur';
// Rec-FORM men ingen existerande rad — provocerar existenskontrollen
// (`platsFinns`), inte Zods formkontroll.
const OKAND_PLATS_ID = 'recZZZZZZZZZZZZZZ';

// [TASK-338.4] Härledd ur datagräns-hjälparens RETURTYP i stället för ur
// det rivna skarv-schemat — samma form, en källa mindre att glömma.
type Attachment = z.infer<typeof StagingAttachmentSchema>;

interface UploadBody {
  eventId?: string | null;
  filnamn?: string;
  contentType?: string;
  bytesBase64?: string;
  rackvidd?: unknown;
  /** [TASK-338.2] Platser-record-ID (räckviddens tredje axel). `unknown`
   *  av samma skäl som `rackvidd`: deny-testerna skickar medvetet skräp. */
  plats?: unknown;
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
    const attachment: Attachment = StagingAttachmentSchema.parse(body.attachment);
    expect(attachment.namn).toBe(filnamn);
    expect(attachment.storlekBytes).toBe(2048);
    expect(attachment.eventId).toBe(BELAGGNING_EVENT_ID);
    expect(attachment.dokumentklass).toBe('Uppladdad');
    expect(attachment.rackvidd).toBe('Event');
    expect(attachment.kursfamilj).toBeNull();
    expect(attachment.kursniva).toBeNull();
  });

  // TASK-316 — upload-attachment gjorde en IDENTISK icke-merge-skrivning
  // (createAirtableRecord) mot samma Bilagor-tabell/Lagringsnyckel-fält som
  // finalize-attachment-upload hade FÖRE TASK-183: ett klient-retry
  // (fetchWithRetry, src/data/utils.ts — samma request-body skickas om vid
  // nätverksfel/5xx) kunde skapa TVÅ Bilagor-rader OCH TVÅ Storage-objekt
  // för samma fil.
  //
  // Fixen kan INTE bokstavligen kopiera TASK-183:s förlaga: finalize håller
  // ett STABILT, server-utfärdat attachmentId hos klienten (från ticket:en)
  // över ett omförsök, men mönster 1 är EN ENDA request — attachmentId
  // genererades tidigare FRISKT (crypto.randomUUID()) VARJE gång funktionen
  // kördes, så två anrop med IDENTISK body fick ändå två olika attachmentId.
  // index.ts härleder attachmentId i stället DETERMINISTISKT (SHA-256 över
  // anchor+filnamn+bytes, se index.ts § IDEMPOTENS för hela resonemanget) —
  // fortfarande 100 % server-beräknat, ingen klient-ändring, ingen ny
  // Airtable-kolumn.
  //
  // BEVISAT TVÅSIDIGT (AC #2): (a) SAMMA body (retry) → EN rad, INGEN
  // dubblett; (b) ANDRA bytes (genuint ny uppladdning, SAMMA filnamn+event)
  // → TVÅ separata rader — mekanismen dedupar bara äkta retries, den slår
  // aldrig ihop två olika filer.
  test('IDEMPOTENS: samma body (retry) → EN rad; andra bytes (ny uppladdning) → TVÅ rader', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const filnamn = sentinelFilnamn();
    const bytesBase64 = buildPseudoPdfBase64(1024);

    const body: UploadBody = {
      eventId: BELAGGNING_EVENT_ID,
      filnamn,
      contentType: 'application/pdf',
      bytesBase64,
    };

    // (1) Första uppladdningen → 201, ny rad (createdRecords).
    const first = await postUpload(request, config, jwt, body);
    const firstRaw = await first.text();
    expect(first.status(), firstRaw).toBe(201);
    const firstJson = JSON.parse(firstRaw) as { record: { id: string }; created: boolean };
    expect(firstJson.created).toBe(true);
    const firstId = firstJson.record.id;

    // (2) RETRY — EXAKT samma body som en klient skulle skicka via
    // fetchWithRetry efter en nätverkstimeout/5xx. Samma
    // (anchor, filnamn, bytes) → samma härledda attachmentId → samma
    // Lagringsnyckel → upsert MATCHAR → 200, updatedRecords, SAMMA record-ID.
    const retry = await postUpload(request, config, jwt, body);
    const retryRaw = await retry.text();
    expect(retry.status(), retryRaw).toBe(200);
    const retryJson = JSON.parse(retryRaw) as { record: { id: string }; created: boolean };
    expect(retryJson.created).toBe(false);
    expect(retryJson.record.id).toBe(firstId);

    // (3) En GENUINT NY uppladdning — SAMMA filnamn+event, men ANDRA bytes
    // (t.ex. en uppdaterad version av samma dokument) — hashar annorlunda
    // och ska INTE matcha (1)/(2):s rad.
    const second = await postUpload(request, config, jwt, {
      ...body,
      bytesBase64: buildPseudoPdfBase64(2048),
    });
    const secondRaw = await second.text();
    expect(second.status(), secondRaw).toBe(201);
    const secondJson = JSON.parse(secondRaw) as { record: { id: string }; created: boolean };
    expect(secondJson.created).toBe(true);
    expect(secondJson.record.id).not.toBe(firstId);
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

  // TASK-275.2 (ADR-118) — räckviddsparametrarnas strikta Zod-validering,
  // omskriven i TASK-338.2 (legacy-värdena MAPPAS till Gemensam).
  test('allow: LEGACY rackvidd Kurstyp + kursfamilj/kursniva → 201, sparas som Gemensam med axlarna bevarade, Event FÖRBLIR satt', async ({
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

    // BASEN bär EN modell (ADR-063): legacy-toleransen sitter i KONTRAKTET,
    // aldrig i lagringen. Klienten skickade 'Kurstyp', raden säger 'Gemensam'.
    expect(body.record.fields.Räckvidd).toBe('Gemensam');
    expect(body.record.fields.Kursfamilj).toBe('RIM');
    expect(body.record.fields.Kursnivå).toBe('Nivå 1');
    // MEDVETET: Event förblir satt (storage-path-ankaret) — se
    // upload-attachment/index.ts § filhuvudet.
    expect(body.record.fields.Event).toEqual([BELAGGNING_EVENT_ID]);
  });

  test('allow: LEGACY rackvidd Alla event (inga kursfält) → 201, sparas som Gemensam, Kursfamilj/Kursnivå UTELÄMNADE', async ({
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

    expect(body.record.fields.Räckvidd).toBe('Gemensam');
    expect(body.record.fields.Kursfamilj).toBeUndefined();
    expect(body.record.fields.Kursnivå).toBeUndefined();
    // Plats-länken sätts ALDRIG till en tom array — den utelämnas.
    expect(body.record.fields.Plats).toBeUndefined();
  });

  test('deny: LEGACY rackvidd Kurstyp UTAN kursfamilj → 400 (gamla kontraktet bevarat)', async ({
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

  // TASK-275.3 (ADR-118 beslut 5) — EVENT-LÖS UPPLADDNING (räckviddsläget,
  // se filhuvudets nya stycke).
  test('allow: eventId UTELÄMNAD + LEGACY rackvidd Kurstyp → 201, sparas som Gemensam, Event-fältet HELT FRÅNVARANDE', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // `kursfamilj: 'Fjärrskådning'` är MEDVETET VALD (å/ä) — RÖTT-FÖRST-
    // BELÄGG mot skarp staging (2026-08-17): storage-path-ANKARET
    // (`buildStorageAnchor`, _shared/attachments.ts) satte tidigare den RÅA
    // strängen som path-segment, och Supabase Storage-serverns egen
    // nyckel-validering avvisade den ("Invalid key…") — löst med en
    // ASCII-slug-tabell (`KURSFAMILJ_SLUG`). Detta test är därför INTE
    // utbytbart mot ett ASCII-namn (RIM/Psionautics) utan att tappa
    // regressionsskyddet mot exakt den buggen.
    const res = await postUpload(request, config, jwt, {
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Kurstyp',
      kursfamilj: 'Fjärrskådning',
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };

    expect(body.record.fields.Räckvidd).toBe('Gemensam');
    expect(body.record.fields.Kursfamilj).toBe('Fjärrskådning');
    // Kärnpremissen (TASK-275.3): INGEN `Event`-länk alls, inte en tom lista.
    expect(body.record.fields.Event).toBeUndefined();

    const attachment = StagingAttachmentSchema.parse(JSON.parse(raw).attachment) as Attachment;
    expect(attachment.eventId).toBeNull();

    // Städar sig själv — räckviddsläge (eventId utelämnad), samma väg
    // get-event-attachments.staging.test.ts redan bevisar.
    const delRes = await request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: { attachmentId: attachment.id },
    });
    expect(delRes.status(), await delRes.text()).toBe(200);
  });

  test('allow: eventId UTELÄMNAD + LEGACY rackvidd Alla event → 201, sparas som Gemensam, Event-fältet HELT FRÅNVARANDE', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Alla event',
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };

    expect(body.record.fields.Räckvidd).toBe('Gemensam');
    expect(body.record.fields.Event).toBeUndefined();

    const attachment = StagingAttachmentSchema.parse(JSON.parse(raw).attachment) as Attachment;
    expect(attachment.eventId).toBeNull();

    const delRes = await request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: { attachmentId: attachment.id },
    });
    expect(delRes.status(), await delRes.text()).toBe(200);
  });

  test('deny: eventId UTELÄMNAD + rackvidd Event (default) → 400 — en event-specifik bilaga utan event är en kontradiktion', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // rackvidd UTELÄMNAD OCKSÅ → default 'Event' (AttachmentScopeInputSchema)
    // — den STRIKTASTE kombinationen, ingen räddande gren.
    const res = await postUpload(request, config, jwt, {
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(400);
    const body = JSON.parse(raw) as { error?: string };
    expect(body.error).toMatch(/event-id/i);
  });

  // ══ TASK-338.2 (ADR-125 § Beslut 1) — PLATS-AXELN OCH `Gemensam` ═══════
  test('allow: Gemensam + plats → 201, Plats skriven som LÄNK-array och Platsnamn upplöst i svaret', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Gemensam',
      plats: PLATS_ID,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };

    expect(body.record.fields.Räckvidd).toBe('Gemensam');
    // LÄNK-array, aldrig ett namn: multipleRecordLinks tar record-ID:n, och
    // en namn-skrivning hade drivit isär från matchningens ID-jämförelse.
    expect(body.record.fields.Plats).toEqual([PLATS_ID]);
    // `Platsnamn` är en LOOKUP — Airtable levererar den som en ARRAY även
    // när länken bara bär en rad.
    expect(body.record.fields.Platsnamn).toEqual([PLATS_NAMN]);
    // De axlar som INTE angavs utelämnas, aldrig tomsträng.
    expect(body.record.fields.Kursfamilj).toBeUndefined();
    expect(body.record.fields.Kursnivå).toBeUndefined();

    const attachment = StagingAttachmentSchema.parse(JSON.parse(raw).attachment) as Attachment;
    expect(attachment.plats).toEqual({ id: PLATS_ID, namn: PLATS_NAMN });
  });

  test('allow: Gemensam UTAN axlar → 201, noll axlar är giltigt ("alla event")', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Gemensam',
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };

    expect(body.record.fields.Räckvidd).toBe('Gemensam');
    expect(body.record.fields.Kursfamilj).toBeUndefined();
    expect(body.record.fields.Kursnivå).toBeUndefined();
    expect(body.record.fields.Plats).toBeUndefined();

    const attachment = StagingAttachmentSchema.parse(JSON.parse(raw).attachment) as Attachment;
    expect(attachment.plats).toBeNull();
  });

  test('allow: Gemensam + kursfamilj + plats → 201, BÅDA axlarna skrivna', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
      plats: PLATS_ID,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };

    expect(body.record.fields.Räckvidd).toBe('Gemensam');
    expect(body.record.fields.Kursfamilj).toBe('RIM');
    expect(body.record.fields.Plats).toEqual([PLATS_ID]);
  });

  test('deny: plats med rec-FORM men okänd rad → 404 (existenskontrollen mot Platser)', async ({
    request,
  }) => {
    // Den viktigaste deny-vägen i skivan: Airtable TYSTAR ett okänt ID i ett
    // länkfält. Utan `platsFinns` hade raden skapats med en TOM Plats-länk
    // och bilagan blivit synlig på ALLA event i stället för en enda — en tyst
    // uppvidgning, precis den skada PRD TASK-338 berättelse 3 finns för att
    // förhindra.
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Gemensam',
      plats: OKAND_PLATS_ID,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(404);
    const body = JSON.parse(raw) as { error?: string };
    expect(body.error).toMatch(/plats/i);
  });

  test('deny: plats med ogiltig FORM (inte rec…) → 400 (Zod, före varje bas-anrop)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Gemensam',
      plats: 'Rönninge',
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(400);
  });

  test('deny: plats angiven trots räckvidd Event → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      // rackvidd UTELÄMNAD → default 'Event'.
      plats: PLATS_ID,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(400);
  });

  test('deny: kursniva utan kursfamilj på Gemensam → 400 (en nivå utan familj är ingen räckvidd)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postUpload(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      rackvidd: 'Gemensam',
      kursniva: 'Nivå 1',
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(400);
  });
});
