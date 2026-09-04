import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { PlaceListItem, SavePlaceInput } from '@/domain/schemas';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/** Rollback-context (ADR-016 komponent C): snapshot före optimistisk write. */
interface SavePlaceContext {
  previous: PlaceListItem[] | undefined;
}

/**
 * Applicerar `input.falt` optimistiskt på RADEN i `places.list`-cachen vars
 * `id` matchar `input.platsId` — REN funktion, ingen `queryClient`-åtkomst
 * (samma form som `useSaveEventText.ts`s `applieraOptimistiskt`, härledd ur
 * TASK-309.25/PR #1998). Gäller ENDAST den befintliga-plats-redigeringsvägen
 * (`platsId` + `falt`, `PlatserYta.tsx`s `sparaBlock`): `namn`-vägen ("Ny
 * plats", `skapaPlats`) skapar en HELT NY rad server-side (find-or-create)
 * vars id klienten inte känner till förrän EF-svaret kommer — det finns
 * ingen befintlig rad i listan att patcha, så den vägen no-opar här. Det är
 * ofarligt: `skapaPlats` stänger formuläret först i sin `onSuccess`
 * (`PlatserYta.tsx`), så knappen visar redan ett blockerande
 * `aria-disabled`-läge tills mutationen avgörs — samma "explicit
 * Sparar…-läge"-alternativ AC #2 godtar, och samma linje PR #1998 drog för
 * platsstandard-skapandet (regressionsvärn, ingen kodändring där).
 */
function applieraOptimistiskt(old: PlaceListItem[], input: SavePlaceInput): PlaceListItem[] {
  if (!input.platsId || !input.falt) return old;
  const { platsId, falt } = input;
  return old.map((item) =>
    item.id === platsId ? { ...item, falt: { ...item.falt, ...falt } } : item,
  );
}

/**
 * Mutation: REN plats-redigering UTAN event (TASK-309.7 AC #3, Mer-sidans
 * Platser-yta, ADR-125 § 7) — till skillnad från `useSavePlaceStandard`
 * (som alltid går via ett event och tar `eventId` som hook-argument), tar
 * denna hooken inget argument: `platsId`/`namn` bärs av mutationens INPUT,
 * eftersom Platser-ytan äger vilken rad (befintlig eller ny) som redigeras
 * — samma form som `useSaveEventContent` redan etablerar för Eventinnehåll.
 *
 * OPTIMISTISK (TASK-309.36, samma buggklass som TASK-309.25/PR #1998):
 * `PlatserYta.tsx`s block-dialog stänger SYNKRONT vid Spara (`onSpara`-
 * callbacken anropar `sparaBlock` och stänger dialogen i SAMMA klick, utan
 * att invänta mutationen) — utan en optimistisk cache-write visade listan
 * det GAMLA fältvärdet tills `onSettled`s invalidering hunnit refetcha,
 * samma sekventiella dubbel-nätverksanrop `useSaveEventText.ts`s docblock
 * beskriver. TanStack-mönstret (ADR-016 fem komponenter: onMutate
 * cancelQueries+setQueryData+snapshot / onError rollback / onSettled
 * invalidate) patchar här en RAD i EN LISTA (`places.list`) i stället för
 * ett enskilt detalj-record — samma list-`.map`-form som
 * `registrationPayments.ts`s `patchRegistration`.
 *
 * INVALIDERAR BÅDA `queryKeys.places.list` (denna ytas egen lista) OCH
 * `queryKeys.documentSources.all` (samma skäl som `useSavePlaceStandard`:
 * en plats standard kan gälla FLERA event, och klienten känner inte till
 * vilka).
 */
export function useSavePlace() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const key = queryKeys.places.list;

  return useMutation<void, Error, SavePlaceInput, SavePlaceContext>({
    mutationKey: ['save-place'],

    mutationFn: (input) => dataSource.savePlace(input),

    // Avbryt in-flight refetch, snapshotta, applicera optimistiskt (ADR-016
    // komponent B+C).
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PlaceListItem[]>(key);
      if (previous) {
        queryClient.setQueryData<PlaceListItem[]>(key, applieraOptimistiskt(previous, input));
      }
      return { previous };
    },

    // Rollback (ADR-016 komponent D). Felytan renderas av `PlatserYta.tsx`
    // ur `spara.isError`/`spara.error` (TASK-309.36, review-runda 1 på
    // #2055, F1 — den tidigare versionen av denna kommentar PÅSTOD att
    // ytan redan gjorde detta innan den faktiskt gjorde det, ett a11y-
    // golvbrott, WCAG 3.3.1/4.1.3: ett misslyckat sparförsök rullades tyst
    // tillbaka utan felindikation). Ingen alertScreenReader här, samma
    // avvägning som `useSaveEventText.ts`/`useUpdatePersonNote.ts`.
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    onSuccess: () => {
      alertScreenReader('Platsen sparad.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: queryKeys.documentSources.all });
    },
  });
}
