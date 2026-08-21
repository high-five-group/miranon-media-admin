import { useQuery } from '@tanstack/react-query';
import { useId, useMemo, useState } from 'react';
import { Button, Dialog, DialogTrigger, Modal } from '@/components/primitives';
import { MessageBox } from '@/components/primitives/MessageBox';
import { useRelinkRegistration } from '@/data/mutations/registrationEventLink';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import { queryKeys } from '@/queries/keys';
import { EventValjare } from '../events/EventValjare';
import { displayName } from './registration-display';

/**
 * Eventlänkens vakt — resolution-dialogen (task-284.3; ADR-122 beslut 7; PRD
 * task-284 användarberättelser 6+8+9). Öppnas från en rad vars
 * `eventmatchning` är `'Avviker'` eller `'Utan event'` (`AnmalningarList`) och
 * kopplar om anmälan till rätt event UTAN att Lotta någonsin öppnar
 * datakällan.
 *
 * AC 4 — "utan att gissa": anmälans EGNA uppgifter (datum, ort, kurs) visas
 * som ett fast informationsblock OVANFÖR väljaren, aldrig facit-lookup-
 * fälten för det (ev. felaktiga) länkade eventet — se `Registration.datum`s
 * docblock för varför `Datum (from Event)` aldrig är rätt källa här.
 *
 * Väljaren ÅTERANVÄNDS (`EventValjare`, `form="fristaende"`) i stället för en
 * ny sök-/listkomponent — Fas 6:s biblioteks-precedent (S83, samma popover-
 * maskineri som manuell anmälan/eventdetaljsidan). `onAvsikt` skickas INTE:
 * denna dialog byter event en gång per öppning, ingen prefetch-vinst att
 * hämta hem.
 *
 * AC 6 — en misslyckad koppling lämnar anmälan ORÖRD (mutationen är
 * medvetet icke-optimistisk, se `useRelinkRegistration`s docblock) och visar
 * SERVERNS EGEN felsträng (aldrig en hårdkodad "något gick fel" — samma
 * `MessageBox`-mönster som `AddRegistrationModal`).
 */
export function KopplaTillEventDialog({ registration }: { registration: Registration }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const dataSource = useDataSource();
  const infoId = useId();

  // `enabled: isOpen` — raden renderas för VARJE avvikande/okopplad anmälan
  // i listan, men eventlistan ska inte hämtas förrän Lotta faktiskt öppnar
  // dialogen (annars triggar en lång kö en hämtning per rad). Delar
  // queryKey med `EventValjare` (samma nyckel, `events.list`) — vilken av de
  // två som fetchar först spelar ingen roll, React Query dedupar.
  const { data: events } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
    enabled: isOpen,
  });

  const selectedEvent = useMemo(
    () => events?.find((e) => e.id === selectedEventId),
    [events, selectedEventId],
  );

  const mutation = useRelinkRegistration();

  // Rubrik/etikett per läge — 'Utan event' skiljer sig medvetet från
  // 'Avviker' i ordval (ADR-122 § Kontext: två olika berättelser, samma
  // handling): en okopplad anmälan ska KOPPLAS, en felkopplad ska KOPPLAS OM.
  const arUtanEvent = !registration.eventId;
  const knappEtikett = arUtanEvent ? 'Koppla till event' : 'Koppla till rätt event';
  const dialogTitel = arUtanEvent ? 'Koppla till event' : 'Koppla till rätt event';

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (open) {
      setSelectedEventId(undefined);
      mutation.reset();
    }
  }

  function handleConfirm(close: () => void) {
    if (!selectedEvent?.eventKey) return;
    mutation.mutate(
      {
        registration,
        eventId: selectedEvent.id,
        eventKey: selectedEvent.eventKey,
        eventNamn: selectedEvent.eventNamn,
      },
      { onSuccess: () => close() },
    );
  }

  const err = mutation.error;

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button intent="secondary" size="sm">
        {knappEtikett}
      </Button>
      <Modal isDismissable>
        <Dialog
          title={dialogTitel}
          size="md"
          aria-description="Anmälans egna uppgifter visas nedan så att du kan välja rätt event utan att gissa."
        >
          {({ close }) => (
            <div className="flex flex-col gap-4">
              {/* AC 4 — anmälans EGNA uppgifter, intill valet. */}
              <dl
                id={infoId}
                className="flex flex-col gap-1 rounded-xl border border-border bg-bg-muted p-3 text-small"
              >
                <div className="flex gap-2">
                  <dt className="shrink-0 font-medium text-text-secondary">Anmälan säger:</dt>
                  <dd className="min-w-0 truncate">{displayName(registration)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 font-medium text-text-secondary">Kurs</dt>
                  <dd className="min-w-0 truncate">{registration.eventNamn ?? 'Uppgift saknas'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 font-medium text-text-secondary">Ort</dt>
                  <dd className="min-w-0 truncate">{registration.ort ?? 'Uppgift saknas'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 font-medium text-text-secondary">Datum</dt>
                  <dd className="min-w-0 truncate">{registration.datum ?? 'Uppgift saknas'}</dd>
                </div>
              </dl>

              <div aria-describedby={infoId}>
                <EventValjare
                  valtEventId={selectedEventId}
                  valtEvent={selectedEvent}
                  onByte={setSelectedEventId}
                  isDisabled={mutation.isPending}
                  form="fristaende"
                />
              </div>

              {err && (
                <MessageBox intent="error" title="Kunde inte koppla anmälan">
                  {err instanceof Error ? err.message : 'Okänt fel.'}
                </MessageBox>
              )}

              <p className="sr-only" role="status" aria-live="polite">
                {mutation.isPending ? 'Kopplar anmälan…' : ''}
              </p>

              <div className="mt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  intent="ghost"
                  onPress={close}
                  isDisabled={mutation.isPending}
                >
                  Avbryt
                </Button>
                <Button
                  type="button"
                  intent="primary"
                  onPress={() => handleConfirm(close)}
                  isDisabled={!selectedEvent?.eventKey || mutation.isPending}
                >
                  {mutation.isPending ? 'Kopplar…' : 'Koppla anmälan'}
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}
