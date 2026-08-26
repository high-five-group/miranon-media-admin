// Enhetstest för getWithTransientRetry (TASK-207, katalogpost för
// Edge Runtime/Airtable-lagrets transienta 502/503).
//
// api-pure (ren logik, INGEN staging): svaren MOCKAS och den faktiska
// väntetiden mäts via injicerad sleep — samma disciplin som
// airtable-retry.test.ts använder för 429-backoffen. Ingen riktig tid
// förflyter, ingen nätverksanslutning krävs.
//
// Bakgrund: post-merge-sviten föll TRE separata gånger 2026-08-12 med
// genuina 502/503 från staging-infrastrukturen, spridda över FEM
// orelaterade endpoints i tre PR:er utan gemensam kod — bevisat oskyldiga
// via first-parent-diff (TASK-207). Retry-with-backoff på idempotenta
// LÄSNINGAR är branschmönstret för denna felklass (AWS "Exponential
// Backoff And Jitter", full jitter); en tröskel eller ett fast sleep är
// inte samma lösning, vilket testerna nedan bevisar mekaniskt.

import { expect, test } from '@playwright/test';
import {
  getWithTransientRetry,
  TRANSIENT_RETRY_BASE_WAIT_MS,
  TRANSIENT_RETRY_MAX_RETRIES,
} from './helpers';

/** Minimal APIResponse-stubb — bara `.status()` behövs av getWithTransientRetry. */
function svar(status: number) {
  return { status: () => status } as unknown as import('@playwright/test').APIResponse;
}

/**
 * Kör mot en scriptad statussekvens och FÅNGAR varje väntetid + antalet anrop.
 * Ingen riktig tid förflyter — sleep är injicerad (samma mönster som
 * airtable-retry.test.ts:s `körMedMätning`).
 */
async function körMedMätning(
  statusar: number[],
  options: { random?: () => number; maxRetries?: number; baseWaitMs?: number } = {},
) {
  const väntetider: number[] = [];
  let antalAnrop = 0;

  const res = await getWithTransientRetry(
    async () => {
      const status = statusar[Math.min(antalAnrop, statusar.length - 1)];
      antalAnrop += 1;
      return svar(status);
    },
    {
      ...options,
      sleep: (ms: number) => {
        väntetider.push(ms);
        return Promise.resolve();
      },
    },
  );

  return { res, väntetider, antalAnrop };
}

test.describe('getWithTransientRetry — retry ENDAST på 502/503 (TASK-207)', () => {
  test('200 direkt → inget omförsök, ingen väntan', async () => {
    const { res, väntetider, antalAnrop } = await körMedMätning([200]);

    expect(antalAnrop).toBe(1);
    expect(res.status()).toBe(200);
    expect(väntetider).toHaveLength(0);
  });

  test('502 följt av 200 → ETT omförsök, väntan i [0, baseWaitMs)', async () => {
    const { res, väntetider, antalAnrop } = await körMedMätning([502, 200], { random: () => 0.5 });

    expect(antalAnrop).toBe(2);
    expect(res.status()).toBe(200);
    expect(väntetider).toEqual([TRANSIENT_RETRY_BASE_WAIT_MS * 0.5]);
  });

  test('503 → 503 → 200: väntan fördubblas per försök (full jitter, random=1 ger taket)', async () => {
    const { res, väntetider, antalAnrop } = await körMedMätning([503, 503, 200], {
      random: () => 1,
    });

    expect(antalAnrop).toBe(3);
    expect(res.status()).toBe(200);
    // attempt 0: base*2^0 = base. attempt 1: base*2^1 = 2*base.
    expect(väntetider).toEqual([TRANSIENT_RETRY_BASE_WAIT_MS, TRANSIENT_RETRY_BASE_WAIT_MS * 2]);
  });

  test('full jitter tillåter 0 (random=0) — INTE additiv-uppåt som Airtable-varianten', () => {
    // Medveten skillnad mot airtable-retry.ts (additiv jitter ovanpå ett
    // DOKUMENTERAT 30s-golv): här finns inget sådant kontrakt att skydda,
    // och AWS "full jitter" (random(0, cap)) är den rekommenderade formen
    // när ingen nedre gräns är given.
    return körMedMätning([502, 200], { random: () => 0 }).then(({ väntetider }) => {
      expect(väntetider).toEqual([0]);
    });
  });

  test('500 (icke-transient server-fel) → INGET omförsök — en genuin regression ska ALDRIG döljas', async () => {
    const { res, väntetider, antalAnrop } = await körMedMätning([500, 200]);

    expect(antalAnrop).toBe(1);
    expect(res.status()).toBe(500); // det ANDRA (200) svaret hämtas aldrig
    expect(väntetider).toHaveLength(0);
  });

  test('400/404/200 passerar alla igenom oförändrade efter första anropet', async () => {
    for (const status of [400, 401, 404, 200]) {
      const { res, antalAnrop } = await körMedMätning([status]);
      expect(antalAnrop).toBe(1);
      expect(res.status()).toBe(status);
    }
  });

  test('idel 502 → ändligt antal anrop (maxRetries + 1), SISTA 502-svaret returneras', async () => {
    const { res, väntetider, antalAnrop } = await körMedMätning([502]);

    // Före denna funktion fanns ingen retry alls (0 omförsök); nu är taket
    // explicit och ändligt — aldrig en oändlig loop.
    expect(antalAnrop).toBe(TRANSIENT_RETRY_MAX_RETRIES + 1);
    expect(väntetider).toHaveLength(TRANSIENT_RETRY_MAX_RETRIES);
    expect(res.status()).toBe(502); // felet propageras — döljs ALDRIG
  });

  test('default-taket är 3 — tre extra anrop utöver det första', () => {
    expect(TRANSIENT_RETRY_MAX_RETRIES).toBe(3);
  });

  test('maxRetries=0 → noll omförsök, ger upp direkt vid transient status', async () => {
    const { res, väntetider, antalAnrop } = await körMedMätning([502, 200], { maxRetries: 0 });

    expect(antalAnrop).toBe(1);
    expect(väntetider).toHaveLength(0);
    expect(res.status()).toBe(502);
  });

  test('anpassad baseWaitMs respekteras i backoff-beräkningen', async () => {
    const { väntetider } = await körMedMätning([502, 200], { baseWaitMs: 1000, random: () => 1 });
    expect(väntetider).toEqual([1000]);
  });
});
