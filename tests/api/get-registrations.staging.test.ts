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
import { ARBETSKO_EVENT_ID, ARBETSKO_EXPECTED } from './fixtures';
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

// ── task-18.4: deltagar-shapens utökning (arbetskö-skelettets datakontrakt) ──
//
// Fem additiva LÄS-fält som eventsidans arbetskö bygger på:
//   kalla                 — Anmälningar.`Källa` (singleSelect; TOM = via formulär)
//   medfoljandeTill       — Anmälningar.`Medföljande till` (self-link → första ID)
//   bekraftelseSkickad    — Anmälningar.`Bekräftelse skickad` (dateTime)
//   deltagarinfoSkickad   — Anmälningar.`Deltagarinfo skickad` (dateTime; UI-ordet
//                            är EVENTINFO, basens fält heter Deltagarinfo)
//   antalGenomfordaEvent  — PERSONER.`Antal genomförda event` (formel) via
//                            CHUNKAD record-ID-batch (get-person-mallen, ALDRIG
//                            ett anrop per person) — eventId-grenen bär batchen.
//
// Testar KONTRAKTET (fält-närvaro + värde-mappning + null-vägen + person-batchens
// number-vs-null-skillnad), aldrig implementationen. Fixturen är permanent och
// beskriven i fixtures.ts — LÄSER bara, ingen mutation/teardown behövs.
test.describe('get-registrations — deltagar-shapens utökning (task-18.4)', () => {
  test('väg D: alla fem nya nycklar NÄRVARANDE på varje rad (aldrig undefined)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, registrations } = await callGetRegistrations(
      request,
      config,
      jwt,
      ARBETSKO_EVENT_ID,
    );
    expect(status).toBe(200);
    expect(registrations).toHaveLength(ARBETSKO_EXPECTED.antalAnmalningar);

    // Schemat är additivt-OPTIONAL (äldre cachade svar ska parsa) — den deployade
    // EF:en måste ändå leverera varje nyckel som värde-eller-null, aldrig utelämnad.
    for (const reg of registrations) {
      const raw = reg as unknown as Record<string, unknown>;
      for (const key of [
        'kalla',
        'medfoljandeTill',
        'bekraftelseSkickad',
        'deltagarinfoSkickad',
        'antalGenomfordaEvent',
      ]) {
        expect(raw, `rad ${reg.id}: nyckeln '${key}' saknas i svaret`).toHaveProperty(key);
        expect(raw[key], `rad ${reg.id}: '${key}' får aldrig vara undefined`).not.toBeUndefined();
      }
    }
  });

  test('väg D: Källa-mappningen — TOM → null (via formulär), Manuell, +1', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, registrations } = await callGetRegistrations(
      request,
      config,
      jwt,
      ARBETSKO_EVENT_ID,
    );
    expect(status).toBe(200);
    const byId = new Map(registrations.map((r) => [r.id, r]));

    // Källa TOM är BÄRANDE semantik (via formulär = normen) → måste bli null,
    // aldrig tom sträng: kategori-filtret på eventsidan skiljer på null och värde.
    expect(byId.get(ARBETSKO_EXPECTED.bekraftadId)?.kalla).toBeNull();
    expect(byId.get(ARBETSKO_EXPECTED.obekraftadId)?.kalla).toBeNull();
    expect(byId.get(ARBETSKO_EXPECTED.manuellId)?.kalla).toBe('Manuell');
    expect(byId.get(ARBETSKO_EXPECTED.medfoljandeId)?.kalla).toBe('+1');
  });

  test('väg D: skickad-tidsstämplarna + medföljande-länken mappas (och null när osatta)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, registrations } = await callGetRegistrations(
      request,
      config,
      jwt,
      ARBETSKO_EVENT_ID,
    );
    expect(status).toBe(200);
    const byId = new Map(registrations.map((r) => [r.id, r]));

    const bekraftad = byId.get(ARBETSKO_EXPECTED.bekraftadId);
    expect(bekraftad?.bekraftelseSkickad).toBe(ARBETSKO_EXPECTED.bekraftelseSkickad);
    expect(bekraftad?.deltagarinfoSkickad).toBe(ARBETSKO_EXPECTED.deltagarinfoSkickad);
    expect(bekraftad?.medfoljandeTill).toBeNull();

    // Osatta tidsstämplar → null (kortet renderar ENDAST utförda åtgärder).
    const obekraftad = byId.get(ARBETSKO_EXPECTED.obekraftadId);
    expect(obekraftad?.bekraftelseSkickad).toBeNull();
    expect(obekraftad?.deltagarinfoSkickad).toBeNull();

    // Self-link → FÖRSTA record-ID:t (aldrig arrayen, aldrig display-namnet).
    expect(byId.get(ARBETSKO_EXPECTED.medfoljandeId)?.medfoljandeTill).toBe(
      ARBETSKO_EXPECTED.bekraftadId,
    );
  });

  test('väg D: antalGenomfordaEvent kommer ur PERSON-batchen (number vs null)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, registrations } = await callGetRegistrations(
      request,
      config,
      jwt,
      ARBETSKO_EVENT_ID,
    );
    expect(status).toBe(200);
    const byId = new Map(registrations.map((r) => [r.id, r]));

    // Raden MED Person-länk bär personens formelvärde; raderna UTAN Person-länk
    // bär null. Skillnaden kan bara uppstå om Personer faktiskt lästes — en
    // `?? 0`-genväg hade gett 0 på båda och fällt detta test.
    expect(byId.get(ARBETSKO_EXPECTED.bekraftadId)?.antalGenomfordaEvent).toBe(
      ARBETSKO_EXPECTED.antalGenomfordaEvent,
    );
    expect(byId.get(ARBETSKO_EXPECTED.obekraftadId)?.antalGenomfordaEvent).toBeNull();
    expect(byId.get(ARBETSKO_EXPECTED.manuellId)?.antalGenomfordaEvent).toBeNull();
  });
});

