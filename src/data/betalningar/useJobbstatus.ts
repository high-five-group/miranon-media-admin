import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useDataSource } from '@/data/useDataSource';
import type { Jobbstatus } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';
import { prenumereraPaJobbrader } from './jobbRealtime';

/**
 * [TASK-346.4 AC #5, ADR-129 beslut 8] Kvittojobbets läge i klienten —
 * LÄSNING vid appöppning plus Realtime-push.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TVÅ MEKANISMER, INTE EN — OCH DE GÖR OLIKA SAKER
 * ═══════════════════════════════════════════════════════════════════════════
 * ADR-129 beslut 8: "Klienten prenumererar på Postgres Changes för sina rader
 * OCH LÄSER LÄGET VID APPÖPPNING. Push är en snabbhet, aldrig en sanning: en
 * webbläsare som var stängd får sitt läge ur läsningen."
 *
 *   LÄSNINGEN (`useJobbstatus`) ger SANNINGEN, alltid, oavsett vad som hänt
 *   medan fliken var stängd. Den är hela svaret på användarberättelse 31
 *   ("appen kan stängas mitt i ett kvittojobb utan att något tappas").
 *
 *   PRENUMERATIONEN (`useJobbRealtime`) ger SNABBHETEN: raderna tickar medan
 *   Lotta tittar, utan polling. Den bär ingen data — den invaliderar, och
 *   läsningen hämtar om.
 *
 * INGEN POLLING. Samma val som `useActivityLog` gjorde och av samma skäl: en
 * pollare frågar servern i blindo även när ingenting händer, medan
 * invalidering är händelsestyrd. Skillnaden mot aktivitetsloggen är bara
 * VILKEN händelse som utlöser den — där en lokal skrivning, här en
 * databasändring som kan komma från en Edge Function ingen flik känner till.
 */

/**
 * Läser jobbets läge. Utan `jobbId` returneras det SENASTE jobbet, vilket är
 * vad Hem-kortet visar och vad en nyöppnad app behöver utan att komma ihåg
 * något.
 *
 * `aktiv` gatar hämtningen via React Querys `enabled`, inte via ett tidigt
 * `return` hos anroparen: hooks-reglerna förbjuder villkorade hook-anrop, så
 * miljöflaggan måste trådas IN i hooken. Med `aktiv: false` görs inget
 * nätverksanrop alls — vilket är avsikten i prod, där EF:en ännu inte är
 * deployad (`JobbLyssnare` § MILJÖFLAGGAN).
 */
export function useJobbstatus(jobbId?: string, aktiv = true) {
  const dataSource = useDataSource();
  return useQuery<Jobbstatus>({
    queryKey: queryKeys.betalningar.jobbstatus(jobbId ?? null),
    queryFn: () => dataSource.fetchJobbstatus(jobbId ? { jobbId } : undefined),
    enabled: aktiv,
  });
}

/**
 * Prenumererar på `jobb_rad` och invaliderar HELA betalningsgrenen vid varje
 * ändring.
 *
 * VARFÖR HELA GRENEN OCH INTE BARA `jobbstatus`: en rad som tickar till
 * `skickat` ändrar också inkorgens "kvitton att skicka"-räknare och anmälans
 * egen kvittorad. Vilka av dem som råkar vara monterade vet bara React
 * Query — och `invalidateQueries` hämtar bara om AKTIVA queries, så bredden
 * kostar noll extra nätverksanrop för de vyer som inte visas. Samma
 * resonemang som `queryKeys.activityLog.all` redan bär.
 *
 * EN PRENUMERATION PER APP. Hooken är avsedd att monteras EN gång, av
 * `JobbLyssnare`; kanalnamnet i `jobbRealtime.ts` är delat, så två samtidiga
 * monteringar hade gett dubbla invalideringar utan att tillföra något.
 */
export function useJobbRealtime(aktiv: boolean): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!aktiv) return;
    return prenumereraPaJobbrader(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.betalningar.all });
    });
  }, [aktiv, queryClient]);
}
