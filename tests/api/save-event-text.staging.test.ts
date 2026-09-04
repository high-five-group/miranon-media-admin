// save-event-text — skarp conformance mot deployad staging-EF (TASK-309.3
// AC #1, ADR-125 § 2). Repots skrivvertikal för EVENTETS EGNA kopia av ett
// bilage-block: (bilagetext)-textfält på Eventplanering, eller en dags
// Agendapunkter-rader (ersatta atomärt, länkade via `Event`).
//
// SENTINEL: varje test skapar sitt EGET throwaway-event via create-event
// (Ort-prefix `ZZ-TASK-309.3-`, `.purge-staging-policy.json`s
// `save-event-text-eventplanering-sentineler`) — HELA raden är kastbar,
// ingen "återställ ursprungsvärden"-teardown behövs (till skillnad mot
// update-event.staging.test.ts:s LÅNGLIVADE sentinel). Agenda-testens
// Agendapunkter-rader matchar `save-event-text-agendapunkter-sentineler`
// (Text-prefix samma `ZZ-TASK-309.3-`).
//
// [TASK-309.15] Varje skapat event REGISTRERAS dessutom i ägar-manifestet
// (`tests/support/kastbara-poster.ts`) så att `purge-staging-sentinels.mjs
// --efter-korning` kan radera exakt denna körnings rader direkt efteråt, i
// stället för att låta dem ligga kvar till nästa staging-jobbs setup-purge.
// Eventen bär `startdatum: '2026-09-15'` och är alltså KOMMANDE — de dök upp
// i appens eventväljare och kostade en granskningsrunda (55 kvarliggande
// mätta 2026-08-24). Setup-purgen är kvar som andra försvarslinje.
//
// Bevisar mot SKARP staging-data:
//   1. falt (AC #1, riktning 1 — FYLL): skriv ett (bilagetext)-fält → 200 +
//      SKRIV-BEVIS ur råa record.fields → get-document-sources visar
//      `kopior.<block>.kopia` = det skrivna värdet (standarden orörd).
//   2. falt (AC #1, riktning 2 — TÖM): samma fält satt till `null` → SKRIV-
//      BEVIS visar tom sträng → get-document-sources visar `kopia: null`
//      igen (tillbaka till standarden).
//   3. sistaBetalningsdag: datumfältets `null`-rensning skiljer sig från
//      textfältens (`null` direkt, ALDRIG '') — verifierat separat.
//   4. agenda: skriv 2 rader för Dag 1 → get-document-sources visar
//      `agenda.dag1.kopia` = de 2 raderna, `agenda.dag2.kopia` = [] (INTE
//      null — "har en kopia" är en hela-agendan-eller-inget-boolean).
//      ERSÄTT med 1 annan rad → EXAKT 1 rad kvar (atomärt per dag, gamla
//      raderna borta). TÖM (rader: []) BÅDA dagarna → `agenda.dag1.kopia`/
//      `agenda.dag2.kopia` båda `null` igen (tillbaka till standarden).
//   5. deny: saknat/ogiltigt eventId → 400; varken falt eller agenda → 400;
//      okänd falt-nyckel → 400; icke-sträng falt-värde → 400; tom sträng
//      (utan null) → 400 ("send null to clear"); ogiltig agenda.dag → 400;
//      agenda.rader inte en array → 400; agenda-rad utan text → 400.
//   6. anon (ingen JWT) → 401.
//
// Auth via getValidUserJWT. Lokalt skip:as utan creds; skarpa beviset körs
// i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { DocumentSourcesSchema } from '../../src/domain/schemas';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/save-event-text';
const CREATE_EVENT_ENDPOINT = '/functions/v1/create-event';
const GET_DOCUMENT_SOURCES_ENDPOINT = '/functions/v1/get-document-sources';

// Samma seedade Eventformat-ankare som create-event.staging.test.ts.
const SEEDED_EVENTFORMAT_ID = 'recclDd7hUQsfxoVs';

/** Ort-prefix — matchar `save-event-text-eventplanering-sentineler`
 *  (.purge-staging-policy.json, `^ZZ-TASK-309\.3-.*$`). Ett suffix per
 *  test-fil-körning gör varje event unikt (aldrig kolliderande värden). */
