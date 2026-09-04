import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import type { AttachmentScopeValue } from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Mutation-input: filen som ersätter, plus attachmentId på den bilaga som
 * ska bort. `oldAttachmentId` bärs i `variables` (inte i hook-anropet, till
 * skillnad mot `eventId`) — SAMMA hook-instans "Ersätt"-knappen delas mellan
 * alla rader i listan, olika rader ersätter olika poster.
 *
 * [UTBYGGD, TASK-275.3, ADR-118 beslut 5] `rackvidd`/`kursfamilj`/`kursniva`
 * — den ERSATTA bilagans EGEN räckvidd, buren av ANROPAREN (den läser den
 * direkt ur den befintliga `Attachment`-raden i listan, `rad.current.
 * rackvidd` m.fl.). "Ersätt" byter ALDRIG räckvidd — det är en filbyte, inte
 * en omklassificering — så uppladdningen av den NYA filen måste medvetet
 * återanvända den GAMLA radens räckvidd i stället för att implicit falla
 * till EF:ens Event-default (vilket hade tyst DEGRADERAT en gemensam bilaga
 * till event-specifik vid nästa "Ersätt").
 *
 * [UTBYGGD, TASK-338.3, ADR-125 § Beslut 1] `plats` följer med av EXAKT
 * samma skäl, en axel ner: utan den hade ett "Ersätt" på parkeringsbilagan
 * för Rönninge laddat upp den nya filen UTAN plats-axel — alltså en
 * `Gemensam` bilaga med noll axlar, som per modellen betyder ALLA EVENT.
 * Lotta hade bytt en fil och oavsiktligt lagt Rönninge-parkeringen på varje
 * Falköping- och Gotland-event, vilket är precis den "fel information går
 * ut"-skada PRD TASK-338 berättelse 3 finns för att förhindra. En tyst
 * UPPVIDGNING är värre än ett fel som syns.
 */
export interface ReplaceAttachmentInput {
  file: File;
  oldAttachmentId: string;
  rackvidd?: AttachmentScopeValue;
  kursfamilj?: string;
  kursniva?: string;
  /** Den ERSATTA radens plats-axel (`Attachment.plats.id`) — se docblocket. */
  plats?: string;
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
 *
 * [UTBYGGD, TASK-275.3, ADR-118 beslut 3+5] `eventId` är NU `string | null`
 * — `null` i räckviddsläget (Dokument-ytans läge utan valt event), den ENDA
 * platsen en GEMENSAM bilaga får ersättas ifrån (server-sidan nekar 403
 * annars, delete-attachment/index.ts § filhuvudet). En Event-räckviddig
 * bilaga ersätts fortfarande ur sitt eventkontext, `eventId` = det eventet
 * — OFÖRÄNDRAT beteende.
 */
export function useReplaceAttachment(eventId: string | null) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<Attachment, Error, ReplaceAttachmentInput>({
    // mutationKey scopar per kontext (eventet, eller 'gemensamt' i
    // räckviddsläget — samma form som useUploadAttachment) — INTE per
    // oldAttachmentId: två samtidiga ersättningar i samma kontext är lika
    // ovanligt/odesignat som två samtidiga uppladdningar redan är.
    mutationKey: ['replace-attachment', eventId ?? 'gemensamt'],

    mutationFn: async ({ file, oldAttachmentId, rackvidd, kursfamilj, kursniva, plats }) => {
      // 1) Ladda upp den nya filen FÖRST — med DEN GAMLA radens räckvidd
      //    OCH alla tre axlarna (se ReplaceAttachmentInput-docblocken för
      //    varför en tappad `plats` tyst hade vidgat bilagan till alla event).
      const uploaded = await dataSource.uploadAttachment({
        eventId,
        file,
        rackvidd,
        kursfamilj,
        kursniva,
        plats,
      });

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

    // Synka mot servern oavsett utfall (samma mönster som useUploadAttachment,
    // se den hookens INVALIDERINGEN-stycke för varför HELA attachments-
    // prefixet — inte bara denna nyckel — invalideras).
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.all });
    },
  });
}
