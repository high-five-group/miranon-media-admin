import { createFileRoute } from '@tanstack/react-router';
import { AnmalningarList } from '@/components/registrations';

export const Route = createFileRoute('/_authenticated/mer/anmalningar')({
  staticData: { title: 'Anmälningar' },
  component: AnmalningarPage,
});

// Mer — Samlade anmälningslistan (task-1.4): /mer/anmalningar. LÄS-vy via
// fetchRegistrations() utan filter → get-registrations event-lösa gren
// (global lista; klient-sort senaste-först i komponenten). Logiken bor i
// AnmalningarList; routen håller bara montering. Syskon-leaf: index.tsx
// (Mer-landningen); <Outlet/> bärs av _authenticated via AppShell.
function AnmalningarPage() {
  return <AnmalningarList />;
}
