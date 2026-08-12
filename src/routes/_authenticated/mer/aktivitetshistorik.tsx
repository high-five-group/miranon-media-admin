import { createFileRoute } from '@tanstack/react-router';
import { AktivitetsHistorik } from '@/components/aktivitetshistorik';

export const Route = createFileRoute('/_authenticated/mer/aktivitetshistorik')({
  staticData: { title: 'Aktivitetshistorik' },
  component: AktivitetsHistorikPage,
});

// Mer — Aktivitetshistoriken, kärnvyn (TASK-201.6): /mer/aktivitetshistorik.
// A-formen — HEL yta utan filterrad (filterraden är TASK-201.8, additiv skiva).
// LÄS-vy via useActivityLogHistory() (TASK-201.5) → get-activity-log-EF.
// Logiken bor i AktivitetsHistorik; routen håller bara montering. Syskon-leaf:
// index.tsx (Mer-landningen, AC #2:s nav-post); <Outlet/> bärs av
// _authenticated via AppShell. Reachable även på desktop via direkt URL/länk
// (hem-spaltens "Se all aktivitetshistorik", TASK-201.7, OBYGGD) — samma
// mönster som maillogg.tsx/anmalningar.tsx: en `/mer/*`-hemvist begränsar inte
// vem som länkar hit.
function AktivitetsHistorikPage() {
  return <AktivitetsHistorik />;
}
