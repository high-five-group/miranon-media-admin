// get-persons — cursor-port conformance (ADR-056), skarp mot staging-EF.
//
// Instansierar den kanoniska conformance-harnessen (./cursor-conformance) för
// get-persons. Auth via getValidUserJWT → password-grant (samma mönster som
// övriga *.staging.test.ts). callPage anropar get-persons-EF:en skarpt över
// HTTP med JWT + { search, cursor, pageSize } och reducerar svaret till de
// beräknade Namn-värdena i EF-ordning.
//
// FIXTUR: de 5 syntetiska records "ZZ-Conformance Person 01..05" bor PERMANENT
// i staging-Personer som conformance-fixtur. De är namngivna by design (skapade
// via skrivbara käll-fält Förnamn/Efternamn → formelfältet Namn beräknas av
// basen; Namn är ej direkt skrivbart) och bär INGEN PII (tom e-post/telefon).
// STÄDA INTE bort dem: basen är "tom" i betydelsen ingen prod-data, inte tom i
// absolut mening (jfr data-model.md "radera aldrig Personer"). Search-prefixet
// "ZZ-Conformance Person" isolerar exakt dessa 5 (EF:en substring-matchar
// case-insensitivt mot Namn/E-post/Telefon/Ort).
//
// Lokalt skip:as sviten utan TEST_USER-creds (känd gräns, se helpers.ts). Det
// skarpa beviset körs i CI (STAGING_REQUIRED=1, secrets injicerade).
//
// SCOPE: denna svit täcker EF/cursor-MEKANIKEN skarpt. Klient-a11y ("Ladda
// fler"/fokus-behållning/aria-live) täcks av L3:s mock-baserade e2e
// (persons-list.staging.test.ts) — ingen duplicering här.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { assertCursorPortConformance, type CursorPage } from './cursor-conformance';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const FIXTURE_PREFIX = 'ZZ-Conformance Person';

// De 5 beräknade Namn-värdena i Namn-asc-ordning (EF:en sorterar { Namn, asc }).
const EXPECTED_NAMES = [
  'ZZ-Conformance Person 01',
  'ZZ-Conformance Person 02',
  'ZZ-Conformance Person 03',
  'ZZ-Conformance Person 04',
  'ZZ-Conformance Person 05',
];

// pageSize 2 mot 5 records → förväntad sid-sekvens [2, 2, 1],
// nextCursor [≠null, ≠null, null].
const PAGE_SIZE = 2;

async function callGetPersonsPage(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  args: { search: string; cursor?: string; pageSize: number },
): Promise<CursorPage> {
  const url = new URL(`${config.baseUrl}/functions/v1/get-persons`);
  url.searchParams.set('search', args.search);
  url.searchParams.set('pageSize', String(args.pageSize));
  if (args.cursor) url.searchParams.set('cursor', args.cursor);

  const res = await request.get(url.toString(), {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), 'get-persons skarpt anrop ska svara 200 med giltig user-JWT').toBe(200);

  const body = (await res.json()) as {
    persons: Array<{ namn: string | null }>;
    nextCursor: string | null;
  };

  return {
    items: body.persons.map((p) => p.namn ?? ''),
    nextCursor: body.nextCursor,
  };
}

test.describe('get-persons — cursor-port conformance (ADR-056)', () => {
  test('cursor-paginering: 5 fixtur-records, pageSize 2 → [2,2,1] med opak cursor', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    await assertCursorPortConformance({
      callPage: (args) => callGetPersonsPage(request, config, jwt, args),
      fixturePrefix: FIXTURE_PREFIX,
      expectedNames: EXPECTED_NAMES,
      pageSize: PAGE_SIZE,
    });
  });
});
