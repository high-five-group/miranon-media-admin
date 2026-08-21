// get-persons — registerläget (ADR-123 beslut 1, TASK-286.1), skarpt mot
// staging-EF.
//
// TÄCKER AC #4 (TASK-286.1): "EF:ens staging-svit täcker registerläget
// (antal = basfiltrets träffmängd, fältmängd, att ZZ-fixturer kommer med)".
//
// AC #3 (byte-identiskt svar för anrop UTAN `register`-parametern) täcks INTE
// här — den bevisas av att `get-persons.staging.test.ts` (cursor-conformance)
// och `get-persons-totalisolering.test.ts` (api-pure, replikerad form)
// passerar OFÖRÄNDRADE efter skivan: koden i sök-/cursor-grenen rördes inte
// alls (se `get-persons/index.ts`s registerläge-kommentar — den nya grenen
// returnerar TIDIGT, före `search`-parsningen, så den gamla koden är
// bokstavligen oåtkomlig för ett anrop utan `register=true`).
//
// FIXTUR: samma 5 permanenta "ZZ-Conformance Person 01..05"-poster som
// `get-persons.staging.test.ts` använder — se den filens filhuvud för den
// fulla motiveringen av fixturens naket medvetna form (ingen e-post, ingen
// Event-länk, inga select-värden). STÄDA INTE bort dem.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const FIXTURE_PREFIX = 'ZZ-Conformance Person';

const EXPECTED_FIXTURE_NAMES = [
  'ZZ-Conformance Person 01',
  'ZZ-Conformance Person 02',
  'ZZ-Conformance Person 03',
  'ZZ-Conformance Person 04',
  'ZZ-Conformance Person 05',
];

// Fält `mapPerson` (get-persons/index.ts) sätter på VARJE rad, oavsett om
// Airtable-värdet är null/tomt. Degraderar registerläget av misstag till den
// gamla totalsiffre-formen (`fields: ['Namn']`) hade posterna bara burit
// `id`/`namn` — denna lista fångar exakt den regressionen.
const EXPECTED_PERSON_KEYS = [
  'id',
  'namn',
  'fornamn',
  'efternamn',
  'email',
  'telefon',
  'ort',
  'manuellFlagga',
  'aiFlagga',
  'anteckningar',
  'antalAnmalningar',
  'antalDeltaganden',
  'erfarenhetsniva',
  'erfarenhetsbadge',
  'senasteInteraktion',
  'senasteInteraktionDatum',
  'dagarSedanSenaste',
  'harAktivAnmalan',
  'ejGodkandMail',
  'radSkapad',
  'anmalningIds',
  'deltagandeIds',
];

interface RawPerson {
  id: string;
  namn: string | null;
  [key: string]: unknown;
}

async function callRegister(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<{ persons: RawPerson[] }> {
  const url = new URL(`${config.baseUrl}/functions/v1/get-persons`);
  url.searchParams.set('register', 'true');

  const res = await request.get(url.toString(), {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), 'get-persons?register=true ska svara 200 med giltig user-JWT').toBe(200);

  return (await res.json()) as { persons: RawPerson[] };
}

// FÖRSTA sidan (ingen cursor) av dagens PAGINERADE läge bär `total` — en äkta,
// OBEROENDE full-walk-räkning mot SAMMA BAS_FILTER (TASK-277 Del 1). Detta ÄR
// "basfiltrets träffmängd" mätt via en helt annan kodväg än registerlägets
// egen fullwalk — inte en cirkelreferens mot sig själv.
async function hamtaOberoendeTotal(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<number> {
  const url = new URL(`${config.baseUrl}/functions/v1/get-persons`);
  url.searchParams.set('pageSize', '1'); // vi läser bara `total`, inte posterna

  const res = await request.get(url.toString(), {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status(), 'get-persons (basfilter, ingen sökterm) ska svara 200').toBe(200);

  const body = (await res.json()) as { total?: number };
  expect(typeof body.total, 'get-persons förstasida ska bära total (TASK-277 Del 1)').toBe(
    'number',
  );
  return body.total as number;
}

test.describe('get-persons — registerläge (ADR-123 beslut 1, TASK-286.1)', () => {
  test('registret bär den FULLA mapPerson-fältmängden, inte bara namn', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const { persons } = await callRegister(request, config, jwt);
    expect(persons.length, 'registret ska inte vara tomt').toBeGreaterThan(0);

    const forstaPerson = persons[0];
    for (const key of EXPECTED_PERSON_KEYS) {
      expect(
        Object.hasOwn(forstaPerson, key),
        `registrets första post saknar fältet "${key}" — misstänkt degraderad till den gamla totalsiffre-formen (fields: ['Namn'])`,
      ).toBe(true);
    }
  });

  test('ZZ-Conformance-fixturerna (5 poster) kommer med i registret', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const { persons } = await callRegister(request, config, jwt);
    const fixturNamn = persons
      .map((p) => p.namn)
      .filter((namn): namn is string => typeof namn === 'string' && namn.startsWith(FIXTURE_PREFIX))
      .sort();

    expect(fixturNamn, 'samtliga 5 ZZ-Conformance-fixturer ska finnas i registret').toEqual(
      EXPECTED_FIXTURE_NAMES,
    );
  });

  test('registrets antal === basfiltrets oberoende mätta träffmängd (TASK-277 total)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const [{ persons }, oberoendeTotal] = await Promise.all([
      callRegister(request, config, jwt),
      hamtaOberoendeTotal(request, config, jwt),
    ]);

    expect(
      persons.length,
      'registrets längd ska vara EXAKT lika med den oberoende full-walk-räkningen — samma BAS_FILTER, aldrig en delmängd (ADR-123 "parameterlös registerfråga")',
    ).toBe(oberoendeTotal);
  });
});
