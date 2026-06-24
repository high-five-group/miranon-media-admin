// get-leads — skarp conformance mot deployad staging-EF (Fas 6e L1, Intresserade).
//
// get-leads är en GLOBAL läs-lista över INTRESSERADE = personer som är leads:
// hämtat något ({Antal hämtningar} = COUNTA(Engagemang) > 0) men aldrig anmält
// sig ({Antal anmälningar (totalt)} = 0). Läsning 2 (Marcus-låst). KONSTANT
// filterByFormula (ingen sök, inget länk-ID-filter → ingen T15). Server-cursor
// (ADR-056) via samma fetchAirtablePage-port som get-persons.
//
// Bevisar mot SKARP staging-data (permanenta ZZ-Lead-fixturer, ADR-050-bas):
//   1. LEAD-FILTER: båda seedade ZZ-Lead-personerna INKLUDERAS; varje rad
//      uppfyller filter-invarianten (antalHamtningar > 0 ∧ antalAnmalningar = 0);
//      de befintliga ZZ-Conformance-personerna (0 hämtningar) EXKLUDERAS
//      (identitets-baserat: inget "ZZ-Conformance"-namn i set:et).
//   2. ROSTER-KONTRAKT: leads-rollups mappas — antalHamtningar ≥ 1 (scalar number),
//      allaHamtningar är array (FLER-VÄRT; tom för en lead utan Touchpoints).
//   3. CURSOR (ADR-056): pageSize=1 → sida 1 returnerar EXAKT 1 (ej full-walk) med
//      opak non-null nextCursor; walk till null-terminering ackumulerar HELA
//      lead-set:et (ordnings-agnostiskt — båda fixturer saknar interaktionsdatum).
//   4/5. auth 401 utan token; CORS speglar tillåten origin.
//
// Auth via getValidUserJWT → persisterad api-token-artefakt (T24-b). Lokalt
// skip:as utan staging-creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).
//
// FIXTUR (PERMANENT i staging-Personer, samma klass som ZZ-Conformance-personerna
// — RÖR EJ; vardera + en länkad Engagemang så COUNTA(Engagemang)=1, 0 Anmälningar):
//   zz-lead-person-01@staging.test  (rec…Kavd · Engagemang rec…ZlL2)
//   zz-lead-person-02@staging.test  (rec…r0Cd · Engagemang rec…VJ0)

import { type APIRequestContext, expect, test } from '@playwright/test';
import { z } from 'zod';
import { IntresseradSchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

type Intresserad = z.infer<typeof IntresseradSchema>;

const LEAD_01_EMAIL = 'zz-lead-person-01@staging.test';
const LEAD_02_EMAIL = 'zz-lead-person-02@staging.test';
const ALLOWED_ORIGIN = 'http://localhost:5173'; // per CORS_ALLOWED_ORIGINS i staging

async function fetchLeads(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  opts: { origin?: string; cursor?: string; pageSize?: number } = {},
): Promise<{
  status: number;
  intresserade: Intresserad[];
  nextCursor: string | null;
  headers: Record<string, string>;
}> {
  const headers: Record<string, string> = { Authorization: `Bearer ${jwt}` };
  if (opts.origin) headers.Origin = opts.origin;
  const params = new URLSearchParams();
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.pageSize) params.set('pageSize', String(opts.pageSize));
  const qs = params.toString();
  const res = await request.get(`${config.baseUrl}/functions/v1/get-leads${qs ? `?${qs}` : ''}`, {
    headers,
  });
  if (res.status() !== 200) {
    return { status: res.status(), intresserade: [], nextCursor: null, headers: res.headers() };
  }
  const body = (await res.json()) as { intresserade: unknown; nextCursor: string | null };
  const intresserade = z.array(IntresseradSchema).parse(body.intresserade);
  return { status: 200, intresserade, nextCursor: body.nextCursor, headers: res.headers() };
}

