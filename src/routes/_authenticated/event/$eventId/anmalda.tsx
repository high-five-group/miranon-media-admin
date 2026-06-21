import { createFileRoute } from '@tanstack/react-router';
import { EventRegistrations } from '@/components/events';

export const Route = createFileRoute('/_authenticated/event/$eventId/anmalda')({
  staticData: { title: 'Anmälda' },
  component: EventRegistrationsPage,
});

// Event-detalj — Anmälda-vy (Fas 6c L2): /event/$eventId/anmalda. LÄS-vy via
// fetchRegistrations → get-registrations-EF (T15 väg D, ADR-055). Logiken bor i
// EventRegistrations; routen håller bara montering. Syskon-leaf: index.tsx (info)
// + narvaro.tsx + betalning.tsx; <Outlet/> bärs av _authenticated via AppShell.
function EventRegistrationsPage() {
  const { eventId } = Route.useParams();
  return <EventRegistrations eventId={eventId} />;
}
