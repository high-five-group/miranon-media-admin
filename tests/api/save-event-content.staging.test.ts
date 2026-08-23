// save-event-content — skarp conformance mot deployad staging-EF
// (TASK-309.3 AC #3, ADR-125 § 2, Mer-sidan). Sparar en Eventinnehåll-
// radens standardtexter (de tolv egna textfälten) och/eller dess
// standardagenda (Agendapunkter länkade via `Eventinnehåll`, ersatta
// atomärt per dag).
//
// INGEN NY RAD SKAPAS — till skillnad mot save-event-text/save-place-
// standard (throwaway Eventplanering-/Platser-rader) muterar detta test EN
// AV DE SEX PERMANENTA, REDAN TOMMA seedade Eventinnehåll-raderna
// ("Psionautics" × "Utbildning" — data-model.md § Bilagornas datamodell,
// ADR-125 § 2: sju kombinationer totalt, EN fylld verbatim
// ["Resor i medvetandet 1" × "Utbildning"], sex tomma för Lotta). Radens
// eventinnehallId RESOLVAS via ETT throwaway-event (create-event, EGET
// SENTINEL, `save-event-text-eventplanering-sentineler`) + get-document-
// sources — ingen dedikerad uppslags-EF finns, och detta ÄR den redan
// byggda vägen (TASK-309.2 AC #4).
//
// SÄKERHETSSPÄRR (mutera-och-återställ, samma disciplin som
// update-record.staging.test.ts:s check-in-toggle): `beforeAll` VERIFIERAR
// att raden faktiskt ÄR tom (alla tolv fält null, agendan tom) INNAN någon
// skrivning görs. Är den INTE tom (Lotta har börjat fylla den på riktigt,
// eller en tidigare körnings `afterAll` fallerade) SKIPPAS HELA SVITEN —
// att skriva över genuint innehåll vore precis den dataförlust ADR-125 §
// 3 ("aldrig tyst regenerering") varnar för, tillämpad på skrivsidan.
// `afterAll` återställer OVILLKORLIGT (alla tolv fält → null, båda
// agenda-dagarna → []) så raden lämnas exakt som den hittades.
//
// Bevisar mot SKARP staging-data:
//   1. falt: skriver flera standardtexter i EN operation → SKRIV-BEVIS ur
//      råa record.fields, INKLUSIVE `Namn` = "Psionautics · Utbildning"
//      (satt VID VARJE skrivning, plattformsväggen) → get-document-sources
//      (via throwaway-eventet) visar de nya standardvärdena.
//   2. agenda: skriver + ersätter Eventinnehållets EGEN (=standard-)
//      agenda atomärt per dag.
//   3. null rensar ett fält (symmetriskt med save-event-text).
//   4. deny: saknat/ogiltigt eventinnehallId → 400; varken falt eller
//      agenda → 400; okänd falt-nyckel → 400.
//   5. anon (ingen JWT) → 401.
//
// Auth via getValidUserJWT. Lokalt skip:as utan creds; skarpa beviset körs
// i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { DocumentSourcesSchema } from '../../src/domain/schemas';
import { EVENTINNEHALL_FALT_KEYS } from '../../supabase/functions/_shared/eventinnehall-falt';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/save-event-content';
const CREATE_EVENT_ENDPOINT = '/functions/v1/create-event';
const GET_DOCUMENT_SOURCES_ENDPOINT = '/functions/v1/get-document-sources';

const SEEDED_EVENTFORMAT_ID = 'recclDd7hUQsfxoVs';
// En av de SEX tomma seedade kombinationerna (data-model.md § Bilagornas
// datamodell) — medvetet SKILD från "Resor i medvetandet 1" × "Utbildning"
// (den ENDA fyllda kombinationen, konsumerad READ-ONLY av
// get-document-sources.staging.test.ts via DOKUMENTUNDERLAG_EVENT_ID).
const KOMBINATION_EVENT = 'Psionautics';
const KOMBINATION_TYP = 'Utbildning';

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

