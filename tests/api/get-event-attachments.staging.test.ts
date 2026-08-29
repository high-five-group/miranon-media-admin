// get-event-attachments — skarp conformance mot deployad staging-EF.
//
// [OMBYGGD, TASK-338.2, ADR-125 § Beslut 1] Räckvidden är NU ett FILTER över
// tre kombinerbara axlar (Kursfamilj · Kursnivå · Plats), matchat I KOD ur EN
// hämtning (`Räckvidd ≠ Event`). Denna svit bevisar det som BETEENDE mot den
// deployade EF:en — aldrig hur filtret är byggt (kortets Testbeslut):
//
//   1. INGA AXLAR (`Gemensam`, tomt) syns på BÅDA de permanenta
//      Fjärrskådning-fixturerna — "alla event", oavsett familj och plats.
//   2. FAMILJ-axeln, nivålös familj (Fjärrskådning): syns CROSS-EVENT på båda
//      fixturerna — beviset att en gemensam bilaga ärvs av event den aldrig
//      laddades upp ifrån.
//   3. NIVÅ-axeln på en LEVELED familj (RIM) — tom-nivå-regeln i tre grenar:
//      exakt nivå-match syns, ANNAN nivå syns INTE, TOM nivå syns.
//   4. FAMILJ-mismatch: en Psionautics-bilaga syns INTE på RIM-eventet.
//   5. Kombination + DEDUP: eventets egen + två gemensamma i ETT anrop, var
//      och en EXAKT en gång, med korrekt `rackvidd` i svaret.
//   6. Baslinjen (401/404/405/CORS).
//   7. RÄCKVIDDSLÄGET: `eventId` UTELÄMNAD ⇒ ALLA gemensamma bilagor
//      (inklusive en GENUINT event-lös uppladdning) — en Event-räckviddig
//      bilaga är FRÅNVARANDE.
//   8. PLATS-axeln (NY): ett event PÅ platsen ser platsens bilaga; ett event
//      på en ANNAN plats gör det inte; svaret bär `plats: {id, namn}`.
//   9. KOMBINATIONEN Familj + Plats (NY): RIM+plats syns bara på ett
//      RIM-event PÅ den platsen — inte på ett RIM-event någon annanstans,
//      och inte på ett event av annan familj på samma plats.
//  10. LEGACY-TOLERANSEN (NY): en uppladdning med `Kurstyp`/`Alla event`
//      (installerade PWA-klienter) syns, och svaret bär det NORMALISERADE
//      `Gemensam`. Detta är beviset att prod fungerar OAVSETT i vilken
//      ordning EF-deploy och radmigrering sker i TASK-338.6.
//
// PLATS-FIXTUREN: eventen skapas via `create-event`, vars Ort-till-Plats-
// härledning (TASK-309.30) sätter `Eventplanering.Plats` vid EXAKT en
// `Platser.Namn`-träff. `ZZ-plats-unik-fixtur` (recVWAYh1cbVQKxi7) är den
// PERMANENTA Platser-raden `create-event.staging.test.ts` redan vilar på;
// `Rönninge` (rec17l2c64foUy6WU) är den permanent seedade riktiga platsen och
// används HÄR bara som "en annan plats" att INTE matcha. Testet skapar aldrig
// en Platser-rad — det skulle bara lämna skräp bakom sig.
//
// TESTSIDANS SCHEMA: svaren läses med `StagingAttachmentSchema`. Filen är
// SMALNAD i TASK-338.4 — `rackvidd`-vidgningen är riven (domänschemat bär
// `GEMENSAM` sedan TASK-338.3), men `plats` står kvar STRIKT med avsikt:
// en EF som glömt bära axeln ska fälla sviten, inte se ut som "ingen plats".
//
// Räckviddsparametrarna sätts via upload-attachment (den bevisade mönster-1-
// skrivvägen — se upload-attachment.staging.test.ts för den validerings-
// fokuserade sviten; DENNA fil återanvänder skrivvägen bara som SETUP).
//
// SENTINEL + TEARDOWN: Bilagor-raderna följer upload-attachment.staging.
// test.ts:s mönster (`ZZ-attachment-test-<uuid>.pdf`, purge-target
// `upload-attachment-sentineler`) — men raderas SJÄLVA av testet via
// delete-attachment i RÄCKVIDDSLÄGE (eventId utelämnad), vilket dubbelt
// bevisar att den vägen fungerar för den NYA räckvidden. Eventen använder
// `create-event`s etablerade sentinel-orter (`ZZ-create-event-test` resp.
// `ZZ-plats-unik-fixtur`, purge-targets `create-event-sentineler` och
// `create-event-plats-harledning-sentineler`, båda `linkGuard: true`) — och
// bilagorna laddas därför ALDRIG upp mot dem, bara mot den permanenta
// beläggnings-fixturen, så ingen Bilagor-länk kan göra ett sentinel-event
// opurgbart. Ingen ny purge-policy-target behövs.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:erna
// deployats till staging.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, expect, test } from '@playwright/test';
import type { z } from 'zod';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { StagingAttachmentSchema } from './attachment-staging-schema';
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

