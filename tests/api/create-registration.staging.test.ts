// create-registration — skarp conformance mot deployad staging-EF (Fas 6c Leverabel 4).
//
// create-registration SKRIVER (POST → ny Anmälan). Speglar update-record:s säkerhets-
// kontrakt men för CREATE. Bevisar mot SKARP staging-data:
//   1. allow: giltig create → 201 + SKRIV-BEVIS ur råa record.fields — EF:en satte BÅDE
//      EventKey ("Event-N"-form) OCH Event-länk (=route-eventId), plus Källa="Manuell" och
//      Status="Obekräftad". Domän-shapen (registration) parse:as med RegistrationSchema och
//      bär eventId + null personId (Person-länk delegeras till A2, sätts ej vid create).
//   2. 409 (affärs-unikhet): samma sentinel-person + event TVÅ ggr inom körningen → andra =
//      409 + existingName. Bevisar att EventKey-STRÄNG-filtret (ej Event-länken, T15-lärdom)
//      hittar originalet.
//   3. INVARIANT: saknad idempotencyKey → 400 (ADR-059).
//   4. deny: ogiltig eventId-form → 400 (klient-nåbar input-deny; create:s `fields` byggs
//      server-side, så field-allowlisten är en SSOT-grind mot kod-drift, ej en klient-deny-yta).
//   5. okänt event (rec-format men finns ej) → 404 (ärver get-event/get-registrations-kontraktet).
//   6. anon (ingen JWT) → 401 (delad gateway/requireUser).
//   7. CORS preflight (tillåten origin) → 200 + speglad origin (delad handleCors).
//
// SENTINEL: per-körning-UNIK markör (create-test+${uuid}@staging.test + per-anrop
// idempotencyKey via randomUUID) → ingen cross-run-kollision (allow=fräsch 201; 409=inom-
// körning-dubblett). create-registration SKRIVER skarpa staging-rader (sentinel-only);
// setup-purge är manuell/schemalagd (CI saknar Airtable-creddad seed-fas) — bounded
// sentinel-ackumulering tolereras, ADR-060.
//
// INGEN ny event-fixtur: conformance-ankaret härleds via den seedade anmälningsposten
// (TEST_REGISTRATION_RECORD_ID, samma som get-registrations/update-record), vars event
// blir create-målet — robustare än ett hårdkodat staging-event-ID (duplicerad bas, ADR-050).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan creds; skarpa
// beviset körs i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import type { z } from 'zod';
import { RegistrationSchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/create-registration';

type Registration = z.infer<typeof RegistrationSchema>;

interface CreateBody {
  fornamn?: string;
  efternamn?: string;
  email?: string;
  telefon?: string | null;
  antalPlatser?: unknown;
  notering?: unknown;
  eventId?: string;
  idempotencyKey?: string;
}

function postCreate(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: CreateBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${ENDPOINT}`, { headers, data: body });
}

function sentinelEmail(): string {
  return `create-test+${randomUUID()}@staging.test`;
}

/**
 * Härled conformance-ankaret: den seedade postens event (ingen ny event-fixtur).
 * Returnerar även `eventNamn` (TASK-363) — den seedade posten är EN webbformulär-
 * anmälan till SAMMA event som våra sentinel-creates länkas till, så dess
 * `eventNamn` (löst ur `Kurs (from Event)`/`Event (namn)`, `_shared/registration-
 * read.ts`) är facit att jämföra en NY manuell creates `eventNamn` mot.
 */
async function findSeededEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<{ eventId: string; eventNamn: string | null }> {
  const seededId = process.env.TEST_REGISTRATION_RECORD_ID ?? '';
  expect(
    seededId,
    'TEST_REGISTRATION_RECORD_ID måste vara satt i staging-env (lokalt: raden finns i .env.test.example — seed-ankaret, docs/BUILD-LOG.md)',
  ).not.toBe('');

  const res = await request.get(`${config.baseUrl}/functions/v1/get-registrations`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status()).toBe(200);
  const { registrations } = (await res.json()) as {
    registrations: { id: string; eventId: string | null; eventNamn: string | null }[];
  };
  const seeded = registrations.find((r) => r.id === seededId);
  expect(seeded, `seedad post ${seededId} hittades inte via get-registrations`).toBeTruthy();
  expect(seeded?.eventId, `seedad post ${seededId} saknar eventId (länk ej satt?)`).toBeTruthy();
  return { eventId: seeded?.eventId as string, eventNamn: seeded?.eventNamn ?? null };
}

test.describe('create-registration — skarp conformance (Fas 6c L4)', () => {
  test('allow: giltig create → 201 + skriv-bevis (EventKey + Event-länk + Källa/Status)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { eventId, eventNamn: seededEventNamn } = await findSeededEvent(request, config, jwt);

    const email = sentinelEmail();
    const res = await postCreate(request, config, jwt, {
      fornamn: 'Sentinel',
      efternamn: 'Skapad',
      email,
      telefon: null,
      eventId,
      idempotencyKey: randomUUID(),
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as {
      registration: unknown;
      record: { id: string; fields: Record<string, unknown> };
    };

    // (i) SKRIV-BEVIS ur råa record.fields — EF:en satte fälten i Airtable.
    expect(body.record.id.startsWith('rec')).toBe(true);
    expect(body.record.fields['Källa']).toBe('Manuell');
    expect(body.record.fields['Status']).toBe('Obekräftad');
    expect(body.record.fields['EventKey']).toMatch(/^Event-\d+$/); // "Event-N"-form (lookup)
    expect(body.record.fields['Event']).toEqual([eventId]); // Event-länk = route-eventId
    expect(body.record.fields['E-post']).toBe(email);
    // TASK-363: skrivningen sätter ALDRIG `Vill anmäla sig till` (annan
    // semantik, se PR-beskrivningen) — SSOT-grinden nedan bevisar det ännu
    // hårdare (deny på ett otillåtet fält), men skriv-beviset här visar att
    // vi inte av misstag lade till det som ett tillåtet create-fält.
    expect(body.record.fields['Vill anmäla sig till']).toBeUndefined();

    // (ii) Domän-shape (adapterns parse-väg) — eventId + null personId (A2 delegerad).
    const reg: Registration = RegistrationSchema.parse(body.registration);
    expect(reg.eventId).toBe(eventId);
    expect(reg.status).toBe('Obekräftad');
    expect(reg.email).toBe(email);
    expect(reg.fornamn).toBe('Sentinel');
    expect(reg.personId, 'Person-länk sätts ej vid create (delegeras till A2)').toBeNull();
    // TASK-363: rotorsaken — en MANUELL create ska ALDRIG lämna eventNamn null
    // ("(okänt event)" i aktivitetsloggen). Facit: samma värde som den seedade
    // webbformulär-anmälans eventNamn (samma event → samma Kurs (from Event)).
    expect(
      reg.eventNamn,
      'eventNamn ska aldrig vara null när Event-länken är satt (TASK-363)',
    ).toBeTruthy();
    if (seededEventNamn !== null) {
      expect(reg.eventNamn).toBe(seededEventNamn);
    }
  });

  test('allow: create med antalPlatser + notering → 201 + skriv-bevis (facit-formens sex fält, task-18.12)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { eventId } = await findSeededEvent(request, config, jwt);

    const email = sentinelEmail();
    const noteringText = 'Ringde in på telefon — betalar via faktura vecka 32.';
    const res = await postCreate(request, config, jwt, {
      fornamn: 'Sentinel',
      efternamn: 'Platser',
      email,
      telefon: null,
      antalPlatser: 3,
      notering: noteringText,
      eventId,
      idempotencyKey: randomUUID(),
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as {
      registration: unknown;
      record: { id: string; fields: Record<string, unknown> };
    };

    // (i) SKRIV-BEVIS ur råa record.fields — EF:en satte de två nya fälten i Airtable.
    expect(body.record.fields['Antal platser']).toBe(3);
    expect(body.record.fields['Notering']).toBe(noteringText);
    expect(body.record.fields['Källa']).toBe('Manuell'); // fortsatt Manuell-vertikalen

    // (ii) Domän-shape (adapterns parse-väg) bär fälten oförändrade.
    const reg: Registration = RegistrationSchema.parse(body.registration);
    expect(reg.antalPlatser).toBe(3);
    expect(reg.notering).toBe(noteringText);
  });

  test('deny: antalPlatser < 1 → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      fornamn: 'X',
      efternamn: 'Y',
      email: sentinelEmail(),
      telefon: null,
      antalPlatser: 0,
      eventId: 'recDeny0000000001', // rec-format ok; antalPlatser-grinden fäller före
      idempotencyKey: randomUUID(),
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/antalPlatser/i);
  });

  test('deny: antalPlatser icke-heltal → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      fornamn: 'X',
      efternamn: 'Y',
      email: sentinelEmail(),
      telefon: null,
      antalPlatser: 1.5,
      eventId: 'recDeny0000000001',
      idempotencyKey: randomUUID(),
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/antalPlatser/i);
  });

  test('deny: notering icke-sträng → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      fornamn: 'X',
      efternamn: 'Y',
      email: sentinelEmail(),
      telefon: null,
      notering: 123, // number → deny
      eventId: 'recDeny0000000001',
      idempotencyKey: randomUUID(),
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/notering/i);
  });

  test('409: samma sentinel-person + event två ggr → andra = 409 + existingName', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { eventId } = await findSeededEvent(request, config, jwt);
    const email = sentinelEmail();

    const first = await postCreate(request, config, jwt, {
      fornamn: 'Dubblett',
      efternamn: 'Test',
      email,
      telefon: null,
      eventId,
      idempotencyKey: randomUUID(),
    });
    expect(first.status(), await first.text()).toBe(201);

    const second = await postCreate(request, config, jwt, {
      fornamn: 'Dubblett',
      efternamn: 'Test',
      email,
      telefon: null,
      eventId,
      idempotencyKey: randomUUID(), // fräsch nyckel — 409 är affärs-unikhet, ej idempotens
    });
    expect(second.status()).toBe(409);
    const body = (await second.json()) as { existingName?: string };
    expect(body.existingName, 'EventKey-sträng-filtret ska hitta originalet').toBeTruthy();
  });

  test('INVARIANT: saknad idempotencyKey → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { eventId } = await findSeededEvent(request, config, jwt);

    const res = await postCreate(request, config, jwt, {
      fornamn: 'X',
      efternamn: 'Y',
      email: sentinelEmail(),
      telefon: null,
      eventId,
      // idempotencyKey saknas medvetet
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/Idempotency-Key/i);
  });

  test('deny: ogiltig eventId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      fornamn: 'X',
      efternamn: 'Y',
      email: sentinelEmail(),
      telefon: null,
      eventId: 'inteEttRecordId',
      idempotencyKey: randomUUID(),
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/eventId/i);
  });

  test('okänt event (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      fornamn: 'X',
      efternamn: 'Y',
      email: sentinelEmail(),
      telefon: null,
      eventId: 'recZZZZZZZZZZZZZZ',
      idempotencyKey: randomUUID(),
    });
    expect(res.status()).toBe(404);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        fornamn: 'X',
        efternamn: 'Y',
        email: 'a@b.se',
        telefon: null,
        eventId: 'recANY',
        idempotencyKey: randomUUID(),
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
});
