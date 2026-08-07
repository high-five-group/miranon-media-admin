// test-attachments-storage — skarp conformance mot deployad staging-EF
// (TASK-146.3, "Skiva: Privat bucket, path-form per event och signerad
// åtkomst").
//
// Detta är kortets egna AC #2, #3 och #4 bevisade som en repeterbar,
// CI-körd skarv — precis som test-pdf-generation.staging.test.ts gör för
// TASK-146.1. Precis som repots övriga *.staging.test.ts-filer bevisar
// detta mot en REDAN DEPLOYAD funktion (ADR-050: "ingen deploy-automatik,
// manuell `supabase functions deploy`") — inget CI-steg deployar
// test-attachments-storage, den måste redan ligga på staging.
//
// AC #2 (path-formen prefixar per event): `run_full_proof`s eventId har
// formen `ZZ-TEST-EVENT-<uuid>`, och accessTest.path/under/over-paths
// verifieras här att de FAKTISKT ligger under det prefixet i den RIKTIGA
// bucketen (list-baserat kontrollerat server-side av EF:en, se dess
// `sizeLimit.over.persistedAfterRejection`-fält).
//
// AC #3 (signerad åtkomst prövad som ÅTKOMST, inte konfiguration): detta
// test gör de FAKTISKA HTTP-hämtningarna mot de signerade URL:erna EF:en
// returnerar — en giltig länk hämtas direkt (förväntat 200 + rätt bytes),
// en annan väntas ut förbi sin 1-sekunders-livslängd innan den hämtas
// (förväntat ett fel-status). Ingen av hämtningarna görs av EF:en själv —
// exakt det kortet efterfrågar ("prövade som ÅTKOMST"). Testet gör
// dessutom en tredje, oberoende åtkomst-kontroll: bucketens PUBLIKA
// (osignerade) objekt-URL för samma fil, som ska nekas — ett direkt
// beteende-bevis på AC #1 (privat, inte publik) utöver bucket-konfigurations-
// flaggan EF:en också rapporterar.
//
// AC #4 (storleksgränser VID gränsen, båda sidor, "begripligt fel innan
// uppladdningen påbörjas"): EF:en läser bucketens FAKTISKA fileSizeLimit
// live och gör två riktiga uppladdningar — en 1 KB under gränsen (ska
// lyckas), en 1 KB över (ska nekas OCH inte ligga kvar i bucketen
// efteråt). Testet asserterar på båda utfallen plus att felmeddelandet är
// en läsbar sträng, inte en tom/generisk platshållare.

