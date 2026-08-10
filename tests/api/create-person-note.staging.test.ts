// create-person-note — skarp conformance mot deployad staging-EF (S103, T97-
// bygg-spåret; ADR-075-tabellen utökad med ett Person-länkfält).
//
// create-person-note SKRIVER (POST → ny Anteckningar-rad, `Person` satt). Speglar
// create-event-note.staging.test.ts:s säkerhets-kontrakt EXAKT. Bevisar mot SKARP
// staging-data:
//   1. allow: giltig create → 201 + SKRIV-BEVIS ur råa record.fields — EF:en satte
//      Anteckning (= sentinel-texten), Person-länk (= fixtur-personId), en
//      icke-tom Författare (SERVER-SIDE ur JWT:ns identitet, ADR-075) — OCH att
//      `Event` INTE sattes (invariantens mekaniska garanti, se filhuvudets
//      docblock i create-person-note/index.ts). Domän-shapen (note) parse:as med
//      PersonNoteSchema och bär text/personId/tidpunkt/forfattare.
//   2. deny: saknad text → 400; tom/whitespace text → 400; text över taket → 400.
//   3. deny: ogiltig personId-form → 400.
//   4. okänd person (rec-format men finns ej) → 404 (ärver get-person-kontraktet).
//   5. anon (ingen JWT) → 401 (delad gateway/requireUser).
//   6. CORS preflight (tillåten origin) → 200 + speglad origin.
//
// SENTINEL: SAMMA form som create-event-note (`ZZ-note-test+${uuid}@sentinel`) —
// purge-targeten `create-event-note-sentineler` matchar på `{Anteckning}`-fältets
// text oavsett Event/Person-länk, så ingen ny purge-target behövs (verifierat mot
// .purge-staging-policy.json på disk). TEARDOWN = setup-purge (ADR-060).
//
// MÅL: den permanenta historik-fixturen (HISTORY_PERSON_ID) — vilken giltig
// seedad person som helst duger som anteckningens hem.
//
// Auth via getValidUserJWT. Lokalt skip:as utan creds; skarpa beviset körs i CI
// (STAGING_REQUIRED=1) EFTER att EF:en deployats till staging.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import type { z } from 'zod';
import { PersonNoteSchema } from '../../src/domain/schemas';
import { HISTORY_PERSON_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/create-person-note';

type PersonNote = z.infer<typeof PersonNoteSchema>;

interface CreateBody {
  personId?: string;
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

test.describe('create-person-note — skarp conformance (S103)', () => {
  test('allow: giltig create → 201 + skriv-bevis (Anteckning + Person-länk + server-satt Författare, ingen Event-länk)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const text = sentinelText();

    const res = await postCreate(request, config, jwt, { personId: HISTORY_PERSON_ID, text });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as {
      note: unknown;
      record: { id: string; fields: Record<string, unknown>; createdTime: string };
    };

    // (i) SKRIV-BEVIS ur råa record.fields — EF:en satte fälten i Airtable.
    expect(body.record.id.startsWith('rec')).toBe(true);
    expect(body.record.fields['Anteckning']).toBe(text);
    expect(body.record.fields['Person']).toEqual([HISTORY_PERSON_ID]);
    // INVARIANTEN: Event får ALDRIG sättas av denna operation.
    expect(body.record.fields['Event']).toBeUndefined();
    // Författaren är SERVER-SIDE-satt (ADR-075) — vi kan inte förutsäga det
    // exakta värdet men det MÅSTE vara en icke-tom sträng.
    expect(typeof body.record.fields['Författare']).toBe('string');
    expect((body.record.fields['Författare'] as string).length).toBeGreaterThan(0);

    // (ii) Domän-shape (adapterns parse-väg) — text/personId/tidpunkt/forfattare.
    const note: PersonNote = PersonNoteSchema.parse(body.note);
    expect(note.text).toBe(text);
    expect(note.personId).toBe(HISTORY_PERSON_ID);
    expect(note.forfattare, 'författaren sätts server-side').toBeTruthy();
    expect(Number.isNaN(Date.parse(note.tidpunkt))).toBe(false);
  });

  test('deny: saknad text → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, { personId: HISTORY_PERSON_ID });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/text/i);
  });

  test('deny: tom/whitespace text → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      personId: HISTORY_PERSON_ID,
      text: '   \n  ',
    });
    expect(res.status()).toBe(400);
  });

  test('deny: text över taket → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      personId: HISTORY_PERSON_ID,
      text: 'x'.repeat(5001),
    });
    expect(res.status()).toBe(400);
  });

  test('deny: ogiltig personId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      personId: 'inteEttRecordId',
      text: sentinelText(),
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/personId/i);
  });

  test('okänd person (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      personId: 'recZZZZZZZZZZZZZZ',
      text: sentinelText(),
    });
    expect(res.status()).toBe(404);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { personId: 'recANY', text: 'x' },
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
