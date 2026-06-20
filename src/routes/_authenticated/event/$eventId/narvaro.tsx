import { createFileRoute } from '@tanstack/react-router';
import { EventAttendance } from '@/components/events';

export const Route = createFileRoute('/_authenticated/event/$eventId/narvaro')({
  staticData: { title: 'Närvaro' },
  component: EventAttendancePage,
});

// Event-detalj — Närvaro-vy (Fas 6b L3, C1 nested routes): /event/$eventId/narvaro.
// Sessions-grupperad LÄS-vy via fetchAttendance (get-attendance-EF, ADR-055).
// Logiken bor i EventAttendance; routen håller bara montering. Syskon-leaf:
// index.tsx (info) + betalning.tsx, <Outlet/> bärs av _authenticated via AppShell.
function EventAttendancePage() {
  const { eventId } = Route.useParams();
  return <EventAttendance eventId={eventId} />;
}