import { expect, test } from '@playwright/test';
import { classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/test-attachments-storage';
const TEST_EVENT_PREFIX_RE = /^ZZ-TEST-EVENT-[0-9a-f-]{36}$/;

interface RunFullProofResponse {
  ok: boolean;
  requestId: string;
  bucket: { id: string; public: boolean; fileSizeLimitBytes: number };
  eventId: string;
  accessTest: {
    path: string;
    validUrl: string;
    validUrlExpiresInSec: number;
    expiringUrl: string;
    expiringUrlExpiresInSec: number;
  };
  sizeLimit: {
    configuredBytes: number;
    marginBytes: number;
    under: { path: string; bytes: number; ok: boolean; error: string | null };
    over: {
      path: string;
      bytes: number;
      ok: boolean;
      error: string | null;
      persistedAfterRejection: boolean;
    };
  };
}

test.describe('test-attachments-storage — bucket, path-form och signerad åtkomst (TASK-146.3)', () => {
  test('privat bucket, per-event path-form, signerad åtkomst och storleksgräns — allt prövat som beteende', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const proofRes = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { action: 'run_full_proof' },
    });
    expect(proofRes.status(), await proofRes.text()).toBe(200);
    const proof = (await proofRes.json()) as RunFullProofResponse;

    try {
      // ── AC #1 (config-halvan) — bucketen ÄR satt privat.
      expect(proof.bucket.id).toBe('bilagor');
      expect(proof.bucket.public).toBe(false);
      expect(proof.bucket.fileSizeLimitBytes).toBeGreaterThan(0);

      // ── AC #2 — path-formen prefixar per event.
      expect(proof.eventId).toMatch(TEST_EVENT_PREFIX_RE);
      expect(proof.accessTest.path.startsWith(`${proof.eventId}/`)).toBe(true);
      expect(proof.sizeLimit.under.path.startsWith(`${proof.eventId}/`)).toBe(true);
      expect(proof.sizeLimit.over.path.startsWith(`${proof.eventId}/`)).toBe(true);

      // ── AC #4 — storleksgränsen prövad VID gränsen, båda sidor.
      expect(
        proof.sizeLimit.under.ok,
        `Uppladdning ${proof.sizeLimit.marginBytes} bytes UNDER gränsen (${proof.sizeLimit.configuredBytes}) borde ha lyckats. Fel: ${proof.sizeLimit.under.error}`,
      ).toBe(true);
      expect(
        proof.sizeLimit.over.ok,
        `Uppladdning ${proof.sizeLimit.marginBytes} bytes ÖVER gränsen (${proof.sizeLimit.configuredBytes}) borde ha nekats, men lyckades.`,
      ).toBe(false);
      expect(typeof proof.sizeLimit.over.error).toBe('string');
      expect((proof.sizeLimit.over.error ?? '').length).toBeGreaterThan(0);
      expect(
        proof.sizeLimit.over.persistedAfterRejection,
        'Det avvisade over-limit-objektet låg kvar i bucketen efter avslag — felet var inte "innan uppladdningen påbörjas", något skrevs.',
      ).toBe(false);

      // ── AC #3 — signerad åtkomst prövad som ÅTKOMST.
      // (a) en giltig signerad länk ger filen.
      const validFetch = await request.get(proof.accessTest.validUrl);
      expect(validFetch.status(), await validFetch.text()).toBe(200);
      const validBody = await validFetch.body();
      expect(validBody.subarray(0, 5).toString('latin1')).toBe('%PDF-');

      // (b) en utgången länk nekas — vänta ut TTL:en (1 s) med marginal
      // innan den faktiska hämtningen görs.
      await new Promise((resolve) =>
        setTimeout(resolve, (proof.accessTest.expiringUrlExpiresInSec + 2) * 1000),
      );
      const expiredFetch = await request.get(proof.accessTest.expiringUrl);
      expect(
        expiredFetch.status(),
        'en utgången signerad URL gav 200 — förväntade ett fel-status',
      ).not.toBe(200);

      // (c) bucketens PUBLIKA (osignerade) objekt-URL för SAMMA fil ska
      // också nekas — direkt beteende-bevis på "privat, inte publik".
      const publicUrl = `${config.baseUrl}/storage/v1/object/public/bilagor/${proof.accessTest.path}`;
      const publicFetch = await request.get(publicUrl);
      expect(
        publicFetch.status(),
        'den publika (osignerade) objekt-URL:en gav 200 — bucketen beter sig inte som privat',
      ).not.toBe(200);
    } finally {
      // Riv testobjekten oavsett assert-utfall — se EF:ens fil-header §
      // "cleanup" för fail-closed-spärren (vägrar radera utanför
      // ZZ-TEST-EVENT--prefixet).
      const cleanupRes = await request.post(`${config.baseUrl}${ENDPOINT}`, {
        headers: { Authorization: `Bearer ${jwt}` },
        data: { action: 'cleanup', prefix: proof.eventId },
      });
      expect(cleanupRes.status(), await cleanupRes.text()).toBe(200);
      const cleanupBody = (await cleanupRes.json()) as { ok: boolean; deleted: string[] };
      expect(cleanupBody.ok).toBe(true);
      // EXAKT 2, inte 3: access-test + under-limit. Over-limit-objektet är
      // MEDVETET frånvarande här — det är precis AC #4:s bevis
      // (persistedAfterRejection === false ovan): ett avvisat
      // over-limit-objekt lämnar ingenting kvar att städa. Ett skript som
      // hittade 3 här hade dolt en läckande over-limit-uppladdning, inte
      // bevisat en.
      expect(cleanupBody.deleted.length).toBe(2);
      expect(cleanupBody.deleted.some((p) => p.endsWith('-access-test.pdf'))).toBe(true);
      expect(cleanupBody.deleted.some((p) => p.endsWith('-under-limit.pdf'))).toBe(true);
      expect(cleanupBody.deleted.some((p) => p.endsWith('-over-limit.pdf'))).toBe(false);
    }
  });

  test('cleanup vägrar radera utanför den reserverade testnamnrymden', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
      data: { action: 'cleanup', prefix: 'not-a-test-prefix' },
    });
    expect(res.status(), await res.text()).toBe(400);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      data: { action: 'run_full_proof' },
    });
    await classify401Body(res);
  });

  test('CORS preflight: tillåten origin → 200 + Access-Control-Allow-Origin speglar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const res = await request.fetch(`${config.baseUrl}${ENDPOINT}`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
