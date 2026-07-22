import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CalendarDays, CalendarPlus, List } from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';
import { dateValue, EventCard, type Period } from './EventCard';
import { EventsCalendar } from './EventsCalendar';

const PERIOD_VALUES: Period[] = ['upcoming', 'past'];
const PERIOD_LABEL: Record<Period, string> = {
  upcoming: 'Kommande',
  past: 'Tidigare',
};

/** Vyvalet (URL-STATE-SPEC §Event): lista är default (ren URL — nuqs
    clearOnDefault), `?vy=kalender` bär kalenderläget (task-17.4). */
type Vy = 'lista' | 'kalender';
const VY_VALUES: Vy[] = ['lista', 'kalender'];

/**
 * Filtrera på period + sortera. PERIOD härleds ur `startdatum` mot idag —
 * ALDRIG ur Status-fältet (ORDLISTA "Period"; stänger T14 tekniskt):
 * planeringstillstånd (Planerat/Genomfört/Inställt/Flyttat) och tidsaxel
 * är två fria axlar — ett inställt event i framtiden är Kommande + Inställt.
 * Event utan startdatum räknas som Kommande (ännu ej daterat, inte förbi).
 *
 * Ordningen är LÅST utan sorteringsval (story 2): Kommande närmast först
 * (stigande), Tidigare senast först (fallande); null-datum sist.
 */
function filterByPeriod(events: Event[], period: Period, idagStart: number): Event[] {
  const filtered = events.filter((e) => {
    const isPast = dateValue(e) < idagStart; // Infinity (null) → aldrig past
    return period === 'past' ? isPast : !isPast;
  });
  const dir = period === 'past' ? -1 : 1;
  return [...filtered].sort((a, b) => dir * (dateValue(a) - dateValue(b)));
}

/** "Juli 2026" — månadsgrupprubriken bär månaden (sv-SE, versal först). */
function monthLabel(e: Event): string {
  if (!e.startdatum) return 'Datum ej satt';
  const d = new Date(e.startdatum);
  if (Number.isNaN(d.getTime())) return 'Datum ej satt';
  const label = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Gruppera den redan sorterade listan per månad (tomma månader finns inte). */
function groupByMonth(events: Event[]): { label: string; events: Event[] }[] {
  const groups: { label: string; events: Event[] }[] = [];
  for (const e of events) {
    const label = monthLabel(e);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.events.push(e);
    } else {
      groups.push({ label, events: [e] });
    }
  }
  return groups;
}

/**
 * Event-listan till S72-facit (task-17.2) — listvyn ände-till-ände. Facit:
 * `tasks/sessions/bilagor/s72-event-lista-konvergens/FACIT-listvyn.png`
 * ("Facit, vi låser hela event-listans yta", 2026-07-19).
 *
 * Formen: vy-raden (Skapa-ingången vänster [task-19.2, S73-utökningen K74]
 * + vy-ikon-toggeln höger [lista förvald, task-17.4]) → period-toggeln
 * [Kommande|Tidigare] (ToggleButtonGroup-primitiven, spread — facitets
 * likbreda pill-segment) → månadsgrupper (riktiga h2-rubriker, story 17) →
 * likformiga slot-kort (EventCard) → strukturerat text-tomläge. I kalender-
 * läget (`?vy=kalender`) ersätter EventsCalendar period-toggeln + listan.
 * Korten bär bor över-raden (härlett antal ur get-events, task-17.5).
 *
 * URL-kontraktet: `?period=upcoming|past` + `?vy=kalender` (nuqs, history
 * push — delbart och back-bart per URL-STATE-SPEC §Event) ERSÄTTER gamla
 * `?status`+`?sort`; sorteringen är låst per period (story 2) så inget
 * sort-val behövs. Kalenderläget läser inte ?period (kalendern äger tiden).
 *
 * Datakällan via router-context (`useDataSource`, ADR-055), stabil
 * query-nyckel (`events.list` — hela listan, klient-side filter).
 *
 * A11y (vy-ribba 11/10/10, Tillgänglighet 11):
 * - Period-toggeln är primitivens radiogroup (pilnavigering + Enter/Space,
 *   exakt ett val alltid — a11y-mönstret bevisat i primitivens spec).
 * - Periodväxling BEKRÄFTAS via aria-live ("Visar tidigare event. 2 event.")
 *   — PersonsList-announcern, skip-first.
 * - Lugnt laddläge (ORDLISTA; DESIGN-SYSTEM-SPEC §15): riktig h1 + riktig
 *   toggle direkt, skeleton-block i listans slutgeometri; Roselli-anatomin
 *   (role=status + aria-busy + sr-only-besked, blocken aria-hidden).
 * - Beläggning/status bärs av TEXT (färg förstärker, aldrig ensam bärare).
 */
