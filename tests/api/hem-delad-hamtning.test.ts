// TASK-451.3 — api-pure (ren logik, ingen staging, inga creds, ingen
// browser, inget UI). Regressionstest för ADR-112 beslut 4 ("hämta en gång,
// dela") på TIMEOUT-VÄGEN
// (docs/research/kallstarten-diagnoskarta-2026-09-18.md § 1.10, § 5.3
// scenario A, § 10).
//
// FÖRE denna skiva anropade `useDashboardEvents`/`useDashboardRegistrations`s
// queryFn `dataSource.fetchEvents()`/`fetchRegistrations()` DIREKT — ett HELT
// NYTT nätverksanrop, oavsett om startvärmningen redan hade SAMMA data i
// flykt under `events.list`/`registrations.all`. Ett timeout-släpp (hård 9 s,
// `startvarmningen.ts:112`) lämnar startvärmningens EGEN `events.list`/
// `registrations.all`-hämtning körande i bakgrunden (inget
// `AbortController`), medan Hem monteras med tomma `dashboard.*`-nycklar och
// startar ett ANDRA anrop mot samma tröga Edge Function.
//
// Scenario A (batch 1 fördröjd förbi tidsgränsen) fäller den GAMLA koden:
// `anrop.events`/`anrop.registrations` skulle bli 2 vardera (startvärmningens
// eget anrop + Hems egna, direkta `dataSource.fetchEvents()`-anrop). Efter
// fixen (`delaMedListan`/`hamtaDashboardEvents`/`hamtaDashboardRegistrations`,
// `src/components/hem/useDashboardData.ts`) är talet 1 vardera — Hem
// återanvänder startvärmningens pågående löfte i stället för att starta ett
// eget.
//
// Samma `QueryClient`+stub-mönster som `tests/api/startvarmningen.test.ts`
// (en RIKTIG QueryClient, inget stubbat objekt — modulerna anropar faktiska
// `ensureQueryData`/`getQueryState`/`fetchQuery`-metoder).

import { expect, test } from '@playwright/test';
import { QueryClient } from '@tanstack/react-query';
import {
  delaMedListan,
  hamtaDashboardEvents,
  hamtaDashboardRegistrations,
} from '../../src/components/hem/hamtaDashboardData';
import type { DataSourceAdapter } from '../../src/data/adapters/DataSourceAdapter';
import { starta } from '../../src/data/warmup/startvarmningen';
import { HEM_SENASTE_AKTIVITET_ANTAL, queryKeys } from '../../src/queries/keys';

/** Distinkta sentinelvärden — bevisar att RÄTT payload kommer tillbaka, inte
 * bara "något". Speglar `startvarmningen.test.ts`s mönster. */
const SENTINEL = {
  events: [{ id: 'e1' }],
  registrations: [{ id: 'r1' }],
  waitlist: [{ id: 'w1' }],
  intresserade: [{ id: 'i1' }],
  maillog: [{ id: 'm1' }],
  segment: [{ id: 's1' }],
  activityLog: { statements: [{ id: 'a1' }], nextCursor: null },
};
/** Ett ANNAT sentinelvärde för "en senare, oberoende hämtning" (steady-
 * state-testet nedan) — bevisar att en poll-hämtning FAKTISKT gick till
 * nätverket och inte bara återanvände en gammal cache-post. */
const SENTINEL_EVENTS_2 = [{ id: 'e2' }];

interface StubOptions {
  delays?: Partial<Record<keyof typeof SENTINEL, number>>;
  hangs?: Array<keyof typeof SENTINEL>;
  /**
   * Hämtningar som settlar först när TESTET självt släpper dem (`slapp(namn)`)
   * i stället för efter en väggklocke-fördröjning.
   *
   * [TASK-451.4 runda 2, granskningens fynd 6] Skälet: ett test vars
   * förutsättning är "hämtning X är fortfarande i flykt när gaten löser ut"
   * blir flakigt så fort förutsättningen bärs av en tidsmarginal — en
   * belastad CI-runner kan låta en `setTimeout(100)` löpa ut före en
   * `timeoutMs: 20`. En STYRD hämtning kan per konstruktion inte settla i
   * förväg, så förutsättningen blir en egenskap hos testet i stället för en
   * förhoppning om maskinen.
   */
  styrda?: Array<keyof typeof SENTINEL>;
}

