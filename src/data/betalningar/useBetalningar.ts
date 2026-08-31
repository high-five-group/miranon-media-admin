import { useQuery } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { Inbetalningslista, OppnaBetalningar } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

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
  });
}
