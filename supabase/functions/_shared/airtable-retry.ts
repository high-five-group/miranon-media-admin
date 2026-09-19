/**
 * 429-backoff mot Airtables DOKUMENTERADE lockout-kontrakt (TASK-53, katalogpost P4).
 *
 * Airtable är explicit: *"If you exceed these rates, you will receive a 429 status code and
 * will need to wait 30 seconds before subsequent requests will succeed."*
 * (https://airtable.com/developers/web/api/rate-limits, verifierad 2026-07-31.)
 *
 * Fram till TASK-53 väntade klienten **1 sekund** på tre ställen i `airtable-client.ts` och
 * försökte igen — 30× för kort. Omförsöken föll då INOM lockout-fönstret, fick nya 429:or och
 * FÖRLÄNGDE lockouten i stället för att invänta den. Loopen hade dessutom inget tak, så en enda
 * överskridning kunde bli en obegränsad serie misslyckade anrop. Defekten var latent: under
 * 5 req/s-taket manifesterar den sig inte alls, vilket är varför den kunde leva.
 *
 * ## Varför en egen modul och inte tre kopior
 *
 * Tre call-sites (`fetchFromAirtable`, `fetchAirtablePage`, `fetchAirtableRecord`) delade samma
 * copy-pastade block. En enda implementation är det som gör "alla tre väntar lika" till en
 * egenskap hos koden i stället för ett påstående om den. Modulen är dessutom medvetet
 * **Deno-fri** (ingen `Deno.env`, ingen global `fetch`) — `airtable-client.ts` går inte att
 * importera från `tests/` utan att typecheck faller på `Cannot find name 'Deno'` (mätt: 7 st
 * TS2304). Retry-logiken hade därmed varit oåtkomlig för det enhetstest AC #2 kräver.
 *
 * ## Backoff-formen: exponentiellt med 30 s som GOLV, jitter enbart uppåt
 *
 * Kortet lämnade valet öppet mellan (a) rak 30 s fast väntan och (b) exponentiell backoff med
 * 30 s som golv. Vi valde (b) med jitter: 30 s fast över tre helpers riskerar att synkronisera
 * omförsök från parallella anrop till samma sekund och därmed återskapa bursten — särskilt
 * relevant eftersom 5 req/s-budgeten är DELAD över alla samtidiga klienter (P4 andra
 * manifestationen + P26), så flera klienter träffar lockouten samtidigt och skulle vakna
 * samtidigt.
 *
 * Jittern är **additiv uppåt** (`[temp, temp * 1.25)`), aldrig subtraktiv. Det är inte en
 * stilfråga: AWS klassiska "equal jitter" (`temp/2 + random(0, temp/2)`) kan ge en väntan under
 * basen, vilket här hade brutit det dokumenterade 30 s-kontraktet och återinfört exakt den
 * defekt kortet finns för att laga. Ett hårt undre kontrakt tillåter bara jitter över golvet.
 * Riktningen speglar husmönstret i `src/data/utils.ts` (`fetchWithRetry`, ADR-006), som också
 * lägger jittern ovanpå basen; andelen skiljer sig eftersom basen här är 150× större.
 *
 * ## Taket är härlett ur Edge Function-gränsen, inte valt på känsla
 *
 * Supabase Edge Functions har `Request idle timeout: 150s` (504 Gateway Timeout om inget svar
 * hunnit skickas) och wall clock 150 s free / 400 s paid
 * (https://supabase.com/docs/guides/functions/limits, verifierad 2026-07-31). Med basen 30 s:
 *
 * | Tak | Värsta total väntan | Ryms i 150 s idle timeout |
 * |---|---|---|
 * | 1 omförsök | 37,5 s | ja, med stor marginal |
 * | **2 omförsök (valt)** | **112,5 s** (37,5 + 75) | ja, ~37 s marginal |
 * | 3 omförsök | 262,5 s | **nej** — 504 i stället för ett ärligt fel |
 *
 * Två omförsök är alltså det största tak som ryms. Ett omförsök hade räckt om Airtables 30 s
 * vore en garanti, men vid parallella körningar mot delad budget (P26) kan basen fortfarande
 * vara låst av ANDRA klienter när vi vaknar — det är scenariot det andra omförsöket bär.
 *
 * ⚠️ Budgeten är PER ANROP. En full-walk över många sidor som möter 429 på flera sidor kan
 * summera över idle timeout. Det är ett existerande förhållande som denna modul förbättrar men
 * inte löser (dagens oändliga 1 s-loop var strikt värre: 150 varv innan samma timeout).
 * Strukturell lösning hör till Fas E — Postgres har ingen per-bas-throttle (P4 Fas E-krav).
 *
 * ## Strukturerad 429-loggning (TASK-459)
 *
 * `get-events`/`get-registrations` mättes (task-451.6) enbart som EN extern väggtid per
 * anrop — ingen intern instrumentering fanns, så en 429-lockout (denna moduls 30–90 s
 * väntan) syntes bara indirekt som ett ovanligt långt anrop, omöjlig att skilja från en
 * genuint långsam Airtable-sida. `withAirtable429Retry` loggar därför nu EXPLICIT, per
 * försök: `airtable_429_retry` (vilket försök, vald backoff i ms) och — när taket är
 * uttömt — `airtable_429_exhausted`. Formen är strukturerad JSON (`errors.ts:110`-mönstret)
 * så Supabase Logs Explorer kan filtrera/parsa `event_message` utan en ny extern mätrigg
 * (AC #2). `logContext` (helper + tabell, satt av `airtable-client.ts`) slås samman in i
 * varje rad så en 429 går att koppla till VILKET anrop som mötte taket. `log` är injicerbar
 * (default: `console.warn(JSON.stringify(...))`) enbart så testet kan fånga raderna utan att
 * skriva till stdout — se `tests/api/airtable-retry.test.ts`. INGEN av delarna rör backoff-
 * logiken eller svarskontraktet ovan; modulen förblir Deno-fri (`console` är en
 * webbstandard-global, inte en Deno-specifik API, se § Varför en egen modul ovan).
 *
 * ## Anropsattribuering är PLATTFORMENS jobb, inte en egen kod-nyckel (TASK-459 runda 2, fynd 1)
 *
 * `logContext` (`{helper, table}`) räcker INTE för att räkna 429:or PER EDGE FUNCTION — paret
 * är delat mellan flera anropare: `fetchAirtableRecord('Eventplanering', …)` anropas av BÅDE
 * `get-event`, `get-attendance` OCH `get-registrations` (disk-verifierat, granskningsrunda 1
 * på PR #2570). Lägg ALDRIG till en egen funktions-nyckel här för att lösa det — Supabase
 * `function_logs`-källan bär redan `metadata.function_id` (unikt per deployad Edge Function)
 * och `metadata.execution_id` (unikt per invokering/anrop) på VARJE rad, utan kodändring
 * härifrån (verifierat mot `supabase.com/docs/guides/observability/log-field-reference`,
 * 2026-09-19 — ClickHouse-vägen är bracket-notation: `log_attributes['function_id']` resp.
 * `log_attributes['execution_id']`; `execution_id` finns ENDAST i `function_logs`, inte i
 * `function_edge_logs`). Slå upp funktionens ID i STAGING med `supabase functions list
 * --project-ref <staging-ref>` (ALDRIG prod-ref i ett kommando), filtrera SQL-frågan på det
 * ID:t, och räkna 429:or `group by log_attributes['execution_id']` för att skilja "flera
 * omförsök inom SAMMA anrop" från flera separata drabbade hämtningar. Full körbar SQL:
 * PR #2570-kroppens § Mätanvisning.
 *
 * ## `callAirtableWithTiming` flyttad hit, alltid loggad (TASK-459 runda 2, fynd 2)
 *
 * Funktionen bodde ursprungligen i `airtable-client.ts` och mätte/loggade `airtable_call`
 * EFTER `await withAirtable429Retry(...)` — kastade `send()` (nätverksfel, timeout, DNS) i
 * stället för att resolva ett HTTP-svar (429 hanteras redan: `fetch` RESOLVAR då, kastar
 * inte), propagerade felet UTAN att den anropets varaktighet någonsin loggades. Flyttad hit
 * av SAMMA skäl som `withAirtable429Retry` självt under TASK-53 (§ Varför en egen modul
 * ovan): `airtable-client.ts` rör `Deno.env` direkt och är därför otestbar från
 * `tests/api/*.test.ts` utan att fälla `npm run typecheck` (TS2304 på `Deno`) — ett
 * rött-först-test av "kastat send() ska ändå logga" krävde antingen den flytten eller ett
 * nytt `scripts/test-*.mjs`-grindvaktsskript wirat i `ci.yml`, vilket låg utanför denna
 * skivas scope. `try/finally` garanterar att raden ALLTID skrivs: `status: 'thrown'` skiljer
 * ett kastat fel från ett HTTP-svar, och `errorType` bär feltypens NAMN (`err.name`), ALDRIG
 * dess fulla meddelandetext (kan bära URL:er/`filterByFormula`-uttryck — repot är publikt).
 * Kontrollflödet är oförändrat: samma fel propagerar vidare ORÖRT (`throw err` i `catch`,
 * ingen wrapping, ingen ny typ). `airtable-client.ts` importerar funktionen härifrån nu —
 * samma tre call-sites (`fetchFromAirtable`, `fetchAirtablePage`, `fetchAirtableRecord`),
 * identiskt beteende för den lyckade vägen.
 */

