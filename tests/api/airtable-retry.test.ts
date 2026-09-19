// Enhetstest för Airtables 429-backoff (TASK-53, katalogpost P4).
//
// api-pure (ren logik, ingen staging, NOLL riktig Airtable): 429 MOCKAS och den faktiska
// väntetiden MÄTS via injicerad sleep. Formen är föreskriven i kortet och medvetet vald: en
// skarp 429-framkallning mot staging vore möjlig men bränner kvot och lockout för alla andra
// körningar — 5 req/s-budgeten är DELAD över hela sviten (P4 andra manifestationen + P26), så
// ett test som framkallar lockout saboterar varje parallell körning i 30 sekunder.
//
// Kontraktet som testas är Airtables egen dokumentation, verifierad 2026-07-31:
// "If you exceed these rates, you will receive a 429 status code and will need to wait
//  30 seconds before subsequent requests will succeed."
// https://airtable.com/developers/web/api/rate-limits
//
// Testet importerar retry-modulen DIREKT, aldrig airtable-client.ts: den senare använder
// Deno.env och fäller typecheck med 7× TS2304 "Cannot find name 'Deno'" om den dras in i
// tests-programmet. Det är skälet till att backoffen bor i en egen Deno-fri modul.

import { expect, test } from '@playwright/test';
import {
  AIRTABLE_429_BASE_WAIT_MS,
  AIRTABLE_429_JITTER_RATIO,
  AIRTABLE_429_MAX_RETRIES,
  airtable429BackoffMs,
  withAirtable429Retry,
} from '../../supabase/functions/_shared/airtable-retry';

/** Supabase Edge Functions request idle timeout (504 om inget svar hinner skickas). */
const EF_IDLE_TIMEOUT_MS = 150_000;

/**
 * Kör retry-mekanismen mot en scriptad svarssekvens och FÅNGAR varje väntetid.
 * Ingen riktig tid förflyter — sleep är injicerad, så testet mäter det klienten BESLUTAR
 * att vänta, vilket är exakt det AC #2 kräver att vi verifierar.
 */
async function körMedMätning(
  statusar: number[],
  options: { random?: () => number; maxRetries?: number; body?: string | null } = {},
) {
  const { random = () => 0, maxRetries, body = null } = options;
  const väntetider: number[] = [];
  const anropadeStatusar: number[] = [];

  const res = await withAirtable429Retry(
    () => {
      const status = statusar[Math.min(anropadeStatusar.length, statusar.length - 1)];
      anropadeStatusar.push(status);
      // 204/304 tillåter ingen body — övriga får den scriptade kroppen.
      return Promise.resolve(new Response(body, { status }));
    },
    {
      random,
      ...(maxRetries === undefined ? {} : { maxRetries }),
      sleep: (ms: number) => {
        väntetider.push(ms);
        return Promise.resolve();
      },
    },
  );

  return { res, väntetider, antalAnrop: anropadeStatusar.length };
}

