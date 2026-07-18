// get-registrations — skarp conformance mot deployad staging-EF (Fas 6c, T15 väg D).
//
// get-registrations LÄSER bara (ingen write → ingen mutation/restore). Den nya
// EVENTID-GRENEN använder VÄG D (record-ID-batch från event-hållet via
// `Anmälningar (länkat fält)`-länken — speglar get-attendance/get-person; använder
// MEDVETET INTE buildLinkedRecordFilter, T15-klass-buggen). Bevisar mot SKARP
// staging-data:
//   1. GROUND TRUTH utan extern räknekälla: event-lösa grenen (oförändrad) hämtar
//      HELA Anmälningar-mängden; klientside-filtrering på eventId ger den sanna
//      mängden för ett event. Väg D (?eventId=) MÅSTE returnera EXAKT samma
//      record-ID-mängd → NOLL trunkering över chunk-gränsen (staging-secret
//      REGISTRATIONS_BATCH_SIZE=2 tvingar chunk-merge när eventet har ≥3 anmälningar)
//      OCH semantisk ekvivalens mellan de två vägarna.
//   2. Semantisk korrekthet: varje väg-D-rad bär eventId === det efterfrågade eventet
//      (rätt anmälningar för rätt event), och den seedade TEST_REGISTRATION_RECORD_ID
//      finns med (binder beviset till en känd post, ej "någon mängd").
//   3. Inskickad-desc-ordning (nulls sist).
//   4. Okänt eventId → 404 (ärver get-event/get-attendance-kontraktet).
//
// G1-GRIND (L154, väg D-antagandet): ett event som VET sig ha anmälningar (den
// seedade postens event) MÅSTE ge en icke-tom väg-D-mängd. Tom → spegeln
// (`Anmälningar (länkat fält)`) är opopulerad/asymmetrisk → väg D-antagandet
// FALSIFIERAT. Detta är samma sharp-data-grind get-attendance bär för `Närvaro (records)`.
//
// INGEN ny fixtur seedas: den seedade anmälningsposten (TEST_REGISTRATION_RECORD_ID,
// samma som update-record-testet muterar) härleds via event-lösa grenen, och dess
// event blir conformance-ankaret — robustare än ett hårdkodat staging-event-ID
// (duplicerad bas, ADR-050).
//
// Auth via getValidUserJWT → password-grant (samma mönster som get-attendance/get-event).
// Lokalt skip:as utan TEST_USER-creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).

