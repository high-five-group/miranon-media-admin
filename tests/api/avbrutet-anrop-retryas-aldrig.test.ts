// TASK-451.4 — api-pure (ren logik, ingen staging, inga creds, ingen browser,
// inget UI). RÖTT-FÖRST-testet för AC #1/#3
// (docs/research/kallstarten-diagnoskarta-2026-09-18.md § 1.7, § 6 punkt 5–6).
//
// ── VARFÖR DENNA FIL ÄR SKILD FRÅN `hamtningens-tidsgrans.test.ts` ──────────
//
// Denna fil importerar MEDVETET bara `fetchWithRetry` — inte `medTidsgrans`,
// `TidsgransFel` eller `HAMTNINGENS_TIDSGRANS_MS`. Skälet är att den ska kunna
// köras VERBATIM mot koden FÖRE fixen: de tre övriga symbolerna existerar inte
// i `ab6b2127` (TASK-451.3:s merge-commit, denna skivas bas), så en testfil som
// importerade dem hade fallit på ett MODULFEL i stället för på det BETEENDE
// som är buggen. Ett import-fel är inget rött-först-bevis; det bevisar bara att
// en symbol saknas.
//
// Mätt rött mot `ab6b2127`s `src/data/utils.ts` (kommandot står i PR-kroppen):
// `anrop` blev 4 i stället för 1 — det gamla `fetchWithRetry` saknade varje
// kännedom om `init.signal` och retryade därför ett AVBROTT som om det vore ett
// transient nätverksfel, med full backoff mellan försöken. Det är dubbelt fel:
// omförsöken kan per definition inte lyckas (signalen är redan abortad), och om
// signalen någonsin hade burit en tidsgräns hade värsta väggtiden blivit
// `maxRetries + 1` gånger gränsen i stället för gränsen.

import { expect, test } from '@playwright/test';
import { fetchWithRetry } from '../../src/data/utils';

/**
 * En `fetch`-stub som aldrig svarar av sig själv men respekterar `signal`
 * precis som en riktig `fetch` (WHATWG Fetch § "abort fetch": begäran avvisas
 * med signalens abort-reason). Räknar sina anrop — det är talet som skiljer
 * före och efter fixen.
 */
function hangandeFetch(): { impl: typeof fetch; anrop: () => number } {
  let anrop = 0;
  const impl = ((_input: RequestInfo | URL, init?: RequestInit) => {
    anrop += 1;
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) return;
      if (signal.aborted) {
        reject(signal.reason);
        return;
      }
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  }) as unknown as typeof fetch;
  return { impl, anrop: () => anrop };
}

test.describe('Ett avbrutet anrop retryas ALDRIG (AC #3 — rött-först mot ab6b2127)', () => {
  test('abort MITT I ett pågående försök ⇒ exakt 1 nätverksanrop, inte 4', async () => {
    const { impl, anrop } = hangandeFetch();
    // Ren `AbortController` — samma form TanStack Query själv använder i
    // `Query#fetch()` (källäst, query-core 5.102.2 `query.js`) och samma form
    // `medTidsgrans` bygger på. Ingen ny symbol från fixen behövs här.
    const styrning = new AbortController();
    setTimeout(() => styrning.abort(new Error('avbrutet av tidsgränsen')), 20);

    const fel = await fetchWithRetry(
      'https://exempel.invalid/get-events',
      { signal: styrning.signal },
      { fetchImpl: impl },
    ).then(
      () => null,
      (e: unknown) => e,
    );

    expect(fel).toBeInstanceOf(Error);
    expect((fel as Error).message).toMatch(/avbrutet av tidsgränsen/);

    // ══ DETTA ÄR MÄTPUNKTEN ══
    // FÖRE fixen (ab6b2127): 4 — `fetchWithRetry` fångade abort-felet i sin
    // catch, såg inte att signalen var abortad, sov 200/400/800 ms och försökte
    // igen tre gånger mot en signal som aldrig kunde bli oabortad.
    // EFTER fixen: 1 — kontrollen `if (signal?.aborted) throw err` ger upp
    // direkt, och kontrollen i loopens början hindrar att backoff-sömnen ens
    // kostar ett extra försök.
    expect(anrop()).toBe(1);
  });

  test('REDAN abortad signal ⇒ NOLL nätverksanrop', async () => {
    const { impl, anrop } = hangandeFetch();
    const styrning = new AbortController();
    styrning.abort(new Error('avbrutet innan start'));

    await expect(
      fetchWithRetry(
        'https://exempel.invalid/get-events',
        { signal: styrning.signal },
        {
          fetchImpl: impl,
        },
      ),
    ).rejects.toThrow(/avbruten|avbrutet/);

    // FÖRE fixen: 1 (fetchen startades och rejectade omedelbart) — och sedan
    // ytterligare 3 omförsök, alltså 4. EFTER fixen: 0, kontrollen i loopens
    // början fäller innan transporten rörs alls.
    expect(anrop()).toBe(0);
  });

  test('utan signal är beteendet OFÖRÄNDRAT — 5xx retryas fortfarande fyra gånger', async () => {
    // Skyddsräcke mot att fixen tystade den legitima retryn: varje anropsväg
    // som INTE skickar en signal (t.ex. `postEdgeFunction`, alla mutationer)
    // ska bete sig exakt som före skivan.
    let anrop = 0;
    const impl = ((_i: RequestInfo | URL, _init?: RequestInit) => {
      anrop += 1;
      return Promise.resolve(new Response('serverfel', { status: 503 }));
    }) as unknown as typeof fetch;

    await expect(
      fetchWithRetry('https://exempel.invalid/x', undefined, {
        fetchImpl: impl,
        sleep: () => Promise.resolve(),
      }),
    ).resolves.toHaveProperty('status', 503);

    expect(anrop).toBe(4); // maxRetries 3 + första försöket, precis som förut
  });
});
