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

import { type APIRequestContext, expect, test } from '@playwright/test';
import {
  CHECKIN_DELTAGANDE_A_ID,
  CHECKIN_EVENT_ID,
  EVENTMATCHNING_ANMALAN_UTAN_EVENT_ID,
  EVENTMATCHNING_EVENT_A_EVENTKEY,
  EVENTMATCHNING_EVENT_A_ID,
  HISTORY_PERSON_ID,
} from './fixtures';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/update-record';

// ── LÄS-TILLBAKA MED BUNDEN VÄNTAN (TASK-256) ──────────────────────────────
//
// VARFÖR: varje allow-test här skriver via update-record och läser DIREKT
// tillbaka genom en läs-EF för att bevisa att mutationen faktiskt landade (ej
// bara att svaret var 200). Läsvägarna går via Airtables LIST-endpoint
// (get-registrations/get-attendance: filterByFormula + paginerad walk) medan
// skrivningen går via PATCH på record-endpointen — två olika vägar in i samma
// bas. Läsningen speglar normalt skrivningen omedelbart, men INTE alltid.
//
// MÄTT, INTE ANTAGET (TASK-256, 2026-08-17):
//   · CI-population: 1 av 63 staging-körningar (post-merge.yml + nightly.yml,
//     2026-07-23→2026-08-17) fällde här. Instansen är körning 31984652487:
//     BÅDA de skrivande allow-testerna föll i samma körning, och båda med
//     exakt FÖRE-värdet tillbaka — `Bor över` gav `true` där `false` just
//     skrivits och kvitterats 200, `Status` gav `'Ej avstämt'` där
//     `'Närvarande'` just skrivits och kvitterats 200. Playwrights
//     `retries: 2` grönade båda på omförsöket ⇒ "2 flaky".
//   · Lokal mekanism-sond: 180 skriv→läs-cykler mot samma två fixturer gav
//     NOLL inaktuella förstaläsningar. Läsanropet självt kostade p50 ~0,9–1,0 s,
//     p95 ~1,1 s, enstaka utstickare 7,85 s. Luckan är alltså SÄLLSYNT — den
//     går inte att reproducera på begäran, och dess magnitud är därför omätt.
//
// VAD DETTA ÄR OCH INTE ÄR: en bunden väntan, inte en tystad assertion.
// `expect.poll` pollar ENDAST om matcharen ger värde-mismatch; ett undantag ur
// callbacken (icke-200 från läs-EF:en, posten saknas) propagerar OMEDELBART
// utan omförsök — verifierat mot Playwrights egen implementation
// (`packages/playwright/src/matchers/expect.ts`: `await actual()` ligger
// UTANFÖR try-blocket) och mot dess regressionstest
// `expect-poll.spec.ts` › "should not retry predicate that threw an error".
// Infrastrukturfel felar alltså lika hårt och lika snabbt som förut; bara ett
// ÄNNU-INTE-speglat värde väntas ut. En äkta regression (skrivningen landar
// aldrig) fäller fortfarande — den fäller efter budgeten nedan i stället för
// omedelbart, och med sista lästa värde i felutskriften.
//
// BUDGETEN ÄR VALD MOT MÄTNINGEN, inte gissad: 8 s rymmer ~5–6 läsförsök vid
// uppmätt läshastighet, och håller ett test med TVÅ läs-tillbaka (bor över,
// check-in) under Playwrights 30-sekunderstak även i värsta fall
// (~5,6 s normal körtid + 2 × ~7 s extra ≈ 20 s). I lyckat fall — 99 % av
// körningarna enligt mätningen ovan — träffar FÖRSTA proben och kostnaden är
// oförändrad mot före. Skulle den verkliga luckan visa sig vara längre än 8 s
// fäller testet precis som i dag, med CI:s `retries: 2` kvar som nät; höj då
// talet mot en MÄTNING av luckan, aldrig reflexmässigt.
const LAS_TILLBAKA_TIMEOUT_MS = 8_000;
const LAS_TILLBAKA_INTERVALL = [250, 500, 1_000, 2_000];

