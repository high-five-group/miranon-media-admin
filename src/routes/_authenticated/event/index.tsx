import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { EventsList } from '@/components/events';
import {
  EventsListPrototype,
  EventsPrototypeSwitcher,
} from '@/components/events/prototype/EventsListPrototype';

export const Route = createFileRoute('/_authenticated/event/')({
  staticData: { title: 'Event' },
  component: EventPage,
});

// Event-listan (Fas 6b L1) — filtrerbar + sorterbar vy via fetchEvents (LIVE)
// + router-context-DI (ADR-055). Logiken bor i EventsList; routen håller bara
// rubrik + montering (jfr personer/index.tsx). Syskon: event/$eventId/ (detalj-
// routes info/betalning/narvaro), <Outlet/> bärs av _authenticated via AppShell.
//
// [PROTOTYPE] S72 konvergens-pass (T66 fas 2, underform A): `?variant=K`
// renderar EventsListPrototype i stället — ENDAST i dev (ADR-044-mekaniken
// på komponentnivå; produktionen ser aldrig växlaren eller prototypen).
// Rivs vid svar-fångsten (throwaway-kontraktet klausul iv).
function EventPage() {
  const [variant] = useQueryState('variant');
  const showPrototype = import.meta.env.DEV && variant === 'K';
  // K2: prototypen bär sin EGEN sektion + h1 (Mer-formens grund-arv, utan
  // dubbel sidopadding) — skarpa vyn behåller dagens wrapper orörd.
  if (showPrototype) {
    return (
      <>
        <EventsListPrototype />
        <EventsPrototypeSwitcher />
      </>
    );
  }
  return (
    <section className="flex flex-col gap-4 p-4">
      <h1>Event</h1>
      <EventsList />
      {import.meta.env.DEV ? <EventsPrototypeSwitcher /> : null}
    </section>
  );
}
