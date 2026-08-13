import { createFileRoute } from '@tanstack/react-router';
// [PROTOTYPE] S90 check-in-divergens — kastbar wiring (throwaway-kontraktet):
import { useQueryState } from 'nuqs';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { EventAttendance } from '@/components/events';
import {
  CHECKIN_PROTO_VARIANTS,
  CheckinPrototyp,
  type CheckinProtoVariant,
} from '@/components/events/CheckinPrototyp';

export const Route = createFileRoute('/_authenticated/event/$eventId/narvaro')({
  staticData: { title: 'Närvaro' },
  component: EventAttendancePage,
});

// Event-detalj — Närvaro-vy (Fas 6b L3, C1 nested routes): /event/$eventId/narvaro.
// Sessions-grupperad LÄS-vy via fetchAttendance (get-attendance-EF, ADR-055).
// Logiken bor i EventAttendance; routen håller bara montering. Syskon-leaf:
// index.tsx (info) + betalning.tsx, <Outlet/> bärs av _authenticated via AppShell.
function EventAttendancePage() {
  const { eventId } = Route.useParams();
  return <NarvaroYta eventId={eventId} />;
}

/**
 * [PROTOTYPE] S90 divergens-passet för CHECK-IN-sidan (prototyp-skillens
 * underform A: befintlig route, befintlig auth och datahämtning behålls —
 * bara det renderade underträdet byts). `?variant=a|b|c|d` väljer variant;
 * utan parametern renderas den SKARPA vyn oförändrad. Hela grenen är
 * DEV-grindad (ADR-044-mekaniken) — en råkad merge kan aldrig nå Lotta.
 */
function NarvaroYta({ eventId }: { eventId: string }) {
  const [variantParam] = useQueryState('variant');
  const variant: CheckinProtoVariant | null =
    import.meta.env.DEV &&
    (variantParam === 'a' || variantParam === 'b' || variantParam === 'c' || variantParam === 'd')
      ? variantParam
      : null;

  return (
    <>
      {variant ? (
        <div className="p-1">
          <CheckinPrototyp eventId={eventId} variant={variant} />
        </div>
      ) : (
        <EventAttendance eventId={eventId} />
      )}
      {import.meta.env.DEV && <PrototypeSwitcher variants={CHECKIN_PROTO_VARIANTS} />}
    </>
  );
}
