import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/mer')({
  staticData: { title: 'Mer' },
  component: MerPage,
});

// Placeholder (Fas 5) — villkorlig Mer-vy byggs i Fas 6e.
function MerPage() {
  return <h1>Mer</h1>;
}
