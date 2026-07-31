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
}

const defaultSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

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
  } = options;

  for (let attempt = 0; ; attempt++) {
    const res = await send();

    if (res.status !== 429) {
      return res;
    }

    if (attempt >= maxRetries) {
      console.warn(
        `Airtable rate limit (429) — gav upp efter ${maxRetries} omförsök; felet propageras`,
      );
      return res;
    }

    const waitMs = airtable429BackoffMs(attempt, random);
    console.warn(
      `Airtable rate limit (429) — väntar ${Math.round(waitMs / 1000)}s ` +
        `(omförsök ${attempt + 1}/${maxRetries}, Airtable kräver >= 30s)`,
    );

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
