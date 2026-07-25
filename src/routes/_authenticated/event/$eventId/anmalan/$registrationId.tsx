import { createFileRoute } from '@tanstack/react-router';
import { AnmalanDetail } from '@/components/registrations/AnmalanDetail';

export const Route = createFileRoute('/_authenticated/event/$eventId/anmalan/$registrationId')({
  staticData: { title: 'Anmälan' },
  component: AnmalanPage,
});

// Per-anmälan-detaljvyn (task-18.17; S83-facit) — Anmäld-radens länkmål från
// eventsidans personkort (route-formen låst i kortet:
// /event/$eventId/anmalan/$registrationId; tillbaka-chevronen → eventsidan).
// Logiken bor i AnmalanDetail; routen håller bara montering (EventInfoPage-
// mönstret). <Outlet/> bärs av _authenticated via AppShell.
function AnmalanPage() {
  const { eventId, registrationId } = Route.useParams();
  return <AnmalanDetail eventId={eventId} registrationId={registrationId} />;
}
