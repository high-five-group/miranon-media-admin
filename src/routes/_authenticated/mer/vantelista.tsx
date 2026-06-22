import { createFileRoute } from '@tanstack/react-router';
import { Waitlist } from '@/components/waitlist';

export const Route = createFileRoute('/_authenticated/mer/vantelista')({
  staticData: { title: 'Väntelista' },
  component: WaitlistPage,
});

// Mer — Väntelista-vy (Fas 6c Leverabel 3): /mer/vantelista. LÄS-vy via
// fetchWaitlist → get-waitlist-EF (global lista, NOT Flyttad, createdTime desc).
// Logiken bor i Waitlist; routen håller bara montering. Syskon-leaf: index.tsx
// (Mer-landningen); <Outlet/> bärs av _authenticated via AppShell.
function WaitlistPage() {
  return <Waitlist />;
}
