// get-leads — skarp conformance mot deployad staging-EF (Fas 6e L1, Intresserade).
//
// get-leads är en GLOBAL läs-lista över INTRESSERADE = personer som är leads:
// hämtat något ({Totalt antal hämtningar (erbjudande)} > 0, en ROLLUP över
// Touchpoints) men aldrig anmält sig ({Antal anmälningar (totalt)} = 0).
// Läsning 2 (Marcus-låst). KONSTANT filterByFormula (ingen sök, inget
// länk-ID-filter → ingen T15). Server-cursor (ADR-056) via samma
// fetchAirtablePage-port som get-persons.
//
// TASK-277 AC #6 pekade LEAD_FILTER om från `{Antal hämtningar}`
// (COUNTA(Engagemang), fälla 47) till rollupen ovan — se get-leads/index.ts.
// TASK-278 pekade i samma steg om visningsfältet `antalHamtningar` (nedan,
// test 2) till SAMMA rollup, så en rad aldrig kan visa 0 hämtningar för en
// person filtret redan avgjort HAR hämtat något.
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
//   3b. TASK-350: SAMMA walk, men körd via produktionsalgoritmen
//      (`samlaCursorSidor`, `AirtableAdapter.fetchIntresserade`s riktiga
//      sidvandringslogik) i stället för en hand-rullad loop — se testets
//      egen kommentar för varför adaptern själv inte kan köras här.
//   4/5. auth 401 utan token; CORS speglar tillåten origin.
//
// Auth via getValidUserJWT → persisterad api-token-artefakt (T24-b). Lokalt
// skip:as utan staging-creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).
//
// FIXTUR (PERMANENT i staging-Personer, samma klass som ZZ-Conformance-personerna
// — RÖR EJ; vardera + en länkad Engagemang så COUNTA(Engagemang)=1, 0 Anmälningar):
//   zz-lead-person-01@staging.test  (rec…Kavd · Engagemang rec…ZlL2)
//   zz-lead-person-02@staging.test  (rec…r0Cd · Engagemang rec…VJ0)
//
// ⚠️ DEPLOY-LANDMINA (upptäckt TASK-277, EJ ÅTGÄRDAD HÄR — läs innan denna
// EF deployas till staging): `LEAD_FILTER` (`get-leads/index.ts`) pekades om
// i TASK-277 AC #6 från `{Antal hämtningar}` till `{Totalt antal hämtningar
// (erbjudande)}` (en ROLLUP över `Touchpoints`, inte `Engagemang`). Mätt
// 2026-08-19 (Airtable-MCP, staging `apphjj8Q7lkXCMsL4`, READ-only): BÅDA
// fixturerna ovan har `Totalt antal hämtningar (erbjudande) = 0` — de bär en
// länkad `Engagemang`-rad men INGEN matchande `Touchpoints`-rad. Deployas
// den nya `LEAD_FILTER`-koden UTAN att fixturerna FÖRST får varsin
// `Touchpoints`-rad (med `Erbjudande` satt, länkad till respektive person),
// exkluderas BÅDA fixturerna av det nya filtret och test 1–3 nedan fäller
// (`emails.has(...)` blir false, `lead`-uppslaget blir `undefined`,
// cursor-walken hittar aldrig e-postadresserna). Detta ÄR alltså inte en kod-
// bugg i denna svit — det är en fixtur/kod-synk som måste lösas FÖRE deploy.
// Ingen backfill/basformelsändring gjordes i TASK-277 (uttryckligen utanför
// omfattningen) — detta är bokfört som öppen skuld, inte löst.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { z } from 'zod';
import { samlaCursorSidor } from '../../src/data/adapters/cursorWalk';
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
      'antalHamtningar ≥ 1 (Totalt antal hämtningar (erbjudande), TASK-278)',
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

  // TASK-350 — PRODUKTIONSALGORITMEN (`samlaCursorSidor`, den `AirtableAdapter.
  // fetchIntresserade` faktiskt kör), inte en hand-rullad kopia som testet
  // ovan, mot den VERKLIGA deployade EF:en. `AirtableAdapter` självt kan inte
  // köras här (dess `callEdgeFunction` kräver en levande webbläsar-session
  // via `supabase.auth.getSession()`, se `cursorWalk.ts`s filhuvud) — denna
  // test återanvänder därför samma rå-HTTP-hämtare (`fetchLeads`) som resten
  // av filen, trådad genom den delade, testade sidvandringslogiken.
  //
  // ⚠️ ENDA KÄNDA STAGING-LEADS ÄR DE TVÅ FIXTURERNA OVAN (2, inte >50) — se
  // TASK-350-kortets AC #1-not: den mätta klassen ("fler än en sida, >50
  // poster") bevisas mot MOCKAD data i `tests/api/cursor-walk.test.ts` §2;
  // detta test bevisar i stället att SAMMA algoritm null-terminerar och
  // ackumulerar KORREKT mot den skarpa, deployade EF:en — `pageSize=1` tvingar
  // fram en äkta två-sidig walk trots att bara 2 leads finns idag.
  test('samlaCursorSidor mot verklig staging: ackumulerar hela (idag: 2) lead-set:et', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const alla = await samlaCursorSidor<Intresserad>(async (cursor) => {
      const sida = await fetchLeads(request, config, jwt, { pageSize: 1, cursor });
      expect(sida.status).toBe(200);
      return { poster: sida.intresserade, nextCursor: sida.nextCursor };
    });

    const emails = new Set(alla.map((i) => i.email));
    expect(emails.has(LEAD_01_EMAIL), 'lead 01 ackumulerad via samlaCursorSidor').toBe(true);
    expect(emails.has(LEAD_02_EMAIL), 'lead 02 ackumulerad via samlaCursorSidor').toBe(true);
    expect(alla.length, 'minst de två kända fixturerna, ingen klampning').toBeGreaterThanOrEqual(2);
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
