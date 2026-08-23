// get-places — skarp conformance mot deployad staging-EF (TASK-309.7 AC #3,
// ADR-125 § 7). GLOBAL läs-lista över SAMTLIGA Platser-rader (Mer-sidans
// Platser-yta) — speglar get-event-formats global-läs-mönstret.
//
// Bevisar mot SKARP staging-data:
//   1. allow: GET → 200 + { places: [...] }; varje rad bär rec-id, namn och
//      falt (adress/parkering/transport/klader). Rönninge (permanent seedad,
//      data-model.md § Bilagornas datamodell, verbatim ur PLATSER_SEED) finns
//      med och bär ICKE-TOMMA värden på samtliga fyra fält.
//   2. anon (ingen JWT) → 401.
//
// Auth via getValidUserJWT. Lokalt skip:as utan creds; skarpa beviset körs
// i CI (STAGING_REQUIRED=1).

import { expect, test } from '@playwright/test';
import { classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/get-places';
const RONNINGE_ID = 'rec17l2c64foUy6WU';

test.describe('get-places — skarp conformance (TASK-309.7)', () => {
  test('allow: GET → 200 + places[] med falt; Rönninge finns med och bär ifyllda fält', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await request.get(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as {
      places: { id: string; namn: string; falt: Record<string, string | null> }[];
    };
    expect(Array.isArray(body.places)).toBe(true);
    expect(body.places.length).toBeGreaterThanOrEqual(1);

    for (const p of body.places) {
      expect(p.id.startsWith('rec')).toBe(true);
      expect(typeof p.namn).toBe('string');
      for (const key of ['adress', 'parkering', 'transport', 'klader']) {
        const v = p.falt[key];
        expect(v === null || typeof v === 'string').toBe(true);
      }
    }

    const ronninge = body.places.find((p) => p.id === RONNINGE_ID);
    expect(ronninge, 'Rönninge (permanent seedad plats) saknas').toBeTruthy();
    expect(ronninge?.namn).toBe('Rönninge');
    expect(ronninge?.falt.adress).toBeTruthy();
    expect(ronninge?.falt.parkering).toBeTruthy();
    expect(ronninge?.falt.transport).toBeTruthy();
    expect(ronninge?.falt.klader).toBeTruthy();
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.get(`${config.baseUrl}${ENDPOINT}`);
    await classify401Body(res);
  });
});
