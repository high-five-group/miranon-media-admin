import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { ManuellAnmalanForm } from '@/components/events/ManuellAnmalanForm';
import { ManuellAnmalanPrototype } from '@/components/events/prototype/ManuellAnmalanPrototype';

export const Route = createFileRoute('/_authenticated/event/$eventId/ny-anmalan')({
  staticData: { title: 'Lägg till manuell anmälan' },
  component: NyAnmalanPage,
});

// Manuell anmälan-sidan — SKARP (task-18.12; PRD task-18 beslut 17): skarpa formen
// bor i ManuellAnmalanForm (create-registration-vertikalen, Källa="Manuell" +
// server-satt event-koppling). Ersätter prototyp-grenens redirect.
//
// [PROTOTYPE] S73 K17 — familje-PROTOTYPEN nås fortsatt via dev + `?variant=`
// (samma grind som skapa-sidan/K75; klausul v: substratet behålls tills
// familje-rivningen [task-18.13] — prototypkod absorberas aldrig).
function NyAnmalanPage() {
  const { eventId } = Route.useParams();
  const [variant] = useQueryState('variant');
  const showPrototype =
    import.meta.env.DEV && (variant === 'A' || variant === 'B' || variant === 'K');
  if (showPrototype) return <ManuellAnmalanPrototype eventId={eventId} />;
  return <ManuellAnmalanForm eventId={eventId} />;
}
