import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { ManuellAnmalanPrototype } from '@/components/events/prototype/ManuellAnmalanPrototype';

export const Route = createFileRoute('/_authenticated/event/$eventId/ny-anmalan')({
  staticData: { title: 'Lägg till manuell anmälan' },
  component: NyAnmalanPage,
});

// [PROTOTYPE] S73 K17 — sidan finns ännu ENDAST som prototyp (dev +
// `?variant=`, samma grind som detaljsidans). Skarp vy är PRD-materia
// (create-manuell-anmalan-flödet, Källa="Manuell"); utanför
// prototypflödet → tillbaka till detaljsidan (ingen död yta).
function NyAnmalanPage() {
  const { eventId } = Route.useParams();
  const [variant] = useQueryState('variant');
  const showPrototype =
    import.meta.env.DEV && (variant === 'A' || variant === 'B' || variant === 'K');
  if (showPrototype) return <ManuellAnmalanPrototype eventId={eventId} />;
  return <Navigate to="/event/$eventId" params={{ eventId }} replace />;
}
