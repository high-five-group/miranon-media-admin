import { createFileRoute } from '@tanstack/react-router';
import { ManuellAnmalanForm } from '@/components/events/ManuellAnmalanForm';

export const Route = createFileRoute('/_authenticated/anmalan/ny')({
  staticData: { title: 'Lägg till manuell anmälan' },
  component: NyAnmalanUtanEventPage,
});

// Tunn ingång UTAN event (task-18.18 beslut 13, S83 pass 4-facit): renderar
// SAMMA komponent som /event/$eventId/ny-anmalan i TOMT LÄGE — väljaren står
// fristående som sidans enda handling och valet navigerar in i den nästlade
// routen (TVÅ TILLSTÅND, INTE TVÅ SIDOR — facit punkt 7).
//
// Branschprecedent (research 2026-07-24): Linear `linear.app/new` (inget team)
// + `linear.app/team/LIN/new` (team i path) · Rails-konventionen
// `/parent/:id/children/new` · Jira gating-fält. Search-param-formen
// (alternativ c) förkastad: bryter path-param-grammatiken för en enda sida.
// Hem-vyns kommande knapp är denna routes tänkta ingång (utanför skivan).
function NyAnmalanUtanEventPage() {
  return <ManuellAnmalanForm />;
}