/**
 * Airtables dokumenterade lockout efter 429 — golvet för FÖRSTA omförsöket.
 * Ändra inte utan att dokumentationen ändrats: talet är ett kontrakt, inte en tuning-parameter.
 */
export const AIRTABLE_429_BASE_WAIT_MS = 30_000;

/** Tak på antal omförsök UTÖVER första försöket. Härlett ur EF:ens idle timeout, se ovan. */
export const AIRTABLE_429_MAX_RETRIES = 2;

/** Jitter-andel ovanpå väntetiden. Alltid additiv uppåt → väntan hamnar aldrig under golvet. */
export const AIRTABLE_429_JITTER_RATIO = 0.25;

/**
 * Väntetid före omförsök nummer `attempt` (0-baserat: 0 = första omförsöket).
 *
 * `base * 2^attempt` + jitter i `[0, base * 2^attempt * ratio)`. Resultatet är därmed alltid
 * `>= AIRTABLE_429_BASE_WAIT_MS` för attempt 0 — det dokumenterade kravet.
 *
 * `random` är injicerbar enbart för att testet ska kunna bevisa de exakta intervallgränserna
 * deterministiskt (0 → golvet, ~1 → taket) i stället för att sampla sig fram till dem.
 */
export function airtable429BackoffMs(attempt: number, random: () => number = Math.random): number {
  const base = AIRTABLE_429_BASE_WAIT_MS * 2 ** attempt;
  return base + random() * base * AIRTABLE_429_JITTER_RATIO;
}

