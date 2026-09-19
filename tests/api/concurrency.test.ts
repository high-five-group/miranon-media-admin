// Enhetstest för withConcurrencyLimit (TASK-458 review-runda 1 FYND A —
// bibliotekskod delad av get-events och get-event-attachments saknade eget
// test; git grep withConcurrencyLimit origin/main -- 'tests/**' gav 0
// träffar innan denna fil).
//
// api-pure (ren logik, ingen staging, NOLL nätverk): modulen
// (`_shared/concurrency.ts`) är transitivt Deno-fri — noll importer, ingen
// `Deno.`-referens — och Node-typkollas via tsconfig.edge-shared.json:s
// include-lista. Denna fil bevisar det ÄVEN på RUNTIME-nivå: importen sker
// direkt, ingen mock, samma sökväg get-events/get-event-attachments använder.
//
// Ingen riktig tid förflyter i någon av testerna — alla scenarier styrs med
// manuellt upplösta promises (`deferred()`) + en makrotask-flush (`tick()`)
// i stället för `setTimeout`-fördröjningar, samma "injicerad tid, aldrig
// riktig tid"-disciplin som `airtable-retry.test.ts` redan etablerat för
// denna sviten. Determinismen är avsiktlig: en tids-baserad concurrency-
// test som råkar bli flakig under CI-last vore precis den typ av instabilt
// bevis repot varnar för (`metrics:flake`-disciplinen, CLAUDE.md).

import { expect, test } from '@playwright/test';
import { withConcurrencyLimit } from '../../supabase/functions/_shared/concurrency';

/** En promise vars resolve/reject styrs utifrån — inget kapplöpningsläge mot riktig tid. */
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Flush:ar HELA mikrotask-kön (alla `.then`/`await`-kedjor som redan är
 * klara att köra) genom att vänta in en MAKROtask (`setImmediate`).
 * Robustare än att räkna `await Promise.resolve()`-varv för hand — antalet
 * mikrotask-hopp mellan ett `resolve()`-anrop och att en worker-loop plockar
 * nästa task är ett implementationsdetalj (hur många `.then`-led kedjan har),
 * inte något testet ska behöva känna till exakt.
 */
