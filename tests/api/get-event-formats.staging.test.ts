// get-event-formats — skarp conformance mot deployad staging-EF (Fas 6f L2).
//
// get-event-formats LÄSER (GET → Eventformat-lista) för create-event:s Eventtyp-dropdown.
// Speglar get-segments global-läs-mönstret. Bevisar mot SKARP staging-data:
//   1. allow: GET → 200 + { eventFormats: [{ id, namn }] }; varje rad bär rec-id + namn.
//      Den seedade sentinel-fixturen (recclDd7hUQsfxoVs, ZZ-create-event-test-format) finns med.
//   2. anon (ingen JWT) → 401 (delad gateway/requireUser).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan creds; skarpa
// beviset körs i CI (STAGING_REQUIRED=1).

import { expect, test } from '@playwright/test';
import { classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/get-event-formats';
const SEEDED_EVENTFORMAT_ID = process.env.TEST_EVENTFORMAT_RECORD_ID || 'recclDd7hUQsfxoVs';

test.describe('get-event-formats — skarp conformance (Fas 6f L2)', () => {
  test('allow: GET → 200 + eventFormats[] med rec-id + namn (sentinel-fixturen finns med)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as { eventFormats: { id: string; namn: string | null }[] };
    expect(Array.isArray(body.eventFormats)).toBe(true);

    // Varje rad bär ett rec-ID; namn är sträng-eller-null (kontrakt).
    for (const f of body.eventFormats) {
      expect(f.id.startsWith('rec')).toBe(true);
      expect(f.namn === null || typeof f.namn === 'string').toBe(true);
    }
    // Den seedade fixturen (eventtyp-ankaret create-event-testet använder) ska finnas.
    expect(body.eventFormats.some((f) => f.id === SEEDED_EVENTFORMAT_ID)).toBe(true);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.get(`${config.baseUrl}${ENDPOINT}`);
    await classify401Body(res);
  });
});
