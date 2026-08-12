import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { displayName } from '@/components/registrations/registration-display';
import {
  ACTIVITY_OBJECT_TYPES,
  BEKRAFTADE_ANMALAN_VERB,
  registrationObjectId,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
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
    return 'Inget skickades - anmälningarna var redan bekräftade eller saknar e-post.';
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
  const { user } = useAuth();
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

    // AKTIVITETSLOGGEN (TASK-201.3, pilot 2/3): fire-and-forget, ENDAST när
    // servern faktiskt bekräftade DENNA anmälan (`result.confirmed` — "servern
    // är facit", samma disciplin som `bekraftelseUtfall` ovan; ett `sent`-
    // eller `partial`-svar som inte nämner detta ID loggas inte som om det
    // hänt).
    onSuccess: (result, { registration }) => {
      alertScreenReader(
        result.confirmed.length > 0
          ? `Bekräftelse skickad till ${displayName(registration)}.`
          : bekraftelseUtfall(result),
      );
      if (result.confirmed.includes(registration.id)) {
        void recordActivity({
          dataSource,
          actor: { id: user?.id ?? '', name: user?.displayName ?? null },
          verb: BEKRAFTADE_ANMALAN_VERB,
          object: {
            id: registrationObjectId(registration.id),
            type: ACTIVITY_OBJECT_TYPES.bekraftelse,
            name: `${displayName(registration)} (${registration.eventNamn ?? 'okänt event'})`,
          },
          // TASK-201.4: betalar 201.3s deferrade EVENT_ID_EXTENSION_IRI-skuld
          // — eventId var redan hook-bundet (`useSendConfirmationFromDetail`).
          eventId,
        });
      }
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
 * osanning. Listan uppdateras när SERVERN svarat.
 *
 * SVARET ÄR FACIT — INTE OMHÄMTNINGEN (Marcus design-review 2026-07-26, S91,
 * fynd (a)). Mätt mot ett staging-event med 8+8: kön stod oförändrad i ~5,5 s
 * efter att markera-läget stängt, för att koden kastade serverns svar och
 * väntade på en full `get-registrations`-runda. Servern berättar redan exakt
 * vad som hände — `confirmed` (record-ID:n som fick BÅDE mail och status-flip,
 * atomicitets-kontraktet) och `bekraftelseSkickad` (tidsstämpeln som skrevs) —
 * så svaret skrivs in i listcachen här i stället för att slängas.
 *
 * DETTA ÄR INTE OPTIMISM (byggkrav 6 står oförändrat): patchen sker i
 * `onSuccess`, alltså EFTER serverns bekräftelse, och skriver ENDAST de ID:n
 * servern själv rapporterade som bekräftade. Ett partiellt utfall flyttar
 * exakt de kort som faktiskt gick igenom och lämnar resten i kön — ett halvt
 * utfall kan alltså fortfarande aldrig visas som helt. Skillnaden mot en
 * optimistisk mutation är tidpunkten (efter svar, inte före) och källan
 * (serverns lista, inte klientens gissning).
 *
 * `cancelQueries` före patchen: en omhämtning som redan var i luften när
 * mutationen svarade hade annars kunnat landa EFTER patchen och skriva
 * tillbaka de gamla raderna. Invalideringen i `onSettled` står kvar och gör
 * jobbet i bakgrunden — patchad data visas medan den rundan pågår.
 */
export function useConfirmAll(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<ConfirmRegistrationsResult, Error, { registrationIds: string[] }>({
    mutationKey: ['confirm-all', eventId],

    mutationFn: ({ registrationIds }) =>
      dataSource.confirmRegistrations({ registrationIds, idempotencyKey: crypto.randomUUID() }),

    onSuccess: async (result) => {
      alertScreenReader(bekraftelseUtfall(result));
      if (result.confirmed.length === 0) return;
      const listan = queryKeys.registrations.byEvent(eventId);
      await queryClient.cancelQueries({ queryKey: listan });
      const bekraftade = new Set(result.confirmed);
      queryClient.setQueryData<Registration[]>(listan, (old) =>
        old?.map((r) =>
          bekraftade.has(r.id)
            ? {
                ...r,
                status: RegistrationStatus.BEKRAFTAD,
                // Serverns egen tidsstämpel. Skrev servern ingen (null) rörs
                // fältet inte — en påhittad tidsstämpel vore en osanning.
                bekraftelseSkickad: result.bekraftelseSkickad ?? r.bekraftelseSkickad,
              }
            : r,
        ),
      );
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
