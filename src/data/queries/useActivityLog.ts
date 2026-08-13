import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { ActivityLogFilters } from '@/domain/types/Filters';
import { queryKeys } from '@/queries/keys';

/**
 * Aktivitetsloggens läs-hooks (TASK-201.5). Delad DATALAGER-yta för TVÅ
 * oberoende konsumenter (per kortets egen beskrivning): `useActivityLogHistory`
 * för den fulla historikvyn (TASK-201.6, sannolikt paginering/filtrering) och
 * `useLatestActivity` för hem-spaltens K10-facit-form (TASK-201.7, "de
 * senaste posterna"). Ny hemvist `src/data/queries/` — läs-analogen till
 * `src/data/mutations/use*.ts` (samma `use<Namn>.ts`-filnamnskonvention,
 * bara för LÄSNING i stället för skrivning). Ingen tidigare `queries/`-mapp
 * fanns; övriga läs-hooks lever antingen inline i sin konsumerande komponent
 * (`PersonsList.tsx`) eller feature-scopat (`src/components/hem/
 * useDashboardData.ts`) — ingen av de formerna passar en hook som från
 * grunden ska delas av TVÅ ÄNNU OBYGGDA feature-ytor (kärnvy + hem-spalt).
 *
 * BÅDA hooksen går via `useDataSource()` (router-context-DI, ADR-055) →
 * `fetchActivityLog` (adaptern) → `get-activity-log`-EF:en — samma
 * åtkomstprecedens som `useDashboardEvents`/`PersonsList`.
 *
 * Ingen polling här (skiljer sig medvetet från `useDashboardData.ts`s
 * `DASHBOARD_POLLING`) — och färskheten är AVGJORD sedan TASK-210, inte
 * längre uppskjuten. Den globala `staleTime`/`refetchOnWindowFocus`
 * (`src/router.ts`) gäller alltjämt och är MEDVETET orörd, men den är inte
 * längre det enda som styr: `recordActivity` invaliderar
 * `queryKeys.activityLog.all` när ett statement faktiskt skrivits, så en
 * loggad handling gör loggen inaktuell i samma ögonblick den sker.
 *
 * Det är därför varken polling eller en egen `staleTime` behövs här.
 * Polling hade frågat servern om och om igen i blindo; en lokal `staleTime: 0`
 * hade gjort VARJE fönsterfokus till en omhämtning, även när ingenting hänt.
 * Invalideringen är i stället händelsestyrd — noll anrop när Lotta inte gjort
 * något, omedelbar färskhet när hon gjort något. Bakgrund (Marcus-order
 * 2026-08-13 "Lös det!"): spalten visade i upp till fem minuter inte den
 * anteckning som just skrivits, medan historikvyn gjorde det.
 */

const HISTORY_PAGE_SIZE = 20;
const LATEST_DEFAULT_LIMIT = 5;

/**
 * Historikvyns (TASK-201.6) läsning — cursor-paginerad via `useInfiniteQuery`,
 * speglar `PersonsList.tsx`s `listPersons`-konsumtion EXAKT (samma
 * `initialPageParam`/`getNextPageParam`-form). `filters` (kategori/eventId/
 * tidsintervall, TASK-201.8s filterrad) ingår i `queryKey` — en ändrad
 * filterkombination är server-side en ANNAN datamängd, inte en klient-side-
 * omfiltrering av samma sida. En ny filterkombination har därför sin EGEN
 * cursor-historik (`initialPageParam` startar om vid `null`) — React Query
 * håller varje `queryKey` isolerad, så ett filterbyte kan aldrig blanda en
 * gammal sidas markör med en ny filtermängd (TASK-201.8 § "filterbyte mitt i
 * paginering").
 *
 * `placeholderData: keepPreviousData` (samma mekanism som
 * `useDashboardData.ts`s `DASHBOARD_POLLING`, samma motiv: "tidigare data
 * renderas orörd under tyst omhämtning"): UTAN den skulle varje filterbyte
 * slå om `status` till `'pending'` mitt i sessionen — konsumenten
 * (`AktivitetsHistorik.tsx`) grenar då till sin bara laddnings-vy och
 * FILTERRADEN (TASK-201.8) hade unmountats under egna fötterna på den
 * kontroll användaren just interagerade med (fokus-tapp, AC #3s
 * tangentbordsväg). Ett ÄKTA första besök (ingen tidigare data i NÅGON
 * queryKey) är opåverkat — där finns inget att falla tillbaka på, så
 * `isPending` förblir sant precis som innan denna rad fanns (TASK-201.6:s
 * ursprungliga laddningsgren är alltså orörd).
 */
export function useActivityLogHistory(filters: ActivityLogFilters = {}) {
  const dataSource = useDataSource();
  return useInfiniteQuery({
    queryKey: queryKeys.activityLog.history(filters),
    queryFn: ({ pageParam }) =>
      dataSource.fetchActivityLog({
        ...filters,
        cursor: pageParam ?? undefined,
        pageSize: HISTORY_PAGE_SIZE,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hem-spaltens (TASK-201.7) läsning — EN liten, opaginerad sida (K10-facit:
 * "de senaste posterna", `limit` default 5 — se filhuvudets K10-prototyp-
 * referens i backlog-kortets slutrapport för det talets källa; TASK-201.7
 * kan ändra det utan att röra denna hooks form eftersom `limit` redan är ett
 * argument, inte ett hårdkodat värde). Ingen `nextCursor`-hantering —
 * spalten "Ladda fler":ar aldrig, den länkar till hela historiken (201.6).
 */
export function useLatestActivity(limit: number = LATEST_DEFAULT_LIMIT) {
  const dataSource = useDataSource();
  return useQuery({
    queryKey: queryKeys.activityLog.latest(limit),
    queryFn: () => dataSource.fetchActivityLog({ pageSize: limit }),
  });
}
