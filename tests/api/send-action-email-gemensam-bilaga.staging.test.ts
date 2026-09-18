// send-action-email × Gemensam bilaga cross-event — skarp conformance mot
// deployad staging-EF (TASK-452).
//
// FYNDET (docs/research/utskicksytan-karta-och-historik-2026-09-18.md § A2):
// `get-event-attachments` (och därmed BilageValjare) VISAR en `Gemensam`-
// bilaga på varje event den matchar via `matcharEvent`
// (`_shared/rackvidd-matchning.ts`), oavsett vilket event bilagan skapades
// mot. Men `send-action-email`s `resolveAttachments` prövade ENDAST om
// bilagans `Event`-länk bokstavligen innehöll det sändande eventets ID — en
// Gemensam bilaga vald på ett ANNAT event än ursprungseventet gav därför 400
// "does not belong to event" vid sändning, trots att UI:t precis visat den
// som valbar. SKARPT STAGING-BEVISAT (2026-09-18, FÖRE denna PR:s fix):
// riktig round-trip via Åtgärds-sidan (`fritt`-utskick, sentinel-mottagare
// `delivered@resend.dev`) gav HTTP 400
// `{"error":"Attachment recXGGchXXsckJtWT does not belong to event
// recDUMxyXI8hFHOg3"}`, `sb-request-id: 01a0b434-854c-74c7-9f86-
// 04b76a4b2149`. Fixturerna för det manuella beviset raderades igen efter
// mätningen (staging-basen lämnad orörd); DENNA fil är den bestående
// regressionsvakten.
//
// RÄTTNINGEN (TASK-452): `resolveAttachments` prövar nu
// `farBilaganSkickasForEvent` (delad, `_shared/rackvidd-matchning.ts`) —
// SAMMA union `get-event-attachments` redan visar: (a) bilagan är länkad
// till eventet, ELLER (b) bilagan är `Gemensam` och matchar eventets axlar
// via `matcharEvent`. Detta test bevisar (b) som BETEENDE mot den deployade
// EF:en — aldrig hur matchningen är byggd (den är redan enhetstestad i
// `rackvidd-matchning.test.ts`).
//
// FAIL-CLOSED-REGRESSIONEN (AC #2:s andra krav) bevisas i SAMMA fil: en
// `Event`-räckviddig bilaga (default, INTE Gemensam) länkad till ETT event
// ska FORTFARANDE ge 400 när den skickas på ett ANNAT event — fixen breddar
// ALDRIG utöver unionen visningen redan lovar.
//
// EGNA, FÄRSKA event (create-event) — MEDVETET, INTE de permanenta
// BELAGGNING_EVENT_ID/ARBETSKO_EVENT_ID-fixturerna: flera andra
// *.staging.test.ts-filer (get-event, get-registrations, get-leads,
// send-registration-confirmation m.fl.) håller EXAKTA anmälnings-
// räkningsförväntningar mot de fixturerna (t.ex. `BELAGGNING_EXPECTED`,
// `ARBETSKO_EXPECTED.antalAnmalningar`). En ny Anmälan skapad DÄR hade tyst
// spräckt de förväntningarna i en HELT ANNAN fil.
//
// [TASK-465 granskning runda 1, FYND 2] BÅDE eventen OCH anmälningarna
// registreras nu i ägar-manifestet (`registreraKastbarPost`) och städas av
// efter-körning-purgen. Anmälningarna bär Resends KANONISKA testadress
// `delivered@resend.dev` (den enda icke-prod-spärren tillåter EF:en att
// faktiskt dispatcha mot) — en EGEN, smal purge-target
// (`send-action-email-gemensam-bilaga-registration-sentineler`,
// `.purge-staging-policy.json`) krävs vid sidan av registreringen, eftersom
// adressen inte matchar `create-registration-sentineler`s
// `create-test+…@staging.test`-formel.
//
// AXELLÖS Gemensam bilaga (`rackvidd: 'Gemensam'`, inga axlar satta) matchar
// VARJE event ("noll axlar = alla event", `matcharEvent`s docblock) — samma
// form `get-event-attachments.staging.test.ts`s FÖRSTA räckviddstest redan
// bevisar. Detta gör testet oberoende av vilken Kursfamilj `create-event`
// råkar härleda ur eventnamnet: bilagan behöver inte matcha en SPECIFIK
// familj, bara VARA Gemensam.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att
// `send-action-email` deployats till staging (denna PR:s egen deploy).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const SEND_ENDPOINT = '/functions/v1/send-action-email';
const UPLOAD_ENDPOINT = '/functions/v1/upload-attachment';
const DELETE_ENDPOINT = '/functions/v1/delete-attachment';
const CREATE_EVENT_ENDPOINT = '/functions/v1/create-event';
const CREATE_REGISTRATION_ENDPOINT = '/functions/v1/create-registration';
const SENTINEL_ORT = 'ZZ-create-event-test';

