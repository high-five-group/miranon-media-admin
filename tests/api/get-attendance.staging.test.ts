// get-attendance — skarp conformance mot deployad staging-EF (Fas 6b L3).
//
// get-attendance LÄSER bara (ingen write → ingen mutation/restore). Bevisar tre
// saker mot SKARP staging-data:
//   1. eventId-filter-mallen (ärvd från get-registrations) returnerar rätt events
//      Deltaganden, AttendanceSchema-parse passerar (sessioner/status syns).
//   2. NAMN-BERIKNINGEN end-to-end: personNamn är LÄSBART (Personer.Namn, ej ett
//      record-ID) — det vyn behöver (Gunilla-princip). Deltaganden bär bara
//      person-record-ID:n; namn-batchen mot Personer måste ha löst dem.
//   3. Tomt/okänt event → tom lista (ej fel) — kommande-event utan deltaganden är
//      ett förväntat tillstånd, inte ett fel.
//
// INGEN ny fixtur seedas: ett RIKTIGT event-ID med deltaganden härleds dynamiskt
// ur den PERMANENTA ZZ-History-fixturen (Person 01 + 3 Deltaganden, Session 23 L5b)
// — robustare än ett hårdkodat staging-event-ID (duplicerad bas, ADR-050) och
// binder beviset till ett känt namn. Staging-secret ATTENDANCE_NAME_BATCH_SIZE=2
// gör att namn-batchens chunk-merge-väg tas så snart ett event har >2 unika
// personer (mekanismen speglar get-person:s redan bevisade chunk-merge).
//
// Auth via getValidUserJWT → password-grant (samma mönster som get-event/get-person).
// Lokalt skip:as utan TEST_USER-creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).

import { type APIRequestContext, expect, test } from '@playwright/test';
import { z } from 'zod';
import { AttendanceSchema, EventSchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

// Permanent ZZ-History-fixtur (Session 23 L5b) — Person 01 har 3 Deltaganden
// (Status='Närvarande') på 3 syntetiska RIM-event. Bindningspunkt för conformance.
const HISTORY_PERSON_NAME = 'ZZ-History Person 01';

// Airtable record-ID-form: 'rec' + 14 alfanumeriska. personNamn får ALDRIG se ut
// så — då hade namn-batchen läckt ett ID i stället för ett läsbart namn.
const RECORD_ID_RE = /^rec[A-Za-z0-9]{14}$/;

async function callGetAttendance(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  eventId: string | undefined,
) {
  const query = eventId === undefined ? '' : `?eventId=${encodeURIComponent(eventId)}`;
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.get(`${config.baseUrl}/functions/v1/get-attendance${query}`, { headers });
}

/** Härled ett riktigt event som har ZZ-History-deltagande (ingen seedad fixtur). */
async function findHistoryAttendanceEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<{ eventId: string; rows: z.infer<typeof AttendanceSchema>[] }> {
  const res = await request.get(`${config.baseUrl}/functions/v1/get-events`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.status()).toBe(200);
  const events = z.array(EventSchema).parse(((await res.json()) as { events: unknown }).events);
  expect(events.length, 'staging-basen måste ha minst ETT event').toBeGreaterThan(0);

  for (const ev of events) {
    const ar = await callGetAttendance(request, config, jwt, ev.id);
    expect(ar.status()).toBe(200);
    // Skarp validering: varje events Deltaganden-lista måste parse:a (shape-kontrakt).
    const rows = z
      .array(AttendanceSchema)
      .parse(((await ar.json()) as { attendance: unknown }).attendance);
    if (rows.some((r) => r.personNamn === HISTORY_PERSON_NAME)) {
      return { eventId: ev.id, rows };
    }
  }
  throw new Error(
    'Hittade inget staging-event med ZZ-History-deltagande — fixturen (Person 01 + 3 Deltaganden) saknas?',
  );
}

test.describe('get-attendance — skarp conformance (Fas 6b L3)', () => {
  test('event med deltaganden → 200 + AttendanceSchema-valid, sessioner/status syns', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { eventId, rows } = await findHistoryAttendanceEvent(request, config, jwt);

    const personRow = rows.find((r) => r.personNamn === HISTORY_PERSON_NAME);
    expect(personRow, 'ZZ-History-personens närvaro-rad ska finnas på eventet').toBeTruthy();
    // Sessioner/status syns och är enum-giltiga (parse skulle annars failat redan).
    expect(['Dag 1', 'Dag 2', 'Föreläsning']).toContain(personRow?.session);
    expect(personRow?.status).toBe('Närvarande'); // ZZ-fixturen är avstämd närvaro
    // Raden binder till rätt event (eventId-filtret träffade rätt).
    expect(personRow?.eventId).toBe(eventId);
    // personId är ett record-ID (länken finns); personNamn är det LÄSBARA namnet.
    expect(personRow?.personId, 'Person-länken ska bära ett record-ID').toMatch(RECORD_ID_RE);
  });

  test('NAMN-BERIKNING end-to-end: personNamn är LÄSBART, aldrig ett record-ID', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { rows } = await findHistoryAttendanceEvent(request, config, jwt);

    // KÄRNBEVISET (Gunilla-princip): för varje rad med en person-länk måste
    // namn-batchen ha löst ett LÄSBART namn — aldrig ett rått 'rec…'-ID. Detta är
    // vad info-/närvaro-vyn visar; läcker ett ID hit ser Lotta "recXX…" i UI:t.
    const named = rows.filter((r) => r.personId !== null);
    expect(named.length, 'minst en rad ska ha en person-länk att berika').toBeGreaterThan(0);
    for (const r of named) {
      expect(r.personNamn, `personNamn för ${r.id} ska vara satt`).toBeTruthy();
      expect(r.personNamn ?? '').not.toMatch(RECORD_ID_RE);
    }
    // Den kända fixtur-personen bevisar exakt namn-värdet (ej bara "någon sträng").
    expect(rows.map((r) => r.personNamn)).toContain(HISTORY_PERSON_NAME);
  });

  test('okänt event → tom lista (ej fel) — kommande-event utan deltaganden är förväntat', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetAttendance(request, config, jwt, 'recZZZZZZZZZZZZZZ');

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { attendance: unknown };
    const rows = z.array(AttendanceSchema).parse(body.attendance);
    expect(rows).toEqual([]); // tom lista, ALDRIG 404/500/fel
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await callGetAttendance(request, config, undefined, 'recANY');
    await classify401Body(res);
  });
});
