import { createFileRoute } from '@tanstack/react-router';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
// [PROTOTYPE] S83 pass 4 (TASK-18.18) — kastbar import, rivs med passet.
import { PROTO_VARIANTS_18_18 } from '@/components/events/EventValjarePrototyp';
import { ManuellAnmalanForm } from '@/components/events/ManuellAnmalanForm';

export const Route = createFileRoute('/_authenticated/event/$eventId/ny-anmalan')({
  staticData: { title: 'Lägg till manuell anmälan' },
  component: NyAnmalanPage,
});

// Manuell anmälan-sidan — SKARP (task-18.12; PRD task-18 beslut 17): skarpa formen
// bor i ManuellAnmalanForm (create-registration-vertikalen, Källa="Manuell" +
// server-satt event-koppling).
//
// Prototyp-grenen (`?variant=`) RIVEN i task-18.13 — se event/index.tsx.
function NyAnmalanPage() {
  const { eventId } = Route.useParams();
  // [PROTOTYPE] S83 pass 4 (TASK-18.18): railen DEV-monteras; väljar-grenen
  // bor i ManuellAnmalanForm. Rivs med passet.
  return (
    <>
      <ManuellAnmalanForm eventId={eventId} />
      {import.meta.env.DEV ? <PrototypeSwitcher variants={PROTO_VARIANTS_18_18} /> : null}
    </>
  );
}