function stubDataSource(opts: StubOptions = {}): {
  ds: DataSourceAdapter;
  anrop: Record<keyof typeof SENTINEL, number>;
  slapp: (namn: keyof typeof SENTINEL) => void;
} {
  const anrop: Record<keyof typeof SENTINEL, number> = {
    events: 0,
    registrations: 0,
    waitlist: 0,
    intresserade: 0,
    maillog: 0,
    segment: 0,
    activityLog: 0,
  };
  const slappare = new Map<keyof typeof SENTINEL, () => void>();

  function svar<K extends keyof typeof SENTINEL>(namn: K): Promise<(typeof SENTINEL)[K]> {
    anrop[namn] += 1;
    if (opts.hangs?.includes(namn)) {
      return new Promise(() => {}); // avsiktligt aldrig settlad
    }
    if (opts.styrda?.includes(namn)) {
      return new Promise((resolve) => {
        slappare.set(namn, () => resolve(SENTINEL[namn]));
      });
    }
    const delay = opts.delays?.[namn] ?? 1;
    return new Promise((resolve) => {
      setTimeout(() => resolve(SENTINEL[namn]), delay);
    });
  }

  const ds = {
    fetchEvents: () => svar('events'),
    fetchRegistrations: () => svar('registrations'),
    fetchWaitlist: () => svar('waitlist'),
    fetchIntresserade: () => svar('intresserade'),
    fetchMailLog: () => svar('maillog'),
    listSegments: () => svar('segment'),
    fetchActivityLog: () => svar('activityLog'),
  } as unknown as DataSourceAdapter;

  function slapp(namn: keyof typeof SENTINEL): void {
    const slappa = slappare.get(namn);
    if (!slappa) throw new Error(`slapp('${namn}') anropad innan hämtningen ens startat`);
    slappa();
  }

  return { ds, anrop, slapp };
}

/**
 * Väntar tills `villkor` håller, genom att lämna över till händelsekön — inte
 * genom att gissa en fördröjning.
 *
 * `taketMs` är ett HAVERI-tak, inte en förväntad väntan: villkoret håller
 * normalt efter någon enstaka makrotask. Ett test som förlitar sig på detta
 * blir därför långsammare på en belastad maskin, aldrig felaktigt (TASK-451.4
 * runda 2, granskningens fynd 6).
 */
async function vantaTills(villkor: () => boolean, beskrivning: string, taketMs = 10_000) {
  const slutar = Date.now() + taketMs;
  while (!villkor()) {
    if (Date.now() > slutar) throw new Error(`vantaTills: villkoret höll aldrig - ${beskrivning}`);
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}

function nyQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
}

/** Vaktklocka: resolvar med `'VAKT'` efter `ms`. Används för att MÄTA att ett
 * löfte inte settlar, i stället för att påstå det (TASK-451.4). */
function vakt(ms: number): Promise<'VAKT'> {
  return new Promise((resolve) => setTimeout(() => resolve('VAKT'), ms));
}

