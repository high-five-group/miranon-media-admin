import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataSource } from '@/data/useDataSource';
import type { DocumentPreview } from '@/domain/models/Attachment';
import type { Kvittolank, SkickaKvittoIgenInput, SkickaKvittoIgenResult } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * [TASK-346.7 AC #2/#3, PRD berättelse 12 och 13] Kvittoradens två
 * handlingar: VISA den sparade PDF:en, och SKICKA IGEN.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "VISA" ÄR EN MUTATION, INTE EN QUERY - OCH DET ÄR INTE EN SLARVIGHET
 * ═══════════════════════════════════════════════════════════════════════════
 * `hamtaKvittolank` returnerar en SIGNERAD, TIDSBEGRÄNSAD URL
 * (`Kvittolank.utgar`). En query hade cachat den, och en cachad länk är per
 * definition en länk som kan ha hunnit gå ut innan den används - React Query
 * hade dessutom kunnat servera den ur den 24-timmars persisterade cachen
 * (ADR-072), där den garanterat är död.
 *
 * En mutation kör vid TRYCKET och cachar ingenting. Samma val som
 * `getAttachmentDownloadUrl`s konsumenter redan gör för bilagornas signerade
 * länkar, av exakt samma skäl.
 */
export function useKvittolank() {
  const dataSource = useDataSource();
  return useMutation<Kvittolank, Error, string>({
    mutationFn: (kvittoId) => dataSource.fetchKvittolank(kvittoId),
  });
}

/**
 * [TASK-353] "Förhandsgranska" — se kvittot INNAN det skickas.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EN MUTATION, AV SAMMA SKÄL SOM `useKvittolank` OVAN
 * ═══════════════════════════════════════════════════════════════════════════
 * Svaret bär en SIGNERAD, tidsbegränsad URL (`DocumentPreview.utgar`). En
 * query hade cachat den, och React Querys 24-timmars persisterade cache
 * (ADR-072) hade kunnat servera en garanterat död länk. Mutationen kör vid
 * TRYCKET och cachar ingenting.
 *
 * Dessutom RENDERAR varje anrop en ny PDF server-sidigt — en cachad "senaste
 * förhandsgranskning" hade kunnat visa ett belopp Lotta hunnit ändra.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SKILD FRÅN `useKvittolank` — OCH SKILLNADEN ÄR LASTBÄRANDE
 * ═══════════════════════════════════════════════════════════════════════════
 * `useKvittolank` HÄMTAR en redan lagrad PDF för ett kvitto som FINNS
 * (kräver `lagringsnyckel`, se `panel-harledningar.ts` § `kanVisa: harPdf`).
 * Denna RENDERAR ett kvitto som ännu inte finns: Kvitton-raden INSERTas
 * först av jobbkonsumenten (`_shared/kvittojobb.ts` FAS 1), PDF:en i FAS 2.
 * De två får ALDRIG slås ihop — en "smart" gemensam hook hade behövt gissa
 * vilket läge raden är i, och det är precis den bedömning härledningarna
 * (`kanForhandsgranska`/`kanVisa`) finns för att hålla utanför JSX.
 *
 * INGEN INVALIDERING: en förhandsgranskning ändrar ingenting. Inget
 * kvittonummer allokeras, ingen ledger-rad skrivs, inget mail går.
 * `invalidateQueries` här hade varit en lögn om att något förändrats.
 *
 * ANROPAREN ÄGER FÖNSTRET, precis som för `useKvittolank`/
 * `useForhandsgranskaBilaga`: öppna `window.open('', '_blank')` SYNKRONT i
 * klickets tick och sätt `location.href` när svaret kommer. Hooken öppnar
 * ingenting själv — popup-blockeraren stoppar annars fönstret, mätt skarpt
 * 2026-08-26 (`useForhandsgranskaBilaga.ts` § HISTORIK).
 */
export function useForhandsgranskaKvitto() {
  const dataSource = useDataSource();
  return useMutation<DocumentPreview, Error, string>({
    mutationFn: (inbetalningId) => dataSource.previewKvittoForInbetalning(inbetalningId),
  });
}

/**
 * "Skicka igen" - SAMMA PDF, SAMMA nummer, valfri annan adress.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SKILD FRÅN `koaKvitton`, OCH SKILLNADEN ÄR LASTBÄRANDE
 * ═══════════════════════════════════════════════════════════════════════════
 * `koaKvitton` köar ett kvitto som ska SKAPAS och skickas första gången (och
 * är rätt väg för en FALLERAD jobbrad, som aldrig fick något utskickat
 * kvitto). Denna port upprepar ett kvitto som REDAN gått i väg. Ett nytt
 * nummer hade gjort det till ett ANNAT kvitto, och Rogers verifikationskedja
 * bygger på att det inte gör det (`Betalningar.schema.ts` §
 * SkickaKvittoIgenInput).
 *
 * `kvittolage` (`panel-harledningar.ts`) avgör vilken av de två en rad får
 * erbjuda, så valet aldrig blir en bedömning i JSX.
 *
 * INVALIDERINGEN träffar hela betalningsgrenen: ett omskickat kvitto ändrar
 * ledgerns `skickadNar`/`mottagare`, vilket syns på anmälans rad, personens
 * rad och i inkorgen. `invalidateQueries` hämtar bara om AKTIVA queries, så
 * bredden kostar noll extra anrop för de vyer som inte visas - samma
 * resonemang som `useRegistreraInbetalning` och `useJobbRealtime` redan bär.
 */
export function useSkickaKvittoIgen() {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();

  return useMutation<SkickaKvittoIgenResult, Error, SkickaKvittoIgenInput>({
    mutationFn: (input) => dataSource.skickaKvittoIgen(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.betalningar.all });
    },
  });
}
