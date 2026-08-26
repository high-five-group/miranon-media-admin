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
import { HISTORY_PERSON_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

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

  test('S103 2026-08-12: historiken bär länkmålets BÅDA halvor — eventId satt, registrationId null', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetPerson(request, config, jwt, HISTORY_PERSON_ID);
    expect(res.status()).toBe(200);

    const body = (await res.json()) as { person: unknown };
    const person = PersonDetailSchema.parse(body.person);

    // `eventId` — SATT för alla tre. Live-verifierat i staging 2026-08-12
    // (list_records mot tbldWHH6sSHWoQPHH): fixturens tre Deltaganden bär var
    // sin `Event`-länk, i datum-desc-ordningen ovan (RIM 3 / RIM 2 / RIM 1).
    expect(person.historik.map((h) => h.eventId)).toEqual([
      'recfnotr1i2nQLBJd',
      'recxe1oTDwA4qbVk7',
      'reci2UQEPBMl3ebNl',
    ]);

    // `registrationId` — NULL för alla tre. Fixturen seedades UTAN
    // `Anmälan`-länk (fältet saknas helt i API-svaret, live-verifierat samma
    // dag), trots att personen bär två Anmälningar. Det gör den till skarpt
    // bevis för NULL-grenen: vyn ska rendera raden oklickbar, aldrig bygga en
    // halv route av ett satt eventId och ett saknat registrationId.
    expect(person.historik.map((h) => h.registrationId)).toEqual([null, null, null]);

    // ÄRLIG LUCKA, medvetet ej täckt här: den SATTA `registrationId`-grenen.
    // Att seeda in en `Anmälan`-länk i denna fixtur vore att röra en permanent
    // conformance-fixtur (CLAUDE.md § Granskningsdata) för att bevisa en rad
    // som delar kodväg — samma `firstLinkId`-hjälpare, samma radform — med
    // `eventId` ovan. Den grenen bevisas i stället mot Sofia Isaksson
    // (recxF88ZKUbP9JUs1), vars fem deltaganden bär BÅDA länkarna
    // (live-verifierat 2026-08-12), vid granskning i browsern.
  });

  test('S103 steg 2: hamtningar/motiveringar/flagga är RIKTIGA poster, inte platta strängar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetPerson(request, config, jwt, HISTORY_PERSON_ID);
    expect(res.status()).toBe(200);

    const body = (await res.json()) as { person: unknown };
    const person = PersonDetailSchema.parse(body.person);

    // ZZ-History Person 01 bär inga Touchpoints (live-verifierat via
    // get_record 2026-08-10: `Touchpoints`-fältet saknas helt i API-svaret) →
    // batchen hoppas över, hamtningar = [] (inte ett fel, en tom länk).
    expect(person.hamtningar).toEqual([]);

    // Personen bär 2 Anmälningar (samma 2 som ger de 2 orterna ovan), ingendera
    // med `Event`-länk eller ifylld motiveringstext (live-verifierat via
    // get_record 2026-08-10) → motivering=null, event=null för båda.
    //
    // DESSA TVÅ RADER ÄR OCKSÅ BACKFILL-VÄGENS ENDA SKARPA BEVIS (S103,
    // 2026-08-12). EF:en läser sedan dess `Inskickad ?? Rad skapad` för
    // `datum` och `Startdatum` för `eventDatum` — båda tomma här, live-
    // ombekräftat via get_record samma dag: recO8TSK2A0b0a5YF har varken
    // `Inskickad`, `Event`-länk eller `Startdatum`. Fallbacken ger därför
    // OFÖRÄNDRADE `Rad skapad`-datum, och `eventDatum` blir null. Går den
    // här assertionen sönder av en framtida ändring är det fallback-kedjan
    // som brustit, inte fixturen.
    //
    // `Rad skapad` skiljer dem: recO8TSK2A0b0a5YF (07:35:48) är YNGRE än
    // rec0wC9rEGKUIHC2W (07:35:41) → sorterad FÖRST (datum desc).
    expect(person.motiveringar).toEqual([
      {
        id: 'recO8TSK2A0b0a5YF',
        motivering: null,
        event: null,
        datum: '2026-06-19T07:35:48.000Z',
        eventDatum: null,
        ort: null,
        eventId: null,
      },
      {
        id: 'rec0wC9rEGKUIHC2W',
        motivering: null,
        event: null,
        datum: '2026-06-19T07:35:41.000Z',
        eventDatum: null,
        ort: null,
        eventId: null,
      },
    ]);

    // Personen bär inget `Flagga`-värde (live-verifierat 2026-08-10) → null,
    // inte tom sträng eller undefined (schemat hade fällt på det senare).
    expect(person.flagga).toBeNull();
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

// Multi-värd "Ort"-klass: ZZ-History Person 01 har (minst) 2 Anmälningar i
// olika orter → Personer.Ort-rollup innehåller ['ZZ-Skövde','ZZ-Göteborg'].
// Detta är fixturen L5b SAKNADE. Bevisar att data-förlust-regressionen
// (firstString) är stängd mot SKARP data: båda orterna måste komma tillbaka
// (gammal kod gav 1 / kraschade parse).
//
// INVARIANT (TASK-31, ej exakt räkning): rollupen är additiv — en framtida
// skiva som länkar ÄNNU en Anmälan till ZZ-History-personen växer den till 3+
// element utan att något faktiskt är fel (fångat live i S75 batch 3, 18.4:s
// bygg-agent — rollupen växte till tre element mitt i en annan skivas
// seedning innan länken togs bort). Assertionen prövar därför att BÅDA
// orterna är REPRESENTERADE, aldrig att listan är exakt dessa två.
const EXPECTED_ORTER = ['ZZ-Skövde', 'ZZ-Göteborg'];

test.describe('get-person/get-persons — multi-värd ort (data-förlust-fixens skarp-bevis)', () => {
  test('get-person → ort innehåller BÅDA orterna (ingen tyst drop)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetPerson(request, config, jwt, HISTORY_PERSON_ID);
    expect(res.status()).toBe(200);

    const body = (await res.json()) as { person: unknown };
    const person = PersonDetailSchema.parse(body.person);

    // Innehåller, inte "är exakt" — robust mot additiv fixtur-tillväxt (TASK-31).
    expect(person.ort).toEqual(expect.arrayContaining(EXPECTED_ORTER));
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
    // Innehåller, inte "är exakt" — samma invariant som ovan (TASK-31).
    expect(person?.ort ?? []).toEqual(expect.arrayContaining(EXPECTED_ORTER));
  });
});
