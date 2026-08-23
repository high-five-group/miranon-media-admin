import { useQuery } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

/**
 * Bilagornas ifyllnadsunderlag för ETT event (TASK-309.6, ADR-125 § 2/§ 6)
 * — genereringsvyns läsning ur `get-document-sources` (via adaptern). Ingen
 * konsument fanns när `queryKeys.documentSources` mintades (TASK-309.2/.3s
 * skrivvägar invaliderade nyckeln i förväg, se `queries/keys.ts` §
 * `documentSources`-docblocket) — DENNA hook är den läsande sidan.
 *
 * Ny hemvist `src/data/queries/` — läs-analogen till `src/data/mutations/
 * use*.ts` (samma `use<Namn>.ts`-filnamnskonvention, se `useActivityLog.ts`
 * § filhuvud för precedensen).
 *
 * `enabled: eventId != null` — genereringsvyn monteras innan Lotta
 * nödvändigtvis valt ett event (eventväljarens tomma läge); hooken ska då
 * varken fråga servern eller visa ett fel, bara stå overksam (samma
 * `enabled`-mönster som `DokumentYta.tsx`s `attachmentsQuery`).
 */
export function useDocumentSources(eventId: string | null) {
  const dataSource = useDataSource();
  return useQuery({
    queryKey: queryKeys.documentSources.detail(eventId ?? ''),
    queryFn: () => dataSource.getDocumentSources(eventId ?? ''),
    enabled: eventId != null,
  });
}