export interface Airtable429RetryOptions {
  /** Max antal omförsök utöver första försöket. Default: `AIRTABLE_429_MAX_RETRIES` (2). */
  maxRetries?: number;
  /** Injicerbar sleep (tester mäter väntetiden här). Default: `setTimeout`. */
  sleep?: (ms: number) => Promise<void>;
  /** Injicerbar slumpkälla för jittern (tester). Default: `Math.random`. */
  random?: () => number;
  /**
   * Metadata som slås samman in i varje 429-loggrad (TASK-459) — t.ex. `{ helper:
   * 'fetchFromAirtable', table: 'Eventplanering' }`. Ren spårbarhet, påverkar aldrig
   * backoff-beslutet. Default: `{}` (raden loggas ändå, bara utan anropskontext).
   */
  logContext?: Record<string, unknown>;
  /**
   * Injicerbar logg-sink (TASK-459). Default: `console.warn(JSON.stringify(record))` —
   * samma strukturerade-JSON-mönster som `_shared/errors.ts:110`. Enbart till för att
   * testet ska kunna fånga raderna utan att skriva till stdout.
   */
  log?: (record: Record<string, unknown>) => void;
}

const defaultSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const defaultLog = (record: Record<string, unknown>): void => {
  console.warn(JSON.stringify(record));
};

/**
 * Kör `send` och gör om anropet vid HTTP 429, med Airtable-konform backoff och ett hårt tak.
 *
 * Returnerar det FÖRSTA icke-429-svaret. Är taket uttömt returneras det sista 429-svaret som
 * det är — callern faller då genom sin vanliga `!res.ok`-gren och kastar `Airtable 429: …`.
 * Det medvetna valet bevarar klientens befintliga felkontrakt exakt: den som ger upp ändrar
 * inte felets FORM, bara det faktum att uppgivandet nu sker efter ett ändligt antal försök.
 *
 * `send` måste vara idempotent — den anropas upp till `maxRetries + 1` gånger. Alla tre
 * call-sites är GET-anrop, så det håller.
 */
