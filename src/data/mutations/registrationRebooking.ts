import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { RebookRegistrationInput, RebookRegistrationResult } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * Ombokningens mutation (TASK-368.4; PRD TASK-368 beslut 7-8, ADR-130).
 * Ombokningssteget i appen (TASK-368.5) kopplar denna direkt till "Boka om
 * till annat event" — knappen, eventväljaren och prisskillnadstexten byggs
 * INTE här.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INGEN AKTIVITETSLOGGNING HÄR — SERVERN GÖR DET REDAN
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma disciplin som `registrationCancellation.ts` och `inbetalningar.ts`:
 * `rebook-registration`-EF:en skriver aktivitetsloggen SERVER-SIDE
 * (`_shared/aktivitetslogg.ts` + `skrivAktivitet`). En andra loggning härifrån
 * hade gett Lotta två rader för en handling.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INVALIDERINGEN — TVÅ EVENT, INTE ETT
 * ═══════════════════════════════════════════════════════════════════════════
 * En ombokning ändrar BÅDA eventens bild: det gamla får en plats ledig och en
 * anmälan i Avbokade, det nya får en ny deltagare. `events.detail` är
 * per-event-nycklad, så BÅDA måste invalideras — det är hela skälet till att
 * mutationens variabler bär `gammaltEventId` utöver det som EF:en behöver.
 * Ett utelämnat gammalt event hade lämnat den gamla eventsidan med en anmälan
 * som inte längre finns där.
 *
 * `registrations.all` träffar både listan (`byEvent`) och detaljvyn (`detail`)
 * via React Querys prefix-matchning. `betalningar.all`: pengarna sitter på en
 * annan anmälan nu, så inkorgen och betalningsvyerna är inaktuella.
 * `activityLog.all`: servern skrev en ny rad.
 */

type RebookMutationVariables = RebookRegistrationInput & {
  /** Eventet anmälan bokas om FRÅN. Behövs bara för invalideringen. */
  gammaltEventId: string;
};

export function useBokaOmAnmalan() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  return useMutation<RebookRegistrationResult, Error, RebookMutationVariables>({
    mutationFn: ({ registrationId, nyttEventId }) =>
      dataSource.bokaOmAnmalan({ registrationId, nyttEventId }),
    onSuccess: (_resultat, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(variables.gammaltEventId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(variables.nyttEventId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.betalningar.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activityLog.all });
    },
  });
}
