import { createFileRoute } from '@tanstack/react-router';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { CHECKIN_PROTO_VARIANTS, CheckinPrototyp } from '@/components/events/CheckinPrototyp';

export const Route = createFileRoute('/_authenticated/event/$eventId/narvaro')({
  staticData: { title: 'Närvaro' },
  component: EventAttendancePage,
});

// Event-detalj — Närvaro-vy (Fas 6b L3, C1 nested routes): /event/$eventId/narvaro.
// D ÄR PROMOVERAD (TASK-214.4) — logiken bor i CheckinPrototyp, routen håller
// bara montering. Syskon-leaf: index.tsx (info) + betalning.tsx, <Outlet/>
// bärs av _authenticated via AppShell.
function EventAttendancePage() {
  const { eventId } = Route.useParams();
  return <NarvaroYta eventId={eventId} />;
}

/**
 * [PROTOTYPE] Check-in-sidans kvarvarande wiring — D ÄR PROMOVERAD.
 *
 * VILLKORET ÄR FLIPPAT (ADR-103 B2 steg 1, TASK-214.4, 2026-08-15):
 * `CheckinPrototyp` renderas OVILLKORLIGT, UTANFÖR DEV-grinden — det är hela
 * poängen (PRD task-214: Lotta saknade en fungerande incheckningsyta
 * eftersom D levde bakom `import.meta.env.DEV`). Den gamla skarpa grenen
 * (`EventAttendance`, den rena läslistan) renderas inte längre härifrån —
 * filen är ORÖRD, rivningen är TASK-214.7:s ägande (ADR-102 B3). Datavägarna
 * behövde inget bevarande — prototypen kör redan samma
 * `useDataSource`/`fetchAttendance`/`fetchRegistrations`.
 *
 * A/B/C ÄR RIVNA i samma landning (persondetalj-precedenten, `dc0eb4ec`) —
 * de var jämförelseytor för ett formval som redan är gjort (Marcus,
 * 2026-08-13: "under all kritik"), aldrig kandidater. D:s form är facit.
 *
 * `?variant=`-LÄSNINGEN HÄRIFRÅN ÄR BORTA. Den blev bevisligen död när
 * grenen mot `EventAttendance` föll bort — kompilatorn fällde den som oläst.
 * En stale `?variant=d`-URL (B4-parets FÖRE-referens,
 * `tests/visual/dorrlista-promoverings-grind.spec.ts`, bokmärke, delad
 * länk) är harmlös: ingen kod läser parametern längre, så adressen renderar
 * exakt samma träd som ingen query alls — promoverings-grinden bevisar det
 * mekaniskt.
 *
 * VÄXLAREN/RAILEN STÅR KVAR med avsikt: ADR-102 B3 förbjuder rivning av
 * prototyp-substratet före Marcus godkännande av den PROMOVERADE ytan.
 * `PrototypeSwitcher` läser `?variant=` INTERNT (egen `useQueryState`,
 * `PrototypeSwitcher.tsx:93`) — det är den läsningen som lever kvar, inte en
 * duplicerad här. `CHECKIN_PROTO_VARIANTS` är krympt till den enda
 * kvarvarande posten (`CheckinPrototyp.tsx`).
 *
 * RIVNING (TASK-214.7): ta bort denna kommentar + `PrototypeSwitcher`-
 * monteringen, och `git mv` `CheckinPrototyp.tsx` → `EventCheckin.tsx` så
 * historiken följer FORMEN och inte filnamnet (personlistans precedent,
 * commit `4aad0111`).
 */
function NarvaroYta({ eventId }: { eventId: string }) {
  return (
    <>
      <div className="p-1">
        <CheckinPrototyp eventId={eventId} />
      </div>
      {import.meta.env.DEV && <PrototypeSwitcher variants={CHECKIN_PROTO_VARIANTS} />}
    </>
  );
}
