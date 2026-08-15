import { createFileRoute } from '@tanstack/react-router';
import { EventCheckin } from '@/components/events/EventCheckin';

export const Route = createFileRoute('/_authenticated/event/$eventId/narvaro')({
  staticData: { title: 'Närvaro' },
  component: EventAttendancePage,
});

// Event-detalj — Närvaro-vy (Fas 6b L3, C1 nested routes): /event/$eventId/narvaro.
// Formen bor i EventCheckin, routen håller bara montering. Syskon-leaf:
// index.tsx (info) + betalning.tsx, <Outlet/> bärs av _authenticated via AppShell.
function EventAttendancePage() {
  const { eventId } = Route.useParams();
  return <NarvaroYta eventId={eventId} />;
}

/**
 * [PROMOVERING SLUTFÖRD — ADR-103 B2 steg 4, TASK-214.7, 2026-08-15]
 * Dörrlistan (variant D, S103-konvergensen) är den skarpa check-in-ytan på
 * denna route. Marcus godkände formen 2026-08-14 (kvitto:
 * `tasks/sessions/bilagor/s103-checkin-konvergens/facit.json` § godkand,
 * satt via `ADR-104`:s kanalseparation) — det förkrav `ADR-102` B3:s spärr
 * kräver innan något rivs.
 *
 * RIVET (persondetalj-precedenten `4aad0111`, samma form): rail-monteringen
 * (`PrototypeSwitcher`) och `CHECKIN_PROTO_VARIANTS`-registret. Villkor och
 * växlar — ALDRIG form. `?variant=`-villkoret var redan bevisligen dött
 * sedan TASK-214.4 (kompilatorn fällde det som oläst när A/B/C revs) — det
 * fanns alltså ingen läsning kvar att riva här.
 *
 * FILEN BYTTE NAMN: `CheckinPrototyp.tsx` → `EventCheckin.tsx`, buret av git
 * som en rename så historiken följer FORMEN och inte filnamnet. Gamla skarpa
 * läsvyn `EventAttendance.tsx` (ren läslista, ingen interaktion) är riven i
 * samma landning — den renderades inte längre härifrån sedan flippen
 * (TASK-214.4).
 *
 * En stale `?variant=d`-URL (bokmärke, delad länk, öppen flik) är harmlös:
 * ingen fil läser parametern längre, så adressen renderar exakt samma träd
 * som ingen query alls — `dorrlista-promoverings-grind.spec.ts` bevisar det
 * mekaniskt (regressionslås; samma sex `ariaSnapshot`-referenser genom både
 * flippen och denna rivning).
 */
function NarvaroYta({ eventId }: { eventId: string }) {
  return (
    <div className="p-1">
      <EventCheckin eventId={eventId} />
    </div>
  );
}
