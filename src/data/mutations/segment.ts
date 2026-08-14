import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import {
  ACTIVITY_OBJECT_TYPES,
  SKICKADE_SEGMENT_MAIL_VERB,
  SPARADE_SEGMENT_VERB,
  segmentActivityName,
  segmentObjectId,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { useDataSource } from '@/data/useDataSource';
import type { MailPayload, MailSendResult } from '@/domain/models/MailPayload';
import type { SavedSegment, SaveSegmentInput } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * Segment-vertikalens TVÅ skrivande mutationer (TASK-201.15 — extraherade ur
 * `SegmentMailCompose.tsx`/`SegmentBuilder.tsx`, HEMVISTSLUCKAN, se
 * `activityTypes.ts` § TASK-201.15-docblocket). GRUPPERADE i EN fil, samma
 * konvention som `actionEmail.ts`/`registrationPayments.ts`/
 * `registrationConfirmation.ts`: två mutationer, samma domän (App-segment).
 *
 * `SegmentBuilder.tsx`s TREDJE `useMutation` (`computeSegment`, on-demand
 * mottagar-RÄKNING) bor KVAR lokalt i komponenten, medvetet — den skriver
 * ingenting (ren beräkning), TASK-201.15s källmärkta uppdrag namnger den
 * ALDRIG bland de tre att extrahera, och den är allowlistad i
 * `.mutation-hemvist-policy.conf` med samma motivering.
 */

/**
 * Mutation: "skicka mail till segment" (`useSendSegmentMail`,
 * `SegmentMailCompose.tsx`).
 *
 * AKTIVITETSLOGG-DESIGNET (AC #2), PRÖVAT MOT EF:ENS FAKTISKA SVAR — INTE
 * ANTAGET UR BULK-PRECEDENTEN:
 *
 * Bulk-precedenten (`useSendActionEmail`, TASK-201.13) loggar EN POST PER
 * FAKTISKT SÄND MOTTAGARE — men den läser `result.completed`, en lista av
 * registration-ID:n SERVERN SJÄLV rapporterar som klara. `send-email`s svar
 * (`MailSendResult`, 1:1 mot `BulkSendStatus`,
 * `supabase/functions/_shared/send-bulk.ts`) HAR INGEN MOTSVARIGHET: EF:en
 * beräknar internt `acceptedPersonIds` (samma fil, `runBulkSend` — raderna
 * som bygger `personIdByEmail`/`acceptedPersonIds` för Utskicksloggens
 * "Skickat till"-fält) men den listan LÄMNAR ALDRIG FUNKTIONEN — klienten
 * ser bara en `accepted`-RÄKNARE och en `rejections`-lista keyad på e-post
 * för de FALLNA (aldrig en motsvarande lista för de lyckade).
 *
 * Att ändå försöka bygga en per-mottagare-logg genom att korsa den
 * SEPARATA (och `staleTime`-cachade) `computeSegment`-frågan mot
 * `rejections` hade krävt en KLIENT-BYGGD mottagarlista — exakt det
 * `SegmentMailCompose.tsx`s eget ADR-067-kontrakt förbjuder ("EF:en löser
 * upp mottagarna SERVER-SIDE... aldrig en klient-byggd lista") — och hade
 * kunnat peka en aktivitetspost på FEL person vid en race (segmentets
 * medlemskap kan ändras mellan räkning och sändning; e-post är dessutom
 * inte garanterat unik).
 *
 * DÄRFÖR: EN AGGREGERAD POST per lyckad sändning (`accepted > 0`).
 * Objektet är SEGMENTET (`segmentObjectId`), inte en specifik mottagare —
 * kategori `mail` (delad med `mailVerb`/`SKICKADE_TESTMAIL_VERB`: det ÄR
 * ett mail, riktat mot ett segment i stället för en anmälan/ett event).
 * INGEN personId (ingen genuin ENSKILD person i sammanhanget — samma regel
 * som testmailets "till sig själv"-fall). Namnet bär mottagar-räkningen så
 * Lotta ändå ser HUR MÅNGA som fick mailet, även utan en lista av VILKA.
 *
 * ÖPPEN FÖRBÄTTRING, UTANFÖR DENNA SKIVAS SCOPE: returnerar `send-email`
 * i en framtida ändring `acceptedPersonIds`, kan hooken uppgraderas till
 * bulk-precedentens en-post-per-mottagare-form. Det är en BACKEND-ändring
 * (`supabase/functions/_shared/send-bulk.ts`s returtyp), inte en
 * klient-omdesign — flaggat till Marcus/orkestreraren i byggrapporten,
 * inte utfört här.
 *
 * `segmentNamn` skickas med i mutationens VARIABLER (inte hook-bundet):
 * `SegmentMailCompose.tsx`s segmentval kan ändras mellan hook-mount och
 * send, så namnet måste läsas vid MUTATE-tillfället. Destrukturerat bort
 * FÖRE `dataSource.sendEmail` (aldrig skickat till servern) — samma
 * mönster som `useSendActionEmail`s `mottagare`.
 *
 * AC #3 (INGEN FRITEXT): `onSuccess` destrukturerar ENDAST
 * `{ segmentIds, segmentNamn }` ur variablerna — `amne`/`mailtext` finns
 * INTE som bindning i scopet, strukturellt omöjliga att råka referera.
 */
export function useSendSegmentMail() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();

  return useMutation<MailSendResult, Error, MailPayload & { segmentNamn: string | null }>({
    mutationFn: ({ segmentNamn: _segmentNamn, ...payload }) => dataSource.sendEmail(payload),

    onSuccess: (result, { segmentIds, segmentNamn }) => {
      // Utskicksloggen har en ny rad → invalidera så maillogg-vyn refetchar.
      queryClient.invalidateQueries({ queryKey: queryKeys.maillog.all });

      // SERVERN ÄR FACIT: accepted===0 ('skipped' tomt/allt-undertryckt
      // ELLER 'failed' allt-avvisat) → inget faktiskt lämnade systemet,
      // ingen post (samma grind som testmailets `status !== 'sent'`).
      if (result.accepted === 0) return;
      const segmentId = segmentIds[0];
      if (!segmentId) return;

      void recordActivity({
        dataSource,
        queryClient,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: SKICKADE_SEGMENT_MAIL_VERB,
        object: {
          id: segmentObjectId(segmentId),
          type: ACTIVITY_OBJECT_TYPES.mail,
          name: `${segmentActivityName(segmentNamn)} (${result.accepted} mottagare)`,
        },
      });
    },
  });
}

