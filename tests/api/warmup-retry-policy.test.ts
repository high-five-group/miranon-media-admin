// TASK-451.4 — api-pure (ren logik, ingen staging, inga creds, ingen browser,
// inget UI). Regressionstest för AC #3 (ETT retry-lager, högst 4 anrop per
// item) och AC #4 (4xx retryas aldrig på warmup-vägen).
// Underlag: docs/research/kallstarten-diagnoskarta-2026-09-18.md § 1.7 + § 6
// punkt 6.
//
// Sviten mäter FYRA saker, varav två är tvåsidiga skyddsräcken:
//
//  A. Policyn gäller — `retry: false` på warmup-setets sju nycklar.
//  B. Policyn gäller INTE utanför setet — routerns globala `retry: 3` är
//     ORÖRD för varje annan nyckel. Detta är det bärande beviset för att
//     skivan inte ändrade appens globala retry-policy i tysthet.
//  C. Paritet mot motorn — `WARMUP_NYCKLAR` matchar de nycklar
//     `startvarmningen.ts` FAKTISKT hämtar, mätt genom att köra motorn och
//     läsa cachen, inte genom att läsa två listor och hoppas att de stämmer.
//  D. Överskuggningsordningen mot TASK-420 — `intresserade.all` hamnar på
//     `retry: false`, inte på `intresseradeRetryPolicy`.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { QueryClient } from '@tanstack/react-query';
import type { DataSourceAdapter } from '../../src/data/adapters/DataSourceAdapter';
import { EdgeFunctionError } from '../../src/data/config/EdgeFunctionError';
import { starta } from '../../src/data/warmup/startvarmningen';
import { registreraIntresseradeRetryPolicy } from '../../src/queries/intresserade-retry-policy';
import { HEM_SENASTE_AKTIVITET_ANTAL, queryKeys } from '../../src/queries/keys';
import { registreraWarmupRetryPolicy, WARMUP_NYCKLAR } from '../../src/queries/warmup-retry-policy';

/** Speglar produktionens globala default (`src/router.ts` rad 21–22) så testet
 * mäter DELTAT som policyn gör, inte ett konstruerat utgångsläge. */
function produktionsliknandeKlient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 3, retryDelay: (attempt: number) => Math.min(200 * 2 ** attempt, 2000) },
    },
  });
}

function stubDataSource(): { ds: DataSourceAdapter; anrop: () => number } {
  let anrop = 0;
  const raknaOchSvara = () => {
    anrop += 1;
    return Promise.resolve([]);
  };
  const ds = {
    fetchEvents: raknaOchSvara,
    fetchRegistrations: raknaOchSvara,
    fetchWaitlist: raknaOchSvara,
    fetchIntresserade: raknaOchSvara,
    fetchMailLog: raknaOchSvara,
    listSegments: raknaOchSvara,
    fetchActivityLog: () => {
      anrop += 1;
      return Promise.resolve({ statements: [], nextCursor: null });
    },
  } as unknown as DataSourceAdapter;
  return { ds, anrop: () => anrop };
}

test.describe('A. Policyn gäller warmup-setets nycklar (AC #3)', () => {
  test('samtliga sju nycklar får retry: false efter registrering', () => {
    const qc = produktionsliknandeKlient();
    registreraWarmupRetryPolicy(qc);

    expect(WARMUP_NYCKLAR.length).toBe(7);
    for (const nyckel of WARMUP_NYCKLAR) {
      expect(qc.getQueryDefaults(nyckel).retry, `nyckel ${JSON.stringify(nyckel)}`).toBe(false);
    }
  });

  test('VÄRSTA FALLET: ett item som alltid kastar ger EN queryFn-körning, inte fyra', async () => {
    const qc = produktionsliknandeKlient();
    registreraWarmupRetryPolicy(qc);

    let korningar = 0;
    await qc
      .ensureQueryData({
        queryKey: queryKeys.events.list,
        queryFn: () => {
          korningar += 1;
          return Promise.reject(new Error('EF nere'));
        },
      })
      .catch(() => {});

    // FÖRE skivan: 4 queryFn-körningar (global retry: 3), var och en med
    // `fetchWithRetry`s egna 4 HTTP-försök = 16 nätverksanrop per item.
    // EFTER: 1 körning x högst 4 HTTP-försök = högst 4 nätverksanrop.
    expect(korningar).toBe(1);
  });

  test('AC #4 — ett 4xx retryas aldrig (EdgeFunctionError 401 ger EN körning)', async () => {
    const qc = produktionsliknandeKlient();
    registreraWarmupRetryPolicy(qc);

    let korningar = 0;
    const fel = await qc
      .ensureQueryData({
        queryKey: queryKeys.registrations.all,
        queryFn: () => {
          korningar += 1;
          return Promise.reject(
            new EdgeFunctionError({
              endpoint: 'get-registrations',
              status: 401,
              message: 'Edge Function "get-registrations" 401: utgången session',
              requestId: undefined,
            }),
          );
        },
      })
      .then(
        () => null,
        (e: unknown) => e,
      );

    expect(korningar).toBe(1);
    expect(fel).toBeInstanceOf(EdgeFunctionError);
    expect((fel as EdgeFunctionError).status).toBe(401);
  });
});

