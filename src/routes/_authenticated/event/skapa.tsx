import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { CreateEventForm } from '@/components/event';
import { SkapaEventPrototype } from '@/components/events/prototype/SkapaEventPrototype';

export const Route = createFileRoute('/_authenticated/event/skapa')({
  staticData: { title: 'Skapa nytt event' },
  component: SkapaEventPage,
});

// Skapa nytt event — event-familjens skapa-sida (HEMVIST-FLYTTEN task-19.2,
// PRD task-19 beslut 2, Marcus-kvitterad 2026-07-21): skarpa formen bor HÄR;
// Mer-ingången är riven och gamla /mer/skapa-event omdirigerar hit. Logiken
// bor i CreateEventForm (create-event-vertikalen, ADR-066); formens innehåll
// mot S73-facit-utökningen ägs av task-19.3. Statisk segment vinner över
// /$eventId i TanStack-rankingen.
//
// [PROTOTYPE] S73 K75 — familje-PROTOTYPEN nås fortsatt via dev + `?variant=`
// (samma grind som ny-anmalan/K17; klausul v: substratet behålls tills skarpa
// bygget — task-19.3 — absorberas aldrig).
function SkapaEventPage() {
  const [variant] = useQueryState('variant');
  const showPrototype =
    import.meta.env.DEV && (variant === 'A' || variant === 'B' || variant === 'K');
  if (showPrototype) return <SkapaEventPrototype />;
  return <CreateEventForm />;
}
