// hamta-inbetalningar — BATCH-vägen (TASK-437, POST med `anmalanRecordIds`),
// skarp conformance mot deployad staging-EF.
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD SOM BEVISAS
// ═══════════════════════════════════════════════════════════════════════════
// AC #1 (zod-validerad input, tak på batchstorlek + 400) och AC #3
// (grupperingskontraktet) för TASK-437:
//   1. Metod-branchen lades TILL, den ERSATTE inte metodkontrollen: en PUT
//      404:ar/405:ar fortfarande.
//   2. Två sentinel-anmälningar med KÄNDA inbetalningar → batchen svarar med
//      BÅDA grupperna, korrekt attribuerade (aldrig ihopblandade).
//   3. Tom batch (`anmalanRecordIds: []`) → `{ grupper: [] }`, INGEN 400.
//   4. Ett välformat men OKÄNT record-ID → EN tom grupp för det ID:t, INGEN
//      fel — samma "tomt, aldrig fel"-kontrakt som GET-vägens
//      anmalanRecordId/personId (`hamta-inbetalningar/index.ts` § FYND).
//   5. Exakt taket (`MAX_ANMALNINGAR_PER_BATCH` i EF:en) → 200 (gränsen är
//      INKLUSIV).
//   6. Taket + 1 → 400 med skälet i klartext.
//
// GET-VÄGEN (anmalanRecordId/personId) ÄR OFÖRÄNDRAD OCH TÄCKS INTE HÄR —
// den bevisas redan av `rebook-registration.staging.test.ts` (rad ~273,
// `hamta-inbetalningar?anmalanRecordId=…`), och koddiffen för TASK-437 rör
// den grenen inte alls (branchen till batch-vägen ligger FÖRE GET-logiken).
// Denna fil bevisar bara den NYA POST-grenen.
//
// ═══════════════════════════════════════════════════════════════════════════
// TVÅ EGNA SENTINEL-ANMÄLNINGAR (ADR-060) — DELADE FIXTURER MUTERAS ALDRIG
// ═══════════════════════════════════════════════════════════════════════════
// Samma mönster som `hamta-oppna-betalningar-kvitto-avbojt.staging.test.ts`:
// `create-registration` mot det redan seedade eventet
// (`TEST_REGISTRATION_RECORD_ID` pekar ut det), `create-test+${uuid}@staging.
// test`-adress (samma ADR-060-purge-target). Inbetalningarna raderas i
// `finally` (atgard: 'radera', tillåtet före ett kvitto utfärdats — testet
// skickar aldrig ett kvitto).
//
// `MAX_ANMALNINGAR_PER_BATCH` NEDAN MÅSTE MATCHA KONSTANTEN I
// `hamta-inbetalningar/index.ts`. En framtida ändring av taket utan att
// uppdatera denna rad FÄLLER testet i stället för att tystna — det är
// avsikten, inte en skörhet: testet är beviset på att gränsen ligger DÄR
// koden säger att den ligger.
//
// Auth via `getValidUserJWT` (api-token-setup T24-b, non-admin — samma
// roll som Lotta faktiskt har). Lokalt skip:as utan creds; skarpa beviset
// körs i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

/** Måste matcha `MAX_ANMALNINGAR_PER_BATCH` i `hamta-inbetalningar/index.ts`. */
const MAX_ANMALNINGAR_PER_BATCH = 200;

function postJson(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  path: string,
  data: Record<string, unknown>,
): Promise<APIResponse> {
  return request.post(`${config.baseUrl}/functions/v1${path}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data,
  });
}

function postBatch(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  anmalanRecordIds: string[],
): Promise<APIResponse> {
  return postJson(request, config, jwt, '/hamta-inbetalningar', { anmalanRecordIds });
}

/** Härled conformance-ankaret — samma helper-form som systerfilerna
    (`cancel-registration.staging.test.ts`s `findSeededEventId`). */
async function findSeededEventId(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<string> {
  const seededId = process.env.TEST_REGISTRATION_RECORD_ID ?? '';
  expect(
    seededId,
    'TEST_REGISTRATION_RECORD_ID måste vara satt i staging-env (.env.test.example — seed-ankaret)',
  ).not.toBe('');

  const res = await request.get(`${config.baseUrl}/functions/v1/get-registrations`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status()).toBe(200);
  const { registrations } = (await res.json()) as {
    registrations: { id: string; eventId: string | null }[];
  };
  const seeded = registrations.find((r) => r.id === seededId);
  expect(seeded?.eventId, `seedad post ${seededId} saknar eventId`).toBeTruthy();
  return seeded?.eventId as string;
}

/** Eget sentinel-anmälnings-record (ADR-060) — delade fixturer muteras aldrig. */
async function createSentinelRegistration(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  eventId: string,
  suffix: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}/functions/v1/create-registration`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      fornamn: 'Sentinel',
      efternamn: `BatchInbetalning${suffix}`,
      email: `create-test+${randomUUID()}@staging.test`,
      telefon: null,
      eventId,
      idempotencyKey: randomUUID(),
    },
  });
  const raw = await res.text();
  expect(res.status(), raw).toBe(201);
  return (JSON.parse(raw) as { record: { id: string } }).record.id;
}

type BatchGrupp = {
  anmalanRecordId: string;
  inbetalningar: { id: string; belopp: number; betalsatt: string }[];
  kvitton: unknown[];
  jobbfel: unknown[];
};

