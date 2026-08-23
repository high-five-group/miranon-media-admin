import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { AnmalningarSida } from '@/components/registrations';

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
//
// ── FILTER-AXLARNA MÅSTE DEKLARERAS, ANNARS STRYPS DE (TASK-299.5) ────────
//
// `z.object()` STRIPPAR okända nycklar (Zod-default, till skillnad från
// `z.looseObject`), och TanStack Router använder `validateSearch`s
// RETURVÄRDE som sidans search-state. Den promoverade formen bär fyra
// filter-axlar via `nuqs` (`?period`/`?typ`/`?ort`/`?event`), och `nuqs`
// skriver dem genom routern — `NuqsAdapter` från `nuqs/adapters/
// tanstack-router` (`__root.tsx`), inte direkt mot `window.location`. Utan
// deklarationerna nedan hade varje filterval strippats i samma andetag som
// det gjordes: URL:en nollställd, filtret dött.
//
// Prototyp-routen hade ingen `validateSearch` alls, så axlarna fungerade
// fritt där. Detta är alltså inte en formändring utan det pris den skarpa
// routens strängare search-kontrakt tar ut — och deklarationen betalar det
// explicit i stället för att luckra upp schemat med `z.looseObject`.
//
// `z.string()` och inte snävare typer: värderymden ägs av `FilterRad`/
// `EventValjare` och härleds ur DATAN (eventens typ/ort, record-ID:n), inte
// av routen. Ett okänt värde är redan inert i komponenten — det matchar
// ingen rad — så en andra, dupliceradvalidering här hade bara kunnat glida
// isär från den första.
const anmalningarSearchSchema = z.object({
  visa: z.literal('atgardskon').optional(),
  period: z.string().optional(),
  typ: z.string().optional(),
  ort: z.string().optional(),
  event: z.string().optional(),
});

export const Route = createFileRoute('/_authenticated/mer/anmalningar')({
  staticData: { title: 'Anmälningar' },
  validateSearch: anmalningarSearchSchema,
  component: AnmalningarPage,
});

// Mer — Samlade anmälningslistan: /mer/anmalningar. LÄS-vy via
// fetchRegistrations() utan filter → get-registrations event-lösa gren
// (global lista; klient-sort senaste-först i komponenten). Logiken bor i
// AnmalningarSida; routen håller bara montering + search-läsning
// (TASK-284.4: `visa=atgardskon` styr filtreringen, se AnmalningarSida.tsx).
// Syskon-leaf: index.tsx (Mer-landningen); <Outlet/> bärs av _authenticated
// via AppShell.
//
// FORMEN ÄR PROMOVERAD (TASK-299.5, ADR-103 B1/B2): task-1.4:s
// AnmalningarList.tsx är riven och ersatt av konvergensfasens godkända
// variant B, flyttad hit med `git mv`. Routen är i övrigt ORÖRD — samma
// validateSearch, samma prop, samma monteringspunkt. Det är precis vad
// ADR-103 B2 steg 1 föreskriver: formen flippas, datavägarna behålls.
function AnmalningarPage() {
  const { visa } = Route.useSearch();
  return <AnmalningarSida visaAtgardskon={visa === 'atgardskon'} />;
}
