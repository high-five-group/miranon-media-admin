// M4 deny-path-tester för update-record (operations-allowlist).
//
// Fas 5.5 (Session 18) registrerade första operationen
// mark-registration-fee-paid → { tableId Anmälningar,
// allowedFields ['Anmälningsavgift'] } i field-allowlists.ts. VIKTIGT:
// källändringen påverkar inte staging förrän update-record OMDEPLOYAS —
// CI har inget deploy-steg (CI-fynd run 27463508240, ADR-049 Öppen
// tråd 1). Teststatus:
//   - deny: okänd operation → 400 (aktiv; korrekt oavsett deploy).
//   - deny: recordId utan rec-prefix → 400 — test.skip tills redeploy
//     (annars 400 via "Unknown operation", fel väg).
//   - deny: fält utanför allowlist → 400 — test.skip tills redeploy
//     (annars "Unknown operation" istället för "not allowed").
//   - allow: registrerad operation → 200 — test.skip. Kräver redeploy +
//     mutations-säkert staging-record + restore-teardown +
//     TEST_REGISTRATION_RECORD_ID (ADR-049 Öppen tråd 1 + 2).
//
// Auth-/anonym-deny (401) testas inte här utan i require-user-sviten via
// den delade requireUser-gatewayen (täcker alla Edge Functions).

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

    // Med känd operation passerar steg 2 och recordId-prefix-checken i
    // steg 3 fäller → 400. MEN tills update-record omdeployats till
    // staging med mark-registration-fee-paid i allowlisten svarar
    // deployad EF "Unknown operation" (400) — testet blir då grönt för
    // FEL anledning (når aldrig steg 3). Skippad tills redeploy så den
    // verkligen prövar prefix-vägen. CI-fynd run 27463508240, ADR-049
    // Öppen tråd 1.
    test.skip(
      true,
      'Aktiveras när update-record omdeployats till staging med mark-registration-fee-paid i allowlisten (annars 400 via "Unknown operation", fel väg). ADR-049 Öppen tråd 1.',
    );

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'mark-registration-fee-paid',
        recordId: 'invalidNoRecPrefix',
        fields: {},
      },
    });

    expect(res.status()).toBe(400);
  });

  test('deny: fält utanför allowlist → 400', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // mark-registration-fee-paid har allowedFields ['Anmälningsavgift'].
    // Slutbetalning ligger UTANFÖR listan → findDisallowedField (steg 4)
    // fäller före Airtable-anropet med "...not allowed for operation".
    // MEN tills update-record omdeployats svarar deployad EF "Unknown
    // operation" → body-matchen faller (CI-fynd run 27463508240). Skippad
    // tills redeploy. ADR-049 Öppen tråd 1.
    test.skip(
      true,
      'Aktiveras när update-record omdeployats till staging med mark-registration-fee-paid i allowlisten (annars "Unknown operation", inte "not allowed"). ADR-049 Öppen tråd 1.',
    );

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'mark-registration-fee-paid',
        recordId: 'recAAAAAAAAAAAAA',
        fields: { Slutbetalning: 'Mottagen' },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not allowed for operation/);
  });

  test('allow: registrerad operation + tillåtna fält → 200', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // Allow-vägen muterar ett riktigt Anmälningar-record
    // (Anmälningsavgift='Mottagen'). Kräver ett mutations-säkert
    // staging-record + restore-teardown så live-data inte lämnas ändrad.
    // Ingen sådan infra finns ännu — deferrad per ADR-049 öppen tråd.
    test.skip(
      true,
      'Aktiveras när designerat mutations-säkert staging-record + read-restore-teardown + TEST_REGISTRATION_RECORD_ID-secret finns (allow-vägen kräver muterbart record; deferrad per ADR-049 öppen tråd).',
    );

    const recordId = process.env.TEST_REGISTRATION_RECORD_ID ?? '';

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'mark-registration-fee-paid',
        recordId,
        fields: { Anmälningsavgift: 'Mottagen' },
      },
    });

    expect(res.status()).toBe(200);
  });
});