/**
 * Läs tillbaka `vad` tills läsvägen speglar `vantat`, eller fäll efter budgeten.
 * `las` ska vara läs-EF-anropet självt — dess egna `expect`:ar (status 200,
 * posten hittad) behåller sin fail-fast-semantik, se resonemanget ovan.
 */
async function forvantaLastVarde<T>(las: () => Promise<T>, vantat: T, vad: string): Promise<void> {
  await expect
    .poll(las, {
      timeout: LAS_TILLBAKA_TIMEOUT_MS,
      intervals: LAS_TILLBAKA_INTERVALL,
      message: `läs-tillbaka av ${vad} speglade aldrig skrivningen inom ${LAS_TILLBAKA_TIMEOUT_MS} ms`,
    })
    .toEqual(vantat);
}

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
    expect(
      recordId,
      'TEST_REGISTRATION_RECORD_ID måste vara satt i staging-env (lokalt: raden finns i .env.test.example — seed-ankaret, docs/BUILD-LOG.md)',
    ).not.toBe('');

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
      await forvantaLastVarde(readAnmalningsavgift, 'Mottagen', 'Anmälningsavgift');
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
      await forvantaLastVarde(readAnteckningar, SENTINEL, 'Anteckningar');
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

// Tredje registrerade Personer-operationen: update-person-flag → { tableId
// Personer, allowedFields ['Flagga'] } (S103, Marcus GO 2026-08-10 — Lottas
// egen fritext-flagga, ersätter den aldrig-satta 'Manuella flagga'). `Flagga`
// är ett NYTT fält (skapat 2026-08-10) och exponeras ÄNNU INTE av get-person
// (en parallell agent äger den ändringen i samma S103-svep) — så till skillnad
// mot update-person-note-blocket ovan finns ingen läs-EF att verifiera mot.
// Läsningen sker i stället via SAMMA update-record-anrop med `fields: {}`: ett
// formellt no-op-PATCH (findDisallowedField passerar trivialt på en tom
// nyckel-mängd; Airtable lämnar fält som inte nämns i `fields` orörda) vars
// SVAR ändå bär hela radens råa `record.fields` — samma "skriv-bevis ur den
// råa responsen"-princip create-event-note/create-person-note redan bygger på.
test.describe('update-record — update-person-flag (Personer.Flagga)', () => {
  test('deny: fält utanför allowlist → 400', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // update-person-flag har allowedFields ['Flagga']. `Förnamn` är ett äkta
    // Personer-fält men UTANFÖR listan → findDisallowedField (steg 4) fäller
    // före Airtable-anropet.
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'update-person-flag',
        recordId: 'recAAAAAAAAAAAAA',
        fields: { Förnamn: 'x' },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not allowed for operation/);
  });

  test('allow: Flagga → 200 (muterar + restaurerar)', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);
    const authHeaders = { Authorization: `Bearer ${userJwt}` };

    // Läs personens nuvarande Flagga via ett no-op update-record-anrop (fields: {}
    // — se filhuvudets docblock för varför get-person inte kan användas här).
    const readFlagga = async (): Promise<string | null> => {
      const r = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'update-person-flag',
          recordId: HISTORY_PERSON_ID,
          fields: {},
        },
      });
      expect(r.status()).toBe(200);
      const body = (await r.json()) as { record: { fields: Record<string, unknown> } };
      const v = body.record.fields['Flagga'];
      return typeof v === 'string' ? v : null;
    };

    // Ursprungsvärde FÖRE mutation (restaureras i finally oavsett utfall). Fältet
    // är NYTT 2026-08-10 — live-verifierat TOMT på HISTORY_PERSON_ID samma dag
    // (describe_table/get_record via Airtable MCP, S103-bygget) INNAN detta test
    // skrevs, men vi läser dynamiskt i stället för att hårdkoda antagandet.
    const original = await readFlagga();
    const SENTINEL = 'ZZ-S103-flagga-sentinel';

    try {
      const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'update-person-flag',
          recordId: HISTORY_PERSON_ID,
          fields: { Flagga: SENTINEL },
        },
      });
      expect(res.status()).toBe(200);

      // Läs-tillbaka: bevisar att mutationen faktiskt satte fältet (ej bara 200).
      await forvantaLastVarde(readFlagga, SENTINEL, 'Flagga');
    } finally {
      // Restore: skriv tillbaka ursprungsvärdet (samma operation — allowlisten
      // gatar fältet, inte värdet). Var det null → '' (tom singleLineText
      // round-trippar till null vid läsning; driftar inte fixturen). Körs även
      // om assertionen ovan kastar.
      await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'update-person-flag',
          recordId: HISTORY_PERSON_ID,
          fields: { Flagga: original ?? '' },
        },
      });
    }
  });
});