test.describe('B. Globala retry: 3 är ORÖRD utanför warmup-setet', () => {
  test('en nyckel utanför setet behåller sina fyra queryFn-körningar', async () => {
    const qc = produktionsliknandeKlient();
    registreraWarmupRetryPolicy(qc);

    // `persons.register` ingår INTE i warmup-setet (ADR-123 beslut 7 håller
    // registerfrågan utanför den blockerande mängden, av kostnadsskäl — se
    // startvarmningen.ts WARMUP_ITEMS-kommentaren).
    expect(qc.getQueryDefaults(queryKeys.persons.register).retry).toBeUndefined();

    let korningar = 0;
    await qc
      .ensureQueryData({
        queryKey: queryKeys.persons.register,
        queryFn: () => {
          korningar += 1;
          return Promise.reject(new Error('EF nere'));
        },
        retryDelay: 1, // håller testet snabbt; ANTALET är vad som mäts
      })
      .catch(() => {});

    // Fyra körningar = global retry: 3 gäller fortfarande. Hade skivan ändrat
    // den globala defaulten i tysthet stod det 1 här.
    expect(korningar).toBe(4);
  });

  test('dashboard-nycklarna (Hems poll-scope) är orörda av policyn', () => {
    const qc = produktionsliknandeKlient();
    registreraWarmupRetryPolicy(qc);

    // Hem sätter sin EGEN `noRetryOn4xx` vid anropsstället
    // (`useDashboardData.ts`); policyn ska inte lägga sig i den.
    expect(qc.getQueryDefaults(queryKeys.dashboard.events).retry).toBeUndefined();
    expect(qc.getQueryDefaults(queryKeys.dashboard.registrations).retry).toBeUndefined();
  });

  test('den ENDA spridande nyckelfamiljen är registrations — mätt, inte antagen', () => {
    const qc = produktionsliknandeKlient();
    registreraWarmupRetryPolicy(qc);

    // `registrations.all` = ['registrations'] och getQueryDefaults
    // PREFIX-matchar, så syskongrenarna ärver. Öppet bokfört i modulens
    // filhuvud; mätt här så spridningen aldrig blir större utan att ett test
    // säger till.
    expect(qc.getQueryDefaults(queryKeys.registrations.byEvent('evt1')).retry).toBe(false);
    expect(qc.getQueryDefaults(queryKeys.registrations.detail('reg1')).retry).toBe(false);

    // ...medan events-familjens syskon INTE ärver (nyckeln är ['events','list'],
    // inte ['events']).
    expect(qc.getQueryDefaults(queryKeys.events.detail('evt1')).retry).toBeUndefined();
    expect(qc.getQueryDefaults(queryKeys.events.attendance('evt1')).retry).toBeUndefined();
    // ...och segment-syskonet heller inte.
    expect(qc.getQueryDefaults(queryKeys.segment.sendRecipients('seg1')).retry).toBeUndefined();
  });
});

test.describe('C. Paritet mot motorns faktiska nyckelmängd', () => {
  test('WARMUP_NYCKLAR är exakt de nycklar startvärmningen hämtar', async () => {
    const qc = produktionsliknandeKlient();
    const { ds } = stubDataSource();

    const resultat = await starta(qc, {
      dataSource: ds,
      isOnline: () => true,
      timeoutMs: 5000,
    }).slutlofte;
    expect(resultat.utfall).toBe('klar');

    // Motorn seedar ÄVEN dashboard.* (ADR-112 beslut 4, "hämta en gång,
    // dela") — de är seedade kopior, inte egna hämtningar, och ingår därför
    // med avsikt inte i retry-policyns set.
    const seedadeDashboardNycklar = [
      JSON.stringify(queryKeys.dashboard.events),
      JSON.stringify(queryKeys.dashboard.registrations),
    ];

    const motornsHamtade = qc
      .getQueryCache()
      .getAll()
      .map((q) => JSON.stringify(q.queryKey))
      .filter((k) => !seedadeDashboardNycklar.includes(k))
      .sort();

    const policynsNycklar = WARMUP_NYCKLAR.map((k) => JSON.stringify(k)).sort();

    // Mätt likhet. Läggs ett åttonde item till i motorn utan att nyckeln
    // läggs till i WARMUP_NYCKLAR faller detta test — i stället för att det
    // itemet tyst återfår 16-anrops-staplingen.
    expect(motornsHamtade).toEqual(policynsNycklar);
  });

  test('activityLog-nyckeln bär samma limit som motorn seedar (ingen nyckel-drift)', () => {
    const forvantad = JSON.stringify(queryKeys.activityLog.latest(HEM_SENASTE_AKTIVITET_ANTAL));
    const iPolicyn = WARMUP_NYCKLAR.map((k) => JSON.stringify(k));
    expect(iPolicyn).toContain(forvantad);
  });
});

