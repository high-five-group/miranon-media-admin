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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TILL TASK-368.5: VILKET TAL SOM VISAS FÖR "X KR FLYTTADES"
 * ═══════════════════════════════════════════════════════════════════════════
 * Använd `summaNyAnmalan` — beloppet spegeln faktiskt skrev till den nya
 * anmälan — inte `flyttadSumma`/`flyttadeRader`. De två senare är PER ANROP
 * och är `0` vid en återupptagning (ett omanrop av samma ombokning), trots att
 * pengarna sitter rätt sedan förra gången; en text byggd på dem skulle då säga
 * "0 kr flyttades" om något som gick igenom. Räknaren hör hemma i kvittensen
 * på HANDLINGEN, aldrig i en text som beskriver ett tillstånd. Se
 * `RebookRegistration.schema.ts`s docblock.
 *
 * Servern avvisar dessutom med 409 `redan_anmald_pa_malet` när personen redan
 * har en anmälan på mål-eventet utan att anropet är en bevisbar omkörning —
 * UI:t ska visa serverns felmeddelande, inte tolka om det (ADR-130
 * § Konsekvenser: två anmälningars ekonomi slås aldrig ihop automatiskt).
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
