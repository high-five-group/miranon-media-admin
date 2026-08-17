// compute-segment — skarp conformance mot deployad staging-EF (Fas 6g L1, ADR-064;
// AND/DNF + via ADR-115, TASK-249.2).
//
// compute-segment beräknar segment-MEDLEMSKAP från KÄLLAN (Deltaganden, strikt
// Närvaropoäng=1) givet en regel { include: MedVillkor[], exclude: Par[] } över
// taxonomin (kurs × modalitet). `include` är DNF: varje villkor är ett enkelt
// par (ren OR) ELLER en Konjunkt-grupp (Par[], AND) — ADR-115. POST-LÄS-only
// (regeln ryms ej i query-params).
//
// Bevisar mot BEFINTLIG staging-data (ingen seed — live-verifierat 2026-08-17
// vid TASK-249.2-bygget: staging-Deltaganden bär minst TVÅ personer med
// RIM 1/2 (Utbildning), varav en även RIM 3; Psionautics saknas helt):
//   - HIT:  include[(RIM 1, Utbildning)]   → count ≥ 1, varje member har namn/email + boolean consent + via.
//   - MISS: include[(Psionautics, Utbildning)] → count 0, members [] (tomt segment = korrekt utdata).
//   - AUTH: 401 utan token.
//   - AND/DNF: en Konjunkt-grupp (AND) SNÄVAR populationen strukturellt jämfört
//     med samma par som platt OR — bevisar att servern verkligen konjungerar,
//     inte bara accepterar formen och behandlar den som OR (ADR-115 EF-krav 4).
//   - via: Par[] per medlem — varje AND-grupp-medlems `via` bär ALLA gruppens
//     par (ADR-115 EF-krav 1).
// (malformed-rule → 400 bevisas i api-pure via parseSegmentRule — ingen deploy krävs.)
//
// INGEN identitets-hårdkodning (namn/count-exakthet) i AND/DNF-testerna nedan —
// samma disciplin som HIT/MISS ovan; staging-populationen kan växa. Proven är
// STRUKTURELLA/MONOTONA (en extra AND-konjunkt kan bara snäva eller bibehålla
// mängden, aldrig utöka den) i stället för hårdkodade tal.
//
// Auth via getValidUserJWT → persisterad api-token-artefakt (T24-b). Lokalt
// skip:as utan staging-creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) mot
// en deployad compute-segment-EF (deployad manuellt, ADR-050 — CI har inget
// deploy-steg).

