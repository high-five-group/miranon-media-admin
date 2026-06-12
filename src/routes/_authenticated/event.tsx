import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/event')({
  staticData: { title: 'Event' },
  component: EventPage,
});

// Placeholder (Fas 5) — domän-vyn byggs i Fas 6b.
function EventPage() {
  return <h1>Event</h1>;
}