export async function withAirtable429Retry(
  send: () => Promise<Response>,
  options: Airtable429RetryOptions = {},
): Promise<Response> {
  const {
    maxRetries = AIRTABLE_429_MAX_RETRIES,
    sleep = defaultSleep,
    random = Math.random,
    logContext = {},
    log = defaultLog,
  } = options;

  for (let attempt = 0; ; attempt++) {
    const res = await send();

    if (res.status !== 429) {
      return res;
    }

    if (attempt >= maxRetries) {
      // TASK-459: EXPLICIT rad när taket är uttömt — utan den syns ett uttömt 429-tak bara
      // indirekt, som ett fel längre upp i anropskedjan utan tidsstämpel på VAR budgeten tog slut.
      log({
        level: 'warn',
        event: 'airtable_429_exhausted',
        maxRetries,
        attempt: attempt + 1,
        ...logContext,
      });
      return res;
    }

    const waitMs = airtable429BackoffMs(attempt, random);
    // TASK-459: EXPLICIT rad per 429-svar (helper/tabell via logContext, försök-nr, vald
    // backoff i ms) — se filhuvudet § Strukturerad 429-loggning för varför.
    log({
      level: 'warn',
      event: 'airtable_429_retry',
      attempt: attempt + 1,
      maxRetries,
      waitMs: Math.round(waitMs),
      ...logContext,
    });

    // Släpp svarskroppen innan omförsöket. En icke-konsumerad body läcker resurser i Deno, och
    // vi kommer aldrig att läsa detta 429-svar — bara det sista behöver sin body (callern läser
    // den för felmeddelandet). Kastar cancel() (t.ex. redan låst body) är det ofarligt här.
    try {
      await res.body?.cancel();
    } catch {
      /* body redan konsumerad eller stängd — inget att städa */
    }

    await sleep(waitMs);
  }
}

const defaultInfoLog = (record: Record<string, unknown>): void => {
  console.info(JSON.stringify(record));
};

export interface CallAirtableWithTimingOptions {
  /**
   * Injicerbar logg-sink för `airtable_call`-raden (tester). Default:
   * `console.info(JSON.stringify(record))` — samma mönster som `defaultLog` ovan, fast
   * info-nivå (detta är INTE en 429-varning, se `defaultLog`/`defaultWarn`-motsvarigheten).
   */
  log?: (record: Record<string, unknown>) => void;
}

/**
 * Timing- och loggningswrapper runt EN Airtable-läsning (TASK-459 AC #1; flyttad hit och
 * härdad mot kastade fel i runda 2, fynd 2 — se filhuvudet § `callAirtableWithTiming` flyttad
 * hit, alltid loggad ovan för hela resonemanget).
 *
 * Central placering — de tre läs-helperna i `airtable-client.ts` (`fetchFromAirtable`,
 * `fetchAirtablePage`, `fetchAirtableRecord`) ropar alla via DENNA funktion i stället för
 * `withAirtable429Retry` direkt, så VARJE anropare (och alla framtida `get-*`-EF:er som
 * delar samma kärna) ärver per-anrops-loggningen gratis.
 *
 * `try/finally`: raden loggas ALLTID — vid ett lyckat HTTP-svar (`status` = statuskoden) OCH
 * när `send()` kastar (`status: 'thrown'`, `errorType` = feltypens namn, ALDRIG dess fulla
 * meddelandetext). Felet kastas vidare OFÖRÄNDRAT (`catch { …; throw err }`, ingen wrapping,
 * ingen ny typ) — kontrollflöde och returvärde för den lyckade vägen är identiska med före
 * denna ändring.
 */
export async function callAirtableWithTiming(
  helper: string,
  table: string,
  send: () => Promise<Response>,
  options: CallAirtableWithTimingOptions = {},
): Promise<Response> {
  const { log = defaultInfoLog } = options;
  const start = Date.now();
  let res: Response | undefined;
  let errorType: string | undefined;
  try {
    res = await withAirtable429Retry(send, { logContext: { helper, table } });
    return res;
  } catch (err) {
    // TASK-459 runda 2 (fynd 2): feltyp/namn, ALDRIG felmeddelandets fulla text — den kan
    // bära URL:er/filterByFormula-uttryck (repot är publikt).
    errorType = err instanceof Error ? err.name : typeof err;
    throw err;
  } finally {
    const durationMs = Date.now() - start;
    log({
      level: 'info',
      event: 'airtable_call',
      helper,
      table,
      status: res !== undefined ? res.status : 'thrown',
      ...(errorType !== undefined ? { errorType } : {}),
      durationMs,
    });
  }
}
