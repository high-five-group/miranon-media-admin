// get-event-attachments — skarp conformance mot deployad staging-EF
// (TASK-275.2, ADR-118 beslut 2: unionen av tre mängder). Detta är EF:ens
// FÖRSTA dedikerade staging-testfil (tidigare oprövad direkt — bara indirekt
// konsumerad av delete-attachment.staging.test.ts/atgarder-bilageval-send.
// acceptance.test.ts). Bevisar AC #1: "Hämtningen av ett events bilagor
// returnerar unionen av tre mängder (eventets egna + kurstyps-match på
// eventets Kursfamilj/Kursnivå inkl. tom-nivå-regeln + alla-event) med
// räckviddsfältet i svaret — API-testad per mängd och i kombination":
//
//   1. Mängd (c) Alla event: en Alla-event-bilaga syns på BÅDA de permanenta
//      Fjärrskådning-fixturerna (BELAGGNING_EVENT_ID/ARBETSKO_EVENT_ID) —
//      räckvidden bryr sig inte om familj.
//   2. Mängd (b) Kurstyp, nivålös familj: en Kurstyp-bilaga (Fjärrskådning,
//      ingen nivå) syns på BÅDA fixturerna — CROSS-EVENT-beviset ADR-118
//      lovar ("även de som skapas nästa år").
//   3. Mängd (b) tom-nivå-regeln, en LEVELED familj (RIM): ett fräscht
//      RIM/Nivå 2-event (skapat här via create-event) bevisar tre grenar —
//      EXAKT nivå-match syns, en ANNAN nivå syns INTE, en TOM nivå syns
//      (tom-nivå-regeln: "hela familjen").
//   4. Familj-mismatch: en Psionautics-bilaga syns INTE på RIM-eventet.
//   5. Kombination: alla tre mängder samtidigt i ETT get-event-attachments-
//      anrop, deduplicerat, var och en med KORREKT `rackvidd` i svaret.
//   6. Baslinjen (401/404/405/CORS) — samma fyra icke-lyckade-vägar som
//      övriga EF:er i denna familj.
//
// [TILLÄGG, TASK-275.3, ADR-118 beslut 5] 7. RÄCKVIDDSLÄGET: `eventId`
//   UTELÄMNAD ⇒ ALLA gemensamma bilagor (oavsett event, INKLUSIVE en
//   GENUINT event-lös uppladdning) — en Event-räckviddig bilaga är
//   FRÅNVARANDE. Se filhuvudets tidigare "6 icke-lyckade-vägar"-räkning:
//   denna testfil bär nu 9 `test()`-fall totalt (8 + detta), inte längre 8
//   — disk-verifierat (`grep -c '^  test('`), inte en avskriven siffra.
//
// Räckviddsparametrarna sätts via upload-attachment (redan bevisad mönster-
// 1-skrivväg, TASK-275.2 AC #2 — se upload-attachment.staging.test.ts för
// den validerings-fokuserade sviten; DENNA fil återanvänder skrivvägen
// bara som SETUP för läs-sidans union-bevis).
//
// SENTINEL + TEARDOWN: Bilagor-raderna följer upload-attachment.staging.
// test.ts:s mönster (`ZZ-attachment-test-<uuid>.pdf`, purge-target
// `upload-attachment-sentineler`) — men raderas SJÄLVA av testet via
// delete-attachment i RÄCKVIDDSLÄGE (eventId utelämnad, TASK-275.2 AC #3),
// vilket dubbelt bevisar att den vägen fungerar. Det fräscha RIM-eventet
// återanvänder EXAKT create-event.staging.test.ts:s etablerade sentinel
// (`Ort = 'ZZ-create-event-test'`, samma purge-target `create-event-
// sentineler`, `linkGuard: true` — purgas först när dess Bilagor-länkar är
// borta, dvs EFTER denna sviks egen teardown). Ingen ny purge-policy-target
// behövs.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:erna
// deployats till staging.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, expect, test } from '@playwright/test';
import type { z } from 'zod';
import { AttachmentSchema } from '../../src/domain/schemas';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { ARBETSKO_EVENT_ID, BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const GET_ENDPOINT = '/functions/v1/get-event-attachments';
const UPLOAD_ENDPOINT = '/functions/v1/upload-attachment';
const DELETE_ENDPOINT = '/functions/v1/delete-attachment';
const CREATE_EVENT_ENDPOINT = '/functions/v1/create-event';
const SENTINEL_ORT = 'ZZ-create-event-test';

// Samma seedade Eventformat-ankare som create-event.staging.test.ts (samma
// fixtur, delad hemvist saknas — house-mönstret dupliceras medvetet per fil).
const SEEDED_EVENTFORMAT_ID = 'recclDd7hUQsfxoVs';
function eventformatId(): string {
  return process.env.TEST_EVENTFORMAT_RECORD_ID || SEEDED_EVENTFORMAT_ID;
}

type Attachment = z.infer<typeof AttachmentSchema>;

function sentinelFilnamn(): string {
  return `ZZ-attachment-test-${randomUUID()}.pdf`;
}

function buildPseudoPdfBase64(totalBytes: number): string {
  const header = '%PDF-1.4\n%';
  const footer = '\n%%EOF';
  const fillLength = totalBytes - header.length - footer.length;
  const content = header + 'A'.repeat(fillLength) + footer;
  return Buffer.from(content, 'utf8').toString('base64');
}

interface UploadScope {
  rackvidd?: string;
  kursfamilj?: string;
  kursniva?: string;
}

/** Laddar upp en RIKTIG bilaga (mönster 1) mot `eventId` med given räckvidd. */
async function skapaBilaga(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  scope: UploadScope = {},
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      eventId,
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(1024),
      ...scope,
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup-uppladdning misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as { attachment: unknown };
  return AttachmentSchema.parse(body.attachment).id;
}

/** Raderar en bilaga i RÄCKVIDDSLÄGE (eventId UTELÄMNAD, TASK-275.2 AC #3) — teardown för
 * gemensamma bilagor i denna svit; bevisar samtidigt "tillåts i räckviddsläge". */
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

/** Raderar en Event-räckviddig bilaga i sitt EVENTKONTEXT (den vanliga vägen, oförändrad) —
 * teardown för `rackvidd`-default-fallet i denna svit (räckviddsläge NEKAS för dem). */
async function raderaIEventkontext(
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
  expect(res.status(), await res.text()).toBe(200);
}

async function hamtaAttachments(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
): Promise<Attachment[]> {
  const res = await request.get(`${config.baseUrl}${GET_ENDPOINT}?eventId=${eventId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), await res.text()).toBe(200);
  const body = (await res.json()) as { attachments: unknown[] };
  return body.attachments.map((a) => AttachmentSchema.parse(a));
}

/** [TASK-275.3, ADR-118 beslut 5] Räckviddsläget — ANROPAS UTAN `eventId`. */
async function hamtaAllaGemensamma(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<Attachment[]> {
  const res = await request.get(`${config.baseUrl}${GET_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), await res.text()).toBe(200);
  const body = (await res.json()) as { attachments: unknown[] };
  return body.attachments.map((a) => AttachmentSchema.parse(a));
}

/** Skapar ett FRÄSCHT RIM/Nivå 2-event (create-event, ZZ-create-event-test-sentinel) —
 * ett leveled-familj-event de PERMANENTA fixturerna (båda Fjärrskådning, nivålösa) inte
 * kan bära åt oss (tom-nivå-regelns icke-degenererade fall kräver en satt Kursnivå). */
async function skapaRimNiva2Event(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${CREATE_EVENT_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      event: 'Resor i medvetandet 2',
      typ: 'Utbildning',
      ort: SENTINEL_ORT,
      startdatum: '2026-09-15',
      slutdatum: '2026-09-16',
      maxPlatser: 20,
      eventtyp: eventformatId(),
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup create-event misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as { record: { id: string; fields: Record<string, unknown> } };
  // Premiss-bevis: EXAKT samma mappning create-event.staging.test.ts redan
  // etablerat — om denna faller är det create-event/course-dimensions.ts
  // som drivit, inte detta test.
  expect(body.record.fields.Kursfamilj).toBe('RIM');
  expect(body.record.fields.Kursnivå).toBe('Nivå 2');
  // [TASK-309.15] Kastbart KOMMANDE event → ägar-manifestet, så
  // `purge:staging:efter` river det direkt i stället för att lämna det i
  // eventväljaren till nästa staging-jobbs setup-purge.
  registreraKastbarPost(body.record.id, 'get-event-attachments/Eventplanering');
  return body.record.id;
}

test.describe('get-event-attachments — union-hämtningen (TASK-275.2, ADR-118 beslut 2)', () => {
  test('mängd (c) Alla event: syns på BÅDA de permanenta fixturerna, oavsett familj', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const id = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Alla event',
    });

    const belaggning = await hamtaAttachments(request, config, jwt, BELAGGNING_EVENT_ID);
    const arbetsko = await hamtaAttachments(request, config, jwt, ARBETSKO_EVENT_ID);
    const belaggningTraff = belaggning.find((a) => a.id === id);
    const arbetskoTraff = arbetsko.find((a) => a.id === id);
    expect(belaggningTraff?.rackvidd).toBe('Alla event');
    expect(arbetskoTraff?.rackvidd).toBe('Alla event');

    await raderaIRackviddslage(request, config, jwt, id);
  });

  test('mängd (b) Kurstyp, nivålös familj (Fjärrskådning): syns CROSS-EVENT på båda fixturerna', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const id = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Kurstyp',
      kursfamilj: 'Fjärrskådning',
    });

    const belaggning = await hamtaAttachments(request, config, jwt, BELAGGNING_EVENT_ID);
    const arbetsko = await hamtaAttachments(request, config, jwt, ARBETSKO_EVENT_ID);
    const belaggningTraff = belaggning.find((a) => a.id === id);
    const arbetskoTraff = arbetsko.find((a) => a.id === id);
    expect(belaggningTraff?.rackvidd).toBe('Kurstyp');
    expect(belaggningTraff?.kursfamilj).toBe('Fjärrskådning');
    // CROSS-EVENT: bilagan skapades I BELAGGNING_EVENT_ID:s kontext men syns
    // på ARBETSKO_EVENT_ID också — ADR-118:s "ärvs av alla event av typen".
    expect(arbetskoTraff?.rackvidd).toBe('Kurstyp');

    await raderaIRackviddslage(request, config, jwt, id);
  });

  test('mängd (b) tom-nivå-regeln (RIM, leveled familj): exakt match syns, annan nivå syns INTE, tom nivå syns', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const rimEventId = await skapaRimNiva2Event(request, config, jwt);

    // UPPLADDNINGS-KONTEXTET är MEDVETET BELAGGNING_EVENT_ID (en annan,
    // orelaterad fixtur) — INTE rimEventId. Om bilagorna laddades upp MOT
    // rimEventId skulle `Event`-länken (som förblir satt oavsett räckvidd,
    // upload-attachment/index.ts § filhuvudet) ENSAM göra dem synliga via
    // mängd (a) "eventets egna", vilket hade maskerat om mängd (b)s
    // Kurstyp/Kursnivå-matchning FAKTISKT exkluderar rätt — provat och
    // fällt (rec9qETmZffNniU2f-klassen): en negativ-test-bilaga uppladdad
    // i rimEventId:s EGET kontext syntes ändå, av fel skäl.
    const exaktMatch = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Kurstyp',
      kursfamilj: 'RIM',
      kursniva: 'Nivå 2',
    });
    const annanNiva = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Kurstyp',
      kursfamilj: 'RIM',
      kursniva: 'Nivå 1',
    });
    const tomNiva = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Kurstyp',
      kursfamilj: 'RIM',
      // kursniva UTELÄMNAD — "hela familjen" (tom-nivå-regeln).
    });
    const annanFamilj = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Kurstyp',
      kursfamilj: 'Psionautics',
    });

    const attachments = await hamtaAttachments(request, config, jwt, rimEventId);
    const ids = attachments.map((a) => a.id);

    expect(ids).toContain(exaktMatch);
    expect(ids).not.toContain(annanNiva);
    expect(ids).toContain(tomNiva);
    expect(ids).not.toContain(annanFamilj);

    const tomNivaTraff = attachments.find((a) => a.id === tomNiva);
    expect(tomNivaTraff?.kursniva).toBeNull();

    // Teardown: räckviddsläge för alla fyra (samma väg oavsett om de
    // matchade eller ej — de EXISTERAR fortfarande, bara osynliga för
    // detta event).
    for (const id of [exaktMatch, annanNiva, tomNiva, annanFamilj]) {
      await raderaIRackviddslage(request, config, jwt, id);
    }
  });

  test('kombination: alla tre mängder i ETT anrop, deduplicerat, korrekt rackvidd per post', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const egen = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID); // rackvidd default → Event
    const kurstyp = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Kurstyp',
      kursfamilj: 'Fjärrskådning',
    });
    const allaEvent = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Alla event',
    });

    const attachments = await hamtaAttachments(request, config, jwt, BELAGGNING_EVENT_ID);
    const byId = new Map(attachments.map((a) => [a.id, a]));

    // Ingen dubblett — varje ID förekommer EXAKT en gång i svaret (Map-nycklarna
    // skulle annars ha kollapsat en dubblett tyst; räknar råa träffar också).
    expect(attachments.filter((a) => a.id === egen).length).toBe(1);
    expect(attachments.filter((a) => a.id === kurstyp).length).toBe(1);
    expect(attachments.filter((a) => a.id === allaEvent).length).toBe(1);

    expect(byId.get(egen)?.rackvidd).toBe('Event');
    expect(byId.get(kurstyp)?.rackvidd).toBe('Kurstyp');
    expect(byId.get(allaEvent)?.rackvidd).toBe('Alla event');

    // Teardown: `egen` är Event-räckviddig → räckviddsläge NEKAS för den
    // (AC #3, den vanliga vägen krävs); `kurstyp`/`allaEvent` är gemensamma
    // → räckviddsläge är den ENDA tillåtna vägen ur denna kontextlösa test.
    await raderaIEventkontext(request, config, jwt, BELAGGNING_EVENT_ID, egen);
    await raderaIRackviddslage(request, config, jwt, kurstyp);
    await raderaIRackviddslage(request, config, jwt, allaEvent);
  });

  test('okänt event (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(`${config.baseUrl}${GET_ENDPOINT}?eventId=recZZZZZZZZZZZZZZ`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(404);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.get(
      `${config.baseUrl}${GET_ENDPOINT}?eventId=${BELAGGNING_EVENT_ID}`,
    );
    await classify401Body(res);
  });

  test('CORS preflight: tillåten origin → 200 + Access-Control-Allow-Origin speglar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const res = await request.fetch(`${config.baseUrl}${GET_ENDPOINT}`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('fel HTTP-metod (POST) → 405', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.post(`${config.baseUrl}${GET_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: {},
    });
    expect(res.status()).toBe(405);
  });

  // TASK-275.3 (ADR-118 beslut 5) — RÄCKVIDDSLÄGET: `eventId` UTELÄMNAD ⇒
  // ALLA gemensamma bilagor (Kurstyp/Alla event), oavsett event — se
  // filhuvudets nya stycke.
  test('eventId UTELÄMNAD (räckviddsläget): ALLA gemensamma bilagor, en Event-räckviddig bilaga är FRÅNVARANDE', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // (a) Event-räckviddig — ska INTE synas i räckviddsläget.
    const egen = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID);
    // (b) Kurstyp, GENUINT EVENT-LÖS uppladdning (TASK-275.3) — bevisar
    //     samtidigt att räckviddsläget listar event-lösa gemensamma bilagor,
    //     inte bara sådana som råkar bära en Event-länk.
    const kurstypRes = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: {
        filnamn: sentinelFilnamn(),
        contentType: 'application/pdf',
        bytesBase64: buildPseudoPdfBase64(1024),
        rackvidd: 'Kurstyp',
        kursfamilj: 'Psionautics',
      },
    });
    expect(kurstypRes.status(), await kurstypRes.text()).toBe(201);
    const kurstyp = AttachmentSchema.parse((await kurstypRes.json()).attachment).id;
    // (c) Alla event, MED event (275.2:s väg — ska ändå synas i räckviddsläget).
    const allaEvent = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Alla event',
    });

    const gemensamma = await hamtaAllaGemensamma(request, config, jwt);
    const ids = gemensamma.map((a) => a.id);

    expect(ids).not.toContain(egen);
    expect(ids).toContain(kurstyp);
    expect(ids).toContain(allaEvent);

    const kurstypTraff = gemensamma.find((a) => a.id === kurstyp);
    expect(kurstypTraff?.rackvidd).toBe('Kurstyp');
    expect(kurstypTraff?.kursfamilj).toBe('Psionautics');
    expect(kurstypTraff?.eventId).toBeNull();

    // Teardown: `egen` i sitt eventkontext (den enda tillåtna vägen för
    // Event-räckvidd); `kurstyp`/`allaEvent` i räckviddsläge.
    await raderaIEventkontext(request, config, jwt, BELAGGNING_EVENT_ID, egen);
    await raderaIRackviddslage(request, config, jwt, kurstyp);
    await raderaIRackviddslage(request, config, jwt, allaEvent);
  });
});
