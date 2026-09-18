/**
 * [GA] Nätverksresiliens för alla Airtable/Edge-Function-anrop.
 *
 * Strategi:
 * - Nätverksfel (fetch throw) → retry
 * - 5xx-statusar → retry (server-fel kan vara tillfälligt)
 * - 4xx-statusar → returnera direkt (klient-fel: auth, validering — meningslöst att retrya)
 * - 2xx/3xx → returnera direkt
 * - AVBRUTET anrop (`init.signal` abortad) → kasta direkt, ALDRIG retry (TASK-451.4)
 *
 * Backoff: exponentiell med jitter.
 *   försök 0: 0ms
 *   försök 1: 200ms ± jitter
 *   försök 2: 400ms ± jitter
 *   försök 3: 800ms ± jitter
 * Jitter randomiserar mellan 0 och baseDelay/2 för att undvika thundering herd.
 *
 * ## Tidsgränsen (TASK-451.4, diagnoskartans § 1.7 + § 6 punkt 5)
 *
 * FÖRE denna skiva fanns ingen `AbortController` någonstans i klienten: en
 * Edge Function som aldrig svarade hängde tills webbläsarens egen
 * socket-timeout, och det enda som räddade användaren var startvärmningens
 * hårda 9 s-gate (ADR-112 beslut 3). Den gaten släpper in användaren men
 * AVBRYTER INGENTING (`startvarmningen.ts` § "Hård timeout") — hämtningen
 * lever vidare, och sedan `TASK-451.3` VÄNTAR Hem på exakt den hämtningen
 * (`delaMedListan`). En hängande EF gav därför en Hem-skeleton utan slut.
 *
 * {@link medTidsgrans} + {@link HAMTNINGENS_TIDSGRANS_MS} stänger det:
 * `callEdgeFunction` (`src/data/config/supabase-client.ts`) bygger en signal
 * per LÄS-anrop och skickar den hit som `init.signal`. Budgeten gäller HELA
 * anropet inklusive omförsöken — inte per försök — så värsta väggtiden är
 * tidsgränsen, inte `maxRetries + 1` gånger den.
 */

/**
 * Tidsgräns per adapter-HÄMTNING (AC #2: "värdet bor på ETT ställe").
 *
 * ## Varför 20 000 ms, och varför det INTE är samma tal som warmup-gatens 9 s
 *
 * De två gränserna löser OLIKA problem och får därför inte vara samma tal:
 *
 * - **Warmup-gatens 9 s** (`startvarmningen.ts` `DEFAULT_TIMEOUT_MS`,
 *   ADR-112 beslut 3) skyddar ANVÄNDARENS väntan: den släpper in Lotta i
 *   appen med det som hann bli varmt. Den avbryter ingen hämtning.
 * - **Denna gräns** skyddar HÄMTNINGEN: den garanterar att ett anrop som
 *   aldrig besvaras till slut settlar, så att det räknas som misslyckat
 *   (`startvarmningen.ts` `misslyckade`, TASK-451.2) i stället för att hänga
 *   för evigt och ta Hems delade hämtning med sig.
 *
 * Gränsen får därför INTE sättas ≤ 9 s. Gjorde vi det skulle vi kapa precis
 * de hämtningar som i dag landar EFTER timeout-släppet och fyller Hem — alltså
 * göra Hem SÄMRE. ADR-112 beslut 3:s fallback ("resterande ytor bär sina
 * vanliga laddlägen") bygger på att de hämtningarna får landa.
 *
 * ## Talet mot mätdata
 *
 * `docs/research/startvarmningen-batch1-kall-latens-2026-09-18.md`, mätt mot
 * staging:
 *
 * | Anrop | Stabil delserie (§ 4.2) | Värsta mätta (§ 2.2) |
 * |---|---|---|
 * | `get-events` | 2 259,9–2 331,6 ms | **14 087,8 ms** |
 * | `get-registrations` | 1 062,7–1 132,6 ms | 1 739,6 ms |
 *
 * 20 000 ms ligger ~42 % över det VÄRSTA enskilda anrop som någonsin mätts i
 * denna kodbas. Gränsen kapar alltså ingen hämtning som historiskt har
 * lyckats; den fäller bara det som är genuint hängande. Prod-härledningen i
 * samma dok (§ 6: `get-registrations` ~9 sekventiella sidor mot stagings 2)
 * pekar mot högre prod-latens än stagings, vilket är exakt varför marginalen
 * är tilltagen i stället för snäv.
 *
 * Talet är en ÖPPET DEKLARERAD startbedömning mot mätdata, inte ett
 * kalibrerat optimum: ingen mätning finns än av hur ofta gränsen faktiskt
 * fyrar i prod. Skulle den visa sig fyra på legitim trafik är den observerbar
 * via samma Sentry-kanal som resten av warmup-felen (tagg `delvis-fel`,
 * TASK-451.2) och ska då omprövas mot den mätningen, aldrig mot en känsla.
 */
export const HAMTNINGENS_TIDSGRANS_MS = 20_000;

/**
 * Kastas när {@link medTidsgrans} fäller ett anrop på tid.
 *
 * Egen klass, inte en naken `DOMException`: den skiljer "vi gav upp på tid"
 * från "TanStack Query avbröt frågan" (query-cancel bär i stället routerns/
 * observerns egen abort-reason). Skillnaden är läsbar både i
 * `fetchWithRetry`s beslut att inte retrya och i felet som når
 * startvärmningens `misslyckade`-räkning.
 */
