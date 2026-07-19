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
 * Demo-data är DEFAULT (K2): representativ in-memory-data
 * (Lotta-realistisk: flera månader, Inställt, Flyttat, Fullt,
 * flerdagars, platser-ej-satt) — ingen persistens, inga writes
 * (read-only-regeln). `?data=verklig` är opt-in och ärver befintlig
 * dataväg (router-context-DI → staging i dev per ADR-061).
 *
 * Iterationssteg K1… bokförs i sessionsdok S72; skarpt bygge sker
 * NYSKRIVET genom leverans-grindarna (klausul iv — denna kod
 * absorberas aldrig).
 */

import type { CalendarDate } from '@internationalized/date';
import { getLocalTimeZone, today } from '@internationalized/date';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, List, MapPin } from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import {
  Button as AriaButton,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  I18nProvider,
} from 'react-aria-components';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
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

/* ── Variant-korten (divergens-axeln, Marcus-beslut i konvergensen:
      A = FK-radens tysta tre textrader · B = Hem-kortets grammatik
      [NastaEventCard: ikonrader, dagar-kvar-pill, långdatum, stapel].
      Hjälpare kopierade ur NastaEventCard — medvetet odelade. ── */

/** Långdatum per K10-facit ("15 september 2026") — sv-SE, aldrig rå ISO. */
const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Dagar-kvar-pillens tre exakta former (K10-facit): Idag / 1 dag kvar / N dagar kvar. */
function dagarKvarText(startMs: number, idagStartMs: number): string {
  const dagar = Math.round((startMs - idagStartMs) / 86_400_000);
  if (dagar <= 0) return 'Idag';
  return dagar === 1 ? '1 dag kvar' : `${dagar} dagar kvar`;
}

/** Variant A — FK-raden (grillade baslinjen): tre textrader, badge vid avvikelse. */
function VariantACard({ e }: { e: Event }) {
  return (
    <li className="relative flex flex-col gap-1 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong">
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
  );
}

/**
 * Variant B — Hem-kortets grammatik, K8-omgjord till LIKFORMIGA kort med
 * SLOT-modellen (Marcus-beslut: "korten måste alltid ha exakt samma storlek
 * — reservera plats för allt"; badgarna RIVNA):
 * - Alla rader renderas ALLTID (ort/datum/bor över får platshållare) och
 *   rubriken reserverar exakt 2 rader (line-clamp + min-h) med pill-frizon.
 * - Status-slotten topp-höger är SEMANTISK: "Inställt"/"Flyttat" ERSÄTTER
 *   dagar-kvar (ett inställt event har ingen nedräkning) — branschmönstret
 *   (Google Calendar-klassen: strikethrough/dimmat + text) + vårt snäpp:
 *   ingen badge-stapling, kortet ljuger aldrig.
 * - Inställt: dimmat kort + genomstruken rubrik + "Inställt" i slotten
 *   (texten bär — dimning/färg är förstärkning, aldrig ensam bärare).
 * - Fullbokat: GRÖN kontur + grön stapel-fyllnad; texten "X av X platser
 *   bokade" bär redan tillståndet.
 */