// Betalnings-vertikalens tre operationer (task-18.8, AC #1 — PRD task-18
// beslut 9): mark-final-payment-paid → ['Slutbetalning'] ·
// update-registration-payment-note → de TVÅ additiva per-betalnings-
// noteringsfälten · log-payment-reminder → de TVÅ additiva per-betalnings-
// tidsstämpelfälten (påminnelse-vägvalet ADDITIVA FÄLT, bokfört i skivan).
// Deny-yta per operation: ett ÄKTA Anmälningar-fält som ligger MEDVETET
// utanför listan (Anmälningsavgift resp. gamla odelade Notering/
// Betalningspåminnelse skickad) → findDisallowedField fäller före Airtable-
// anropet. Allow-vägen muterar den seedade posten
// (TEST_REGISTRATION_RECORD_ID) och restaurerar i finally (ADR-049-mönstret:
// allowlisten gatar fältet, inte värdet). Läs-tillbaka via get-registrations
// bevisar samtidigt läs-shapens fyra nya fält (deploy-bundna: röda före
// EF-redeploy av update-record + get-registrations).
test.describe('update-record — betalnings-vertikalen (task-18.8)', () => {
  /** Läs den seedade postens betalningsfält via get-registrations (event-lösa grenen). */
  async function readSeededPayment(
    request: APIRequestContext,
    baseUrl: string,
    authHeaders: Record<string, string>,
    recordId: string,
  ): Promise<{
    slutbetalning: string | null;
    noteringAnmalningsavgift: string | null;
    noteringSlutbetalning: string | null;
    paminnelseAnmalningsavgiftSkickad: string | null;
    paminnelseSlutbetalningSkickad: string | null;
  }> {
    const r = await request.get(`${baseUrl}/functions/v1/get-registrations`, {
      headers: authHeaders,
    });
    expect(r.status()).toBe(200);
    const body = (await r.json()) as {
      registrations: ({ id: string } & Record<string, unknown>)[];
    };
    const rec = body.registrations.find((x) => x.id === recordId);
    expect(rec, `seedad post ${recordId} hittades inte via get-registrations`).toBeTruthy();
    return {
      slutbetalning: (rec?.slutbetalning ?? null) as string | null,
      noteringAnmalningsavgift: (rec?.noteringAnmalningsavgift ?? null) as string | null,
      noteringSlutbetalning: (rec?.noteringSlutbetalning ?? null) as string | null,
      paminnelseAnmalningsavgiftSkickad: (rec?.paminnelseAnmalningsavgiftSkickad ?? null) as
        | string
        | null,
      paminnelseSlutbetalningSkickad: (rec?.paminnelseSlutbetalningSkickad ?? null) as
        | string
        | null,
    };
  }

  function seededRecordId(): string {
    const recordId = process.env.TEST_REGISTRATION_RECORD_ID ?? '';
    expect(
      recordId,
      'TEST_REGISTRATION_RECORD_ID måste vara satt i staging-env (lokalt: raden finns i .env.test.example — seed-ankaret, docs/BUILD-LOG.md)',
    ).not.toBe('');
    return recordId;
  }

  test('deny: mark-final-payment-paid med fält utanför allowlist → 400', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // Allowlisten är EXAKT ['Slutbetalning'] — Anmälningsavgift är ett äkta
    // Anmälningar-fält men hör till mark-registration-fee-paid; blandning
    // fälls (operations-avgränsningen, inte bara okända fält).
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'mark-final-payment-paid',
        recordId: 'recAAAAAAAAAAAAA',
        fields: { Anmälningsavgift: 'Mottagen' },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not allowed for operation/);
  });

  test('deny: update-registration-payment-note med gamla odelade Notering → 400', async ({
    request,
  }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // Gamla 'Notering' (fldPMsiRoLWcgUbsv) ligger MEDVETET utanför listan —
    // per-betalnings-vertikalen skriver ENDAST de två additiva fälten
    // (ADR-063: det odelade fältet lämnas orört av appen).
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'update-registration-payment-note',
        recordId: 'recAAAAAAAAAAAAA',
        fields: { Notering: 'x' },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not allowed for operation/);
  });

  test('deny: log-payment-reminder med gamla odelade Betalningspåminnelse skickad → 400', async ({
    request,
  }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // Gamla 'Betalningspåminnelse skickad' (fldE0cR4r9vI0rKiL) ligger MEDVETET
    // utanför listan — samma odelad-fält-avgränsning som noteringen.
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'log-payment-reminder',
        recordId: 'recAAAAAAAAAAAAA',
        fields: { 'Betalningspåminnelse skickad': '2026-07-22T10:00:00.000Z' },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not allowed for operation/);
  });

  test('allow: mark-final-payment-paid → 200 (muterar Slutbetalning + restaurerar)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);
    const authHeaders = { Authorization: `Bearer ${userJwt}` };
    const recordId = seededRecordId();

    const original = (await readSeededPayment(request, config.baseUrl, authHeaders, recordId))
      .slutbetalning;

    try {
      const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'mark-final-payment-paid',
          recordId,
          fields: { Slutbetalning: 'Mottagen' },
        },
      });
      expect(res.status()).toBe(200);

      // Läs-tillbaka: bevisar att mutationen faktiskt satte fältet (ej bara 200).
      await forvantaLastVarde(
        async () =>
          (await readSeededPayment(request, config.baseUrl, authHeaders, recordId)).slutbetalning,
        'Mottagen',
        'Slutbetalning',
      );
    } finally {
      // Restore: allowlisten gatar fältet, inte värdet — samma operation
      // skriver tillbaka ursprungsvärdet ('Ej mottagen' om posten saknade).
      await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'mark-final-payment-paid',
          recordId,
          fields: { Slutbetalning: original ?? 'Ej mottagen' },
        },
      });
    }
  });

  test('allow: update-registration-payment-note → 200 (båda additiva fälten + restaurerar)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);
    const authHeaders = { Authorization: `Bearer ${userJwt}` };
    const recordId = seededRecordId();

    const original = await readSeededPayment(request, config.baseUrl, authHeaders, recordId);
    const AVGIFT_SENTINEL = 'ZZ-18.8-avgift-notering';
    const SLUT_SENTINEL = 'ZZ-18.8-slut-notering';

    try {
      const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'update-registration-payment-note',
          recordId,
          fields: {
            'Notering anmälningsavgift': AVGIFT_SENTINEL,
            'Notering slutbetalning': SLUT_SENTINEL,
          },
        },
      });
      expect(res.status()).toBe(200);

      // Läs-tillbaka bevisar mutationen OCH läs-shapens nya noteringsfält. BÅDA
      // fälten skrivs i SAMMA PATCH, så de pollas som ETT par — ett halvspeglat
      // mellanläge är då inte ett giltigt slutvärde att stanna på.
      await forvantaLastVarde(
        async () => {
          const a = await readSeededPayment(request, config.baseUrl, authHeaders, recordId);
          return {
            noteringAnmalningsavgift: a.noteringAnmalningsavgift,
            noteringSlutbetalning: a.noteringSlutbetalning,
          };
        },
        { noteringAnmalningsavgift: AVGIFT_SENTINEL, noteringSlutbetalning: SLUT_SENTINEL },
        'de båda noteringsfälten',
      );
    } finally {
      // Restore: null → '' (tom multilineText round-trippar till null vid
      // läsning — update-person-note-precedentens teardown-form).
      await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'update-registration-payment-note',
          recordId,
          fields: {
            'Notering anmälningsavgift': original.noteringAnmalningsavgift ?? '',
            'Notering slutbetalning': original.noteringSlutbetalning ?? '',
          },
        },
      });
    }
  });

  test('allow: log-payment-reminder → 200 (tidsstämpel + restaurerar)', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);
    const authHeaders = { Authorization: `Bearer ${userJwt}` };
    const recordId = seededRecordId();

    const original = await readSeededPayment(request, config.baseUrl, authHeaders, recordId);
    const STAMP = '2026-07-22T10:00:00.000Z';

    try {
      const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'log-payment-reminder',
          recordId,
          fields: { 'Påminnelse anmälningsavgift skickad': STAMP },
        },
      });
      expect(res.status()).toBe(200);

      // Läs-tillbaka: epoch-jämförelse (Airtable normaliserar ISO-formen,
      // tidpunkten är kontraktet — inte strängformen). `null` (fältet ännu
      // osatt) projiceras till null och matchar aldrig epoch-talet, så den
      // tidigare separata not-toBeNull-assertionen är bevarad i samma jämförelse.
      await forvantaLastVarde(
        async () => {
          const a = await readSeededPayment(request, config.baseUrl, authHeaders, recordId);
          return a.paminnelseAnmalningsavgiftSkickad === null
            ? null
            : Date.parse(a.paminnelseAnmalningsavgiftSkickad);
        },
        Date.parse(STAMP),
        'Påminnelse anmälningsavgift skickad (som epoch)',
      );
    } finally {
      // Restore: null RENSAR dateTime-fältet (Airtable-PATCH-semantik) —
      // fixturen lämnas exakt som den hittades.
      await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'log-payment-reminder',
          recordId,
          fields: {
            'Påminnelse anmälningsavgift skickad': original.paminnelseAnmalningsavgiftSkickad,
          },
        },
      });
    }
  });
});

