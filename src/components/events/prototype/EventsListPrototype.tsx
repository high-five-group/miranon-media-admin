/**
 * [PROTOTYPE] — kastbar kod, levereras ALDRIG (throwaway-kontraktet,
 * prototype-skillen; klausul i+ii).
 *
 * FRÅGAN (nedskriven, styr formen): Hur ska event-listan se ut i
 * FK-mönstret — konvergens från S72:s grillade samsyn (sessionsdok
 * Del 2: pill-toggle [Kommande|Tidigare], månadsgrupprubriker,
 * 3-raders kort, statusbadge endast vid avvikelse, strukturerat
 * text-tomläge) tills Marcus låser facit?
 *
 * Konvergens-pass (T66 fas 2, tredje instansen; divergens-överhoppet
 * öppet bokfört per T69-precedenten). Underform A: monteras på
 * riktiga /event-routen bakom `?variant=K`, DEV-grindad. Startpunkt:
 * EXAKT kopia av EventsList (hjälparna eventName/belaggningText/
 * isFull/dateValue är kopierade därifrån, INTE delade — prototypen
 * ska vara fri att kasta sin form utan att röra skarp kod).
 *
 * `?data=demo` renderar representativ in-memory-data (Lotta-realistisk:
 * flera månader, Inställt, Flyttat, Fullt, flerdagars, platser-ej-satt)
 * — ingen persistens, inga writes (read-only-regeln). Verklig data
 * (default) ärver befintlig dataväg (router-context-DI → staging i
 * dev per ADR-061).
 *
 * Iterationssteg K1… bokförs i sessionsdok S72; skarpt bygge sker
 * NYSKRIVET genom leverans-grindarna (klausul iv — denna kod
 * absorberas aldrig).
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { MessageBox } from '@/components/primitives/MessageBox';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';

type Period = 'upcoming' | 'past';
const PERIOD_VALUES: Period[] = ['upcoming', 'past'];
const PERIOD_LABEL: Record<Period, string> = {
  upcoming: 'Kommande',
  past: 'Tidigare',
};

/* ── Hjälpare (kopierade ur EventsList — medvetet odelade) ── */

function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

function belaggningText(e: Event): string {
  if (e.maxPlatser == null) return `${e.antalAnmalda} anmälda (platser ej satt)`;
  return `${e.antalAnmalda} av ${e.maxPlatser} platser`;
}

function isFull(e: Event): boolean {
  return e.platserKvar != null && e.platserKvar <= 0;
}

