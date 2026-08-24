import { useMutation, useQueryClient } from '@tanstack/react-query';
import { displayName } from '@/components/registrations/registration-display';
import { invalideraPersonregistret } from '@/data/mutations/personregister-invalidering';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Eventlänkens vakt — resolutionens mutation (task-284.3; ADR-122 beslut 7).
 * Kopplar om en anmälan vars `Eventmatchning` är `'Avviker'` eller
 * `'Utan event'` till rätt event, via `relink-registration`-operationen
 * (`_shared/field-allowlists.ts`).
 *
 * SÄTTER BÅDA FÄLTEN i EN skrivning: `Event` (länken) och `EventKey`
 * (textsträngen A1 matchar mot). `eventKey` bärs av ANROPAREN — den kommer ur
 * den redan hämtade eventlistan (`EventValjare`s datakälla, `get-events`
 * levererar den alltid, task-18.1), inte ur ett serverlookup: `update-record`
 * är en generisk pass-through-EF utan server-side härledning (till skillnad
 * från create-registration/create-event, som SJÄLVA slår upp EventKey server-
 * side ur eventId).
 *
 * MEDVETET ICKE-OPTIMISTISK (skiljer sig från t.ex. `useSetBorOver`): AC 6
 * kräver att en misslyckad koppling lämnar anmälan ORÖRD — ingen spegel-patch
 * att rulla tillbaka, ingen risk att en optimistisk flimmer visar fel event
 * innan felet hinner synas. Cachen uppdateras EFTER bekräftat success, via
 * en bred invalidering (samma `registrations`-prefix-mönster som
 * `useSetBorOver`/betalnings-vertikalen): `Eventmatchning` är ett formelfält
 * som Airtable räknar om SYNKRONT vid skrivningen (bevisat live 2026-08-21,
 * se operationens docblock i field-allowlists.ts) — en refetch räcker, ingen
 * bunden väntan behövs client-side.
 *
 * Ingen aktivitetslogg (medveten avgränsning, öppet bokförd i skivans
 * slutrapport): en ny verb/objekt-typ i `activityLog/activityTypes.ts` är en
 * egen ytterligare yta (feed-rendering) som ingen AC på TASK-284.3 kräver.
 */
export function useRelinkRegistration() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<
    void,
    Error,
    { registration: Registration; eventId: string; eventKey: string; eventNamn: string | null }
  >({
    mutationFn: ({ eventId, eventKey, registration }) =>
      dataSource.updateRecord('relink-registration', registration.id, {
        Event: [eventId],
        EventKey: eventKey,
      }),

    onSuccess: (_data, { registration, eventNamn }) => {
      alertScreenReader(
        `${displayName(registration)} kopplad till ${eventNamn ?? 'det valda eventet'}.`,
      );

      // TASK-286.4 (ADR-123 beslut 6) — PERSONREGISTRET. Omkopplingen byter
      // VILKET event anmälan hänger på, och kan därmed flippa personens
      // `Har en aktiv anmälan?` ("Aktiv om kommande utbildning eller
      // föreläsning finns", data-model.md § Spår 1) — pillen listan RENDERAR
      // — samt `Ort`-rollupen som listans sök läser.
      invalideraPersonregistret(queryClient);
    },

    // Bred invalidering (prefix-match, se queryKeys.ts:s docblock): träffar
    // BÅDE den globala listan (`registrations.all`, AnmalningarSida — f.d.
    // AnmalningarList, TASK-299.5) och en
    // ev. öppen `registrations.byEvent`/`registrations.detail` för samma rad
    // — precis den bredd `registrations.all` är dokumenterad att bära.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
    },
  });
}