test.describe('Hem delar startvärmningens hämtningar i flykt (AC #1, rött-först)', () => {
  test('scenario A — batch 1 (events+registrations) fördröjd förbi tidsgränsen ⇒ Hem återanvänder, INGET andra anrop', async () => {
    const { ds, anrop } = stubDataSource({
      delays: { events: 300, registrations: 300 },
    });
    const qc = nyQueryClient();

    // Startvärmningen: timeoutMs (30) << events/registrations-delayen (300)
    // ⇒ gaten släpper via TIMEOUT medan batch 1 fortfarande är i flykt.
    const handle = starta(qc, { dataSource: ds, isOnline: () => true, timeoutMs: 30 });
    const resultat = await handle.slutlofte;

    expect(resultat.utfall).toBe('timeout');
    // Startvärmningen har startat VARDERA anropet exakt en gång.
    expect(anrop.events).toBe(1);
    expect(anrop.registrations).toBe(1);
    // ...och de har INTE hunnit settla än (delayen är 300 ms, timeouten 30 ms).
    expect(qc.getQueryState(queryKeys.events.list)?.fetchStatus).toBe('fetching');
    expect(qc.getQueryState(queryKeys.registrations.all)?.fetchStatus).toBe('fetching');

    // Hem monteras (NastaEvent + NyaAnmalningar/ForfallnaBetalningar mountar
    // samtidigt) — simulerat med exakt den mekanism `useQuery` använder vid
    // mount (`QueryClient#fetchQuery`, samma kod useDashboardEvents/
    // useDashboardRegistrations kör via `queryFn`).
    const [dashboardEvents, dashboardRegistrations] = await Promise.all([
      qc.fetchQuery({
        queryKey: queryKeys.dashboard.events,
        queryFn: () => hamtaDashboardEvents(qc, ds),
      }),
      qc.fetchQuery({
        queryKey: queryKeys.dashboard.registrations,
        queryFn: () => hamtaDashboardRegistrations(qc, ds),
      }),
    ]);

    // RÖTT FÖRE FIXEN: `anrop.events`/`anrop.registrations` hade blivit 2 här
    // (Hems gamla queryFn anropade `dataSource.fetchEvents()`/
    // `fetchRegistrations()` direkt, ovetande om startvärmningens pågående
    // hämtning). GRÖNT EFTER FIXEN: talet står kvar på 1 — Hem delade
    // startvärmningens löfte i stället för att starta ett eget.
    expect(anrop.events).toBe(1);
    expect(anrop.registrations).toBe(1);
    // ...och Hem fick ändå RÄTT data (AC #2 — "utan egen omhämtning").
    expect(dashboardEvents).toEqual(SENTINEL.events);
    expect(dashboardRegistrations).toEqual(SENTINEL.registrations);
    expect(qc.getQueryData(queryKeys.dashboard.events)).toEqual(SENTINEL.events);
    expect(qc.getQueryData(queryKeys.dashboard.registrations)).toEqual(SENTINEL.registrations);
    // Startvärmningens EGEN nyckelfamilj landade också, av samma hämtning.
    expect(qc.getQueryData(queryKeys.events.list)).toEqual(SENTINEL.events);
    expect(qc.getQueryData(queryKeys.registrations.all)).toEqual(SENTINEL.registrations);
  });
});

