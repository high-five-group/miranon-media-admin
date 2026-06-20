import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';

type StatusFilter = 'upcoming' | 'past' | 'all';
type SortKey = 'date' | 'name' | 'capacity';

const STATUS_VALUES: StatusFilter[] = ['upcoming', 'past', 'all'];
const SORT_VALUES: SortKey[] = ['date', 'name', 'capacity'];

const STATUS_LABEL: Record<StatusFilter, string> = {
  upcoming: 'Kommande',
  past: 'Tidigare',
  all: 'Alla',
};
const SORT_LABEL: Record<SortKey, string> = {
  date: 'Datum',
  name: 'Namn',
  capacity: 'Beläggning',
};

/** Visat eventnamn ur de fält Airtable kan leverera — aldrig krasch/tomt. */
function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/**
 * Beläggning som TEXT (färg får ALDRIG vara ensam bärare —
 * ACCESSIBILITY-CHECKLIST §1). Null-säker: saknad `maxPlatser` → ingen
 * division, ingen "NaN", explicit "platser ej satt".
 */
function belaggningText(e: Event): string {
  if (e.maxPlatser == null) return `${e.antalAnmalda} anmälda (platser ej satt)`;
  return `${e.antalAnmalda} av ${e.maxPlatser} platser`;
}

/** Fullt = inga platser kvar. `platserKvar` null (okänt tak) → ej "fullt". */
function isFull(e: Event): boolean {
  return e.platserKvar != null && e.platserKvar <= 0;
}

/** Beläggnings-procent (andel) som text, eller null när taket saknas. */
function percentText(e: Event): string | null {
  if (e.anmaldBelaggning == null) return null;
  return `${Math.round(e.anmaldBelaggning * 100)} %`;
}