// Bor över-vertikalens operation (task-18.7, AC #1 — PRD task-18 beslut 8):
// set-registration-lodging → EXAKT ['Bor över'] (ADDITIVT checkbox-fält
// fldGYYNnQi7XlfbhP, staging-fött 2026-07-22). Deny-ytan är ett ÄKTA
// Anmälningar-fält utanför listan (Status — bekräftelse-operationens fält):
// blandning fälls, inte bara okända fält. Allow-vägen kryssar i den seedade
// posten (TEST_REGISTRATION_RECORD_ID) och kryssar UR i finally — allowlisten
// gatar fältet, inte värdet, så samma operation bär teardownen.
// Field-isolering: ingen annan *.staging.test asserterar `borOver` på den
// seedade posten (bor över-läsbeviset står mot ZZ-arbetsko-fixturen, ett annat
// event) → parallell körning kan inte se den tillfälliga mutationen.
test.describe('update-record — bor över-vertikalen (task-18.7)', () => {
  /** Läs den seedade postens `borOver` via get-registrations (event-lösa grenen). */
  async function readSeededBorOver(
    request: APIRequestContext,
    baseUrl: string,
    authHeaders: Record<string, string>,
    recordId: string,
  ): Promise<boolean> {
    const r = await request.get(`${baseUrl}/functions/v1/get-registrations`, {
      headers: authHeaders,
    });
    expect(r.status()).toBe(200);
    const body = (await r.json()) as {
      registrations: ({ id: string } & Record<string, unknown>)[];
    };
    const rec = body.registrations.find((x) => x.id === recordId);
    expect(rec, `seedad post ${recordId} hittades inte via get-registrations`).toBeTruthy();
    return rec?.borOver === true;
  }

  /** Seed-ankaret (samma post som betalnings-testerna muterar och restaurerar). */
  function seededLodgingRecordId(): string {
    const recordId = process.env.TEST_REGISTRATION_RECORD_ID ?? '';
    expect(
      recordId,
      'TEST_REGISTRATION_RECORD_ID måste vara satt i staging-env (lokalt: raden finns i .env.test.example — seed-ankaret, docs/BUILD-LOG.md)',
    ).not.toBe('');
    return recordId;
  }

  test('deny: set-registration-lodging med fält utanför allowlist → 400', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // Allowlisten är EXAKT ['Bor över'] — 'Status' är ett äkta Anmälningar-fält
    // men hör till send-registration-confirmation; blandning fälls före
    // Airtable-anropet (operations-avgränsningen).
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'set-registration-lodging',
        recordId: 'recAAAAAAAAAAAAA',
        fields: { Status: 'Bekräftad (mail skickat)' },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not allowed for operation/);
  });

  test('allow: set-registration-lodging → 200 (kryssar i + kryssar ur i teardown)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);
    const authHeaders = { Authorization: `Bearer ${userJwt}` };
    const recordId = seededLodgingRecordId();

    const original = await readSeededBorOver(request, config.baseUrl, authHeaders, recordId);

    try {
      const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'set-registration-lodging',
          recordId,
          fields: { 'Bor över': true },
        },
      });
      expect(res.status()).toBe(200);

      // Läs-tillbaka: bevisar att krysset faktiskt sattes (ej bara 200) OCH att
      // läs-shapens nya `borOver` bär det.
      await forvantaLastVarde(
        () => readSeededBorOver(request, config.baseUrl, authHeaders, recordId),
        true,
        'Bor över (ikryssad)',
      );

      // Av-bocken går genom SAMMA operation (allowlisten gatar fältet, inte
      // värdet) — kryss-lägets toggle är därmed kontraktstestad åt båda håll.
      const av = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'set-registration-lodging',
          recordId,
          fields: { 'Bor över': false },
        },
      });
      expect(av.status()).toBe(200);
      await forvantaLastVarde(
        () => readSeededBorOver(request, config.baseUrl, authHeaders, recordId),
        false,
        'Bor över (urkryssad)',
      );
    } finally {
      // Restore: skriv tillbaka ursprungstillståndet så staging-data lämnas
      // exakt som den hittades. Körs även om assertionen ovan kastar.
      await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'set-registration-lodging',
          recordId,
          fields: { 'Bor över': original },
        },
      });
    }
  });
});

