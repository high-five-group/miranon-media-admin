// _shared/concurrency.ts — worker-pool-samtidighet för chunkade batch-anrop
// (TASK-458). RENT, transitivt Deno-fritt (ingen import alls) — Node-
// typkollad via tsconfig.edge-shared.json, se den filens § LÄGGER DU TILL
// EN MODUL HÄR.
//
// LYFT UR get-event-attachments/index.ts (TASK-416.12 runda 2), som förde
// in mönstret för att chunka Bilagor-batchen parallellt i stället för en
// sekventiell for-loop med await. TASK-458 återanvänder EXAKT samma
// funktion för get-events Bor-över-batch (fetchByRecordIds) i stället för
// att kopiera den — två oberoende chunk-parallelliserare i samma kodbas
// hade varit precis den håll-i-synk-plikt `_shared/`-mappen finns för att
// undvika.
//
// Ingen extern dependency (p-limit e.dyl.) behövs för ett litet, fast
// samtidighetstak: varje "worker" plockar nästa lediga index tills kön är
// tom.

/**
 * Kör `tasks` med högst `limit` samtidiga anrop. Resultatet returneras i
 * SAMMA ORDNING som `tasks` (indexerad skrivning, inte push) — deterministiskt
 * oavsett i vilken ordning de enskilda anropen faktiskt svarar.
 */
export async function withConcurrencyLimit<T>(
  tasks: readonly (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}
