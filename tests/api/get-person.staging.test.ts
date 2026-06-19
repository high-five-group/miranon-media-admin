// get-person — skarp conformance mot deployad staging-EF (Fas 6a L5b).
//
// BEVISAR det som betyder mest för Lotta: kurshistorik trunkeras ALDRIG. Mot en
// permanent historik-fixtur (ZZ-History Person 01 + 3 Deltaganden via 3 event med
// distinkta datum) med staging-secret HISTORY_BATCH_SIZE=2 — så get-person:s
// chunk-merge-väg (2 + 1) exerceras skarpt och måste returnera ALLA 3 poster i
// datum-desc-ordning. En enda chunk hade dolt trunkering; 3 poster över en
// chunk-gräns är det riktiga beviset (P1, L5a-förfining).
//
// Auth via getValidUserJWT → password-grant (samma mönster som övriga
// *.staging.test.ts). Lokalt skip:as utan TEST_USER-creds (känd gräns); skarpa
// beviset körs i CI (STAGING_REQUIRED=1).
//
// FIXTUREN ÄR PERMANENT (P-mönster, ingen PII; distinkt "ZZ-History"-prefix → rör
// inte L4:s "ZZ-Conformance"-list-fixtur). STÄDA INTE bort den.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { z } from 'zod';
import { PersonDetailSchema, PersonSchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

// Permanent historik-fixtur (staging-Personer). 3 Deltaganden, distinkta datum.
const HISTORY_PERSON_ID = 'recqxaFNwHAdQlAqb';

// Förväntad historik i datum-desc-ordning (get-person sorterar nyast först).
const EXPECTED_HISTORY = [
  { kursnamn: 'Resor i medvetandet 3', datum: '2026-03-15' },
  { kursnamn: 'Resor i medvetandet 2', datum: '2026-02-15' },
  { kursnamn: 'Resor i medvetandet 1', datum: '2026-01-15' },
];

async function callGetPerson(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  id: string | undefined,
) {
  const query = id === undefined ? '' : `?id=${encodeURIComponent(id)}`;
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.get(`${config.baseUrl}/functions/v1/get-person${query}`, { headers });
}

test.describe('get-person — skarp conformance (ADR-056 detalj, Fas 6a L5b)', () => {
  test('giltigt ID → 200 + PersonDetailSchema-valid (skarp .parse passerar)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetPerson(request, config, jwt, HISTORY_PERSON_ID);

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { person: unknown };
    // Skarp validering vid datagränsen — samma .parse som adaptern kör.
    const person = PersonDetailSchema.parse(body.person);

    expect(person.id).toBe(HISTORY_PERSON_ID);
    expect(person.namn).toBe('ZZ-History Person 01');
    // Rollups auto-beräknade från de 3 seedade deltagandena.
    expect(person.antalGenomfordaEvent).toBe(3);
  });

  test('NOLL-TRUNKERING: alla 3 historik-poster över chunk-gräns, datum desc', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetPerson(request, config, jwt, HISTORY_PERSON_ID);
    expect(res.status()).toBe(200);

    const body = (await res.json()) as { person: unknown };
    const person = PersonDetailSchema.parse(body.person);

    // Kärnbeviset: HISTORY_BATCH_SIZE=2 + 3 poster → chunk-merge (2+1) får ALDRIG
    // tappa den 3:e. Exakt 3, inte 2 (chunk-gräns-trunkering) eller fler.
    expect(person.historik).toHaveLength(3);

    // Rätt ordning (datum desc) bevarad efter merge över chunk-gränsen.
    expect(person.historik.map((h) => h.datum)).toEqual(EXPECTED_HISTORY.map((h) => h.datum));
    expect(person.historik.map((h) => h.kursnamn)).toEqual(EXPECTED_HISTORY.map((h) => h.kursnamn));
    // Alla 3 räknas som närvaro (Status='Närvarande' → Närvaropoäng=1).
    expect(person.historik.every((h) => h.narvaro)).toBe(true);
  });

  test('okänt ID → 404 + body { error } (mall-kontraktet)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetPerson(request, config, jwt, 'recZZZZZZZZZZZZZZ');

    expect(res.status()).toBe(404);
    const body = (await res.json()) as { error?: unknown };
    expect(typeof body.error).toBe('string');
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await callGetPerson(request, config, undefined, HISTORY_PERSON_ID);
    await classify401Body(res);
  });

  test('saknat id-param → 400 { error: "Missing id" }', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetPerson(request, config, jwt, undefined);

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: unknown };
    expect(body.error).toBe('Missing id');
  });
});

// Multi-värd "Ort"-klass: ZZ-History Person 01 har 2 Anmälningar i olika orter →
// Personer.Ort-rollup = ['ZZ-Skövde','ZZ-Göteborg']. Detta är fixturen L5b SAKNADE.
// Bevisar att data-förlust-regressionen (firstString) är stängd mot SKARP data:
// båda orterna måste komma tillbaka (gammal kod gav 1 / kraschade parse).
const EXPECTED_ORTER = ['ZZ-Skövde', 'ZZ-Göteborg'];

test.describe('get-person/get-persons — multi-värd ort (data-förlust-fixens skarp-bevis)', () => {
  test('get-person → ort = string[] med BÅDA orterna (ingen tyst drop)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetPerson(request, config, jwt, HISTORY_PERSON_ID);
    expect(res.status()).toBe(200);

    const body = (await res.json()) as { person: unknown };
    const person = PersonDetailSchema.parse(body.person);

    expect(person.ort).toHaveLength(2);
    expect([...person.ort].sort()).toEqual([...EXPECTED_ORTER].sort());
  });

  test('get-persons (search) → samma person, ort string[] båda, PersonSchema-parse OK', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const url = new URL(`${config.baseUrl}/functions/v1/get-persons`);
    url.searchParams.set('search', 'ZZ-History Person 01');
    const res = await request.get(url.toString(), {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(200);

    const body = (await res.json()) as { persons: unknown };
    const persons = z.array(PersonSchema).parse(body.persons); // SAKNAD-fix: rå array kraschar ej
    const person = persons.find((p) => p.id === HISTORY_PERSON_ID);
    expect(person, 'ZZ-History-personen ska finnas i sökträffen').toBeTruthy();
    expect([...(person?.ort ?? [])].sort()).toEqual([...EXPECTED_ORTER].sort());
  });
});