test.describe('D. Överskuggningsordningen mot TASK-420', () => {
  test('warmup-policyn registrerad EFTER intresserade-policyn ⇒ retry: false vinner', () => {
    const qc = produktionsliknandeKlient();
    // Exakt router.ts:s ordning.
    registreraIntresseradeRetryPolicy(qc);
    registreraWarmupRetryPolicy(qc);

    expect(qc.getQueryDefaults(queryKeys.intresserade.all).retry).toBe(false);
  });

  test('TASK-420:s garanti består: 4xx retryas aldrig för intresserade.all', async () => {
    const qc = produktionsliknandeKlient();
    registreraIntresseradeRetryPolicy(qc);
    registreraWarmupRetryPolicy(qc);

    let korningar = 0;
    await qc
      .ensureQueryData({
        queryKey: queryKeys.intresserade.all,
        queryFn: () => {
          korningar += 1;
          return Promise.reject(
            new EdgeFunctionError({
              endpoint: 'get-leads',
              status: 403,
              message: 'Edge Function "get-leads" 403: nekad',
              requestId: undefined,
            }),
          );
        },
      })
      .catch(() => {});

    // TASK-420 säkrade "aldrig 4xx" (men tillät 4 x 4 vid 5xx).
    // TASK-451.4 skärper till "aldrig NÅGOT omförsök på query-lagret".
    expect(korningar).toBe(1);
  });

  test('omvänd ordning vore en regression — dokumenterar varför router.ts-ordningen är bärande', () => {
    const qc = produktionsliknandeKlient();
    // MEDVETET fel ordning: intresserade-policyn sist.
    registreraWarmupRetryPolicy(qc);
    registreraIntresseradeRetryPolicy(qc);

    // Då återgår nyckeln till en funktions-policy som tillåter tre omförsök
    // ovanpå transportens fyra. Detta test finns för att göra ordningens
    // betydelse mätbar i stället för att bara påstådd i en kommentar.
    expect(typeof qc.getQueryDefaults(queryKeys.intresserade.all).retry).toBe('function');
  });

  test('src/router.ts anropar registrarna i DEN ordningen — källan, inte bara mekaniken', () => {
    // [Runda 2, granskningens fynd 4] De tre testen ovan anropar registrarna
    // MANUELLT i testkroppen. De bevisar därför att ordningen BETYDER något —
    // aldrig att `src/router.ts` faktiskt har den. Fram till runda 2 påstod
    // både router.ts:s kommentar och PR-kroppen att ordningen var test-vaktad;
    // inget test läste filen. Det är exakt den sortens obelagda
    // mekanism-påstående ADR-083 finns för att stoppa, så här är mekanismen.
    //
    // Filen LÄSES som text i stället för att importeras — samma etablerade
    // mönster och samma skäl som `tests/api/router-preload-defaults.test.ts`
    // och `personregister-farskhet.test.ts` § 3 redan bokför: `src/router.ts`
    // drar in `routeTree.gen.ts` och därmed varje routes fulla komponentträd,
    // vilket api-pure-miljön (ingen browser, inget DOM) inte kan ladda.
    const repoRot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
    const kalla = readFileSync(path.join(repoRot, 'src', 'router.ts'), 'utf8');

    // Matchar ANROPS-satserna, inte import-raderna (där båda namnen också
    // förekommer) och inte kommentarerna.
    const intresseradeVid = kalla.search(/^registreraIntresseradeRetryPolicy\(queryClient\);$/m);
    const warmupVid = kalla.search(/^registreraWarmupRetryPolicy\(queryClient\);$/m);

    expect(intresseradeVid, 'router.ts ska anropa registreraIntresseradeRetryPolicy').not.toBe(-1);
    expect(warmupVid, 'router.ts ska anropa registreraWarmupRetryPolicy').not.toBe(-1);

    // Kastas raderna om faller detta test — och `intresserade.all` hade tyst
    // återgått till TASK-420:s funktions-policy, alltså 4 x 4-staplingen.
    expect(
      warmupVid,
      'registreraWarmupRetryPolicy MÅSTE anropas EFTER registreraIntresseradeRetryPolicy — annars överskuggas retry: false av TASK-420:s funktions-policy för intresserade.all',
    ).toBeGreaterThan(intresseradeVid);
  });
});