function tick(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

test.describe('withConcurrencyLimit — ORDNING (AC: index-ordning oavsett avslutningsordning)', () => {
  test('alla tasks startar SAMTIDIGT när limit >= antal tasks (limit=3, 3 tasks)', async () => {
    const d = [deferred<string>(), deferred<string>(), deferred<string>()];
    const startOrder: number[] = [];
    const tasks = d.map((def, i) => () => {
      startOrder.push(i);
      return def.promise;
    });

    const resultPromise = withConcurrencyLimit(tasks, 3);

    // Synkront direkt efter anropet — INGEN await ännu — har alla tre workers
    // redan grabbat sin task (limit >= n ⇒ Array.from skapar 3 workers, och
    // varje worker() kör sin task SYNKRONT fram till sin egen första await).
    expect(startOrder).toEqual([0, 1, 2]);

    // Lös upp i OMVÄND ordning — task 2 (sist startad) avslutas FÖRST,
    // task 0 (först startad) avslutas SIST.
    d[2].resolve('resultat-2');
    await tick();
    d[1].resolve('resultat-1');
    await tick();
    d[0].resolve('resultat-0');

    const results = await resultPromise;
    // results ska ändå vara i INDEX-ordning, inte avslutningsordning.
    expect(results).toEqual(['resultat-0', 'resultat-1', 'resultat-2']);
  });

  test('BLANDAD ordning under partiell samtidighet (limit=2, 4 tasks) — en workerplats återanvänds', async () => {
    const d = [deferred<string>(), deferred<string>(), deferred<string>(), deferred<string>()];
    const startOrder: number[] = [];
    const finishOrder: number[] = [];
    const tasks = d.map((def, i) => () => {
      startOrder.push(i);
      return def.promise.then((v) => {
        finishOrder.push(i);
        return v;
      });
    });

    const resultPromise = withConcurrencyLimit(tasks, 2);

    // Endast de FÖRSTA två (limit=2) har startat hittills.
    expect(startOrder).toEqual([0, 1]);

    // Task 1 (index 1) avslutas FÖRST — frigör en plats som grabbar task 2.
    d[1].resolve('r1');
    await tick();
    expect(startOrder).toEqual([0, 1, 2]);

    // Task 2 avslutas näst — frigör en plats som grabbar task 3 (sista).
    d[2].resolve('r2');
    await tick();
    expect(startOrder).toEqual([0, 1, 2, 3]);

    // Task 3 avslutas härnäst, task 0 (startad allra först) avslutas SIST.
    d[3].resolve('r3');
    await tick();
    d[0].resolve('r0');

    const results = await resultPromise;
    // Faktisk avslutningsordning var 1,2,3,0 — INTE 0,1,2,3 — så detta bevisar
    // att index-ordningen INTE bara råkar sammanfalla med avslutningsordningen.
    expect(finishOrder).toEqual([1, 2, 3, 0]);
    expect(results).toEqual(['r0', 'r1', 'r2', 'r3']);
  });
});

test.describe('withConcurrencyLimit — TAKET (AC: aldrig fler än limit i flykt, alla tasks körs)', () => {
  /** Riggar n tasks som spårar in/ut + peak samtidighet, styrt med deferred (taket anges per anrop). */
  function riggaTak(n: number) {
    const deferreds = Array.from({ length: n }, () => deferred<number>());
    let inFlight = 0;
    let peak = 0;
    const startedIndices: number[] = [];
    const tasks = deferreds.map((d, idx) => () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      startedIndices.push(idx);
      return d.promise.then((v) => {
        inFlight--;
        return v;
      });
    });
    return { deferreds, tasks, startedIndices, peakRef: () => peak, inFlightRef: () => inFlight };
  }

  test('limit=2, 5 tasks: peak-samtidighet är EXAKT 2, aldrig fler, alla 5 körs', async () => {
    const { deferreds, tasks, startedIndices, peakRef, inFlightRef } = riggaTak(5);

    const resultPromise = withConcurrencyLimit(tasks, 2);

    expect(startedIndices).toEqual([0, 1]);
    expect(inFlightRef()).toBe(2);
    expect(peakRef()).toBe(2);

    deferreds[0].resolve(100);
    await tick();
    expect(startedIndices).toEqual([0, 1, 2]);
    expect(inFlightRef()).toBe(2); // en klar (0), en ny startad (2), en oförändrad (1)
    expect(peakRef()).toBe(2); // taket höll hela vägen

    deferreds[1].resolve(101);
    await tick();
    expect(startedIndices).toEqual([0, 1, 2, 3]);

    deferreds[2].resolve(102);
    await tick();
    expect(startedIndices).toEqual([0, 1, 2, 3, 4]);

    deferreds[3].resolve(103);
    deferreds[4].resolve(104);

    const results = await resultPromise;
    expect(results).toEqual([100, 101, 102, 103, 104]);
    expect(peakRef()).toBe(2); // bevisar att taket verkligen NÅDDES, inte bara aldrig överskreds
    expect(inFlightRef()).toBe(0); // allt städat — inget "läckt" i flykt
  });

  test('KANTFALL — limit >= antal tasks (limit=10, 3 tasks): peak = 3, inget artificiellt tak', async () => {
    const { deferreds, tasks, startedIndices, peakRef } = riggaTak(3);
    const resultPromise = withConcurrencyLimit(tasks, 10);

    expect(startedIndices).toEqual([0, 1, 2]); // alla startar direkt — Math.min(10,3)=3 workers
    expect(peakRef()).toBe(3);

    for (const d of deferreds) d.resolve(0);
    await resultPromise;
    expect(peakRef()).toBe(3);
  });

  test('KANTFALL — limit=1: strikt sekventiellt, peak = 1, nästa startar ALDRIG före föregående klar', async () => {
    const { deferreds, tasks, startedIndices, peakRef, inFlightRef } = riggaTak(3);
    const resultPromise = withConcurrencyLimit(tasks, 1);

    expect(startedIndices).toEqual([0]); // BARA task 0 — ingen annan worker finns
    expect(peakRef()).toBe(1);

    deferreds[0].resolve(1);
    await tick();
    expect(startedIndices).toEqual([0, 1]); // task 1 startar FÖRST nu, aldrig tidigare
    expect(inFlightRef()).toBe(1); // aldrig 2 — sekventiellt

    deferreds[1].resolve(2);
    await tick();
    expect(startedIndices).toEqual([0, 1, 2]);

    deferreds[2].resolve(3);
    const results = await resultPromise;
    expect(results).toEqual([1, 2, 3]);
    expect(peakRef()).toBe(1); // ALDRIG mer än 1 samtidigt, hela körningen
  });

  test('KANTFALL — tom lista: resolvar direkt med [], inga tasks anropas, inget hänger', async () => {
    const tasks: (() => Promise<number>)[] = [];
    const results = await withConcurrencyLimit(tasks, 2);
    expect(results).toEqual([]);
  });

  test('KANTFALL — tom lista med limit=0: samma resultat, Math.min(0,0) ger noll workers', async () => {
    const results = await withConcurrencyLimit([], 0);
    expect(results).toEqual([]);
  });
});

