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
function IntresseradePage() {
  return <Intresserade />;
}
