import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { DataSourceAdapter } from '@/data/adapters/DataSourceAdapter';
import { queryKeys } from '@/queries/keys';

/**
 * TASK-451.3 — hämta en gång, dela ÄVEN på timeout-vägen (ADR-112 beslut 4,
 * `docs/research/kallstarten-diagnoskarta-2026-09-18.md` § 1.10/§ 5.3
 * scenario A/§ 10). Startvärmningen (`src/data/warmup/startvarmningen.ts`)
 * hämtar events/registrations mot `events.list`/`registrations.all` och
 * seedar `dashboard.events`/`dashboard.registrations` FÖRST EFTER resolve.
 * Släpper den hårda 9 s-timeouten innan den hämtningen hunnit landa
 * (ADR-112 beslut 3s dokumenterade fallback), monteras Hem med tomma
 * `dashboard.*`-nycklar — MEN startvärmningens `events.list`/
 * `registrations.all`-hämtning fortsätter köra i bakgrunden (inget
 * `AbortController`, se startvarmningen.ts § "Hård timeout"). Utan denna
 * funktion startade Hems egna queryFn:er (`dataSource.fetchEvents()`/
 * `fetchRegistrations()` direkt) ett ANDRA anrop mot samma tröga Edge
 * Function — TanStack Query deduplicerar bara hämtningar mot EXAKT SAMMA
 * `queryKey`, och `dashboard.events` är en MEDVETET skild nyckel från
 * `events.list` (se `queryKeys.dashboard` i `@/queries/keys` — "Egna nycklar
 * gör polling-scopet exakt").
 *
 * KÄLLA (installerad `@tanstack/query-core` 5.102.2,
 * `node_modules/@tanstack/query-core/build/modern/query.js:159–166`):
 * `Query#fetch()` kollar `this.state.fetchStatus !== 'idle'` FÖRST — är en
 * hämtning redan i flykt UTAN cachad data returneras den BEFINTLIGA
 * retryerns promise (`this.#retryer.promise`) i stället för att starta ett
 * nytt anrop. En andra `qc.ensureQueryData({ queryKey: listNyckeln, ... })`
 * mot SAMMA `listNyckeln` som startvärmningen redan hämtar under träffar
 * alltså samma Query-instans (`QueryCache#build()`,
 * `node_modules/@tanstack/query-core/build/modern/queryClient.js:75-82`+
 * `171-176` — cachen slår upp på `queryHash`, inte anropare) och delar dess
 * EN pågående nätverksanrop — exakt "hämta en gång, dela".
 *
 * VIKTIGT — varför detta INTE är ett naivt "gå alltid via listnyckeln":
 * `events.list`s EGEN `staleTime` är den GLOBALA 5-minutersdefaulten
 * (`src/router.ts`), långt trögare än dashboardens `DASHBOARD_POLLING`
 * (`staleTime: 30_000`, `refetchInterval: 60_000`,
 * `src/components/hem/useDashboardData.ts`). Om varje dashboard-hämtning
 * OVILLKORLIGT gick via `ensureQueryData(events.list, …)` skulle
 * `queryClient.js:75-82`s cache-träffs-genväg ("finns data, är den inte
 * stale enligt LISTANS egen klocka → returnera direkt, ingen fetch") tyst
 * ha stulit Hems 60 s-poll och serverat upp till 5 minuter gammal data.
 * Delningen sker därför ENDAST när listnyckeln FAKTISKT har en hämtning i
 * flykt UTAN cachad data (den exakta timeout-race-formen ovan) — annars
 * hämtar dashboard-queryn OFÖRÄNDRAT direkt mot adaptern, precis som innan
 * denna skiva. `DASHBOARD_POLLING`/`noRetryOn4xx` (i `useDashboardData.ts`)
 * är därmed helt orörda utanför just detta smala race-fönster.
 *
 * [STÄNGD av TASK-451.4 — kanten stod här som öppet bokförd] I DELNINGS-grenen
 * ärvde dashboard-hämtningen listnyckelns EGEN retry-policy (global default,
 * `retry: 3`, INGEN 4xx-genväg) i stället för `noRetryOn4xx`: en 4xx i just
 * det race-fönstret tog upp till tre interna backoff-försök (~1,4 s) innan
 * felet nådde Hem, i stället för att fela direkt.
 *
 * Kanten är stängd, och inte med en lapp på detta ställe: `events.list` och
 * `registrations.all` bär sedan TASK-451.4 `retry: false` via
 * `setQueryDefaults` (`src/queries/warmup-retry-policy.ts`). Delnings-grenens
 * `ensureQueryData` nedan ärver därmed SAMMA policy som startvärmningen
 * själv, och ett 4xx i race-fönstret når Hem direkt. Att policyn bor på
 * NYCKELN i stället för hos någon av de tre konsumenterna (warmup,
 * `delaMedListan`, list-vyn) är just vad som gör att de inte kan glida isär —
 * samma resonemang som TASK-420 och TASK-286.4 redan etablerat.
 *
 * EGEN MODUL, INTE inline i `useDashboardData.ts` (TASK-451.3, speglar
 * `startvarmningen.ts`s filhuvuds § om `dataSource`-injektionens
 * testbarhetsskäl): `useDashboardData.ts` importerar `@/queries/persist`
 * (`PERSIST_MAX_AGE_MS`, för `DASHBOARD_POLLING.gcTime`) — den filen kör
 * `createSyncStoragePersister({ storage: window.localStorage })` vid
 * MODUL-LADDNING, inte bara vid typ-kontroll. En hermetisk
 * `tests/api/*.test.ts`-fil (`tsconfig.tests.json`, `"types": ["node"]`,
 * ingen DOM/`window`) som importerade `useDashboardData.ts` direkt hade
 * alltså kraschat vid IMPORT-tillfället (`window is not defined`), inte bara
 * fällt typkontrollen — mätt konkret vid bygget (`npm run typecheck` fällde
 * `TS2304: Cannot find name '__APP_VERSION__'` via samma kedja,
 * `src/queries/persist.ts` läser den build-injicerade `__APP_VERSION__`-
 * globalen som bara `tsconfig.app.json` känner till). Denna modul importerar
 * ENDAST typer (`QueryClient`/`QueryKey`, `DataSourceAdapter`) plus den
 * sido-effektfria `queryKeys`-konstanten — säker att importera från
 * `tests/api/hem-delad-hamtning.test.ts` utan React, router-context eller DOM.
 */
export function delaMedListan<T>(
  qc: QueryClient,
  listQueryKey: QueryKey,
  hamta: () => Promise<T>,
): Promise<T> {
  const listState = qc.getQueryState(listQueryKey);
  if (listState?.fetchStatus === 'fetching' && listState.data === undefined) {
    return qc.ensureQueryData({ queryKey: listQueryKey, queryFn: hamta });
  }
  return hamta();
}

/** Se {@link delaMedListan}. Konsumeras av `useDashboardEvents`s queryFn
 * (`useDashboardData.ts`) OCH av det hermetiska testet direkt. */
export function hamtaDashboardEvents(qc: QueryClient, dataSource: DataSourceAdapter) {
  return delaMedListan(qc, queryKeys.events.list, () => dataSource.fetchEvents());
}

/** Se {@link delaMedListan} / {@link hamtaDashboardEvents}. */
export function hamtaDashboardRegistrations(qc: QueryClient, dataSource: DataSourceAdapter) {
  return delaMedListan(qc, queryKeys.registrations.all, () => dataSource.fetchRegistrations());
}
