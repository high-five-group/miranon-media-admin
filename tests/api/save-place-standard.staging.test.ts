// save-place-standard — skarp conformance mot deployad staging-EF
// (TASK-309.3 AC #2, ADR-125 § 2, Del 2 § D beslut 6+8). "Spara som
// platsens standard": sparar på PLATSEN (inte eventet), föder Platser-
// raden om eventets `Ort` saknar en, länkar eventet, och TÖMMER eventets
// egen (bilagetext)-kopia för exakt de block som sparades.
//
// SENTINEL: TVÅ throwaway-events skapas med SAMMA `Ort` (`ZZ-TASK-309.3-
// plats-<uuid>`, `save-event-text-eventplanering-sentineler`) — det är
// SÅ modellen kopplar "samma plats" (beslut 8: Ort ÄR nyckeln in i
// Platser). Den nyfödda Platser-raden matchar
// `save-place-standard-platser-sentineler` (samma prefix på `Namn`).
//
// Bevisar mot SKARP staging-data:
//   1. Platsen FÖDS (AC #2): eventets Ort matchar ingen Platser-rad →
//      save-place-standard skapar en ny, `skapad: true`, `plats.namn` =
//      eventets Ort.
//   2. Eventets egen kopia TÖMS (AC #2, den redigerade eventets kopia):
//      sätt en (bilagetext)-kopia via save-event-text FÖRST → save-place-
//      standard på SAMMA block → get-document-sources visar `kopia: null`
//      efteråt (standarden gäller igen).
//   3. Ett ANNAT event på SAMMA plats får den nya standarden (AC #2, kärnan):
//      event B länkas till SAMMA Platser-rad (find, INTE create — `skapad:
//      false`, samma `plats.id`) → A ändrar standarden igen → B:s
//      get-document-sources visar den NYA standarden UTAN att B:s egen
//      kopia rörts.
//   4. deny: saknat/ogiltigt eventId → 400; falt saknas/tomt objekt → 400;
//      okänd falt-nyckel → 400; tom sträng → 400.
//   5. anon (ingen JWT) → 401.
//
// [TASK-309.7] EF:ens TVÅ NYA event-lösa lägen (Mer-sidans Platser-yta,
// ADR-125 § 7) — egen sentinel `save-place-standard-event-los-platser-
// sentineler`, prefix `ZZ-TASK-309.7-` (SKILT från 309.3:s prefix ovan:
// dessa rader skapas UTAN något throwaway-event i sikte alls):
//   6. Läge 3 (namn): skapar en NY plats direkt, `skapad: true`; ett andra
//      anrop med SAMMA namn finner den (`skapad: false`) i stället för att
//      dubblettera. `falt` FÅR utelämnas helt (skapar en tom shell).
//   7. Läge 2 (platsId): uppdaterar en BEFINTLIG plats direkt, `skapad:
//      false`, `Namn` orörd. Ingen Eventplanering-rad rörs — get-places
//      visar de nya fälten.
//   8. deny (event-lösa lägena): eventId+platsId samtidigt → 400; varken
//      eventId/platsId/namn → 400; okänt platsId → 400; platsId utan falt
//      → 400 (till skillnad från namn-läget).
//
// Auth via getValidUserJWT. Lokalt skip:as utan creds; skarpa beviset körs
// i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { DocumentSourcesSchema } from '../../src/domain/schemas';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/save-place-standard';
const SAVE_EVENT_TEXT_ENDPOINT = '/functions/v1/save-event-text';
const CREATE_EVENT_ENDPOINT = '/functions/v1/create-event';
const GET_DOCUMENT_SOURCES_ENDPOINT = '/functions/v1/get-document-sources';
const GET_PLACES_ENDPOINT = '/functions/v1/get-places';

const SEEDED_EVENTFORMAT_ID = 'recclDd7hUQsfxoVs';

