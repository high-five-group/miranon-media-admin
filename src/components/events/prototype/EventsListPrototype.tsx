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
import {
  BedDouble,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  List,
  MapPin,
} from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { useState } from 'react';
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
import type { PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
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
        {/* search-genomslaget: variant/data följer med in i detalj-prototypen
            (familje-flödet) — ren URL-plumbing, ytan oförändrad (facit intakt). */}
        <Link
          to="/event/$eventId"
          params={{ eventId: e.id }}
          search={(prev) => prev}
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
        {/* search-genomslaget: variant/data följer med in i detalj-prototypen
            (familje-flödet) — ren URL-plumbing, ytan oförändrad (facit intakt). */}
        <Link
          to="/event/$eventId"
          params={{ eventId: e.id }}
          search={(prev) => prev}
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
/** eventKey: basens `EventKey` (formel `"Event-" & {Event-nr}`, data-model
    rad 267) FINNS i basen men INTE i get-event-shapen — demo-fält här;
    skarpa kravet = EF-/modell-utökning (PRD-post, ingen bas-ändring).
    Verklig data saknar fältet → identitets-pillen döljs. */
/** K16-beläggningsfälten (S73, Marcus-modellen — FINNS i basen men EJ i
    get-event-shapen; PRD-krav = EF-/modell-utökning med per-källa-
    uppdelningen): reserverade = basens `Extra platser` ("Reserverade av
    Roger och Lotta") · manuelltTillagda = basens `Manuella platser`
    ("Anmälningar som kommer in utanför formuläret") · medfoljande =
    antal +1-anmälningar (`Källa`="+1" / `Medföljande till`-länken,
    CompanionModal-mekanismen). `antalAnmalda` läses i prototypen som
    VIA FORMULÄR-räkningen (basens Källa TOM). Verklig data saknar
    fälten → raderna döljs. */
/** K22: vantelista = antal väntande FÖR EVENTET. OBS bas-gapet (verifierat
    data-model §Väntelista): tabellen är idag INTE per-event-kopplad —
    `Event`-fältet bär brand-värdet ("Psionautics", EF-hårdkodat), ingen
    EventKey/Event-länk. PRD-krav = additiv event-koppling på Väntelista
    (ADR-063-klassen) + shape-/EF-utökning. Väntande UPPTAR inga platser
    (rad utan prick, aldrig segment i mätaren). */
export type ProtoEvent = Event & {
  boverAntal?: number;
  eventKey?: string;
  reserverade?: number;
  manuelltTillagda?: number;
  medfoljande?: number;
  vantelista?: number;
};

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

/** Kursernas verkliga rytm (Marcus): utbildningarna går fre–lör. */
function freLorOmVeckor(veckor: number): { start: string; end: string } {
  const d = new Date();
  const tillFredag = (5 - d.getDay() + 7) % 7 || 7; // nästa fredag, aldrig idag
  d.setDate(d.getDate() + tillFredag + veckor * 7);
  const start = d.toISOString().slice(0, 10);
  const lordag = new Date(d);
  lordag.setDate(lordag.getDate() + 1);
  return { start, end: lordag.toISOString().slice(0, 10) };
}

// Exporterad: familje-substratets gemensamma demo-data — detalj-prototypen
// (EventDetailPrototype) slår upp samma event per id (lista→detalj-flödet).
export const DEMO_EVENTS: ProtoEvent[] = [
  demoEvent({
    id: 'demo-1',
    eventKey: 'Event-21',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    ...(() => {
      const v = freLorOmVeckor(1);
      return { startdatum: v.start, slutdatum: v.end };
    })(),
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 8 / 12,
    status: 'Planerat',
    boverAntal: 3,
    // K16: kompositions-demo — 8 formulär + 1 reserverad + 1 manuell + 1 medföljande = 11 av 12.
    reserverade: 1,
    manuelltTillagda: 1,
    medfoljande: 1,
    vantelista: 0,
    // K27: betalnings-demo — koherent med DEMO_BETALNINGAR (detalj-protot):
    // 3 saknar avgift (5 av 8 mottagna), 6 saknar slutbetalning (2 mottagna).
    antalAnmalningsavgifter: 5,
    antalSlutbetalningar: 2,
    antalSlutbetalningFelande: 6,
  }),
  demoEvent({
    id: 'demo-2',
    eventKey: 'Event-23',
    eventNamn: 'Fjärrskådning',
    typ: 'Utbildning',
    ort: 'Stockholm',
    ...(() => {
      const v = freLorOmVeckor(3);
      return { startdatum: v.start, slutdatum: v.end };
    })(),
    maxPlatser: 10,
    antalAnmalda: 10,
    platserKvar: 0,
    anmaldBelaggning: 1,
    status: 'Planerat',
    boverAntal: 5,
    // K22: fullbokat-demot — väntelistan är alternativet när taket är nått.
    vantelista: 3,
  }),
  demoEvent({
    id: 'demo-3',
    eventKey: 'Event-24',
    eventNamn: 'Resor i medvetandet 2',
    typ: 'Utbildning',
    ort: 'Skövde',
    ...(() => {
      const v = freLorOmVeckor(6);
      return { startdatum: v.start, slutdatum: v.end };
    })(),
    maxPlatser: 12,
    antalAnmalda: 3,
    platserKvar: 9,
    anmaldBelaggning: 3 / 12,
    status: 'Inställt',
    boverAntal: 1,
  }),
  demoEvent({
    id: 'demo-9',
    eventKey: 'Event-26',
    eventNamn: 'Resor i medvetandet 3',
    typ: 'Utbildning',
    ort: 'Skövde',
    ...(() => {
      const v = freLorOmVeckor(8);
      return { startdatum: v.start, slutdatum: v.end };
    })(),
    maxPlatser: 12,
    antalAnmalda: 5,
    platserKvar: 7,
    anmaldBelaggning: 5 / 12,
    status: 'Planerat',
    boverAntal: 4,
  }),
  demoEvent({
    id: 'demo-4',
    eventKey: 'Event-27',
    eventNamn: 'Medveten kontakt',
    typ: 'Föreläsning',
    ort: 'Göteborg',
    startdatum: isoDaysFromNow(70),
    antalAnmalda: 34,
    status: 'Planerat',
    boverAntal: 0,
  }),
  demoEvent({
    id: 'demo-5',
    eventKey: 'Event-17',
    eventNamn: 'Psionautics',
    typ: 'Utbildning',
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
    eventKey: 'Event-14',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    ...(() => {
      const v = freLorOmVeckor(-1);
      return { startdatum: v.start, slutdatum: v.end };
    })(),
    maxPlatser: 12,
    antalAnmalda: 12,
    platserKvar: 0,
    anmaldBelaggning: 1,
    status: 'Genomfört',
    boverAntal: 4,
  }),
  demoEvent({
    id: 'demo-7',
    eventKey: 'Event-9',
    eventNamn: 'Fjärrskådning',
    typ: 'Föreläsning',
    ort: 'Stockholm',
    startdatum: isoDaysFromNow(-40),
    antalAnmalda: 58,
    status: 'Genomfört',
    boverAntal: 0,
  }),
  demoEvent({
    id: 'demo-8',
    eventKey: 'Event-12',
    eventNamn: 'Resor i medvetandet 2',
    typ: 'Utbildning',
    ort: 'Skövde',
    ...(() => {
      const v = freLorOmVeckor(-10);
      return { startdatum: v.start, slutdatum: v.end };
    })(),
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
 * Kursfärgerna (K11; K12 solid per Marcus: "för svaga … matchar inte
 * legenden"). Fyra kurser + neutral "Övrigt" — inom branschriktvärdet
 * ≤5–7 kalenderfärger. SAMMA 500-kulör bär tile OCH legend-punkt (exakt
 * matchning); vit text på 500-fyllnaden håller kontrasten (alla fem 500:or
 * är mörka). FK-precedentet för solid fyllnad: IMG_1596:s bekräftade dagar.
 * Färg är ALDRIG ensam bärare: legenden bär orden, dag-trycket visar korten.
 *
 * [PROTOTYPE]-not: NAMN-matchningen är demo-mekanik — skarpa skivan mappar
 * från taxonomin (ADR-064: kurs × modalitet), aldrig regex på visningsnamn
 * (fälla 35-klassen: nakna/tvetydiga kursnamn).
 */
type KursTyp = 'fjarrskadning' | 'rim1' | 'rim2' | 'rim3' | 'ovrigt';
const KURS_INFO: Record<KursTyp, { label: string; farg: string }> = {
  fjarrskadning: { label: 'Fjärrskådning', farg: 'bg-(--p-blue-500)' },
  rim1: { label: 'RIM 1', farg: 'bg-(--p-green-500)' },
  rim2: { label: 'RIM 2', farg: 'bg-(--p-copper-500)' },
  rim3: { label: 'RIM 3', farg: 'bg-(--p-red-500)' },
  ovrigt: { label: 'Annat', farg: 'bg-(--p-neutral-500)' },
};
const KURS_ORDNING: KursTyp[] = ['fjarrskadning', 'rim1', 'rim2', 'rim3', 'ovrigt'];

function kursTyp(e: ProtoEvent): KursTyp {
  // K5-justerad efter Airtable-trogna demo-namnen ("Resor i medvetandet N",
  // "Fjärrskådning" utan typ-prefix): föreläsnings-grenen bärs nu av
  // typ-fältet (samma diskriminant som basen), kursgrenen av namnet.
  if (e.typ === 'Föreläsning') return 'ovrigt';
  const namn = eventName(e);
  if (/fjärrskådning/i.test(namn)) return 'fjarrskadning';
  const rim = namn.match(/resor i medvetandet\s*(\d)/i);
  if (rim?.[1] === '1') return 'rim1';
  if (rim?.[1] === '2') return 'rim2';
  if (rim?.[1] === '3') return 'rim3';
  return 'ovrigt';
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
  // K12: fokus-månaden styr månadssummeringen (Marcus-idén: agendan under
  // gridden — Apple-klassens månads+agenda-hybrid); månadsnav flyttar fokus.
  const [focused, setFocused] = useState<CalendarDate>(() => today(getLocalTimeZone()));
  const byDay = eventsByDay(events);
  const dagensEvent = selected ? (byDay.get(selected.toString()) ?? []) : [];
  const selectedPeriod: Period =
    selected && selected.compare(today(getLocalTimeZone())) < 0 ? 'past' : 'upcoming';
  const manadPrefix = `${focused.year}-${String(focused.month).padStart(2, '0')}`;
  const manadensEvent = events
    .filter((e) => dayKeys(e).some((k) => k.startsWith(manadPrefix)))
    .sort((a, b) => dateValue(a) - dateValue(b));
  const manadNamn = new Intl.DateTimeFormat('sv-SE', { month: 'long' }).format(
    focused.toDate(getLocalTimeZone()),
  );
  const navKnapp =
    'flex size-10 items-center justify-center rounded-full bg-bg shadow-sm text-text-secondary';
  return (
    <I18nProvider locale="sv-SE">
      <div className="flex flex-col gap-4">
        <Calendar
          aria-label="Eventkalender"
          value={selected}
          onChange={setSelected}
          focusedValue={focused}
          onFocusChange={setFocused}
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
                // K12: SOLIDA kursfärgs-tiles (500-kulören, samma som
                // legenden — exakt matchning); hela fre–lör-spannet färgas.
                const dagens = byDay.get(date.toString());
                const typ = dagens && dagens.length > 0 ? kursTyp(dagens[0]) : null;
                return (
                  <CalendarCell
                    date={date}
                    className={({ isSelected, isOutsideMonth }) =>
                      [
                        'relative flex h-11 items-center justify-center rounded-lg text-small tabular-nums',
                        isOutsideMonth ? 'invisible' : '',
                        isSelected
                          ? 'bg-primary font-semibold text-text ring-2 ring-text ring-offset-1'
                          : typ
                            ? `${KURS_INFO[typ].farg} font-semibold text-text-inverse`
                            : 'bg-bg-muted text-text-secondary',
                      ].join(' ')
                    }
                  >
                    {({ formattedDate }) => formattedDate}
                  </CalendarCell>
                );
              }}
            </CalendarGridBody>
          </CalendarGrid>
        </Calendar>
        {/* K11: kursfärg-legenden — orden bär det färgen förstärker.
            K12: punkterna bär EXAKT samma 500-kulör som dagarna. */}
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {KURS_ORDNING.map((t) => (
            <li key={t} className="flex items-center gap-1.5 text-caption text-text-secondary">
              <span aria-hidden="true" className={`size-2 rounded-full ${KURS_INFO[t].farg}`} />
              {KURS_INFO[t].label}
            </li>
          ))}
        </ul>
        {/* K12: månadssummeringen (agenda-under-grid) — default-läget visar
            fokus-månadens event som kompakta rader; dag-tryck smalnar till
            dagens fulla kort. */}
        {selected == null ? (
          manadensEvent.length === 0 ? (
            <p className="py-4 text-center text-small text-text-muted">Inga event i {manadNamn}.</p>
          ) : (
            <section className="flex flex-col gap-2">
              <h2 className="font-semibold text-small text-text-secondary capitalize">
                {manadNamn}
              </h2>
              <ul aria-label={`Event i ${manadNamn}`} className="flex flex-col">
                {manadensEvent.map((e) => (
                  <li key={e.id} className="relative border-border-light border-b">
                    <Link
                      to="/event/$eventId"
                      params={{ eventId: e.id }}
                      className="flex items-center gap-2.5 py-2.5"
                    >
                      {/* K14: vertikalt kursfärgs-streck (Google-agendans
                          mönster) — prick i BÅDE rad och legend var dubbelt. */}
                      <span
                        aria-hidden="true"
                        className={`w-1 shrink-0 self-stretch rounded-full ${KURS_INFO[kursTyp(e)].farg}`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-small">
                          {kursTyp(e) === 'ovrigt' ? eventName(e) : KURS_INFO[kursTyp(e)].label}
                        </span>
                        <span className="block text-caption text-text-muted">
                          {[dateText(e), e.ort].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        ) : (
          <div className="flex flex-col gap-3">
            {dagensEvent.length === 0 ? (
              <p className="py-4 text-center text-small text-text-muted">Inga event denna dag.</p>
            ) : (
              <ul aria-label="Valda dagens event" className="flex flex-col gap-3">
                {dagensEvent.map((e) => (
                  <VariantBCard key={e.id} e={e} period={selectedPeriod} idagStart={idagStart} />
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="self-center font-medium text-small text-text-secondary underline underline-offset-2"
            >
              Visa hela månaden
            </button>
          </div>
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

  // (K2-hackets DOM-döljning av headern RIVEN i S73: appen har ingen
  // shell-header alls — app-regeln bor i AppShell; hacket blev död kod.)
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
  // K74 (Marcus: "NEJ NEJ NEJ … i linje med list- och kalendervy-
  // väljaren fast på motsatt sida i samma stil" — K73:s titelrads-
  // primärknapp PRÖVAD-OCH-RIVEN): Skapa nytt event-ingången bor på
  // VY-RADEN, vänster (väljaren behåller höger), i väljarnas mjuka
  // kapselstil (rounded-full bg-bg-muted + ikon 18) — inte primär-
  // knappens svärta. Följer med i BÅDA vy-lägena (K10: raden har fast
  // position). Målet är befintliga skarpa /mer/skapa-event
  // (CreateEventForm mot create-event-EF:en, Fas 6f/ADR-066);
  // CalendarPlus + etiketten == Mer-radens (K47 samma överallt);
  // Mer-ingången KVAR tills Marcus dömer flytt vs dubblering.
  // Facit-utökningen öppet bokförd (S72-facitet låst 2026-07-19).
  const vyRad = (
    <div className="flex items-center justify-between gap-3">
      <Link
        to="/mer/skapa-event"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
      >
        <CalendarPlus aria-hidden="true" size={18} className="shrink-0" />
        Skapa nytt event
      </Link>
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
export const LIST_PROTO_VARIANTS: PrototypeVariant[] = [
  { key: 'A', label: 'Variant A', steg: 1, stegLabel: 'grillade baslinjen · FK-raden' },
  {
    key: 'B',
    label: 'Variant B',
    steg: 3,
    stegLabel: 'FACIT 2026-07-19 · K74 PÅGÅR — Skapa-ingången i vy-väljarraden (K73 riven)',
  },
];
// Växlaren själv är T78a-lyft till delade dev-komponenten
// (`@/components/dev/PrototypeSwitcher`); routen monterar den med konfigen
// ovan + legacy-aliaset K→A (K1–K3-URL:erna).
