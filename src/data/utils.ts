/**
 * [GA] Nätverksresiliens för alla Airtable/Edge-Function-anrop.
 *
 * Strategi:
 * - Nätverksfel (fetch throw) → retry
 * - 5xx-statusar → retry (server-fel kan vara tillfälligt)
 * - 4xx-statusar → returnera direkt (klient-fel: auth, validering — meningslöst att retrya)
 * - 2xx/3xx → returnera direkt
 *
 * Backoff: exponentiell med jitter.
 *   försök 0: 0ms
 *   försök 1: 200ms ± jitter
 *   försök 2: 400ms ± jitter
 *   försök 3: 800ms ± jitter
 * Jitter randomiserar mellan 0 och baseDelay/2 för att undvika thundering herd.
 */

export interface FetchWithRetryOptions {
  /** Max antal retries (exklusive första försöket). Default: 3 → totalt 4 försök. */
  maxRetries?: number;
  /** Basfördröjning i ms. Default: 200. */
  baseDelay?: number;
  /**
   * Injicerbar fetch-funktion (för tester). Default: global `fetch`.
   */
  fetchImpl?: typeof fetch;
  /**
   * Injicerbar sleep-funktion (för tester). Default: setTimeout.
   */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const { maxRetries = 3, baseDelay = 200, fetchImpl = fetch, sleep = defaultSleep } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchImpl(input, init);

      if (res.status >= 500 && res.status < 600 && attempt < maxRetries) {
        lastError = new Error(`HTTP ${res.status}`);
      } else {
        return res;
      }
    } catch (err) {
      lastError = err;
      if (attempt >= maxRetries) {
        throw err;
      }
    }

    const delay = baseDelay * 2 ** attempt + Math.random() * (baseDelay / 2);
    await sleep(delay);
  }

  throw lastError instanceof Error ? lastError : new Error('fetchWithRetry: gav upp efter retries');
}
