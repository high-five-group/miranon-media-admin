// M4 deny-path-tester för update-record (operations-allowlist).
//
// Fas 5.5 (Session 18) registrerade första operationen
// mark-registration-fee-paid → { tableId Anmälningar,
// allowedFields ['Anmälningsavgift'] } i field-allowlists.ts. VIKTIGT:
// källändringen påverkar inte staging förrän update-record OMDEPLOYAS —
// CI har inget deploy-steg (CI-fynd run 27463508240, ADR-049 Öppen
// tråd 1). Teststatus:
//   - deny: okänd operation → 400 (aktiv; korrekt oavsett deploy).
//   - deny: recordId utan rec-prefix → 400 — AKTIV (resume-19 bygg-steg 7a;
//     update-record omdeployat med mark-registration-fee-paid i allowlisten).
//   - deny: fält utanför allowlist → 400 — AKTIV (resume-19 bygg-steg 7a).
//   - allow: registrerad operation → 200 — AKTIV (resume-19 bygg-steg 7b).
//     Muterar seedad staging-post (TEST_REGISTRATION_RECORD_ID) →
//     'Mottagen' + läs-tillbaka-assert; try/finally restaurerar
//     ursprungsvärdet så live-data aldrig lämnas ändrad (ADR-049 Öppen tråd 1 + 2).
//
// Auth-/anonym-deny (401) testas inte här utan i require-user-sviten via
// den delade requireUser-gatewayen (täcker alla Edge Functions).

import { expect, test } from '@playwright/test';
import { HISTORY_PERSON_ID } from './fixtures';
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
    // steg 3 fäller → 400. Aktiv sedan update-record omdeployats till
    // staging med mark-registration-fee-paid i allowlisten (resume-19
    // bygg-steg 5/7a) — prövar nu verkligen prefix-vägen (tidigare svarade
    // EF "Unknown operation" före redeploy). CI-fynd run 27463508240,
    // ADR-049 Öppen tråd 1.
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
    // Aktiv sedan update-record omdeployats till staging (resume-19
    // bygg-steg 5/7a) — tidigare svarade EF "Unknown operation" före
    // redeploy. CI-fynd run 27463508240, ADR-049 Öppen tråd 1.
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

  test('allow: registrerad operation + tillåtna fält → 200 (muterar + restaurerar)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);
    const authHeaders = { Authorization: `Bearer ${userJwt}` };

    const recordId = process.env.TEST_REGISTRATION_RECORD_ID ?? '';
    expect(recordId, 'TEST_REGISTRATION_RECORD_ID måste vara satt i staging-env').not.toBe('');

    // Läs ett registrerings-fälts nuvarande värde via get-registrations
    // (ingen filter → alla; matcha på record-id). Befintlig EF, ingen
    // Airtable-direktåtkomst i testet.
    const readAnmalningsavgift = async (): Promise<string | null> => {
      const r = await request.get(`${config.baseUrl}/functions/v1/get-registrations`, {
        headers: authHeaders,
      });
      expect(r.status()).toBe(200);
      const body = (await r.json()) as {
        registrations: { id: string; anmalningsavgift: string | null }[];
      };
      const rec = body.registrations.find((x) => x.id === recordId);
      expect(rec, `seedad post ${recordId} hittades inte via get-registrations`).toBeTruthy();
      return rec?.anmalningsavgift ?? null;
    };

    // Ursprungsvärde FÖRE mutation (restaureras i finally oavsett utfall).
    const original = await readAnmalningsavgift();

    try {
      const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'mark-registration-fee-paid',
          recordId,
          fields: { Anmälningsavgift: 'Mottagen' },
        },
      });
      expect(res.status()).toBe(200);

      // Läs-tillbaka: bevisar att mutationen faktiskt satte fältet (ej bara 200).
      expect(await readAnmalningsavgift()).toBe('Mottagen');
    } finally {
      // Restore: skriv tillbaka ursprungsvärdet (samma operation — allowlisten
      // gatar fältet, inte värdet) så staging-data aldrig lämnas muterad. Körs
      // även om assertionen ovan kastar.
      await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'mark-registration-fee-paid',
          recordId,
          fields: { Anmälningsavgift: original ?? 'Ej mottagen' },
        },
      });
    }
  });
});

// Andra registrerade operationen: update-person-note → { tableId Personer,
// allowedFields ['Anteckningar'] } (Fas 6a L6, Session 23). Aktiv sedan
// update-record omdeployats till staging med op:en i allowlisten (L6a-grind,
// v4→v5). Field-isolering: ingen *.staging.test asserterar på `anteckningar`
// (grep-bekräftat) → write/restore mot ZZ-History-fixturen stör inte
// get-person:s parallella conformance-läsning.
test.describe('update-record — update-person-note (Personer.Anteckningar)', () => {
  test('deny: fält utanför allowlist → 400', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // update-person-note har allowedFields ['Anteckningar']. `Förnamn` är ett
    // äkta Personer-fält men UTANFÖR listan → findDisallowedField (steg 4) fäller
    // före Airtable-anropet. Samma format-giltiga fake-ID som deny-testet ovan
    // (passerar rec-prefix-checken i steg 3 → prövar verkligen fält-grinden).
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'update-person-note',
        recordId: 'recAAAAAAAAAAAAA',
        fields: { Förnamn: 'x' },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not allowed for operation/);
  });

  test('allow: Anteckningar → 200 (muterar + restaurerar)', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);
    const authHeaders = { Authorization: `Bearer ${userJwt}` };

    // Läs personens nuvarande Anteckningar via get-person (befintlig EF, ingen
    // Airtable-direktåtkomst). Returnerar string | null (fältet är nullable).
    const readAnteckningar = async (): Promise<string | null> => {
      const r = await request.get(
        `${config.baseUrl}/functions/v1/get-person?id=${encodeURIComponent(HISTORY_PERSON_ID)}`,
        { headers: authHeaders },
      );
      expect(r.status()).toBe(200);
      const body = (await r.json()) as { person: { anteckningar: string | null } };
      return body.person.anteckningar;
    };

    // Ursprungsvärde FÖRE mutation (restaureras i finally oavsett utfall).
    const original = await readAnteckningar();
    const SENTINEL = 'ZZ-L6b-sentinel';

    try {
      const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'update-person-note',
          recordId: HISTORY_PERSON_ID,
          fields: { Anteckningar: SENTINEL },
        },
      });
      expect(res.status()).toBe(200);

      // Läs-tillbaka: bevisar att mutationen faktiskt satte fältet (ej bara 200).
      expect(await readAnteckningar()).toBe(SENTINEL);
    } finally {
      // Restore: skriv tillbaka ursprungsvärdet (samma operation — allowlisten
      // gatar fältet, inte värdet). Var det null → '' (tom multilineText
      // round-trippar till null vid läsning; driftar inte fixturen). Körs även
      // om assertionen ovan kastar.
      await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'update-person-note',
          recordId: HISTORY_PERSON_ID,
          fields: { Anteckningar: original ?? '' },
        },
      });
    }
  });
});
