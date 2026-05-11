// Per-funktion deny-path-tester för de 4 datafunktionerna.
//
// Varje funktion testas med fyra scenarier:
//   1. Anonym (ingen Authorization-header) → 401
//   2. Ogiltig JWT → 401
//   3. Anon-key (= publik nyckel, inte user-JWT) → 401
//   4. Giltig user-JWT → 200
//
// Scenario 4 kräver att hela funktionen fungerar (Airtable-token korrekt
// satt i staging, etc.). Om det failar är det troligen infrastrukturfel
// snarare än auth-bug — se output.

import { type APIRequestContext, expect, test } from '@playwright/test';
import {
  type ApiConfig,
  classify401Body,
  getApiConfig,
  getValidUserJWT,
  INVALID_JWT,
} from './helpers';

interface EndpointSpec {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  body?: Record<string, unknown>;
}

const ENDPOINTS: EndpointSpec[] = [
  { name: 'get-events', method: 'GET', path: '/functions/v1/get-events' },
  { name: 'get-persons', method: 'GET', path: '/functions/v1/get-persons' },
  { name: 'get-registrations', method: 'GET', path: '/functions/v1/get-registrations' },
  {
    name: 'update-record',
    method: 'POST',
    path: '/functions/v1/update-record',
    // Operations-baserad body (M4). Funktionen ska först checka auth (401),
    // INNAN den validerar operationKey/recordId/fields. Det är hela
    // poängen. För allow-testet (giltig user-JWT) blir resultatet 400
    // ("Unknown operation") eftersom OPERATIONS-listan är tom (M4
    // discovery-fyndet) — det är OK eftersom allow-testet asserterar
    // !=401, vilket bevisar att auth-gaten passerade.
    body: { operationKey: 'unknown.test-op', recordId: 'recDOESNOTEXIST', fields: {} },
  },
];

async function callEndpoint(
  request: APIRequestContext,
  config: ApiConfig,
  endpoint: EndpointSpec,
  authHeader?: string,
) {
  const url = `${config.baseUrl}${endpoint.path}`;
  const headers: Record<string, string> = {};
  if (authHeader) headers.Authorization = authHeader;

  if (endpoint.method === 'GET') {
    return request.get(url, { headers });
  }
  return request.post(url, { headers, data: endpoint.body ?? {} });
}

for (const endpoint of ENDPOINTS) {
  test.describe(`Edge Function ${endpoint.name} — auth deny-path`, () => {
    test('deny: anonym → 401', async ({ request }) => {
      const config = getApiConfig();
      const res = await callEndpoint(request, config, endpoint);
      // Atomärt: status===401 + body matchar gateway- ELLER requireUser-format.
      // Throw vid 200/403/500 eller oväntat body-format.
      await classify401Body(res);
    });

    test('deny: ogiltig JWT → 401', async ({ request }) => {
      const config = getApiConfig();
      const res = await callEndpoint(request, config, endpoint, `Bearer ${INVALID_JWT}`);
      await classify401Body(res);
    });

    test('deny: anon-key → 401', async ({ request }) => {
      const config = getApiConfig();
      const res = await callEndpoint(request, config, endpoint, `Bearer ${config.anonKey}`);
      await classify401Body(res);
    });

    test('allow: giltig user-JWT → 200 (eller 4xx från senare validering)', async ({ request }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const res = await callEndpoint(request, config, endpoint, `Bearer ${jwt}`);

      // Auth har passerat. För GET-funktioner väntar vi 200. För
      // update-record väntar vi 4xx från senare validering (recDOESNOTEXIST
      // är inte ett giltigt Airtable-record). Det är OK — poängen är att
      // det INTE är 401, vilket bevisar att auth-gaten passerats.
      expect(res.status()).not.toBe(401);
      if (endpoint.method === 'GET') {
        expect(res.status()).toBe(200);
      }
    });
  });
}
