// save-segment + get-segments — skarp conformance mot deployad staging-EF (Fas 6g L3, ADR-065).
//
// save-segment SKRIVER (POST → ny Segment-rad) — repots FÖRSTA 6g-write. Speglar
// create-registration:s säkerhets-kontrakt men för en segment-rad. Bevisar mot SKARP
// staging-data:
//   1. allow: giltig {namn, rule, definition} → 201 + SKRIV-BEVIS ur råa record.fields —
//      EF:en satte 'Namn på segment' = namn OCH 'App-segmentregel' = JSON.stringify(rule)
//      (parse-rundtur deep-equal mot regeln). Domän-shapen (segment) parse:as med
//      SavedSegmentSchema och bär regeln tillbaka.
//   2. deny: ogiltig rule-form (okänd modalitet) → 400. Eftersom `fields` byggs server-side
//      träffar deny-testet INPUT-valideringen (parseSegmentRule), inte findDisallowedField —
//      samma mönster som create-registration deny-testet.
//   3. anon (ingen JWT) → 401 (delad gateway/requireUser).
//   4. get-segments: GET → 200 + { segments: [] | SavedSegment[] }; varje rad bär en giltig
//      regel (L193 — legacy-rader utan App-segmentregel filtreras bort, kraschar ej).
//
// SENTINEL (ADR-060): per-körning-UNIKT namn (`app-segment-test+${uuid}`) → ingen
// cross-run-kollision. save-segment SKRIVER skarpa staging-rader (sentinel-only); setup-purge
// är manuell/schemalagd (CI saknar Airtable-creddad seed-fas) — bounded sentinel-ackumulering
// tolereras, ADR-060.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan creds; skarpa
// beviset körs i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import type { z } from 'zod';
import { SavedSegmentSchema, type SegmentRule } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const SAVE_ENDPOINT = '/functions/v1/save-segment';
const GET_ENDPOINT = '/functions/v1/get-segments';

type SavedSegment = z.infer<typeof SavedSegmentSchema>;

interface SaveBody {
  namn?: string;
  rule?: unknown;
  definition?: string;
}

function postSave(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: SaveBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${SAVE_ENDPOINT}`, { headers, data: body });
}

/** Per-körning-unikt sentinel-namn (ADR-060). */
function sentinelName(): string {
  return `app-segment-test+${randomUUID()}`;
}

// Giltig regel: öppen taxonomi (kurs valideras ej mot lista, ADR-064 beslut 2) +
// giltig modalitet. Deterministisk fält-ordning (include före exclude, kurs före
// modalitet) → JSON-rundtur deep-equal.
const VALID_RULE: SegmentRule = {
  include: [{ kurs: 'Fjärrskådning', modalitet: 'Utbildning' }],
  exclude: [],
};

test.describe('save-segment + get-segments — skarp conformance (Fas 6g L3)', () => {
  test('allow: giltig save → 201 + skriv-bevis (Namn + App-segmentregel)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const namn = sentinelName();
    const definition = 'Med: deltog i Fjärrskådning (utbildning).';
    const res = await postSave(request, config, jwt, { namn, rule: VALID_RULE, definition });
    const raw = await res.text();
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as {
      segment: unknown;
      record: { id: string; fields: Record<string, unknown> };
    };

    // (i) SKRIV-BEVIS ur råa record.fields — EF:en satte fälten i Airtable.
    expect(body.record.id.startsWith('rec')).toBe(true);
    expect(body.record.fields['Namn på segment']).toBe(namn);
    expect(body.record.fields['Segmentdefinition']).toBe(definition);
    // App-segmentregel bär JSON.stringify(rule) — parse-rundtur deep-equal (robust mot
    // nyckel-ordnings-skörhet).
    expect(JSON.parse(body.record.fields['App-segmentregel'] as string)).toEqual(VALID_RULE);

    // (ii) Domän-shape (adapterns parse-väg) — regeln bärs tillbaka.
    const segment: SavedSegment = SavedSegmentSchema.parse(body.segment);
    expect(segment.namn).toBe(namn);
    expect(segment.definition).toBe(definition);
    expect(segment.rule).toEqual(VALID_RULE);
  });

  test('deny: ogiltig rule-form (okänd modalitet) → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postSave(request, config, jwt, {
      namn: sentinelName(),
      rule: { include: [{ kurs: 'Fjärrskådning', modalitet: 'Ogiltig' }], exclude: [] },
      definition: 'x',
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/modalitet/i);
  });

  test('deny: tomt namn → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postSave(request, config, jwt, {
      namn: '   ',
      rule: VALID_RULE,
      definition: 'x',
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/namn/i);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${SAVE_ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { namn: 'x', rule: VALID_RULE, definition: 'x' },
    });
    await classify401Body(res);
  });

  test('get-segments: GET → 200 + segments[] där varje rad bär en giltig regel (L193)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await request.get(`${config.baseUrl}${GET_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as { segments: unknown };
    expect(Array.isArray(body.segments)).toBe(true);

    // Varje returnerad rad MÅSTE parsa som SavedSegment (rule närvarande) — legacy-rader
    // utan App-segmentregel ska redan vara bortfiltrerade av EF:en (kontrakt-assertion).
    const segments = (body.segments as unknown[]).map((s) => SavedSegmentSchema.parse(s));
    for (const s of segments) {
      expect(s.rule).toBeTruthy();
      expect(Array.isArray(s.rule.include)).toBe(true);
    }
  });
});
