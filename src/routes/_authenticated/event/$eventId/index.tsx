import { createFileRoute } from '@tanstack/react-router';
import { useQueryState } from 'nuqs';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';
import { EventDetail } from '@/components/events';
import {
  DETAIL_PROTO_VARIANTS,
  EventDetailPrototype,
} from '@/components/events/prototype/EventDetailPrototype';

export const Route = createFileRoute('/_authenticated/event/$eventId/')({
  staticData: { title: 'Event' },
  component: EventInfoPage,
});

// Event-detalj — Info-vy (Fas 6b L2, C1 nested routes). Default-route för
// /event/$eventId: berikad operations-översikt via fetchEvent (get-event-EF,
// ADR-055). Logiken bor i EventDetail; routen håller bara montering. Syskon-leaf:
// betalning.tsx + narvaro.tsx, <Outlet/> bärs av _authenticated via AppShell.
//
// [PROTOTYPE] S73 konvergens-pass (T66 fas 2, underform A): `?variant=`
// renderar EventDetailPrototype i stället — ENDAST i dev. Familje-flödet
// lista→detalj bär listans variant-värde (A/B) i URL:en; detaljsidans enda
// konvergens-variant är 'K' → alla tre aliasas dit (växlarens alias-kontrakt).
// Rivs vid svarsfångsten (throwaway-kontraktet klausul iv; klausul v S72:
// behålls som familje-substrat tills skarpt bygge).
const switcher = (
  <PrototypeSwitcher variants={DETAIL_PROTO_VARIANTS} aliases={{ A: 'K', B: 'K' }} />
);

function EventInfoPage() {
  const { eventId } = Route.useParams();
  const [variant] = useQueryState('variant');
  const [dataMode] = useQueryState('data');
  const showPrototype =
    import.meta.env.DEV && (variant === 'A' || variant === 'B' || variant === 'K');
  if (showPrototype) {
    return (
      <>
        <EventDetailPrototype eventId={eventId} useDemo={dataMode !== 'verklig'} />
        {switcher}
      </>
    );
  }
  return (
    <>
      <EventDetail eventId={eventId} />
      {import.meta.env.DEV ? switcher : null}
    </>
  );
}