function dateValue(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/* ── Prototyp-nya hjälpare (K1: samsyn-strukturen) ── */

/** "lördag 25 juli" · flerdagars "25–27 juli" · korsande "31 juli–2 augusti". */
function dateText(e: Event): string {
  if (!e.startdatum) return 'Datum ej satt';
  const start = new Date(e.startdatum);
  if (Number.isNaN(start.getTime())) return 'Datum ej satt';
  const singleDay = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  if (!e.slutdatum || e.slutdatum === e.startdatum) return singleDay.format(start);
  const end = new Date(e.slutdatum);
  if (Number.isNaN(end.getTime())) return singleDay.format(start);
  const dayOnly = new Intl.DateTimeFormat('sv-SE', { day: 'numeric' });
  const dayMonth = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' });
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return sameMonth
    ? `${dayOnly.format(start)}–${dayMonth.format(end)}`
    : `${dayMonth.format(start)}–${dayMonth.format(end)}`;
}

/** "Juli 2026" (månadsgrupprubriken bär månaden — korten behöver inte). */
function monthLabel(e: Event): string {
  if (!e.startdatum) return 'Datum ej satt';
  const d = new Date(e.startdatum);
  if (Number.isNaN(d.getTime())) return 'Datum ej satt';
  const label = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Filtrera per period + sortera (upcoming stigande, past fallande). */
function filterByPeriod(events: Event[], period: Period): Event[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStart = now.getTime();
  const filtered = events.filter((e) => {
    const isPast = dateValue(e) < todayStart; // Infinity (null) → aldrig past
    return period === 'past' ? isPast : !isPast;
  });
  const dir = period === 'past' ? -1 : 1;
  return [...filtered].sort((a, b) => dir * (dateValue(a) - dateValue(b)));
}

/** Gruppera i månadsordning (tomma månader renderas aldrig — de finns inte). */
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

/** Avvikelse-badgen: ENDAST Inställt/Flyttat (samsyn-beslut 6). */
function StatusBadge({ status }: { status: Event['status'] }) {
  if (status !== 'Inställt' && status !== 'Flyttat') return null;
  const cls = status === 'Inställt' ? 'border-error text-error' : 'border-warning text-warning';
  return (
    <span
      className={`shrink-0 self-start rounded-full border px-2.5 py-0.5 font-semibold text-caption ${cls}`}
    >
      {status}
    </span>
  );
}

/* ── Demo-data (in-memory, read-only; Lotta-realistiska namn) ── */

function demoEvent(overrides: Partial<Event> & Pick<Event, 'id'>): Event {
  return {
    eventlabel: null,
    eventNamn: null,
    typ: null,
    ort: null,
    startdatum: null,
    slutdatum: null,
    tidKvarTillEvent: null,
    maxPlatser: null,
    antalAnmalda: 0,
    platserKvar: null,
    anmaldBelaggning: null,
    bekraftadBelaggning: null,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: null,
    ...overrides,
  };
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const DEMO_EVENTS: Event[] = [
  demoEvent({
    id: 'demo-1',
    eventNamn: 'RIM 1 — Resor i medvetandet',
    ort: 'Skövde',
    startdatum: isoDaysFromNow(12),
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 8 / 12,
    status: 'Planerat',
  }),
  demoEvent({
    id: 'demo-2',
    eventNamn: 'Fjärrskådning grundkurs',
    ort: 'Stockholm',
    startdatum: isoDaysFromNow(26),
    slutdatum: isoDaysFromNow(28),
    maxPlatser: 10,
    antalAnmalda: 10,
    platserKvar: 0,
    anmaldBelaggning: 1,
    status: 'Planerat',
  }),
  demoEvent({
    id: 'demo-3',
    eventNamn: 'RIM 2 — Fördjupning',
    ort: 'Skövde',
    startdatum: isoDaysFromNow(45),
    maxPlatser: 12,
    antalAnmalda: 3,
    platserKvar: 9,
    anmaldBelaggning: 3 / 12,
    status: 'Inställt',
  }),
  demoEvent({
    id: 'demo-4',
    eventNamn: 'Föreläsning: Medveten kontakt',
    ort: 'Göteborg',
    startdatum: isoDaysFromNow(70),
    antalAnmalda: 34,
    status: 'Planerat',
  }),
  demoEvent({
    id: 'demo-5',
    eventNamn: 'Psionautics intro',
    ort: 'Skövde',
    startdatum: isoDaysFromNow(75),
    maxPlatser: 16,
    antalAnmalda: 5,
    platserKvar: 11,
    anmaldBelaggning: 5 / 16,
    status: 'Flyttat',
  }),
  demoEvent({
    id: 'demo-6',
    eventNamn: 'RIM 1 — Resor i medvetandet',
    ort: 'Skövde',
    startdatum: isoDaysFromNow(-9),
    maxPlatser: 12,
    antalAnmalda: 12,
    platserKvar: 0,
    anmaldBelaggning: 1,
    status: 'Genomfört',
  }),
  demoEvent({
    id: 'demo-7',
    eventNamn: 'Föreläsning: Fjärrskådning',
    ort: 'Stockholm',
    startdatum: isoDaysFromNow(-40),
    antalAnmalda: 58,
    status: 'Genomfört',
  }),
  demoEvent({
    id: 'demo-8',
    eventNamn: 'RIM 2 — Fördjupning',
    ort: 'Skövde',
    startdatum: isoDaysFromNow(-72),
    slutdatum: isoDaysFromNow(-70),
    maxPlatser: 12,
    antalAnmalda: 9,
    platserKvar: 3,
    anmaldBelaggning: 9 / 12,
    status: 'Genomfört',
  }),
];

/* ── Prototypen ── */

export function EventsListPrototype() {
  const dataSource = useDataSource();
  const [period, setPeriod] = useQueryState(
    'period',
    parseAsStringEnum(PERIOD_VALUES).withDefault('upcoming').withOptions({ history: 'push' }),
  );
  const [dataMode] = useQueryState('data');
  const useDemo = dataMode === 'demo';

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
    enabled: !useDemo,
  });

  const source = useDemo ? DEMO_EVENTS : (data ?? []);
  const events = filterByPeriod(source, period);
  const groups = groupByMonth(events);

  const toggle = (
    <fieldset className="grid grid-cols-2 rounded-full bg-bg-muted p-1">
      <legend className="sr-only">Period</legend>
      {PERIOD_VALUES.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={period === p}
          onClick={() => setPeriod(p)}
          className={
            period === p
              ? 'rounded-full bg-bg px-5 py-2 text-center font-semibold text-body shadow-sm'
              : 'rounded-full px-5 py-2 text-center font-medium text-body text-text-secondary'
          }
        >
          {PERIOD_LABEL[p]}
        </button>
      ))}
    </fieldset>
  );

  if (!useDemo && isPending) {
    return (
      <div className="flex flex-col gap-4">
        {toggle}
        <p role="status" aria-live="polite">
          Laddar event…
        </p>
      </div>
    );
  }

  if (!useDemo && isError) {
    return (
      <div className="flex flex-col gap-4">
        {toggle}
        <MessageBox intent="error" title="Kunde inte hämta event">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {toggle}

      {events.length === 0 && (
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
      )}

      {groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-2">
          <h2 className="font-semibold text-small text-text-secondary">{group.label}</h2>
          <ul aria-label={`Event ${group.label}`} className="flex flex-col gap-3">
            {group.events.map((e) => (
              <li
                key={e.id}
                className="relative flex flex-col gap-1 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to="/event/$eventId"
                    params={{ eventId: e.id }}
                    className="font-semibold text-body after:absolute after:inset-0"
                  >
                    {eventName(e)}
                  </Link>
                  <StatusBadge status={e.status} />
                </div>
                <span className="text-small text-text-secondary">
                  {[dateText(e), e.ort].filter(Boolean).join(' · ')}
                </span>
                <span className="text-small text-text-muted">
                  {belaggningText(e)}
                  {isFull(e) ? ' · Fullt' : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * [PROTOTYPE] Flytande variant-växlare (skillens steg 4) — DEV-only via
 * routens grind; visuellt skild från designen som utvärderas (mörk pill).
 * `skarp` = riktiga EventsList (baslinjen), `K` = konvergens-prototypen.
 */
export function EventsPrototypeSwitcher() {
  const [variant, setVariant] = useQueryState('variant');
  const [dataMode, setDataMode] = useQueryState('data');
  const isProto = variant === 'K';
  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-text px-4 py-2 text-small text-text-inverse shadow-lg">
      <span className="font-mono text-caption">[PROTOTYP]</span>
      <button
        type="button"
        onClick={() => setVariant(null)}
        className={isProto ? 'underline' : 'font-bold'}
      >
        Skarp
      </button>
      <button
        type="button"
        onClick={() => setVariant('K')}
        className={isProto ? 'font-bold' : 'underline'}
      >
        K
      </button>
      {isProto && (
        <>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={() => setDataMode(dataMode === 'demo' ? null : 'demo')}
            className="underline"
          >
            {dataMode === 'demo' ? 'Verklig data' : 'Demo-data'}
          </button>
        </>
      )}
    </div>
  );
}
