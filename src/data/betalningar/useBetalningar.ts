import { useQuery } from '@tanstack/react-query';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Inbetalningslista, OppnaBetalningar } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * [TASK-346.7.1] Husets etablerade EdgeFunctionError-medvetna retry-policy —
 * SAMMA lambda-form som `PersonDetail.tsx`/`EventDetail.tsx`/
 * `EventRegistrations.tsx` m.fl. redan bär, kopierad hit i stället för
 * abstraherad: majoriteten av husets EF-backade queries duplicerar denna
 * exakta form inline (`useDashboardData.ts`s lokala `noRetryOn4xx` är
 * undantaget, inte normen), och att extrahera en delad export här hade varit
 * att uppfinna ett fjärde mönster där tre redan finns.
 *
 * UTAN denna rad ärvde de tre hookarna nedan routerns naiva globala
 * `retry: 3` (router.ts) — som retryar BLINT även på 4xx (ett fel Lotta
 * aldrig kan läka genom att vänta). Fynd: `TASK-346.7.1`, orkestrerarens
 * S113-slutvandring 2026-08-31 (persondetalj `rec2JwV3Bh0x5qlvl`,
 * `hamta-inbetalningar` 500, felläget syntes aldrig inom 14+ s).
 */
const husetsRetryPolicy = (failureCount: number, err: Error): boolean =>
  !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) && failureCount < 3;

/**
 * [TASK-346.7] Läsningarna som de FYRA ytorna utanför inkorgen delar:
 * Hem-kortet, Åtgärds-panelen, anmälans detaljvy och personkortet.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `refetchOnMount: 'always'` PÅ BÅDA, AV SAMMA MÄTTA SKÄL
 * ═══════════════════════════════════════════════════════════════════════════
 * Routerns globala `staleTime` är 5 minuter och hela cachen persistas i 24
 * timmar (`src/router.ts`, ADR-072). Utan raden serveras en betalningsyta
 * HELT ur den persisterade cachen när Lotta öppnar appen igen inom fönstret.
 *
 * Det är inte en teoretisk risk: acceptansvandringen 2026-08-31 (TASK-346.6)
 * mätte att inkorgen visade gamla belopp efter att inbetalningar makulerats -
 * "Saknas 1 500 kr" på en rad där 2 500 saknades. Ett saldo som Lotta
 * registrerar MOT måste vara läst nu, inte för fem minuter sedan.
 *
 * `'always'` OCH INTE `staleTime: 0`: den senare hade gjort varje
 * fönsterfokus till en omhämtning (`refetchOnWindowFocus: true` globalt),
 * alltså en tyst pollare. Denna form hämtar om vid MONTERING och överlåter
 * löpande färskhet åt Realtime (`JobbLyssnare`), som är den mekanism som ska
 * bära den.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `aktiv` TRÅDAS IN, DEN LÄSES INTE HÄR
 * ═══════════════════════════════════════════════════════════════════════════
 * Miljöflaggan gatar hämtningen via React Querys `enabled`, aldrig via ett
 * tidigt `return` hos anroparen: hooks-reglerna förbjuder villkorade
 * hook-anrop. Samma form `useJobbstatus` redan bär, och av samma skäl - i
 * prod finns varken migrationerna eller de deployade funktionerna ännu
 * (ADR-129 § Negativa och skuld), så ett anrop hade fått 404.
 */

/** Alla öppna betalningar över alla event. Delas av Hem, panelen och ytorna. */
export function useOppnaBetalningar(aktiv = true) {
  const dataSource = useDataSource();
  return useQuery<OppnaBetalningar>({
    queryKey: queryKeys.betalningar.oppna,
    queryFn: () => dataSource.fetchOppnaBetalningar(),
    enabled: aktiv,
    refetchOnMount: 'always',
    retry: husetsRetryPolicy,
  });
}

/**
 * Inbetalningarna och kvittona för EN anmälan.
 *
 * HÄMTNINGEN ÄR LAT MED AVSIKT. Åtgärds-panelen kan visa tjugo personer, och
 * en läsning per person vid öppning hade blivit tjugo Edge Function-anrop -
 * var och en med en Airtable-läsning i sig, mot ett tak som DELAS med Lottas
 * egna klick och automationerna A1-A11 (ADR-063 § S91-not). Anroparen sätter
 * `aktiv` först när raden faktiskt fälls ut.
 */
export function useInbetalningarPerAnmalan(anmalanRecordId: string, aktiv: boolean) {
  const dataSource = useDataSource();
  return useQuery<Inbetalningslista>({
    queryKey: queryKeys.betalningar.perAnmalan(anmalanRecordId),
    queryFn: () => dataSource.fetchInbetalningar({ anmalanRecordId }),
    enabled: aktiv,
    refetchOnMount: 'always',
    retry: husetsRetryPolicy,
  });
}

/**
 * Personens inbetalningar över ALLA anmälningar (PRD berättelse 24).
 *
 * EF:en löser person till anmälningar server-side, så personkortet behöver
 * inte känna sina egna anmälnings-ID:n för DENNA läsning - bara för urvalet
 * av öppna betalningar (`personOversikt`, `panel-harledningar.ts`).
 */
export function useInbetalningarPerPerson(personId: string, aktiv: boolean) {
  const dataSource = useDataSource();
  return useQuery<Inbetalningslista>({
    queryKey: queryKeys.betalningar.perPerson(personId),
    queryFn: () => dataSource.fetchInbetalningar({ personId }),
    enabled: aktiv,
    refetchOnMount: 'always',
    retry: husetsRetryPolicy,
  });
}
