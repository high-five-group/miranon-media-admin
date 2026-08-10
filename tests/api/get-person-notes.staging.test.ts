// get-person-notes — skarp conformance mot deployad staging-EF (S103, T97-bygg-
// spåret; ADR-075-tabellen utökad med ett Person-länkfält).
//
// get-person-notes LÄSER (GET ?personId → Anteckningar via personens omvända
// länk `Anteckningar 2`). Speglar get-event-notes.staging.test.ts EXAKT (samma
// additiva tabell, samma bevis-form) — bevisar mot SKARP staging-data via ett
// WRITE→READ-par (create-person-note skriver en sentinel-anteckning,
// get-person-notes läser tillbaka den):
//   1. write→read: skapad sentinel-anteckning återfinns i strömmen med rätt shape
//      (text/forfattare/personId/tidpunkt) — bevisar mappningen + den omvända
//      länk-läsningen (`Anteckningar 2`, INTE `Anteckningar`).
//   2. nyast först: strömmen är sorterad fallande på tidpunkt.
//   3. okänd person (rec-format men finns ej) → 404 (ärver get-person-kontraktet).
//   4. saknad personId → 400.
//   5. anon (ingen JWT) → 401 (delad gateway/requireUser).
//   6. CORS preflight (tillåten origin) → 200 + speglad origin.
//
// SENTINEL + TEARDOWN: SAMMA sentinel-form + purge-target som event-strömmen
// (`create-event-note-sentineler` i .purge-staging-policy.json) — targetens
// filterByFormula matchar bara `{Anteckning}`-fältets text, oavsett om raden bär
// Event eller Person. Ingen ny purge-target behövdes (verifierat mot policyn på
// disk innan detta test skrevs).
//
// Lokalt skip:as utan creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER
// att BÅDA EF:erna deployats till staging.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import type { z } from 'zod';
import { PersonNoteSchema } from '../../src/domain/schemas';
import { HISTORY_PERSON_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const GET_ENDPOINT = '/functions/v1/get-person-notes';
const CREATE_ENDPOINT = '/functions/v1/create-person-note';

type PersonNote = z.infer<typeof PersonNoteSchema>;

function sentinelText(): string {
  return `ZZ-note-test+${randomUUID()}@sentinel`;
}

/** Skapa en sentinel-anteckning på personen och returnera dess record-ID. */
async function createNote(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  personId: string,
  text: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${CREATE_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { personId, text },
  });
  expect(res.status(), await res.text()).toBe(201);
  const body = (await res.json()) as { record: { id: string } };
  return body.record.id;
}

function getNotes(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  personId: string | null,
): Promise<APIResponse> {
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  const q = personId === null ? '' : `?personId=${encodeURIComponent(personId)}`;
  return request.get(`${config.baseUrl}${GET_ENDPOINT}${q}`, { headers });
}

test.describe('get-person-notes — skarp conformance (S103)', () => {
  test('write→read: skapad anteckning återfinns i strömmen med rätt shape', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const text = sentinelText();
    const createdId = await createNote(request, config, jwt, HISTORY_PERSON_ID, text);

    const res = await getNotes(request, config, jwt, HISTORY_PERSON_ID);
    expect(res.status(), await res.text()).toBe(200);
    const { notes } = (await res.json()) as { notes: unknown };
    const parsed = notes as unknown[];
    // Hela listan är giltig domän-shape.
    const alla: PersonNote[] = parsed.map((n) => PersonNoteSchema.parse(n));

    const min = alla.find((n) => n.id === createdId);
    expect(min, 'den skapade anteckningen ska finnas i personens ström').toBeTruthy();
    expect(min?.text).toBe(text);
    expect(min?.personId).toBe(HISTORY_PERSON_ID);
    expect(min?.forfattare, 'författaren sattes server-side').toBeTruthy();
    expect(Number.isNaN(Date.parse(min?.tidpunkt ?? ''))).toBe(false);
  });

  test('nyast först: strömmen är sorterad fallande på tidpunkt', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    // Två sentinel-anteckningar så listan garanterat har ≥2 element att jämföra.
    await createNote(request, config, jwt, HISTORY_PERSON_ID, sentinelText());
    await createNote(request, config, jwt, HISTORY_PERSON_ID, sentinelText());

    const res = await getNotes(request, config, jwt, HISTORY_PERSON_ID);
    expect(res.status()).toBe(200);
    const { notes } = (await res.json()) as { notes: PersonNote[] };
    expect(notes.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < notes.length; i++) {
      // Monoton fallande (nyast först): tidpunkt[i-1] >= tidpunkt[i].
      expect(notes[i - 1].tidpunkt >= notes[i].tidpunkt).toBe(true);
    }
  });

  test('okänd person (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await getNotes(request, config, jwt, 'recZZZZZZZZZZZZZZ');
    expect(res.status()).toBe(404);
  });

  test('saknad personId → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await getNotes(request, config, jwt, null);
    expect(res.status()).toBe(400);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await getNotes(request, config, undefined, HISTORY_PERSON_ID);
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
