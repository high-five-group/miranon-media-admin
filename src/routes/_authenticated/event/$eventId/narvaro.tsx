import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/event/$eventId/narvaro')({
  staticData: { title: 'Närvaro' },
  component: EventAttendancePage,
});

// Event-detalj — Närvaro-vy (Fas 6b, C1 nested routes): /event/$eventId/narvaro.
// Minimal platshållare i L1; den riktiga närvaro-vyn (fetchAttendance + a11y
// 11/10) byggs i Fas 6b L3 (kräver get-attendance-deploy). fetchAttendance är
// stubbad tills dess. Syskon-leaf: index.tsx (info) + betalning.tsx.
function EventAttendancePage() {
  return (
    <section className="flex flex-col gap-4 p-4">
      <h1>Närvaro</h1>
      <p className="text-small text-text-muted">Närvaro-vyn byggs i Fas 6b L3.</p>
    </section>
  );
}
