import { createFileRoute } from '@tanstack/react-router';
import { AktivitetsHistorik } from '@/components/aktivitetshistorik';

export const Route = createFileRoute('/_authenticated/mer/aktivitetshistorik')({
  staticData: { title: 'Aktivitetshistorik' },
  component: AktivitetsHistorikPage,
});

// Mer — Aktivitetshistoriken, kärnvyn (TASK-201.6): /mer/aktivitetshistorik.
// Formen är S106-facitet, PROMOVERAD i TASK-225.1 och Marcus-godkänd
// (facit-manifestet tasks/sessions/bilagor/s106-aktivitetslogg/facit.json,
// godkand 2026-08-15) — prototyp-växeln och prototypfilen revs mekaniskt
// efter stämpeln (ADR-103 B2d; återupplivningsväg: git-historiken via
// manifestets [PROTOTYPE]-SHA:n). LÄS-vy via useActivityLogHistory()
// (TASK-201.5) → get-activity-log-EF. Logiken bor i AktivitetsHistorik;
// routen håller bara montering. Syskon-leaf: index.tsx (Mer-landningen,
// AC #2:s nav-post); <Outlet/> bärs av _authenticated via AppShell.
// Reachable även på desktop via direkt URL/länk (hem-spaltens "Se all
// aktivitetshistorik", TASK-201.7) — samma mönster som
// maillogg.tsx/anmalningar.tsx: en `/mer/*`-hemvist begränsar inte vem som
// länkar hit.
function AktivitetsHistorikPage() {
  return <AktivitetsHistorik />;
}
