import { createFileRoute } from '@tanstack/react-router';
import { RegistrationsList } from '@/components/registrations';

export const Route = createFileRoute('/_authenticated/event/$eventId/betalning')({
  staticData: { title: 'Betalning' },
  component: EventPaymentPage,
});

// Event-detalj — Betalnings-vy (Fas 5.5 K2, ADR-055-wiringens första domän-vy).
// Syskon-leaf till event/$eventId/index.tsx (info) + narvaro.tsx; <Outlet/> bärs
// av _authenticated via AppShell, så ingen mellanliggande layout-route behövs.
// Flyttad leaf→katalog i Fas 6b L1 (C1 nested routes): /event/$eventId/betalning.
// INNEHÅLLET orört — bara route-path uppdaterad.
function EventPaymentPage() {
  const { eventId } = Route.useParams();
  return (
    <section className="flex flex-col gap-4 p-4">
      <h1>Anmälningar — betalning</h1>
      <RegistrationsList eventId={eventId} />
    </section>
  );
}
