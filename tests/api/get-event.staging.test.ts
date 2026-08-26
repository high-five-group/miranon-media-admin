// get-event — conformance mot deployad staging-EF (Fas 6b L2).
//
// get-event LÄSER bara (ingen write → ingen mutation/restore, till skillnad från
// 6a L6). Bevisar att single-get-mallen + 404-kontraktet + .parse()-shapen håller
// mot skarp staging-data.
//
// INGEN permanent event-fixtur seedas (stopp-grind: seeda inte i onödan). Istället
// härleds ett RIKTIGT event-ID dynamiskt ur get-events (list) → get-event (single).
// Robustare än ett hårdkodat ID (event kan ändras) och bevisar att EF-paret är
// shape-konsistent på samma rad. Saknar staging-basen event → testet fail:ar
// explicit (då finns inget att conformance-testa → eskalera).
//
// Auth via getValidUserJWT → password-grant (samma mönster som get-person). Lokalt
// skip:as utan TEST_USER-creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).

import { type APIRequestContext, expect, test } from '@playwright/test';
import { z } from 'zod';
import { EventSchema } from '../../src/domain/schemas';
import {
  ARBETSKO_EVENT_ID,
  ARBETSKO_EXPECTED,
  BELAGGNING_EVENT_ID,
  BELAGGNING_EXPECTED,
} from './fixtures';
import {
  type ApiConfig,
  classify401Body,
  getApiConfig,
  getValidUserJWT,
  getWithTransientRetry,
} from './helpers';

// TASK-207: get-event.staging.test.ts:48 (get-events-listan, i firstEventId)
// var ETT av fem endpoints som föll på genuina transienta 502/503 från
// Edge Runtime/Airtable-lagret i post-merge-sviten 2026-08-12 — bevisat
// oskyldigt via first-parent-diff. Båda anropen här är idempotenta GET, så
// getWithTransientRetry appliceras på VARJE försök, negativa vägar (404/401/
// 400) inkluderat — retryn är ett no-op för dem eftersom de aldrig ser
// 502/503 på första försöket.
async function callGetEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  id: string | undefined,
) {
  const query = id === undefined ? '' : `?id=${encodeURIComponent(id)}`;
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return getWithTransientRetry(() =>
    request.get(`${config.baseUrl}/functions/v1/get-event${query}`, { headers }),
  );
}

/** Hämta get-events-listan RÅTT — transient-retry-skyddad (TASK-207), delas av
    firstEventId och de tester nedan som läser listan direkt utan att härleda ett ID. */
