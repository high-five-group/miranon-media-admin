import { createFileRoute } from '@tanstack/react-router';
import { ManuellAnmalanForm } from '@/components/events/ManuellAnmalanForm';

export const Route = createFileRoute('/_authenticated/event/$eventId/ny-anmalan')({
  staticData: { title: 'Lägg till manuell anmälan' },
  component: NyAnmalanPage,
});

// Manuell anmälan-sidan — SKARP (task-18.12; PRD task-18 beslut 17): skarpa formen
// bor i ManuellAnmalanForm (create-registration-vertikalen, Källa="Manuell" +
// server-satt event-koppling).
//
// Prototyp-grenen (`?variant=`) RIVEN i task-18.13 — se event/index.tsx.
function NyAnmalanPage() {
  const { eventId } = Route.useParams();
  return <ManuellAnmalanForm eventId={eventId} />;
}
