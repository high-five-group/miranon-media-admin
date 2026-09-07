// INTRESSERADE-NYCKELNS RETRY-POLICY (TASK-420, fynd ur review-runda 2 på
// PR #2395 / TASK-416.8) — api-pure (ren logik, ingen staging, inga creds,
// ingen browser).
//
// BUGGEN: `queryKeys.intresserade.all` hade två konsumenter med motstridiga
// retry-svar på samma nyckel — `startvarmningen.ts`s `ensureQueryData` (ingen
// override → ärvde routerns BLINDA `retry: 3`, retryar även 4xx) och
// `Intresserade.tsx`s `useQuery` (egen override, aldrig retry på 4xx). Vilken
// policy som gällde för ett givet fel berodde på VEM som råkade starta
// hämtningen — ett race. FIXEN: `registreraIntresseradeRetryPolicy`
// (`src/queries/intresserade-retry-policy.ts`) sätter policyn på NYCKELN via
// `setQueryDefaults`, och `Intresserade.tsx` bär ingen egen `retry` längre.
//
// VARFÖR INTE "MSW-räknare" (som TASK-420s kort beskriver mätningen): den
// riktiga nätverksvägen (`AirtableAdapter.fetchIntresserade` →
// `callEdgeFunction('get-leads')`) kräver en levande `supabase.auth.
// getSession()`, som INTE går att fejka i api-pure (samma begränsning
// `cursorWalk.ts`s filhuvud bokför för samma adapter-metod). Acceptance-
// klassen (som KAN autentisera via fixturvärlden) FÖRBJUDER uttryckligen att
// räkna handler-anrop som testkriterium — `acceptance-bas.ts`s eget filhuvud:
// "Klassen testar EXTERNT BETEENDE — aldrig att en handler anropades eller
// hur många gånger. Det vore att testa fixturen." Denna fil mäter därför
// samma sak — hur många gånger REACT QUERY anropar `queryFn` för nyckeln
// `intresserade.all` givet ett 4xx- respektive 5xx-fel — direkt mot en RIKTIG
// `QueryClient`, med en räknande stub-`queryFn` i stället för ett MSW-mockat
// HTTP-lager. Mekanismen som avgörs är densamma (`getQueryDefaults`-mergen,
// se § 1s docblock) oavsett om `queryFn` i slutändan pratar HTTP eller inte —
// samma seam-princip som `tests/api/startvarmningen.test.ts`s stub-
// `dataSource` redan vilar på. Avviker alltså MEDVETET från kortets ordalydelse
// ("MSW-räknare"); bokfört öppet i TASK-420s slutrapport (ADR-086).
//
// `queryClient.fetchQuery` är EXAKT samma byggväg `ensureQueryData` tar när
// cachen är tom (`ensureQueryData` anropar `fetchQuery` internt,
// `query-core/src/queryClient.ts`, verifierat via context7
// `/tanstack/query/v5.90.3` 2026-09-07) — så § 3 nedan prövar precis det
// startvärmningens `ensureQueryData`-anrop faktiskt gör vid en kall cache,
// utan att behöva dra in hela `starta()`-motorns batchning/timeout-lager.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { QueryClient } from '@tanstack/react-query';
import { EdgeFunctionError } from '../../src/data/config/EdgeFunctionError';
import {
  intresseradeRetryPolicy,
  registreraIntresseradeRetryPolicy,
} from '../../src/queries/intresserade-retry-policy';
import { queryKeys } from '../../src/queries/keys';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROUTER_FIL = path.join(REPO_ROOT, 'src', 'router.ts');
const INTRESSERADE_FIL = path.join(
  REPO_ROOT,
  'src',
  'components',
  'intresserade',
  'Intresserade.tsx',
);

/** router.ts:s globala retry-default, reproducerad. Låst mot filen i § 5. */
const GLOBAL_RETRY = 3;

/**
 * Klient med routerns GLOBALA retry (`3`, blind — retryar även 4xx) som
 * default, precis som produktionens `queryClient` INNAN
 * `registreraIntresseradeRetryPolicy` läggs ovanpå i enskilda tester.
 *
 * `retryDelay: () => 0` är en TEST-HASTIGHETSÖVERSKRIVNING, inte en
 * policyändring: produktionens backoff (`router.ts` rad 21, `200 · 2^n` ms,
 * tak 2000 ms) styr TIMING mellan försök, aldrig HUR MÅNGA försök som görs —
 * den frågan (retry-RÄKNING) är allt dessa tester mäter, så en snabbare
 * backoff kan inte göra ett test grönt på fel grund.
 */
