import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Mutation-input: filen som ersätter, plus attachmentId på den bilaga som
 * ska bort. `oldAttachmentId` bärs i `variables` (inte i hook-anropet, till
 * skillnad mot `eventId`) — SAMMA hook-instans "Ersätt"-knappen delas mellan
 * alla rader i listan, olika rader ersätter olika poster.
 */
export interface ReplaceAttachmentInput {
  file: File;
  oldAttachmentId: string;
}

/**
 * Mutation: "ersätt en bilaga" (TASK-147.11) — den ÄKTA ersättningen
 * `grupperaPerNamn` (DokumentYta.tsx, TASK-147.6) var en klientsidig attrapp
 * för, i väntan på att adaptern skulle få en delete-primitiv (nu byggd,
 * `DataSourceAdapter.deleteAttachment`).
 *
 * ORDNINGEN ÄR KONTRAKTET, INTE EN IMPLEMENTATIONSDETALJ (uppdragets egen
 * instruktion): ladda upp den NYA filen FÖRST, radera den GAMLA posten EFTER
 * en lyckad uppladdning — ALDRIG tvärtom. Misslyckas uppladdningen rörs den
 * gamla posten aldrig (mutationen kastar innan `deleteAttachment` ens
 * anropas) — Lotta förlorar aldrig en fungerande bilaga för att en ny
 * uppladdning råkade misslyckas.
 *
 * DELVIS-MISSLYCKANDE, ÖPPET BOKFÖRT (samma disciplin som `upload-
 * attachment/index.ts`s "bytesen ligger redan i lagringen men metadataraden
 * misslyckades"-fall): om uppladdningen lyckas men raderingen av den gamla
 * posten sedan misslyckas (nätverk, 5xx, EF:ens 502-väg) kastar mutationen
 * ÄNDÅ ett fel — men den NYA filen finns redan och `onSettled` refetchar
 * listan oavsett utfall, så Lotta ser den nya raden direkt. Felmeddelandet
 * är därför explicit om VILKET steg som föll, inte en generisk "misslyckades".
 */
export function useReplaceAttachment(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const key = queryKeys.attachments.byEvent(eventId);

  return useMutation<Attachment, Error, ReplaceAttachmentInput>({
    // mutationKey scopar per event (samma dedup-motiv som useUploadAttachment) —
    // INTE per oldAttachmentId: två samtidiga ersättningar på samma event är
    // lika ovanligt/odesignat som två samtidiga uppladdningar redan är.
    mutationKey: ['replace-attachment', eventId],

    mutationFn: async ({ file, oldAttachmentId }) => {
      // 1) Ladda upp den nya filen FÖRST.
      const uploaded = await dataSource.uploadAttachment({ eventId, file });

      // 2) Radera den gamla posten EFTER lyckad uppladdning — aldrig tvärtom.
      try {
        await dataSource.deleteAttachment(eventId, oldAttachmentId);
      } catch (deleteError) {
        const reason = deleteError instanceof Error ? deleteError.message : String(deleteError);
        throw new Error(
          `"${file.name}" laddades upp, men den gamla filen kunde inte tas bort automatiskt: ` +
            `${reason}. Radera den för hand om den inte längre behövs.`,
        );
      }

      return uploaded;
    },

    onSuccess: (attachment) => {
      alertScreenReader(`${attachment.namn} har ersatt den tidigare filen`);
    },

    // Synka mot servern oavsett utfall (samma mönster som useUploadAttachment)
    // — även vid ett delvis-misslyckande (uppladdad, radering föll) ska listan
    // visa den nya raden direkt i stället för att vänta på nästa navigering.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
