import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MallId } from '@/data/adapters/DataSourceAdapter';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

export interface SkapaOmEventBilagaInput {
  mall: MallId;
  /** Den BEFINTLIGA Event-mallade radens ID — regenereras, samma rad. */
  ersatt: string;
}

/**
 * Mutation: "Skapa om" i Dokument-ytans lista (TASK-309.6, AC #4, ADR-125
 * § 3 "regenerering är ERSÄTTNING") — regenererar en BEFINTLIG Event-mallad
 * Bilagor-rad ur eventets NUVARANDE data. SAMMA `attachmentId`, SAMMA
 * Storage-lagringsnyckel (servern skriver över filen i stället för att
 * allokera en ny path) — Åtgärds-sidans bilageval förblir giltigt.
 *
 * ALDRIG AUTOMATISK (AC #4): denna hook anropas bara av ett explicit klick
 * på "Skapa om" — ingen kod i denna skiva anropar den av sig själv när
 * `inaktuell` blir sant. Markeringen är ett VAL Lotta ser, inte en automat
 * (ADR-125 § 3s kärna, oförändrad).
 *
 * Öppnar INGET fönster (till skillnad från `useGenereraEventBilaga`) —
 * Dokument-ytans rad har redan egna Förhandsvisa-/Ladda ner-knappar
 * (`DokumentAtgardsKnappar`/`LaddaNerKnapp`) för att se resultatet.
 */
export function useSkapaOmEventBilaga(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<Attachment, Error, SkapaOmEventBilagaInput>({
    // mutationKey scopar per event — INTE per `ersatt`: två samtidiga
    // regenereringar i samma event är lika ovanligt/odesignat som två
    // samtidiga ersättningar redan är (`useReplaceAttachment`s precedent).
    mutationKey: ['skapa-om-event-bilaga', eventId],

    // [TASK-340.2] Adaptern returnerar nu HELA det skarpa svaret
    // (`SkapadEventBilaga`: bilagan + `promoverad`/`underlagAndrat`/
    // `ersatte`). DENNA hook exponerar fortsatt bara `Attachment`, med
    // avsikt: de tre booleanerna beskriver genereringsvyns BEKRÄFTELSE, och
    // listans "Skapa om" har ingen sådan yta — den svarar med en
    // live-region (`onSuccess` nedan) och en refetchad rad. `promoverad` är
    // dessutom per konstruktion `false` här: "Skapa om" skickar aldrig
    // någon `kallhash` (det finns ingen förhandsgranskning i listan att
    // hämta den ur), och `ersatte` är alltid `true` eftersom `ersatt` pekas
    // ut explicit. Att exponera tre fält vars värden är kända i förväg hade
    // varit brus, inte information.
    mutationFn: async ({ mall, ersatt }) => {
      const { attachment } = await dataSource.skapaEventBilaga({ eventId, mall, ersatt });
      return attachment;
    },

    onSuccess: (attachment) => {
      alertScreenReader(`${attachment.namn} har skapats om`);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.byEvent(eventId) });
    },
  });
}