function sentinelOrt(suffix: string): string {
  return `ZZ-TASK-309.3-text-${suffix}-${randomUUID()}`;
}

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

/** Skapar ett kastbart event (Ort matchar den nya sentinel-targeten). */
async function createThrowawayEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  suffix: string,
): Promise<string> {
  const res = await postJson(request, config, jwt, CREATE_EVENT_ENDPOINT, {
    event: 'Fjärrskådning',
    typ: 'Utbildning',
    ort: sentinelOrt(suffix),
    startdatum: '2026-09-15',
    slutdatum: '2026-09-16',
    maxPlatser: 20,
    eventtyp: SEEDED_EVENTFORMAT_ID,
    idempotencyKey: randomUUID(),
  });
  expect(res.status(), await res.text()).toBe(201);
  const body = (await res.json()) as { record: { id: string } };
  registreraKastbarPost(body.record.id, `save-event-text/Eventplanering/${suffix}`);
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

test.describe('save-event-text — conformance (TASK-309.3 AC #1, ADR-125 § 2)', () => {
  test('falt (riktning 1 — FYLL): skriver ett (bilagetext)-fält, kopia ≠ standard', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'fyll');

    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      falt: { beskrivning: 'ZZ-TASK-309.3-egen-beskrivning' },
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const body = JSON.parse(raw) as { record: { id: string; fields: Record<string, unknown> } };
    expect(body.record.fields['Beskrivning (bilagetext)']).toBe('ZZ-TASK-309.3-egen-beskrivning');

    const sources = await getDocumentSources(request, config, jwt, eventId);
    expect(sources.kopior.beskrivning.kopia).toBe('ZZ-TASK-309.3-egen-beskrivning');
  });

  test('falt (riktning 2 — TÖM): null rensar fältet, kopia faller tillbaka till null', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'tom');

    await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      falt: { beskrivning: 'ZZ-TASK-309.3-innan-tomning' },
    });
    let sources = await getDocumentSources(request, config, jwt, eventId);
    expect(sources.kopior.beskrivning.kopia).toBe('ZZ-TASK-309.3-innan-tomning');

    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      falt: { beskrivning: null },
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };
    // Airtable-konventionen: rensat textfält skrivs som '' och UTELÄMNAS ur
    // efterföljande GET-svar (scalarString coercar osatt → null).
    expect(body.record.fields['Beskrivning (bilagetext)']).toBeUndefined();

    sources = await getDocumentSources(request, config, jwt, eventId);
    expect(sources.kopior.beskrivning.kopia).toBeNull();
  });

  test('sistaBetalningsdag: datumfältet rensas med null direkt (aldrig tom sträng)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'datum');

    const setRes = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      falt: { sistaBetalningsdag: '2026-09-01' },
    });
    expect(setRes.status(), await setRes.text()).toBe(200);
    let sources = await getDocumentSources(request, config, jwt, eventId);
    expect(sources.kopior.sistaBetalningsdag.kopia).toBe('2026-09-01');

    const clearRes = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      falt: { sistaBetalningsdag: null },
    });
    const raw = await clearRes.text();
    expect(clearRes.status(), raw).toBe(200);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };
    expect(body.record.fields['Sista betalningsdag (bilagetext)']).toBeUndefined();

    sources = await getDocumentSources(request, config, jwt, eventId);
    expect(sources.kopior.sistaBetalningsdag.kopia).toBeNull();
    // Standarden är ALLTID härledbar (Startdatum − 14 dagar) — aldrig null.
    expect(sources.kopior.sistaBetalningsdag.standard).toBe('2026-09-01');
  });

  test('agenda: skriver, ersätter atomärt per dag, och tömmer tillbaka till standarden', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'agenda');

    // 1) Skriv två rader för Dag 1.
    const writeRes = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      agenda: {
        dag: 1,
        rader: [
          { text: 'ZZ-TASK-309.3-rad-1', tid: '10 min', meditation: true },
          { text: 'ZZ-TASK-309.3-rad-2' },
        ],
      },
    });
    const writeRaw = await writeRes.text();
    expect(writeRes.status(), writeRaw).toBe(200);
    const writeBody = JSON.parse(writeRaw) as {
      agenda: { createdIds: string[]; deletedIds: string[] };
    };
    expect(writeBody.agenda.createdIds).toHaveLength(2);
    expect(writeBody.agenda.deletedIds).toHaveLength(0);

    let sources = await getDocumentSources(request, config, jwt, eventId);
    expect(sources.agenda.dag1.kopia).toEqual([
      { text: 'ZZ-TASK-309.3-rad-1', tid: '10 min', meditation: true },
      { text: 'ZZ-TASK-309.3-rad-2', tid: '', meditation: false },
    ]);
    // "Har en kopia" är en hela-agendan-eller-inget-boolean: Dag 2 blir en
    // TOM array (INTE null) så fort Dag 1 har minst en egen rad.
    expect(sources.agenda.dag2.kopia).toEqual([]);

    // 2) Ersätt Dag 1 med EN annan rad — de två gamla raderna ska vara borta.
    const replaceRes = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      agenda: { dag: 1, rader: [{ text: 'ZZ-TASK-309.3-ersatt' }] },
    });
    const replaceRaw = await replaceRes.text();
    expect(replaceRes.status(), replaceRaw).toBe(200);
    const replaceBody = JSON.parse(replaceRaw) as {
      agenda: { createdIds: string[]; deletedIds: string[] };
    };
    expect(replaceBody.agenda.createdIds).toHaveLength(1);
    expect(replaceBody.agenda.deletedIds).toHaveLength(2);

    sources = await getDocumentSources(request, config, jwt, eventId);
    expect(sources.agenda.dag1.kopia).toEqual([
      { text: 'ZZ-TASK-309.3-ersatt', tid: '', meditation: false },
    ]);

    // 3) Töm BÅDA dagarna — kopian faller tillbaka till standarden (null).
    await postJson(request, config, jwt, ENDPOINT, { eventId, agenda: { dag: 1, rader: [] } });
    const clearRes = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      agenda: { dag: 2, rader: [] },
    });
    expect(clearRes.status(), await clearRes.text()).toBe(200);

    sources = await getDocumentSources(request, config, jwt, eventId);
    expect(sources.agenda.dag1.kopia).toBeNull();
    expect(sources.agenda.dag2.kopia).toBeNull();
  });

  test('deny: saknat eventId → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postJson(request, config, jwt, ENDPOINT, { falt: { tid: 'x' } });
    expect(res.status()).toBe(400);
  });

  test('deny: ogiltigt eventId (utan rec-prefix) → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventId: 'not-a-record-id',
      falt: { tid: 'x' },
    });
    expect(res.status()).toBe(400);
  });

  test('deny: varken falt eller agenda → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'deny-tom-body');
    const res = await postJson(request, config, jwt, ENDPOINT, { eventId });
    expect(res.status()).toBe(400);
  });

  test('deny: okänd falt-nyckel → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'deny-okand-nyckel');
    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      falt: { paHittadNyckel: 'x' },
    });
    expect(res.status()).toBe(400);
  });

  test('deny: icke-sträng falt-värde → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'deny-icke-strang');
    const res = await postJson(request, config, jwt, ENDPOINT, { eventId, falt: { tid: 42 } });
    expect(res.status()).toBe(400);
  });

  test('deny: tom sträng (utan null) → 400 — "send null to clear"', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'deny-tom-strang');
    const res = await postJson(request, config, jwt, ENDPOINT, { eventId, falt: { tid: '' } });
    expect(res.status()).toBe(400);
  });

  test('deny: ogiltig agenda.dag → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'deny-dag');
    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      agenda: { dag: 3, rader: [] },
    });
    expect(res.status()).toBe(400);
  });

  test('deny: agenda.rader inte en array → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'deny-rader');
    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      agenda: { dag: 1, rader: 'inte-en-array' },
    });
    expect(res.status()).toBe(400);
  });

  test('deny: agenda-rad utan text → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await createThrowawayEvent(request, config, jwt, 'deny-utan-text');
    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventId,
      agenda: { dag: 1, rader: [{ tid: '10 min' }] },
    });
    expect(res.status()).toBe(400);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await postJson(request, config, undefined, ENDPOINT, {
      eventId: 'recAAAAAAAAAAAAAA',
      falt: { tid: 'x' },
    });
    await classify401Body(res);
  });
});