function postJson(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  endpoint: string,
  body: unknown,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${endpoint}`, { headers, data: body });
}

/** Skapar ett kastbart event med GIVEN Ort (så två anrop kan dela samma
 *  "plats"). Matchar `save-event-text-eventplanering-sentineler`. */
async function createThrowawayEventWithOrt(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  ort: string,
): Promise<string> {
  const res = await postJson(request, config, jwt, CREATE_EVENT_ENDPOINT, {
    event: 'Fjärrskådning',
    typ: 'Utbildning',
    ort,
    startdatum: '2026-09-15',
    slutdatum: '2026-09-16',
    maxPlatser: 20,
    eventtyp: SEEDED_EVENTFORMAT_ID,
    idempotencyKey: randomUUID(),
  });
  expect(res.status(), await res.text()).toBe(201);
  const body = (await res.json()) as { record: { id: string } };
  // [TASK-309.15] KOMMANDE event (startdatum 2026-09-15) → syns i appens
  // eventväljare tills det städas. Registreras i ägar-manifestet så
  // `purge:staging:efter` raderar det direkt efter körningen.
  // De Platser-rader testet föder lämnas MEDVETET till setup-purgen (targets
  // `save-place-standard-platser-sentineler` + `…-event-los-…`): de är inte
  // event, når aldrig eventväljaren, och mättes till 10 rader totalt
  // 2026-08-24 mot Eventplanerings 151.
  registreraKastbarPost(body.record.id, 'save-place-standard/Eventplanering');
  return body.record.id;
}

async function getDocumentSources(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
) {
  const res = await request.get(
    `${config.baseUrl}${GET_DOCUMENT_SOURCES_ENDPOINT}?eventId=${encodeURIComponent(eventId)}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(res.status(), await res.text()).toBe(200);
  return DocumentSourcesSchema.parse(await res.json());
}

