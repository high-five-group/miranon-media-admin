import { useMutation, useQueryClient } from '@tanstack/react-query';
import { displayName } from '@/components/registrations/registration-display';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import type { ConfirmRegistrationsResult, RegistrationDetail } from '@/domain/schemas';
import { RegistrationStatus } from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Bekräftelse-vertikalens två mutationer (task-18.6; PRD task-18 beslut 7 + 20).
 *
 * BÅDA går genom SAMMA server-operation (send-registration-confirmation): servern
 * skickar bekräftelsemailet OCH flippar Status i en operation. Skillnaden är
 * KLIENTENS: den enskilda bekräftelsen är OPTIMISTISK (ett klick i kön ska svara
 * direkt — kortet flyttar sig till Bekräftade medan mailet går), bulken är
 * PESSIMISTISK bakom en kontrollfråga (massmutation: man ska se att det hände, och
 * ett halv-utfall får aldrig visas som helt).
 *
 * Cache-invalidering träffar BÅDE anmälningslistan och event-detaljen: basens
 * 'Bekräftad beläggning (%)' räknas om när en anmälan byter Status, så beläggnings-
 * kortet på samma sida skulle annars visa ett gammalt tal.
 */

/**
 * Utfalls-text för skärmläsaren — ALDRIG "klart" när servern sa något annat.
 * Serverns svar är aldrig binärt (sent/partial/failed/skipped), så texten läses ur
 * räknarna i stället för att antas.
 */
export function bekraftelseUtfall(result: ConfirmRegistrationsResult): string {
  const antal = result.confirmed.length;
  if (antal > 0 && result.failed.length === 0) {
    return antal === 1 ? 'Bekräftelsen är skickad.' : `${antal} bekräftelser är skickade.`;
  }
  if (antal > 0) {
    return `${antal} bekräftelser skickade, ${result.failed.length} misslyckades.`;
  }
  if (result.skipped.length > 0 && result.failed.length === 0) {
    return 'Inget skickades — anmälningarna var redan bekräftade eller saknar e-post.';
  }
  return 'Ingen bekräftelse kunde skickas.';
}

/**
 * RIVEN (task-48, 2026-07-26): `useSendConfirmation` — eventsidans enskilda
 * OPTIMISTISKA bekräftelse, som drev deltagarkortens "Skicka bekräftelse"
 * (K46). Kortknappen revs med markera-läget, och hooken hade därmed noll
 * konsumenter. Rivningen tar med sig den optimistiska snabbvägen FRÅN
 * EVENTSIDAN: bekräftelser skickas nu i batch, pessimistiskt bakom
 * kontrollfrågan.
 *
 * Marcus-beslut 2 på kortet: ersättaren byggs INTE här — 1-klicks-
 * interaktionen får sin hemvist på HEM-vyn, där den hör hemma. Skriv inte in
 * anmälans egen sida som eventsidans enkel-väg.
 *
 * `useSendConfirmationFromDetail` nedan är en ANNAN väg (per-anmälan-sidan,
 * detalj-cachen) och står orörd.
 */

/**
 * ENSKILD bekräftelse från PER-ANMÄLAN-DETALJVYN (task-18.17; Kontakt-
 * sektionens Skicka bekräftelse-knapp) — OPTIMISTISK, samma server-operation
 * och samma spegel-patch som kortets `useSendConfirmation`, men mot
 * DETALJ-cachen (`registrations.detail`) i stället för event-listans. Egen
 * hook i stället för en parameter-gren: cache-shaperna är olika
 * (RegistrationDetail-singel kontra Registration[]-lista) och en delad hook
 * hade burit båda formerna i varje anrop.
 *
 * Tidslinjen ("Bekräftelsemail skickat") och status-badgen härleds ur samma
 * cache-rad — den optimistiska patchen driver hela vyn utan extra state.
 * onSettled invaliderar även event-listan + event-detaljen (samma skäl som
 * kortets hook: gruppering respektive 'Bekräftad beläggning (%)').
 */
export function useSendConfirmationFromDetail(eventId: string, registrationId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const detailKey = queryKeys.registrations.detail(registrationId);

  return useMutation<
    ConfirmRegistrationsResult,
    Error,
    { registration: Registration },
    { previous: unknown }
  >({
    mutationFn: () =>
      dataSource.confirmRegistrations({
        registrationIds: [registrationId],
        idempotencyKey: crypto.randomUUID(),
      }),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData(detailKey);
      // Typad mot DETALJ-shapen (review-fynd F5): nyckeln bär
      // RegistrationDetail — en Registration-typning hade släppt igenom en
      // framtida patch som tyst tappar detalj-nycklarna. I placeholder-läget
      // är cachen tom (old undefined) → patchen no-op:ar och refetchen i
      // onSettled konvergerar — aldrig ett fabricerat cache-objekt.
      queryClient.setQueryData<RegistrationDetail>(detailKey, (old) =>
        old
          ? {
              ...old,
              status: RegistrationStatus.BEKRAFTAD,
              bekraftelseSkickad: new Date().toISOString(),
            }
          : old,
      );
      return { previous };
    },

    onError: (_err, { registration }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(detailKey, context.previous);
      }
      alertScreenReader(
        `Bekräftelsen till ${displayName(registration)} kunde inte skickas. Försök igen.`,
      );
    },

    onSuccess: (result, { registration }) => {
      alertScreenReader(
        result.confirmed.length > 0
          ? `Bekräftelse skickad till ${displayName(registration)}.`
          : bekraftelseUtfall(result),
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.byEvent(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
    },
  });
}

/**
 * BEKRÄFTA ALLA (bulk) — PESSIMISTISK bakom kontrollfrågan (PRD beslut 20:
 * confirm-grind på varje massmutation). Ingen optimistisk patch: ett bulk-utfall
 * kan vara partiellt, och att flytta tio kort som om allt gick igenom vore en
 * osanning. Listan uppdateras när servern svarat och refetchen landat.
 */
export function useConfirmAll(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<ConfirmRegistrationsResult, Error, { registrationIds: string[] }>({
    mutationKey: ['confirm-all', eventId],

    mutationFn: ({ registrationIds }) =>
      dataSource.confirmRegistrations({ registrationIds, idempotencyKey: crypto.randomUUID() }),

    onSuccess: (result) => {
      alertScreenReader(bekraftelseUtfall(result));
    },

    onError: () => {
      alertScreenReader('Bekräftelserna kunde inte skickas. Försök igen.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.byEvent(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
    },
  });
}
