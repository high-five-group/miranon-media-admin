import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { AnmalningarList } from '@/components/registrations';

// Zod v4-syntax: schema direkt i validateSearch (login.tsx/ny-anmalan.tsx-
// precedenten, ingen zodValidator-adapter krävs).
//
// `visa` bär åtgärdskö-ingången (TASK-284.4; ADR-122 beslut 7, §22
// Åtgärdskön): Hem-vyns nya `Bevakningsrad`-typ (`atgardsko`) navigerar hit
// med `?visa=atgardskon` för att öppna åtgärdsytan FÖRFILTRERAD på exakt de
// anmälningar som behöver kopplas om (AC #4). Utan param är sidan oförändrad
// — global, ofiltrerad lista, alla befintliga vägar in (Mer-menyns NavCard)
// beter sig exakt som förut.
//
// `z.literal` och inte `z.string()`: EN avsändare (Bevakningsradens
// åtgärdskö-rad) behöver detta filterläge idag. Ett fritt strängvärde hade
// inbjudit till en öppen filter-yta för noll nytta (samma resonemang som
// `ny-anmalan.tsx`s `fran`-param).
const anmalningarSearchSchema = z.object({
  visa: z.literal('atgardskon').optional(),
});

export const Route = createFileRoute('/_authenticated/mer/anmalningar')({
  staticData: { title: 'Anmälningar' },
  validateSearch: anmalningarSearchSchema,
  component: AnmalningarPage,
});

// Mer — Samlade anmälningslistan (task-1.4): /mer/anmalningar. LÄS-vy via
// fetchRegistrations() utan filter → get-registrations event-lösa gren
// (global lista; klient-sort senaste-först i komponenten). Logiken bor i
// AnmalningarList; routen håller bara montering + search-läsning
// (TASK-284.4: `visa=atgardskon` styr filtreringen, se AnmalningarList.tsx).
// Syskon-leaf: index.tsx (Mer-landningen); <Outlet/> bärs av _authenticated
// via AppShell.
function AnmalningarPage() {
  const { visa } = Route.useSearch();
  return <AnmalningarList visaAtgardskon={visa === 'atgardskon'} />;
}