import { type APIRequestContext, expect, test } from '@playwright/test';
import { z } from 'zod';
import { RegistrationSchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

type Registration = z.infer<typeof RegistrationSchema>;

async function callGetRegistrations(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  eventId: string | undefined,
): Promise<{ status: number; registrations: Registration[] }> {
  const query = eventId === undefined ? '' : `?eventId=${encodeURIComponent(eventId)}`;
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  const res = await request.get(`${config.baseUrl}/functions/v1/get-registrations${query}`, {
    headers,
  });
  if (res.status() !== 200) return { status: res.status(), registrations: [] };
  const registrations = z
    .array(RegistrationSchema)
    .parse(((await res.json()) as { registrations: unknown }).registrations);
  return { status: 200, registrations };
}

/** Härled conformance-ankaret: den seedade postens event (ingen seedad fixtur). */
async function findSeededRegistrationEvent(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
): Promise<{ eventId: string; all: Registration[]; seededId: string }> {
  const seededId = process.env.TEST_REGISTRATION_RECORD_ID ?? '';
  expect(
    seededId,
    'TEST_REGISTRATION_RECORD_ID måste vara satt i staging-env (lokalt: raden finns i .env.test.example — seed-ankaret, docs/BUILD-LOG.md)',
  ).not.toBe('');

  // Event-lösa grenen (oförändrad) → HELA Anmälningar-mängden.
  const { status, registrations: all } = await callGetRegistrations(
    request,
    config,
    jwt,
    undefined,
  );
  expect(status).toBe(200);

  const seeded = all.find((r) => r.id === seededId);
  expect(seeded, `seedad post ${seededId} hittades inte via get-registrations`).toBeTruthy();
  const eventId = seeded?.eventId ?? null;
  expect(eventId, `seedad post ${seededId} saknar eventId (länk ej satt i fixturen?)`).toBeTruthy();

  return { eventId: eventId as string, all, seededId };
}

test.describe('get-registrations — skarp conformance (Fas 6c, T15 väg D)', () => {
  test('väg D == event-lösa-grenens event-mängd (NOLL trunkering) + semantiskt rätt event', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { eventId, all, seededId } = await findSeededRegistrationEvent(request, config, jwt);

    // GROUND TRUTH: event-lösa mängden filtrerad på eventet (klientside).
    const expectedIds = new Set(all.filter((r) => r.eventId === eventId).map((r) => r.id));

    // VÄG D: record-ID-batch från event-hållet via `Anmälningar (länkat fält)`.
    const { status, registrations: viaD } = await callGetRegistrations(
      request,
      config,
      jwt,
      eventId,
    );
    expect(status).toBe(200);

    // G1-GRIND: eventet VET sig ha minst den seedade anmälan → väg D får ej vara tom.
    expect(
      viaD.length,
      `G1 FALSIFIERAD: event ${eventId} har anmälningar (seedad ${seededId}) men väg D gav tom mängd — Anmälningar (länkat fält)-spegeln är opopulerad/asymmetrisk`,
    ).toBeGreaterThan(0);

    // (i) NOLL trunkering + semantisk ekvivalens: väg D-mängden == ground truth-mängden.
    const viaDIds = new Set(viaD.map((r) => r.id));
    expect(viaDIds).toEqual(expectedIds);
    expect(
      viaD.find((r) => r.id === seededId),
      'seedad post ska finnas i väg D-mängden',
    ).toBeTruthy();

    // (iii) semantisk korrekthet: varje rad hör till det efterfrågade eventet.
    for (const r of viaD) {
      expect(r.eventId, `väg D-rad ${r.id} ska bära eventId === ${eventId}`).toBe(eventId);
    }

    // Chunk-merge faktiskt exercerad när eventet har ≥3 anmälningar (BATCH_SIZE=2 → ≥2 chunkar).
    // Set-likheten ovan bevisar noll-trunkering OAVSETT antal; detta annoterar bara täckningen.
    test.info().annotations.push({
      type: 'chunk-merge',
      description: `event ${eventId}: ${viaD.length} anmälningar (≥3 ⇒ multi-chunk exercerad vid BATCH_SIZE=2)`,
    });
  });

  test('väg D: Inskickad-desc-ordning (nulls sist)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { eventId } = await findSeededRegistrationEvent(request, config, jwt);

    const { status, registrations: viaD } = await callGetRegistrations(
      request,
      config,
      jwt,
      eventId,
    );
    expect(status).toBe(200);

    // (ii) Inskickad desc, nulls sist: varje par i ordning ska respektera invarianten.
    const ts = viaD.map((r) => (r.inskickad ? Date.parse(r.inskickad) : null));
    for (let i = 1; i < ts.length; i++) {
      const prev = ts[i - 1];
      const cur = ts[i];
      if (prev === null) {
        // En null föregångare → alla efterföljande måste också vara null (nulls sist).
        expect(cur, `rad ${i}: en icke-null får ej följa en null (nulls ska vara sist)`).toBeNull();
      } else if (cur !== null) {
        expect(prev, `rad ${i}: Inskickad ska vara desc-sorterad`).toBeGreaterThanOrEqual(cur);
      }
    }
  });

  test('okänt eventId → 404 (eventId-grenens kontrakt)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status } = await callGetRegistrations(request, config, jwt, 'recZZZZZZZZZZZZZZ');
    expect(status).toBe(404);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.get(
      `${config.baseUrl}/functions/v1/get-registrations?eventId=recANY`,
    );
    await classify401Body(res);
  });
});
