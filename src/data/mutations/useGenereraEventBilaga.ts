import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MallId } from '@/data/adapters/DataSourceAdapter';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import type { PlatsFalt } from '@/domain/schemas';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

export interface GenereraEventBilagaInput {
  mall: MallId;
  /**
   * Blocken som ska sparas som PLATSENS standard i SAMMA andetag som
   * bilagan skapas (Del 2 § D beslut 6 C, AC #2: "vid Skapa, inte vid
   * krysset") — genereringsvyns "Använd som standard för <ort>"-kryss
   * markerar bara AVSIKTEN i dialogen, den faktiska skrivningen sker här.
   * Utelämnad/tomt objekt = ingen platsstandard sparas denna gång.
   */
  platsFalt?: Partial<Record<PlatsFalt, string>>;
}

export interface GenereradEventBilaga {
  attachment: Attachment;
  /** Signerad nedladdnings-URL till den NYSS skapade filen (`getAttachmentDownloadUrl`) —
   *  genereringsvyn sätter den i det tomma fönster Lotta redan öppnade med
   *  sitt klick, INNAN mutationen löste ut (popup-blockerar-säkert mönster,
   *  TASK-309.26 — se `GenereringsVy.tsx`s `skapaDokument`-docblock). */
  url: string;
}

/**
 * Mutation: "Skapa" i genereringsvyn (TASK-309.6, AC #3, ADR-125 § 5) —
 * skapar en NY Event-mallad Bilagor-rad ur eventets riktiga data, sparar
 * ev. markerade block som platsens nya standard, och slår upp den färdiga
 * filens nedladdnings-URL. Skapar ALLTID en ny rad (aldrig `ersatt`) —
 * upprepade klick kan ge dubbletter, samma synliga "+N äldre filer"-grupp
 * uppladdade filer redan delar (`DokumentYta.tsx` § grupperaPerNamn).
 * Regenerering AV en befintlig rad är `useSkapaOmEventBilaga` (Dokument-
 * ytans "Skapa om", AC #4) — en annan handling, egen hook.
 *
 * ORDNINGEN ÄR KONTRAKTET (speglar `useReplaceAttachment`s disciplin):
 * bilagan skapas FÖRST; platsstandarden sparas EFTER en lyckad skapelse,
 * ALDRIG tvärtom. Misslyckas skapelsen sparas ingen platsstandard.
 */
export function useGenereraEventBilaga(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<GenereradEventBilaga, Error, GenereraEventBilagaInput>({
    mutationKey: ['generera-event-bilaga', eventId],

    mutationFn: async ({ mall, platsFalt }) => {
      const attachment = await dataSource.skapaEventBilaga({ eventId, mall });

      if (platsFalt && Object.keys(platsFalt).length > 0) {
        await dataSource.savePlaceStandard({ eventId, falt: platsFalt });
      }

      const { url } = await dataSource.getAttachmentDownloadUrl(eventId, attachment.id);
      return { attachment, url };
    },

    onSuccess: ({ attachment }) => {
      alertScreenReader(`${attachment.namn} har skapats`);
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.byEvent(eventId) });
      // Platsstandarden kan gälla FLERA event (samma resonemang som
      // `useSavePlaceStandard`) — invalidera bara när den faktiskt begärdes.
      if (variables?.platsFalt && Object.keys(variables.platsFalt).length > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeys.documentSources.all });
      }
    },
  });
}
