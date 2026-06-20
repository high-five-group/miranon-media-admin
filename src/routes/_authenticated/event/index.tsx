import { createFileRoute } from '@tanstack/react-router';
import { EventsList } from '@/components/events';

export const Route = createFileRoute('/_authenticated/event/')({
  staticData: { title: 'Event' },
  component: EventPage,
});

// Event-listan (Fas 6b L1) — filtrerbar + sorterbar vy via fetchEvents (LIVE)
// + router-context-DI (ADR-055). Logiken bor i EventsList; routen håller bara
// rubrik + montering (jfr personer/index.tsx). Syskon: event/$eventId/ (detalj-
// routes info/betalning/narvaro), <Outlet/> bärs av _authenticated via AppShell.
function EventPage() {
  return (
    <section className="flex flex-col gap-4 p-4">
      <h1>Event</h1>
      <EventsList />
    </section>
  );
}