// ── task-18.7: bor över-fältet i läs-shapen ──────────────────────────────────
//
// `borOver` ← Anmälningar.`Bor över` (ADDITIVT checkbox-fält fldGYYNnQi7XlfbhP,
// staging-fött 2026-07-22). Kontraktet är BOOLEAN, aldrig null/undefined:
// Airtable utelämnar en omarkerad checkbox helt ur record-svaret, så EF:en
// normaliserar `=== true` — annars hade "urkryssad" blivit "vet ej" och
// kryss-lägets tillstånd varit obestämt.
//
// Fixturen bär BÅDA utfallen på samma event (1 ikryssad av 4) — det är också
// facit för den HÄRLEDDA summeringen (aldrig ett lagrat räknefält).
test.describe('get-registrations — bor över i läs-shapen (task-18.7)', () => {
  test('väg D: borOver är boolean på varje rad och speglar fixturens kryss', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, registrations } = await callGetRegistrations(
      request,
      config,
      jwt,
      ARBETSKO_EVENT_ID,
    );
    expect(status).toBe(200);
    expect(registrations).toHaveLength(ARBETSKO_EXPECTED.antalAnmalningar);

    for (const reg of registrations) {
      const raw = reg as unknown as Record<string, unknown>;
      expect(raw, `rad ${reg.id}: nyckeln 'borOver' saknas i svaret`).toHaveProperty('borOver');
      expect(typeof raw.borOver, `rad ${reg.id}: 'borOver' ska vara boolean`).toBe('boolean');
    }

    const byId = new Map(registrations.map((r) => [r.id, r]));
    // Ikryssad ⇒ true; urkryssad/osatt ⇒ false. Skillnaden på samma event är
    // beviset att fältet faktiskt LÄSES (en konstant hade gett samma värde).
    expect(byId.get(ARBETSKO_EXPECTED.bekraftadId)?.borOver).toBe(true);
    expect(byId.get(ARBETSKO_EXPECTED.obekraftadId)?.borOver).toBe(false);
    expect(byId.get(ARBETSKO_EXPECTED.manuellId)?.borOver).toBe(false);
    expect(byId.get(ARBETSKO_EXPECTED.medfoljandeId)?.borOver).toBe(false);

    // Den HÄRLEDDA summeringen (eventsidans rad + 17.5:s listkortsrad) —
    // räknas ur kryssen, aldrig ur ett lagrat räknefält.
    expect(registrations.filter((r) => r.borOver).length).toBe(ARBETSKO_EXPECTED.borOverAntal);
  });
});