test.describe('Hems 60 s-poll och 4xx-policy förblir opåverkade (AC #2 — "bryter inte pollingen")', () => {
  test('events.list har FÄRSK cache men INGEN hämtning i flykt ⇒ dashboard-queryn hämtar ändå OBEROENDE (pollen är inte stulen)', async () => {
    // Motbeviset mot en naiv "gå alltid via listnyckeln"-lösning: skulle
    // dashboard-queryn ovillkorligt läsa events.list-cachen hade den fått
    // GAMLA data (SENTINEL_EVENTS_2 hade aldrig hämtats) och Hems 60 s-poll
    // hade tyst slutat betyda något.
    let anropEvents2 = 0;
    const ds = {
      fetchEvents: () => {
        anropEvents2 += 1;
        return Promise.resolve(SENTINEL_EVENTS_2);
      },
    } as unknown as DataSourceAdapter;
    const qc = nyQueryClient();
    // Simulerar produktionens globala 5-min-staleTime (`src/router.ts`) på
    // events.list — precis den "listan är fräsch enligt SIN EGEN klocka"-
    // situationen som skulle lura en ovillkorlig delegering.
    qc.setQueryData(queryKeys.events.list, SENTINEL.events);
    qc.setQueryDefaults(queryKeys.events.list, { staleTime: 5 * 60 * 1000 });
    expect(qc.getQueryState(queryKeys.events.list)?.fetchStatus).toBe('idle');

    const resultat = await hamtaDashboardEvents(qc, ds);

    expect(anropEvents2).toBe(1); // hämtade ändå — oberoende av listans cache
    expect(resultat).toEqual(SENTINEL_EVENTS_2);
  });

  test('inget varmt läge alls (ingen startvärmning, ingen cache) ⇒ EN normal hämtning', async () => {
    const { ds, anrop } = stubDataSource();
    const qc = nyQueryClient();

    const resultat = await hamtaDashboardEvents(qc, ds);

    expect(anrop.events).toBe(1);
    expect(resultat).toEqual(SENTINEL.events);
  });

  test('delaMedListan: en lista som REVALIDERAR I BAKGRUNDEN (fetching MED data) delegerar ALDRIG', async () => {
    // [TASK-451.4, tilläggsorder ur granskningen av PR #2543 — info-fynd (ii)]
    // `delaMedListan`s villkor är TVÅDELAT: `fetchStatus === 'fetching'` OCH
    // `data === undefined`. Den andra halvan saknade eget positivt test —
    // befintliga fall täckte `fetching` + tom cache (delegering) och `idle` +
    // data (ingen delegering), men inte KOMBINATIONEN fetching + data.
    //
    // Varför den grenen MÅSTE falla igenom till en egen hämtning: en
    // bakgrundsrevalidering av listnyckeln bär redan gammal data. Hade
    // dashboard-queryn delegerat dit skulle den fått listans hämtning, vars
    // resultat landar under LISTANS färskhetsregler (global staleTime 5 min)
    // i stället för dashboardens 30 s — exakt den poll-stöld modulens
    // filhuvud varnar för, fast via den andra grenen.
    let listansAnrop = 0;
    let dashboardensAnrop = 0;
    const qc = nyQueryClient();

    // 1. Ge listnyckeln data OCH gör den stale.
    qc.setQueryData(queryKeys.events.list, SENTINEL.events);

    // 2. Starta en bakgrundsrevalidering som HÄNGER ⇒ fetchStatus blir
    //    'fetching' medan data fortfarande finns kvar.
    void qc.fetchQuery({
      queryKey: queryKeys.events.list,
      queryFn: () => {
        listansAnrop += 1;
        return new Promise<typeof SENTINEL.events>(() => {}); // aldrig settlad
      },
    });
    await vakt(10);

    const tillstand = qc.getQueryState(queryKeys.events.list);
    expect(tillstand?.fetchStatus).toBe('fetching');
    expect(tillstand?.data).toEqual(SENTINEL.events); // data finns KVAR
    expect(listansAnrop).toBe(1);

    // 3. Dashboard-hämtningen ska då hämta OBEROENDE, inte delegera.
    const resultat = await delaMedListan(qc, queryKeys.events.list, () => {
      dashboardensAnrop += 1;
      return Promise.resolve(SENTINEL_EVENTS_2);
    });

    expect(dashboardensAnrop).toBe(1);
    expect(resultat).toEqual(SENTINEL_EVENTS_2);
    // Listans hängande revalidering rördes inte — ingen extra start.
    expect(listansAnrop).toBe(1);
  });

  test('delaMedListan: en AVSLUTAD (icke-fetching) lista med data delegerar ALDRIG — direkt-hämtning även om data finns', async () => {
    // Explicit gräns-test av hjälpfunktionen: `fetchStatus !== 'fetching'`
    // räcker för att falla igenom till den oberoende hämtningen, oavsett
    // vad listnyckeln råkar bära.
    let egnaAnrop = 0;
    const qc = nyQueryClient();
    qc.setQueryData(queryKeys.events.list, SENTINEL.events);

    const resultat = await delaMedListan(qc, queryKeys.events.list, () => {
      egnaAnrop += 1;
      return Promise.resolve(SENTINEL_EVENTS_2);
    });

    expect(egnaAnrop).toBe(1);
    expect(resultat).toEqual(SENTINEL_EVENTS_2);
  });
});

