import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/event/')({
  staticData: { title: 'Event' },
  component: EventPage,
});

// Placeholder (Fas 5) — domän-vyn (event-lista) byggs i Fas 6b. Flyttad från
// event.tsx till event/index.tsx i Fas 5.5 K2 så att event/$eventId kan bo som
// syskon-leaf (ADR-055-wiringens första domän-vy).
function EventPage() {
  return <h1>Event</h1>;
}
