import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { SkapaEventPrototype } from '@/components/events/prototype/SkapaEventPrototype';

export const Route = createFileRoute('/_authenticated/event/skapa')({
  staticData: { title: 'Skapa nytt event' },
  component: SkapaEventPage,
});

// [PROTOTYPE] S73 K75 — familje-formen finns ännu ENDAST som prototyp
// (dev + `?variant=`, samma grind som ny-anmalan/K17). Utanför
// prototypflödet → skarpa /mer/skapa-event (Fas 6f-funktionen; ingen
// död yta). Statisk segment vinner över /$eventId i TanStack-rankingen.
function SkapaEventPage() {
  const [variant] = useQueryState('variant');
  const showPrototype =
    import.meta.env.DEV && (variant === 'A' || variant === 'B' || variant === 'K');
  if (showPrototype) return <SkapaEventPrototype />;
  return <Navigate to="/mer/skapa-event" replace />;
}