test.describe('hamta-inbetalningar — batch-vägen (TASK-437)', () => {
  test('metod-branchen lades TILL: en PUT 405:ar fortfarande', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.fetch(`${config.baseUrl}/functions/v1/hamta-inbetalningar`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });

  test('batch med två kända anmälningar → båda grupperna, korrekt attribuerade', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventId = await findSeededEventId(request, config, jwt);

    const anmalanA = await createSentinelRegistration(request, config, jwt, eventId, 'A');
    const anmalanB = await createSentinelRegistration(request, config, jwt, eventId, 'B');

    const inbetalningIds: string[] = [];
    try {
      const svarA = await postJson(request, config, jwt, '/registrera-inbetalning', {
        anmalanRecordId: anmalanA,
        belopp: '111',
        betalsatt: 'Swish',
        medKvitto: false,
      });
      const rawA = await svarA.text();
      expect(svarA.status(), rawA).toBe(201);
      inbetalningIds.push((JSON.parse(rawA) as { inbetalning: { id: string } }).inbetalning.id);

      const svarB = await postJson(request, config, jwt, '/registrera-inbetalning', {
        anmalanRecordId: anmalanB,
        belopp: '222',
        betalsatt: 'Bankgiro',
        medKvitto: false,
      });
      const rawB = await svarB.text();
      expect(svarB.status(), rawB).toBe(201);
      inbetalningIds.push((JSON.parse(rawB) as { inbetalning: { id: string } }).inbetalning.id);

      const batchRes = await postBatch(request, config, jwt, [anmalanA, anmalanB]);
      const batchRaw = await batchRes.text();
      expect(batchRes.status(), batchRaw).toBe(200);
      const { grupper } = JSON.parse(batchRaw) as { grupper: BatchGrupp[] };

      expect(grupper).toHaveLength(2);
      const grupA = grupper.find((g) => g.anmalanRecordId === anmalanA);
      const grupB = grupper.find((g) => g.anmalanRecordId === anmalanB);
      expect(grupA, 'anmalanA saknas i batch-svaret').toBeTruthy();
      expect(grupB, 'anmalanB saknas i batch-svaret').toBeTruthy();

      expect(grupA?.inbetalningar).toHaveLength(1);
      expect(grupA?.inbetalningar[0]?.belopp).toBe(111);
      expect(grupA?.inbetalningar[0]?.betalsatt).toBe('Swish');
      expect(grupA?.kvitton).toEqual([]);
      expect(grupA?.jobbfel).toEqual([]);

      expect(grupB?.inbetalningar).toHaveLength(1);
      expect(grupB?.inbetalningar[0]?.belopp).toBe(222);
      expect(grupB?.inbetalningar[0]?.betalsatt).toBe('Bankgiro');
      expect(grupB?.kvitton).toEqual([]);
      expect(grupB?.jobbfel).toEqual([]);
    } finally {
      for (const id of inbetalningIds) {
        await postJson(request, config, jwt, '/hantera-inbetalning', {
          atgard: 'radera',
          inbetalningId: id,
        });
      }
    }
  });

  test('tom batch och ett okänt id → tomma grupper utan fel', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const tomRes = await postBatch(request, config, jwt, []);
    const tomRaw = await tomRes.text();
    expect(tomRes.status(), tomRaw).toBe(200);
    expect((JSON.parse(tomRaw) as { grupper: BatchGrupp[] }).grupper).toEqual([]);

    const okantId = `rec${'Z'.repeat(14)}`;
    const okantRes = await postBatch(request, config, jwt, [okantId]);
    const okantRaw = await okantRes.text();
    expect(okantRes.status(), okantRaw).toBe(200);
    const { grupper } = JSON.parse(okantRaw) as { grupper: BatchGrupp[] };
    expect(grupper).toHaveLength(1);
    expect(grupper[0]?.anmalanRecordId).toBe(okantId);
    expect(grupper[0]?.inbetalningar).toEqual([]);
    expect(grupper[0]?.kvitton).toEqual([]);
    expect(grupper[0]?.jobbfel).toEqual([]);
  });

  test('tak på batchstorlek: exakt taket accepteras, taket + 1 fälls med 400', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const syntetiskaIds = (n: number): string[] =>
      Array.from({ length: n }, (_, i) => `rec${String(i).padStart(14, '0')}`);

    const vidTaket = await postBatch(
      request,
      config,
      jwt,
      syntetiskaIds(MAX_ANMALNINGAR_PER_BATCH),
    );
    const vidTaketRaw = await vidTaket.text();
    expect(vidTaket.status(), vidTaketRaw).toBe(200);
    expect((JSON.parse(vidTaketRaw) as { grupper: BatchGrupp[] }).grupper).toHaveLength(
      MAX_ANMALNINGAR_PER_BATCH,
    );

    const overTaket = await postBatch(
      request,
      config,
      jwt,
      syntetiskaIds(MAX_ANMALNINGAR_PER_BATCH + 1),
    );
    const overTaketRaw = await overTaket.text();
    expect(overTaket.status(), overTaketRaw).toBe(400);
    expect(JSON.parse(overTaketRaw)).toEqual({
      error: `Högst ${MAX_ANMALNINGAR_PER_BATCH} anmälningar per anrop.`,
    });
  });
});
