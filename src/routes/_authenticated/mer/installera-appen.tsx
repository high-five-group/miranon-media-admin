import { createFileRoute } from '@tanstack/react-router';
import { InstalleraAppen } from '@/components/installera-appen';

export const Route = createFileRoute('/_authenticated/mer/installera-appen')({
  staticData: { title: 'Installera appen' },
  component: InstalleraAppenPage,
});

// Mer — Installera appen-ytan (task-126.3, T47 aktiverad): /mer/installera-appen.
// Statisk vy (ingen datahämtning, ingen EF) — plattformsdetekteringen är
// klient-lokal via useInstallPrompt (task-126.2). Logiken bor i
// InstalleraAppen; routen håller bara montering, samma mönster som
// segment.tsx/intresserade.tsx. <Outlet/> bärs av _authenticated via AppShell.
function InstalleraAppenPage() {
  return <InstalleraAppen />;
}
