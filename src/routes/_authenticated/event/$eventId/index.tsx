import { createFileRoute } from '@tanstack/react-router';
import { EventDetail } from '@/components/events';

export const Route = createFileRoute('/_authenticated/event/$eventId/')({
  staticData: { title: 'Event' },
  component: EventInfoPage,
});

// Event-detalj — Info-vy (Fas 6b L2, C1 nested routes). Default-route för
// /event/$eventId: berikad operations-översikt via fetchEvent (get-event-EF,
// ADR-055). Logiken bor i EventDetail; routen håller bara montering. Syskon-leaf:
// betalning.tsx + narvaro.tsx, <Outlet/> bärs av _authenticated via AppShell.
function EventInfoPage() {
  const { eventId } = Route.useParams();
  return <EventDetail eventId={eventId} />;
}
