import { createFileRoute } from '@tanstack/react-router';
import { CreateEventForm } from '@/components/event';

export const Route = createFileRoute('/_authenticated/mer/skapa-event')({
  staticData: { title: 'Skapa nytt event' },
  component: SkapaEventPage,
});

// Mer — Skapa nytt event (Fas 6f L2, ADR-066): /mer/skapa-event. create-event-vertikalens
// klient-yta — pessimistiskt formulär mot create-event-EF (idempotent upsert). Logiken bor
// i CreateEventForm; routen håller bara montering. <Outlet/> bärs av _authenticated via AppShell.
function SkapaEventPage() {
  return <CreateEventForm />;
}
