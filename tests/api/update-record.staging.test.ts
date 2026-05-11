// M4 deny-path-tester för update-record (operations-allowlist).
//
// Idag är OPERATIONS-listan i supabase/functions/_shared/field-allowlists.ts
// TOM (Discovery 2026-05-04). Det betyder:
//   - Alla operationKeys ger 400 ("Unknown operation").
//   - Field-allowlist-test (fält utanför allowlist) kan inte köras
//     förrän första operation finns — markerad som test.skip().
//   - Allow-test (registered operation → 200) kan inte köras heller
//     — markerad som test.skip().
//
// När Fas 5.5+ produktionsslicen lägger till första operation:
//   1. Aktivera test.skip → test
//   2. Lägg till specifik operationKey i payload
//   3. Lägg till specifik allowed-field och disallowed-field i tester

import { expect, test } from '@playwright/test';
import { getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/update-record';

test.describe('update-record — operations-allowlist (M4)', () => {
  test('deny: okänd operation → 400', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'definitely.not.registered.operation',
        recordId: 'recAAAAAAAAAAAAA',
        fields: {},
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain('Unknown operation');
  });

  test('deny: recordId utan rec-prefix → 400', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // Använder okänd operation, men recordId-format-checken körs
    // BEFORE operations-checken? Faktiskt: operations-check körs
    // först (steg 2), sedan recordId-format (steg 3). Så vi behöver
    // en känd operation för att nå recordId-checken. Tills första
    // operation finns testar vi det indirekt via 400-Unknown
    // operation först. Markeras därför som .skip nu och aktiveras
    // när första operation finns.
    test.skip(true, 'Aktiveras när Fas 5.5 lägger till första operation');

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'TODO_REPLACE_WITH_REGISTERED_OPERATION',
        recordId: 'invalidNoRecPrefix',
        fields: {},
      },
    });

    expect(res.status()).toBe(400);
  });

  test('deny: fält utanför allowlist → 400', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // Kräver en känd operation med specifik allowedFields-lista för
    // att kunna skicka ett fält UTANFÖR den listan. Aktiveras när
    // Fas 5.5 lägger till första operation.
    test.skip(true, 'Aktiveras när Fas 5.5 lägger till första operation');

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'TODO_REPLACE_WITH_REGISTERED_OPERATION',
        recordId: 'recAAAAAAAAAAAAA',
        fields: { TodoUnknownField: 'x' },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not allowed for operation/);
  });

  test('allow: registrerad operation + tillåtna fält → 200', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // Aktiveras när Fas 5.5 lägger till första operation. Då kan
    // testet skicka känd operationKey + känt recordId + tillåtna
    // fält och förvänta 200.
    test.skip(true, 'Aktiveras när Fas 5.5 lägger till första operation');

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'TODO_REPLACE_WITH_REGISTERED_OPERATION',
        recordId: 'recRealRecordIdHere',
        fields: {
          /* allowed fields */
        },
      },
    });

    expect(res.status()).toBe(200);
  });
});