async function fetchEventsList(request: APIRequestContext, config: ApiConfig, jwt: string) {
  return getWithTransientRetry(() =>
    request.get(`${config.baseUrl}/functions/v1/get-events`, {
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  );
}

/** Härled ett riktigt event-ID ur get-events (list) — ingen seedad fixtur. */
async function firstEventId(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<string> {
  const res = await fetchEventsList(request, config, jwt);
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { events: unknown };
  const events = z.array(EventSchema).parse(body.events);
  expect(
    events.length,
    'staging-basen måste ha minst ETT event att conformance-testa get-event mot',
  ).toBeGreaterThan(0);
  return events[0].id;
}

test.describe('get-event — conformance (single-get-mall, Fas 6b L2)', () => {
  test('giltigt ID → 200 + EventSchema-valid (skarp .parse passerar)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const id = await firstEventId(request, config, jwt);

    const res = await callGetEvent(request, config, jwt, id);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { event: unknown };
    // Skarp validering vid datagränsen — samma .parse som adaptern kör.
    const event = EventSchema.parse(body.event);
    expect(event.id).toBe(id);
    // eventKey i läs-shapen (task-18.1): system-genererad formel "Event-N" — finns på
    // varje Eventplanering-rad → ska alltid följa med get-event (EventKey-pillen bär den).
    expect(event.eventKey).toMatch(/^Event-\d+$/);
  });

  test('get-events: HELA listan parse:ar INKL. NaN-beläggnings-event (klass-bug stängd)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await fetchEventsList(request, config, jwt);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { events: unknown };

    // KÄRNBEVISET: z.array(EventSchema).parse över ALLA event passerar. Före
    // scalarNumber-fixen sänkte ett enda NaN-beläggnings-event (osatt maxPlatser →
    // {specialValue:"NaN"}) hela array-parsen → list-laddningen kraschade. Staging-
    // fixturerna ("Resor i medvetandet 1/2/3") har osatt maxPlatser → NaN-vägen
    // exerceras skarpt.
    const events = z.array(EventSchema).parse(body.events);
    expect(events.length).toBeGreaterThan(0);

    // eventKey i BÅDA läs-EF:erna i SAMMA leverans (task-18.1-fasningen): saknas fältet i
    // get-events fäller z.array-parsen ovan hela listvyn — bevisa att varje rad bär det.
    for (const e of events) {
      expect(e.eventKey, `event ${e.id} saknar eventKey i get-events-shapen`).toMatch(
        /^Event-\d+$/,
      );
    }

    // Minst ETT event ska ha anmaldBelaggning===null (NaN coerced till null) — annars
    // exercerades inte NaN-vägen och beviset är ihåligt.
    const nanEvents = events.filter((e) => e.anmaldBelaggning === null);
    expect(
      nanEvents.length,
      'minst ett staging-event måste ha NaN-beläggning (→null) så coercion-vägen bevisas',
    ).toBeGreaterThan(0);
  });

  // ── Basdimensionerna (TASK-249.4, ADR-115) ──
  // get-events exponerar Kursfamilj/Kursnivå — läsvägen ur basens fält, aldrig
  // gissat. Bevisar mot RIKTIGA staging-fixturer (Resor i medvetandet 1/2/3,
  // samma "kända, redan namngivna" fixturer som NaN-beläggnings-testet ovan
  // pekar ut), live-verifierade mot staging (mcp__airtable__list_records,
  // 2026-08-17) innan detta test skrevs: Kursfamilj='RIM',
  // Kursnivå='Nivå 1'/'Nivå 2'/'Nivå 3'.

  test('basdimensionerna (AC #2): get-events exponerar kursfamilj/kursniva typade ur basens fält', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await fetchEventsList(request, config, jwt);
    expect(res.status()).toBe(200);
    const events = z.array(EventSchema).parse(((await res.json()) as { events: unknown }).events);

    // RIM-familjen: minst ETT event vars eventNamn börjar med "Resor i medvetandet"
    // ska bära kursfamilj==='RIM' och en av de fyra kända kursnivåerna (aldrig null
    // för en KÄND kursnamns-rad — backfillen satte fältet).
    const rimEvent = events.find((e) => e.eventNamn?.startsWith('Resor i medvetandet'));
    expect(rimEvent, 'staging-basen måste ha minst ETT "Resor i medvetandet"-event').toBeDefined();
    expect(rimEvent?.kursfamilj, 'RIM-eventets kursfamilj').toBe('RIM');
    expect(['Intro', 'Nivå 1', 'Nivå 2', 'Nivå 3']).toContain(rimEvent?.kursniva);
  });

  test('basdimensionerna (AC #2): get-event (single) exponerar samma kursfamilj/kursniva-shape', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // Härled ett RIM-event ur listan (samma mönster som firstEventId ovan) — mer
    // robust än ett hårdkodat ID.
    const listRes = await fetchEventsList(request, config, jwt);
    const listEvents = z
      .array(EventSchema)
      .parse(((await listRes.json()) as { events: unknown }).events);
    const rim = listEvents.find((e) => e.eventNamn?.startsWith('Resor i medvetandet'));
    expect(rim, 'staging-basen måste ha minst ETT "Resor i medvetandet"-event').toBeDefined();

    const res = await callGetEvent(request, config, jwt, rim?.id);
    expect(res.status()).toBe(200);
    const event = EventSchema.parse(((await res.json()) as { event: unknown }).event);
    // Håll i synk med get-events (mapEvent-kommentaren i EF:erna) — samma rad,
    // samma värden ur single-get som ur listan.
    expect(event.kursfamilj).toBe('RIM');
    expect(event.kursniva).toBe(rim?.kursniva);
  });

  // ── Beläggningens innehållsmodell (task-18.2; K16 — AC #1) ──
  // PERMANENT seedad fixtur (tests/api/fixtures.ts BELAGGNING_*) — den globala
  // stopp-grinden "seeda inte i onödan" är prövad och passerad: ingen EF kan
  // skriva Källa TOM/'+1' eller vänteliste-länken, så en seedad fixtur är enda
  // deterministiska vägen till positiva per-källa-bevis (get-waitlist-precedent).

  test('per-källa-uppdelningen (AC #1): fixturens kända värden + summering mot basens fält', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await callGetEvent(request, config, jwt, BELAGGNING_EVENT_ID);
    expect(res.status()).toBe(200);
    const event = EventSchema.parse(((await res.json()) as { event: unknown }).event);

    // Kategorifälten ur eventraden (basens skrivbara number-fält, 1-till-1).
    expect(event.maxPlatser, 'Max antal platser').toBe(BELAGGNING_EXPECTED.maxPlatser);
    expect(event.reserverade, "reserverade = basens 'Extra platser'").toBe(
      BELAGGNING_EXPECTED.reserverade,
    );
    expect(event.manuelltTillagda, "manuelltTillagda = basens 'Manuella platser'").toBe(
      BELAGGNING_EXPECTED.manuelltTillagda,
    );

    // Per-källa-räkningarna: 2 × Källa TOM → viaFormular; 1 × '+1' → medfoljande;
    // fixturens Källa 'Manuell'-rad räknas i INGEN av dem (exkluderings-beviset —
    // distinkta värden 2 ≠ 1 utesluter förväxlade räknare).
    expect(event.viaFormular, 'viaFormular = länkade Anmälningar med Källa TOM').toBe(
      BELAGGNING_EXPECTED.viaFormular,
    );
    expect(event.medfoljande, "medfoljande = länkade Anmälningar med Källa '+1'").toBe(
      BELAGGNING_EXPECTED.medfoljande,
    );

    // Väntelistan via NYA länkfältet 'Event (länk)': 2 kopplade rader varav 1
    // Flyttad till anmälan → aktiv-filtret ger 1 (AC #3:s läs-bevis).
    expect(event.vantelista, 'vantelista = AKTIVA event-kopplade Väntelisteplatser').toBe(
      BELAGGNING_EXPECTED.vantelista,
    );

    // SUMMERINGEN mot basens fält: basens formel 'Antal anmälda' =
    // länkade Anmälningar (4: viaFormular 2 + medfoljande 1 + Manuell-raden 1)
    // + 'Manuella platser' (1) = 5 — segmenten är konsistenta med basens egen
    // aggregering, inte en parallell sanning.
    expect(event.antalAnmalda, "basens 'Antal anmälda'-formel (länkar + manuella)").toBe(
      BELAGGNING_EXPECTED.antalAnmalda,
    );
    expect(
      (event.viaFormular ?? 0) + (event.medfoljande ?? 0) + 1 + (event.manuelltTillagda ?? 0),
      'per-källa-delarna + Manuell-raden summerar mot basens Antal anmälda',
    ).toBe(event.antalAnmalda);
  });

  test('beläggnings-fälten är ADDITIVT-optional: godtyckligt event bär räkningar ≥ 0', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const id = await firstEventId(request, config, jwt);

    const res = await callGetEvent(request, config, jwt, id);
    expect(res.status()).toBe(200);
    const event = EventSchema.parse(((await res.json()) as { event: unknown }).event);

    // get-event bär ALLTID räkningarna (0 när inget länkat) — optional-formen
    // finns för get-events/äldre cache, inte för get-event-svaret.
    expect(event.viaFormular).toBeGreaterThanOrEqual(0);
    expect(event.medfoljande).toBeGreaterThanOrEqual(0);
    expect(event.vantelista).toBeGreaterThanOrEqual(0);
  });

  // ── Bor över-summeringen (task-17.5; AC #1) ──
  // HÄRLEDD räkning ur eventets länkade Anmälningars 'Bor över'-kryss (fältet
  // fött task-18.7). Faciten är PERMANENT seedad (DELTAT-FÖRST — 18.7 satte
  // ARBETSKO-fixturens bekraftadId=true, övriga tre false → 1 av 4). Ingen
  // efemär seed: den permanenta fixturen bär ett känt kryss (mer robust än
  // teardown-beroende seed). BELAGGNING-fixturen bär NOLL kryss → noll-fallets
  // bevis (summeringen är ett definit tal ≥0, aldrig undefined/utelämnad i
  // aggregerings-EF:erna). Både get-event (single) och get-events (listan —
  // listkortets faktiska datakälla) aggregerar den.

  test('bor över-summeringen (AC #1): get-event härleder antalet ur fixturens kryss', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // ARBETSKO: 1 av 4 länkade Anmälningar ikryssad → summering 1.
    const arbetskoRes = await callGetEvent(request, config, jwt, ARBETSKO_EVENT_ID);
    expect(arbetskoRes.status()).toBe(200);
    const arbetsko = EventSchema.parse(((await arbetskoRes.json()) as { event: unknown }).event);
    expect(arbetsko.borOverAntal, 'ARBETSKO: 1 ikryssad Bor över (bekraftadId)').toBe(
      ARBETSKO_EXPECTED.borOverAntal,
    );

    // BELAGGNING: 0 ikryssade → summering 0 (noll är ett definit värde, ej utelämnat).
    const belaggningRes = await callGetEvent(request, config, jwt, BELAGGNING_EVENT_ID);
    expect(belaggningRes.status()).toBe(200);
    const belaggning = EventSchema.parse(
      ((await belaggningRes.json()) as { event: unknown }).event,
    );
    expect(belaggning.borOverAntal, 'BELAGGNING: 0 ikryssade Bor över → 0').toBe(0);
  });

  test('bor över-summeringen (AC #1): get-events aggregerar per event i listan (listkortets källa)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await fetchEventsList(request, config, jwt);
    expect(res.status()).toBe(200);
    const events = z.array(EventSchema).parse(((await res.json()) as { events: unknown }).events);

    // get-events är listkortets datakälla (queryKeys.events.list) → borOverAntal
    // MÅSTE aggregeras här, inte bara i get-event. ARBETSKO-eventet bär 1.
    const arbetsko = events.find((e) => e.id === ARBETSKO_EVENT_ID);
    expect(arbetsko, 'ARBETSKO-eventet ska finnas i get-events-listan').toBeDefined();
    expect(arbetsko?.borOverAntal, 'listans ARBETSKO-event: 1 ikryssad Bor över').toBe(
      ARBETSKO_EXPECTED.borOverAntal,
    );

    // Noll-fallet i listan: BELAGGNING-eventet bär 0 (definit, aldrig undefined).
    const belaggning = events.find((e) => e.id === BELAGGNING_EVENT_ID);
    expect(belaggning?.borOverAntal, 'listans BELAGGNING-event: 0 ikryssade Bor över').toBe(0);
  });

  test('okänt ID → 404 + body { error } (mall-kontraktet, ärvt från get-person)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetEvent(request, config, jwt, 'recZZZZZZZZZZZZZZ');

    expect(res.status()).toBe(404);
    const body = (await res.json()) as { error?: unknown };
    expect(typeof body.error).toBe('string');
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await callGetEvent(request, config, undefined, 'recANY');
    await classify401Body(res);
  });

  test('saknat id-param → 400 { error: "Missing id" }', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetEvent(request, config, jwt, undefined);

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: unknown };
    expect(body.error).toBe('Missing id');
  });
});
