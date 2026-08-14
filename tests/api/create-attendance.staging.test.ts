// create-attendance — skarp conformance mot deployad staging-EF (TASK-214.1,
// PRD task-214). create-attendance SKRIVER (POST → ny Deltaganden-rad) —
// dörrens BACKUP-väg för en anmälan utan förskapad rad.
//
// IDEMPOTENT AV DESIGN, INTE SENTINEL+PURGE (avviker medvetet från
// create-event-note/create-registration/create-receipts mönster): S90-
// förarbetet (tasks/sessions/bilagor/s90-checkin-forarbete/skarpt-underlag.md)
// specar ALDRIG create-attendance-EF:en eller dess test — S90 predaterar
// PRD:ns CREATE-backup-idé helt (grep-verifierat: 0 träffar på
// "create-attendance" i den filen). Det här testet är därför byggt från
// grunden, inte kopierat ur ett färdigt facit.
//
// SKÄLET till att sentinel+purge (ADR-060) INTE återanvänds här: Deltaganden
// har INGET fritext-fält bland create-attendance:s allowlistade write-fält
// (Anmälan/Event/Session/Status — samtliga länk/select, aldrig fritext), så
// det finns ingen markör-bärande sträng en purge-policy-target skulle kunna
// exakt-matcha mot utan ett NYTT bas-fält (utanför detta korts mandat). En
// sentinel-Anmälan (create-registration, redan purge-targetad) skulle dessutom
// EFTER purge lämna en Deltaganden-rad vars Anmälan-länk rensas men vars
// Event-länk kvarstår — en TYST ACKUMULERANDE orphan på det event den pekar
// mot, exakt den klass ackumuleringsbugg ADR-060 § Updates 2026-07-06/07-19
// två gånger redan kostat CI-röda (Session 52 + Session 69). Att låta
// Deltagande-raden länka mot en `create-event-sentineler`-targetad event
// (Ort='ZZ-create-event-test') är ÄNNU värre: raden gör "Närvaro (records)"
// icke-tomt på det eventet → purgens linkGuard (purge-staging-sentinels.mjs
// § skyddsräcke 4) trippar permanent → just DEN event-instansen blir aldrig
// purge-bar, en bakväg in i samma ackumuleringsklass.
//
// LÖSNINGEN: create-attendance-EF:en är IDEMPOTENT (se dess filhuvud) — anropar
// man den två gånger med samma (anmalanId, session) returneras samma rad (200,
// created:false) i stället för en dubblett. Testet konsumerar därför EN
// PERMANENT fixtur (CHECKIN_ANMALAN_B_ID, tests/api/fixtures.ts §
// ZZ-Checkin-fixtur — medvetet UTAN Deltagande-rad, "saknad rad"-scenariot)
// i stället för en per-körning-unik sentinel. Ingen rad ackumuleras NÅGONSIN:
// första körningen skapar (201 eller 200 om en tidigare körning redan skapat
// den), varje efterföljande körning återanvänder SAMMA rad (200). Testets
// KÄRNBEVIS är därför explicit: andra anropet MÅSTE vara created:false — det
// är dubblett-skyddet, oavsett CI-historik.
//
// RÄCKEN (PRD task-214 AC #4): asserterar ALDRIG på `Avstämt`, rör ALDRIG
// ZZ-History- eller ZZ-GRANSKNING-*-fixturerna.
//
// Auth via getValidUserJWT. Lokalt skip:as utan creds; skarpa beviset körs i
// CI (STAGING_REQUIRED=1) EFTER att EF:en deployats till staging.