/** Tid-värde för datum-sort; null startdatum → Infinity (sist oavsett riktning). */
function dateValue(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/**
 * Klient-side filter + sort (Fas 6b L1). `fetchEvents()` levererar hela listan;
 * status/sort härleds här tills get-events tar params (post-Fas E).
 *
 * STATUS-FILTER (UX-val, flaggat): `upcoming`/`past` härleds ur `startdatum` vs
 * idag — INTE ur `status`-enumet (Planerat/Genomfört/… är planeringstillstånd,
 * inte temporalt). Event utan startdatum räknas som `upcoming` (ännu ej daterat,
 * inte förbi).
 *
 * SORT (entydig per B′-beslut):
 * - `date`: startdatum. Riktning följer filtret (UX-val): `past` → senast först
 *   (fallande), annars närmast först (stigande). null-datum sist via dateValue.
 * - `name`: visat namn, A–Ö (locale `sv`).
 * - `capacity`: `anmaldBelaggning` (ANDEL), FALLANDE (fullast överst = mest
 *   handlingskrävande); null-beläggning SIST (faller aldrig till toppen) — samma
 *   null-sist-disciplin som 6a cursor-historik.
 */
function filterAndSort(events: Event[], status: StatusFilter, sort: SortKey): Event[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStart = now.getTime();

  const filtered = events.filter((e) => {
    if (status === 'all') return true;
    const isPast = dateValue(e) < todayStart; // Infinity (null) → aldrig past
    return status === 'past' ? isPast : !isPast;
  });

  const sorted = [...filtered];
  if (sort === 'name') {
    sorted.sort((a, b) => eventName(a).localeCompare(eventName(b), 'sv'));
  } else if (sort === 'capacity') {
    sorted.sort((a, b) => {
      const av = a.anmaldBelaggning;
      const bv = b.anmaldBelaggning;
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // null sist
      if (bv == null) return -1;
      return bv - av; // fallande
    });
  } else {
    const dir = status === 'past' ? -1 : 1; // past → fallande
    sorted.sort((a, b) => dir * (dateValue(a) - dateValue(b)));
  }
  return sorted;
}

/** Läsbar beskrivning av aktiv ordning — för aria-live + Gunilla-begriplighet. */
function sortDescription(status: StatusFilter, sort: SortKey): string {
  if (sort === 'name') return 'sorterat efter namn, A–Ö';
  if (sort === 'capacity') return 'sorterat efter beläggning, fullast först';
  return status === 'past'
    ? 'sorterat efter datum, senast först'
    : 'sorterat efter datum, närmast först';
}

/**
 * Event-lista (Fas 6b L1) — filtrerbar + sorterbar vy över Eventplanering.
 *
 * Datakällan nås via router-context (`useDataSource`, ADR-055) och är LIVE
 * (`fetchEvents` → get-events). URL-state: `?status` + `?sort` (nuqs, history
 * push) per URL-STATE-SPEC. Logiken speglar `PersonsList` (6a-certifierad a11y).
 *
 * A11y (vy-ribba 11/10/10, Tillgänglighet 11):
 * - Status- och sort-kontroller är React Aria `Select` (riktiga kontroller,
 *   tangentbord + type-ahead; aktivt val exponeras av Select-semantiken).
 * - Omsortering/omfiltrering BEKRÄFTAS via `aria-live`-region (PersonsList-
 *   announcern) — "Visar kommande event, sorterat efter …, N event."
 * - Beläggning bärs av TEXT (aldrig enbart färg); "Fullt" + ev. procent i text.
 * - Loading via `role=status`; rad-namn är tangentbordsnåbara länkar till
 *   /event/$eventId (info-vyn).
 */
export function EventsList() {
  const dataSource = useDataSource();
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringEnum(STATUS_VALUES).withDefault('upcoming').withOptions({ history: 'push' }),
  );
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringEnum(SORT_VALUES).withDefault('date').withOptions({ history: 'push' }),
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });

  const events = useMemo(
    () => (data ? filterAndSort(data, status, sort) : []),
    [data, status, sort],
  );

  // A11y: bekräfta omfiltrering/omsortering. Hoppa initial mount (ingen annons
  // utan användar-handling) — samma "skip first" som PersonsList.
  const [announcement, setAnnouncement] = useState('');
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (isPending) return;
    setAnnouncement(
      `Visar ${STATUS_LABEL[status].toLowerCase()} event, ${sortDescription(status, sort)}. ${
        events.length
      } ${events.length === 1 ? 'event' : 'event'}.`,
    );
  }, [status, sort, events.length, isPending]);

  const controls = (
    <div className="flex flex-wrap gap-3">
      <Select
        label="Visa"
        selectedKey={status}
        onSelectionChange={(key) => setStatus(key as StatusFilter)}
        className="w-auto min-w-40"
      >
        {STATUS_VALUES.map((v) => (
          <SelectItem key={v} id={v}>
            {STATUS_LABEL[v]}
          </SelectItem>
        ))}
      </Select>
      <Select
        label="Sortera efter"
        selectedKey={sort}
        onSelectionChange={(key) => setSort(key as SortKey)}
        className="w-auto min-w-40"
      >
        {SORT_VALUES.map((v) => (
          <SelectItem key={v} id={v}>
            {SORT_LABEL[v]}
          </SelectItem>
        ))}
      </Select>
    </div>
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        {controls}
        <p role="status" aria-live="polite">
          Laddar event…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        {controls}
        <MessageBox intent="error" title="Kunde inte hämta event">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </div>
    );
  }

  const total = events.length;
  const showPercent = sort === 'capacity';

  return (
    <div className="flex flex-col gap-4">
      {controls}

      {/* Dold aria-live-region som bekräftar omfiltrering/omsortering. */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <p role="status" aria-live="polite" className="text-small text-text-muted">
        {total === 0
          ? `Inga ${STATUS_LABEL[status].toLowerCase()} event.`
          : `${total} ${total === 1 ? 'event' : 'event'} (${STATUS_LABEL[status].toLowerCase()})`}
      </p>

      {total > 0 && (
        <ul aria-label="Event" className="flex flex-col gap-3">
          {events.map((e) => {
            const percent = percentText(e);
            const full = isFull(e);
            return (
              <li key={e.id} className="flex flex-col gap-1 border-b pb-3">
                <Link
                  to="/event/$eventId"
                  params={{ eventId: e.id }}
                  className="font-medium underline"
                >
                  {eventName(e)}
                </Link>
                <span className="text-small text-text-muted">
                  {[e.startdatum, e.ort, e.status].filter(Boolean).join(' · ')}
                </span>
                <span className="text-small">
                  {/* Beläggning bärs av text; "Fullt" + (vid capacity-sort) procent
                      gör ordningen begriplig (Gunilla-principen). */}
                  {belaggningText(e)}
                  {full ? ' · Fullt' : ''}
                  {showPercent && percent ? ` · ${percent} fullt` : ''}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
