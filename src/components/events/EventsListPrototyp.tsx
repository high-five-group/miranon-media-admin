/**
 * [PROTOTYPE] S83 pass 1 — TASK-17.7. KASTBAR KOD (throwaway-kontraktet;
 * prototype-skillen UI-grenen, konvergens-fasen T78 b / ADR-074).
 *
 * FRÅGAN (nedskriven, klausul i): Hur ska filtervyn på event-listan se ut
 * och bete sig — ingången i period-toggel-raden (filterikon/expander-pil),
 * den expanderade filtervyn (dimensioner + interaktionsform) och
 * Skriv ut-knappen?
 *
 * Konvergens från EXAKT KOPIA: steg 1 är en trogen kopia av EventsList
 * (skarpa vyn) — iterationer därifrån Marcus-låses per steg. URL:
 * /event?variant=k (utan param = skarpa vyn). `?data=verklig` växlar från
 * demo-datan till riktig hämtning (staging by construction, ADR-061).
 * Read-only: inga mutationer, ingen write-allowlist-registrering.
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CalendarDays, CalendarPlus, Filter, List, Printer } from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';
import { dateValue, EventCard, type Period } from './EventCard';
import { EventsCalendar } from './EventsCalendar';

/** Växlarens variant-deklaration (en variant = kolv-ikonen i railen). */
export const PROTO_VARIANTS_17_7: PrototypeVariant[] = [
  { key: 'k', label: 'Filtervyn', steg: 2, stegLabel: 'Steg 2 — LÅST: dropdowns (Marcus 2026-07-24)' },
];

// ---------------------------------------------------------------------------
// Demo-data (default; `?data=verklig` växlar till riktig hämtning). Bredden
// är poängen: flera orter/typer/statusar så filterdimensionerna går att
// pröva mot något. Datum RELATIVA mot idag så demon överlever dygnsgränser.
// ---------------------------------------------------------------------------

