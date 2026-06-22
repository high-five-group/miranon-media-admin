// get-waitlist — skarp conformance mot deployad staging-EF (Fas 6c, Leverabel 3).
//
// get-waitlist är en GLOBAL läs-lista (Väntelista.Event = singleLineText-konstant,
// INGET länkfält → ingen record-ID-batch/väg-D, ingen chunk-merge, ingen 404). EF:en
// filtrerar serverside på NOT({Flyttad till anmälan}) och sorterar createdTime desc
// (JS-side; createdTime är record-metadata, inte ett sorterbart Airtable-fält).
//
// Bevisar mot SKARP staging-data (seedad fixtur, ADR-050-duplicerad bas):
//   1. AKTIV-FILTER: de seedade aktiva raderna INKLUDERAS, den seedade Flyttad-raden
//      EXKLUDERAS. Roster-kontraktet bär inte Flyttad-fältet (det är ett filter, ej
//      display) → filter-beviset är IDENTITETS-baserat: Flyttad-radens e-post saknas.
//   2. ROSTER-KONTRAKT: nullable `informationsmail1Skickad` mappas i BÅDA grenarna
//      (en seedad rad har den satt, en har den null), och `createdTime` är present
//      (icke-tom) på varje rad — "när de ställde sig" + sort-nyckel.
//   3. SENASTE-FÖRST: createdTime desc-invariant över hela listan OCH bunden till
//      kända rader (aktiv A seedades EFTER aktiv B → A före B).
//
// Auth via getValidUserJWT → persisterad api-token-artefakt (T24-b: api-setup loggar
// in EN gång, sviten läser artefakten — ingen GoTrue-429-burst). Lokalt skip:as utan
// staging-creds; skarpa beviset körs i CI (STAGING_REQUIRED=1).
//
// FIXTUR (seedad i staging-Väntelista, stabila e-poster = testdata, ej prod):
//   waitlist-active-a@staging.test  — Informationsmail satt, skapad SENAST (→ först)
//   waitlist-active-b@staging.test  — Informationsmail null, skapad TIDIGAST (→ efter A)
//   waitlist-flyttad@staging.test   — Flyttad till anmälan = true (→ MÅSTE exkluderas)

import { type APIRequestContext, expect, test } from '@playwright/test';
import { z } from 'zod';
import { WaitlistEntrySchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

type WaitlistEntry = z.infer<typeof WaitlistEntrySchema>;

const ACTIVE_A_EMAIL = 'waitlist-active-a@staging.test';
const ACTIVE_B_EMAIL = 'waitlist-active-b@staging.test';
const FLYTTAD_EMAIL = 'waitlist-flyttad@staging.test';
const ALLOWED_ORIGIN = 'http://localhost:5173'; // per CORS_ALLOWED_ORIGINS i staging

async function fetchWaitlist(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  origin?: string,
): Promise<{ status: number; waitlist: WaitlistEntry[]; headers: Record<string, string> }> {
  const headers: Record<string, string> = { Authorization: `Bearer ${jwt}` };
  if (origin) headers.Origin = origin;
  const res = await request.get(`${config.baseUrl}/functions/v1/get-waitlist`, { headers });
  if (res.status() !== 200) return { status: res.status(), waitlist: [], headers: res.headers() };
  const waitlist = z
    .array(WaitlistEntrySchema)
    .parse(((await res.json()) as { waitlist: unknown }).waitlist);
  return { status: 200, waitlist, headers: res.headers() };
}

test.describe('get-waitlist — skarp conformance (Fas 6c, global läs-lista)', () => {
  test('aktiv-filter: aktiva rader inkluderade, Flyttad-raden exkluderad', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, waitlist } = await fetchWaitlist(request, config, jwt);
    expect(status).toBe(200);

    const emails = new Set(waitlist.map((w) => w.email));
    expect(emails.has(ACTIVE_A_EMAIL), 'seedad aktiv A ska finnas i listan').toBe(true);
    expect(emails.has(ACTIVE_B_EMAIL), 'seedad aktiv B ska finnas i listan').toBe(true);
    expect(
      emails.has(FLYTTAD_EMAIL),
      'seedad Flyttad-rad ska EXKLUDERAS av NOT({Flyttad till anmälan})',
    ).toBe(false);
  });

  test('roster-kontrakt: nullable Informationsmail mappas (satt + null), createdTime present', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, waitlist } = await fetchWaitlist(request, config, jwt);
    expect(status).toBe(200);

    const a = waitlist.find((w) => w.email === ACTIVE_A_EMAIL);
    const b = waitlist.find((w) => w.email === ACTIVE_B_EMAIL);
    expect(a, 'seedad aktiv A finns').toBeTruthy();
    expect(b, 'seedad aktiv B finns').toBeTruthy();

    // BÅDA grenarna av den nullable dateTime-mappningen bevisas: A satt, B null.
    expect(a?.informationsmail1Skickad, 'A: Informationsmail satt → non-null').toBeTruthy();
    expect(b?.informationsmail1Skickad, 'B: Informationsmail saknas → null').toBeNull();

    // createdTime present (icke-tom ISO) på varje rad — "datum" + sort-nyckel.
    for (const w of waitlist) {
      expect(w.createdTime, `rad ${w.id}: createdTime ska vara present`).toBeTruthy();
    }
  });

  test('senaste-först: createdTime desc (global invariant + A före B)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, waitlist } = await fetchWaitlist(request, config, jwt);
    expect(status).toBe(200);

    // Global invariant: varje par i ordning ska respektera createdTime desc.
    const ts = waitlist.map((w) => Date.parse(w.createdTime));
    for (let i = 1; i < ts.length; i++) {
      expect(ts[i - 1], `rad ${i}: createdTime ska vara desc-sorterad`).toBeGreaterThanOrEqual(
        ts[i],
      );
    }

    // Bunden till kända rader: A seedades EFTER B → senaste-först → A före B.
    const ia = waitlist.findIndex((w) => w.email === ACTIVE_A_EMAIL);
    const ib = waitlist.findIndex((w) => w.email === ACTIVE_B_EMAIL);
    expect(ia, 'seedad aktiv A ska finnas').toBeGreaterThanOrEqual(0);
    expect(ib, 'seedad aktiv B ska finnas').toBeGreaterThanOrEqual(0);
    expect(ia, 'aktiv A (skapad senast) ska komma före aktiv B').toBeLessThan(ib);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.get(`${config.baseUrl}/functions/v1/get-waitlist`);
    await classify401Body(res);
  });

  test('CORS: tillåten origin speglas i Access-Control-Allow-Origin', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, headers } = await fetchWaitlist(request, config, jwt, ALLOWED_ORIGIN);
    expect(status).toBe(200);
    expect(headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });
});
