// Klient-sidig "hämta allt"-primitiv över en cursor-paginerad EF-port
// (ADR-056), TASK-350. get-leads (och get-persons sök-/cursor-grenen) svarar
// EN sida per anrop och en opak `nextCursor` (`null` på sista sidan) — exakt
// ADR-056:s kontrakt. `AirtableAdapter.fetchIntresserade` hämtade tidigare
// bara den FÖRSTA sidan (`callEdgeFunction('get-leads')` utan cursor-loop),
// vilket klampade Intresserade-listan till EF:ens `DEFAULT_PAGE_SIZE = 50`
// oavsett verkligt antal — samma felklass som S109:s get-persons-incident.
//
// VARFÖR EN EGEN, PARAMETERLÖS HJÄLPARE OCH INTE EN EF-SIDIG "register=true"-
// GREN (kontrastera ADR-123 beslut 1, get-persons): Personregistret fick sitt
// EGNA EF-registerläge för att PersonsList behöver sök, bokstavsindex och
// svensk sortering i klienten — regelbunden, tung, återkommande last för en
// stor tabell. Intresserade har inget av det (ren läslista, server-sortering
// bevaras, TASK-350 AC #3): en klient-sidig walk över den REDAN deployade
// cursor-porten ger samma "hämta allt"-resultat utan en andra EF-gren och
// utan att mutera/omdeploya `get-leads` (S113-lärdomen: en muterad EF
// deployas aldrig löpande till delad staging). Blir Intresserade-mängden
// någon gång lika stor/sök-tung som Personer är ett EF-registerläge en
// uppgraderingsväg — inte denna skivas omfattning.
//
// REN FUNKTION, INJICERAD SIDHÄMTARE: `hamtaSida` känner varken till
// `callEdgeFunction`, auth eller vilken EF som anropas — samma
// dependency-injection-mönster som `supabase/functions/_shared/
// storage-kopiera.ts`s `fetchImpl` (se dess filhuvud), av samma skäl:
// `AirtableAdapter`s riktiga nätverksväg (`callEdgeFunction` →
// `getAuthHeader` → `supabase.auth.getSession()`) kräver en levande
// webbläsarsession som inte går att fejka i ett api-pure-test (ingen DI-
// punkt i SDK:t). Genom att bryta ut just sidvandrings-logiken blir den
// testbar isolerat, utan att fejka auth eller nätverk — se
// `tests/api/cursor-walk.test.ts`.

/** En hämtad sida: posterna på just den sidan + nästa opaka cursor (`null` = sista sidan). */
export interface CursorSida<T> {
  poster: T[];
  nextCursor: string | null;
}

/**
 * Väljer varje sida via `hamtaSida` tills `nextCursor` är `null`, och
 * ackumulerar samtliga poster till EN array i samma ordning EF:en levererade
 * dem (server-sorteringen bevaras — TASK-350 AC #3, ingen omsortering här).
 *
 * `maxSidor` är ett säkerhetstak (default 1000, gott om marginal mot varje
 * realistisk Intresserade-mängd): en EF som av bugg aldrig null-terminerar
 * sin `nextCursor` ska ge ett tydligt fel här, aldrig en oändlig loop i
 * klienten.
 */
export async function samlaCursorSidor<T>(
  hamtaSida: (cursor: string | undefined) => Promise<CursorSida<T>>,
  maxSidor = 1000,
): Promise<T[]> {
  const alla: T[] = [];
  let cursor: string | undefined;

  for (let sida = 0; sida < maxSidor; sida += 1) {
    const { poster, nextCursor } = await hamtaSida(cursor);
    alla.push(...poster);
    if (!nextCursor) return alla;
    cursor = nextCursor;
  }

  throw new Error(
    `samlaCursorSidor: säkerhetstaket (${maxSidor} sidor) nått utan null-terminerad nextCursor (trolig EF-bugg)`,
  );
}
