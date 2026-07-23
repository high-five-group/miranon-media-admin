// create-event-note — skarp conformance mot deployad staging-EF (task-18.11, ADR-075).
//
// create-event-note SKRIVER (POST → ny Anteckningar-rad). Speglar create-registration:s
// säkerhets-kontrakt men mot den ADDITIVA Anteckningar-tabellen. Bevisar mot SKARP
// staging-data:
//   1. allow: giltig create → 201 + SKRIV-BEVIS ur råa record.fields — EF:en satte
//      Anteckning (= sentinel-texten), Event-länk (= fixtur-eventId) och en icke-tom
//      Författare (SERVER-SIDE ur JWT:ns identitet, ADR-075 — klienten skickar den ALDRIG).
//      Domän-shapen (note) parse:as med EventNoteSchema och bär text/eventId/tidpunkt/forfattare.
//   2. deny: saknad text → 400; tom/whitespace text → 400; text över taket → 400.
//   3. deny: ogiltig eventId-form → 400 (klient-nåbar input-deny; create:s `fields` byggs
//      server-side, så field-allowlisten är en SSOT-grind mot kod-drift, ej klient-deny-yta).
//   4. okänt event (rec-format men finns ej) → 404 (ärver get-event-kontraktet).
//   5. anon (ingen JWT) → 401 (delad gateway/requireUser).
//   6. CORS preflight (tillåten origin) → 200 + speglad origin (delad handleCors).
//
// SENTINEL: per-körning-UNIK markör i ANTECKNINGS-TEXTEN (`ZZ-note-test+${uuid}@sentinel`)
// → ingen cross-run-kollision. create-event-note SKRIVER skarpa staging-rader (sentinel-only);
// TEARDOWN = setup-purge (ADR-060): .purge-staging-policy.json:s
// `create-event-note-sentineler`-target raderar dem (bounded ackumulering tolererad; testet
// får ALDRIG Airtable-token). Notera: raden bär en Event-länk by design → linkGuard=false.
//
// ATTACH-MÅL: den permanenta beläggnings-fixturens event (BELAGGNING_EVENT_ID) — vilket
// giltigt seedat event som helst duger som anteckningens hem (till skillnad mot
// create-registration behöver noteringen ingen specifik relaterad post).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan creds; skarpa
// beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en deployats till staging (DoD #7).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import type { z } from 'zod';
import { EventNoteSchema } from '../../src/domain/schemas';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/create-event-note';

type EventNote = z.infer<typeof EventNoteSchema>;

interface CreateBody {
  eventId?: string;
  text?: string;
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

/** Per-körning-unik sentinel-text (purge-target matchar exakt detta mönster). */
function sentinelText(): string {
  return `ZZ-note-test+${randomUUID()}@sentinel`;
}

test.describe('create-event-note — skarp conformance (task-18.11)', () => {
  test('allow: giltig create → 201 + skriv-bevis (Anteckning + Event-länk + server-satt Författare)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const text = sentinelText();

    const res = await postCreate(request, config, jwt, { eventId: BELAGGNING_EVENT_ID, text });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as {
      note: unknown;
      record: { id: string; fields: Record<string, unknown>; createdTime: string };
    };

    // (i) SKRIV-BEVIS ur råa record.fields — EF:en satte fälten i Airtable.
    expect(body.record.id.startsWith('rec')).toBe(true);
    expect(body.record.fields['Anteckning']).toBe(text);
    expect(body.record.fields['Event']).toEqual([BELAGGNING_EVENT_ID]);
    // Författaren är SERVER-SIDE-satt (ADR-075) — klienten skickade den aldrig; vi kan
    // inte förutsäga det exakta värdet (staging-userns display_name/e-post) men det
    // MÅSTE vara en icke-tom sträng.
    expect(typeof body.record.fields['Författare']).toBe('string');
    expect((body.record.fields['Författare'] as string).length).toBeGreaterThan(0);

    // (ii) Domän-shape (adapterns parse-väg) — text/eventId/tidpunkt/forfattare.
    const note: EventNote = EventNoteSchema.parse(body.note);
    expect(note.text).toBe(text);
    expect(note.eventId).toBe(BELAGGNING_EVENT_ID);
    expect(note.forfattare, 'författaren sätts server-side').toBeTruthy();
    // tidpunkt ur Airtables createdTime → parsbar ISO.
    expect(Number.isNaN(Date.parse(note.tidpunkt))).toBe(false);
  });

  test('deny: saknad text → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, { eventId: BELAGGNING_EVENT_ID });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/text/i);
  });

  test('deny: tom/whitespace text → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      text: '   \n  ',
    });
    expect(res.status()).toBe(400);
  });

  test('deny: text över taket → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      eventId: BELAGGNING_EVENT_ID,
      text: 'x'.repeat(5001),
    });
    expect(res.status()).toBe(400);
  });

  test('deny: ogiltig eventId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      eventId: 'inteEttRecordId',
      text: sentinelText(),
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/eventId/i);
  });

  test('okänt event (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      eventId: 'recZZZZZZZZZZZZZZ',
      text: sentinelText(),
    });
    expect(res.status()).toBe(404);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { eventId: 'recANY', text: 'x' },
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
