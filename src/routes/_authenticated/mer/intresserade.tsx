import { createFileRoute } from '@tanstack/react-router';
import { Intresserade } from '@/components/intresserade';

export const Route = createFileRoute('/_authenticated/mer/intresserade')({
  staticData: { title: 'Intresserade' },
  component: IntresseradePage,
});

// Mer — Intresserade-vy (Fas 6e L1 Landning 3): /mer/intresserade. LÄS-vy via
// fetchIntresserade → get-leads-EF (global lista, strikt lead-formel, Senaste
// interaktion desc). Logiken bor i Intresserade; routen håller bara montering.
// Syskon-leafs: index.tsx (Mer-landningen) + vantelista.tsx; <Outlet/> bärs av
// _authenticated via AppShell.
//
// [PROMOVERING SLUTFÖRD, TASK-374.4, ADR-103 B2 steg 4] Marcus godkände den
// promoverade formen 2026-09-03 (TASK-374.3-kvittensen: "Den promoverade
// ytan är identisk med facit i läge fylld; det som rivs är växlar och
// villkor, aldrig formen") — prototyp-substratet är rivet: `PROTO_VARIANTS`,
// `PROTO_DATA_LAGEN`, PrototypeSwitcher-monteringen och
// `useQueryState('variant')` (TASK-374.2s flipp) är borta. `Intresserade`
// (git-mv:ad ur den dåvarande prototypmappen i TASK-374.2 — se `git log
// --follow` för filens fulla historik) renderas ovillkorligt, utan variant-
// eller dataläge-grenar.
function IntresseradePage() {
  return <Intresserade />;
}