// Check-in-vertikalens operation (TASK-214.1, PRD task-214 — S90-förarbetets
// FÄRDIGA spec, tasks/sessions/bilagor/s90-checkin-forarbete/skarpt-underlag.md
// § 1.2/1.5): set-attendance-status → EXAKT ['Status'] mot Deltaganden.
// Deny-ytan är ETT ÄKTA Deltaganden-fält utanför listan: 'Avstämt' — A8:s eget
// fält (samma "starkaste deny-fall"-princip som S90 § 1.5 föreskriver, eftersom
// A8 annars skulle kapplöpa med appen om samma fält). Allow-vägen togglar
// Närvarande ⇄ Ej avstämt på den permanenta CHECKIN_DELTAGANDE_A_ID-fixturen
// (tests/api/fixtures.ts § ZZ-Checkin-fixtur) och läser tillbaka via
// get-attendance (ingen Airtable-direktåtkomst i testet — samma disciplin som
// readSeededBorOver ovan).
//
// RÄCKEN (S90 § 1.5 + PRD task-214 AC #4): asserterar ALDRIG på `Avstämt` (A8
// är endast prod-verifierad, inte staging — se S90 § 3.3) och rör ALDRIG
// ZZ-History Person 01:s tre Deltaganden (get-attendance.staging.test.ts:103
// asserterar status där) eller granskningsfixturen (ZZ-GRANSKNING-*).
test.describe('update-record — check-in-vertikalen: set-attendance-status (TASK-214.1)', () => {
  /** Läs Status för en Deltagande-rad via get-attendance (läsvägen, aldrig Airtable direkt). */
  async function readAttendanceStatus(
    request: APIRequestContext,
    config: ApiConfig,
    authHeaders: Record<string, string>,
    deltagandeId: string,
  ): Promise<string | null> {
    const r = await request.get(
      `${config.baseUrl}/functions/v1/get-attendance?eventId=${encodeURIComponent(CHECKIN_EVENT_ID)}`,
      { headers: authHeaders },
    );
    expect(r.status()).toBe(200);
    const body = (await r.json()) as { attendance: ({ id: string } & Record<string, unknown>)[] };
    const row = body.attendance.find((a) => a.id === deltagandeId);
    expect(row, `Deltagande-raden ${deltagandeId} ska finnas på CHECKIN_EVENT_ID`).toBeTruthy();
    return (row?.status as string | undefined) ?? null;
  }

  test('deny: set-attendance-status med Avstämt (A8:s eget fält) → 400', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // Allowlisten är EXAKT ['Status'] — 'Avstämt' är ett ÄKTA Deltaganden-fält
    // (A8:s eget) men ligger medvetet utanför: blandning fälls före
    // Airtable-anropet, samma form som set-registration-lodging-deny-testet ovan.
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'set-attendance-status',
        recordId: 'recAAAAAAAAAAAAA',
        fields: { Avstämt: '2026-08-14T10:00:00.000Z' },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not allowed for operation/);
  });

  test('allow: set-attendance-status → 200 (Närvarande ⇄ Ej avstämt via läsvägen, restaurerar)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);
    const authHeaders = { Authorization: `Bearer ${userJwt}` };

    const original = await readAttendanceStatus(
      request,
      config,
      authHeaders,
      CHECKIN_DELTAGANDE_A_ID,
    );

    try {
      const toNarvarande = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'set-attendance-status',
          recordId: CHECKIN_DELTAGANDE_A_ID,
          fields: { Status: 'Närvarande' },
        },
      });
      expect(toNarvarande.status()).toBe(200);

      // Läs-tillbaka via LÄSVÄGEN (get-attendance) — aldrig Avstämt, aldrig
      // Airtable direkt. Detta är dörrens incheckad-markör (S90 § 3.1).
      await forvantaLastVarde(
        () => readAttendanceStatus(request, config, authHeaders, CHECKIN_DELTAGANDE_A_ID),
        'Närvarande',
        'Deltagande-radens Status (Närvarande)',
      );

      // Ångra-vägen går genom SAMMA operation (allowlisten gatar fältet, inte
      // värdet) — dörrens "bocka ur i klargruppen"-flöde kontraktstestas åt
      // båda håll.
      const toEjAvstamt = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'set-attendance-status',
          recordId: CHECKIN_DELTAGANDE_A_ID,
          fields: { Status: 'Ej avstämt' },
        },
      });
      expect(toEjAvstamt.status()).toBe(200);
      await forvantaLastVarde(
        () => readAttendanceStatus(request, config, authHeaders, CHECKIN_DELTAGANDE_A_ID),
        'Ej avstämt',
        'Deltagande-radens Status (Ej avstämt)',
      );
    } finally {
      // Restore: skriv tillbaka ursprungstillståndet så den permanenta fixturen
      // lämnas exakt som den hittades. Körs även om assertionen ovan kastar.
      await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'set-attendance-status',
          recordId: CHECKIN_DELTAGANDE_A_ID,
          fields: { Status: original ?? 'Ej avstämt' },
        },
      });
    }
  });
});

