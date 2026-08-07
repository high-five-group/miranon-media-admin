import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ManuellAnmalanForm } from '@/components/events/ManuellAnmalanForm';

// Zod v4-syntax: schema direkt i validateSearch (login.tsx-precedenten, ingen
// zodValidator-adapter krävs).
//
// `fran` bär VARIFRÅN hon kom, och styr bara EN sak: tillbaka-pilens mål.
// Utan param är målet oförändrat `/event/$eventId` — alla befintliga vägar in
// beter sig exakt som förut. Formen är search-param och inte history-state
// (som `mmAvsloja` bredvid) därför att en tillbaka-väg måste överleva en
// omladdning; avslöjnings-avsikten behöver inte det.
//
// En `z.literal` och inte `z.string()`: det finns precis en avsändare som
// behöver en annan tillbaka-väg. Ett fritt strängvärde hade inbjudit till en
// öppen redirect-yta för noll nytta.
const nyAnmalanSearchSchema = z.object({
  fran: z.literal('atgarder').optional(),
});

export const Route = createFileRoute('/_authenticated/event/$eventId/ny-anmalan')({
  staticData: { title: 'Lägg till manuell anmälan' },
  validateSearch: nyAnmalanSearchSchema,
  component: NyAnmalanPage,
});

// Manuell anmälan-sidan — SKARP (task-18.12; PRD task-18 beslut 17): skarpa formen
// bor i ManuellAnmalanForm (create-registration-vertikalen, Källa="Manuell" +
// server-satt event-koppling).
//
// Prototyp-grenen (`?variant=`) RIVEN i task-18.13 — se event/index.tsx.
function NyAnmalanPage() {
  const { eventId } = Route.useParams();
  const { fran } = Route.useSearch();
  return <ManuellAnmalanForm eventId={eventId} fran={fran} />;
}
