import { CalendarDate, getLocalTimeZone, isSameDay } from '@internationalized/date';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Skeleton } from '@/components/primitives/Skeleton';
import type { Event } from '@/domain/models/Event';
import { KURSFARGER, kursfargForKurs } from '@/lib/kursfarg';
import { dateValue, EventCard, eventName, type Period } from './EventCard';

/** Alla dag-nycklar (ISO YYYY-MM-DD) ett event täcker — flerdagars-spann
    expanderas dag för dag (fre–lör-formen färgar BÅDA dagarna, K11-facit).
    Taket 31 skyddar mot korrupt slutdatum (aldrig mer än en månads spann). */
function dayKeys(e: Event): string[] {
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

/** Dag-nyckel → dagens event (spann-expanderat via dayKeys). */
function eventsByDay(events: Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>();
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

/** Summeringsradens datum: "fredag 17 juli" · spann "17–18 juli" ·
    månadskorsande "31 juli–2 augusti" (sv-SE, aldrig rå ISO — Gunilla). */
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
    ? `${dayOnly.format(start)}-${dayMonth.format(end)}`
    : `${dayMonth.format(start)}-${dayMonth.format(end)}`;
}

/** Månadsnav-knappens FK-form (vit rund knapp i kapsel-tracket). */
const NAV_KNAPP =
  'flex size-10 items-center justify-center rounded-full bg-bg shadow-sm text-text-secondary';

/**
 * EventsCalendar — kalendervyn till S72-facit (task-17.4; vy-lokal 11/10/10).
 * Facit: `tasks/sessions/bilagor/s72-event-lista-konvergens/FACIT-kalendervyn.png`
 * + `variant-B-steg3-kalendervyn-dagval.png` ("Toppen, vi låser kalendervyn
 * här", 2026-07-19).
 *
 * Motorn är React Aria Calendar (grid-semantik, roving tabindex, pil-
 * navigering, lokaliserade datum-annonseringar) med FK-skinnet (PRD beslut 7):
 * månadsnav-kapseln ERSÄTTER period-toggeln i kalenderläget (navet är
 * kalenderns tidsnavigation), veckodagsrubriker, dag-plattor. sv-SE via
 * I18nProvider (måndagsstart + svenska veckodagar/annonseringar oavsett
 * browser-locale — OmEventet-precedenten).
 *
 * Kalendern ÄGER tiden: den tar HELA event-källan ofiltrerad av ?period
 * (månadsnavet är tidsvalet). Kursfärgerna konsumeras UTESLUTANDE via
 * `kursfargForKurs`-uppslaget (task-17.3; ADR-064 — ingen namn-matchning
 * här): dag-plattor, legend-prickar och summerings-streck bär SAMMA
 * semantiska token (K12: exakt kulör-paritet). Färg är aldrig ensam bärare
 * (WCAG 1.4.1): legenden bär orden, månadssummeringen bär månadens innehåll
 * i listform (story 12 — skärmläsarens karta), dag-trycket visar korten.
 *
 * Formerna ur facitet + review-våg 1 (Marcus 2026-07-22 — S72-facitets
 * guld-platta och "Visa hela månaden"-knapp RIVNA ÖPPET, idag-markeringen
 * och likbredds-kravet tillkom; bokfört i task-17.4):
 * - Dag-plattor: solida i legendens exakta token-kulör (500-serien, vit
 *   semibold text); tomma dagar muted; utanför-månaden osynlig; kolumnerna
 *   likbreda via table-fixed (table-layout: auto lät veckodags-th:arnas
 *   textbredd dra isär gridden — review-våg 1-defekten).
 * - Vald dag: MÖRK markeringsram (--mm-text, ring-offset) — plattan
 *   behåller sin egen kulör; valet annonseras via aria-selected.
 * - Idag: FK-idiomet (fk-referens IMG_1590) — tunn cirkel runt SIFFRAN i
 *   currentColor (formburen markering, kontrasten följer plattans
 *   textfärg); skärmläsar-namnet bär redan idag-prefixet (react-aria).
 * - Månadssummeringen (agenda-under-grid, K12): fokusmånadens event som
 *   kompakta rader med vertikalt kursfärgs-streck (K14), korta kursnamn
 *   (K13; Annat-uppsamlingen bär eventnamnet) och datum · ort.
 * - Dag-tryck: dagens event som likformiga slot-kort (EventCard, B-formen);
 *   klick/Enter på den valda dagen AVMARKERAR (toggle — månaden åter);
 *   tom dag får lugn strukturerad text.
 *
 * Lugnt laddläge (ORDLISTA): gridden är datalös geometri och renderas
 * DIREKT i slutform; under pending bär summeringsytan dimensionsstabila
 * skeleton-rader (Roselli-anatomin) — plattornas färger landar utan att
 * något flyttar sig. Dag-valet är UI-state (HUR), inte URL-state (VAD) —
 * URL-STATE-SPEC-principen; vyvalet ?vy äger EventsList.
 */
export function EventsCalendar({
  events,
  isPending,
  idagStart,
}: {
  /** HELA event-källan (ofiltrerad — kalendern äger tiden). */
  events: Event[];
  /** Laddläget: summeringsytan visar skeleton-rader tills datat landat. */
  isPending: boolean;
  /** Dagsstarten (ms) — SAMMA referenspunkt som listans filter/pill. */
  idagStart: number;
}) {
  // EN "idag"-referens (NastaEventCard-disciplinen): CalendarDate härledd ur
  // samma ms-värde som periodfilter/dagar-kvar — aldrig två olika "idag".
  const idag = useMemo(() => {
    const d = new Date(idagStart);
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }, [idagStart]);

  const [selected, setSelected] = useState<CalendarDate | null>(null);
  // Fokusmånaden styr månadssummeringen (agenda-hybriden); månadsnavet
  // flyttar fokus via Calendar-motorns onFocusChange.
  const [focused, setFocused] = useState<CalendarDate>(idag);

  const byDay = useMemo(() => eventsByDay(events), [events]);
  const dagensEvent = selected ? (byDay.get(selected.toString()) ?? []) : [];
  // Vald dags tidshorisont för kortets status-slot (dagar-kvar endast framåt).
  const valdPeriod: Period = selected && selected.compare(idag) < 0 ? 'past' : 'upcoming';

  const manadPrefix = `${focused.year}-${String(focused.month).padStart(2, '0')}`;
  const manadensEvent = useMemo(
    () =>
      events
        .filter((e) => dayKeys(e).some((k) => k.startsWith(manadPrefix)))
        .sort((a, b) => dateValue(a) - dateValue(b)),
    [events, manadPrefix],
  );
  const manadNamn = new Intl.DateTimeFormat('sv-SE', { month: 'long' }).format(
    focused.toDate(getLocalTimeZone()),
  );

  // Summeringsytan under legenden: skeleton (pending) → månadsrader →
  // dagens kort (dag-läget). Ytan är den enda datadrivna kroppen.
  const summeringsYta = (() => {
    if (isPending) {
      return (
        <div role="status" aria-busy="true" className="flex flex-col gap-2">
          <span className="sr-only">Laddar event…</span>
          <Skeleton variant="text" className="w-16 text-small" />
          <div className="flex flex-col">
            {['a', 'b', 'c'].map((k) => (
              <div
                key={k}
                className="flex items-center gap-2.5 border-border-light border-b py-2.5"
              >
                <Skeleton variant="listRow" className="h-9 w-1 rounded-full" />
                <div className="flex min-w-0 grow flex-col gap-1">
                  <Skeleton variant="text" className="w-2/5 text-small" />
                  <Skeleton variant="text" className="w-3/5 text-caption" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (selected != null) {
      return (
        <div className="flex flex-col gap-3">
          {dagensEvent.length === 0 ? (
            <p className="py-4 text-center text-small text-text-muted">Inga event denna dag.</p>
          ) : (
            <ul aria-label="Valda dagens event" className="flex flex-col gap-3">
              {dagensEvent.map((e) => (
                <EventCard key={e.id} event={e} period={valdPeriod} idagStart={idagStart} />
              ))}
            </ul>
          )}
        </div>
      );
    }
    if (manadensEvent.length === 0) {
      return (
        <p className="py-4 text-center text-small text-text-muted">Inga event i {manadNamn}.</p>
      );
    }
    return (
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-small text-text-secondary capitalize">{manadNamn}</h2>
        <ul aria-label={`Event i ${manadNamn}`} className="flex flex-col">
          {manadensEvent.map((e) => {
            const farg = kursfargForKurs(e.eventNamn);
            return (
              <li key={e.id} className="relative border-border-light border-b">
                <Link
                  to="/event/$eventId"
                  params={{ eventId: e.id }}
                  className="flex items-center gap-2.5 py-2.5"
                >
                  {/* K14: vertikalt kursfärgs-streck (agenda-mönstret) —
                      samma token som plattan; prick i raden vore dubbelt. */}
                  <span
                    aria-hidden="true"
                    data-slot="kurs-streck"
                    className={`w-1 shrink-0 self-stretch rounded-full ${farg.bgClass}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-small">
                      {/* K13-copyn: korta kursnamn; Annat bär eventnamnet. */}
                      {farg.klass === 'annat' ? eventName(e) : farg.etikett}
                    </span>
                    <span className="block text-caption text-text-muted">
                      {[dateText(e), e.ort].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    );
  })();

  return (
    <I18nProvider locale="sv-SE">
      <div className="flex flex-col gap-4">
        <Calendar
          aria-label="Eventkalender"
          // KLONEN bär togglen: useControlledState fyrar onChange endast när
          // Object.is skiljer nya värdet från value-PROPEN, och grid-cellernas
          // datum-instanser är STABILA över renders — klick på redan vald dag
          // skickar samma instans och tystas utan klonen (empiriskt rött
          // 2026-07-22; källorna lästa: useControlledState.js-guarden +
          // useCalendarCell.js onPress som alltid kallar selectDate).
          value={selected && new CalendarDate(selected.year, selected.month, selected.day)}
          // Toggle-avval (review-våg 1): val av redan vald dag släpper valet
          // — ersätter den rivna "Visa hela månaden"-knappen; samma väg för
          // pekare, tangentbordets Enter och skärmläsarens virtuella klick
          // (alla går via onPress → selectDate).
          onChange={(d) => setSelected((prev) => (prev && d && isSameDay(prev, d) ? null : d))}
          focusedValue={focused}
          onFocusChange={setFocused}
          className="flex flex-col gap-3"
        >
          {/* Månadsnavet — kapseln som ERSÄTTER period-toggeln i kalender-
              läget (samma track-grammatik som toggeln: rounded-full muted). */}
          <header className="flex items-center justify-between rounded-full bg-bg-muted p-1">
            <AriaButton slot="previous" className={NAV_KNAPP}>
              <ChevronLeft aria-hidden="true" size={20} />
            </AriaButton>
            <Heading className="font-semibold text-body capitalize" />
            <AriaButton slot="next" className={NAV_KNAPP}>
              <ChevronRight aria-hidden="true" size={20} />
            </AriaButton>
          </header>
          <CalendarGrid
            weekdayStyle="short"
            className="w-full table-fixed border-separate border-spacing-1"
          >
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="pb-1 font-medium text-caption text-text-secondary">
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody>
              {(date) => {
                // K12: SOLID platta i kursens token-kulör — SAMMA uppslag
                // som legenden (exakt paritet); första eventet bär dagen.
                const dagens = byDay.get(date.toString());
                const farg =
                  dagens && dagens.length > 0 ? kursfargForKurs(dagens[0].eventNamn) : null;
                const arIdag = isSameDay(date, idag);
                return (
                  <CalendarCell
                    date={date}
                    className={({ isSelected, isOutsideMonth }) =>
                      [
                        'relative flex h-11 items-center justify-center rounded-lg text-small tabular-nums',
                        isOutsideMonth ? 'invisible' : '',
                        farg
                          ? `${farg.bgClass} font-semibold text-text-inverse`
                          : 'bg-bg-muted text-text-secondary',
                        // Vald dag: ENDAST mörk markeringsram — plattan
                        // behåller sin kulör (guld-plattan riven öppet,
                        // review-våg 1; ramen + aria-selected bär valet).
                        isSelected ? 'font-semibold ring-2 ring-text ring-offset-1' : '',
                      ].join(' ')
                    }
                  >
                    {({ formattedDate }) =>
                      arIdag ? (
                        // FK-idiomet (IMG_1590): idag = tunn cirkel runt
                        // SIFFRAN i currentColor — formburen markering med
                        // kontrast på både färgad och tom platta.
                        <span className="grid size-7 place-items-center rounded-full ring-1 ring-current">
                          {formattedDate}
                        </span>
                      ) : (
                        formattedDate
                      )
                    }
                  </CalendarCell>
                );
              }}
            </CalendarGridBody>
          </CalendarGrid>
        </Calendar>

        {/* K11: legenden — orden bär det färgen förstärker; prickarna bär
            EXAKT samma token som plattorna (KURSFARGER i legendordning). */}
        <ul aria-label="Kursfärger" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {KURSFARGER.map((f) => (
            <li
              key={f.klass}
              className="flex items-center gap-1.5 text-caption text-text-secondary"
            >
              <span
                aria-hidden="true"
                data-slot="legend-prick"
                className={`size-2 rounded-full ${f.bgClass}`}
              />
              {f.etikett}
            </li>
          ))}
        </ul>

        {summeringsYta}
      </div>
    </I18nProvider>
  );
}