test.describe('429-backoff — Airtables dokumenterade 30 s-kontrakt (AC #1)', () => {
  test('en 429 följd av 200 → klienten väntar MINST 30 000 ms före omförsöket', async () => {
    const { res, väntetider, antalAnrop } = await körMedMätning([429, 200]);

    expect(antalAnrop).toBe(2);
    expect(res.status).toBe(200);
    expect(väntetider).toHaveLength(1);
    // Kärn-assertionen: den FAKTISKA väntetiden, inte en antagen.
    expect(väntetider[0]).toBeGreaterThanOrEqual(30_000);
  });

  test('REGRESSIONSVAKT: ingen väntetid får ligga i den gamla 1 s-klassen', async () => {
    // Defekten TASK-53 lagar var exakt detta: 1 000 ms väntan inne i ett 30 s lockout-fönster,
    // vilket förlängde lockouten i stället för att invänta den. Vakten fäller varje väntetid
    // under kontraktet — oavsett hur den råkar bli för kort.
    const { väntetider } = await körMedMätning([429, 429, 200]);

    expect(väntetider.length).toBeGreaterThan(0);
    for (const ms of väntetider) {
      expect(ms).toBeGreaterThanOrEqual(AIRTABLE_429_BASE_WAIT_MS);
      expect(ms).not.toBe(1000);
    }
  });

  test('jittern är additiv UPPÅT — väntan hamnar aldrig under golvet', () => {
    // Deterministiska ytterlägen i stället för sampling: random=0 ger golvet exakt,
    // random→1 ger taket. Båda måste ligga >= 30 s, annars är jitter-formen fel
    // (t.ex. AWS "equal jitter" som drar NEDÅT och hade återinfört defekten).
    expect(airtable429BackoffMs(0, () => 0)).toBe(30_000);
    expect(airtable429BackoffMs(0, () => 0.999_999)).toBeLessThan(37_500);
    expect(airtable429BackoffMs(0, () => 0.999_999)).toBeGreaterThan(37_400);
    expect(airtable429BackoffMs(0, () => 0.5)).toBe(33_750);

    // Slumpmässigt över hela intervallet: golvet får ALDRIG brytas.
    for (let i = 0; i < 200; i++) {
      expect(airtable429BackoffMs(0)).toBeGreaterThanOrEqual(AIRTABLE_429_BASE_WAIT_MS);
    }
  });
});

test.describe('429-backoff — exponentiell form med 30 s som golv (valt alternativ b)', () => {
  test('andra omförsöket väntar dubbelt: >= 60 000 ms', async () => {
    const { väntetider, antalAnrop, res } = await körMedMätning([429, 429, 200]);

    expect(antalAnrop).toBe(3);
    expect(res.status).toBe(200);
    expect(väntetider).toEqual([30_000, 60_000]); // random=0 → exakta golv
  });

  test('airtable429BackoffMs fördubblar per försök och bär jitter-andelen', () => {
    expect(airtable429BackoffMs(0, () => 0)).toBe(AIRTABLE_429_BASE_WAIT_MS);
    expect(airtable429BackoffMs(1, () => 0)).toBe(AIRTABLE_429_BASE_WAIT_MS * 2);
    expect(airtable429BackoffMs(2, () => 0)).toBe(AIRTABLE_429_BASE_WAIT_MS * 4);
    // Jittern skalar med det aktuella delayet, inte med basen.
    expect(airtable429BackoffMs(1, () => 1)).toBe(
      AIRTABLE_429_BASE_WAIT_MS * 2 * (1 + AIRTABLE_429_JITTER_RATIO),
    );
  });
});

test.describe('429-backoff — explicit tak, oändlig retry är borta (AC #3)', () => {
  test('idel 429 → ändligt antal anrop (maxRetries + 1), sista 429-svaret returneras', async () => {
    const { res, väntetider, antalAnrop } = await körMedMätning([429], {
      body: '{"error":"RATE_LIMIT"}',
    });

    // Före TASK-53 hade denna sekvens loopat för evigt. Nu är den ändlig.
    expect(antalAnrop).toBe(AIRTABLE_429_MAX_RETRIES + 1);
    expect(väntetider).toHaveLength(AIRTABLE_429_MAX_RETRIES);
    // Felkontraktet är oförändrat: 429:an propageras till callerns !res.ok-gren.
    expect(res.status).toBe(429);
    await expect(res.text()).resolves.toBe('{"error":"RATE_LIMIT"}');
  });

  test('default-taket är 2 — härlett ur EF:ens idle timeout, inte valt på känsla', () => {
    expect(AIRTABLE_429_MAX_RETRIES).toBe(2);

    // Värsta totala väntan vid fullt uttömt tak måste rymmas i Edge Function-gränsen,
    // annars byter vi ett ärligt fel mot en 504. Detta är takets HÄRLEDNING som assertion.
    let värstaFall = 0;
    for (let attempt = 0; attempt < AIRTABLE_429_MAX_RETRIES; attempt++) {
      värstaFall += airtable429BackoffMs(attempt, () => 1);
    }
    expect(värstaFall).toBe(112_500);
    expect(värstaFall).toBeLessThan(EF_IDLE_TIMEOUT_MS);

    // Och att ett steg till hade spräckt gränsen — vilket är varför taket inte är 3.
    const medEttTillOmförsök = värstaFall + airtable429BackoffMs(AIRTABLE_429_MAX_RETRIES, () => 1);
    expect(medEttTillOmförsök).toBeGreaterThan(EF_IDLE_TIMEOUT_MS);
  });

  test('maxRetries=0 → noll omförsök, ingen väntan, 429:an propageras direkt', async () => {
    const { res, väntetider, antalAnrop } = await körMedMätning([429], { maxRetries: 0 });

    expect(antalAnrop).toBe(1);
    expect(väntetider).toEqual([]);
    expect(res.status).toBe(429);
  });
});

