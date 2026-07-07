import { createFileRoute } from '@tanstack/react-router';
import { Hem } from '@/components/hem';

export const Route = createFileRoute('/_authenticated/hem')({
  // hideShellHeader: K10-facitet (task-4.2) — Hem är header-fri; övriga
  // vyer behåller skalets header tills shell-spåret (klass C) avgör app-brett.
  staticData: { title: 'Hem', hideShellHeader: true },
  component: HemPage,
});

// Hem-aggregering (Fas 6d L1): /hem. Översiktsvy via befintliga read-EF
// (get-registrations event-lösa gren + get-events), STATISK hämtning — poll-lagret
// (ADR-017) är L2. Logiken bor i Hem-komponenten; routen håller bara montering.
// <Outlet/> bärs av _authenticated via AppShell.
function HemPage() {
  return <Hem />;
}
