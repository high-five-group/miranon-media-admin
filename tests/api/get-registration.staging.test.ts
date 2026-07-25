// get-registration — conformance mot deployad staging-EF (task-18.17).
//
// Per-anmälan-detaljshapen (S83-facit): single-get-mallen (ärver get-person/
// get-event-kontraktet: 200 + { registration } / 400 Missing id / 404 / 401)
// med get-registrations-berikningen ÅTERANVÄND (`_shared/registration-read.ts`)
// plus detaljfälten — autonummer-ID, formulär+options-ID, villkor, event-
// lookups, deadline-formlerna och medföljande-relationen i BÅDA riktningarna.
//
// INGEN ny fixtur seedas: ARBETSKO-fixturen (tests/api/fixtures.ts) bär redan
// medföljande-relationen åt båda håll (medfoljandeId → bekraftadId) och en
// Person-länk med kurshistorik — exakt detaljshapens svåra fall. LÄSER bara.
//
// Auth via getValidUserJWT (samma mönster som get-event). Lokalt skip:as utan
// TEST_USER-creds; skarpa beviset körs i CI.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { RegistrationDetailSchema } from '../../src/domain/schemas';
import { ARBETSKO_EXPECTED } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

async function callGetRegistration(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  id: string | undefined,
) {
  const query = id === undefined ? '' : `?id=${encodeURIComponent(id)}`;
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.get(`${config.baseUrl}/functions/v1/get-registration${query}`, { headers });
}

test.describe('get-registration — conformance (single-get-mall, task-18.17)', () => {
  test('giltigt ID → 200 + RegistrationDetailSchema-valid; list-shapen + detaljfälten bärs', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await callGetRegistration(request, config, jwt, ARBETSKO_EXPECTED.bekraftadId);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { registration: unknown };
    // Skarp validering vid datagränsen — samma .parse som adaptern kör.
    const reg = RegistrationDetailSchema.parse(body.registration);
    expect(reg.id).toBe(ARBETSKO_EXPECTED.bekraftadId);

    // Autonummer-ID:t (headerns "Anmälan #N"): definit tal på varje bas-rad.
    expect(typeof reg.anmalanId).toBe('number');

    // List-shapens berikning ÅTERANVÄND (inte en parallell mapper): personens
    // räknare + kurshistorik följer med precis som i get-registrations
    // eventId-gren (fixturens kända värden).
    expect(reg.antalGenomfordaEvent).toBe(ARBETSKO_EXPECTED.antalGenomfordaEvent);
    expect(reg.erfarenhetsbadge).toBe(ARBETSKO_EXPECTED.erfarenhetsbadge);
    expect(reg.kurshistorik?.map((h) => h.kursnamn)).toContain(
      ARBETSKO_EXPECTED.kurshistorikKursnamn,
    );

    // Utskicks-tidsstämplarna (tidslinjens källor).
    expect(reg.bekraftelseSkickad).toBe(ARBETSKO_EXPECTED.bekraftelseSkickad);
    expect(reg.deltagarinfoSkickad).toBe(ARBETSKO_EXPECTED.deltagarinfoSkickad);

    // MEDFÖLJANDE-INVERSEN (detaljshapens nya riktning): bekraftadId är
    // huvudanmälan för fixturens +1 → plusEttor bär medfoljandeId.
    expect(reg.plusEttor.map((p) => p.id)).toContain(ARBETSKO_EXPECTED.medfoljandeId);

    // Event-härledda fält (review-fynd F2): eventOrt kommer ur EVENTRADEN
    // (fixtur-eventets Ort är dess kända sentinel-namn) — anmälans eget
    // Ort-fält är formulärets kopia och bevisar inget.
    expect(reg.eventOrt).toBe('ZZ-arbetsko-fixtur');

    // Bas-gap-nycklarna (URL/UTM) finns i shapen som null tills fälten föds.
    expect(reg.sidUrl).toBeNull();
    expect(reg.utm).toBeNull();
  });

  test('medföljande-relationen BÅDA håll: +1-raden pekar på huvudanmälan med namn', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const medRes = await callGetRegistration(request, config, jwt, ARBETSKO_EXPECTED.medfoljandeId);
    expect(medRes.status()).toBe(200);
    const medfoljande = RegistrationDetailSchema.parse(
      ((await medRes.json()) as { registration: unknown }).registration,
    );

    // Självlänken: +1:ans huvudanmälan är fixturens bekräftade rad …
    expect(medfoljande.medfoljandeTill).toBe(ARBETSKO_EXPECTED.bekraftadId);

    // … och namnet är UPPLÖST server-side (namn-batchen) — samma visningsnamn
    // som huvudanmälans egen rad bär (kontrakt mot kontrakt, inga hårdkodade
    // fixtur-namn som kan driva).
    const huvudRes = await callGetRegistration(request, config, jwt, ARBETSKO_EXPECTED.bekraftadId);
    const huvud = RegistrationDetailSchema.parse(
      ((await huvudRes.json()) as { registration: unknown }).registration,
    );
    expect(medfoljande.medfoljandeTillNamn).not.toBeNull();
    expect(medfoljande.medfoljandeTillNamn).toBe(huvud.namn);

    // Åt andra hållet bär huvudanmälans plusEttor +1:ans namn (samma upplösning).
    const plusEtta = huvud.plusEttor.find((p) => p.id === ARBETSKO_EXPECTED.medfoljandeId);
    expect(plusEtta?.namn).toBe(medfoljande.namn);

    // +1:an saknar Person-länk (fixturen) → berikningen ger null, aldrig 0/[]
    // ("vet ej" är sanningen — get-registrations null-semantik ärvd).
    expect(medfoljande.antalGenomfordaEvent).toBeNull();
    expect(medfoljande.kurshistorik).toBeNull();
  });

  test('okänt ID → 404 + body { error } (mall-kontraktet, ärvt från get-person/get-event)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetRegistration(request, config, jwt, 'recZZZZZZZZZZZZZZ');

    expect(res.status()).toBe(404);
    const body = (await res.json()) as { error?: unknown };
    expect(typeof body.error).toBe('string');
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await callGetRegistration(request, config, undefined, 'recANY');
    await classify401Body(res);
  });

  test('saknat id-param → 400 { error: "Missing id" }', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await callGetRegistration(request, config, jwt, undefined);

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: unknown };
    expect(body.error).toBe('Missing id');
  });
});