/**
 * Mutation: "spara segment" (`useSaveSegment`, `SegmentBuilder.tsx`).
 *
 * NY OBJEKT-KATEGORI (AC #2, motiverad öppet — se
 * `ACTIVITY_OBJECT_TYPES.segment`s eget docblock): ett sparat segment är
 * varken ett event, en anmälan, en person eller ett mail; det är
 * App-segment-tabellens EGEN entitet (ADR-065). `segmentObjectId` DELAS med
 * `useSendSegmentMail` ovan — mailet ADRESSERAR ett segment, spara-
 * handlingen SKAPAR ett; samma entitet, olika verb pekar på den.
 *
 * INGEN personId/eventId: sparandet har inget genuint person- eller
 * event-sammanhang (ett segment är en TAXONOMI-regel över flera event,
 * `SegmentBuilder.tsx`s eget docblock).
 */
export function useSaveSegment() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();

  return useMutation<SavedSegment, Error, SaveSegmentInput>({
    mutationFn: (input) => dataSource.saveSegment(input),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.segment.saved });

      void recordActivity({
        dataSource,
        queryClient,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: SPARADE_SEGMENT_VERB,
        object: {
          id: segmentObjectId(saved.id),
          type: ACTIVITY_OBJECT_TYPES.segment,
          name: segmentActivityName(saved.namn),
        },
      });
    },
  });
}
