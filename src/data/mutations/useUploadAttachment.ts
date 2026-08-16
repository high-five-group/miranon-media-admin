import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Mutation: "ladda upp en bilaga till ett event" (TASK-147.6, adapter-
 * kontraktet från TASK-146.4). Speglar `useCreateEventNote`s STRUKTUR
 * (operations-API via adapter, `onSettled`-invalidering, aria-live) och är
 * MEDVETET ICKE-optimistisk av samma skäl: en uppladdning kan fela
 * (nät/5xx/för stor fil) och en rad ska aldrig dyka upp och försvinna igen.
 * Fel-ytan renderas av komponenten ur `mutation.error` — adaptern kastar
 * redan ett fel på Lottas språk (TASK-146.4 AC #6), så hooken tillför ingen
 * egen felformulering.
 *
 * `eventId` binds vid hook-anropet (samma id för write + cache-nyckel) —
 * samma mönster som `useCreateEventNote(eventId, …)`.
 *
 * INGEN AKTIVITETSLOGGNING här (medvetet avgränsat, ÖPPEN SKULD): Dokument-
 * ytan är promoverad (T131, ADR-103 B2 steg 1, TASK-164-rivningen) men att
 * välja ett nytt `ACTIVITY_OBJECT_TYPES`/verb-par för bilage-uppladdning är
 * inte gjort — registrerat som tråd `T145` (tasks/threads/README.md), en
 * egen skiva utanför rivningens scope.
 */
export function useUploadAttachment(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const key = queryKeys.attachments.byEvent(eventId);

  return useMutation<Attachment, Error, File>({
    // mutationKey scopar mutationen per event (dedup av samtidiga submits),
    // samma form som `useCreateEventNote`.
    mutationKey: ['upload-attachment', eventId],

    mutationFn: (file) => dataSource.uploadAttachment({ eventId, file }),

    onSuccess: (attachment) => {
      alertScreenReader(`${attachment.namn} har laddats upp`);
    },

    // Synka mot servern oavsett utfall → listan refetchar och den nya raden
    // (eller en "ersatt" gruppering, se DokumentYta) syns.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