function omDagar(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function demoEvent(e: Partial<Event> & { id: string; eventNamn: string }): Event {
  return {
    eventlabel: null,
    typ: null,
    ort: null,
    startdatum: null,
    slutdatum: null,
    tidKvarTillEvent: null,
    maxPlatser: 12,
    antalAnmalda: 6,
    platserKvar: 6,
    anmaldBelaggning: 0.5,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    borOverAntal: 0,
    ...e,
  };
}

const DEMO_EVENTS: Event[] = [
  demoEvent({
    id: 'demo-1',
    eventNamn: 'Medialkurs steg 1',
    typ: 'Kurs',
    ort: 'Skövde',
    startdatum: omDagar(9),
    antalAnmalda: 11,
    platserKvar: 1,
    borOverAntal: 3,
  }),
  demoEvent({
    id: 'demo-2',
    eventNamn: 'Healingkväll',
    typ: 'Kväll',
    ort: 'Göteborg',
    startdatum: omDagar(16),
    maxPlatser: 30,
    antalAnmalda: 30,
    platserKvar: 0,
  }),
  demoEvent({
    id: 'demo-3',
    eventNamn: 'Retreat — inre resa',
    typ: 'Retreat',
    ort: 'Ulvåker',
    startdatum: omDagar(34),
    maxPlatser: 16,
    antalAnmalda: 9,
    platserKvar: 7,
    borOverAntal: 9,
  }),
  demoEvent({
    id: 'demo-4',
    eventNamn: 'Medialkurs steg 2',
    typ: 'Kurs',
    ort: 'Skövde',
    startdatum: omDagar(41),
    antalAnmalda: 4,
    platserKvar: 8,
    status: 'Flyttat',
  }),
  demoEvent({
    id: 'demo-5',
    eventNamn: 'Storseans',
    typ: 'Kväll',
    ort: 'Stockholm',
    startdatum: omDagar(55),
    maxPlatser: 80,
    antalAnmalda: 12,
    platserKvar: 68,
    status: 'Inställt',
  }),
  demoEvent({
    id: 'demo-6',
    eventNamn: 'Mediumkväll med Roger',
    typ: 'Kväll',
    ort: 'Göteborg',
    startdatum: omDagar(70),
    maxPlatser: 40,
    antalAnmalda: 22,
    platserKvar: 18,
  }),
  demoEvent({
    id: 'demo-7',
    eventNamn: 'Höstretreat',
    typ: 'Retreat',
    ort: 'Ulvåker',
    startdatum: omDagar(96),
    maxPlatser: 16,
    antalAnmalda: 2,
    platserKvar: 14,
    borOverAntal: 2,
  }),
  demoEvent({
    id: 'demo-8',
    eventNamn: 'Eventet utan datum',
    typ: 'Kurs',
    ort: null,
    startdatum: null,
  }),
  demoEvent({
    id: 'demo-9',
    eventNamn: 'Medialkurs steg 1',
    typ: 'Kurs',
    ort: 'Skövde',
    startdatum: omDagar(-12),
    antalAnmalda: 12,
    platserKvar: 0,
    status: 'Genomfört',
  }),
  demoEvent({
    id: 'demo-10',
    eventNamn: 'Vårens healingkväll',
    typ: 'Kväll',
    ort: 'Göteborg',
    startdatum: omDagar(-48),
    maxPlatser: 30,
    antalAnmalda: 24,
    platserKvar: 6,
    status: 'Genomfört',
  }),
  demoEvent({
    id: 'demo-11',
    eventNamn: 'Vinterretreat',
    typ: 'Retreat',
    ort: 'Ulvåker',
    startdatum: omDagar(-190),
    maxPlatser: 16,
    antalAnmalda: 16,
    platserKvar: 0,
    status: 'Genomfört',
    borOverAntal: 16,
  }),
  demoEvent({
    id: 'demo-12',
    eventNamn: 'Föreläsning: mediala barn',
    typ: 'Föreläsning',
    ort: 'Stockholm',
    startdatum: omDagar(-260),
    maxPlatser: 60,
    antalAnmalda: 41,
    platserKvar: 19,
    status: 'Genomfört',
  }),
];

// ---------------------------------------------------------------------------
// Nedan: EXAKT KOPIA av EventsList (steg 1-baslinjen) — enda avvikelsen är
// demo/verklig-datavägen ovanför renderingen. Iterationer görs HÄR.
// ---------------------------------------------------------------------------

const PERIOD_VALUES: Period[] = ['upcoming', 'past'];
const PERIOD_LABEL: Record<Period, string> = {
  upcoming: 'Kommande',
  past: 'Tidigare',
};

type Vy = 'lista' | 'kalender';
const VY_VALUES: Vy[] = ['lista', 'kalender'];

function filterByPeriod(events: Event[], period: Period, idagStart: number): Event[] {
  const filtered = events.filter((e) => {
    const isPast = dateValue(e) < idagStart;
    return period === 'past' ? isPast : !isPast;
  });
  const dir = period === 'past' ? -1 : 1;
  return [...filtered].sort((a, b) => dir * (dateValue(a) - dateValue(b)));
}

function monthLabel(e: Event): string {
  if (!e.startdatum) return 'Datum ej satt';
  const d = new Date(e.startdatum);
  if (Number.isNaN(d.getTime())) return 'Datum ej satt';
  const label = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

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

/** Filterdimensionerna (spec-fråga 1) — Event-modellens tre kategoriska fält. */
type FilterDim = 'typ' | 'ort' | 'status';
const DIM_LABEL: Record<FilterDim, string> = { typ: 'Typ', ort: 'Ort', status: 'Status' };
/** Status i basens kanoniska ordning (aldrig alfabetisk). */
const STATUS_ORDNING = ['Planerat', 'Genomfört', 'Inställt', 'Flyttat'];

const LANGDATUM_IDAG = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function EventsListPrototyp() {
  const dataSource = useDataSource();
  const [dataParam] = useQueryState('data');
  const verklig = dataParam === 'verklig';

  const [period, setPeriod] = useQueryState(
    'period',
    parseAsStringEnum(PERIOD_VALUES).withDefault('upcoming').withOptions({ history: 'push' }),
  );
  const [vy, setVy] = useQueryState(
    'vy',
    parseAsStringEnum(VY_VALUES).withDefault('lista').withOptions({ history: 'push' }),
  );
  const kalenderLage = vy === 'kalender';

  const idagStart = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  const query = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
    enabled: verklig,
  });
  const data = verklig ? query.data : DEMO_EVENTS;
  const isPending = verklig ? query.isPending : false;
  const isError = verklig ? query.isError : false;
  const error = verklig ? query.error : null;

  // -------------------------------------------------------------------------
  // FILTRET (iterationen ovanpå kopian; research-grund:
  // docs/research/filtervy-listor-monster-2026-07-24.md — disclosure-bar +
  // FK:s chip-idiom + LIVE-filtrering utan Apply). Lokalt state per
  // throwaway-regel 3 (URL-delbarhet är en spec-fråga för skivan, ej demon).
  // -------------------------------------------------------------------------
  // Iteration 2 (Marcus i browsern): chips → DROPDOWNS. Ort växer obegränsat
  // över tid — chip-raden skalar inte; Select-primitiven finns redan i appen
  // (eventsidans redigeringsrader). Ett val per dimension + "Alla" som
  // nolläge; kombination över dimensioner består.
  const [filterOppen, setFilterOppen] = useState(false);
  const [valda, setValda] = useState<Record<FilterDim, string | null>>({
    typ: null,
    ort: null,
    status: null,
  });
  const aktiva = (['typ', 'ort', 'status'] as const).filter((d) => valda[d] != null).length;

  const ALLA = '__alla';
  const sattFilter = (dim: FilterDim, nyckel: string | number | null) =>
    setValda((v) => ({
      ...v,
      [dim]: nyckel == null || String(nyckel) === ALLA ? null : String(nyckel),
    }));
  const rensaFilter = () => setValda({ typ: null, ort: null, status: null });

  // Chip-alternativen ur HELA källan (stabila chips över periodbyte);
  // typ/ort sv-alfabetiskt, status i kanonisk ordning.
  const alternativ = useMemo<Record<FilterDim, string[]>>(() => {
    const uniq = (vals: (string | null | undefined)[]) =>
      [...new Set(vals.filter((v): v is string => v != null))].sort((a, b) =>
        a.localeCompare(b, 'sv'),
      );
    const alla = data ?? [];
    const statusVarden: string[] = uniq(alla.map((e) => e.status));
    return {
      typ: uniq(alla.map((e) => e.typ)),
      ort: uniq(alla.map((e) => e.ort)),
      status: statusVarden.sort((a, b) => STATUS_ORDNING.indexOf(a) - STATUS_ORDNING.indexOf(b)),
    };
  }, [data]);

  const periodEvents = useMemo(
    () => (data ? filterByPeriod(data, period, idagStart) : []),
    [data, period, idagStart],
  );
  const events = useMemo(
    () =>
      periodEvents.filter(
        (e) =>
          (valda.typ == null || e.typ === valda.typ) &&
          (valda.ort == null || e.ort === valda.ort) &&
          (valda.status == null || e.status === valda.status),
      ),
    [periodEvents, valda],
  );
  const groups = useMemo(() => groupByMonth(events), [events]);

  /** "Typ: Kurs · Ort: Skövde" — utskriftshuvudets filterbeskrivning. */
  const aktivaBeskrivning = (['typ', 'ort', 'status'] as const)
    .filter((dim) => valda[dim] != null)
    .map((dim) => `${DIM_LABEL[dim]}: ${valda[dim]}`)
    .join(' · ');

  const [announcement, setAnnouncement] = useState('');
  const prevPeriod = useRef(period);
  useEffect(() => {
    if (isPending || prevPeriod.current === period) return;
    prevPeriod.current = period;
    setAnnouncement(`Visar ${PERIOD_LABEL[period].toLowerCase()} event. ${events.length} event.`);
  }, [period, events.length, isPending]);

  // Live-filtrering bekräftas i samma region (research: räknare + aria-live).
  const filterNyckel = JSON.stringify(valda);
  const prevFilterNyckel = useRef(filterNyckel);
  useEffect(() => {
    if (prevFilterNyckel.current === filterNyckel) return;
    prevFilterNyckel.current = filterNyckel;
    setAnnouncement(`Visar ${events.length} av ${periodEvents.length} event.`);
  }, [filterNyckel, events.length, periodEvents.length]);

  // Period-toggeln + filter-ingången i SAMMA rad (Marcus-skissen; MOJ:s
  // "Show filter"-toggle). Aktiv-indikationen på stängd knapp är
  // research-kravet ("users don't always see they can filter").
  const toggle = (
    <div className="flex items-center gap-2 print:hidden">
      <div className="min-w-0 flex-1">
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
      </div>
      <button
        type="button"
        aria-expanded={filterOppen}
        aria-controls="proto-filterpanel"
        onClick={() => setFilterOppen((o) => !o)}
        className={`relative inline-flex shrink-0 items-center justify-center rounded-full p-2.5 motion-safe:transition-colors ${
          filterOppen || aktiva > 0
            ? 'bg-text text-text-inverse'
            : 'bg-bg-muted hover:bg-bg-emphasized'
        }`}
      >
        <Filter aria-hidden="true" size={18} className="shrink-0" />
        {aktiva > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-medium text-[10px] text-text"
          >
            {aktiva}
          </span>
        ) : null}
        <span className="sr-only">
          {filterOppen ? 'Dölj filter' : 'Visa filter'}
          {aktiva > 0 ? `, ${aktiva} aktiva filterval` : ''}
        </span>
      </button>
    </div>
  );

  // Filtervyn: expanderar under raden (disclosure), chips per FK-idiomet
  // (aria-pressed-knappar i fieldset), live-räknare + Rensa + Skriv ut.
  const filterPanel = filterOppen ? (
    <div
      id="proto-filterpanel"
      className="flex flex-col gap-4 rounded-2xl bg-bg-muted p-4 print:hidden"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {(['typ', 'ort', 'status'] as const).map((dim) =>
          alternativ[dim].length > 0 ? (
            <Select
              key={dim}
              label={DIM_LABEL[dim]}
              size="sm"
              selectedKey={valda[dim] ?? ALLA}
              onSelectionChange={(k) => sattFilter(dim, k)}
            >
              <SelectItem id={ALLA}>
                {dim === 'typ' ? 'Alla typer' : dim === 'ort' ? 'Alla orter' : 'Alla statusar'}
              </SelectItem>
              {alternativ[dim].map((varde) => (
                <SelectItem key={varde} id={varde}>
                  {varde}
                </SelectItem>
              ))}
            </Select>
          ) : null,
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-border-light border-t pt-3">
        <span className="text-small text-text-secondary">
          Visar {events.length} av {periodEvents.length} event
        </span>
        <div className="flex items-center gap-2">
          {aktiva > 0 ? (
            <button
              type="button"
              onClick={rensaFilter}
              className="rounded-full px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
            >
              Rensa filter
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
          >
            <Printer aria-hidden="true" size={18} className="shrink-0" />
            Skriv ut
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Utskriftshuvudet (print-only): period + aktiva filter + antal + datum.
  // Öppet deklarerad syntes i researchen (ingen förstaparts-precedent) —
  // prövas här som förslag.
  const utskriftsHuvud = (
    <div className="hidden text-small text-text-secondary print:block">
      Event — {PERIOD_LABEL[period]}
      {aktivaBeskrivning ? ` · ${aktivaBeskrivning}` : ''} · {events.length} event · Utskrivet{' '}
      {LANGDATUM_IDAG.format(new Date())}
    </div>
  );

  const vyRad = (
    <div className="flex items-center justify-between gap-3 print:hidden">
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

  const felRuta = (
    <MessageBox intent="error" title="Kunde inte hämta event">
      {error instanceof Error ? error.message : 'Okänt fel.'}
    </MessageBox>
  );

  const body = (() => {
    if (isPending) {
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
      // Filter-tomläget skiljer sig från period-tomläget: här FINNS event,
      // men filtren matchar inga (research: tydlig återväg via Rensa).
      if (aktiva > 0 && periodEvents.length > 0) {
        return (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium text-body">Inga event matchar filtren</p>
            <button
              type="button"
              onClick={rensaFilter}
              className="rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
            >
              Rensa filter
            </button>
          </div>
        );
      }
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
      {/* [PROTOTYPE] Print-blacklisten (GOV.UK-idiomet som utility i skarpa
          bygget): app-naven göms vid utskrift; övriga kontroller bär
          print:hidden direkt. Blunt selektor — kastbar kod. */}
      <style>{'@media print { nav { display: none } }'}</style>
      {utskriftsHuvud}
      {vyRad}
      {!kalenderLage && toggle}
      {!kalenderLage && filterPanel}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {kalenderLage ? (
        isError ? (
          felRuta
        ) : (
          <EventsCalendar events={data ?? []} isPending={isPending} idagStart={idagStart} />
        )
      ) : (
        body
      )}
    </div>
  );
}
