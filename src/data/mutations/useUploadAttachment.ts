import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import type { AttachmentScopeValue } from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Mutation-input: filen plus räckviddsvalet (TASK-275.3, ADR-118 beslut 5).
 * `rackvidd` utelämnad = Event (oförändrat default, se
 * `AttachmentScopeInputSchema`).
 *
 * [UTBYGGD, TASK-338.3, ADR-125 § Beslut 1] De tre AXLARNA — `kursfamilj`,
 * `kursniva` och `plats` — är meningsfulla vid `rackvidd` Gemensam och
 * VALFRIA var för sig; noll satta axlar är giltigt och betyder "alla event".
 * Se `UploadAttachmentInput`s docblock för den fulla valideringskedjan
 * (server-sidan är golvet, denna typ tvingar ingenting klient-side).
 */
export interface UploadAttachmentVariables {
  file: File;
  rackvidd?: AttachmentScopeValue;
  kursfamilj?: string;
  kursniva?: string;
  /** Platser-RECORD-ID (`rec…`), aldrig ett platsnamn — se `UploadAttachmentInput.plats`. */
  plats?: string;
}

/**
 * Mutation: "ladda upp en bilaga" (TASK-147.6, adapter-kontraktet från
 * TASK-146.4). Speglar `useCreateEventNote`s STRUKTUR (operations-API via
 * adapter, `onSettled`-invalidering, aria-live) och är MEDVETET
 * ICKE-optimistisk av samma skäl: en uppladdning kan fela (nät/5xx/för stor
 * fil) och en rad ska aldrig dyka upp och försvinna igen. Fel-ytan renderas
 * av komponenten ur `mutation.error` — adaptern kastar redan ett fel på
 * Lottas språk (TASK-146.4 AC #6), så hooken tillför ingen egen
 * felformulering.
 *
 * `eventId` binds vid hook-anropet (samma id för write + cache-nyckel) —
 * samma mönster som `useCreateEventNote(eventId, …)`.
 *
 * [UTBYGGD, TASK-275.3, ADR-118 beslut 5] `eventId` är NU `string | null` —
 * `null` för räckviddslägets genuint event-lösa uppladdning (giltigt bara
 * med `rackvidd` Kurstyp/Alla event, server-validerat). Mutation-variabeln
 * bär nu HELA räckviddsvalet (`UploadAttachmentVariables`), inte bara
 * `File` — ett rent filbyte hade inte kunnat uttrycka AC #1s radioval.
 *
 * INVALIDERINGEN träffar `queryKeys.attachments.all` (HELA `attachments`-
 * prefixet), INTE bara `byEvent(eventId)` — en uppladdning med räckvidd
 * Kurstyp/Alla event kan göra en NY bilaga synlig i UNIONEN på VARJE annat
 * matchande events sida (och i räckviddslägets egen lista), inte bara i det
 * event Lotta råkar stå på (eller INGET event, i räckviddsläget). Att bara
 * invalidera en enda nyckel hade lämnat andra öppna Dokument-ytor med en
 * stale union. Kostnaden (ett refetch för varje MONTERAD `attachments.*`-
 * query, inte bara en) är försumbar — Dokument-ytan monterar högst en sådan
 * query i taget.
 *
 * INGEN AKTIVITETSLOGGNING här (medvetet avgränsat, ÖPPEN SKULD): Dokument-
 * ytan är promoverad (T131, ADR-103 B2 steg 1, TASK-164-rivningen) men att
 * välja ett nytt `ACTIVITY_OBJECT_TYPES`/verb-par för bilage-uppladdning är
 * inte gjort — registrerat som tråd `T145` (tasks/threads/README.md), en
 * egen skiva utanför rivningens scope.
 */
export function useUploadAttachment(eventId: string | null) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<Attachment, Error, UploadAttachmentVariables>({
    // mutationKey scopar mutationen per "kontext" (eventet, eller den fasta
    // strängen 'gemensamt' i räckviddsläget) — dedup av samtidiga submits,
    // samma form som `useCreateEventNote`.
    mutationKey: ['upload-attachment', eventId ?? 'gemensamt'],

    mutationFn: (variables) =>
      dataSource.uploadAttachment({
        eventId,
        file: variables.file,
        rackvidd: variables.rackvidd,
        kursfamilj: variables.kursfamilj,
        kursniva: variables.kursniva,
        plats: variables.plats,
      }),

    onSuccess: (attachment) => {
      alertScreenReader(`${attachment.namn} har laddats upp`);
    },

    // Synka mot servern oavsett utfall → se filhuvudets INVALIDERINGEN-stycke
    // för varför detta är HELA attachments-prefixet, inte bara denna nyckel.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.all });
    },
  });
}
