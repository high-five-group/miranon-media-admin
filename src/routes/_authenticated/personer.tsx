import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/personer')({
  staticData: { title: 'Personer' },
  component: PersonerPage,
});

// Placeholder (Fas 5) — domän-vyn byggs i Fas 6a.
function PersonerPage() {
  return <h1>Personer</h1>;
}
