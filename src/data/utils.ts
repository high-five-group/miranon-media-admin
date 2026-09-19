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
 * ## Gränsens UPPGIFT: att anropet till slut SETTLAR. Inget mer.
 *
 * Den enda egenskap detta tal ska garantera är att ett OBESVARAT anrop
 * avvisas i stället för att hänga tills webbläsarens egen socket-timeout. Det
 * är en sista utväg mot ett tillstånd utan slut — inte en kvalitetsgräns för
 * svarstid, och inte ett löfte till användaren.
 *
 * ANVÄNDARENS VÄNTAN SKYDDAS INTE AV DETTA TAL. Den skyddas av
 * startvärmningens hårda 9 s-gate (`startvarmningen.ts` `DEFAULT_TIMEOUT_MS`,
 * ADR-112 beslut 3), som släpper in Lotta i appen med det som hann bli varmt
 * och som avbryter ingenting. De två talen löser OLIKA problem, och gränsen
 * här får aldrig sättas nära gaten: gjorde vi det skulle vi kapa precis de
 * hämtningar som i dag landar EFTER timeout-släppet och fyller Hem — alltså
 * göra Hem SÄMRE. ADR-112 beslut 3:s fallback bygger på att de får landa.
 *
 * ## Talet är härlett ur det LÅNGSAMMASTE LEGITIMA SVARET, inte ur normal-latens
 *
 * En tidsgräns som skär genom ett lager under sig gör en hämtning som SKULLE
 * ha lyckats till ett fel. Det är precis vad ett tal valt mot normal-latens
 * gör, och det var felet i denna skivas första omgång: 20 000 ms, valt som
 * "~42 % över värsta mätta latens" (14 087,8 ms), låg UNDER Edge
 * Function-lagrets egen 429-återhämtning och kapade alltså läsningar som i
 * dag lyckas. Granskningens runda 1 fynd 1; Marcus beslut 2026-09-19: väg A,
 * klientgränsen läggs ÖVER EF-lagrets tak.
 *
 * Talet härleds därför ur de två gränser som faktiskt bestämmer hur sent ett
 * ÄRLIGT svar kan komma:
 *
 * 1. **Edge Function-lagrets idle timeout: 150 000 ms.** Supabase avbryter en
 *    funktion som inte hunnit skicka något svar inom 150 s och svarar
 *    504 Gateway Timeout (https://supabase.com/docs/guides/functions/limits
 *    — samma källa som `supabase/functions/_shared/airtable-retry.ts`
 *    § "Taket är härlett ur Edge Function-gränsen" bygger sitt eget tak på).
 *    Varje ärligt utfall — ett segt men lyckat svar, eller plattformens eget
 *    504 — anländer alltså vid eller före ~150 s. Ett klient-tak under det
 *    talet gissar där servern strax hade svarat.
 * 2. **Serverns värsta LEGITIMA 429-återhämtning: 112 500 ms**, som ryms i
 *    (1) med avsikt. `AIRTABLE_429_BASE_WAIT_MS` (30 000) och
 *    `AIRTABLE_429_MAX_RETRIES` (2) är kalibrerade mot just 150 s-taket.
 *    Airtables DOKUMENTERADE lockout är 30 s, så en läsning som möter 429
 *    lyckas typiskt först efter ~32-38 s. Den gamla 20 s-gränsen fällde
 *    alltså en hämtning mitt i en pågående, korrekt återhämtning — och ett
 *    manuellt omförsök landade då INUTI lockout-fönstret och förlängde det.
 *
 * `150_000 + 10_000 = 160_000`. Marginalen är inte prydnad: EF:ens 150 s mäts
 * SERVER-sidan, från att begäran nått funktionen. Klientens klocka startar
 * tidigare (DNS, TLS, kö, uppladdning) och stannar senare (kropps-läsningen i
 * `callEdgeFunction`). 10 s absorberar det utan att bli en inbjudan.
 *
 * ## Taket åt ANDRA hållet: budgeten får inte rymma två hela idle-cykler
 *
 * `fetchWithRetry` behandlar ett 504 som vilket 5xx som helst och gör ett
 * omförsök. Efter en gateway-504 vid ~150 s är det omförsöket nästan säkert
 * bortkastat: träffade vi idle timeouten för att Airtable höll oss i lockout
 * pågår den lockouten fortfarande. Budgeten är därför medvetet MINDRE än
 * `2 × 150 000` — omförsöket startar, men kapas av tidsgränsen ~10 s in i
 * stället för att få en hel ny 150 s-cykel. Transportens retry-regel är
 * ORÖRD (den är rätt för ett snabbt 502/503 där ett omförsök faktiskt
 * hjälper); det är BUDGETEN som sätter taket. Båda riktningarna mäts i
 * `tests/api/tidsgrans-mot-serverlagret.test.ts`.
 *
 * ## Invarianten är MEKANISK, inte bara nedskriven
 *
 * Samma testfil importerar BÅDE denna konstant och serverns egna
 * (`airtable-retry.ts`) och HÄRLEDER den värsta 429-väntan ur dem via
 * `airtable429BackoffMs` i stället för att skriva av 112 500. Ändrar någon
 * serverns backoff utan att ändra detta tal FÄLLER testet — invarianten är
 * alltså en egenskap hos koden, inte ett påstående om den.
 *
 * ## Varför ingen Sentry-kanal ser att gränsen fyrat (ADR-083)
 *
 * En tidigare version av detta docblock påstod att gränsen är "observerbar
 * via samma Sentry-kanal som resten av warmup-felen (tagg `delvis-fel`)".
 * Det var FALSKT och fälldes av granskningen. Kanalen kan strukturellt inte
 * se denna felklass:
 *
 * - `delvis-fel` skickas i `startvarmningen.ts` `avgorMed()`, i det ögonblick
 *   gaten avgör (9 s) eller alla items settlat. Ett avbrott vid 160 s
 *   inträffar per definition långt EFTER det — rapporten är redan skickad.
 *   Det är samma ÄRLIGA KANT som `startvarmningen.ts` § "Hård timeout" redan
 *   bokför för alla sena settles, och den blir STRIKT bredare av att talet
 *   höjs från 20 s till 160 s.
 * - Någon annan kanal finns inte: `queryClient` har ingen `QueryCache`-
 *   `onError` (`src/router.ts`), och `reportEdgeFunctionError`
 *   (`src/observability/sentry.ts`) har NOLL anropare (grep, 2026-09-19).
 *
 * Följden, utskriven i stället för bortskriven: talet kan i dag INTE
 * kalibreras om mot telemetri, för telemetrin finns inte. En omprövning
 * kräver antingen en ny mätkanal (egen skiva — INTE byggd här) eller en
 * manuell mätning. Tills dess är 160 000 en HÄRLEDNING ur lagret under, inte
 * en observation av verkligheten.
 */