test.describe('get-leads — skarp conformance (Fas 6e, Intresserade)', () => {
  test('lead-filter: seedade leads inkluderade, invariant håller, ZZ-Conformance exkluderad', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, intresserade } = await fetchLeads(request, config, jwt);
    expect(status).toBe(200);

    const emails = new Set(intresserade.map((i) => i.email));
    expect(emails.has(LEAD_01_EMAIL), 'seedad lead 01 ska finnas').toBe(true);
    expect(emails.has(LEAD_02_EMAIL), 'seedad lead 02 ska finnas').toBe(true);

    // Filter-invariant: VARJE returnerad rad är ett lead per definitionen.
    for (const i of intresserade) {
      expect(i.antalHamtningar, `${i.email}: hämtat något (>0)`).toBeGreaterThan(0);
      expect(i.antalAnmalningar, `${i.email}: noll anmälningar totalt`).toBe(0);
    }

    // Exkludering identitets-baserad: ZZ-Conformance-personerna (0 hämtningar)
    // ska INTE läcka in i lead-set:et.
    const namn = intresserade.map((i) => i.namn ?? '');
    expect(
      namn.some((n) => n.includes('ZZ-Conformance')),
      'ZZ-Conformance-personer (0 hämtningar) ska EXKLUDERAS',
    ).toBe(false);
  });

  test('roster-kontrakt: leads-rollups mappas (antalHamtningar scalar, allaHamtningar array)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, intresserade } = await fetchLeads(request, config, jwt);
    expect(status).toBe(200);

    const lead = intresserade.find((i) => i.email === LEAD_01_EMAIL);
    expect(lead, 'seedad lead 01 finns').toBeTruthy();
    expect(typeof lead?.antalHamtningar, 'antalHamtningar är number').toBe('number');
    expect(
      lead?.antalHamtningar,
      'antalHamtningar ≥ 1 (en länkad Engagemang)',
    ).toBeGreaterThanOrEqual(1);
    // FLER-VÄRT rollup → array (aldrig firstString); tom för lead utan Touchpoints.
    expect(Array.isArray(lead?.allaHamtningar), 'allaHamtningar är array').toBe(true);
    expect(lead?.namn, 'namn present (Namn-formel)').toBeTruthy();
  });

  test('cursor (ADR-056): pageSize=1 paginerar äkta och null-terminerar över hela set:et', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // Sida 1: EXAKT 1 rad (ej full-walk-then-slice) + opak non-null fortsättning.
    const page1 = await fetchLeads(request, config, jwt, { pageSize: 1 });
    expect(page1.status).toBe(200);
    expect(page1.intresserade.length, 'sida 1 returnerar exakt pageSize=1').toBe(1);
    expect(
      typeof page1.nextCursor,
      'nextCursor är opak sträng (ej null) när fler sidor finns',
    ).toBe('string');

    // Walk till null-terminering; ackumulera HELA set:et (ordnings-agnostiskt).
    const seen = new Set<string>();
    for (const i of page1.intresserade) seen.add(i.email ?? '');
    let cursor = page1.nextCursor;
    let pages = 1;
    while (cursor) {
      const next = await fetchLeads(request, config, jwt, { pageSize: 1, cursor });
      expect(next.status).toBe(200);
      expect(
        next.intresserade.length,
        `sida ${pages + 1} returnerar ≤ pageSize`,
      ).toBeLessThanOrEqual(1);
      for (const i of next.intresserade) seen.add(i.email ?? '');
      cursor = next.nextCursor;
      pages += 1;
      if (pages > 10) throw new Error('cursor terminerade inte (säkerhetstak)');
    }

    // Hela det kända lead-set:et ackumulerat, sista sidan nextCursor === null.
    expect(seen.has(LEAD_01_EMAIL), 'lead 01 ackumulerad över walk').toBe(true);
    expect(seen.has(LEAD_02_EMAIL), 'lead 02 ackumulerad över walk').toBe(true);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.get(`${config.baseUrl}/functions/v1/get-leads`);
    await classify401Body(res);
  });

  test('CORS: tillåten origin speglas i Access-Control-Allow-Origin', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, headers } = await fetchLeads(request, config, jwt, { origin: ALLOWED_ORIGIN });
    expect(status).toBe(200);
    expect(headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });
});
