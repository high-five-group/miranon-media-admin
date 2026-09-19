// ETT UTTÖMT TIDSBUDGET-FEL RETRYAS ALDRIG, I NÅGOT LAGER (TASK-451.4 runda 3,
// Marcus beslut "väg A" 2026-09-19) — api-pure: ren logik, ingen staging, inga
// creds, ingen browser, inget UI.
//
// BUGGEN: `HAMTNINGENS_TIDSGRANS_MS` (160 s) appliceras villkorslöst på varje
// GET. När budgeten är uttömd kastas `TidsgransFel` — och den är INTE en
// `EdgeFunctionError`, så husets 4xx-regel klassade den som "okänt fel, alltså
// transient" och retryade den. Värsta väggtid per fråga: 4 × 160 s ≈ 640 s.
//
// TRANSPORTEN följde redan regeln före denna skiva
// (`avbrutet-anrop-retryas-aldrig.test.ts`); FRÅGELAGRET bröt mot den. Denna
// fil mäter frågelagret.
//
// ── HUR "FÖRE" MÄTS, OCH VAD DET INTE ÄR ───────────────────────────────────
//
// `FORE_FIXEN` nedan är den pre-fix-lambda som låg TECKEN-FÖR-TECKEN identisk
// på alla 18 ställen (mätt med helradsmatchning i runda 3). Den reproduceras
// här i stället för att importeras, av samma skäl som
// `intresserade-retry-policy.test.ts` reproducerar `GLOBAL_RETRY = 3`: efter
// migreringen finns formen inte kvar i `src/` att importera.
//
// ÄRLIGT BOKFÖRT (ADR-086): detta är därför en KONTROLLGRUPP, inte en
// tidsresa. Den mäter vad den gamla regeln GÖR med ett `TidsgransFel` mot en
// riktig `QueryClient` — men den kunde inte köras mot trädet före skivan,
// eftersom `TidsgransFel` då inte fanns. Den TEMPORALA rött-först-mätningen för
// runda 3 gjordes i stället av `retry-vakt.test.ts`, som fällde 25 ställen mot
// det omigrerade trädet (exit 1) och 0 efter migreringen.

import { expect, test } from '@playwright/test';
import { QueryClient } from '@tanstack/react-query';
import { EdgeFunctionError } from '../../src/data/config/EdgeFunctionError';
import { HAMTNINGENS_TIDSGRANS_MS, TidsgransFel } from '../../src/data/utils';
import { queryKeys } from '../../src/queries/keys';
import {
  arSlutgiltigtFel,
  globalRetryPolicy,
  husetsRetryPolicy,
} from '../../src/queries/retry-policy';

/**
 * Husets 4xx-lambda SOM DEN SÅG UT FÖRE runda 3, ordagrant. Kontrollgrupp:
 * skillnaden mellan denna och `husetsRetryPolicy` ska vara EXAKT
 * slutgiltighets-regeln, ingenting annat.
 */
const FORE_FIXEN = (failureCount: number, err: Error): boolean =>
  !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) && failureCount < 3;

/** Routerns globala default SOM DEN SÅG UT FÖRE runda 3. */
const FORE_FIXEN_GLOBAL = 3;

function ef(status: number): EdgeFunctionError {
  return new EdgeFunctionError({
    endpoint: 'get-registrations',
    status,
    message: `get-registrations ${status} (testfixtur)`,
    requestId: undefined,
  });
}

const tidsgransFel = () => new TidsgransFel(HAMTNINGENS_TIDSGRANS_MS);

/**
 * Räknar hur många gånger React Query faktiskt anropar `queryFn` för en given
 * retry-option. Mäter MEKANIKEN, inte min modell av den — samma seam och skäl
 * som `intresserade-retry-policy.test.ts` § 3.
 *
 * `retryDelay: 0` är en hastighetsöverskrivning, aldrig en policyändring:
 * backoff styr TIMING mellan försök, aldrig HUR MÅNGA som görs.
 */
