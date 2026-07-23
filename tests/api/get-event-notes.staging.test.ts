// get-event-notes — skarp conformance mot deployad staging-EF (task-18.11, ADR-075).
//
// get-event-notes LÄSER (GET ?eventId → Anteckningar via eventets omvända länk). Bevisar
// mot SKARP staging-data via ett WRITE→READ-par (create-event-note skriver en sentinel-
// anteckning, get-event-notes läser tillbaka den):
//   1. write→read: skapad sentinel-anteckning återfinns i strömmen med rätt shape
//      (text/forfattare/eventId/tidpunkt) — bevisar mappningen + den omvända länk-läsningen.
//   2. nyast först: strömmen är sorterad fallande på tidpunkt (monoton — robust mot
//      Airtables sekund-granulära createdTime; distinkt-tidpunkts-ordningen bevisas
//      renderat i e2e).
//   3. okänt event (rec-format men finns ej) → 404 (ärver get-event-kontraktet).
//   4. saknad eventId → 400.
//   5. anon (ingen JWT) → 401 (delad gateway/requireUser).
//   6. CORS preflight (tillåten origin) → 200 + speglad origin.
//
// SENTINEL + TEARDOWN: samma som create-event-note.staging.test — anteckningens text bär
// `ZZ-note-test+${uuid}@sentinel`, städas av .purge-staging-policy.json:s
// `create-event-note-sentineler`-target (ADR-060; testet får aldrig Airtable-token).
//
// Lokalt skip:as utan creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att
// BÅDA EF:erna deployats till staging (DoD #7).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import type { z } from 'zod';
import { EventNoteSchema } from '../../src/domain/schemas';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const GET_ENDPOINT = '/functions/v1/get-event-notes';
const CREATE_ENDPOINT = '/functions/v1/create-event-note';

type EventNote = z.infer<typeof EventNoteSchema>;

function sentinelText(): string {
  return `ZZ-note-test+${randomUUID()}@sentinel`;
}

/** Skapa en sentinel-anteckning och returnera dess record-ID (write-halvan av paret). */
async function createNote(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  text: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${CREATE_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { eventId, text },
  });
  expect(res.status(), await res.text()).toBe(201);
  const body = (await res.json()) as { record: { id: string } };
  return body.record.id;
}

function getNotes(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  eventId: string | null,
): Promise<APIResponse> {
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  const q = eventId === null ? '' : `?eventId=${encodeURIComponent(eventId)}`;
  return request.get(`${config.baseUrl}${GET_ENDPOINT}${q}`, { headers });
}

test.describe('get-event-notes — skarp conformance (task-18.11)', () => {
  test('write→read: skapad anteckning återfinns i strömmen med rätt shape', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const text = sentinelText();
    const createdId = await createNote(request, config, jwt, BELAGGNING_EVENT_ID, text);

    const res = await getNotes(request, config, jwt, BELAGGNING_EVENT_ID);
    expect(res.status(), await res.text()).toBe(200);
    const { notes } = (await res.json()) as { notes: unknown };
    const parsed = notes as unknown[];
    // Hela listan är giltig domän-shape.
    const alla: EventNote[] = parsed.map((n) => EventNoteSchema.parse(n));

    const min = alla.find((n) => n.id === createdId);
    expect(min, 'den skapade anteckningen ska finnas i eventets ström').toBeTruthy();
    expect(min?.text).toBe(text);
    expect(min?.eventId).toBe(BELAGGNING_EVENT_ID);
    expect(min?.forfattare, 'författaren sattes server-side').toBeTruthy();
    expect(Number.isNaN(Date.parse(min?.tidpunkt ?? ''))).toBe(false);
  });

  test('nyast först: strömmen är sorterad fallande på tidpunkt', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    // Två sentinel-anteckningar så listan garanterat har ≥2 element att jämföra.
    await createNote(request, config, jwt, BELAGGNING_EVENT_ID, sentinelText());
    await createNote(request, config, jwt, BELAGGNING_EVENT_ID, sentinelText());

    const res = await getNotes(request, config, jwt, BELAGGNING_EVENT_ID);
    expect(res.status()).toBe(200);
    const { notes } = (await res.json()) as { notes: EventNote[] };
    expect(notes.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < notes.length; i++) {
      // Monoton fallande (nyast först): tidpunkt[i-1] >= tidpunkt[i].
      expect(notes[i - 1].tidpunkt >= notes[i].tidpunkt).toBe(true);
    }
  });

  test('okänt event (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await getNotes(request, config, jwt, 'recZZZZZZZZZZZZZZ');
    expect(res.status()).toBe(404);
  });

  test('saknad eventId → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await getNotes(request, config, jwt, null);
    expect(res.status()).toBe(400);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await getNotes(request, config, undefined, BELAGGNING_EVENT_ID);
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
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
