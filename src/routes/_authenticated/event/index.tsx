import { createFileRoute } from '@tanstack/react-router';
import { EventsList } from '@/components/events';

export const Route = createFileRoute('/_authenticated/event/')({
  staticData: { title: 'Event' },
  component: EventPage,
});

// Event-listan till S72-facit (task-17.2) — periodfiltrerad månadsgrupp-vy
// via fetchEvents (LIVE) + router-context-DI (ADR-055). Logiken bor i
// EventsList; routen håller bara rubrik + montering (jfr personer/index.tsx).
// Sektionen bär facitets rytm (Mer-formens grund-arv): synlig h1 30/600
// (rubrikpolicyn S64), topp-luft pt-2/lg:pt-10, INGEN egen sidopadding —
// skalets main bär 16 px (dubbelkants-fyndet M6). Syskon: event/$eventId/,
// <Outlet/> bärs av _authenticated via AppShell.
//
// Prototyp-grenen (`?variant=`) RIVEN i task-18.13 när hela familjen var
// byggd och granskad — throwaway-kontraktets klausul iv/v. Faciten lever
// vidare i bilagorna (tasks/sessions/bilagor/s72-event-lista-konvergens/)
// och i git-historiken; växlaren själv består som stående dev-verktyg
// (ADR-074 beslut 4) med hemvist /dev/prototyper.
function EventPage() {
  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <h1 className="font-semibold text-3xl">Event</h1>
      <EventsList />
    </section>
  );
}
