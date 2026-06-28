// send-email — nyckel-OBEROENDE HTTP-kontrakt mot deployad staging-EF (Fas 6h L2c, ADR-067).
//
// Bevisar mot den DEPLOYADE send-email-EF:en de kontraktspunkter som varken kräver en
// Resend-nyckel (läge 1: ingen nyckel) eller skriver till Utskickslogg (negativ + gate-
// vägran skriver inget): säkerhets-kontraktet (401/405) + input-grindar (400) + att den
// extraherade segment-resolutionen (COMMIT 1) är LEVANDE i send-emails deploy-kontext
// (400 SegmentNotResolvable mot ett okänt segment-id → resolution kördes, fann ingen
// giltig app-regel, kastade — utan att skriva något).
//
// L2d VERIFIERAT LIVE (Session 40) — mot M2-provisionerad staging (RESEND_API_KEY + RESEND_FROM)
// via en EFEMÄR seedad fixtur (Personer + Deltaganden + Segment i ett TOMT kurs×modalitet-par,
// L209), körd som kontrollerade HTTP-anrop + Airtable-introspektion, EJ som committade CI-tester
// (api-staging-runnern saknar Airtable-seed-kapabilitet → fixturen kan inte self-seedas/teardownas
// här; fixturen raderades efter verifieringen, basen är leverabel). Belagt i sessionsdok-40 Del 2:
//   - happy-path: HTTP 200 status 'sent', requested=2 accepted=2 (segment→delivered@/bounced@resend.dev),
//     riktig Utskickslogg-merge (0→1 rad, 5 fält + Idempotensnyckel=jobId, Skickat till=2 person-ID).
//   - idempotens-rerun (samma jobId): radantal OFÖRÄNDRAT, samma logRecordId (app-merge); Resend
//     24h-idempotens via deterministisk <jobId>/b<index>-nyckel.
//   - 503 ResendNotConfigured: OMVÄNT bevisad död i happy-path (200, ej 503, med nyckel satt).
//   - GATE-LIVENESS 422: segment→blocked@example.com → 422 non_prod_address_refused, noll send, 0 rader.
// Den committade regressionsgrinden för svar-parsningen är api-pure tests/api/resend-batch.test.ts (L208).
//
// Auth via getValidUserJWT (T24-b). Lokalt skip:as utan staging-creds; skarpt i CI.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = 'send-email';
// Giltig UUID v4 (jobId) — passerar UUID-grinden så senare grindar kan nås.
const VALID_JOB_ID = '22222222-2222-4222-8222-222222222222';
// Syntetiskt okänt segment-id (finns ej i Segment) → SegmentNotResolvable (400). Skriver inget.
const UNKNOWN_SEGMENT_ID = 'recZZZZZZZZZZZZZZ';

function post(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | null,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const h: Record<string, string> = { ...headers };
  if (jwt) h.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}/functions/v1/${ENDPOINT}`, { headers: h, data: body });
}

test.describe('send-email — nyckel-oberoende HTTP-kontrakt (Fas 6h L2c)', () => {
  test('AUTH: 401 utan token', async ({ request }) => {
    const config = getApiConfig();
    const res = await post(request, config, null, {
      segmentIds: ['recX'],
      amne: 'x',
      mailtext: 'y',
      idempotencyKey: VALID_JOB_ID,
    });
    await classify401Body(res);
  });

  test('METOD: 405 på GET', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(`${config.baseUrl}/functions/v1/${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });

  test('INPUT: 400 på ogiltig UUID jobId', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await post(request, config, jwt, {
      segmentIds: ['recX'],
      amne: 'Ämne',
      mailtext: 'Brödtext',
      idempotencyKey: 'inte-en-uuid',
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain('UUID');
  });

  test('INPUT: 400 på tom segmentIds', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await post(request, config, jwt, {
      segmentIds: [],
      amne: 'Ämne',
      mailtext: 'Brödtext',
      idempotencyKey: VALID_JOB_ID,
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain('segmentIds');
  });

  test('RESOLUTION LIVE: 400 SegmentNotResolvable på okänt segment (cross-check COMMIT 1, skriver inget)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await post(request, config, jwt, {
      segmentIds: [UNKNOWN_SEGMENT_ID],
      amne: 'Ämne',
      mailtext: 'Brödtext',
      idempotencyKey: VALID_JOB_ID,
    });
    // Den extraherade segment-resolutionen kördes i send-emails deploy-kontext, läste
    // Segment-tabellen, fann ingen giltig app-regel för id:t → distinkt 400 (ingen
    // Resend-nyckel behövd, ingen Utskickslogg-rad skriven).
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain('app-regel');
  });
});
