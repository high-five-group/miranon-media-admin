import { useMutation } from '@tanstack/react-query';
import {
  type DokumentKalla,
  dokumentNedladdningsFilnamn,
  hamtaDokumentNedladdningsUrl,
} from '@/data/mutations/dokumentKalla';
import { useDataSource } from '@/data/useDataSource';

/**
 * Mutation: "ladda ner ett dokument" (TASK-273.4, ersätter den rivna
 * Visa-dialogens "Ladda ner"-länk — se `DokumentYta.tsx`s filhuvud §
 * IKONPAR). Ingen flik öppnas: en dold `<a download>`-länk klickas
 * programmatiskt, samma "skapa länk, klicka, ta bort"-idiom som
 * `hamtaDokumentNedladdningsUrl`s docblock förklarar `download`-
 * query-parametern för (klass A) — se den för Content-Disposition-
 * verifieringen mot staging.
 */
export function useLaddaNerDokument() {
  const dataSource = useDataSource();

  return useMutation<void, Error, { kalla: DokumentKalla; namn: string }>({
    mutationKey: ['ladda-ner-dokument'],
    mutationFn: async ({ kalla, namn }) => {
      const filnamn = dokumentNedladdningsFilnamn(namn, kalla);
      const url = await hamtaDokumentNedladdningsUrl(dataSource, kalla, filnamn);
      const lank = document.createElement('a');
      lank.href = url;
      lank.download = filnamn;
      document.body.appendChild(lank);
      lank.click();
      lank.remove();
    },
  });
}
