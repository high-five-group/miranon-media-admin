import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import {
  ACTIVITY_OBJECT_TYPES,
  eventActivityName,
  eventObjectId,
  SKAPADE_EVENT_VERB,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { useDataSource } from '@/data/useDataSource';
import type { CreatedEvent, CreateEventInput } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * Mutation: "skapa event" (TASK-201.15 — extraherad ur `CreateEventForm.tsx`,
 * HEMVISTSLUCKAN: en komponent-lokal `useMutation` som TASK-201.13:s
 * mapp-scopade mätning strukturellt inte kunde se, se `activityTypes.ts`
 * § TASK-201.15-docblocket).
 *
 * KONTRAKTET (ADR-066, oförändrat av extraktionen): 201 (created) OCH 200
 * (idempotent replay) är BÅDA framgång — samma `onSuccess`, samma
 * invalidering, samma loggning. Ingen ny operation, ingen ny gren.
 *
 * AKTIVITETSLOGGEN (AC #2): objektet är det NYSKAPADE eventet
 * (`eventObjectId(created.id)`, kategori `event` — SAMMA kategori som
 * `useUpdateEvent`, ingen ny mintas). INGEN personId, samma regel som
 * `useUpdateEvent`: eventet självt är objektet, ingen genuin person i
 * sammanhanget vid skapande. `eventId: created.id` sätts ÄVEN här (till
 * skillnad mot om det utelämnats) så att statementet "skapade eventet"
 * dyker upp i EXAKT det event-scopade filtret ("visa allt som hänt DETTA
 * eventet") som `useUpdateEvent`s efterföljande ändringar redan gör —
 * annars vore skapelse-raden osynlig i sitt eget events historik.
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();

  return useMutation<CreatedEvent, Error, CreateEventInput>({
    mutationFn: (input) => dataSource.createEvent(input),
    onSuccess: (created) => {
      // 201 (created) OCH 200 (replay) → samma framgång; listan är inaktuell.
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });

      void recordActivity({
        dataSource,
        queryClient,
        actor: { id: user?.id ?? '', name: user?.displayName ?? null },
        verb: SKAPADE_EVENT_VERB,
        object: {
          id: eventObjectId(created.id),
          type: ACTIVITY_OBJECT_TYPES.event,
          name: eventActivityName(created.eventNamn),
        },
        eventId: created.id,
      });
    },
  });
}