export function EventsList() {
  const dataSource = useDataSource();
  const [period, setPeriod] = useQueryState(
    'period',
    parseAsStringEnum(PERIOD_VALUES).withDefault('upcoming').withOptions({ history: 'push' }),
  );
  // Vyvalet i URL:en (story 15): ?vy=kalender — lista är default med REN URL
  // (clearOnDefault); history push så Back rör sig mellan vylägena.
  const [vy, setVy] = useQueryState(
    'vy',
    parseAsStringEnum(VY_VALUES).withDefault('lista').withOptions({ history: 'push' }),
  );
  const kalenderLage = vy === 'kalender';

  // Dagsstarten: EN referenspunkt för både periodfiltret och dagar-kvar-
  // pillen (NastaEventCard-disciplinen — aldrig två olika "idag").
  const idagStart = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });

  const events = useMemo(
    () => (data ? filterByPeriod(data, period, idagStart) : []),
    [data, period, idagStart],
  );
  const groups = useMemo(() => groupByMonth(events), [events]);

  // A11y: bekräfta periodväxlingen — ENDAST vid faktisk växling (ingen
  // annons vid mount eller datalandning; PersonsList-announcerns princip,
  // skärpt till period-diff så initial-laddningen förblir tyst).
  const [announcement, setAnnouncement] = useState('');
  const prevPeriod = useRef(period);
  useEffect(() => {
    if (isPending || prevPeriod.current === period) return;
    prevPeriod.current = period;
    setAnnouncement(`Visar ${PERIOD_LABEL[period].toLowerCase()} event. ${events.length} event.`);
  }, [period, events.length, isPending]);

  const toggle = (
    <ToggleButtonGroup<Period>
      label="Period"
      spread
      selectedKey={period}
      onSelectionChange={(key) => setPeriod(key)}
    >
      {PERIOD_VALUES.map((p) => (
        <ToggleButton key={p} id={p}>
          {PERIOD_LABEL[p]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

  // Vy-ikon-toggeln (S72-facit K10): kompakt ikon-kapsel i samma grammatik
  // som period-toggeln, placerad ÖVER den på fast position i BÅDA lägena →
  // sömlös växling (inget hoppar). Ikonerna bär synligt; aria-label bär
  // semantiken (primitivens ikon-pill-mönster, spec §16). Högerställd;
  // vänstra platsen bär Skapa-ingången (task-19.2, S73-facit-utökningen
  // K74: "i linje med list- och kalendervy-väljaren fast på motsatt sida
  // i samma stil" — K73:s titelrads-primärknapp prövad-och-riven).
  // Ingången är väljarnas mjuka kapsel (rounded-full bg-bg-muted, ikon 18),
  // INTE primärknappens svärta, och leder till event-familjens skapa-sida
  // (hemvist-flytten, PRD task-19 beslut 2). Följer med i BÅDA vy-lägena
  // (raden har fast position). Fokusring via globala :focus-visible-regeln.
  const vyRad = (
    <div className="flex items-center justify-between gap-3">
      <Link
        to="/event/skapa"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
      >
        <CalendarPlus aria-hidden="true" size={18} className="shrink-0" />
        Skapa nytt event
      </Link>
      <ToggleButtonGroup<Vy>
        label="Visningsläge"
        selectedKey={vy}
        onSelectionChange={(key) => setVy(key)}
      >
        <ToggleButton
          id="lista"
          aria-label="Listvy"
          className="flex items-center justify-center px-3.5"
        >
          <List aria-hidden="true" size={18} />
        </ToggleButton>
        <ToggleButton
          id="kalender"
          aria-label="Kalendervy"
          className="flex items-center justify-center px-3.5"
        >
          <CalendarDays aria-hidden="true" size={18} />
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );

  // Felläget delas av båda vylägena (samma datakälla, samma besked).
  const felRuta = (
    <MessageBox intent="error" title="Kunde inte hämta event">
      {error instanceof Error ? error.message : 'Okänt fel.'}
    </MessageBox>
  );

  const body = (() => {
    if (isPending) {
      // Lugnt laddläge: skeleton i listans SLUTGEOMETRI — månadsrubrik-raden
      // + tre kort-block som speglar EventCards exakta anatomi (samma
      // padding/gap/typografi-klasser → layout-skift ≈ 0 vid datalandning).
      return (
        <div role="status" aria-busy="true" className="flex flex-col gap-2">
          <span className="sr-only">Laddar event…</span>
          <Skeleton variant="text" className="w-28 text-small" />
          <div className="flex flex-col gap-3">
            {['a', 'b', 'c'].map((k) => (
              <div
                key={k}
                className="flex flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-4"
              >
                <div className="flex flex-col gap-1 text-small">
                  <div className="min-h-[2lh] text-body">
                    <Skeleton variant="text" className="w-3/5 text-body" />
                  </div>
                  <Skeleton variant="text" className="w-2/5" />
                  <Skeleton variant="text" className="w-1/2" />
                  {/* Bor över-radens skeleton (task-17.5): fjärde metaraden så
                      slutgeometrin matchar EventCards nya rad (Lugnt laddläge —
                      datalandningen flyttar ingenting). */}
                  <Skeleton variant="text" className="w-1/3" />
                </div>
                <div className="flex flex-col gap-1 text-caption">
                  <Skeleton variant="text" className="w-2/5" />
                  <Skeleton variant="text" className="h-1.5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isError) {
      return felRuta;
    }

    if (events.length === 0) {
      // Strukturerat text-tomläge per facit (story 13): avsiktligt, lugnt.
      return (
        <div className="flex flex-col items-center gap-1 py-12 text-center">
          <p className="font-medium text-body">
            {period === 'upcoming' ? 'Inga kommande event' : 'Inga tidigare event'}
          </p>
          <p className="text-small text-text-muted">
            {period === 'upcoming'
              ? 'Event du planerar dyker upp här.'
              : 'Genomförda event dyker upp här.'}
          </p>
        </div>
      );
    }

    return groups.map((group) => (
      <section key={group.label} className="flex flex-col gap-2">
        <h2 className="font-semibold text-small text-text-secondary">{group.label}</h2>
        <ul aria-label={`Event ${group.label}`} className="flex flex-col gap-3">
          {group.events.map((e) => (
            <EventCard key={e.id} event={e} period={period} idagStart={idagStart} />
          ))}
        </ul>
      </section>
    ));
  })();

  return (
    <div className="flex flex-col gap-6">
      {/* Vy-toggeln ÖVER period-toggeln, fast position i båda lägena; i
          kalenderläget ERSÄTTER kalenderns månadsnav period-toggeln (PRD
          beslut 7 — navet är kalenderns tidsnavigation). */}
      {vyRad}
      {!kalenderLage && toggle}

      {/* Dold aria-live-region som bekräftar periodväxlingen. MEDVETET utan
          role="status": laddlägets skeleton-container äger status-rollen
          ensam (Roselli-anatomin) — live-regionen annonserar ändå. ALLTID
          monterad (stabil live-region; period växlas bara i listläget). */}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {kalenderLage ? (
        isError ? (
          felRuta
        ) : (
          // Kalendern äger tiden: HELA källan, ofiltrerad av ?period.
          <EventsCalendar events={data ?? []} isPending={isPending} idagStart={idagStart} />
        )
      ) : (
        body
      )}
    </div>
  );
}
