import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { CancelRegistrationInput, CancelRegistrationResult } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * Avbokning/återtagning-vertikalens två mutationer (TASK-368.2; PRD TASK-368
 * beslut 1/3/4). Anmälans sida (TASK-368.3) kopplar dessa direkt till "Avboka
 * anmälan"/"Återta avbokning" — själva knappen och bekräftelsesteget byggs
 * INTE här.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INGEN AKTIVITETSLOGGNING HÄR — SERVERN GÖR DET REDAN
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma disciplin som `inbetalningar.ts`s filhuvud: `cancel-registration`-
 * EF:en skriver aktivitetsloggen SERVER-SIDE (`_shared/aktivitetslogg.ts` +
 * `_shared/betalningar-db.ts`s `skrivAktivitet`), till skillnad från
 * `registrationConfirmation.ts`s bekräftelse-mutation som loggar från
 * klienten (dess EF gör det inte). En andra loggning härifrån hade gett
 * Lotta två rader för en handling.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INVALIDERINGEN (AC #4: "anmälan, event, inkorg och aktivitetslogg")
 * ═══════════════════════════════════════════════════════════════════════════
 * `registrations.all` invaliderar BÅDE listan (`byEvent`) och detaljvyn
 * (`detail`) — React Querys prefix-matchning (`exact: false`, default)
 * träffar varje nyckel som BÖRJAR med `['registrations']`, samma bredd-är-
 * avsiktlig-princip `inbetalningar.ts`s filhuvud motiverar. `events.detail`
 * kräver `eventId` — mutationens variabler bär det (samma form som
 * `useSendConfirmationFromDetail(eventId, registrationId)` i
 * `registrationConfirmation.ts`, fast som en mutation-variabel i stället för
 * ett hook-argument, eftersom `avbokaAnmalan`/`atertaAvbokning` inte är
 * bundna till en specifik anmälan vid hook-skapandet). `betalningar.all`:
 * en avbokad anmälan ska försvinna ur betalningsinkorgen (PRD berättelse 6);
 * `activityLog.all`: servern skrev en ny rad.
 */

type CancelMutationVariables = CancelRegistrationInput & { eventId: string };

function invalideraEfterCancel(
  queryClient: ReturnType<typeof useQueryClient>,
  variables: CancelMutationVariables,
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(variables.eventId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.betalningar.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.activityLog.all });
}

/**
 * Avboka en aktiv anmälan. Servern avvisar (409) om anmälan inte står i en
 * av de tre aktiva statusarna — mutationen förmedlar det felet oförändrat,
 * UI:t (TASK-368.3) formulerar hur det visas.
 */
export function useAvbokaAnmalan() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  return useMutation<CancelRegistrationResult, Error, CancelMutationVariables>({
    mutationFn: ({ registrationId, skal }) => dataSource.avbokaAnmalan({ registrationId, skal }),
    onSuccess: (_resultat, variables) => invalideraEfterCancel(queryClient, variables),
  });
}

/**
 * Återta en avbokning. Den nya statusen är serverns härledning (bekräftelse-
 * datumet), aldrig ett klientval — se `CancelRegistrationResult.status`.
 */
export function useAtertaAvbokning() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  return useMutation<CancelRegistrationResult, Error, CancelMutationVariables>({
    mutationFn: ({ registrationId, skal }) => dataSource.atertaAvbokning({ registrationId, skal }),
    onSuccess: (_resultat, variables) => invalideraEfterCancel(queryClient, variables),
  });
}