test.describe('429-backoff — endast 429 retryas, övriga statusar passerar orörda', () => {
  test('200/404/403/500 returneras direkt utan att någon väntan sker', async () => {
    for (const status of [200, 404, 403, 500]) {
      const { res, väntetider, antalAnrop } = await körMedMätning([status]);
      expect(res.status).toBe(status);
      expect(antalAnrop).toBe(1);
      expect(väntetider).toEqual([]);
    }
  });

  test('svarskropp på det retryade 429-svaret städas utan att kasta', async () => {
    // Retry-modulen annullerar 429-svarets body före omförsöket (resursläcka i Deno annars).
    // Med en icke-tom body finns en riktig ReadableStream att annullera — det får inte kasta.
    const { res, antalAnrop } = await körMedMätning([429, 200], { body: 'rate limited' });

    expect(antalAnrop).toBe(2);
    expect(res.status).toBe(200);
  });
});

// TASK-459 — strukturerad 429-loggning. `get-events`/`get-registrations` mättes bara som EN
// extern väggtid per anrop; en 429-lockout syns då bara indirekt som ett ≥30 s anrop. Denna
// svit bevisar den EXPLICITA loggraden (helper/tabell, försök-nr, vald backoff i ms) och
// exhausted-raden när taket är uttömt — se `_shared/airtable-retry.ts` § Strukturerad
// 429-loggning för hela resonemanget. `log` injiceras (samma mönster som `sleep`/`random`
// ovan) så testet fångar raderna utan att skriva till stdout.
test.describe('strukturerad 429-loggning (TASK-459)', () => {
  async function körMedLoggfångst(
    statusar: number[],
    options: { logContext?: Record<string, unknown>; maxRetries?: number } = {},
  ) {
    const loggrader: Record<string, unknown>[] = [];
    let antalAnrop = 0;

    const res = await withAirtable429Retry(
      () => {
        antalAnrop++;
        const status = statusar[Math.min(antalAnrop - 1, statusar.length - 1)];
        return Promise.resolve(new Response(null, { status }));
      },
      {
        random: () => 0,
        sleep: () => Promise.resolve(),
        logContext: options.logContext,
        ...(options.maxRetries === undefined ? {} : { maxRetries: options.maxRetries }),
        log: (record) => loggrader.push(record),
      },
    );

    return { res, loggrader, antalAnrop };
  }

  test('en 429 följd av 200 → exakt EN airtable_429_retry-rad med helper/tabell, försök-nr och backoff-ms', async () => {
    const { loggrader, antalAnrop } = await körMedLoggfångst([429, 200], {
      logContext: { helper: 'fetchFromAirtable', table: 'Eventplanering' },
    });

    expect(antalAnrop).toBe(2);
    expect(loggrader).toHaveLength(1);
    expect(loggrader[0]).toMatchObject({
      level: 'warn',
      event: 'airtable_429_retry',
      attempt: 1,
      maxRetries: AIRTABLE_429_MAX_RETRIES,
      waitMs: AIRTABLE_429_BASE_WAIT_MS, // random=0 → exakt golvet
      helper: 'fetchFromAirtable',
      table: 'Eventplanering',
    });
  });

  test('två 429:or i rad → två rader, andra försöket har rätt attempt-nummer och dubblad backoff', async () => {
    const { loggrader } = await körMedLoggfångst([429, 429, 200], {
      logContext: { helper: 'fetchAirtableRecord', table: 'Personer' },
    });

    expect(loggrader).toHaveLength(2);
    expect(loggrader[0]).toMatchObject({ event: 'airtable_429_retry', attempt: 1, waitMs: 30_000 });
    expect(loggrader[1]).toMatchObject({ event: 'airtable_429_retry', attempt: 2, waitMs: 60_000 });
    // Kontext följer med på BÅDA raderna — en 429 måste gå att koppla till VILKET anrop.
    for (const rad of loggrader) {
      expect(rad).toMatchObject({ helper: 'fetchAirtableRecord', table: 'Personer' });
    }
  });

  test('uttömt tak → en avslutande airtable_429_exhausted-rad utöver retry-raderna', async () => {
    const { loggrader, res } = await körMedLoggfångst([429], {
      logContext: { helper: 'fetchAirtablePage', table: 'Anmälningar' },
      maxRetries: 2,
    });

    expect(res.status).toBe(429);
    // 2 retry-rader (försök 1, 2) + 1 exhausted-rad.
    expect(loggrader).toHaveLength(3);
    expect(loggrader.map((r) => r.event)).toEqual([
      'airtable_429_retry',
      'airtable_429_retry',
      'airtable_429_exhausted',
    ]);
    expect(loggrader[2]).toMatchObject({
      level: 'warn',
      event: 'airtable_429_exhausted',
      maxRetries: 2,
      attempt: 3,
      helper: 'fetchAirtablePage',
      table: 'Anmälningar',
    });
  });

  test('maxRetries=0 → noll retry-rader, direkt EN exhausted-rad', async () => {
    const { loggrader, res } = await körMedLoggfångst([429], { maxRetries: 0 });

    expect(res.status).toBe(429);
    expect(loggrader).toHaveLength(1);
    expect(loggrader[0]).toMatchObject({
      event: 'airtable_429_exhausted',
      maxRetries: 0,
      attempt: 1,
    });
  });

  test('ingen 429 → inga loggrader alls (200 direkt)', async () => {
    const { loggrader, antalAnrop } = await körMedLoggfångst([200]);

    expect(antalAnrop).toBe(1);
    expect(loggrader).toEqual([]);
  });

  test('logContext utelämnad → raden loggas ändå, bara utan anropskontext (aldrig ett kastat fel)', async () => {
    const { loggrader } = await körMedLoggfångst([429, 200]);

    expect(loggrader).toHaveLength(1);
    expect(loggrader[0]).toMatchObject({ event: 'airtable_429_retry', attempt: 1 });
  });

  test('DEFAULT-loggningen (ingen `log` injicerad) skriver strukturerad JSON via console.warn, kastar aldrig', async () => {
    const rader: string[] = [];
    const original = console.warn;
    console.warn = (msg?: unknown) => {
      rader.push(String(msg));
    };
    try {
      const res = await withAirtable429Retry(
        () => Promise.resolve(new Response(null, { status: 429 })),
        {
          random: () => 0,
          sleep: () => Promise.resolve(),
          maxRetries: 0,
          logContext: { helper: 'fetchFromAirtable', table: 'Eventplanering' },
        },
      );
      expect(res.status).toBe(429);
    } finally {
      console.warn = original;
    }

    expect(rader).toHaveLength(1);
    const parsed = JSON.parse(rader[0]);
    expect(parsed).toMatchObject({
      level: 'warn',
      event: 'airtable_429_exhausted',
      helper: 'fetchFromAirtable',
      table: 'Eventplanering',
    });
  });
});