import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { AttendanceSchema } from '../../src/domain/schemas';
import { CHECKIN_ANMALAN_B_ID, CHECKIN_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/create-attendance';

interface CreateBody {
  anmalanId?: string;
  eventId?: string;
  session?: string;
}

function postCreate(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: CreateBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${ENDPOINT}`, { headers, data: body });
}

test.describe('create-attendance — skarp conformance, idempotent (TASK-214.1)', () => {
  test('allow: idempotent create — andra anropet med samma (anmalanId, session) returnerar SAMMA rad (created:false)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const body: CreateBody = {
      anmalanId: CHECKIN_ANMALAN_B_ID,
      eventId: CHECKIN_EVENT_ID,
      session: 'Föreläsning',
    };

    // Första anropet: 201 (ny rad) på en jungfrulig bas, 200 (idempotent) om
    // en TIDIGARE körning redan skapat raden — båda är korrekta, ingen av dem
    // avslöjar en bugg. Kärnbeviset ligger i det ANDRA anropet nedan.
    const first = await postCreate(request, config, jwt, body);
    const firstRaw = await first.text();
    expect([200, 201], firstRaw).toContain(first.status());
    const firstBody = JSON.parse(firstRaw) as {
      record: { id: string; fields: Record<string, unknown> };
      created: boolean;
    };
    expect(firstBody.record.id.startsWith('rec')).toBe(true);

    // Andra anropet: MÅSTE vara idempotent-return — 200, created:false, SAMMA
    // record-ID. Detta är dubblett-skyddet (PRD task-214 § Implementationsbeslut
    // — "en saknad rad kan skapas atomärt", aldrig två för samma anmälan+session).
    const second = await postCreate(request, config, jwt, body);
    const secondRaw = await second.text();
    expect(second.status(), secondRaw).toBe(200);
    const secondBody = JSON.parse(secondRaw) as {
      record: { id: string; fields: Record<string, unknown> };
      created: boolean;
    };
    expect(secondBody.created).toBe(false);
    expect(secondBody.record.id).toBe(firstBody.record.id);

    // SKRIV-BEVIS ur råa record.fields — EF:en satte exakt de fyra allowlistade
    // fälten (aldrig Avstämt, aldrig Person-länken — den ägs av A11).
    expect(secondBody.record.fields['Status']).toBe('Närvarande');
    expect(secondBody.record.fields['Session']).toBe('Föreläsning');
    expect(secondBody.record.fields['Anmälan']).toEqual([CHECKIN_ANMALAN_B_ID]);
    expect(secondBody.record.fields['Event']).toEqual([CHECKIN_EVENT_ID]);

    // LÄSVÄGEN (get-attendance): raden syns via samma väg dörren skulle läsa
    // den, med exakt EN träff — dubblett-skyddet bevisat även genom läsvägen.
    const attendanceRes = await request.get(
      `${config.baseUrl}/functions/v1/get-attendance?eventId=${encodeURIComponent(CHECKIN_EVENT_ID)}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    expect(attendanceRes.status()).toBe(200);
    const attendanceBody = (await attendanceRes.json()) as { attendance: unknown[] };
    const rows = attendanceBody.attendance.map((r) => AttendanceSchema.parse(r));
    const matching = rows.filter((r) => r.anmalanId === CHECKIN_ANMALAN_B_ID);
    expect(
      matching,
      'exakt en Deltagande-rad för CHECKIN_ANMALAN_B_ID — inga dubbletter',
    ).toHaveLength(1);
    expect(matching[0]?.id).toBe(firstBody.record.id);
    expect(matching[0]?.status).toBe('Närvarande');
  });

  test('deny: ogiltig anmalanId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      anmalanId: 'inteEttRecordId',
      eventId: CHECKIN_EVENT_ID,
      session: 'Föreläsning',
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/anmalanId/i);
  });

  test('deny: ogiltig eventId-form → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      anmalanId: CHECKIN_ANMALAN_B_ID,
      eventId: 'inteEttRecordId',
      session: 'Föreläsning',
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/eventId/i);
  });

  test('deny: ogiltigt session-värde → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      anmalanId: CHECKIN_ANMALAN_B_ID,
      eventId: CHECKIN_EVENT_ID,
      session: 'Måndag',
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/session/i);
  });

  test('okänd anmälan (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      anmalanId: 'recZZZZZZZZZZZZZZ',
      eventId: CHECKIN_EVENT_ID,
      session: 'Föreläsning',
    });
    expect(res.status()).toBe(404);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/[Rr]egistration/);
  });

  test('okänt event (rec-format men finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      anmalanId: CHECKIN_ANMALAN_B_ID,
      eventId: 'recZZZZZZZZZZZZZZ',
      session: 'Föreläsning',
    });
    expect(res.status()).toBe(404);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { anmalanId: 'recANY', eventId: 'recANY', session: 'Föreläsning' },
    });
    await classify401Body(res);
  });

  test('CORS preflight: tillåten origin → 200 + Access-Control-Allow-Origin speglar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const res = await request.fetch(`${config.baseUrl}${ENDPOINT}`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