import { type APIRequestContext, expect, test } from '@playwright/test';
import { SegmentResultSchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

type Modalitet = 'Utbildning' | 'Föreläsning';
type Par = { kurs: string; modalitet: Modalitet };
/** EN AND-grupp (ADR-115) — samma form som `Konjunkt` i segment-membership.ts. */
type Konjunkt = Par[];
type MedVillkor = Par | Konjunkt;
type SegmentRule = { include: MedVillkor[]; exclude: Par[] };

const RIM1: Par = { kurs: 'Resor i medvetandet 1', modalitet: 'Utbildning' };
const RIM2: Par = { kurs: 'Resor i medvetandet 2', modalitet: 'Utbildning' };
const RIM3: Par = { kurs: 'Resor i medvetandet 3', modalitet: 'Utbildning' };
const PSIONAUTICS: Par = { kurs: 'Psionautics', modalitet: 'Utbildning' };
const parKey = (p: Par) => `${p.kurs}|${p.modalitet}`;

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

    // Rå JSON capturas EN gång — SegmentResultSchema (client-sidans Zod) stripper
    // okända fält (default z.object-beteende) och skulle tyst dölja `via` om vi
    // bara körde .parse(); via-fältet är ADR-115 EF-krav 1 och bevisas mot RÅTT
    // svar, inte mot ett schema som ännu inte känner till det (klientsidan är
    // utanför TASK-249.2:s scope, se ADR-100-domäntabellen).
    const raw = await res.json();
    const { members, count } = SegmentResultSchema.parse(raw);
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBe(members.length);

    // Strukturell assertion (ingen identitets-hårdkodning): varje member berikad.
    // namn present BEVISAR att Personer-batchen körde (annars vore namn null).
    // email + ejGodkandMail är NULLABLE/optional per kontraktet (ADR-064): en
    // person utan E-post ger email=null, saknad consent-checkbox ger false —
    // INTE EF-fel. (Staging-fixturen "ZZ-History Person 01" saknar E-post →
    // email=null; live-verifierat 2026-06-26. Att kräva icke-tom email vore en
    // fixtur-egenskap, ej ett kontrakts-krav.)
    for (const m of members) {
      expect(typeof m.id, 'member.id är record-ID-sträng').toBe('string');
      expect(m.namn, `${m.id}: namn present (Personer.Namn-formel → batch körde)`).toBeTruthy();
      expect(
        m.email === null || (typeof m.email === 'string' && m.email.length > 0),
        `${m.id}: email är ifylld sträng eller null (nullable)`,
      ).toBe(true);
      expect(typeof m.ejGodkandMail, 'consent bärs som boolean (ej filtrerat)').toBe('boolean');
    }

    // via: Par[] per medlem (ADR-115 EF-krav 1) — bevisat mot RÅ JSON. Varje
    // medlem kvalificerade via include[(RIM1)], så via MÅSTE innehålla RIM1,
    // och (strukturellt) endast bestå av giltiga par-objekt.
    const rawMembers = (raw as { members: Array<{ id: string; via: unknown }> }).members;
    expect(rawMembers.length).toBe(count);
    for (const m of rawMembers) {
      expect(Array.isArray(m.via), `${m.id}: via är en array`).toBe(true);
      const via = m.via as Par[];
      expect(
        via.length,
        `${m.id}: via är icke-tom (personen kvalificerade ju)`,
      ).toBeGreaterThanOrEqual(1);
      for (const p of via) {
        expect(typeof p.kurs).toBe('string');
        expect(['Utbildning', 'Föreläsning']).toContain(p.modalitet);
      }
      expect(
        via.some((p) => parKey(p) === parKey(RIM1)),
        `${m.id}: via innehåller det matchande paret RIM1`,
      ).toBe(true);
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

// ============================================================================
// AND/DNF-primitiven — SKARP conformance mot deployad staging-EF (ADR-115
// EF-krav 4, TASK-249.2 AC#3). Motorn utvärderar Konjunkt-grupper server-side
// i ETT anrop — det finns ingen klient-side-genväg (multipla compute-segment-
// anrop + snitt i webbläsaren) kvar att bevisa mot, det ÄR poängen.
// ============================================================================

test.describe('compute-segment — AND/DNF (ADR-115 EF-krav 1, 3, 4)', () => {
  test('AND-grupp SNÄVAR strukturellt: [[RIM1,RIM2,RIM3]] ⊆ [[RIM1,RIM2]] ⊆ platt-OR[RIM1,RIM2,RIM3] (räknemässigt och per medlem)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const [orRes, and2Res, and3Res] = await Promise.all([
      postSegment(request, config, jwt, { include: [RIM1, RIM2, RIM3], exclude: [] }),
      postSegment(request, config, jwt, { include: [[RIM1, RIM2]], exclude: [] }),
      postSegment(request, config, jwt, { include: [[RIM1, RIM2, RIM3]], exclude: [] }),
    ]);
    for (const res of [orRes, and2Res, and3Res]) expect(res.status()).toBe(200);

    const or = SegmentResultSchema.parse(await orRes.json());
    const and2 = SegmentResultSchema.parse(await and2Res.json());
    const and3 = SegmentResultSchema.parse(await and3Res.json());

    // Monotoni: varje extra AND-konjunkt kan bara snäva eller bibehålla mängden,
    // ALDRIG utöka den (en person som klarar 3 villkor klarade redan 2).
    expect(and3.count, 'AND[RIM1,RIM2,RIM3] ≤ AND[RIM1,RIM2]').toBeLessThanOrEqual(and2.count);
    expect(and2.count, 'AND[RIM1,RIM2] ≤ OR[RIM1,RIM2,RIM3]').toBeLessThanOrEqual(or.count);

    // Delmängds-bevis (id-nivå, ej bara räknat): varje AND-träff finns i OR-
    // träffmängden, och varje 3-AND-träff finns i 2-AND-träffmängden.
    const orIds = new Set(or.members.map((m) => m.id));
    const and2Ids = new Set(and2.members.map((m) => m.id));
    for (const m of and2.members) {
      expect(orIds.has(m.id), `${m.id}: 2-AND-träff måste finnas i OR-träffmängden`).toBe(true);
    }
    for (const m of and3.members) {
      expect(and2Ids.has(m.id), `${m.id}: 3-AND-träff måste finnas i 2-AND-träffmängden`).toBe(
        true,
      );
    }

    // Kärnbeviset (ADR-115 EF-krav 4): servern KONJUNGERAR verkligen — den
    // behandlar inte gruppen som OR. Varje 3-AND-medlems `via` bär SAMTLIGA tre
    // par (annars hade personen kvalificerat utan att uppfylla hela gruppen).
    const rawAnd3 = (await (
      await postSegment(request, config, jwt, { include: [[RIM1, RIM2, RIM3]], exclude: [] })
    ).json()) as { members: Array<{ id: string; via: Par[] }> };
    for (const m of rawAnd3.members) {
      const keys = new Set(m.via.map(parKey));
      expect(keys.has(parKey(RIM1)), `${m.id}: via bär RIM1`).toBe(true);
      expect(keys.has(parKey(RIM2)), `${m.id}: via bär RIM2`).toBe(true);
      expect(keys.has(parKey(RIM3)), `${m.id}: via bär RIM3`).toBe(true);
    }
  });

  test('blandad include: enkelt par (OR) + Konjunkt-grupp (AND) i SAMMA anrop — union av de två villkoren', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const mixedRule: SegmentRule = {
      include: [PSIONAUTICS, [RIM1, RIM2]], // OR: (Psionautics) eller (RIM1 AND RIM2)
      exclude: [],
    };
    const [mixedRes, and2Res] = await Promise.all([
      postSegment(request, config, jwt, mixedRule),
      postSegment(request, config, jwt, { include: [[RIM1, RIM2]], exclude: [] }),
    ]);
    expect(mixedRes.status()).toBe(200);
    const mixed = SegmentResultSchema.parse(await mixedRes.json());
    const and2 = SegmentResultSchema.parse(await and2Res.json());

    // Psionautics-grenen är känt tom på staging (MISS-testet ovan) → den
    // blandade regeln ska ge EXAKT samma träffmängd som AND-grenen ensam.
    expect(mixed.count).toBe(and2.count);
    expect(new Set(mixed.members.map((m) => m.id))).toEqual(new Set(and2.members.map((m) => m.id)));
  });

  test('tom Konjunkt-grupp ([]) i include → 400 (fail-closed, parse-tid — samma kontrakt som malformed-rule)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postSegment(request, config, jwt, { include: [[]], exclude: [] });
    expect(res.status()).toBe(400);
  });

  test('AUTH: 401 utan token, även för en AND/DNF-formad regel', async ({ request }) => {
    const config = getApiConfig();
    const res = await postSegment(request, config, null, { include: [[RIM1, RIM2]], exclude: [] });
    await classify401Body(res);
  });
});