test.describe('En EF som ALDRIG svarar (TASK-451.4 AC #1 — skadan tidsgränsen kapar)', () => {
  test('warmups hängande events-hämtning delas av Hem ⇒ ETT anrop, och Hem hänger med den', async () => {
    // [TASK-451.4, tilläggsorder ur granskningen av PR #2543 — info-fynd (i)]
    // `StubOptions.hangs` och dess if-gren i `svar()` var död kod i denna fil
    // (deklarerad, aldrig använd). Den passar exakt AC #1:s scenario, så den
    // tas i bruk här i stället för att rivas — samma stub-form som
    // `startvarmningen.test.ts` redan använder den i.
    //
    // Vad testet fastställer, och varför det hör till DENNA skiva: delningen
    // (TASK-451.3) gör Hem beroende av startvärmningens hämtning. Hänger den,
    // hänger Hem — det är precis den skada som motiverar en tidsgräns. Den
    // gränsen bor i `callEdgeFunction` (`src/data/config/supabase-client.ts`)
    // och kan därför inte mätas genom en STUBBAD adapter; den mäts i
    // `tests/api/hamtningens-tidsgrans.test.ts`. Här mäts kopplingen: att det
    // är EN gemensam hämtning som hänger, inte två oberoende.
    const { ds, anrop } = stubDataSource({ hangs: ['events'] });
    const qc = nyQueryClient();

    const resultat = await starta(qc, { dataSource: ds, isOnline: () => true, timeoutMs: 30 })
      .slutlofte;

    // Gaten släpper på TIMEOUT, och events hann aldrig settla.
    expect(resultat.utfall).toBe('timeout');
    expect(anrop.events).toBe(1);
    expect(qc.getQueryState(queryKeys.events.list)?.fetchStatus).toBe('fetching');
    expect(qc.getQueryState(queryKeys.events.list)?.data).toBeUndefined();
    // TASK-451.2-räknarna: den hängande hämtningen är VARKEN lyckad eller
    // misslyckad än — den har inte settlat, så den kan inte ha räknats.
    expect(resultat.forlopp.lyckade + resultat.forlopp.misslyckade).toBe(resultat.forlopp.klara);
    expect(resultat.forlopp.klara).toBeLessThan(resultat.forlopp.totalt);

    // Hem monterar och delar den hängande hämtningen i stället för att starta
    // ett andra anrop mot samma döda Edge Function.
    const hemsLofte = delaMedListan(qc, queryKeys.events.list, () => ds.fetchEvents());
    const utfall = await Promise.race([
      hemsLofte.then(
        () => 'SETTLADE' as const,
        () => 'SETTLADE' as const,
      ),
      vakt(150),
    ]);

    // Hem hänger med den delade hämtningen — ETT anrop totalt, inte två.
    // I produktion är det denna väntan som `HAMTNINGENS_TIDSGRANS_MS` gör
    // ÄNDLIG: hämtningen avbryts, felet når Hem, och Hem kan visa ett fellage
    // i stället för en skeleton utan slut.
    expect(utfall).toBe('VAKT');
    expect(anrop.events).toBe(1);
  });
});