function VariantBCard({
  e,
  period,
  idagStart,
}: {
  e: ProtoEvent;
  period: Period;
  idagStart: number;
}) {
  const startMs = dateValue(e);
  const installt = e.status === 'Inställt';
  const flyttat = e.status === 'Flyttat';
  const full = isFull(e);
  const maxPlatser = e.maxPlatser;
  const andel =
    maxPlatser != null && maxPlatser > 0
      ? Math.min(100, Math.round((e.antalAnmalda / maxPlatser) * 100))
      : 0;
  // Status-slotten: avvikelse vinner alltid; dagar-kvar endast Kommande.
  const slot = installt
    ? { text: 'Inställt', cls: 'text-error' }
    : flyttat
      ? { text: 'Flyttat', cls: 'text-warning' }
      : period === 'upcoming' && e.startdatum && Number.isFinite(startMs)
        ? { text: dagarKvarText(startMs, idagStart), cls: '' }
        : null;
  const kontur = full ? 'border-success' : 'border-transparent contrast-more:border-border-strong';
  return (
    // Hover-bakgrund (Marcus-iterationen): bg-muted → bg-emphasized — NYTT
    // beslut för event-korten (NavCards M3-avslag gällde Mer-raderna).
    <li
      className={`relative flex flex-col gap-2 rounded-2xl border bg-bg-muted p-4 hover:bg-bg-emphasized motion-safe:transition-colors ${kontur} ${
        installt ? 'opacity-60' : ''
      }`}
    >
      {slot ? (
        <span
          className={`absolute top-4 right-4 rounded-full bg-surface px-2.5 py-0.5 font-medium text-caption ${slot.cls}`}
        >
          {slot.text}
        </span>
      ) : null}
      <div className="flex flex-col gap-1 text-small">
        {/* Rubriken reserverar ALLTID 2 rader + pill-frizonen (likformighet). */}
        <Link
          to="/event/$eventId"
          params={{ eventId: e.id }}
          className={`line-clamp-2 min-h-[2lh] pr-24 font-semibold text-body after:absolute after:inset-0 ${
            installt ? 'line-through' : ''
          }`}
        >
          {eventName(e)}
        </Link>
        <span className="flex items-center gap-1.5">
          <MapPin aria-hidden="true" size={14} className="shrink-0 text-text-secondary" />
          {e.ort ?? 'Ort ej satt'}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" size={14} className="shrink-0 text-text-secondary" />
          {e.startdatum ? LANGDATUM.format(new Date(e.startdatum)) : 'Datum ej satt'}
        </span>
        {/* "Bor över"-raden ALLTID (slot-modellen) — säng-ikon + antal.
            Fältet finns INTE i basen ännu (demo-fält; skarpa kravet = PRD +
            additivt bas-fält); okänt värde visas som "–". */}
        <span className="flex items-center gap-1.5">
          <BedDouble aria-hidden="true" size={14} className="shrink-0 text-text-secondary" />
          {e.boverAntal ?? '–'} bor över
        </span>
      </div>
      {/* Beläggningsblocket ALLTID (slot-modellen): text + stapel-spår även
          när taket saknas (tom fyllnad). Grön fyllnad vid fullbokat. */}
      <div className="flex flex-col gap-1">
        <span className="text-caption text-text-secondary">
          {maxPlatser != null
            ? `${e.antalAnmalda} av ${maxPlatser} platser bokade`
            : `${e.antalAnmalda} anmälda (platser ej satt)`}
        </span>
        <div aria-hidden="true" className="h-1.5 rounded-full bg-surface">
          <div
            className={`h-full rounded-full ${full ? 'bg-success' : 'bg-(--p-neutral-400)'}`}
            style={{ width: `${andel}%` }}
          />
        </div>
      </div>
    </li>
  );
}

/* ── Demo-data (in-memory, read-only; Lotta-realistiska namn) ── */

/**
 * "Bor över"-antalet FINNS INTE i basen idag (verifierat mot data-model.md
 * 2026-07-19) — prototypen visar FORMEN med demo-fältet; skarpa kravet =
 * PRD-post + additivt bas-fält (ADR-063-leverabeln) + EF-/modell-utökning.
 * Verklig data saknar fältet → raden döljs.
 */
type ProtoEvent = Event & { boverAntal?: number };

function demoEvent(overrides: Partial<ProtoEvent> & Pick<Event, 'id'>): ProtoEvent {
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

const DEMO_EVENTS: ProtoEvent[] = [
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
    boverAntal: 3,
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
    boverAntal: 5,
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
    boverAntal: 1,
  }),
  demoEvent({
    id: 'demo-4',
    eventNamn: 'Föreläsning: Medveten kontakt',
    ort: 'Göteborg',
    startdatum: isoDaysFromNow(70),
    antalAnmalda: 34,
    status: 'Planerat',
    boverAntal: 0,
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
    boverAntal: 2,
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
    boverAntal: 4,
  }),
  demoEvent({
    id: 'demo-7',
    eventNamn: 'Föreläsning: Fjärrskådning',
    ort: 'Stockholm',
    startdatum: isoDaysFromNow(-40),
    antalAnmalda: 58,
    status: 'Genomfört',
    boverAntal: 0,
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
    boverAntal: 2,
  }),
];

/* ── Kalendervyn (K9, Marcus-kvitterad form) ── */