// Samma seedade Eventformat-ankare som get-event-attachments.staging.test.ts/
// create-event.staging.test.ts (samma fixtur, delad hemvist saknas — house-
// mönstret dupliceras medvetet per fil).
const SEEDED_EVENTFORMAT_ID = 'recclDd7hUQsfxoVs';
function eventformatId(): string {
  return process.env.TEST_EVENTFORMAT_RECORD_ID || SEEDED_EVENTFORMAT_ID;
}

/** Auktoritativ Resend-test-adress (RESEND_TEST_ADDRESSES,
 *  `_shared/send-bulk.ts`) — den ENDA typ av adress icke-prod-spärren
 *  tillåter `send-action-email` att faktiskt dispatcha mot. */
const SENTINEL_EMAIL = 'delivered@resend.dev';

function buildPseudoPdfBase64(totalBytes: number): string {
  const header = '%PDF-1.4\n%';
  const footer = '\n%%EOF';
  const fillLength = totalBytes - header.length - footer.length;
  const content = header + 'A'.repeat(fillLength) + footer;
  return Buffer.from(content, 'utf8').toString('base64');
}

/** Skapar ett FRÄSCHT, kastbart event (create-event) — registrerat för
 *  efterköringens purge-svep (`registreraKastbarPost`). */
async function skapaEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  startdatum: string,
  slutdatum: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${CREATE_EVENT_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      event: 'Fjärrskådning',
      typ: 'Utbildning',
      ort: SENTINEL_ORT,
      startdatum,
      slutdatum,
      maxPlatser: 20,
      eventtyp: eventformatId(),
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup create-event misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as { record: { id: string } };
  registreraKastbarPost(body.record.id, 'send-action-email-gemensam-bilaga/Eventplanering');
  return body.record.id;
}

/** Laddar upp en RIKTIG bilaga (mönster 1) mot `eventId` med given räckvidd.
 *  `scope` UTELÄMNAD → default (`Event`, INTE Gemensam) — fail-closed-fallet. */
async function skapaBilaga(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  scope: { rackvidd?: string } = {},
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      eventId,
      filnamn: `ZZ-attachment-test-${randomUUID()}.pdf`,
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      ...scope,
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup-uppladdning misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as { attachment: { id: string } };
  return body.attachment.id;
}

/** Raderar en Gemensam bilaga i RÄCKVIDDSLÄGE (eventId UTELÄMNAD,
 *  TASK-275.2 AC #3) — teardown, samma mönster som get-event-attachments.
 *  staging.test.ts:s `raderaIRackviddslage`. */
async function raderaIRackviddslage(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  attachmentId: string,
): Promise<void> {
  const res = await request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { attachmentId },
  });
  expect(res.status(), await res.text()).toBe(200);
}

/** Skapar en FRÄSCH Anmälan (create-registration) mot `eventId` med given
 *  e-post. [TASK-465 granskning runda 1, FYND 2] Registreras nu i ägar-
 *  manifestet — `delivered@resend.dev` matchar VARKEN
 *  `create-registration-sentineler`s `FIND('create-test+',…)`-formel ELLER
 *  dess UUID-krävande exakt-mönster (server-side filterByFormula fetchar
 *  raden aldrig till att börja med), så en EGEN, smal target
 *  (`send-action-email-gemensam-bilaga-registration-sentineler`, se
 *  .purge-staging-policy.json) krävs vid sidan av registreringen. */