export class TidsgransFel extends Error {
  readonly tidsgransMs: number;

  constructor(tidsgransMs: number) {
    super(`Hämtningen avbröts: inget svar inom ${tidsgransMs} ms`);
    this.name = 'TidsgransFel';
    this.tidsgransMs = tidsgransMs;
    // Samma prototyp-återställning som EdgeFunctionError/AuthError — krävs för
    // att `instanceof` ska hålla över alla TS-transpilations-targets.
    Object.setPrototypeOf(this, TidsgransFel.prototype);
  }
}

/** Vad {@link medTidsgrans} returnerar. `stang()` MÅSTE anropas i ett
 * `finally` — annars lever timern kvar hela tidsgränsen ut även för ett
 * anrop som klarade sig på 300 ms. */
export interface Tidsgrans {
  signal: AbortSignal;
  stang(): void;
}

/**
 * Kombinerar en valfri YTTRE signal (TanStack Querys `queryFn`-kontext) med
 * en egen tidsgräns, och returnerar EN signal som fäller på det som inträffar
 * först.
 *
 * ## Varför handrullat och inte `AbortSignal.any([s, AbortSignal.timeout(n)])`
 *
 * MDN dokumenterar exakt detta mönster på `AbortSignal.any()`-sidan
 * (hämtad 2026-09-18), och det är mönstret vi implementerar. Tre konkreta
 * skäl att göra det för hand i stället för att anropa de två statiska
 * metoderna:
 *
 * 1. **`AbortSignal.any()` är Baseline "newly available" sedan mars 2024**
 *    (MDN, samma sida). Vite transpilerar SYNTAX, aldrig API-anrop, så ett
 *    direktanrop hade kastat `TypeError` på en webbläsare utan metoden i
 *    stället för att degradera. `AbortController` + `addEventListener` är
 *    Baseline sedan flera år och bär noll stödrisk.
 * 2. **`AbortSignal.timeout()` lämnar en timer som inte går att avbryta.**
 *    Ett anrop som klarade sig på 300 ms hade ändå hållit en timer i 20 s.
 *    Appen gör sju warmup-hämtningar plus Hems 60 s-poll; den formen
 *    ackumulerar. `clearTimeout` i {@link Tidsgrans.stang} städar exakt.
 * 3. **Abort-reason blir vår egen.** {@link TidsgransFel} går att skilja från
 *    en query-cancel nedströms; `AbortSignal.timeout()` ger en generisk
 *    `TimeoutError`-DOMException.
 *
 * Den yttre signalens reason vidarebefordras ORÖRD (samma semantik som
 * MDN beskriver för `AbortSignal.any()`: "the reason of the first signal that
 * is aborted"), så en query-cancel fortfarande ser ut som en query-cancel.
 */
export function medTidsgrans(
  yttreSignal?: AbortSignal,
  tidsgransMs: number = HAMTNINGENS_TIDSGRANS_MS,
): Tidsgrans {
  const styrning = new AbortController();

  const timer = setTimeout(() => {
    styrning.abort(new TidsgransFel(tidsgransMs));
  }, tidsgransMs);

  let slutaLyssna: (() => void) | undefined;

  if (yttreSignal) {
    if (yttreSignal.aborted) {
      styrning.abort(yttreSignal.reason);
    } else {
      const vidYttreAvbrott = () => styrning.abort(yttreSignal.reason);
      yttreSignal.addEventListener('abort', vidYttreAvbrott, { once: true });
      slutaLyssna = () => yttreSignal.removeEventListener('abort', vidYttreAvbrott);
    }
  }

  return {
    signal: styrning.signal,
    stang() {
      clearTimeout(timer);
      slutaLyssna?.();
    },
  };
}

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
  // TASK-451.4: tidsgränsens/query-cancelns signal. Se filhuvudets
  // § "Tidsgränsen" — budgeten gäller HELA anropet, alla försök tillsammans.
  const signal = init?.signal;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Avbrutet FÖRE försöket (tidsgränsen löste ut under föregående backoff-
    // sömn, eller anroparen avbröt) — ge upp direkt. Utan denna kontroll hade
    // en abort mitt i sömnen ändå kostat ett helt extra nätverksförsök.
    if (signal?.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new Error('Hämtningen avbröts innan den hann slutföras');
    }

    try {
      const res = await fetchImpl(input, init);

      if (res.status >= 500 && res.status < 600 && attempt < maxRetries) {
        lastError = new Error(`HTTP ${res.status}`);
      } else {
        return res;
      }
    } catch (err) {
      lastError = err;
      // AVBRUTET anrop retryas ALDRIG (AC #3): `fetch` avvisar med signalens
      // egen reason, alltså TidsgransFel vid tidsgräns. Ett omförsök hade
      // antingen fällt omedelbart på samma abortade signal eller — värre, om
      // signalen någonsin byttes ut — multiplicerat tidsgränsen med antalet
      // försök. Felet propageras orört så anroparen ser VARFÖR det gav upp.
      if (signal?.aborted) {
        throw err;
      }
      if (attempt >= maxRetries) {
        throw err;
      }
    }

    const delay = baseDelay * 2 ** attempt + Math.random() * (baseDelay / 2);
    await sleep(delay);
  }

  throw lastError instanceof Error ? lastError : new Error('fetchWithRetry: gav upp efter retries');
}