// Eventlänkens vakt — resolutionens operation (TASK-284.3; ADR-122 beslut 7):
// relink-registration → EXAKT ['Event', 'EventKey'] mot Anmälningar. Deny-
// ytan är ETT ÄKTA Anmälningar-fält utanför listan ('Status' — en annan
// operations eget); blandning fälls före Airtable-anropet (samma "starkaste
// deny-fall"-princip som set-registration-lodging/set-attendance-status
// ovan). Allow-vägen kopplar OM den PERMANENTA 'ZZ-TASK-284.1 Fixtur Utan
// event'-fixturen (EVENTMATCHNING_ANMALAN_UTAN_EVENT_ID, task-284.1) till
// Fixtur A (EVENTMATCHNING_EVENT_A_ID) och läser tillbaka via
// get-registrations: BÅDA fälten skrivna i SAMMA PATCH bevisas genom att
// `eventId` blir Fixtur A OCH `eventmatchning` (formelfältet) blir 'OK' i
// SAMMA polling — ett halvspeglat mellanläge (länken satt men matchningen
// oförändrad) är alltså INTE ett giltigt slutvärde att stanna på (samma
// par-polling-princip som update-registration-payment-note ovan).
// Formelfältet räknas om SYNKRONT vid PATCH — live-bevisat 2026-08-21 INNAN
// detta test skrevs (fixtures.ts:s docblock för fixturen), så
// `forvantaLastVarde`s budget är ett nät, inte den förväntade vägen.
test.describe('update-record — relink-registration (eventlänkens vakt, task-284.3)', () => {
  /** Läs den relinkade fixturens `eventId` + `eventmatchning` via get-registrations. */
  async function readEventlank(
    request: APIRequestContext,
    baseUrl: string,
    authHeaders: Record<string, string>,
  ): Promise<{ eventId: string | null; eventmatchning: string | null }> {
    const r = await request.get(`${baseUrl}/functions/v1/get-registrations`, {
      headers: authHeaders,
    });
    expect(r.status()).toBe(200);
    const body = (await r.json()) as {
      registrations: ({ id: string } & Record<string, unknown>)[];
    };
    const rec = body.registrations.find((x) => x.id === EVENTMATCHNING_ANMALAN_UTAN_EVENT_ID);
    expect(
      rec,
      `fixturen ${EVENTMATCHNING_ANMALAN_UTAN_EVENT_ID} hittades inte via get-registrations`,
    ).toBeTruthy();
    return {
      eventId: (rec?.eventId ?? null) as string | null,
      eventmatchning: (rec?.eventmatchning ?? null) as string | null,
    };
  }

  test('deny: okänd operation → 400 (samma allowlist-grind, egen instans)', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'relink-registration-typo',
        recordId: 'recAAAAAAAAAAAAA',
        fields: {},
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain('Unknown operation');
  });

  test('deny: fält utanför allowlist → 400', async ({ request }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);

    // Allowlisten är EXAKT ['Event', 'EventKey'] — 'Status' är ett äkta
    // Anmälningar-fält men hör till en annan operation; blandning fälls
    // före Airtable-anropet.
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${userJwt}` },
      data: {
        operationKey: 'relink-registration',
        recordId: 'recAAAAAAAAAAAAA',
        fields: { Status: 'Bekräftad (mail skickat)' },
      },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/not allowed for operation/);
  });

  test('allow: relink-registration → 200 (Event + EventKey i SAMMA skrivning, restaurerar)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const userJwt = await getValidUserJWT(request, config);
    const authHeaders = { Authorization: `Bearer ${userJwt}` };

    // Fixturen är PERMANENT 'Utan event' (Event/EventKey osatta) — inget
    // ursprungsvärde att läsa in, restore-målet är känt i förväg: tomt.
    try {
      const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'relink-registration',
          recordId: EVENTMATCHNING_ANMALAN_UTAN_EVENT_ID,
          fields: {
            Event: [EVENTMATCHNING_EVENT_A_ID],
            EventKey: EVENTMATCHNING_EVENT_A_EVENTKEY,
          },
        },
      });
      expect(res.status()).toBe(200);

      // BÅDA fälten skrivna i samma PATCH: eventId blir Fixtur A OCH
      // eventmatchning blir 'OK' (formeln jämför anmälans egna Ort/Datum/
      // Event(namn) mot Fixtur A:s facit — normaliseringen matchar, samma
      // tre mätta formateringsklasser som Fixtur OK-anmälan bevisar för
      // get-registrations.staging.test.ts).
      await forvantaLastVarde(
        () => readEventlank(request, config.baseUrl, authHeaders),
        { eventId: EVENTMATCHNING_EVENT_A_ID, eventmatchning: 'OK' },
        'eventId + eventmatchning (kopplad)',
      );
    } finally {
      // Restore: Event:[] rensar länken, EventKey:null rensar textfältet
      // (Airtable-PATCH-semantik, samma rensnings-idiom som log-payment-
      // reminder ovan) — fixturen lämnas EXAKT 'Utan event' som den
      // hittades. Körs även om assertionen ovan kastar.
      await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: authHeaders,
        data: {
          operationKey: 'relink-registration',
          recordId: EVENTMATCHNING_ANMALAN_UTAN_EVENT_ID,
          fields: { Event: [], EventKey: null },
        },
      });
      await forvantaLastVarde(
        () => readEventlank(request, config.baseUrl, authHeaders),
        { eventId: null, eventmatchning: 'Utan event' },
        'eventId + eventmatchning (återställd)',
      );
    }
  });
});