/** Alla dag-nycklar ett event täcker (flerdagars-spann expanderas). */
function dayKeys(e: ProtoEvent): string[] {
  if (!e.startdatum) return [];
  const start = new Date(e.startdatum);
  if (Number.isNaN(start.getTime())) return [];
  const end = e.slutdatum ? new Date(e.slutdatum) : start;
  if (Number.isNaN(end.getTime())) return [e.startdatum];
  const keys: string[] = [];
  const d = new Date(start);
  while (d.getTime() <= end.getTime() && keys.length < 31) {
    keys.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return keys;
}

function eventsByDay(events: ProtoEvent[]): Map<string, ProtoEvent[]> {
  const map = new Map<string, ProtoEvent[]>();
  for (const e of events) {
    for (const k of dayKeys(e)) {
      const arr = map.get(k);
      if (arr) {
        arr.push(e);
      } else {
        map.set(k, [e]);
      }
    }
  }
  return map;
}

/**
 * Kalendervyn — RAC Calendar som a11y-MOTOR (grid-semantik, tangentbord,
 * skärmläsare) + FK:s kalender-STRUKTUR som skin (IMG_1590-serien:
 * månadsnav-kapseln, veckodagsrubriker, dag-tiles; ljus i vår identitet).
 * Kalendern ERSÄTTER period-toggeln (månadsnavet är dess tidsnavigation —
 * Marcus-kvitterad form). Event-dagar: tonad tile + prick; tryck på dag →
 * dagens kort (B-formen, låsta steg 2). sv-SE via I18nProvider (måndags-
 * start + svenska veckodagar). Veckonummer-kolumnen (FK har den) är
 * MEDVETET utelämnad i K9 — RAC saknar den nativt; öppen konvergens-fråga.
 */
function EventsCalendarPrototype({
  events,
  idagStart,
}: {
  events: ProtoEvent[];
  idagStart: number;
}) {
  const [selected, setSelected] = useState<CalendarDate | null>(null);
  const byDay = eventsByDay(events);
  const dagensEvent = selected ? (byDay.get(selected.toString()) ?? []) : [];
  const selectedPeriod: Period =
    selected && selected.compare(today(getLocalTimeZone())) < 0 ? 'past' : 'upcoming';
  const navKnapp =
    'flex size-10 items-center justify-center rounded-full bg-bg shadow-sm text-text-secondary';
  return (
    <I18nProvider locale="sv-SE">
      <div className="flex flex-col gap-4">
        <Calendar
          aria-label="Eventkalender"
          value={selected}
          onChange={setSelected}
          className="flex flex-col gap-3"
        >
          <header className="flex items-center justify-between rounded-full bg-bg-muted p-1">
            <AriaButton slot="previous" className={navKnapp}>
              <ChevronLeft aria-hidden="true" size={20} />
            </AriaButton>
            <Heading className="font-semibold text-body capitalize" />
            <AriaButton slot="next" className={navKnapp}>
              <ChevronRight aria-hidden="true" size={20} />
            </AriaButton>
          </header>
          <CalendarGrid weekdayStyle="short" className="w-full border-separate border-spacing-1">
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="pb-1 font-medium text-caption text-text-secondary">
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody>
              {(date) => {
                const harEvent = byDay.has(date.toString());
                return (
                  <CalendarCell
                    date={date}
                    className={({ isSelected, isOutsideMonth }) =>
                      [
                        'relative flex h-11 items-center justify-center rounded-lg text-small tabular-nums',
                        isOutsideMonth ? 'invisible' : '',
                        isSelected
                          ? 'bg-primary font-semibold text-text'
                          : harEvent
                            ? 'bg-primary-tint font-semibold text-text'
                            : 'bg-bg-muted text-text-secondary',
                      ].join(' ')
                    }
                  >
                    {({ formattedDate }) => (
                      <>
                        {formattedDate}
                        {harEvent ? (
                          <span
                            aria-hidden="true"
                            className="absolute bottom-1.5 size-1 rounded-full bg-text"
                          />
                        ) : null}
                      </>
                    )}
                  </CalendarCell>
                );
              }}
            </CalendarGridBody>
          </CalendarGrid>
        </Calendar>
        {selected == null ? (
          <p className="py-4 text-center text-small text-text-muted">
            Tryck på en dag för att se dess event — dagar med prick har event.
          </p>
        ) : dagensEvent.length === 0 ? (
          <p className="py-4 text-center text-small text-text-muted">Inga event denna dag.</p>
        ) : (
          <ul aria-label="Valda dagens event" className="flex flex-col gap-3">
            {dagensEvent.map((e) => (
              <VariantBCard key={e.id} e={e} period={selectedPeriod} idagStart={idagStart} />
            ))}
          </ul>
        )}
      </div>
    </I18nProvider>
  );
}

/* ── Prototypen ── */

export function EventsListPrototype() {
  const dataSource = useDataSource();
  // Divergens-axeln: 'B' = Hem-kortets grammatik; allt annat proto-läge = 'A'.
  const [variantParam] = useQueryState('variant');
  const activeVariant: 'A' | 'B' = variantParam === 'B' ? 'B' : 'A';
  const [period, setPeriod] = useQueryState(
    'period',
    parseAsStringEnum(PERIOD_VALUES).withDefault('upcoming').withOptions({ history: 'push' }),
  );
  // Dagsstarten för dagar-kvar-pillen (variant B) — samma referens som filtret.
  const idagNow = new Date();
  idagNow.setHours(0, 0, 0, 0);
  const idagStart = idagNow.getTime();
  // K2: demo-data är DEFAULT i konvergensen (Marcus itererar på den
  // representativa bilden); verklig staging-data är opt-in via ?data=verklig.
  const [dataMode] = useQueryState('data');
  const useDemo = dataMode !== 'verklig';
  // K9: vy-läget — lista (default) eller kalender (?vy=kalender).
  const [vy, setVy] = useQueryState('vy');
  const kalenderLage = vy === 'kalender';

  // [PROTOTYPE-hack] K2: prototypen visar MÅLET header-fritt (grund-arvet —
  // Hem/Mer-per-vy-mekanismen task-4.2). Skarpa vyn får det via
  // `staticData.hideShellHeader` i list-skivan; att muta route-staticData går
  // inte per sökparameter, därför DOM-döljning här — kastas med prototypen.
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    (header as HTMLElement).style.display = 'none';
    return () => {
      (header as HTMLElement).style.removeProperty('display');
    };
  }, []);

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

  // K2: Lugnt laddläge-arvet (task-8-mönstret) — skeleton i slutgeometri i
  // stället för "Laddar…"-text (ORDLISTA: Undvik); syns endast i
  // verklig-data-läget (demo är synkron).
  const skeletonBody = (
    <div aria-busy="true" className="flex flex-col gap-2">
      <span className="sr-only">Laddar event…</span>
      <Skeleton variant="text" className="w-28 text-small" />
      <div className="flex flex-col gap-3">
        <Skeleton variant="listRow" className="h-28 rounded-2xl" />
        <Skeleton variant="listRow" className="h-28 rounded-2xl" />
        <Skeleton variant="listRow" className="h-28 rounded-2xl" />
      </div>
    </div>
  );

  // K10 (Marcus-omstyrning av K9-knappen): vy-växlaren är en kompakt
  // IKON-TOGGLE i samma kapsel-grammatik som period-toggeln, placerad ÖVER
  // den, förvald på lista. Samma fasta position i båda lägena → sömlös
  // växling (inget hoppar). Ikonerna bär synligt; aria-label bär semantiken.
  const vyKnapp = (aktiv: boolean) =>
    aktiv
      ? 'flex items-center justify-center rounded-full bg-bg px-3.5 py-2 text-text shadow-sm'
      : 'flex items-center justify-center rounded-full px-3.5 py-2 text-text-secondary';
  const vyRad = (
    <div className="flex justify-end">
      <fieldset className="inline-flex rounded-full bg-bg-muted p-1">
        <legend className="sr-only">Visningsläge</legend>
        <button
          type="button"
          aria-pressed={!kalenderLage}
          aria-label="Listvy"
          onClick={() => setVy(null)}
          className={vyKnapp(!kalenderLage)}
        >
          <List aria-hidden="true" size={18} />
        </button>
        <button
          type="button"
          aria-pressed={kalenderLage}
          aria-label="Kalendervy"
          onClick={() => setVy('kalender')}
          className={vyKnapp(kalenderLage)}
        >
          <CalendarDays aria-hidden="true" size={18} />
        </button>
      </fieldset>
    </div>
  );

  const body = (() => {
    if (!useDemo && isPending) return skeletonBody;
    if (!useDemo && isError) {
      return (
        <MessageBox intent="error" title="Kunde inte hämta event">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      );
    }
    if (kalenderLage) {
      // Kalendern äger tiden: HELA källan (ofiltrerad av period).
      return <EventsCalendarPrototype events={source} idagStart={idagStart} />;
    }
    return (
      <>
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
              {group.events.map((e) =>
                activeVariant === 'B' ? (
                  <VariantBCard key={e.id} e={e} period={period} idagStart={idagStart} />
                ) : (
                  <VariantACard key={e.id} e={e} />
                ),
              )}
            </ul>
          </section>
        ))}
      </>
    );
  })();

  // K2: egen sektion i Mer-formens grund-arv — synlig h1 30/600
  // (rubrikpolicyn S64), Mer-rytmens topp-luft, INGEN egen sidopadding
  // (skalets main bär 16 px — dubbelkants-fyndet M6).
  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <h1 className="font-semibold text-3xl">Event</h1>
      {/* K10: vy-toggeln ÖVER period-toggeln, fast position i båda lägena;
          i kalenderläget ERSÄTTER månadsnavet period-toggeln. */}
      {vyRad}
      {kalenderLage ? null : toggle}
      {body}
    </section>
  );
}

