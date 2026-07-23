import { createFileRoute } from '@tanstack/react-router';
import { CreateEventForm } from '@/components/event';

export const Route = createFileRoute('/_authenticated/event/skapa')({
  staticData: { title: 'Skapa nytt event' },
  component: SkapaEventPage,
});

// Skapa nytt event — event-familjens skapa-sida (HEMVIST-FLYTTEN task-19.2,
// PRD task-19 beslut 2, Marcus-kvitterad 2026-07-21): skarpa formen bor HÄR;
// Mer-ingången är riven och gamla /mer/skapa-event omdirigerar hit. Logiken
// bor i CreateEventForm (create-event-vertikalen, ADR-066). Statisk segment
// vinner över /$eventId i TanStack-rankingen.
//
// Prototyp-grenen (`?variant=`) RIVEN i task-18.13 — se event/index.tsx.
function SkapaEventPage() {
  return <CreateEventForm />;
}
