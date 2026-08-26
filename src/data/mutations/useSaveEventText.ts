import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { DocumentSources } from '@/domain/models/DocumentSources';
import type { EventTextFalt, SaveEventTextInput } from '@/domain/schemas';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';

/** Formulär-input (utan eventId — hooken äger det). */
export type SaveEventTextFormValues = Omit<SaveEventTextInput, 'eventId'>;

/** Rollback-context (ADR-016 komponent C): snapshot före optimistisk write. */
interface SaveEventTextContext {
  previous: DocumentSources | undefined;
}

/**
 * Applicerar `values` (samma form som EF:en tar emot) optimistiskt på en
 * `DocumentSources`-cache-post — REN funktion, ingen `queryClient`-åtkomst,
 * så den kan testas/läsas utan mutationens closure. Speglar EXAKT
 * `byggRad`s läsregel (`GenereringsVy.tsx`): `kopior[falt].kopia` /
 * `agenda.dag{1,2}.kopia` ÄR eventets egna text, `.standard` rörs aldrig.
 */
function applieraOptimistiskt(old: DocumentSources, values: SaveEventTextFormValues) {
  let next = old;
  if (values.falt) {
    /* `DocumentSourcesKopior` har HETEROGENA `standard`-typer per nyckel
       (`sistaBetalningsdag: string`, resten `string | null`) — att indexera
       med en UNIONS-nyckel i skrivläge tvingar TS att kräva intersektionen
       av alla members typer (kan aldrig tillfredsställas). `kopia` är
       däremot UNIFORMT `string | null` oavsett nyckel (`StandardKopia<T>`s
       `kopia: T | null`, se `DocumentSources.ts`), så en tillfällig
       `standard: unknown`-vy löser skrivningen utan att någonsin röra
       `standard`s faktiska (orörda) körtidsvärde. */
    const kopior = { ...next.kopior } as Record<
      EventTextFalt,
      { standard: unknown; kopia: string | null }
    >;
    for (const [faltKeyRaw, varde] of Object.entries(values.falt)) {
      const faltKey = faltKeyRaw as EventTextFalt;
      kopior[faltKey] = { ...kopior[faltKey], kopia: varde ?? null };
    }
    next = { ...next, kopior: kopior as DocumentSources['kopior'] };
  }
  if (values.agenda) {
    const dagNyckel = values.agenda.dag === 1 ? 'dag1' : 'dag2';
    next = {
      ...next,
      agenda: {
        ...next.agenda,
        [dagNyckel]: { ...next.agenda[dagNyckel], kopia: values.agenda.rader },
      },
    };
  }
  return next;
}

/**
 * Mutation: spara eventets EGNA kopia av ett block (TASK-309.3 AC #1,
 * ADR-125 § 2). Konsumeras av `GenereringsVy.tsx`s block-dialog.
 *
 * OPTIMISTISK (TASK-309.25, Marcus prod-röktest 2026-08-26 + Marcus mandat
 * 2026-08-23): dialogen stänger SYNKRONT vid Spara (`GenereringsVy.tsx`s
 * `onSpara`-callback) — utan optimistisk cache-write visade listan det GAMLA
 * värdet tills `onSettled`s invalidering hunnit refetcha, ett sekventiellt
 * dubbel-nätverksanrop (mutate → invalidate → refetch). MÄTT i staging
 * (5 anrop, throwaway-event, `ZZ-TASK-309.3-*`-sentinel, städat efteråt):
 * `save-event-text` ~945 ms snitt (893–1020 ms), `get-document-sources`
 * ~1008 ms snitt (957–1057 ms), den SEKVENTIELLA kedjan (vad Lotta faktiskt
 * väntade på) ~1953 ms snitt (1856–2077 ms) — se PR:ens mätning för rådata.
 * TanStack-mönstret (ADR-016 fem komponenter, docs.tanstack.com/
 * query 5.101: onMutate cancelQueries+setQueryData+snapshot / onError
 * rollback / onSettled invalidate), samma form som `useUpdatePersonNote.ts`
 * (husets etablerade precedent för enskild-record-cache). VAR TIDIGARE
 * "PESSIMISTISK... EF-svaret bär inget den optimistiska vägen kan
 * förutsäga" — den motiveringen var fel: klienten känner redan HELA det nya
 * värdet (det ÄR `values`), EF:en ekar det bara tillbaka. Öppen rättelse,
 * ingen tyst patch.
 *
 * AC #4 kräver ENDAST invalidering av dokumentunderlaget — INGEN
 * aktivitetslogg-integration byggs här (medvetet, dubbelriktad
 * över-engineering-vakt): ytan som ska anropa denna hook finns inte än
 * (ADR-125 § 6+7, en senare skiva), så vilket "objekt"/"verb" en logg-rad
 * borde bära är inte känt ännu. Se slutrapporten § Avvikelser.
 */
export function useSaveEventText(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const key = queryKeys.documentSources.detail(eventId);

  return useMutation<void, Error, SaveEventTextFormValues, SaveEventTextContext>({
    // mutationKey scopar mutationen per event (dedup av samtidiga submits).
    mutationKey: ['save-event-text', eventId],

    mutationFn: (values) => dataSource.saveEventText({ eventId, ...values }),

    // Avbryt in-flight refetch, snapshotta, applicera optimistiskt (ADR-016
    // komponent B+C).
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<DocumentSources>(key);
      if (previous) {
        queryClient.setQueryData<DocumentSources>(key, applieraOptimistiskt(previous, values));
      }
      return { previous };
    },

    // Rollback (ADR-016 komponent D). Felytan (MessageBox role=alert)
    // renderas av `GenereringsVy.tsx` ur `mutation.error` — ingen
    // alertScreenReader här, role=alert annonserar redan assertivt (samma
    // avvägning som `useUpdatePersonNote.ts`).
    onError: (_err, _values, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },

    onSuccess: () => {
      alertScreenReader('Ändringarna sparade.');
    },

    // Synka mot servern oavsett utfall (ADR-016 komponent E) — roten
    // (`detail`, inte `all`) räcker: detta block hör bara till DETTA event.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