function klientMedGlobalRetry(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: GLOBAL_RETRY,
        retryDelay: () => 0,
      },
    },
  });
}

/** En `queryFn` som ALLTID avvisar med en `EdgeFunctionError` av given status,
 * och räknar hur många gånger den anropades. */
function felandeQueryFn(status: number): { fn: () => Promise<never>; antal: () => number } {
  let anrop = 0;
  return {
    fn: () => {
      anrop += 1;
      return Promise.reject(
        new EdgeFunctionError({
          endpoint: 'get-leads',
          status,
          message: `get-leads ${status} (testfixtur)`,
          requestId: undefined,
        }),
      );
    },
    antal: () => anrop,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// § 1 — retry-funktionens egen logik (unit, ingen QueryClient inblandad)
// ─────────────────────────────────────────────────────────────────────────

test.describe('intresseradeRetryPolicy — funktionens egen logik', () => {
  test('4xx (400–499) ⇒ ALDRIG retry, oavsett failureCount', () => {
    for (const status of [400, 401, 403, 404, 429, 499]) {
      const err = new EdgeFunctionError({
        endpoint: 'get-leads',
        status,
        message: 'x',
        requestId: undefined,
      });
      expect(intresseradeRetryPolicy(0, err), `status ${status}, failureCount 0`).toBe(false);
      expect(intresseradeRetryPolicy(2, err), `status ${status}, failureCount 2`).toBe(false);
    }
  });

  test('5xx (500–599) ⇒ retry tills failureCount når 3', () => {
    const err = new EdgeFunctionError({
      endpoint: 'get-leads',
      status: 500,
      message: 'x',
      requestId: undefined,
    });
    expect(intresseradeRetryPolicy(0, err)).toBe(true);
    expect(intresseradeRetryPolicy(1, err)).toBe(true);
    expect(intresseradeRetryPolicy(2, err)).toBe(true);
    expect(intresseradeRetryPolicy(3, err), 'tredje ompröket ska INTE ge en fjärde').toBe(false);
  });

  test('nätverksfel (inte EdgeFunctionError) ⇒ samma retry-tak som 5xx', () => {
    const natverksfel = new TypeError('Failed to fetch');
    expect(intresseradeRetryPolicy(0, natverksfel)).toBe(true);
    expect(intresseradeRetryPolicy(3, natverksfel)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// § 2 — registreringen sätter EXAKT `retry`, ingenting annat, ENBART på nyckeln
// ─────────────────────────────────────────────────────────────────────────

test.describe('registreraIntresseradeRetryPolicy — vad den sätter, och var', () => {
  test('nyckeln får den delade funktionen (referensidentitet), övriga fält orörda', () => {
    const qc = klientMedGlobalRetry();
    registreraIntresseradeRetryPolicy(qc);

    const satta = qc.getQueryDefaults(queryKeys.intresserade.all);
    expect(Object.keys(satta ?? {}).sort()).toEqual(['retry']);

    const merged = qc.defaultQueryOptions({ queryKey: queryKeys.intresserade.all });
    expect(merged.retry, 'merge ska ge TILLBAKA exakt samma funktionsreferens').toBe(
      intresseradeRetryPolicy,
    );
  });

  test('övriga värmda nycklar behåller routerns BLINDA global (3), oavsett registreringen', () => {
    const qc = klientMedGlobalRetry();
    registreraIntresseradeRetryPolicy(qc);

    for (const nyckel of [
      queryKeys.events.list,
      queryKeys.registrations.all,
      queryKeys.waitlist.all,
      queryKeys.maillog.all,
      queryKeys.segment.saved,
      queryKeys.activityLog.latest(4),
    ]) {
      expect(
        qc.defaultQueryOptions({ queryKey: nyckel }).retry,
        `${JSON.stringify(nyckel)} ska vara oförändrad (routerns blinda 3)`,
      ).toBe(GLOBAL_RETRY);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// § 3 — DEN DELADE POLICYN I PRAKTIKEN: `fetchQuery` (= ensureQueryData vid
// kall cache) och `useQuery` går genom SAMMA merge-väg, så en räkning här
// bevisar bägge konsumenternas faktiska beteende, TVÅSIDIGT (AC #2/#4)
// ─────────────────────────────────────────────────────────────────────────

test.describe('Delad policy i praktiken — antal queryFn-anrop för intresserade.all', () => {
  test('4xx: EXAKT 1 anrop — startvärmningen retry:ar INTE längre 4xx-fel', async () => {
    const qc = klientMedGlobalRetry();
    registreraIntresseradeRetryPolicy(qc);
    const { fn, antal } = felandeQueryFn(404);

    await expect(
      qc.fetchQuery({ queryKey: queryKeys.intresserade.all, queryFn: fn }),
    ).rejects.toThrow('get-leads 404');

    expect(antal(), 'ett 4xx-svar ska ge EXAKT ett anrop').toBe(1);
  });

  test('5xx: 4 anrop totalt (1 + 3 retries) — husets policy retry:ar fortfarande transienta fel', async () => {
    const qc = klientMedGlobalRetry();
    registreraIntresseradeRetryPolicy(qc);
    const { fn, antal } = felandeQueryFn(500);

    await expect(
      qc.fetchQuery({ queryKey: queryKeys.intresserade.all, queryFn: fn }),
    ).rejects.toThrow('get-leads 500');

    expect(antal(), '5xx ska fortfarande retryas: 1 första försök + 3 omprök').toBe(4);
  });

  test('TVÅSIDIGT (koppla bort registreringen): 4xx ärver då routerns blinda retry:3 ⇒ 4 anrop', async () => {
    // Kontrollgrupp — SAMMA test som § 3s första, men UTAN
    // `registreraIntresseradeRetryPolicy`. Bevisar att det är REGISTRERINGEN
    // (inte t.ex. `EdgeFunctionError`s egen form) som ändrar utfallet: utan
    // den ärver nyckeln routerns naiva global och retry:ar 4xx precis som
    // buggen beskrev (granskarens "fyra get-leads-anrop").
    const qc = klientMedGlobalRetry(); // registreringen UTELÄMNAD, med avsikt
    const { fn, antal } = felandeQueryFn(404);

    await expect(
      qc.fetchQuery({ queryKey: queryKeys.intresserade.all, queryFn: fn }),
    ).rejects.toThrow('get-leads 404');

    expect(
      antal(),
      'utan setQueryDefaults ärver 4xx routerns blinda retry:3 — detta är buggen TASK-420 fixar',
    ).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// § 4 — Intresserade.tsx bär INGEN egen retry längre (skuggnings-risken)
// ─────────────────────────────────────────────────────────────────────────

test('Intresserade.tsx sätter ingen egen retry på intresserade.all-frågan', () => {
  // Policyn bor på nyckeln (setQueryDefaults), inte vid anropsstället. En
  // `retry` i vy-komponenten hade skuggat den delade defaulten (anropsställets
  // options vinner alltid, se modulens filhuvud) och återinfört exakt den
  // dubbelpolicy denna skiva tar bort — samma lås-mönster som
  // `personregister-farskhet.test.ts`s "PersonsList sätter INGEN egen staleTime".
  const kalla = readFileSync(INTRESSERADE_FIL, 'utf8');

  const fraga = kalla.slice(kalla.indexOf('queryKey: queryKeys.intresserade.all'));
  const blockSlut = fraga.indexOf('});');
  expect(blockSlut, 'intresserade-frågans block ska gå att avgränsa').toBeGreaterThan(0);

  expect(
    fraga.slice(0, blockSlut),
    'frågan ska ärva retry-policyn från nyckeln, inte sätta en egen',
  ).not.toContain('retry');
});

// ─────────────────────────────────────────────────────────────────────────
// § 5 — Låset: router.ts anropar faktiskt registreringen, och den
// reproducerade globalen ovan matchar filen på disk
// ─────────────────────────────────────────────────────────────────────────

test('router.ts wirar registreringen, och den reproducerade globala retryn matchar filen', () => {
  const kalla = readFileSync(ROUTER_FIL, 'utf8');

  expect(kalla, 'router.ts global retry').toContain('retry: 3');
  expect(kalla, 'router.ts ska importera registreringsfunktionen').toContain(
    'registreraIntresseradeRetryPolicy',
  );
  expect(kalla, 'router.ts ska faktiskt ANROPA registreringen').toContain(
    'registreraIntresseradeRetryPolicy(queryClient)',
  );
});
