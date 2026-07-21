// get-event — conformance mot deployad staging-EF (Fas 6b L2).
//
// get-event LÄSER bara (ingen write → ingen mutation/restore, till skillnad från
// 6a L6). Bevisar att single-get-mallen + 404-kontraktet + .parse()-shapen håller
// mot skarp staging-data.
//
// INGEN permanent event-fixtur seedas (stopp-grind: seeda inte i onödan). Istället
// härleds ett RIKTIGT event-ID dynamiskt ur get-events (list) → get-event (single).
// Robustare än ett hårdkodat ID (event kan ändras) och bevisar att EF-paret är
// shape-konsistent på samma rad. Saknar staging-basen event → testet fail:ar
// explicit (då finns inget att conformance-testa → eskalera).
//
// Auth via getValidUserJWT → password-grant (samma mönster som get-person). Lokalt
// skip:as utan TEST_USER-creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).

import { type APIRequestContext, expect, test } from '@playwright/test';
import { z } from 'zod';
import { EventSchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

async function callGetEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  id: string | undefined,
) {
  const query = id === undefined ? '' : `?id=${encodeURIComponent(id)}`;
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.get(`${config.baseUrl}/functions/v1/get-event${query}`, { headers });
}

/** Härled ett riktigt event-ID ur get-events (list) — ingen seedad fixtur. */
async function firstEventId(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<string> {
  const res = await request.get(`${config.baseUrl}/functions/v1/get-events`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { events: unknown };
  const events = z.array(EventSchema).parse(body.events);
  expect(
    events.length,
    'staging-basen måste ha minst ETT event att conformance-testa get-event mot',
  ).toBeGreaterThan(0);
  return events[0].id;
}

test.describe('get-event — conformance (single-get-mall, Fas 6b L2)', () => {
  test('giltigt ID → 200 + EventSchema-valid (skarp .parse passerar)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const id = await firstEventId(request, config, jwt);

    const res = await callGetEvent(request, config, jwt, id);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { event: unknown };
    // Skarp validering vid datagränsen — samma .parse som adaptern kör.
    const event = EventSchema.parse(body.event);
    expect(event.id).toBe(id);
    // eventKey i läs-shapen (task-18.1): system-genererad formel "Event-N" — finns på
    // varje Eventplanering-rad → ska alltid följa med get-event (EventKey-pillen bär den).
    expect(event.eventKey).toMatch(/^Event-\d+$/);
  });

  test('get-events: HELA listan parse:ar INKL. NaN-beläggnings-event (klass-bug stängd)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(`${config.baseUrl}/functions/v1/get-events`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { events: unknown };

    // KÄRNBEVISET: z.array(EventSchema).parse över ALLA event passerar. Före
    // scalarNumber-fixen sänkte ett enda NaN-beläggnings-event (osatt maxPlatser →
    // {specialValue:"NaN"}) hela array-parsen → list-laddningen kraschade. Staging-
    // fixturerna ("Resor i medvetandet 1/2/3") har osatt maxPlatser → NaN-vägen
    // exerceras skarpt.
    const events = z.array(EventSchema).parse(body.events);
    expect(events.length).toBeGreaterThan(0);

    // eventKey i BÅDA läs-EF:erna i SAMMA leverans (task-18.1-fasningen): saknas fältet i
    // get-events fäller z.array-parsen ovan hela listvyn — bevisa att varje rad bär det.
    for (const e of events) {
      expect(e.eventKey, `event ${e.id} saknar eventKey i get-events-shapen`).toMatch(
        /^Event-\d+$/,
      );
    }

    // Minst ETT event ska ha anmaldBelaggning===null (NaN coerced till null) — annars
    // exercerades inte NaN-vägen och beviset är ihåligt.
    const nanEvents = events.filter((e) => e.anmaldBelaggning === null);
    expect(
      nanEvents.length,
      'minst ett staging-event måste ha NaN-beläggning (→null) så coercion-vägen bevisas',
    ).toBeGreaterThan(0);
  });

  test('okänt ID → 404 + body { error } (mall-kontraktet, ärvt från get-person)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetEvent(request, config, jwt, 'recZZZZZZZZZZZZZZ');

    expect(res.status()).toBe(404);
    const body = (await res.json()) as { error?: unknown };
    expect(typeof body.error).toBe('string');
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await callGetEvent(request, config, undefined, 'recANY');
    await classify401Body(res);
  });

  test('saknat id-param → 400 { error: "Missing id" }', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetEvent(request, config, jwt, undefined);

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: unknown };
    expect(body.error).toBe('Missing id');
  });
});