async function skapaRegistrering(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  email: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${CREATE_REGISTRATION_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      fornamn: 'ZzTask452',
      efternamn: 'Sentinel',
      email,
      telefon: null,
      eventId,
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup create-registration misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as { record: { id: string } };
  registreraKastbarPost(body.record.id, 'send-action-email-gemensam-bilaga/Anmalningar');
  return body.record.id;
}

async function skickaFritt(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  registrationId: string,
  attachmentId: string,
): Promise<APIResponse> {
  return request.post(`${config.baseUrl}${SEND_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      actionType: 'fritt',
      eventId,
      registrationIds: [registrationId],
      amne: 'TASK-452 staging-conformance',
      mailtext: 'TASK-452 staging-conformance — sentinel-mottagare, ignorera.',
      idempotencyKey: randomUUID(),
      attachmentIds: [attachmentId],
    },
  });
}

test.describe('send-action-email — Gemensam bilaga på icke-ursprungsevent (TASK-452)', () => {
  test('Gemensam bilaga (axellös, matchar alla event) syns valbar och SKICKAS på ett ANNAT event än ursprunget', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // Ursprungseventet — bilagan laddas upp HÄR.
    const ursprungsEvent = await skapaEvent(request, config, jwt, '2026-10-05', '2026-10-06');
    // Målevent — HELT ANNAT event, ingen egen bilage-länk, ingen gemensam axel behövs.
    const malEvent = await skapaEvent(request, config, jwt, '2026-10-12', '2026-10-13');
    const registrationId = await skapaRegistrering(request, config, jwt, malEvent, SENTINEL_EMAIL);

    const attachmentId = await skapaBilaga(request, config, jwt, ursprungsEvent, {
      rackvidd: 'Gemensam',
    });

    try {
      const res = await skickaFritt(request, config, jwt, malEvent, registrationId, attachmentId);
      const raw = await res.text();
      // FÖRE TASK-452s fix gav detta 400 "does not belong to event" — se
      // filhuvudets skarpa staging-bevis (request-id `01a0b434-…`). En
      // regression till 400 HÄR är EXAKT den bug denna fil vaktar mot.
      expect(res.status(), `send-action-email svarade fel: ${raw}`).toBe(200);
      const body = JSON.parse(raw) as {
        status: string;
        requested: number;
        attempted: number;
        completed: string[];
        failed: { registrationId: string; reason: string }[];
      };
      expect(body.status, JSON.stringify(body)).toBe('sent');
      expect(body.requested).toBe(1);
      expect(body.attempted).toBe(1);
      expect(body.completed).toEqual([registrationId]);
      expect(body.failed).toEqual([]);
    } finally {
      await raderaIRackviddslage(request, config, jwt, attachmentId);
    }
  });

  test('fail-closed BEVARAT: en Event-räckviddig (icke-Gemensam) bilaga ger FORTFARANDE 400 på ett annat event', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const ursprungsEvent = await skapaEvent(request, config, jwt, '2026-10-19', '2026-10-20');
    const malEvent = await skapaEvent(request, config, jwt, '2026-10-26', '2026-10-27');
    const registrationId = await skapaRegistrering(request, config, jwt, malEvent, SENTINEL_EMAIL);

    // Scope UTELÄMNAD → default `Event`-räckvidd, INTE Gemensam — matchar
    // aldrig via `matcharEvent` oavsett axlar (se den funktionens docblock,
    // "räckvidden själv — bara Gemensam matchar via filtret").
    const attachmentId = await skapaBilaga(request, config, jwt, ursprungsEvent);

    const res = await skickaFritt(request, config, jwt, malEvent, registrationId, attachmentId);
    const raw = await res.text();
    expect(res.status(), `förväntade 400 (fail-closed), fick: ${raw}`).toBe(400);
    const body = JSON.parse(raw) as { error: string };
    expect(body.error).toBe(`Attachment ${attachmentId} does not belong to event ${malEvent}`);

    // Event-räckviddig bilaga: normal radering i EGET eventkontext (INTE
    // räckviddsläge — den vägen NEKAS för icke-Gemensam, ADR-118 beslut 3).
    const del = await request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: { eventId: ursprungsEvent, attachmentId },
    });
    expect(del.status(), await del.text()).toBe(200);
  });
});
