import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Mutation: "radera en bilaga" (TASK-275.3, ADR-118 beslut 3) — den FÖRSTA
 * standalone Radera-knappen på Dokument-ytan. `useReplaceAttachment` har
 * KOMPONERAT `deleteAttachment` sedan TASK-147.11 (uppladda-ny-så-radera-
 * gammal), men ingen egen "bara radera, ingen ersättningsfil"-yta har
 * funnits — AC #4 kräver den: en GEMENSAM bilaga (räckvidd Kurstyp/Alla
 * event) kan ENDAST tas bort i sitt räckviddsläge (server-sidan nekar 403
 * ur ett events kontext, delete-attachment/index.ts § filhuvudet), och utan
 * en standalone Radera-knapp där hade en gemensam bilaga aldrig kunnat
 * försvinna igen.
 *
 * `eventId` binds vid hook-anropet — SAMMA mönster som `useUploadAttachment`/
 * `useReplaceAttachment`. I PRAKTIKEN är den ALLTID `null` här (räckviddsläget
 * är den enda ytan som renderar en standalone Radera-knapp — se
 * `DokumentYta.tsx`), men signaturen speglar `DataSourceAdapter.
 * deleteAttachment`s fulla kontrakt (`string | null`) i stället för att låtsas
 * smalare än adaptern faktiskt är.
 */
export function useDeleteAttachment(eventId: string | null) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<void, Error, { attachmentId: string; namn: string }>({
    // mutationKey scopar per kontext (samma form som syskonhookarna) —
    // INTE per attachmentId: två samtidiga raderingar i samma kontext är
    // lika ovanligt/odesignat som två samtidiga uppladdningar redan är.
    mutationKey: ['delete-attachment', eventId ?? 'gemensamt'],

    mutationFn: ({ attachmentId }) => dataSource.deleteAttachment(eventId, attachmentId),

    onSuccess: (_void, variables) => {
      alertScreenReader(`${variables.namn} har raderats`);
    },

    // Synka mot servern oavsett utfall — se useUploadAttachment.ts §
    // INVALIDERINGEN för varför HELA attachments-prefixet, inte bara denna
    // nyckel: en raderad gemensam bilaga försvinner då även ur varje annat
    // events union direkt.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.all });
    },
  });
}
