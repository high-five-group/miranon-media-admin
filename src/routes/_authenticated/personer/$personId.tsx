import { createFileRoute } from '@tanstack/react-router';
import { PersonDetail } from '@/components/persons';

export const Route = createFileRoute('/_authenticated/personer/$personId')({
  staticData: { title: 'Persondetalj' },
  component: PersonDetailPage,
});

// Persondetalj (Fas 6a L5a) — aggregerande full-historik-vy via get-person
// (fetchPerson + router-context-DI, ADR-055). Syskon-leaf till personer/index;
// logiken bor i PersonDetail-komponenten, routen plockar bara ut param:t.
function PersonDetailPage() {
  const { personId } = Route.useParams();
  return <PersonDetail personId={personId} />;
}