test.describe('activityLog.latest — nyckelparitet (AC #3, diagnoskartan § 1.10)', () => {
  test('warmups activityLog-hämtning i flykt ⇒ Hems SenasteAktivitetKompakt-hämtning (samma nyckel, ingen dashboard-alias) delas AUTOMATISKT — ingen kodändring behövs', async () => {
    // activityLog är EGEN, sista batchen (BATCH_SIZE=2, 7 items ⇒ rest på 1),
    // så batch 1–3 måste hinna settla innan warmup ens STARTAR den.
    //
    // [Runda 2, granskningens fynd 6] FÖRE denna omgång bars hela
    // förutsättningen av en väggklocke-marginal: `timeoutMs: 20` mot
    // `activityLog`-delay 100 ms. Tre batchar av `setTimeout(1)` plus
    // promise-maskineri måste då rymmas inom 20 ms, OCH den 100 ms långa
    // hämtningen får inte hinna settla — två motriktade tidskrav på en
    // belastad CI-runner med parallella workers.
    //
    // Nu är BÅDA borta:
    //  - `styrda: ['activityLog']` ⇒ hämtningen kan per konstruktion inte
    //    settla förrän testet släpper den. Övre marginalen existerar inte.
    //  - `vantaTills` ⇒ vi väntar på VILLKORET "activityLog har startat" i
    //    stället för att anta att 20 ms räcker. Undre marginalen existerar
    //    inte heller.
    //  - `utfall === 'timeout'` är nu GARANTERAT oavsett last: `korAlla()`
    //    kan inte bli klar medan activityLog hålls, så gaten måste vinna.
    const { ds, anrop, slapp } = stubDataSource({
      delays: {
        events: 1,
        registrations: 1,
        waitlist: 1,
        intresserade: 1,
        maillog: 1,
        segment: 1,
      },
      styrda: ['activityLog'],
    });
    const qc = nyQueryClient();

    const handle = starta(qc, { dataSource: ds, isOnline: () => true, timeoutMs: 50 });
    await vantaTills(
      () => anrop.activityLog === 1,
      'startvärmningen startade activityLog-hämtningen',
    );

    const resultat = await handle.slutlofte;

    expect(resultat.utfall).toBe('timeout');
    expect(anrop.activityLog).toBe(1); // startvärmningen har startat den EN gång
    expect(
      qc.getQueryState(queryKeys.activityLog.latest(HEM_SENASTE_AKTIVITET_ANTAL))?.fetchStatus,
    ).toBe('fetching');

    // `SenasteAktivitetKompakt` → `useLatestActivity(HEM_SENASTE_AKTIVITET_ANTAL)`
    // (src/data/queries/useActivityLog.ts) läser SAMMA nyckel som
    // startvärmningens `activityLog`-item — INGEN dashboard-alias, INGEN
    // `delaMedListan`-delegering. Simulerat med samma `fetchQuery`-mekanism
    // som `useQuery` kör vid mount, med EXAKT samma queryFn hooken använder.
    //
    // Hämtningen startas FÖRE släppet, så den måste dela det pågående
    // löftet — det är precis egenskapen som mäts.
    const hemsLofte = qc.fetchQuery({
      queryKey: queryKeys.activityLog.latest(HEM_SENASTE_AKTIVITET_ANTAL),
      queryFn: () => ds.fetchActivityLog({ pageSize: HEM_SENASTE_AKTIVITET_ANTAL }),
    });
    slapp('activityLog');
    const hemsData = await hemsLofte;

    // Nyckelpariteten (diagnoskartan § 1.10) höll redan — TanStack Querys
    // EGEN per-nyckel-dedup (samma `Query#fetch()`-mekanism som
    // `delaMedListan` lutar sig mot ovan) delade hämtningen automatiskt.
    expect(anrop.activityLog).toBe(1); // OFÖRÄNDRAT — inget andra anrop
    expect(hemsData).toEqual(SENTINEL.activityLog);
    expect(qc.getQueryData(queryKeys.activityLog.latest(HEM_SENASTE_AKTIVITET_ANTAL))).toEqual(
      SENTINEL.activityLog,
    );
  });
});