/**
 * [PROTOTYPE] Konvergens-identiteten — två axlar (Marcus-modellen, skillens
 * tvåfas-form):
 * - VARIANT (divergens-axeln): strukturellt olika alternativ. A = grillade
 *   strukturen/FK-raden (S72 Del 2) · B = Hem-kortets grammatik
 *   (Marcus-beslutad divergens i konvergensen). Fler föds endast på beslut.
 * - STEG (konvergens-axeln): Marcus-låsta förfiningar av EN variant. Steg
 *   räknas upp NÄR MARCUS LÅSER en ändring — då fryses föregående steg som
 *   växlingsbar snapshot (`?steg=N`) för A/B-jämförelse i browsern, och
 *   skärmdump + [PROTOTYPE]-commitens SHA landar i bilagan
 *   (återupplivningsvägen — git bär alla äldre steg; växlaren håller bara
 *   senaste jämförelseparet).
 * Bygg-commits (K1–K4) är INTE steg — designen flyttar sig bara på
 * Marcus-beslut.
 */
const PROTO_VARIANTS = {
  A: { steg: 1, stegLabel: 'grillade baslinjen · FK-raden' },
  B: { steg: 2, stegLabel: 'slot-modellen (låst 2026-07-19)' },
} as const;

/**
 * [PROTOTYPE] Flytande variant-växlare (skillens steg 4) — DEV-only via
 * routens grind; visuellt skild från designen som utvärderas (mörk panel).
 * K3-omgjord efter Marcus-feedback ("oklar och otydlig"): klartext-etiketter
 * i chip-form — aktivt val är FYLLT vitt chip, inaktivt är kantat och
 * klickbart; data-valet syns bara i prototyp-läget. K4: identitets-raden
 * (variant + steg) alltid synlig i prototyp-läget. K5: variant-chips A/B
 * (divergens-beslutet).
 */
