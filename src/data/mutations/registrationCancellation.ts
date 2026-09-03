import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type {
  CancelRegistrationInput,
  CancelRegistrationResult,
  RegistrationDetail,
} from '@/domain/schemas';
import { RegistrationStatus, type RegistrationStatusValue } from '@/domain/types/Status';
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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DETALJ-CACHEN PATCHAS MED SERVERNS SVAR (TASK-368.3)
 * ═══════════════════════════════════════════════════════════════════════════
 * Invalideringen ensam räcker inte för anmälans sida. Mellan serverns svar
 * och att `get-registration` hunnit svara igen (mätt golv ~1-3 s varm mot
 * staging, `AnmalanDetail.tsx` § INSTANT) hade sidan stått kvar med den
 * GAMLA statusen — alltså med knappen "Avboka anmälan" synlig på en redan
 * avbokad anmälan, ett andra klick bort från serverns 409 "Anmälan är redan
 * avbokad". Svaret bär både `status` och `notering` just för att slippa den
 * extra läsningen (`CancelRegistration.schema.ts` § svarsformen), så
 * patchen är serverns egen utsaga, aldrig en klientgissning.
 *
 * `notering` är HELA fältet efter appendet, inte bara den nya raden — den
 * skrivs därför rakt in, aldrig konkatenerad.
 *
 * STATUS SKRIVS BARA NÄR DEN ÄR ETT KÄNT BASVÄRDE. Svarets `status` är
 * `z.string()` (serverns ord), medan `RegistrationSchema.status` är
 * `z.enum(RegistrationStatus).nullable()`. Ett okänt värde skulle alltså
 * göra cachen schema-otrogen; då hoppas patchen över helt och
 * invalideringens omhämtning får bära bytet. Det är fail-safe åt rätt håll:
 * en utebliven patch kostar sekunder, en schema-otrogen cache kostar en
 * krasch i en vy som litar på enum:en.
 */

type CancelMutationVariables = CancelRegistrationInput & { eventId: string };

/** Serverns statussträng, men bara om den är ett av basens sex kända värden. */
function kandStatus(status: string): RegistrationStatusValue | null {
  const kanda: readonly string[] = Object.values(RegistrationStatus);
  return kanda.includes(status) ? (status as RegistrationStatusValue) : null;
}

function patchaDetaljcachen(
  queryClient: ReturnType<typeof useQueryClient>,
  resultat: CancelRegistrationResult,
): void {
  const status = kandStatus(resultat.status);
  if (status === null) return;
  queryClient.setQueryData<RegistrationDetail>(
    queryKeys.registrations.detail(resultat.registrationId),
    (gammal) => (gammal ? { ...gammal, status, notering: resultat.notering } : gammal),
  );
}

function invalideraEfterCancel(
  queryClient: ReturnType<typeof useQueryClient>,
  variables: CancelMutationVariables,
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(variables.eventId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.betalningar.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.activityLog.all });
}

function efterLyckadCancel(
  queryClient: ReturnType<typeof useQueryClient>,
  resultat: CancelRegistrationResult,
  variables: CancelMutationVariables,
): void {
  patchaDetaljcachen(queryClient, resultat);
  invalideraEfterCancel(queryClient, variables);
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
    onSuccess: (resultat, variables) => efterLyckadCancel(queryClient, resultat, variables),
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
    onSuccess: (resultat, variables) => efterLyckadCancel(queryClient, resultat, variables),
  });
}