// [TASK-338.4] Härledd ur datagräns-hjälparens RETURTYP i stället för ur
// det rivna skarv-schemat — samma form, en källa mindre att glömma.
type Attachment = z.infer<typeof StagingAttachmentSchema>;

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
  /** [TASK-338.2] Platser-record-ID - rackviddens tredje axel. */
  plats?: string;
}

/** De tva PERMANENTA Platser-raderna sviten vilar pa (live-lasta mot staging
 *  2026-08-29). Ingen av dem skapas eller andras har. */
const PLATS_A_ORT = 'ZZ-plats-unik-fixtur';
const PLATS_A_ID = 'recVWAYh1cbVQKxi7';
const PLATS_B_ID = 'rec17l2c64foUy6WU';

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
  return StagingAttachmentSchema.parse(body.attachment).id;
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
  return body.attachments.map((a) => StagingAttachmentSchema.parse(a));
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
  return body.attachments.map((a) => StagingAttachmentSchema.parse(a));
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

/**
 * [TASK-338.2] Skapar ett FRÄSCHT RIM/Nivå 2-event PÅ platsen `PLATS_A_ORT`.
 *
 * Plats-länken sätts inte av testet — den HÄRLEDS server-side av create-event
 * ur `Ort` (TASK-309.30, exakt en `Platser.Namn`-träff). Det är hela skälet
 * att orten är just `ZZ-plats-unik-fixtur`: den Platser-raden är permanent och
 * unik, så härledningen har en och endast en träff. Utfallet ASSERTAS här
 * (premiss-bevis) — faller det är det create-event/plats-uppslag.ts som
 * drivit, inte denna svit, och felmeddelandet ska säga det.
 */