test.describe('save-place-standard — conformance (TASK-309.3 AC #2, ADR-125 § 2, Del 2 § D beslut 6+8)', () => {
  test('föder platsen, tömmer den redigerade eventets kopia, och en ANNAN event på samma plats får den nya standarden', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const sharedOrt = `ZZ-TASK-309.3-plats-${randomUUID()}`;
    const eventA = await createThrowawayEventWithOrt(request, config, jwt, sharedOrt);
    const eventB = await createThrowawayEventWithOrt(request, config, jwt, sharedOrt);

    // Förberedelse: A sätter sin EGEN adress-kopia (för att senare bevisa
    // att save-place-standard TÖMMER den).
    await postJson(request, config, jwt, SAVE_EVENT_TEXT_ENDPOINT, {
      eventId: eventA,
      falt: { adress: 'ZZ-TASK-309.3-A-egen-override' },
    });
    let sourcesA = await getDocumentSources(request, config, jwt, eventA);
    expect(sourcesA.kopior.adress.kopia).toBe('ZZ-TASK-309.3-A-egen-override');

    // 1) A sparar som platsens standard — Platsen FÖDS (Ort matchade ingen
    //    Platser-rad ännu).
    const res1 = await postJson(request, config, jwt, ENDPOINT, {
      eventId: eventA,
      falt: { adress: 'ZZ-TASK-309.3-v1-adress', parkering: 'ZZ-TASK-309.3-v1-parkering' },
    });
    const raw1 = await res1.text();
    expect(res1.status(), raw1).toBe(200);
    const body1 = JSON.parse(raw1) as {
      plats: { id: string; namn: string; skapad: boolean };
      event: { fields: Record<string, unknown> };
    };
    expect(body1.plats.skapad).toBe(true);
    expect(body1.plats.namn).toBe(sharedOrt);
    expect(body1.event.fields['Plats']).toEqual([body1.plats.id]);
    // A:s EGEN adress-kopia TÖMD i samma skrivning (beslut 6).
    expect(body1.event.fields['Adress (bilagetext)']).toBeUndefined();

    sourcesA = await getDocumentSources(request, config, jwt, eventA);
    expect(sourcesA.kopior.adress.kopia).toBeNull();
    expect(sourcesA.kopior.adress.standard).toBe('ZZ-TASK-309.3-v1-adress');
    expect(sourcesA.kopior.parkering.standard).toBe('ZZ-TASK-309.3-v1-parkering');
    expect(sourcesA.plats?.namn).toBe(sharedOrt);

    // 2) B sparar EN ANNAN standard-post (transport) på SAMMA plats — Platsen
    //    FINNS redan (find, inte create), samma plats.id.
    const res2 = await postJson(request, config, jwt, ENDPOINT, {
      eventId: eventB,
      falt: { transport: 'ZZ-TASK-309.3-v1-transport' },
    });
    const raw2 = await res2.text();
    expect(res2.status(), raw2).toBe(200);
    const body2 = JSON.parse(raw2) as { plats: { id: string; skapad: boolean } };
    expect(body2.plats.skapad).toBe(false);
    expect(body2.plats.id).toBe(body1.plats.id);

    // B ser A:s TIDIGARE satta adress-standard direkt (samma delade Platser-rad).
    let sourcesB = await getDocumentSources(request, config, jwt, eventB);
    expect(sourcesB.kopior.adress.standard).toBe('ZZ-TASK-309.3-v1-adress');
    expect(sourcesB.kopior.transport.standard).toBe('ZZ-TASK-309.3-v1-transport');
    expect(sourcesB.kopior.transport.kopia).toBeNull();

    // 3) KÄRNAN: A ändrar standarden IGEN — B ska se DEN NYA standarden utan
    //    att B:s egen kopia rörts (B har fortfarande ingen egen adress-kopia).
    const res3 = await postJson(request, config, jwt, ENDPOINT, {
      eventId: eventA,
      falt: { adress: 'ZZ-TASK-309.3-v2-adress-NY' },
    });
    expect(res3.status(), await res3.text()).toBe(200);

    sourcesB = await getDocumentSources(request, config, jwt, eventB);
    expect(sourcesB.kopior.adress.standard).toBe('ZZ-TASK-309.3-v2-adress-NY');
    expect(sourcesB.kopior.adress.kopia).toBeNull();

    sourcesA = await getDocumentSources(request, config, jwt, eventA);
    expect(sourcesA.kopior.adress.standard).toBe('ZZ-TASK-309.3-v2-adress-NY');
    expect(sourcesA.kopior.adress.kopia).toBeNull();
  });

  test('deny: saknat eventId → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postJson(request, config, jwt, ENDPOINT, { falt: { adress: 'x' } });
    expect(res.status()).toBe(400);
  });

  test('deny: ogiltigt eventId (utan rec-prefix) → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventId: 'not-a-record-id',
      falt: { adress: 'x' },
    });
    expect(res.status()).toBe(400);
  });

  test('deny: falt saknas → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEventWithOrt(
      request,
      config,
      jwt,
      `ZZ-TASK-309.3-plats-${randomUUID()}`,
    );
    const res = await postJson(request, config, jwt, ENDPOINT, { eventId });
    expect(res.status()).toBe(400);
  });

  test('deny: tomt falt-objekt → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEventWithOrt(
      request,
      config,
      jwt,
      `ZZ-TASK-309.3-plats-${randomUUID()}`,
    );
    const res = await postJson(request, config, jwt, ENDPOINT, { eventId, falt: {} });
    expect(res.status()).toBe(400);
  });

  test('deny: okänd falt-nyckel → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEventWithOrt(
      request,
      config,
      jwt,
      `ZZ-TASK-309.3-plats-${randomUUID()}`,
    );
    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      falt: { paHittadNyckel: 'x' },
    });
    expect(res.status()).toBe(400);
  });

  test('deny: tom sträng → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEventWithOrt(
      request,
      config,
      jwt,
      `ZZ-TASK-309.3-plats-${randomUUID()}`,
    );
    const res = await postJson(request, config, jwt, ENDPOINT, { eventId, falt: { adress: '' } });
    expect(res.status()).toBe(400);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await postJson(request, config, undefined, ENDPOINT, {
      eventId: 'recAAAAAAAAAAAAAA',
      falt: { adress: 'x' },
    });
    await classify401Body(res);
  });
});