export const HAMTNINGENS_TIDSGRANS_MS = 160_000;

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
  /**
   * Gränsen som FAKTISKT gäller för denna instans, i ms — det uttryckliga
   * argumentet, eller {@link HAMTNINGENS_TIDSGRANS_MS} när inget gavs.
   *
   * Fältet finns för att defaulten ska gå att BEVISA i stället för att
   * påstås: utan det kan ett test bara konstatera att signalen ännu inte
   * abortats, vilket är sant för vilket tal som helst (granskningens runda 1
   * info-fynd 10). Samma skäl som `airtable429BackoffMs` gör sin `random`
   * injicerbar — en egenskap som ska kunna mätas får inte vara osynlig.
   */
  readonly tidsgransMs: number;
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
 *    Ett anrop som klarade sig på 300 ms hade ändå hållit en timer hela
 *    gränsen ut — sedan runda 2 alltså i 160 s, vilket gör skälet starkare,
 *    inte svagare. Appen gör sju warmup-hämtningar plus Hems 60 s-poll; den
 *    formen ackumulerar. `clearTimeout` i {@link Tidsgrans.stang} städar
 *    exakt.
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
    tidsgransMs,
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

      // 5xx retryas — INKLUSIVE 504. Det är avsiktligt och medvetet OFÖRÄNDRAT
      // (TASK-451.4 runda 2, uppdragets punkt 3):
      //
      // Ett 504 kan komma från två håll. Ett snabbt 502/503/504 från kanten
      // (kall funktion, deploy, transient proxyfel) är exakt det fall ett
      // omförsök löser, och den regeln ska inte offras. Ett 504 som kommer
      // efter Edge Function-lagrets IDLE TIMEOUT (~150 s) är däremot nästan
      // säkert bortkastat att försöka om: träffade vi den gränsen för att
      // Airtable höll oss i lockout pågår lockouten fortfarande.
      //
      // Att skilja de två åt kräver en klocka som transporten inte har (den
      // ser en status, inte hur länge lagret under arbetat). Lösningen ligger
      // därför i BUDGETEN, inte i denna regel: `HAMTNINGENS_TIDSGRANS_MS`
      // (160 s) är medvetet mindre än två hela idle-cykler, så det sena
      // omförsöket startar men kapas efter ~10 s i stället för att få en ny
      // 150 s-cykel. Se den konstantens § "Taket åt ANDRA hållet" och
      // `tests/api/tidsgrans-mot-serverlagret.test.ts`.
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