async function skapaRimNiva2EventPaPlats(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${CREATE_EVENT_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      event: 'Resor i medvetandet 2',
      typ: 'Utbildning',
      ort: PLATS_A_ORT,
      startdatum: '2026-09-22',
      slutdatum: '2026-09-23',
      maxPlatser: 20,
      eventtyp: eventformatId(),
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup create-event (plats) misslyckades: ${raw}`).toBe(201);
  const body = JSON.parse(raw) as {
    record: { id: string; fields: Record<string, unknown> };
    platsLankning: { satt: boolean; platsId: string | null; skal: string };
  };
  expect(body.record.fields.Kursfamilj).toBe('RIM');
  expect(body.record.fields.Kursnivå).toBe('Nivå 2');
  // PREMISS-BEVISET denna svit vilar på: utan en satt Plats-länk mäter
  // plats-testerna ingenting alls.
  expect(body.platsLankning).toEqual({
    satt: true,
    platsId: PLATS_A_ID,
    skal: 'exakt-en-traff',
  });
  registreraKastbarPost(body.record.id, 'get-event-attachments/Eventplanering');
  return body.record.id;
}

test.describe('get-event-attachments — räckviddsfiltret (TASK-338.2, ADR-125 § Beslut 1)', () => {
  test('INGA axlar (Gemensam, tomt): syns på BÅDA de permanenta fixturerna, oavsett familj och plats', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const id = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
    });

    const belaggning = await hamtaAttachments(request, config, jwt, BELAGGNING_EVENT_ID);
    const arbetsko = await hamtaAttachments(request, config, jwt, ARBETSKO_EVENT_ID);
    const belaggningTraff = belaggning.find((a) => a.id === id);
    const arbetskoTraff = arbetsko.find((a) => a.id === id);
    expect(belaggningTraff?.rackvidd).toBe('Gemensam');
    expect(arbetskoTraff?.rackvidd).toBe('Gemensam');
    // Axellös betyder axellös HELA vägen ut — ingen av de tre axlarna får
    // bära ett värde svaret inte kan förklara.
    expect(belaggningTraff?.kursfamilj).toBeNull();
    expect(belaggningTraff?.kursniva).toBeNull();
    expect(belaggningTraff?.plats).toBeNull();

    await raderaIRackviddslage(request, config, jwt, id);
  });

  test('FAMILJ-axeln, nivålös familj (Fjärrskådning): syns CROSS-EVENT på båda fixturerna', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const id = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
      kursfamilj: 'Fjärrskådning',
    });

    const belaggning = await hamtaAttachments(request, config, jwt, BELAGGNING_EVENT_ID);
    const arbetsko = await hamtaAttachments(request, config, jwt, ARBETSKO_EVENT_ID);
    const belaggningTraff = belaggning.find((a) => a.id === id);
    const arbetskoTraff = arbetsko.find((a) => a.id === id);
    expect(belaggningTraff?.rackvidd).toBe('Gemensam');
    expect(belaggningTraff?.kursfamilj).toBe('Fjärrskådning');
    // CROSS-EVENT: bilagan skapades I BELAGGNING_EVENT_ID:s kontext men syns
    // på ARBETSKO_EVENT_ID också — ADR-125 § 1:s "gäller flera event".
    expect(arbetskoTraff?.rackvidd).toBe('Gemensam');

    await raderaIRackviddslage(request, config, jwt, id);
  });

  test('NIVÅ-axeln, tom-nivå-regeln (RIM, leveled familj): exakt match syns, annan nivå syns INTE, tom nivå syns', async ({
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
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
      kursniva: 'Nivå 2',
    });
    const annanNiva = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
      kursniva: 'Nivå 1',
    });
    const tomNiva = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
      // kursniva UTELÄMNAD — "hela familjen" (tom-nivå-regeln).
    });
    const annanFamilj = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
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
    const familjebunden = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
      kursfamilj: 'Fjärrskådning',
    });
    const axellos = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
    });

    const attachments = await hamtaAttachments(request, config, jwt, BELAGGNING_EVENT_ID);
    const byId = new Map(attachments.map((a) => [a.id, a]));

    // Ingen dubblett — varje ID förekommer EXAKT en gång i svaret (Map-nycklarna
    // skulle annars ha kollapsat en dubblett tyst; räknar råa träffar också).
    expect(attachments.filter((a) => a.id === egen).length).toBe(1);
    expect(attachments.filter((a) => a.id === familjebunden).length).toBe(1);
    expect(attachments.filter((a) => a.id === axellos).length).toBe(1);

    expect(byId.get(egen)?.rackvidd).toBe('Event');
    expect(byId.get(familjebunden)?.rackvidd).toBe('Gemensam');
    expect(byId.get(axellos)?.rackvidd).toBe('Gemensam');

    // Teardown: `egen` är Event-räckviddig → räckviddsläge NEKAS för den
    // (den vanliga vägen krävs); de två gemensamma → räckviddsläge är den
    // ENDA tillåtna vägen ur denna kontextlösa test.
    await raderaIEventkontext(request, config, jwt, BELAGGNING_EVENT_ID, egen);
    await raderaIRackviddslage(request, config, jwt, familjebunden);
    await raderaIRackviddslage(request, config, jwt, axellos);
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
    // (b) Gemensam med familj, GENUINT EVENT-LÖS uppladdning — bevisar
    //     samtidigt att räckviddsläget listar event-lösa gemensamma bilagor,
    //     inte bara sådana som råkar bära en Event-länk.
    const kurstypRes = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: {
        filnamn: sentinelFilnamn(),
        contentType: 'application/pdf',
        bytesBase64: buildPseudoPdfBase64(1024),
        rackvidd: 'Gemensam',
        kursfamilj: 'Psionautics',
      },
    });
    expect(kurstypRes.status(), await kurstypRes.text()).toBe(201);
    const kurstyp = StagingAttachmentSchema.parse((await kurstypRes.json()).attachment).id;
    // (c) Gemensam MED event (275.2:s väg — ska ändå synas i räckviddsläget).
    const allaEvent = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
    });

    const gemensamma = await hamtaAllaGemensamma(request, config, jwt);
    const ids = gemensamma.map((a) => a.id);

    expect(ids).not.toContain(egen);
    expect(ids).toContain(kurstyp);
    expect(ids).toContain(allaEvent);

    const kurstypTraff = gemensamma.find((a) => a.id === kurstyp);
    expect(kurstypTraff?.rackvidd).toBe('Gemensam');
    expect(kurstypTraff?.kursfamilj).toBe('Psionautics');
    expect(kurstypTraff?.eventId).toBeNull();

    // Teardown: `egen` i sitt eventkontext (den enda tillåtna vägen för
    // Event-räckvidd); `kurstyp`/`allaEvent` i räckviddsläge.
    await raderaIEventkontext(request, config, jwt, BELAGGNING_EVENT_ID, egen);
    await raderaIRackviddslage(request, config, jwt, kurstyp);
    await raderaIRackviddslage(request, config, jwt, allaEvent);
  });

  // ══ TASK-338.2, ADR-125 § Beslut 1 — PLATS-AXELN ══════════════════════
  test('PLATS-axeln: eventet PÅ platsen ser bilagan, ett event på ANNAN plats gör det inte, svaret bär plats {id, namn}', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const platsEventId = await skapaRimNiva2EventPaPlats(request, config, jwt);

    // UPPLADDNINGS-KONTEXTET är MEDVETET BELAGGNING_EVENT_ID (en annan,
    // orelaterad fixtur), aldrig `platsEventId` — annars hade `Event`-länken
    // ENSAM gjort bilagan synlig via mängd (a) och maskerat om plats-axeln
    // faktiskt diskriminerar. Samma fälla nivå-testet ovan redan bokför.
    const platsA = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
      plats: PLATS_A_ID,
    });
    const platsB = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
      plats: PLATS_B_ID,
    });

    const paPlatsen = await hamtaAttachments(request, config, jwt, platsEventId);
    const paPlatsenIds = paPlatsen.map((a) => a.id);
    expect(paPlatsenIds).toContain(platsA);
    // "Ett event på annan plats ser den inte" — eventet ÄR på plats A, och
    // bilagan är bunden till plats B.
    expect(paPlatsenIds).not.toContain(platsB);

    // Ett event UTAN Plats-länk ser ingen av dem. Kontrollen körs mot
    // ARBETSKO_EVENT_ID, inte mot BELAGGNING_EVENT_ID — och skillnaden är
    // hela poängen: bilagorna LADDADES UPP i beläggnings-fixturens kontext,
    // så deras `Event`-länk pekar dit, och mängd (a) "eventets egna" visar
    // dem där OAVSETT räckvidd (upload-attachment/index.ts § filhuvudet:
    // `Event` förblir satt även för en gemensam bilaga, den bär
    // storage-path-ankaret). Att kräva frånvaro på uppladdnings-eventet
    // hade alltså mätt fel mekanism — RÖTT-FÖRST-BELAGT: den första
    // versionen av detta test gjorde precis det och fälldes av staging.
    // ARBETSKO_EVENT_ID är den andra permanenta fixturen: Fjärrskådning,
    // INGEN Plats-länk (live-verifierat mot staging 2026-08-29) och aldrig
    // uppladdnings-kontext här.
    const utanPlats = await hamtaAttachments(request, config, jwt, ARBETSKO_EVENT_ID);
    const utanPlatsIds = utanPlats.map((a) => a.id);
    expect(utanPlatsIds).not.toContain(platsA);
    expect(utanPlatsIds).not.toContain(platsB);

    // Svaret bär platsen UPPLÖST — id för matchning, namn för Lotta.
    const traff = paPlatsen.find((a) => a.id === platsA);
    expect(traff?.rackvidd).toBe('Gemensam');
    expect(traff?.plats).toEqual({ id: PLATS_A_ID, namn: PLATS_A_ORT });

    await raderaIRackviddslage(request, config, jwt, platsA);
    await raderaIRackviddslage(request, config, jwt, platsB);
  });

  test('KOMBINATIONEN Familj + Plats: RIM+plats syns bara på ett RIM-event PÅ den platsen', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const platsEventId = await skapaRimNiva2EventPaPlats(request, config, jwt);

    const rimPaPlatsA = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
      plats: PLATS_A_ID,
    });
    const rimPaPlatsB = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
      plats: PLATS_B_ID,
    });
    const psionauticsPaPlatsA = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Gemensam',
      kursfamilj: 'Psionautics',
      plats: PLATS_A_ID,
    });

    const attachments = await hamtaAttachments(request, config, jwt, platsEventId);
    const ids = attachments.map((a) => a.id);

    // Eventet är RIM/Nivå 2 PÅ plats A — bara den bilaga vars BÅDA axlar
    // stämmer får synas. De två andra är OCH-beviset: ett ELLER hade
    // släppt igenom båda (den ena delar familj, den andra delar plats).
    expect(ids).toContain(rimPaPlatsA);
    expect(ids).not.toContain(rimPaPlatsB);
    expect(ids).not.toContain(psionauticsPaPlatsA);

    const traff = attachments.find((a) => a.id === rimPaPlatsA);
    expect(traff?.kursfamilj).toBe('RIM');
    expect(traff?.kursniva).toBeNull();
    expect(traff?.plats).toEqual({ id: PLATS_A_ID, namn: PLATS_A_ORT });

    for (const id of [rimPaPlatsA, rimPaPlatsB, psionauticsPaPlatsA]) {
      await raderaIRackviddslage(request, config, jwt, id);
    }
  });

  test('LEGACY-toleransen: en klient som skickar Kurstyp/Alla event får Gemensam tillbaka, och bilagan syns', async ({
    request,
  }) => {
    // Detta är beviset att prod fungerar OAVSETT i vilken ordning EF-deploy
    // och radmigrering sker (TASK-338.6): en installerad PWA-klient som
    // ännu inte uppdaterats skickar de gamla värdena, och de landar som
    // `Gemensam` i basen med axlarna bevarade.
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const legacyKurstyp = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Kurstyp',
      kursfamilj: 'Fjärrskådning',
    });
    const legacyAllaEvent = await skapaBilaga(request, config, jwt, BELAGGNING_EVENT_ID, {
      rackvidd: 'Alla event',
    });

    const attachments = await hamtaAttachments(request, config, jwt, BELAGGNING_EVENT_ID);
    const byId = new Map(attachments.map((a) => [a.id, a]));

    expect(byId.get(legacyKurstyp)?.rackvidd).toBe('Gemensam');
    expect(byId.get(legacyKurstyp)?.kursfamilj).toBe('Fjärrskådning');
    expect(byId.get(legacyAllaEvent)?.rackvidd).toBe('Gemensam');
    expect(byId.get(legacyAllaEvent)?.kursfamilj).toBeNull();
    expect(byId.get(legacyAllaEvent)?.plats).toBeNull();

    // Och de är GEMENSAMMA på riktigt: räckviddsläget listar dem, och
    // radering via räckviddsläget tillåts (samma väg som teardown nedan).
    const gemensamma = await hamtaAllaGemensamma(request, config, jwt);
    const gemensammaIds = gemensamma.map((a) => a.id);
    expect(gemensammaIds).toContain(legacyKurstyp);
    expect(gemensammaIds).toContain(legacyAllaEvent);

    await raderaIRackviddslage(request, config, jwt, legacyKurstyp);
    await raderaIRackviddslage(request, config, jwt, legacyAllaEvent);
  });
});