async function findPlaceByName(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  namn: string,
): Promise<{ id: string; namn: string; falt: Record<string, string | null> } | undefined> {
  const res = await request.get(`${config.baseUrl}${GET_PLACES_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), await res.text()).toBe(200);
  const body = (await res.json()) as {
    places: { id: string; namn: string; falt: Record<string, string | null> }[];
  };
  return body.places.find((p) => p.namn === namn);
}

test.describe('save-place-standard — event-lösa lägen (TASK-309.7 AC #3, ADR-125 § 7)', () => {
  test('läge 3 (namn): skapar en ny plats; ett andra anrop med samma namn finner den i stället för att dubblettera', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const namn = `ZZ-TASK-309.7-plats-${randomUUID()}`;

    const res1 = await postJson(request, config, jwt, ENDPOINT, {
      namn,
      falt: { adress: 'ZZ-TASK-309.7-adress-v1' },
    });
    const raw1 = await res1.text();
    expect(res1.status(), raw1).toBe(200);
    const body1 = JSON.parse(raw1) as { plats: { id: string; namn: string; skapad: boolean } };
    expect(body1.plats.skapad).toBe(true);
    expect(body1.plats.namn).toBe(namn);

    // Andra anropet med SAMMA namn — finner (skapad: false), samma id,
    // uppdaterar fältet i stället för att skapa en dubblett.
    const res2 = await postJson(request, config, jwt, ENDPOINT, {
      namn,
      falt: { adress: 'ZZ-TASK-309.7-adress-v2' },
    });
    const raw2 = await res2.text();
    expect(res2.status(), raw2).toBe(200);
    const body2 = JSON.parse(raw2) as { plats: { id: string; skapad: boolean } };
    expect(body2.plats.skapad).toBe(false);
    expect(body2.plats.id).toBe(body1.plats.id);

    const funnen = await findPlaceByName(request, config, jwt, namn);
    expect(funnen?.id).toBe(body1.plats.id);
    expect(funnen?.falt.adress).toBe('ZZ-TASK-309.7-adress-v2');
  });

  test('läge 3 (namn) utan falt: skapar en TOM shell-rad (bara Namn)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const namn = `ZZ-TASK-309.7-shell-${randomUUID()}`;

    const res = await postJson(request, config, jwt, ENDPOINT, { namn });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const body = JSON.parse(raw) as { plats: { id: string; namn: string; skapad: boolean } };
    expect(body.plats.skapad).toBe(true);

    const funnen = await findPlaceByName(request, config, jwt, namn);
    expect(funnen?.falt.adress).toBeNull();
    expect(funnen?.falt.parkering).toBeNull();
    expect(funnen?.falt.transport).toBeNull();
    expect(funnen?.falt.klader).toBeNull();
  });

  test('läge 2 (platsId): uppdaterar en befintlig plats direkt, ingen event-koppling', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const namn = `ZZ-TASK-309.7-plats-${randomUUID()}`;

    const skapa = await postJson(request, config, jwt, ENDPOINT, {
      namn,
      falt: { adress: 'ZZ-TASK-309.7-ursprunglig' },
    });
    const platsId = (JSON.parse(await skapa.text()) as { plats: { id: string } }).plats.id;

    const res = await postJson(request, config, jwt, ENDPOINT, {
      platsId,
      falt: { adress: 'ZZ-TASK-309.7-uppdaterad', parkering: 'ZZ-TASK-309.7-parkering' },
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const body = JSON.parse(raw) as { plats: { id: string; namn: string; skapad: boolean } };
    expect(body.plats.skapad).toBe(false);
    expect(body.plats.id).toBe(platsId);
    // Namn ORÖRT — läge 2 redigerar bara adress/parkering/transport/kläder.
    expect(body.plats.namn).toBe(namn);

    const funnen = await findPlaceByName(request, config, jwt, namn);
    expect(funnen?.falt.adress).toBe('ZZ-TASK-309.7-uppdaterad');
    expect(funnen?.falt.parkering).toBe('ZZ-TASK-309.7-parkering');
  });

  test('deny: eventId OCH platsId samtidigt → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventId: 'recAAAAAAAAAAAAAA',
      platsId: 'recBBBBBBBBBBBBBB',
      falt: { adress: 'x' },
    });
    expect(res.status()).toBe(400);
  });

  test('deny: varken eventId, platsId eller namn → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postJson(request, config, jwt, ENDPOINT, { falt: { adress: 'x' } });
    expect(res.status()).toBe(400);
  });

  test('deny: okänt platsId → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postJson(request, config, jwt, ENDPOINT, {
      platsId: 'recZZZZZZZZZZZZZZ',
      falt: { adress: 'x' },
    });
    expect(res.status()).toBe(400);
  });

  test('deny: platsId utan falt → 400 (till skillnad från namn-läget)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const namn = `ZZ-TASK-309.7-plats-${randomUUID()}`;
    const skapa = await postJson(request, config, jwt, ENDPOINT, { namn });
    const platsId = (JSON.parse(await skapa.text()) as { plats: { id: string } }).plats.id;

    const res = await postJson(request, config, jwt, ENDPOINT, { platsId });
    expect(res.status()).toBe(400);
  });
});
