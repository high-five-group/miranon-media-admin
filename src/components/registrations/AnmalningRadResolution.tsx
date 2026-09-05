import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useId, useMemo, useState } from 'react';
import { EventValjare } from '@/components/events/EventValjare';
import { Button, Dialog, DialogTrigger, Modal } from '@/components/primitives';
import { MessageBox } from '@/components/primitives/MessageBox';
import { useRelinkRegistration } from '@/data/mutations/registrationEventLink';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import { queryKeys } from '@/queries/keys';
import { displayName } from './registration-display';

/**
 * Resolutionens RAD-BÄRANDE trigger på `/mer/anmalningar` (PRD `TASK-299`
 * AC #4 — "en rad som behöver kopplas om leder till resolutionen … inget
 * separat knappelement i raden").
 *
 * PROMOVERAD (TASK-299.5, `ADR-103` B1/B2): filen är konvergensfasens egen,
 * flyttad hit ur `src/components/dev/anmalningar-prototyp/` med `git mv` —
 * den är formens resolutionsväg och följer därför med formen, med sin
 * historik intakt (`git log --follow`). Den ENDA ändringen vid flytten är
 * detta docblock.
 *
 * ── HISTORIK: TVÅ RESOLUTIONS-KOMPONENTER I SAMMA KATALOG ────────────────
 *
 * Syskonet `KopplaTillEventDialog.tsx` bar SAMMA dialog bakom en liten
 * `"Koppla till event"`-etikett-knapp som trigger, medan denna komponent bär
 * `children` som trigger — radens eget namn-element, med
 * `after:absolute after:inset-0` så hela `<li>` blir klickytan
 * (`PersonsList.tsx`s helradsteknik). Det är skillnaden AC #4 kräver: den
 * enda interaktiva ytan per rad är ANTINGEN en riktig länk (OK-rader) ELLER
 * en riktig knapp (åtgärdsrader), aldrig båda och aldrig nästlade (axe
 * `nested-interactive`).
 *
 * Dupliceringen var medveten under prototypfasen (`ADR-102` B3: en prototyp
 * breddar aldrig en skarp, redan levererad komponent innan Marcus godkänt
 * formen). Syskonet miste sina konsumenter när denna komponent tog över
 * rollen (helradsteknik, AC #4) och revs som död kod i `TASK-400`
 * (2026-09-05) — det som återstår här är samma resolutionslogik i sin enda
 * kvarvarande form.
 *
 * Dialogens kropp, mutationen (`useRelinkRegistration`, ORÖRD
 * produktionshook) och felhanteringen var en verbatim kopia av syskonets, så
 * ytan har varit fullt funktionell mot riktig data sedan prototypfasen.
 */
export function AnmalningRadResolution({
  registration,
  children,
  triggerClassName = 'h-auto w-full justify-start rounded-none p-0 text-left font-normal hover:bg-transparent data-[hovered]:bg-transparent data-[pressed]:bg-transparent',
}: {
  registration: Registration;
  children: ReactNode;
  /** Triggerns klasser — default fyller HELA radens block (Variant A:s
      kort). Variant B/C skickar en SMAL trigger (bara namn-elementet) +
      `after:absolute after:inset-0` så hela `<li>` blir klickytan, samma
      teknik som `PersonsList.tsx`s helradslänk. */
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const dataSource = useDataSource();
  const infoId = useId();

  // `enabled: isOpen` — speglar originalet: eventlistan hämtas inte förrän
  // raden faktiskt öppnas.
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

  const arUtanEvent = !registration.eventId;
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
      {/* [AC #4] Hela radens innehåll ÄR triggern — `Button` renderar ett
          riktigt <button>, `w-full`/`text-left` gör det till radens fulla
          klickyta i stället för en text-liten etikett. `ghost`/`unstyled`-
          formen (`className` skriver över inline-layouten) håller radens
          EGEN visuella form intakt; knappen bidrar bara semantik+interaktion. */}
      <Button intent="ghost" className={triggerClassName}>
        {children}
      </Button>
      <Modal isDismissable>
        <Dialog
          title={dialogTitel}
          size="md"
          aria-description="Anmälans egna uppgifter visas nedan så att du kan välja rätt event utan att gissa."
        >
          {({ close }) => (
            <div className="flex flex-col gap-4">
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
                  {err instanceof Error ? err.message : 'Inget felmeddelande angavs.'}
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
