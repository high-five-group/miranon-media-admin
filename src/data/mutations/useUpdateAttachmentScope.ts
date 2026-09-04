import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import type { AttachmentScopeValue } from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/**
 * Vad "Ändra räckvidd" skickar. Axlarna speglar `UpdateAttachmentScopeInput`
 * exakt (utelämnad = axeln RENSAS), plus två fält som BARA finns för att den
 * optimistiska renderingen ska kunna säga sanningen medan servern svarar:
 *
 *   - `platsNamn` — badgen och sammanfattningen visar platsens NAMN, men
 *     kontraktet mot EF:en bär bara dess record-ID. Namnet finns redan i
 *     anroparens platslista (`usePlacesList`), så att skicka med det är
 *     gratis; att låta bli hade gett en badge med tomt platsnamn i det
 *     halvsekund cachen är optimistisk.
 *   - `namn` — filnamnet, för skärmläsar-annonseringen. Samma skäl som
 *     `useDeleteAttachment` bär det.
 */
export interface UpdateAttachmentScopeVariables {
  attachmentId: string;
  namn: string;
  rackvidd: AttachmentScopeValue;
  kursfamilj?: string;
  kursniva?: string;
  plats?: string;
  /** Den valda platsens namn — bara för optimistisk rendering, se ovan. */
  platsNamn?: string;
}

/** Rollback-context (ADR-016 komponent C): snapshot före optimistisk write. */
interface UpdateScopeContext {
  previous: Attachment[] | undefined;
}

/**
 * Optimistisk mutation: "ändra räckvidden på en delad bilaga"
 * (TASK-338.4, ADR-125 § Beslut 1). PRD TASK-338 berättelse 8: *"kunna ändra
 * räckvidden på en redan uppladdad delad bilaga, så att en felklassning inte
 * tvingar mig att radera och ladda upp igen"*.
 *
 * Mall: ADR-016:s fem-komponents-mönster (`useUpdatePersonFlag`/
 * `useUpdatePersonNote`), anpassad till en LIST-cache i stället för ett
 * enskilt record.
 *
 * ═══ VARFÖR OPTIMISTISKT HÄR, NÄR SYSKONEN INTE ÄR DET ═══
 * `useUploadAttachment`/`useReplaceAttachment`/`useDeleteAttachment` väntar
 * alla på servern, och det är rätt för dem: de flyttar BYTES, och en
 * optimistisk rad för en fil som kanske inte kom fram vore en lögn om
 * lagringen. Denna operation rör ingen fil — den ändrar tre fält på en rad
 * som redan finns. Badgen kan därför byta direkt, och rullas tillbaka exakt
 * om servern säger nej (vilket den gör i fyra fall, se
 * update-attachment-scope/index.ts § VAKTERNA).
 *
 * ═══ BARA RÄCKVIDDSLISTAN RÖRS OPTIMISTISKT — ALDRIG EVENT-LISTORNA ═══
 * Detta är en LAGERVAKT (ADR-057), inte en förenkling. `queryKeys.attachments
 * .gemensamma` innehåller raden oavsett vilka axlar den bär, så den nya
 * badgen kan skrivas där utan att veta något om matchning. Ett events lista
 * (`byEvent`) är däremot resultatet av EF:ens matchare
 * (`_shared/rackvidd-matchning.ts`) — att optimistiskt lägga till eller ta
 * bort bilagan där hade krävt att klienten SJÄLV avgör vilka event en
 * räckvidd träffar, vilket är exakt det ADR-057 förbjuder. Event-listorna
 * synkas i stället av `onSettled`-invalideringen, från servern.
 *
 * `eventId` binds vid hook-anropet enbart för `mutationKey`-scopet, samma
 * form som syskonhookarna. I praktiken är den ALLTID `null`: räckviddsläget
 * är den enda ytan som renderar "Ändra räckvidd" (ADR-118 beslut 3 gäller
 * vidare — ur ett events kontext är en delad bilaga oredigerbar).
 */
export function useUpdateAttachmentScope(eventId: string | null) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const key = queryKeys.attachments.gemensamma;

  return useMutation<Attachment, Error, UpdateAttachmentScopeVariables, UpdateScopeContext>({
    mutationKey: ['update-attachment-scope', eventId ?? 'gemensamt'],

    // A. Skrivningen — axlarna trär igenom oförändrade; `undefined` är formen
    // för "axeln är inte satt" hela vägen ner (adaptern utelämnar nyckeln,
    // EF:en rensar fältet).
    mutationFn: ({ attachmentId, rackvidd, kursfamilj, kursniva, plats }) =>
      dataSource.updateAttachmentScope({
        attachmentId,
        rackvidd,
        kursfamilj,
        kursniva,
        plats,
      }),

    // C. Avbryt in-flight refetch, snapshotta, applicera optimistiskt på
    // RÄCKVIDDSLISTAN (se docblockets lagervakts-stycke för varför bara den).
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Attachment[]>(key);
      queryClient.setQueryData<Attachment[]>(key, (old) =>
        old?.map((rad) =>
          rad.id === variables.attachmentId
            ? {
                ...rad,
                rackvidd: variables.rackvidd,
                // `?? null` och inte `?? rad.kursfamilj`: en utelämnad axel
                // betyder RENSAD, inte "oförändrad" — samma semantik som
                // servern skriver (`buildScopeUpdateFields`). Att behålla det
                // gamla värdet hade visat en badge som lovade mer än raden
                // faktiskt bär.
                kursfamilj: variables.kursfamilj ?? null,
                kursniva: variables.kursniva ?? null,
                plats: variables.plats
                  ? { id: variables.plats, namn: variables.platsNamn ?? '' }
                  : null,
              }
            : rad,
        ),
      );
      return { previous };
    },

    onSuccess: (_attachment, variables) => {
      alertScreenReader(`Räckvidden för ${variables.namn} har ändrats`);
    },

    // D. Rollback. Fel-ytan renderas av komponenten ur `mutation.error` —
    // samma a11y-avvägning som `useUpdatePersonFlag`: ingen `alertScreenReader`
    // här, felrutan annonserar redan.
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    // E. Synka mot servern oavsett utfall — HELA attachments-prefixet, samma
    // val som upload/replace/delete. Det är särskilt viktigt här: en ändrad
    // räckvidd flyttar bilagan mellan EVENT-listor, och bara servern vet
    // vilka (se docblockets lagervakts-stycke).
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.all });
    },
  });
}
