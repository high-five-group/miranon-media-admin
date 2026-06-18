import { createFileRoute } from '@tanstack/react-router';
import { PersonsList } from '@/components/persons';

export const Route = createFileRoute('/_authenticated/personer')({
  staticData: { title: 'Personer' },
  component: PersonerPage,
});

// Personer-listan (Fas 6a) — sökbar, cursor-paginerad vy (ADR-056) via
// listPersons + router-context-DI (ADR-055). Logiken bor i PersonsList;
// routen håller bara rubrik + montering (jfr event/$eventId.tsx).
function PersonerPage() {
  return (
    <section className="flex flex-col gap-4 p-4">
      <h1>Personer</h1>
      <PersonsList />
    </section>
  );
}
