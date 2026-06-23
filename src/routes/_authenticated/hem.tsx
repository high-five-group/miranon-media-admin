import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/hem')({
  staticData: { title: 'Hem' },
  component: HemPage,
});

function HemPage() {
  return <h1>Hem</h1>;
}
