// End-to-end fuzz-tester mot deployad runtime (LAGER 2).
//
// Extracted from airtable-filter.test.ts in K0åc.1 2026-05-11 to fit
// naming convention `.staging.test.ts` for Playwright project split
// (api-pure vs api-staging — pure körs utan TEST_*-env, staging
// kräver staging-koppling).
//
// Illvilliga query params till get-registrations + get-persons ska ge
// 200 (med tom resultat) eller 400 (Invalid filter input) — ALDRIG
// 500 (formula-syntax-fel) eller 200 med tautologi.
//
// Pure-lagret (round-trip + per-kategori fuzz mot escapeFormulaValue/
// parseAirtableString-helpers utan HTTP) finns kvar i
// airtable-filter.test.ts.

import { expect, test } from '@playwright/test';
import { getApiConfig, getValidUserJWT, getWithTransientRetry } from './helpers';

// Konstrueras via String.fromCharCode så filens visuella encoding inte
// spelar roll och tester förblir deterministiska. Duplicerad från
// airtable-filter.test.ts LAGER 1 för att hålla filerna oberoende.
const ch = (code: number): string => String.fromCharCode(code);

const E2E_ENDPOINTS = [
  { name: 'get-registrations', path: '/functions/v1/get-registrations', param: 'status' },
  { name: 'get-persons', path: '/functions/v1/get-persons', param: 'search' },
] as const;

const ILLVILLIG_INPUTS = [
  { label: 'TRUE-tautology', input: '") OR TRUE() OR ("' },
  { label: 'OR-injection', input: 'X") OR ({Status}="Y' },
  { label: 'NOT-injection', input: '"+NOT(TRUE())+"' },
  { label: 'curly-break', input: '"}' },
  { label: 'too long (DoS)', input: 'a'.repeat(2000) },
  { label: 'NUL-attempt', input: `evil${ch(0x00)}injection` },
];

for (const endpoint of E2E_ENDPOINTS) {
  test.describe(`end-to-end fuzz: ${endpoint.name}`, () => {
    for (const { label, input } of ILLVILLIG_INPUTS) {
      test(`illvillig ${endpoint.param}=${label} → 200 eller 400 (aldrig 500)`, async ({
        request,
      }) => {
        const config = getApiConfig();
        const jwt = await getValidUserJWT(request, config);

        const url = new URL(`${config.baseUrl}${endpoint.path}`);
        url.searchParams.set(endpoint.param, input);

        // TASK-207: denna sviten föll på ETT genuint transient 502 2026-08-12
        // (post-merge run 31623411127) — plattformsdegradering, bevisat
        // oskyldigt via first-parent-diff. Idempotent GET → retry-skyddad.
        const res = await getWithTransientRetry(() =>
          request.get(url.toString(), {
            headers: { Authorization: `Bearer ${jwt}` },
          }),
        );

        // 400 (filter rejected) eller 200 (filter passerade men gav
        // tom/normalt svar). 500 = server-fel = M5-bugg som maste
        // atgardas. 401/403 = auth-fel = test-setup-bugg.
        expect(res.status()).not.toBe(500);
        expect(res.status()).not.toBe(401);
        expect(res.status()).not.toBe(403);
        expect([200, 400]).toContain(res.status());
      });
    }
  });
}