test.describe('withConcurrencyLimit — FELPROPAGERING (AC: samma fel, ingen tyst svälining/delresultat)', () => {
  test('en rejectande task ger SAMMA felobjekt (referentiell likhet) — aldrig ett omslutet/nytt fel', async () => {
    const felet = new Error('chunk-fel-42');
    const tasks = [() => Promise.reject(felet), () => Promise.resolve('ok')];

    await expect(withConcurrencyLimit(tasks, 2)).rejects.toBe(felet);
  });

  test('inget delresultat: anropet REJECTAR strikt, resolvar aldrig med en partiell array', async () => {
    const felet = new Error('chunk-fel-partiell');
    let settledMed: 'resolved' | 'rejected' | null = null;
    const tasks = [
      () => Promise.resolve('a'),
      () => Promise.reject(felet),
      () => Promise.resolve('c'),
    ];

    try {
      await withConcurrencyLimit(tasks, 3);
      settledMed = 'resolved';
    } catch {
      settledMed = 'rejected';
    }
    expect(settledMed).toBe('rejected'); // ALDRIG 'resolved' — ingen tyst delresultat-väg finns
  });

  test('FAKTISKT BETEENDE, limit=1 (sekventiellt): ETT fel dödar workern direkt — INGEN task efter felet startas', async () => {
    const felet = new Error('fel-sekventiellt');
    const events: string[] = [];
    const tasks = [
      () => {
        events.push('start-0');
        return Promise.reject(felet);
      },
      () => {
        events.push('start-1');
        return Promise.resolve('ok-1');
      },
    ];

    await expect(withConcurrencyLimit(tasks, 1)).rejects.toBe(felet);
    await tick();
    // Vid limit=1 finns EN enda worker — den dör med felet, ingen annan worker
    // finns kvar för att grabba task 1. Detta är den SÄKRA kanten.
    expect(events).toEqual(['start-0']);
  });

  test('FAKTISKT BETEENDE, limit=2 (parallellt): en REDAN STARTAD task fortsätter, och startar ÄNNU EN task — EFTER att anropet redan rejectat', async () => {
    // Detta är den fällan review-fyndet frågar efter: withConcurrencyLimit
    // AVBRYTER inte överlevande workers när en annan worker fallerar —
    // Promise.all() slutar bara VÄNTA på dem, den CANCELLAR dem inte (JS-
    // promises kan inte cancellas). En redan igångsatt worker fortsätter sin
    // while-loop och kan grabba och köra FLER tasks — i denna EF:s fall
    // FLER Airtable-anrop — även efter att det yttre anropet redan har
    // rejectat till sin anropare.
    const felet = new Error('fel-parallellt');
    const events: string[] = [];

    const dSlowSurvivor = deferred<string>(); // task 1 — "redan startad", överlever felet
    const idx0Reject = () => {
      events.push('start-0-och-reject');
      return Promise.reject(felet);
    };
    const idx1SlowSurvivor = () => {
      events.push('start-1');
      return dSlowSurvivor.promise;
    };
    const idx2NotYetStarted = () => {
      events.push('start-2-EFTER-felet');
      return Promise.resolve('ok-2');
    };

    const tasks = [idx0Reject, idx1SlowSurvivor, idx2NotYetStarted];
    const callPromise = withConcurrencyLimit(tasks, 2);

    // Task 0 och task 1 startar båda SYNKRONT (limit=2 ⇒ två workers).
    expect(events).toEqual(['start-0-och-reject', 'start-1']);

    // Vänta in att anropet FAKTISKT har rejectat till sin anropare.
    await expect(callPromise).rejects.toBe(felet);
    events.push('anropet-har-rejectat');

    // Vid DENNA punkt: task 2 har INTE startat än (worker 2 väntar
    // fortfarande på dSlowSurvivor). Anropet har redan settlat till en
    // rejection — men worker 2 lever fortfarande.
    expect(events).toEqual(['start-0-och-reject', 'start-1', 'anropet-har-rejectat']);

    // Lös upp den överlevande workerns task — den loopar och grabbar task 2.
    dSlowSurvivor.resolve('ok-1-for-sent-for-att-spela-nagon-roll');
    await tick();

    // BEVIS: task 2 startades — och EFTER att anropet redan hade rejectat.
    expect(events).toContain('start-2-EFTER-felet');
    expect(events.indexOf('start-2-EFTER-felet')).toBeGreaterThan(
      events.indexOf('anropet-har-rejectat'),
    );

    // Relevans för P4 (5 req/s delat tak, docs/reference/airtable-constraints.md):
    // detta bevisar att FLER Airtable-anrop KAN avfyras efter att get-events
    // redan svarat med ett fel till sin klient — se PR-kroppen/kortets notes
    // för den fulla motiveringen (FYND B).
  });
});