export function EventsPrototypeSwitcher() {
  const [variant, setVariant] = useQueryState('variant');
  const [dataMode, setDataMode] = useQueryState('data');
  const activeVariant: 'A' | 'B' | null =
    variant === 'B' ? 'B' : variant === 'A' || variant === 'K' ? 'A' : null; // 'K' = legacy-URL:en
  const isProto = activeVariant != null;
  const chip = (active: boolean) =>
    active
      ? 'rounded-full bg-bg px-3 py-1.5 font-semibold text-small text-text'
      : 'rounded-full border border-border-strong px-3 py-1.5 text-small text-text-inverse';
  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex w-max max-w-[92vw] -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-text px-4 py-3 text-text-inverse shadow-lg">
      <span className="font-mono text-caption tracking-wide">PROTOTYP-VÄXLAREN · dev-verktyg</span>
      {activeVariant && (
        <span className="font-semibold text-small">
          Variant {activeVariant} · Steg {PROTO_VARIANTS[activeVariant].steg} —{' '}
          {PROTO_VARIANTS[activeVariant].stegLabel}
        </span>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setVariant(null)}
          aria-pressed={!isProto}
          className={chip(!isProto)}
        >
          Skarpa vyn
        </button>
        <button
          type="button"
          onClick={() => setVariant('A')}
          aria-pressed={activeVariant === 'A'}
          className={chip(activeVariant === 'A')}
        >
          Variant A
        </button>
        <button
          type="button"
          onClick={() => setVariant('B')}
          aria-pressed={activeVariant === 'B'}
          className={chip(activeVariant === 'B')}
        >
          Variant B
        </button>
      </div>
      {isProto && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setDataMode(null)}
            aria-pressed={dataMode !== 'verklig'}
            className={chip(dataMode !== 'verklig')}
          >
            Demo-data
          </button>
          <button
            type="button"
            onClick={() => setDataMode('verklig')}
            aria-pressed={dataMode === 'verklig'}
            className={chip(dataMode === 'verklig')}
          >
            Verklig data
          </button>
        </div>
      )}
    </div>
  );
}