async function antalKorningar(
  retry: number | ((failureCount: number, err: Error) => boolean),
  fel: () => Error,
): Promise<number> {
  const qc = new QueryClient({ defaultOptions: { queries: { retry, retryDelay: () => 0 } } });
  let korningar = 0;
  await qc
    .fetchQuery({
      queryKey: queryKeys.dashboard.registrations,
      queryFn: () => {
        korningar += 1;
        return Promise.reject(fel());
      },
    })
    .catch(() => {});
  return korningar;
}

// ─────────────────────────────────────────────────────────────────────────
// § 1 — Predikatet självt
// ─────────────────────────────────────────────────────────────────────────

test.describe('arSlutgiltigtFel — vad som räknas som slutgiltigt', () => {
  test('ett uttömt tidsbudget-fel ÄR slutgiltigt', () => {
    expect(arSlutgiltigtFel(tidsgransFel())).toBe(true);
  });

  test('4xx, 5xx, nätverksfel och okända fel är INTE slutgiltiga i predikatets mening', () => {
    // 4xx stoppas av husets EGEN 4xx-regel, inte av slutgiltighets-predikatet.
    // Skillnaden är bärande: `globalRetryPolicy` retryar 4xx precis som förut.
    for (const fel of [
      ef(404),
      ef(401),
      ef(500),
      new TypeError('Failed to fetch'),
      new Error('x'),
    ]) {
      expect(arSlutgiltigtFel(fel), `${fel.name}`).toBe(false);
    }
  });

  test('predikatet tål icke-Error-värden utan att kasta', () => {
    for (const varde of [undefined, null, 'sträng', 42, {}]) {
      expect(arSlutgiltigtFel(varde)).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// § 2 — husetsRetryPolicy: slutgiltighet TILLAGD, allt annat OFÖRÄNDRAT
// ─────────────────────────────────────────────────────────────────────────

test.describe('husetsRetryPolicy mot FORE_FIXEN — exakt en skillnad', () => {
  test('TidsgransFel: FÖRE retryade (true), EFTER gör den det aldrig', () => {
    const fel = tidsgransFel();
    expect(FORE_FIXEN(0, fel), 'buggen: gamla regeln ville försöka igen').toBe(true);
    expect(husetsRetryPolicy(0, fel), 'fixen: slutgiltigt, ge upp').toBe(false);
    // Oavsett räknare — ett slutgiltigt fel är slutgiltigt vid varje försök.
    for (const n of [0, 1, 2, 3, 99]) {
      expect(husetsRetryPolicy(n, fel), `failureCount ${n}`).toBe(false);
    }
  });

  test('ALLA andra fel: identiskt utfall före och efter, för varje failureCount', () => {
    // Detta är beviset för uppdragets krav "beteendet för alla ANDRA fel
    // (4xx, 5xx, nätverk) ska vara oförändrat". Uttömmande över felklasser
    // och räknarvärden i stället för stickprov.
    const fall = [
      ...[400, 401, 403, 404, 429, 499].map(ef),
      ...[500, 502, 503, 504, 599].map(ef),
      new TypeError('Failed to fetch'),
      new Error('okänt fel'),
    ];
    for (const fel of fall) {
      for (const n of [0, 1, 2, 3, 4]) {
        expect(
          husetsRetryPolicy(n, fel),
          `${fel.message} @ failureCount ${n} ska vara oförändrat`,
        ).toBe(FORE_FIXEN(n, fel));
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// § 3 — globalRetryPolicy: slutgiltighet TILLAGD, 4xx-blindheten BEVARAD
// ─────────────────────────────────────────────────────────────────────────

test.describe('globalRetryPolicy mot routerns gamla retry: 3', () => {
  test('TidsgransFel: gamla globalen retryade, den nya ger upp', () => {
    const fel = tidsgransFel();
    // `retry: 3` är ett TAL — det frågar aldrig vad felet är.
    expect(globalRetryPolicy(0, fel)).toBe(false);
    expect(globalRetryPolicy(2, fel)).toBe(false);
  });

  test('4xx retryas FORTFARANDE av globalen — skivan skärper inte den axeln', () => {
    // Medveten scope-gräns (se modulens docblock): runda 3 lägger till
    // slutgiltighet överallt, den skärper INTE 4xx för varje nyckel utan egen
    // override. Står det `false` här har någon utvidgat skivan i tysthet.
    for (const status of [400, 401, 404, 429]) {
      expect(globalRetryPolicy(0, ef(status)), `status ${status}`).toBe(true);
      expect(globalRetryPolicy(3, ef(status)), `status ${status} vid taket`).toBe(false);
    }
  });

  test('5xx och nätverksfel: oförändrat tak på tre omförsök', () => {
    for (const fel of [ef(500), ef(503), new TypeError('Failed to fetch')]) {
      expect(globalRetryPolicy(0, fel)).toBe(true);
      expect(globalRetryPolicy(2, fel)).toBe(true);
      expect(globalRetryPolicy(3, fel)).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// § 4 — MÄTNINGEN: antal queryFn-körningar mot en RIKTIG QueryClient
// ─────────────────────────────────────────────────────────────────────────

test.describe('Antal queryFn-körningar för ett TidsgransFel (Hems poll-nyckel)', () => {
  test('Hems poll-policy: FÖRE 4 körningar, EFTER exakt 1', async () => {
    expect(
      await antalKorningar(FORE_FIXEN, tidsgransFel),
      'FÖRE: 1 första körning + 3 omförsök = 4 × 160 s tidsbudget ≈ 640 s väggtid',
    ).toBe(4);

    expect(
      await antalKorningar(husetsRetryPolicy, tidsgransFel),
      'EFTER: budgeten är uttömd, alltså slutgiltigt — EN körning, EN budget',
    ).toBe(1);
  });

  test('Global default: FÖRE 4 körningar, EFTER exakt 1', async () => {
    expect(await antalKorningar(FORE_FIXEN_GLOBAL, tidsgransFel), 'FÖRE: routerns blinda 3').toBe(
      4,
    );
    expect(await antalKorningar(globalRetryPolicy, tidsgransFel), 'EFTER').toBe(1);
  });

  test('OFÖRÄNDRAT: 5xx ger fortfarande 4 körningar i båda policyerna', async () => {
    const femhundra = () => ef(500);
    expect(await antalKorningar(FORE_FIXEN, femhundra)).toBe(4);
    expect(await antalKorningar(husetsRetryPolicy, femhundra)).toBe(4);
    expect(await antalKorningar(FORE_FIXEN_GLOBAL, femhundra)).toBe(4);
    expect(await antalKorningar(globalRetryPolicy, femhundra)).toBe(4);
  });

  test('OFÖRÄNDRAT: 4xx ger 1 körning i husets policy, 4 i den blinda globalen', async () => {
    const fyrahundra = () => ef(404);
    expect(await antalKorningar(FORE_FIXEN, fyrahundra)).toBe(1);
    expect(await antalKorningar(husetsRetryPolicy, fyrahundra)).toBe(1);
    // Den blinda globalen retryar 4xx både före och efter — se § 3.
    expect(await antalKorningar(FORE_FIXEN_GLOBAL, fyrahundra)).toBe(4);
    expect(await antalKorningar(globalRetryPolicy, fyrahundra)).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// § 5 — Väggtids-räkningen som motiverar skivan, låst mot konstanten
// ─────────────────────────────────────────────────────────────────────────

test('värsta väggtid per fråga är nu EN budget, inte fyra', () => {
  // Låser påståendet i PR-kroppen och i modulernas docblock mot den faktiska
  // konstanten, så en framtida ändring av tidsgränsen inte lämnar prosan kvar
  // med ett tal som inte längre stämmer.
  expect(HAMTNINGENS_TIDSGRANS_MS).toBe(160_000);

  const forePolicy = 4 * HAMTNINGENS_TIDSGRANS_MS;
  const efterPolicy = 1 * HAMTNINGENS_TIDSGRANS_MS;

  expect(forePolicy).toBe(640_000);
  expect(efterPolicy).toBe(160_000);
  expect(efterPolicy).toBeLessThan(forePolicy);
});
