// compute-segment — skarp conformance mot deployad staging-EF (Fas 6g L1, ADR-064).
//
// compute-segment beräknar segment-MEDLEMSKAP från KÄLLAN (Deltaganden, strikt
// Närvaropoäng=1) givet en regel { include: Par[], exclude: Par[] } över
// taxonomin (kurs × modalitet). POST-LÄS-only (regeln ryms ej i query-params).
//
// Bevisar mot BEFINTLIG staging-data (ingen seed — Session 36 läges-bedömning:
// staging-Deltaganden = RIM 1/2/3 (Utbildning), en person; Psionautics saknas):
//   - HIT:  include[(RIM 1, Utbildning)]   → count ≥ 1, varje member har namn/email + boolean consent.
//   - MISS: include[(Psionautics, Utbildning)] → count 0, members [] (tomt segment = korrekt utdata).
//   - AUTH: 401 utan token.
// (malformed-rule → 400 bevisas i api-pure via parseSegmentRule — ingen deploy krävs.)
//
// Auth via getValidUserJWT → persisterad api-token-artefakt (T24-b). Lokalt
// skip:as utan staging-creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) mot
// en deployad compute-segment-EF.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { SegmentResultSchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

type Modalitet = 'Utbildning' | 'Föreläsning';
type Par = { kurs: string; modalitet: Modalitet };
type SegmentRule = { include: Par[]; exclude: Par[] };

const RIM1: Par = { kurs: 'Resor i medvetandet 1', modalitet: 'Utbildning' };
const PSIONAUTICS: Par = { kurs: 'Psionautics', modalitet: 'Utbildning' };

async function postSegment(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | null,
  rule: SegmentRule,
) {
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}/functions/v1/compute-segment`, { headers, data: rule });
}

test.describe('compute-segment — skarp conformance (Fas 6g L1)', () => {
  test('HIT: include[(RIM 1, Utbildning)] → icke-tomt segment, members berikade', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postSegment(request, config, jwt, { include: [RIM1], exclude: [] });
    expect(res.status()).toBe(200);

    const { members, count } = SegmentResultSchema.parse(await res.json());
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBe(members.length);

    // Strukturell assertion (ingen identitets-hårdkodning): varje member berikad.
    for (const m of members) {
      expect(typeof m.id, 'member.id är record-ID-sträng').toBe('string');
      expect(m.namn, `${m.id}: namn present (Personer.Namn-formel)`).toBeTruthy();
      expect(m.email, `${m.id}: email present`).toBeTruthy();
      expect(typeof m.ejGodkandMail, 'consent bärs som boolean (ej filtrerat)').toBe('boolean');
    }
  });

  test('MISS: include[(Psionautics, Utbildning)] → tomt segment (0 genomförd närvaro)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postSegment(request, config, jwt, { include: [PSIONAUTICS], exclude: [] });
    expect(res.status()).toBe(200);

    const { members, count } = SegmentResultSchema.parse(await res.json());
    expect(count).toBe(0);
    expect(members).toEqual([]); // tomt = korrekt utdata (ADR-064)
  });

  test('AUTH: 401 utan token', async ({ request }) => {
    const config = getApiConfig();
    const res = await postSegment(request, config, null, { include: [RIM1], exclude: [] });
    await classify401Body(res);
  });
});
