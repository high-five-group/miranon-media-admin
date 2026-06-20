import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/event/$eventId/')({
  staticData: { title: 'Event' },
  component: EventInfoPage,
});

// Event-detalj — Info-vy (Fas 6b, C1 nested routes). Default-route för
// /event/$eventId. Minimal platshållare i L1; den RIKTIGA info-vyn (fetchEvent
// + a11y 11/10) byggs i Fas 6b L2 (kräver get-event-deploy). fetchEvent är
// stubbad tills dess. Syskon-leaf: betalning.tsx + narvaro.tsx.
function EventInfoPage() {
  return (
    <section className="flex flex-col gap-4 p-4">
      <h1>Event</h1>
      <p className="text-small text-text-muted">Info-vyn byggs i Fas 6b L2.</p>
    </section>
  );
}