async function createThrowawayEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<string> {
  const res = await postJson(request, config, jwt, CREATE_EVENT_ENDPOINT, {
    event: KOMBINATION_EVENT,
    typ: KOMBINATION_TYP,
    ort: `ZZ-TASK-309.3-content-${randomUUID()}`,
    startdatum: '2026-09-15',
    slutdatum: '2026-09-16',
    maxPlatser: 20,
    eventtyp: SEEDED_EVENTFORMAT_ID,
    idempotencyKey: randomUUID(),
  });
  expect(res.status(), await res.text()).toBe(201);
  const body = (await res.json()) as { record: { id: string } };
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

function alltTomtFalt(): Record<string, null> {
  const out: Record<string, null> = {};
  for (const key of EVENTINNEHALL_FALT_KEYS) out[key] = null;
  return out;
}

test.describe('save-event-content — conformance (TASK-309.3 AC #3, ADR-125 § 2, Mer-sidan)', () => {
  let jwt: string;
  let anchorEventId: string;
  let eventinnehallId: string;
  let preconditionOk = false;

  test.beforeAll(async ({ request }) => {
    const config = getApiConfig();
    jwt = await getValidUserJWT(request, config);
    anchorEventId = await createThrowawayEvent(request, config, jwt);
    const sources = await getDocumentSources(request, config, jwt, anchorEventId);
    if (!sources.eventinnehall) {
      throw new Error(
        `Uppslaget "${KOMBINATION_EVENT} · ${KOMBINATION_TYP}" gav ingen Eventinnehåll-rad — seed saknas eller kombinationen finns inte.`,
      );
    }
    eventinnehallId = sources.eventinnehall.id;

    // SÄKERHETSSPÄRR: raden ska vara HELT tom (data-model.md: "sex tomma
    // för Lotta"). Alla tolv fält null OCH ingen egen agenda.
    const kopior = sources.kopior as unknown as Record<string, { standard: unknown }>;
    const alleTomma = EVENTINNEHALL_FALT_KEYS.every((key) => kopior[key]?.standard === null);
    const agendaTom =
      sources.agenda.dag1.standard.length === 0 && sources.agenda.dag2.standard.length === 0;
    preconditionOk = alleTomma && agendaTom;
  });

  test.afterAll(async ({ request }) => {
    if (!eventinnehallId) return;
    const config = getApiConfig();
    // Ovillkorlig återställning (körs OAVSETT preconditionOk/testutfall) —
    // raden lämnas exakt som seed-/skrivvägen skapade den.
    await postJson(request, config, jwt, ENDPOINT, {
      eventinnehallId,
      falt: alltTomtFalt(),
      agenda: { dag: 1, rader: [] },
    });
    await postJson(request, config, jwt, ENDPOINT, {
      eventinnehallId,
      agenda: { dag: 2, rader: [] },
    });
  });

  test('falt: skriver flera standardtexter i EN operation, Namn satt vid skrivningen', async ({
    request,
  }) => {
    test.skip(
      !preconditionOk,
      'Eventinnehåll-raden var inte tom vid start — skippar (se filhuvudet).',
    );
    const config = getApiConfig();

    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventinnehallId,
      falt: {
        tid: 'ZZ-TASK-309.3-tid',
        beskrivning: 'ZZ-TASK-309.3-beskrivning',
        utrustning: 'ZZ-TASK-309.3-utrustning',
      },
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const body = JSON.parse(raw) as { record: { id: string; fields: Record<string, unknown> } };
    expect(body.record.id).toBe(eventinnehallId);
    expect(body.record.fields['Tid']).toBe('ZZ-TASK-309.3-tid');
    expect(body.record.fields['Beskrivning']).toBe('ZZ-TASK-309.3-beskrivning');
    expect(body.record.fields['Utrustning']).toBe('ZZ-TASK-309.3-utrustning');
    // Namn ÄR den icke-levande snapshotten (plattformsväggen) — satt VID
    // DENNA skrivning, inte bara vid radens ursprungliga födelse.
    expect(body.record.fields['Namn']).toBe(`${KOMBINATION_EVENT} · ${KOMBINATION_TYP}`);

    const sources = await getDocumentSources(request, config, jwt, anchorEventId);
    expect(sources.kopior.tid.standard).toBe('ZZ-TASK-309.3-tid');
    expect(sources.kopior.beskrivning.standard).toBe('ZZ-TASK-309.3-beskrivning');
    expect(sources.kopior.utrustning.standard).toBe('ZZ-TASK-309.3-utrustning');
  });

  test('falt: null rensar ett fält tillbaka till tomt', async ({ request }) => {
    test.skip(
      !preconditionOk,
      'Eventinnehåll-raden var inte tom vid start — skippar (se filhuvudet).',
    );
    const config = getApiConfig();

    await postJson(request, config, jwt, ENDPOINT, {
      eventinnehallId,
      falt: { pris: 'ZZ-TASK-309.3-pris-innan' },
    });
    let sources = await getDocumentSources(request, config, jwt, anchorEventId);
    expect(sources.kopior.pris.standard).toBe('ZZ-TASK-309.3-pris-innan');

    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventinnehallId,
      falt: { pris: null },
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };
    expect(body.record.fields['Pris']).toBeUndefined();

    sources = await getDocumentSources(request, config, jwt, anchorEventId);
    expect(sources.kopior.pris.standard).toBeNull();
  });

  test('agenda: skriver och ersätter Eventinnehållets EGEN (standard-)agenda atomärt per dag', async ({
    request,
  }) => {
    test.skip(
      !preconditionOk,
      'Eventinnehåll-raden var inte tom vid start — skippar (se filhuvudet).',
    );
    const config = getApiConfig();

    const writeRes = await postJson(request, config, jwt, ENDPOINT, {
      eventinnehallId,
      agenda: {
        dag: 1,
        rader: [
          { text: 'ZZ-TASK-309.3-standard-rad-1', meditation: true },
          { text: 'ZZ-TASK-309.3-standard-rad-2', tid: '5 min' },
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

    let sources = await getDocumentSources(request, config, jwt, anchorEventId);
    expect(sources.agenda.dag1.standard).toEqual([
      { text: 'ZZ-TASK-309.3-standard-rad-1', tid: '', meditation: true },
      { text: 'ZZ-TASK-309.3-standard-rad-2', tid: '5 min', meditation: false },
    ]);

    // Ersätt med EN annan rad — atomärt: de två gamla raderna borta.
    const replaceRes = await postJson(request, config, jwt, ENDPOINT, {
      eventinnehallId,
      agenda: { dag: 1, rader: [{ text: 'ZZ-TASK-309.3-standard-ersatt' }] },
    });
    const replaceRaw = await replaceRes.text();
    expect(replaceRes.status(), replaceRaw).toBe(200);
    const replaceBody = JSON.parse(replaceRaw) as {
      agenda: { createdIds: string[]; deletedIds: string[] };
    };
    expect(replaceBody.agenda.createdIds).toHaveLength(1);
    expect(replaceBody.agenda.deletedIds).toHaveLength(2);

    sources = await getDocumentSources(request, config, jwt, anchorEventId);
    expect(sources.agenda.dag1.standard).toEqual([
      { text: 'ZZ-TASK-309.3-standard-ersatt', tid: '', meditation: false },
    ]);

    // Städa denna tests EGNA rader innan nästa test (afterAll gör den
    // SLUTGILTIGA, ovillkorliga rensningen — detta är bara god ordning
    // mellan testerna i samma fil).
    await postJson(request, config, jwt, ENDPOINT, {
      eventinnehallId,
      agenda: { dag: 1, rader: [] },
    });
  });

  test('deny: saknat eventinnehallId → 400', async ({ request }) => {
    const config = getApiConfig();
    const res = await postJson(request, config, jwt, ENDPOINT, { falt: { tid: 'x' } });
    expect(res.status()).toBe(400);
  });

  test('deny: ogiltigt eventinnehallId (utan rec-prefix) → 400', async ({ request }) => {
    const config = getApiConfig();
    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventinnehallId: 'not-a-record-id',
      falt: { tid: 'x' },
    });
    expect(res.status()).toBe(400);
  });

  test('deny: varken falt eller agenda → 400', async ({ request }) => {
    const config = getApiConfig();
    const res = await postJson(request, config, jwt, ENDPOINT, { eventinnehallId });
    expect(res.status()).toBe(400);
  });

  test('deny: okänd falt-nyckel → 400', async ({ request }) => {
    const config = getApiConfig();
    const res = await postJson(request, config, jwt, ENDPOINT, {
      eventinnehallId,
      falt: { adress: 'x' }, // adress hör till Platser/Eventplanering, inte Eventinnehåll
    });
    expect(res.status()).toBe(400);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await postJson(request, config, undefined, ENDPOINT, {
      eventinnehallId: 'recAAAAAAAAAAAAAA',
      falt: { tid: 'x' },
    });
    await classify401Body(res);
  });
});
