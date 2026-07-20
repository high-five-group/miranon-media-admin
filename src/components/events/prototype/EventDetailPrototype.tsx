/**
 * [PROTOTYPE] — kastbar kod, levereras ALDRIG (throwaway-kontraktet,
 * prototype-skillen; klausul i+ii).
 *
 * FRÅGAN (nedskriven, styr formen): Hur ska EVENTSIDAN (detaljvyn
 * `/event/$eventId`) se ut i familje-grammatiken — konvergens från EXAKT
 * kopia av faktiska vyn tills Marcus låser facit?
 *
 * Konvergens-pass (T66 fas 2, fjärde instansen; S73). Divergens-överhoppet
 * är Marcus-beslutat vid S73-starten ("vi går direkt på konvergensen") —
 * S72-samsynens grund-arv täcker designbesluten; mönsterbesluten från
 * event-listans facit (S72 K1–K14) ärvs som utgångsläge. Underform A:
 * monteras på riktiga /event/$eventId-routen bakom `?variant=`, DEV-grindad.
 *
 * K1 = EXAKT kopia av EventDetail (render-strukturen + hjälparna kopierade
 * därifrån, INTE delade — prototypen ska vara fri att kasta sin form utan
 * att röra skarp kod). Enda avsteget är DATA-vägen: demo-data är
 * familje-default (S72 K2) via DEMO_EVENTS (samma substrat som listan —
 * lista→detalj-flödet landar på samma demo-event); `?data=verklig` är
 * opt-in och ärver befintlig dataväg (router-context-DI → staging i dev
 * per ADR-061). Inga writes (read-only-regeln).
 *
 * K2 (grund-arvet, Marcus-order): APP-REGLERNA appliceras — synlig h1
 * "Eventdetaljer" 30/600 (rubrikpolicyn S64; Marcus-vald sidrubrik),
 * eventnamnet = dominant innehåll under h1, Mer-rytmens topp-luft utan
 * egen sidopadding (main bär 16 px-inset), tonala sektionsytor per
 * DashboardCard-MÖNSTRET (etikett inne i kortet — kopierad form, ej delad
 * komponent), etikett-över-värde, långdatum aldrig rå ISO (Gunilla),
 * Lugnt laddläge-skeleton i slutgeometri. EVENT-KORTENS anatomi
 * (dagar-kvar-pill, 3-raders form, stapel) ärvs INTE — det är
 * list-materia, Marcus-klargjort vid K2-ordern.
 *
 * K3 (Marcus-referensen IMG_1542 "Mina uppgifter" + Eventmanager-
 * interfacet, fk-referens-katalogens Airtable-sektion): identitetskort
 * överst (namn + tidshorisont) · grupprubriker UTANFÖR korten ·
 * key-value-RADER (etikett vänster, värde höger, divide-y-avdelare) ·
 * fotnotsrad (beläggnings-sammanfattningen) · åtgärdsrad i kortbotten
 * (FK:s "Ändra"-rad → "Öppna X-vyn"). Innehållsrader ur Eventmanager:
 * Max antal platser / Anmälda / Platser kvar · Slutbetalning saknas
 * (endast vid avvikelse). FORM-steget — inga nya datakrav; Eventmanagers
 * innehålls-utökningar (anmälda-lista, betalningstabell, check-in) är
 * konvergens-/PRD-materia.
 *
 * Iterationssteg K1… bokförs i sessionsdok S73; skarpt bygge sker
 * NYSKRIVET genom leverans-grindarna (klausul iv — denna kod absorberas
 * aldrig).
 */

import { type CalendarDate, parseDate } from '@internationalized/date';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  BadgeCheck,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  Inbox,
  type LucideIcon,
  Mail,
  MailCheck,
  Minus,
  Pencil,
  Plus,
  Printer,
  TriangleAlert,
  UserCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Button as AriaButton,
  Input as AriaInput,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Checkbox,
  DateInput,
  DateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  I18nProvider,
  NumberField,
  Popover,
  RangeCalendar,
} from 'react-aria-components';
import type { PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { EventStatus } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';
import { DEMO_EVENTS, type ProtoEvent } from './EventsListPrototype';

/**
 * Detaljsidans konvergens har (ännu) ingen divergens-axel: EN variant 'K'.
 * Familje-flödet lista→detalj bär listans variant-värde (A/B) i URL:en —
 * routen aliasar därför A/B/K → 'K' (delade växlarens alias-kontrakt).
 */
export const DETAIL_PROTO_VARIANTS: PrototypeVariant[] = [
  {
    key: 'K',
    label: 'Prototypen',
    steg: 1,
    stegLabel: 'K60 — närvaro-registret: rader × sessions-bockar + total %, ej-genomfört-läge',
  },
];

/* ── Hjälpare (kopierade ur EventDetail — medvetet odelade) ── */

/** Visat eventnamn ur de fält Airtable kan leverera — aldrig krasch/tomt. */
export function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/** K16: kategorifärgerna för beläggnings-kompositionen (GitHub-storage-
    klassen: prickar på raderna == segment i stapeln). Färg aldrig ensam
    bärare — varje kategori har sin siffra i raden. Grön/röd undviks
    (upptagna av Fullt/Inställt-semantiken i familje-grammatiken);
    reserverade = neutral grå ("hålls", inte deltagare). */
const KATEGORI = {
  formular: 'bg-(--p-blue-700)',
  manuell: 'bg-(--p-copper-500)',
  medfoljande: 'bg-(--p-gold-500)',
  reserverad: 'bg-(--p-neutral-400)',
} as const;

/** K16: beläggnings-kompositionen i Marcus-modellen — delarna som fyller
    taket. `antalAnmalda` = via formulär (basens Källa TOM); övriga är
    demo-/PRD-fälten (se ProtoEvent). Saknade fält (verklig data) → 0. */
function belaggningsDelar(e: ProtoEvent) {
  return [
    { nyckel: 'formular', klass: KATEGORI.formular, antal: e.antalAnmalda },
    { nyckel: 'manuell', klass: KATEGORI.manuell, antal: e.manuelltTillagda ?? 0 },
    { nyckel: 'medfoljande', klass: KATEGORI.medfoljande, antal: e.medfoljande ?? 0 },
    { nyckel: 'reserverad', klass: KATEGORI.reserverad, antal: e.reserverade ?? 0 },
  ];
}

/** K3 (IMG_1542-formen): key-value-RAD — etikett vänster, värde höger.
    Hoppar tomma värden. K6 (Marcus + branschmönstret): VIKTNINGEN
    inverterad mot FK-referensen — etiketten muted, VÄRDET primärt.
    Detta är data-display-konventionen (Ant Descriptions: label
    secondary/content primary; Tailwind UI description lists: dt muted,
    dd stark) — FK:s starka etiketter är settings-listans mönster, men
    denna yta är en LÄSYTA där värdena är materian. Avdelarna bärs av
    dl:ens divide-y (K6-fix: display:contents bröt selektorn — divide-y
    opererar på DOM-barn, inte layoutträdet). */
function FkRad({
  term,
  prick,
  children,
}: {
  term: string;
  /** K16: kategoriprick (dekorativ — siffran i raden är bäraren). */
  prick?: string;
  children: React.ReactNode;
}) {
  if (children == null || children === '') return null;
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="flex items-center gap-2 text-small text-text-muted">
        {prick && <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${prick}`} />}
        {term}
      </dt>
      <dd className="text-right text-body">{children}</dd>
    </div>
  );
}

/** Långdatum-spann per K10-facit — sv-SE, aldrig rå ISO (Gunilla). En dag →
    "31 juli 2026"; spann inom samma år → "31 juli – 2 augusti 2026"; över
    årsskifte → båda med år. Ogiltigt/saknat → "Datum ej satt". */
const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const DAGMANAD = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' });
const KLOCKSLAG = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });
export function datumSpannText(e: Event): string {
  if (!e.startdatum) return 'Datum ej satt';
  const start = new Date(e.startdatum);
  if (Number.isNaN(start.getTime())) return 'Datum ej satt';
  if (!e.slutdatum || e.slutdatum === e.startdatum) return LANGDATUM.format(start);
  const end = new Date(e.slutdatum);
  if (Number.isNaN(end.getTime())) return LANGDATUM.format(start);
  return start.getFullYear() === end.getFullYear()
    ? `${DAGMANAD.format(start)} – ${LANGDATUM.format(end)}`
    : `${LANGDATUM.format(start)} – ${LANGDATUM.format(end)}`;
}

/** K3 (IMG_1542-formen): grupprubriken står UTANFÖR den tonala kortytan
    (FK: "Adress"/"Kontakt" ovanför sina kort); kortet bär radlistan med
    avdelare (divide-y). Kopierad form, ej delad komponent. */
export function ProtoGrupp({
  id,
  rubrik,
  children,
}: {
  id: string;
  rubrik: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      {/* K6: rubriken indragen till kortens inner-inset (16 px = px-4,
          "där rundningen slutar") — IMG_1542:s Adress/Kontakt-linjering. */}
      <h2 id={id} className="px-4 font-semibold text-lg">
        {rubrik}
      </h2>
      <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
        {children}
      </div>
    </section>
  );
}

/** K6 (IMG_1542:s "Ändra"-rad + Marcus: "det mesta här ska Lotta kunna
    ändra"): penn-ikon + Ändra centrerad rad i kortbotten. Per-sektion-
    redigering är branschmönstret på detaljsidor (Tailwind UI detail
    screens; FK själva). PROTOTYP-NO-OP: read-only-regeln — prototypen
    kopplar aldrig mutationer; skarpa kravet = write-operation(er) för
    event-fälten (EF + allowlist-post finns inte idag → PRD-krav). */
function AndraRad({ onPress }: { onPress?: () => void }) {
  return (
    <div className="py-3">
      <button
        type="button"
        onClick={onPress}
        className="flex w-full items-center justify-center gap-2 font-medium text-body"
      >
        <Pencil aria-hidden="true" size={16} />
        Ändra
      </button>
    </div>
  );
}

/* ── K11: Ändra-läget för Om eventet (Marcus-order, branschklass) ──
   Inline per-sektion-redigering (FK:s Ändra; Polaris/Stripe-mönstret):
   raderna byter till VITA fält (--mm-input-bg på tonala ytan) via
   bibliotekets primitiver — Select (RAC, full tangentbords-/skärmläsar-
   navigation) för basens singleSelects, Input för fritext, RAC
   DateRangePicker för start–slut med förifyllt sv-SE-format + kalender-
   popover (samma RAC-familj som listans kalendervy). Alternativen är
   BASENS: Typ = Utbildning/Föreläsning (data-model rad 254), Status =
   EventStatus-enumen (Fas 2.5, live-verifierad). Spara skriver ENDAST
   prototypens minnes-state (read-only-regeln — inga writes; sidladdning
   nollställer); skarpa kravet = write-operation(er) + allowlist-post
   per fält (PRD-krav, bokfört sedan K6). */

type OmEventetVarden = Pick<ProtoEvent, 'typ' | 'ort' | 'startdatum' | 'slutdatum' | 'status'>;

/** Datumfältet: RAC DateRangePicker — segmenterad inmatning (förifyllt
    bestämt format per locale) + RangeCalendar i popover för start/slut.
    K12: kompakt rad-form (min-h-8 == radgeometrin); etiketten bärs av
    raden utanför → aria-label här. */
function DatumFalt({
  value,
  onChange,
}: {
  value: { start: CalendarDate; end: CalendarDate } | null;
  onChange: (v: { start: CalendarDate; end: CalendarDate } | null) => void;
}) {
  const segKlass =
    'rounded tabular-nums outline-none data-[focused]:bg-bg-emphasized data-[placeholder]:text-(color:--mm-input-text-placeholder)';
  return (
    <DateRangePicker
      aria-label="Datum"
      value={value}
      onChange={onChange}
      className="flex w-full flex-col gap-1"
    >
      <Group className="flex min-h-8 w-full items-center justify-between gap-1 rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-2 text-small">
        <div className="flex items-center gap-1">
          <DateInput slot="start" className="flex">
            {(seg) => <DateSegment segment={seg} className={segKlass} />}
          </DateInput>
          <span aria-hidden="true" className="text-text-muted">
            –
          </span>
          <DateInput slot="end" className="flex">
            {(seg) => <DateSegment segment={seg} className={segKlass} />}
          </DateInput>
        </div>
        <AriaButton
          aria-label="Öppna kalendern"
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
        >
          <CalendarDays aria-hidden="true" size={16} />
        </AriaButton>
      </Group>
      <Popover className="rounded-2xl border border-(--mm-select-popover-border) bg-(--mm-select-popover-bg) p-4 shadow-lg">
        <Dialog className="outline-none">
          <RangeCalendar className="flex flex-col gap-3">
            <header className="flex items-center justify-between gap-2">
              <AriaButton
                slot="previous"
                aria-label="Föregående månad"
                className="flex size-9 items-center justify-center rounded-full bg-bg-muted"
              >
                <ChevronLeft aria-hidden="true" size={18} />
              </AriaButton>
              <Heading className="font-semibold text-body" />
              <AriaButton
                slot="next"
                aria-label="Nästa månad"
                className="flex size-9 items-center justify-center rounded-full bg-bg-muted"
              >
                <ChevronRight aria-hidden="true" size={18} />
              </AriaButton>
            </header>
            <CalendarGrid weekdayStyle="short" className="border-separate border-spacing-0.5">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-caption text-text-secondary">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className="flex size-9 items-center justify-center rounded-full text-small tabular-nums outline-none data-[selected]:bg-bg-emphasized data-[selection-end]:bg-text data-[selection-start]:bg-text data-[outside-month]:text-text-muted data-[selection-end]:text-text-inverse data-[selection-start]:text-text-inverse data-[disabled]:opacity-40"
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </RangeCalendar>
        </Dialog>
      </Popover>
    </DateRangePicker>
  );
}

/** Säker parse av demo-datumen till kalender-range (ogiltigt → null). */
function tillDatumRange(e: ProtoEvent): { start: CalendarDate; end: CalendarDate } | null {
  if (!e.startdatum) return null;
  try {
    const start = parseDate(e.startdatum);
    const end = e.slutdatum ? parseDate(e.slutdatum) : start;
    return { start, end };
  } catch {
    return null;
  }
}

/** K12: redigeringsRAD med EXAKT visningsradens geometri — py-2 + 32 px
    fält == py-3 + 24 px textrad == 48 px. Etiketten står kvar på samma
    plats (samma klass som FkRad); värde-slotten byter text → vitt fält
    i samma låda (Stripe/Linear-klassens geometri-bevarade inline-morf). */
function RedigeringsRad({
  term,
  prick,
  nuvarande,
  slotKlass = 'w-60',
  children,
}: {
  term: string;
  /** K16: kategoriprick — samma prick som visningsradens (morf-pariteten). */
  prick?: string;
  /** K13 (Marcus): nuvarande värdet synligt VÄNSTER om fältet genom hela
      ändringen — "så man ser vad man ändrar från". */
  nuvarande?: string | null;
  /** K15 (Marcus): slot-bredden styrbar per fält — fältets bredd ska
      spegla förväntat svar (GOV.UK-formregeln); antal-fältet behöver
      inte textfältens 240 px. K13:s likbredd är per-FORMULÄR (Om
      eventets fyra fält), inte global. */
  slotKlass?: string;
  children: React.ReactNode;
}) {
  // K13: ALLA fält exakt samma bredd — fasta w-60-lådan bor på slotten
  // (fälten är w-full inuti); datumfältet åtstramat så det ryms i samma
  // låda (K12-mätningen: wrap ger radhopp).
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="flex shrink-0 items-center gap-2 text-small text-text-muted">
        {prick && <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${prick}`} />}
        {term}
      </dt>
      <dd className="flex min-w-0 flex-1 items-center justify-end gap-3">
        <span className="truncate text-small text-text-secondary">{nuvarande || '–'}</span>
        <div className={`${slotKlass} shrink-0`}>{children}</div>
      </dd>
    </div>
  );
}

function OmEventetForm({
  event,
  onSpara,
  onAvbryt,
}: {
  event: ProtoEvent;
  onSpara: (v: OmEventetVarden) => void;
  onAvbryt: () => void;
}) {
  const [typ, setTyp] = useState<string | null>(event.typ);
  const [ort, setOrt] = useState(event.ort ?? '');
  const [status, setStatus] = useState<string | null>(event.status);
  const [datum, setDatum] = useState(() => tillDatumRange(event));
  return (
    <>
      <dl className="divide-y divide-border">
        <RedigeringsRad term="Typ" nuvarande={event.typ}>
          <Select
            label="Typ"
            hideLabel
            size="sm"
            placeholder="Välj typ"
            selectedKey={typ}
            onSelectionChange={(k) => setTyp(k == null ? null : String(k))}
          >
            <SelectItem id="Utbildning">Utbildning</SelectItem>
            <SelectItem id="Föreläsning">Föreläsning</SelectItem>
          </Select>
        </RedigeringsRad>
        <RedigeringsRad term="Ort" nuvarande={event.ort}>
          <Input label="Ort" hideLabel size="sm" placeholder="Ort" value={ort} onChange={setOrt} />
        </RedigeringsRad>
        <RedigeringsRad term="Datum" nuvarande={datumSpannText(event)}>
          <DatumFalt value={datum} onChange={setDatum} />
        </RedigeringsRad>
        <RedigeringsRad term="Status" nuvarande={event.status}>
          <Select
            label="Status"
            hideLabel
            size="sm"
            placeholder="Välj status"
            selectedKey={status}
            onSelectionChange={(k) => setStatus(k == null ? null : String(k))}
          >
            {Object.values(EventStatus).map((s) => (
              <SelectItem key={s} id={s}>
                {s}
              </SelectItem>
            ))}
          </Select>
        </RedigeringsRad>
      </dl>
      {/* Spara/Avbryt ersätter Ändra-raden PÅ SAMMA PLATS och höjd
          (py-2 + 32 px-knappar == Ändra-radens 48 px). */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Button
          size="sm"
          intent="primary"
          onPress={() =>
            onSpara({
              typ: typ as ProtoEvent['typ'],
              ort: ort.trim() === '' ? null : ort.trim(),
              startdatum: datum?.start.toString() ?? null,
              slutdatum: datum?.end.toString() ?? null,
              status: status as ProtoEvent['status'],
            })
          }
        >
          Spara
        </Button>
        <Button size="sm" intent="secondary" onPress={onAvbryt}>
          Avbryt
        </Button>
      </div>
    </>
  );
}

/* ── K14: Beläggnings-Ändra (Marcus-ordern vid resume: samma
   morf-behandling som Om eventet) — ENDAST Max antal platser är
   redigerbart (skrivbart number-fält i basen, `fldbyEz8djcxCBO5r`,
   data-model §Eventplanering); Anmälda/Platser kvar/beläggningen är
   HÄRLEDDA (rollup/formel) och står kvar som läsrader — kontext, inte
   fält. Spara re-deriverar de härledda värdena i minnes-state (speglar
   basens formler — annars ljuger fotnoten mot det nya taket).
   Read-only-regeln oförändrad: inga writes; skarpa kravet =
   write-operation + allowlist-post (PRD-krav, bokfört sedan K6). */

/** Antal-fältet: RAC NumberField (branschmönstret för numerisk inmatning —
    inputmode-numeriskt fält + stegknappar, locale-medvetet); biblioteket
    saknar NumberField-primitiv → rå RAC i prototypen, samma väg som
    DateRangePicker (K11). Rad-formen speglar DatumFalt (min-h-8 ==
    radgeometrin). Tomt fält = NaN i RAC → null (basens "platser ej satt"). */
export function AntalFalt({
  label,
  value,
  min = 0,
  onChange,
}: {
  /** Fältets tillgängliga namn (aria-label — raden/etiketten utanför bär det visuella). */
  label: string;
  value: number | null;
  min?: number;
  onChange: (v: number | null) => void;
}) {
  return (
    <NumberField
      aria-label={label}
      value={value ?? Number.NaN}
      onChange={(v) => onChange(Number.isNaN(v) ? null : v)}
      minValue={min}
      className="flex w-full flex-col gap-1"
    >
      <Group className="flex min-h-8 w-full items-center gap-1 rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-1">
        <AriaButton
          slot="decrement"
          aria-label="Minska"
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
        >
          <Minus aria-hidden="true" size={16} />
        </AriaButton>
        <AriaInput
          placeholder="Ej satt"
          className="placeholder:text-(color:--mm-input-text-placeholder) w-full min-w-0 bg-transparent text-center text-small tabular-nums outline-none"
        />
        <AriaButton
          slot="increment"
          aria-label="Öka"
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
        >
          <Plus aria-hidden="true" size={16} />
        </AriaButton>
      </Group>
    </NumberField>
  );
}

/** K15 (Marcus): fotnoten → beläggnings-MÄTAREN — caption vänster, procent
    höger, stapel under (kapacitetsmätarens branschform; GitHub-kvot/
    Polaris-klassen) på listans spår-grammatik (bg-surface h-1.5).
    K16 (Marcus-modellen): stapeln SEGMENTERAD per kategori (GitHub-
    storage-klassen) — segmenten == radernas prickar, samma ordning som
    delarna fyller taket (deltagare först, reserverade sist). Summan
    inkluderar reserverade → "upptagna", inte "bokade" (semantik-flagga,
    öppet bokförd). TEXTEN är bäraren (färg/stapel aldrig ensam — a11y);
    stapeln dekorativ (aria-hidden), spill klipps av spåret (överbokning).
    Utan satt tak: spåret står tomt (listans slot-modell). Delad mellan
    visnings- och Ändra-läget (morf-pariteten). */
function BelaggningsMatare({ event }: { event: ProtoEvent }) {
  const max = event.maxPlatser;
  const delar = belaggningsDelar(event);
  const upptagna = delar.reduce((summa, del) => summa + del.antal, 0);
  const full = max != null && max > 0 && upptagna >= max;
  const procent = max != null && max > 0 ? Math.round((upptagna / max) * 100) : null;
  return (
    <div className="flex flex-col gap-1.5 py-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-small text-text-muted">
          {max != null
            ? `${upptagna} av ${max} platser upptagna`
            : `${upptagna} upptagna (platser ej satt)`}
          {full ? ' · Fullt' : ''}
        </span>
        {procent != null && (
          <span className="font-medium text-small text-text-secondary tabular-nums">
            {procent} %
          </span>
        )}
      </div>
      <div aria-hidden="true" className="flex h-1.5 gap-px overflow-hidden rounded-full bg-surface">
        {max != null && max > 0
          ? delar
              .filter((del) => del.antal > 0)
              .map((del) => (
                <div
                  key={del.nyckel}
                  className={`h-full ${del.klass}`}
                  style={{ width: `${Math.min(100, (del.antal / max) * 100)}%` }}
                />
              ))
          : null}
      </div>
    </div>
  );
}

/** K16: de redigerbara är basens TRE skrivbara number-fält (Max antal
    platser · Extra platser/Reserverade · Manuella platser/Manuellt
    tillagda); via formulär + Medföljande är HÄRLEDDA räkningar ur
    Anmälningar (Källa-dimensionen) och står kvar som läsrader.
    Härledda värden behöver inte re-deriveras längre — mätaren räknar
    live ur delarna (Platser kvar-raden är riven ur Marcus-modellen). */
type BelaggningVarden = Pick<ProtoEvent, 'maxPlatser' | 'reserverade' | 'manuelltTillagda'>;

function BelaggningForm({
  event,
  onSpara,
  onAvbryt,
}: {
  event: ProtoEvent;
  onSpara: (v: BelaggningVarden) => void;
  onAvbryt: () => void;
}) {
  const [maxPlatser, setMaxPlatser] = useState<number | null>(event.maxPlatser);
  const [reserverade, setReserverade] = useState<number | null>(event.reserverade ?? null);
  const [manuellt, setManuellt] = useState<number | null>(event.manuelltTillagda ?? null);
  return (
    <>
      <dl className="divide-y divide-border">
        <RedigeringsRad
          term="Max antal platser"
          nuvarande={event.maxPlatser != null ? String(event.maxPlatser) : null}
          slotKlass="w-32"
        >
          <AntalFalt label="Max antal platser" value={maxPlatser} onChange={setMaxPlatser} />
        </RedigeringsRad>
        <RedigeringsRad
          term="Reserverade"
          prick={KATEGORI.reserverad}
          nuvarande={event.reserverade != null ? String(event.reserverade) : null}
          slotKlass="w-32"
        >
          <AntalFalt label="Reserverade" value={reserverade} onChange={setReserverade} />
        </RedigeringsRad>
        <FkRad term="Anmälda deltagare" prick={KATEGORI.formular}>
          {String(event.antalAnmalda)}
        </FkRad>
        <RedigeringsRad
          term="Manuellt tillagda"
          prick={KATEGORI.manuell}
          nuvarande={event.manuelltTillagda != null ? String(event.manuelltTillagda) : null}
          slotKlass="w-32"
        >
          <AntalFalt label="Manuellt tillagda" value={manuellt} onChange={setManuellt} />
        </RedigeringsRad>
        <FkRad term="Medföljande" prick={KATEGORI.medfoljande}>
          {event.medfoljande != null ? String(event.medfoljande) : null}
        </FkRad>
        {/* K22: läsrad även i Ändra-läget (extern räkning, aldrig fält). */}
        <FkRad term="Väntelista">
          {event.vantelista != null ? String(event.vantelista) : null}
        </FkRad>
      </dl>
      <BelaggningsMatare event={event} />
      {/* Spara/Avbryt på Ändra-radens plats och höjd (K12-mönstret). */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Button
          size="sm"
          intent="primary"
          onPress={() =>
            onSpara({
              maxPlatser,
              reserverade: reserverade ?? undefined,
              manuelltTillagda: manuellt ?? undefined,
            })
          }
        >
          Spara
        </Button>
        <Button size="sm" intent="secondary" onPress={onAvbryt}>
          Avbryt
        </Button>
      </div>
    </>
  );
}

/** K19 (Marcus): Åtgärds-gruppens rad — sidans operativa handlingar i
    familje-grammatikens radform (IMG_1542:s åtgärdsrader; centrerad
    ikon+text som Ändra-raden). Varje rad mappar mot BEFINTLIG system-
    kapacitet: bekräftelse/betalningspåminnelse/deltagarinfo = send-email-
    EF:ns mail-typer (confirmation/payment/participant-info, data-model
    §Mail-flöden); markera betalda = mark-registration-fee-paid-
    operationen (ADR-049) i bulk. PROTOTYP-NO-OP utom utskriften
    (read-only-regeln); skarpa kravet = bulk-operationer per event
    (selektionerna obekräftade/obetalda/alla anmälda) + confirm-grind på
    massmutationen (PRD). */
function HandlingsRad({
  ikon: Ikon,
  onPress,
  children,
}: {
  ikon: LucideIcon;
  onPress?: () => void;
  children: string;
}) {
  // K20 (Marcus): VÄNSTERSTÄLLD — centrerat höll inte med 5 olikbreda
  // rader (ojämna vänsterkanter läser rörigt); vänsterkant ger ikonerna
  // en gemensam kolumn (settings-listans skanlinje). Ändra-/Öppna-raderna
  // behåller centreringen (en rad per kort — annan situation).
  // K25 (Marcus, PRÖVNING): chevron höger på ALLA åtgärdsrader —
  // konsekvens-testet. OBS öppet flaggat: app-regeln (S64, M6-facitet)
  // säger ingen chevron på navigationsrader, och bransch-semantiken är
  // chevron = navigation, inte operation. Låses chevrons rivs regeln
  // öppet + Mer-menyn följer med (koherens); annars rivs prövningen.
  return (
    <div className="py-3">
      <button
        type="button"
        onClick={onPress}
        className="flex w-full items-center gap-2 text-left font-medium text-body"
      >
        <Ikon aria-hidden="true" size={16} className="shrink-0" />
        {children}
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="ml-auto shrink-0 text-text-secondary"
        />
      </button>
    </div>
  );
}

/** K16 (Marcus): "Lägg till manuell anmälan" — vägen in för anmälningar
    utanför formuläret (mail/telefon → basens Källa="Manuell"). Egen sida
    (K17, FK-formklassen). K21 (Marcus): FLYTTAD från Beläggnings-
    kortbotten till Åtgärds-gruppens TOPP — frekvensordningen (vanligaste
    handlingen först; det är denna Lotta gör mest). Dubbletten i
    Beläggnings-kortet revs (två identiska ingångar på samma sida är
    brus). Formen = HandlingsRadens vänsterställda (K20). */
function LaggTillRad({ eventId }: { eventId: string }) {
  return (
    <div className="py-3">
      <Link
        to="/event/$eventId/ny-anmalan"
        params={{ eventId }}
        search={(prev) => prev}
        className="flex w-full items-center gap-2 text-left font-medium text-body"
      >
        <Plus aria-hidden="true" size={16} className="shrink-0" />
        Lägg till manuell anmälan
        {/* K25-prövningen: chevron även här (radens syskon-konsekvens). */}
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="ml-auto shrink-0 text-text-secondary"
        />
      </Link>
    </div>
  );
}

/* ── K27→K29: Betalningar-kortets inline-detaljer (Marcus: "stanna på
   samma sida") — disclosure-raden ersätter navigationen till
   betalnings-vyn. K29 (Marcus: "det vi tänkte bygga i betalningsvyn"):
   detaljytan är BETALNINGSARBETSYTAN — ALLA anmälda, grupperade efter
   betalstatus (gästlista-branschformen: Eventbrite/Luma grupperar per
   status; Linear-klassens checklist-flytt), direkta KRYSS per betalning
   (RAC Checkbox — biblioteket saknar primitiv, samma rå-RAC-väg som
   NumberField/DateRangePicker), NOTERING per person ("Swishade 19/7"),
   namnet LÄNKAR till person-detaljvyn (Stripe-klassen: titeln länkar,
   kontrollerna ligger bredvid — aldrig rad-klick + inline-kontroller
   blandat). Kryss uppdaterar minnes-staten → personen FLYTTAR grupp och
   kortets röda deltan räknar ner LIVE (Omedelbarhet; samma härlednings-
   grepp som beläggnings-morfen). Deadline formulerad på svenska EN gång
   (aldrig referensens "-106" per rad; airtable-eventmanager-02).
   PROTOTYP: ren minnes-state, inga writes (read-only-regeln). Skarpa
   kraven (PRD): betalningsdetalj-shape per anmälan (personId + namn +
   Anmälningsavgift/Slutbetalning + Notering + deadline ur basen) +
   write-operationer för betalstatus/notering (mark-registration-fee-paid
   [ADR-049] finns; slutbetalning + notering saknas). */

/* ── K35 (Marcus): "Anmälda deltagare"-kortet ÖVER Betalningar — alla
   anmälda med sin BELÄGGNINGS-KATEGORI (prickarna == K16-grammatiken;
   reserverade är platser, inte personer → ingår ej). Namnen länkar till
   person-detaljvyn (samma Stripe-klass som betalningslistan). Demo-
   koherens: 8 via formulär + 1 manuellt tillagd + 1 medföljande = 10.
   PRD-frågor bokförda: per-källa-listan ur Anmälningar (Källa-fältet)
   i shapen · ska manuella/+1 även ingå i BETALNINGS-listan (basens
   Antal anmälda räknar troligen alla anmälningar)? · medföljandes
   koppling (Medföljande till-länken) i shapen. */

type DeltagarKategori = 'formular' | 'manuell' | 'medfoljande';

/** K37 (Marcus): kategori-LÖSNINGEN = familjens tysta norm (S72:
    statusbadge endast vid AVVIKELSE) — via formulär är normen och får
    inget märke; endast manuell/+1 får en diskret pill. */
const KATEGORI_PILL: Partial<Record<DeltagarKategori, string>> = {
  manuell: 'Manuellt tillagd',
  medfoljande: 'Medföljande',
};

/** K37: mail- och historik-överblicken per deltagare — ALLT finns i
    basen: `Bekräftelse skickad`/`Betalningspåminnelse skickad`/
    `Deltagarinfo skickad` (dateTime per anmälan, send-email-EF:n) +
    Personer.`Antal genomförda event` (formeln över kurs-räknarna).
    PRD = shape-utökning, inga nya bas-fält. null = ej skickad.
    (Påminnelse-datumen speglar betalningshistorikens — samma bas-fält
    bär båda ytorna i skarpt läge.) */
type DemoDeltagare = {
  personId: string;
  namn: string;
  epost: string;
  kategori: DeltagarKategori;
  /** K39: basens `Inskickad` (dateTime, create-registration) — när
      anmälan kom in. K45: med klockslag — metayta-raden visar dag + tid
      (Inskickad ÄR dateTime i basen; demot speglar det). */
  anmald: string;
  /** K50 (Marcus): övernattning — universellt på ALLA event (hemma-hos-
      event är normalfallet med sovande gäster). FÄLTET FINNS EJ I BASEN
      — PRD-krav: per-anmälan-kryss (additivt per ADR-063); listkortets
      boverAntal blir härledd summering av detta. */
  borOver: boolean;
  bekraftelse: string | null;
  paminnelse: string | null;
  deltagarinfo: string | null;
  tidigareEvent: number;
};

/** Fiktiva namn (PII-regeln). Samma 8 som betalningslistan + de två
    utanför formuläret. Ulrika (manuell) saknar bekräftelse — manuella
    anmälningar går utanför mail-flödet, precis det Lotta ska SE. */
const DEMO_DELTAGARE: Record<string, DemoDeltagare[]> = {
  'demo-1': [
    {
      personId: 'demo-p1',
      namn: 'Eva Lindqvist',
      epost: 'eva.lindqvist@example.com',
      kategori: 'formular',
      anmald: '2026-06-28T09:14',
      bekraftelse: '2026-06-28',
      paminnelse: '2026-07-18',
      deltagarinfo: null,
      tidigareEvent: 0,
      borOver: false,
    },
    {
      personId: 'demo-p2',
      namn: 'Johan Berg',
      epost: 'johan.berg@example.com',
      kategori: 'formular',
      anmald: '2026-06-29T11:52',
      bekraftelse: '2026-06-30',
      paminnelse: null,
      deltagarinfo: null,
      tidigareEvent: 1,
      borOver: false,
    },
    {
      personId: 'demo-p3',
      namn: 'Sara Nyström',
      epost: 'sara.nystrom@example.com',
      kategori: 'formular',
      anmald: '2026-06-30T15:03',
      bekraftelse: '2026-07-01',
      paminnelse: '2026-07-16',
      deltagarinfo: null,
      tidigareEvent: 3,
      borOver: true,
    },
    {
      personId: 'demo-p4',
      namn: 'Peter Åkesson',
      epost: 'peter.akesson@example.com',
      kategori: 'formular',
      anmald: '2026-06-29T19:44',
      bekraftelse: '2026-06-29',
      paminnelse: null,
      deltagarinfo: null,
      tidigareEvent: 0,
      borOver: false,
    },
    {
      personId: 'demo-p5',
      namn: 'Maria Holm',
      epost: 'maria.holm@example.com',
      kategori: 'formular',
      anmald: '2026-07-01T08:27',
      bekraftelse: '2026-07-02',
      paminnelse: null,
      deltagarinfo: null,
      tidigareEvent: 2,
      borOver: false,
    },
    {
      personId: 'demo-p6',
      namn: 'Anders Ek',
      epost: 'anders.ek@example.com',
      kategori: 'formular',
      anmald: '2026-07-02T21:16',
      bekraftelse: '2026-07-03',
      paminnelse: null,
      deltagarinfo: null,
      tidigareEvent: 5,
      borOver: true,
    },
    {
      personId: 'demo-p7',
      namn: 'Karin Sjögren',
      epost: 'karin.sjogren@example.com',
      kategori: 'formular',
      anmald: '2026-06-26T13:05',
      bekraftelse: '2026-06-27',
      paminnelse: null,
      deltagarinfo: null,
      tidigareEvent: 4,
      borOver: false,
    },
    {
      personId: 'demo-p8',
      namn: 'Lars Öhman',
      epost: 'lars.ohman@example.com',
      kategori: 'formular',
      anmald: '2026-06-26T17:38',
      bekraftelse: '2026-06-27',
      paminnelse: null,
      deltagarinfo: null,
      tidigareEvent: 2,
      borOver: false,
    },
    {
      personId: 'demo-p9',
      namn: 'Ulrika Dahl',
      epost: 'ulrika.dahl@example.com',
      kategori: 'manuell',
      anmald: '2026-07-15T10:20',
      bekraftelse: null,
      paminnelse: null,
      deltagarinfo: null,
      tidigareEvent: 1,
      borOver: false,
    },
    {
      personId: 'demo-p10',
      namn: 'Elin Öhman',
      epost: 'elin.ohman@example.com',
      kategori: 'medfoljande',
      anmald: '2026-07-12T12:41',
      bekraftelse: null,
      paminnelse: null,
      deltagarinfo: null,
      tidigareEvent: 0,
      borOver: true,
    },
  ],
};

/** K38: kapsel-knappen (S72-togglens form) delad mellan betalnings-
    flikarna och deltagar-filtret — en grammatik, en klass. */
function KapselKnapp({
  aktiv,
  onClick,
  children,
}: {
  aktiv: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={aktiv}
      onClick={onClick}
      className={
        aktiv
          ? 'rounded-full bg-bg px-2.5 py-2 text-center font-semibold text-small shadow-sm'
          : 'rounded-full px-2.5 py-2 text-center font-medium text-small text-text-secondary'
      }
    >
      {children}
    </button>
  );
}

/** K37: mailstatus-posten — MailCheck + datum (ikonen + datumet bär
    "skickad"). K45 (Marcus — avbrusningen): "ej skickad"-klartexten
    RIVEN från kortet — endast UTFÖRDA åtgärder renderas (kortet guards
    på null); deltat/att-göra bär summeringsraderna + Obekräftade-kön,
    inte varje kort. */
function MailStatus({ namn, skickad }: { namn: string; skickad: string }) {
  const datum = new Date(skickad);
  return (
    <span className="flex items-center gap-1">
      <MailCheck aria-hidden="true" size={12} className="shrink-0" />
      {namn} {Number.isNaN(datum.getTime()) ? skickad : DAGMANAD.format(datum)}
    </span>
  );
}

/** K39 (Marcus-semantiken, bas-belagd): BEKRÄFTAD ⟺ bekräftelse skickad —
    basens Status har bokstavligen "Obekräftad"/"Bekräftad (mail
    skickat)". Obekräftade är Lottas ATT GÖRA.
    K53 (Marcus): SPRÅKET lagt exakt på basens Status-ord — arbetsorden
    ohanterad/hanterad (K39–K52) RIVNA överallt; ORDLISTA-post. */
function arBekraftad(d: DemoDeltagare): boolean {
  return d.bekraftelse != null;
}

/** K39: kort-datum ur ISO (DAGMANAD, aldrig rå ISO — Gunilla). */
function kortDatum(iso: string): string {
  const datum = new Date(iso);
  return Number.isNaN(datum.getTime()) ? iso : DAGMANAD.format(datum);
}

/** K45: klockslaget ur Inskickad-dateTimen (tom sträng vid rent datum
    utan tid går ej att skilja från 00:00 — demot bär alltid tid). */
function klockslag(iso: string): string {
  const datum = new Date(iso);
  return Number.isNaN(datum.getTime()) ? '' : KLOCKSLAG.format(datum);
}

/** K37/K39: personkortet — namn + pillar (Obekräftad i varningston före
    kategori-pillen; bekräftad är OMÄRKT — tysta normen) · e-post ·
    tidslinjen som börjar med NÄR anmälan kom in (basens `Inskickad`) ·
    mail-överblicken · Miranon-historiken.
    K45 (Marcus — metaytans AVBRUSNING): Anmäld dag + klockslag på EN
    rad (Inskickad är dateTime) · därunder ENDAST utförda åtgärder på
    var sin rad · sista raden historiken med HELA namnet
    "Miranon Media".
    K46 (Marcus-ordern b): ohanterat kort bär HANTERA-handlingen —
    Skicka bekräftelse-knappen i kortbotten, UTANFÖR person-länken
    (interaktivt-i-interaktivt förbjudet, K44-regeln) — kortet blir
    wrapper-div, länken + knappen syskon. */
function DeltagarKort({
  d,
  onSkickaBekraftelse,
}: {
  d: DemoDeltagare;
  onSkickaBekraftelse: (personId: string) => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)">
      <Link
        to="/personer/$personId"
        params={{ personId: d.personId }}
        className="flex flex-col gap-1 rounded-xl px-4 py-3"
      >
        <span className="flex items-start justify-between gap-3 font-semibold text-body">
          {d.namn}
          <span className="flex shrink-0 items-center gap-1.5">
            {/* K41 (Marcus): ohanterat-tonen RÖD (inte koppar) och K40:s
              vänsterkant-markering riven — pillen bär ensam. */}
            {!arBekraftad(d) && (
              <span className="rounded-full bg-(--mm-error-bg) px-2 py-0.5 font-medium text-caption text-error">
                Obekräftad
              </span>
            )}
            {KATEGORI_PILL[d.kategori] && (
              <span className="rounded-full bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary">
                {KATEGORI_PILL[d.kategori]}
              </span>
            )}
          </span>
        </span>
        <span className="text-caption text-text-muted">E-post</span>
        <span className="text-small">{d.epost}</span>
        <span className="mt-1.5 flex flex-col gap-1 text-caption text-text-muted">
          <span className="flex items-center gap-1">
            <Inbox aria-hidden="true" size={12} className="shrink-0" />
            Anmäld {kortDatum(d.anmald)} {klockslag(d.anmald)}
          </span>
          {d.bekraftelse != null && <MailStatus namn="Bekräftelse" skickad={d.bekraftelse} />}
          {d.paminnelse != null && <MailStatus namn="Påminnelse" skickad={d.paminnelse} />}
          {d.deltagarinfo != null && <MailStatus namn="Eventinfo" skickad={d.deltagarinfo} />}
        </span>
        <span className="flex items-center gap-1.5 text-caption text-text-muted">
          <History aria-hidden="true" size={12} className="shrink-0" />
          {d.tidigareEvent === 0
            ? 'Första eventet hos Miranon Media'
            : `${d.tidigareEvent} tidigare event hos Miranon Media`}
        </span>
      </Link>
      {!arBekraftad(d) && (
        <button
          type="button"
          aria-label={`Skicka bekräftelse till ${d.namn}`}
          onClick={() => onSkickaBekraftelse(d.personId)}
          className="flex w-full items-center justify-center gap-2 rounded-b-xl border-border border-t px-4 py-2.5 font-medium text-small"
        >
          {/* K47 (Marcus): kuvertet — samma ikon som betalningarnas
              Påminn-handling och Åtgärds-gruppens utskicksrader;
              grammatiken Mail = skicka-handling, MailCheck =
              skickat-status. */}
          <Mail aria-hidden="true" size={14} className="shrink-0" />
          Skicka bekräftelse
        </button>
      )}
    </div>
  );
}

/** K60: närvaro-demot — bock ⟺ basens Närvaropoäng = 1 (Närvarande/
    Deltog online); index = sessions-position (Dag 1, Dag 2). Peter =
    frånvarande hela eventet · Ulrika = endast dag 1. Delas av alla
    genomförda demo-event (prototyp-förenkling). */
const DEMO_NARVARO: Record<string, boolean[]> = {
  'demo-p1': [true, true],
  'demo-p2': [true, true],
  'demo-p3': [true, true],
  'demo-p4': [false, false],
  'demo-p5': [true, true],
  'demo-p6': [true, true],
  'demo-p7': [true, true],
  'demo-p8': [true, true],
  'demo-p9': [true, false],
  'demo-p10': [true, true],
};

/** K60: sessions-kolumnerna ur basens Session-enum (Dag 1/Dag 2/
    Föreläsning — Deltaganden är EN rad per Anmälan × Session). */
function narvaroSessioner(e: ProtoEvent): string[] {
  if (e.typ === 'Föreläsning') return ['Föreläsning'];
  return e.slutdatum && e.slutdatum !== e.startdatum ? ['Dag 1', 'Dag 2'] : ['Dag 1'];
}

/** K60 (Marcus + registermönstret hos LMS-branschledarna [Blackboard/
    Canvas/Brightspace: rader = deltagare, kolumner = sessioner, symbol
    per cell, närvaro-% summerad]): närvaro-registret visas när eventet
    är GENOMFÖRT (basens Status-ord); innan dess ett lugnt
    ej-genomfört-läge mitt i kortet. Bocken förenklar basens 6
    Deltagande-statusar till Närvaropoäng-regeln (1 = Närvarande/Deltog
    online) — nyanserna (Försenad/Avbröt …) hör hemma i check-in-sidan.
    PRD: get-attendance-shapen per event (person × session; S25-fyndet:
    Person-lookup ger record-ID → namn-batch) + poäng-mappningen. */
function NarvaroLista({ eventId, event }: { eventId: string; event: ProtoEvent }) {
  if (event.status !== 'Genomfört') {
    return (
      <p className="py-8 text-center text-small text-text-secondary">
        Eventet är inte genomfört ännu — närvaron fylls i vid check-in.
      </p>
    );
  }
  const sessioner = narvaroSessioner(event);
  const deltagare = DEMO_DELTAGARE[eventId] ?? DEMO_DELTAGARE['demo-1'];
  const rader = deltagare.map((d) => ({
    d,
    narvaro: (DEMO_NARVARO[d.personId] ?? []).slice(0, sessioner.length),
  }));
  const poang = rader.reduce((sum, r) => sum + r.narvaro.filter(Boolean).length, 0);
  const slots = rader.length * sessioner.length;
  const procent = slots === 0 ? 0 : Math.round((100 * poang) / slots);
  return (
    <>
      <div className="flex items-center justify-between gap-4 py-3">
        <span className="text-small text-text-muted">Total närvaro</span>
        <span className="font-semibold text-body">{procent} %</span>
      </div>
      <div className="py-3">
        <table className="w-full">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Deltagare
              </th>
              {sessioner.map((s) => (
                <th
                  key={s}
                  scope="col"
                  className="w-20 pb-2 text-right font-medium text-caption text-text-muted"
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rader.map(({ d, narvaro }) => (
              <tr key={d.personId}>
                <th scope="row" className="py-2.5 text-left font-normal text-body">
                  {d.namn}
                </th>
                {sessioner.map((s, i) => (
                  <td key={s} className="w-20 py-2.5 text-right">
                    {narvaro[i] ? (
                      <>
                        <Check aria-hidden="true" size={16} className="inline text-success" />
                        <span className="sr-only">Närvarande</span>
                      </>
                    ) : (
                      <span className="text-text-muted">
                        –<span className="sr-only">Ej närvarande</span>
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** K52: bor över-raden i markerings-läget — RAC Checkbox i
    betalnings-kryssets ruta-grammatik (K29) + personkortens radform;
    sängen tänds när personen är ikryssad. Obockad är NEUTRAL (till
    skillnad från BetalKryss röda: att inte bo över är normalläge,
    inte avvikelse). */
function BorOverRad({
  d,
  vald,
  onChange,
}: {
  d: DemoDeltagare;
  vald: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Checkbox
      isSelected={vald}
      onChange={onChange}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-(--mm-navcard-border) bg-surface px-4 py-3 contrast-more:border-(--mm-navcard-border-contrast)"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
        <Check
          aria-hidden="true"
          size={14}
          className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="truncate font-semibold text-body">{d.namn}</span>
        {KATEGORI_PILL[d.kategori] && (
          <span className="shrink-0 rounded-full bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary">
            {KATEGORI_PILL[d.kategori]}
          </span>
        )}
      </span>
      <BedDouble
        aria-hidden="true"
        size={16}
        className={`shrink-0 ${vald ? 'text-text' : 'text-text-muted opacity-40'}`}
      />
    </Checkbox>
  );
}

/** K40 (Marcus): summeringsraderna KLICKBARA — radens siffra ÄR urvalet
    man ser vid klick (aktiv rad markeras, klick igen rensar; flat lista
    + rensa-rad under filtret). Eventinfo-radens klick visar de som
    SAKNAR (deltat är det åtgärdbara).
    K52 (Marcus-kvitterad rek. A): Bor över-raden är en ARBETSRAD —
    klicket öppnar MARKERINGS-LÄGET (alla anmälda i EN kolumn,
    säng-kryss per rad) i stället för ren filterlista; radens siffra är
    fortfarande urvalet, nu redigerbart på plats. Öppen K40-avvikelse.
    Draget (tvåkolumns-transfer) MEDVETET valt bort som grundform:
    430 px-ytan + WCAG 2.2 SC 2.5.7 (en-pekar-alternativ krävs ändå) +
    betalnings-arbetsytans redan etablerade kryss-grammatik.
    K42 (Marcus — LOTTAS MAIL-FLÖDE, speglas i radordningen): mail 1 =
    ANMÄLNINGSBEKRÄFTELSEN (först av allt, bär betalningsinstruktionerna;
    när den är skickad är anmälan BEKRÄFTAD) → ev. betalningspåminnelse
    emellan → mail 2 = EVENTINFO (2 veckor före eventet). UI-ordet är
    EVENTINFO (Marcus-språket; basens fält heter `Deltagarinfo skickad` —
    ORDLISTA-/PRD-not, ingen bas-ändring här). */
type StatusFilter = 'obekraftade' | 'bekraftade' | 'paminda' | 'saknarEventinfo' | 'borOver';
const STATUSFILTER: Record<StatusFilter, { test: (d: DemoDeltagare) => boolean }> = {
  obekraftade: { test: (d) => !arBekraftad(d) },
  bekraftade: { test: (d) => d.bekraftelse != null },
  paminda: { test: (d) => d.paminnelse != null },
  saknarEventinfo: { test: (d) => d.deltagarinfo == null },
  borOver: { test: (d) => d.borOver },
};

function SummeringsRad({
  term,
  ikon: Ikon,
  aktiv,
  onClick,
  signal,
  children,
}: {
  term: string;
  /** K50 (Marcus): valfri rad-ikon före termen (Bor över-radens säng). */
  ikon?: LucideIcon;
  aktiv: boolean;
  onClick: () => void;
  /** K43/K44: signal-SLOTTEN under räkningen — alltid reserverad plats
      (dags-att-skicka-badgen ELLER auto-utskicks-krysset). Ligger
      UTANFÖR filter-knappen: slotten kan bära egna interaktiva element
      (kryssrutan) och interaktivt-i-interaktivt är förbjudet. */
  signal?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-2">
      {/* K54 (Marcus-fyndet "siffrorna hoppar in"): geometrin KONSTANT
          över lägena — insetten (-mx-2 px-2) reserveras ALLTID, aktiv
          togglar ENBART bakgrunden. Gamla formen bar w-full + villkorat
          w-auto: w-full vann kaskaden, så -mx-2 sköt boxen åt vänster i
          stället för att bredda den — högersiffrorna hoppade in ~16 px. */}
      <button
        type="button"
        aria-pressed={aktiv}
        onClick={onClick}
        className={`-mx-2 flex w-auto items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-left hover:bg-bg-emphasized motion-safe:transition-colors ${
          aktiv ? 'bg-bg-emphasized' : ''
        }`}
      >
        <span className="flex items-center gap-1.5 text-small text-text-muted">
          {Ikon && <Ikon aria-hidden="true" size={14} className="shrink-0" />}
          {term}
        </span>
        <span className="text-right text-body">{children}</span>
      </button>
      {signal && <div className="flex min-h-7 items-center">{signal}</div>}
    </div>
  );
}

/** K43 (Marcus): dags-att-skicka-signalen för eventinfo — mail 2 går ut
    2 VECKOR före eventet (Lottas flöde, K42); när gränsen är nådd och
    utskick saknas tänds badgen (betalnings-deadline-badgens grammatik:
    bg-surface-pill + Clock + warning-ton). Tystnar när eventet passerat
    eller alla fått. */
/** K44: eventinfo-gränsen (2 veckor före start) som datum, eller null. */
function eventinfoGrans(e: ProtoEvent): Date | null {
  if (!e.startdatum) return null;
  const start = new Date(e.startdatum);
  if (Number.isNaN(start.getTime())) return null;
  const grans = new Date(start);
  grans.setDate(grans.getDate() - 14);
  grans.setHours(0, 0, 0, 0);
  return grans;
}

function eventinfoSignal(e: ProtoEvent): string | null {
  const grans = eventinfoGrans(e);
  if (grans == null || !e.startdatum) return null;
  const start = new Date(e.startdatum);
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  if (idag < grans || idag > start) return null;
  const dagarKvar = Math.round((start.getTime() - idag.getTime()) / 86_400_000);
  if (dagarKvar === 0) return 'Dags att skicka — eventet är idag';
  if (dagarKvar === 1) return 'Dags att skicka — eventet är imorgon';
  return `Dags att skicka — eventet är om ${dagarKvar} dagar`;
}

/** K44 (Marcus): auto-utskicks-krysset i signal-slotten — ikryssad =
    eventinfon skickas automatiskt på gräns-datumet; urkryssad = inget
    automatiskt utskick (signalen tar över när gränsen nås). NEUTRAL
    ton (urkryssad är ett medvetet val, inte ett fel — skild från
    BetalKryssets röda obetalt-semantik). PROTOTYP-minnes-state; PRD:
    schemalagt utskick + opt-out-fält per event FINNS INTE i basen —
    nytt additivt fält + schemalagd automation. */
function AutoKryss({
  vald,
  datum,
  onChange,
}: {
  vald: boolean;
  datum: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <Checkbox
      isSelected={vald}
      onChange={onChange}
      className="group flex cursor-pointer items-center gap-2 text-small text-text-secondary"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
        <Check
          aria-hidden="true"
          size={14}
          className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      {vald ? `Schemalagt att skickas automatiskt ${datum}` : 'Skickas inte automatiskt'}
    </Checkbox>
  );
}

/** K40: accordion-rubriken (Marcus: "dropdown-rubriker under tabbraden")
    — vänsterställd etikett + roterande chevron; obekräftade-rubriken i
    varningston med ikon (texten bär, färgen förstärker).
    K47 (Marcus): valfri HANDLINGS-slot på raden (Bekräfta alla-pillen)
    — visuellt på raden, strukturellt UTANFÖR toggle-knappen som syskon
    i den tonala raden (K44-regeln: interaktivt-i-interaktivt
    förbjudet); toggle-knappen blir flex-1, chevronen stannar vid dess
    högerkant. */
function GruppRubrik({
  oppen,
  varning,
  kontrollerarId,
  onToggle,
  handling,
  children,
}: {
  oppen: boolean;
  varning?: boolean;
  kontrollerarId: string;
  onToggle: () => void;
  /** Interaktiv handling på rubrikraden — renderas utanför knappen. */
  handling?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center rounded-lg bg-bg-emphasized">
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={kontrollerarId}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span
          className={`flex items-center gap-1.5 font-semibold text-small ${varning ? 'text-error' : ''}`}
        >
          {varning && <TriangleAlert aria-hidden="true" size={14} className="shrink-0" />}
          {children}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={`shrink-0 text-text-secondary motion-safe:transition-transform ${oppen ? 'rotate-180' : ''}`}
        />
      </button>
      {handling != null && <span className="flex shrink-0 items-center pr-2">{handling}</span>}
    </div>
  );
}

/** K38: deltagar-kortets innehåll — sammanfattning ("hur många") +
    kategorifilter + personkorten ("vilka"); sammanfattningen räknar
    ALLTID hela eventet. K39: arbetskö-mönstret (Obekräftade/Bekräftade).
    K40: summeringsraderna är FILTER (klick → flat lista + rensa-rad),
    grupperna är ACCORDIONS under tabbraden — Obekräftade ÖPPEN som
    standard, Bekräftade STÄNGD (inbox-fokus: kön i ansiktet, arkivet
    ett klick bort; är kön tom öppnas Bekräftade i stället och en
    positiv rad ersätter obekräftade-rubriken). */
function DeltagarLista({ eventId, event }: { eventId: string; event: ProtoEvent }) {
  /* K46 (Marcus-ordern b): HANTERA-flödet — Lotta får en VÄG och kön
     kan TÖMMAS. Demo-lokal overlay-state (read-only-regeln: inget
     lämnar sidan); skarpa formen = send-email confirmation per anmälan
     (mail 1, bär betalningsinstruktionerna) — PRD-krav: EF-operationen
     + Status-flip till "Bekräftad (mail skickat)" server-side. */
  const [skickade, setSkickade] = useState<Record<string, string>>({});
  /* K52: bor över-markeringen — demo-lokal overlay (read-only-regeln);
     skarpa formen = write-op per anmälan på PRD-kryssfältet (additivt
     per ADR-063). */
  const [borOverVal, setBorOverVal] = useState<Record<string, boolean>>({});
  const vaxlaBorOver = (personId: string, v: boolean) =>
    setBorOverVal((s) => ({ ...s, [personId]: v }));
  const bas = DEMO_DELTAGARE[eventId] ?? DEMO_DELTAGARE['demo-1'];
  const deltagare = bas.map((d) => ({
    ...d,
    bekraftelse: skickade[d.personId] ?? d.bekraftelse,
    borOver: borOverVal[d.personId] ?? d.borOver,
  }));
  const skickaBekraftelse = (personId: string) =>
    setSkickade((s) => ({ ...s, [personId]: new Date().toISOString() }));
  const [filter, setFilter] = useState<'alla' | DeltagarKategori>('alla');
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  // K44: auto-utskicks-valet (minnes-state; PRD = per-event-fält i basen).
  const [autoUtskick, setAutoUtskick] = useState(true);
  const obekraftadeTotalt = deltagare.filter((d) => !arBekraftad(d)).length;
  const [oppna, setOppna] = useState({ obekraftade: true, bekraftade: obekraftadeTotalt === 0 });
  const visade = filter === 'alla' ? deltagare : deltagare.filter((d) => d.kategori === filter);
  const antalKategori = (k: DeltagarKategori) => deltagare.filter((d) => d.kategori === k).length;
  const antalSkickade = (falt: 'bekraftelse' | 'paminnelse' | 'deltagarinfo') =>
    deltagare.filter((d) => d[falt] != null).length;
  const totalt = deltagare.length;
  const obekraftade = visade
    .filter((d) => !arBekraftad(d))
    .sort((a, b) => a.anmald.localeCompare(b.anmald));
  const bekraftade = visade
    .filter((d) => arBekraftad(d))
    .sort((a, b) => b.anmald.localeCompare(a.anmald));
  /* K47 (Marcus): Bekräfta alla — tömmer den VISADE kön i ett svep.
     Skarpa formen är PRD-bokförd sedan tidigare: bulk-operationer per
     event + CONFIRM-GRIND på massmutationen; demot kör direkt. */
  const bekraftaAlla = () =>
    setSkickade((s) => {
      const nu = new Date().toISOString();
      return { ...s, ...Object.fromEntries(obekraftade.map((d) => [d.personId, nu])) };
    });
  const deltagarinfoSkickade = antalSkickade('deltagarinfo');
  const statusTraffar =
    statusFilter == null ? null : visade.filter(STATUSFILTER[statusFilter].test);
  const vaxlaStatus = (f: StatusFilter) => setStatusFilter((nu) => (nu === f ? null : f));
  /* K52: ikryssade överst — sorterat på BAS-datat (stabilt under
     markeringen; nykryssade flyttar upp först vid omöppning — raderna
     hoppar inte under fingret). */
  const basBorOver = new Set(bas.filter((d) => d.borOver).map((d) => d.personId));
  const markeringsLista = [...visade].sort(
    (a, b) => Number(basBorOver.has(b.personId)) - Number(basBorOver.has(a.personId)),
  );
  const kortLista = (lista: DemoDeltagare[]) => (
    <ul className="flex flex-col gap-2.5">
      {lista.map((d) => (
        <li key={d.personId}>
          <DeltagarKort d={d} onSkickaBekraftelse={skickaBekraftelse} />
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <div className="divide-y divide-border">
        <SummeringsRad
          term="Obekräftade anmälningar"
          aktiv={statusFilter === 'obekraftade'}
          onClick={() => vaxlaStatus('obekraftade')}
        >
          {obekraftadeTotalt > 0 ? (
            <span className="font-medium text-error tabular-nums">{obekraftadeTotalt}</span>
          ) : (
            '0'
          )}
        </SummeringsRad>
        {/* K42 (Marcus): raderna i LOTTAS UTSKICKSORDNING — bekräftelsen
            (mail 1, bär betalningsinstruktionerna) → ev. påminnelse →
            eventinfo (mail 2, 2 veckor före eventet). */}
        <SummeringsRad
          term="Anmälningsbekräftelse skickad"
          aktiv={statusFilter === 'bekraftade'}
          onClick={() => vaxlaStatus('bekraftade')}
        >
          {`${antalSkickade('bekraftelse')} av ${totalt}`}
          {totalt - antalSkickade('bekraftelse') > 0 && (
            <span className="ml-2 font-medium text-error tabular-nums">
              −{totalt - antalSkickade('bekraftelse')}
            </span>
          )}
        </SummeringsRad>
        <SummeringsRad
          term="Betalningspåminnelse skickad"
          aktiv={statusFilter === 'paminda'}
          onClick={() => vaxlaStatus('paminda')}
        >
          {String(antalSkickade('paminnelse'))}
        </SummeringsRad>
        <SummeringsRad
          term="Eventinfo skickad"
          aktiv={statusFilter === 'saknarEventinfo'}
          onClick={() => vaxlaStatus('saknarEventinfo')}
          signal={
            // K44 (Marcus): slotten ALLTID reserverad — signalen när den
            // är aktiv, annars auto-utskicks-krysset (schemalagt datum;
            // urkryssat = inget automatiskt utskick).
            totalt - deltagarinfoSkickade > 0 && eventinfoSignal(event) ? (
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface px-2.5 py-1 font-medium text-small text-warning">
                <Clock aria-hidden="true" size={14} />
                {eventinfoSignal(event)}
              </span>
            ) : eventinfoGrans(event) ? (
              <AutoKryss
                vald={autoUtskick}
                datum={DAGMANAD.format(eventinfoGrans(event) as Date)}
                onChange={setAutoUtskick}
              />
            ) : null
          }
        >
          {`${deltagarinfoSkickade} av ${totalt}`}
          {totalt - deltagarinfoSkickade > 0 && (
            <span className="ml-2 font-medium text-error tabular-nums">
              −{totalt - deltagarinfoSkickade}
            </span>
          )}
        </SummeringsRad>
        {/* K50 (Marcus): Bor över SIST — universell rad på ALLA event
            (hemma-hos-eventen är normalfallet med sovande gäster);
            sängen bär radens identitet. Markerings-flödet = eget
            K-steg (Marcus-vägval); PRD-kravet bokfört på fältet. */}
        <SummeringsRad
          term="Bor över"
          ikon={BedDouble}
          aktiv={statusFilter === 'borOver'}
          onClick={() => vaxlaStatus('borOver')}
        >
          {String(deltagare.filter((d) => d.borOver).length)}
        </SummeringsRad>
      </div>
      <div className="flex flex-col gap-2.5 py-3">
        {/* K41 (Marcus): Formulär-tabben riven — formulärvägen är NORMEN
            och behöver ingen egen flik; "+1" struket ur alla etiketter. */}
        <fieldset className="grid grid-cols-3 rounded-full bg-bg-emphasized p-1">
          <legend className="sr-only">Visa deltagare</legend>
          <KapselKnapp aktiv={filter === 'alla'} onClick={() => setFilter('alla')}>
            Alla ({totalt})
          </KapselKnapp>
          <KapselKnapp aktiv={filter === 'manuell'} onClick={() => setFilter('manuell')}>
            Manuella ({antalKategori('manuell')})
          </KapselKnapp>
          <KapselKnapp aktiv={filter === 'medfoljande'} onClick={() => setFilter('medfoljande')}>
            Medföljande ({antalKategori('medfoljande')})
          </KapselKnapp>
        </fieldset>
        {statusTraffar != null ? (
          <>
            {/* K57 (Marcus): "Visar:"-raden + instruktionsraden RIVNA —
                man har ju tryckt på raden, urvalet förklarar sig självt.
                Rensa filtret ensam, högerställd på kortens INNER-inset
                (16 px — K6-grammatiken: friliggande text linjerar med
                innehållet i rutorna, inte ytterkanten). */}
            {/* K58 (Marcus): extra luft ovanför Rensa — mt-1.5 + gap-2.5
                = 16 px från tabbraden (4 px-gridets space-4-steg). */}
            <div className="mt-1.5 flex justify-end pr-4">
              <button
                type="button"
                onClick={() => setStatusFilter(null)}
                className="font-medium text-small underline-offset-2 hover:underline"
              >
                Rensa filtret
              </button>
            </div>
            {statusFilter === 'borOver' ? (
              <ul className="flex flex-col gap-2.5">
                {markeringsLista.map((d) => (
                  <li key={d.personId}>
                    <BorOverRad
                      d={d}
                      vald={d.borOver}
                      onChange={(v) => vaxlaBorOver(d.personId, v)}
                    />
                  </li>
                ))}
              </ul>
            ) : statusTraffar.length > 0 ? (
              kortLista(statusTraffar)
            ) : (
              <p className="py-2 text-small text-text-secondary">Inga träffar i denna kategori.</p>
            )}
          </>
        ) : visade.length === 0 ? (
          <p className="py-2 text-small text-text-secondary">Inga deltagare i denna kategori.</p>
        ) : (
          <>
            {obekraftade.length > 0 ? (
              <div>
                <GruppRubrik
                  oppen={oppna.obekraftade}
                  varning
                  kontrollerarId="deltagare-obekraftade"
                  onToggle={() => setOppna((o) => ({ ...o, obekraftade: !o.obekraftade }))}
                  handling={
                    // K48 (Marcus): pillen i success-GRÖNT med vit text +
                    // ikon — sidans positiva massåtgärd bär success-rollen
                    // (samma token som fullbokat-mätaren); vit på
                    // --mm-success (#606B57 sage, K49) = 5,61:1, AA-ren.
                    <button
                      type="button"
                      aria-label="Skicka bekräftelse till alla obekräftade"
                      onClick={bekraftaAlla}
                      className="flex items-center gap-1.5 rounded-lg bg-success px-2.5 py-1 font-medium text-small text-text-inverse shadow-sm"
                    >
                      <Mail aria-hidden="true" size={14} className="shrink-0" />
                      Bekräfta alla
                    </button>
                  }
                >
                  Obekräftade ({obekraftade.length})
                </GruppRubrik>
                <div id="deltagare-obekraftade" hidden={!oppna.obekraftade} className="pt-1.5">
                  {kortLista(obekraftade)}
                </div>
              </div>
            ) : (
              <p className="text-small text-text-secondary">
                Inga obekräftade — alla är bekräftade.
              </p>
            )}
            {bekraftade.length > 0 && (
              <div>
                <GruppRubrik
                  oppen={oppna.bekraftade}
                  kontrollerarId="deltagare-bekraftade"
                  onToggle={() => setOppna((o) => ({ ...o, bekraftade: !o.bekraftade }))}
                >
                  Bekräftade ({bekraftade.length})
                </GruppRubrik>
                <div id="deltagare-bekraftade" hidden={!oppna.bekraftade} className="pt-1.5">
                  {kortLista(bekraftade)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/** K34 (Marcus): påminnelse-HISTORIK per person — skickade
    betalningspåminnelser skrivs ut under betalnings-linjerna. Bas-gapet
    (verifierat data-model): `Betalningspåminnelse skickad`
    (fldE0cR4r9vI0rKiL) är EN dateTime — senaste, odelad på avgift/slut,
    ingen logg; PRD-val = per-betalnings-tidsstämplar (additivt) eller
    härledning ur mailloggen (Resend-historiken; mer/maillogg finns). */
type PaminnelsePost = { betalning: 'avgift' | 'slut'; skickad: string };

/** K31 (Marcus): noteringen hör till EN betalning — per-betalnings-fält
    (avgiftNotering/slutNotering) i stället för en per person. OBS
    bas-gapet: basen har EN `Notering` per anmälan (fldPMsiRoLWcgUbsv) —
    per-betalnings-notering = PRD-val (två additiva fält per ADR-063,
    eller strukturerad konvention i ett). */
type BetalningsRad = {
  personId: string;
  namn: string;
  epost: string;
  avgift: boolean;
  slut: boolean;
  avgiftNotering: string;
  slutNotering: string;
  historik: PaminnelsePost[];
};

/** Fiktiva demo-personer (aldrig verkliga namn ur basen — PII). Koherent
    med demo-1:s aggregat vid start: 5 av 8 avgifter, 2 av 8 slutbetalningar. */
const DEMO_BETALNINGAR: Record<
  string,
  (Omit<BetalningsRad, 'historik'> & { historik?: PaminnelsePost[] })[]
> = {
  'demo-1': [
    {
      personId: 'demo-p1',
      namn: 'Eva Lindqvist',
      epost: 'eva.lindqvist@example.com',
      avgift: false,
      slut: false,
      avgiftNotering: '',
      slutNotering: '',
      historik: [{ betalning: 'avgift', skickad: '2026-07-18' }],
    },
    {
      personId: 'demo-p2',
      namn: 'Johan Berg',
      epost: 'johan.berg@example.com',
      avgift: false,
      slut: false,
      avgiftNotering: '',
      slutNotering: '',
    },
    {
      personId: 'demo-p3',
      namn: 'Sara Nyström',
      epost: 'sara.nystrom@example.com',
      avgift: false,
      slut: false,
      avgiftNotering: 'Lovade betala efter lönen',
      slutNotering: '',
      // K34-demot (Marcus-exemplet): Sara har fått påminnelse om BÅDA.
      historik: [
        { betalning: 'avgift', skickad: '2026-07-16' },
        { betalning: 'slut', skickad: '2026-07-16' },
      ],
    },
    {
      personId: 'demo-p4',
      namn: 'Peter Åkesson',
      epost: 'peter.akesson@example.com',
      avgift: true,
      slut: false,
      avgiftNotering: 'Swishade 30/6',
      slutNotering: '',
    },
    {
      personId: 'demo-p5',
      namn: 'Maria Holm',
      epost: 'maria.holm@example.com',
      avgift: true,
      slut: false,
      avgiftNotering: '',
      slutNotering: '',
    },
    {
      personId: 'demo-p6',
      namn: 'Anders Ek',
      epost: 'anders.ek@example.com',
      avgift: true,
      slut: false,
      avgiftNotering: '',
      slutNotering: '',
    },
    {
      personId: 'demo-p7',
      namn: 'Karin Sjögren',
      epost: 'karin.sjogren@example.com',
      avgift: true,
      slut: true,
      avgiftNotering: 'Swishade 12/6',
      slutNotering: 'Swishade 12/7',
    },
    {
      personId: 'demo-p8',
      namn: 'Lars Öhman',
      epost: 'lars.ohman@example.com',
      avgift: true,
      slut: true,
      avgiftNotering: '',
      slutNotering: '',
    },
  ],
};

/** Start-staten för betalningsarbetsytan (per event-id; okänt id → demo-1,
    speglar demoEventById — aldrig tom yta i demo-läget). */
function initBetalningar(eventId: string): BetalningsRad[] {
  return (DEMO_BETALNINGAR[eventId] ?? DEMO_BETALNINGAR['demo-1']).map((rad) => ({
    ...rad,
    historik: rad.historik ?? [],
  }));
}

/** K29: betalnings-krysset — RAC Checkbox i bibliotekets fält-grammatik
    (input-tokens; ibockad = mörk ruta + check, kalender-facitets
    bg-text/text-inverse-par). Obockad etikett i RÖTT fetstil — "vilka
    betalningar folk inte gjort" ska synas direkt (texten + tomma rutan
    bär; rött förstärker). */
function BetalKryss({
  label,
  vald,
  onChange,
}: {
  label: string;
  vald: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Checkbox
      isSelected={vald}
      onChange={onChange}
      className="group flex cursor-pointer items-center gap-2 text-small"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
        <Check
          aria-hidden="true"
          size={14}
          className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      <span className={vald ? 'text-text-secondary' : 'font-medium text-error'}>{label}</span>
    </Checkbox>
  );
}

/** K30 (Marcus: prosa-raden "ser så B ut"): deadline som STATUS-DATA —
    text + statusklass för badge-formen (listkortens status-slot-grammatik;
    Stripe "Past due"-badgen, docs.stripe.com/invoicing/dashboard).
    DYNAMIK: värdet BERÄKNAS ur eventdatumet (demo-regeln start − 14 d;
    basens verkliga deadline-fält/formel = PRD-fråga) och färgen följer
    läget: lugnt → neutral · imorgon/idag → warning · passerad → error.
    Aldrig rå negativ siffra (Gunilla; referensens "-106"). */
function deadlineStatus(e: ProtoEvent): { text: string; cls: string } | null {
  if (!e.startdatum) return null;
  const start = new Date(e.startdatum);
  if (Number.isNaN(start.getTime())) return null;
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() - 14);
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  const diff = Math.round((deadline.getTime() - idag.getTime()) / 86_400_000);
  const datum = DAGMANAD.format(deadline);
  if (diff > 1) return { text: `Deadline ${datum} · om ${diff} dagar`, cls: 'text-text-secondary' };
  if (diff === 1) return { text: `Deadline ${datum} · imorgon`, cls: 'font-medium text-warning' };
  if (diff === 0) return { text: 'Deadline idag', cls: 'font-medium text-warning' };
  return { text: `Deadline passerad · ${datum}`, cls: 'font-medium text-error' };
}

/** K27: disclosure-raden — "Öppna detaljer" ↔ "Stäng detaljer" på
    Öppna-radens plats (samma centrerade radform); chevron-down roterar
    (disclosure-branschformen, skild från navigationsradernas
    höger-chevron). */
function DetaljRad({
  oppen,
  kontrollerarId,
  onToggle,
}: {
  oppen: boolean;
  kontrollerarId: string;
  onToggle: () => void;
}) {
  return (
    <div className="py-3">
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={kontrollerarId}
        onClick={onToggle}
        className="flex w-full items-center justify-center gap-2 font-medium text-body"
      >
        {oppen ? 'Stäng detaljer' : 'Öppna detaljer'}
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={`shrink-0 text-text-secondary motion-safe:transition-transform ${oppen ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}

/** K31 (Marcus: "notering för avgiften OCH slutbetalningen — en
    notisruta håller inte"): EN LINJE PER BETALNING — kryss + etikett i
    fast kolumn (w-40, likbredds-läxan K13: gemensam skanlinje) och
    betalningens EGEN notering på samma linje. Statusen och dess
    anteckning läses ihop (Stripe-klassen: per-betalnings-memo).
    K32 (Marcus): exempel-placeholdern RIVEN (placeholder-som-instruktion
    är antimönstret — försvinner vid skrivning; aria-etiketten bär) +
    PÅMINN-mailikonen höger om notisraden — per-betalnings-mailto med
    betalningen i ämnesraden (Eventmanagers påminnelse-väg, read-only-
    säker; skarpa flödet = send-email-EF:ns payment-typ). Visas ENDAST
    på obetalda linjer (påminnelse om ibockad betalning är meningslös;
    Klara-fliken hålls ren) — formval, rivs på Marcus-ord. */
function BetalningsLinje({
  label,
  namn,
  epost,
  eventNamn,
  vald,
  notering,
  onVald,
  onNotering,
  onPaminn,
}: {
  label: string;
  namn: string;
  epost: string;
  eventNamn: string;
  vald: boolean;
  notering: string;
  onVald: (v: boolean) => void;
  onNotering: (v: string) => void;
  /** K34: ikon-klicket loggar en historik-post (minnes-state; skarpt
      loggar send-email-EF:n — mailto öppnar bara Lottas mailklient). */
  onPaminn: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <div className="w-40 shrink-0">
        <BetalKryss label={label} vald={vald} onChange={onVald} />
      </div>
      <Input
        size="sm"
        label={`Notering ${label.toLowerCase()} för ${namn}`}
        hideLabel
        className="min-w-44 flex-1"
        value={notering}
        onChange={onNotering}
      />
      {/* K33 (Marcus): ikon-SLOTTEN alltid renderad (likbredds-läxan K13)
          — alla notisrutor exakt samma bredd, med eller utan ikon. */}
      <div className="size-8 shrink-0">
        {!vald && (
          <a
            href={`mailto:${epost}?subject=${encodeURIComponent(`Påminnelse: ${label.toLowerCase()} för ${eventNamn}`)}`}
            aria-label={`Påminn ${namn} om ${label.toLowerCase()} via mail`}
            onClick={onPaminn}
            className="flex size-8 items-center justify-center rounded-full text-text-secondary hover:text-text"
          >
            <Mail aria-hidden="true" size={16} />
          </a>
        )}
      </div>
    </div>
  );
}

/** K34: historik-postens utskrift — "Påminnelse om X skickad 16 juli"
    (DAGMANAD, aldrig rå ISO — Gunilla). */
function paminnelseText(post: PaminnelsePost): string {
  const vad = post.betalning === 'avgift' ? 'anmälningsavgift' : 'slutbetalning';
  const datum = new Date(post.skickad);
  const nar = Number.isNaN(datum.getTime()) ? post.skickad : DAGMANAD.format(datum);
  return `Påminnelse om ${vad} skickad ${nar}`;
}

/** K29: person-raden i arbetsytan — namnet länkar till person-detaljvyn
    (demo-personId; skarpt bär shapen riktiga person-id — PRD); K31: två
    betalnings-linjer med egna noteringar; K32: påminn-ikonen per linje
    (eventnamnet in i ämnesraden); K34: HISTORIKEN under linjerna —
    skickade påminnelser skrivs ut (tyst tidslinje-form, Stripe activity-
    klassen; MailCheck-ikonen dekorativ) och påminn-klick loggar live. */
function BetalningsPersonRad({
  person,
  eventNamn,
  onUppdatera,
}: {
  person: BetalningsRad;
  eventNamn: string;
  onUppdatera: (patch: Partial<BetalningsRad>) => void;
}) {
  const loggaPaminnelse = (betalning: PaminnelsePost['betalning']) =>
    onUppdatera({
      historik: [...person.historik, { betalning, skickad: new Date().toISOString().slice(0, 10) }],
    });
  return (
    <li className="flex flex-col gap-2 py-3">
      <Link
        to="/personer/$personId"
        params={{ personId: person.personId }}
        className="self-start font-medium text-body underline-offset-2 hover:underline"
      >
        {person.namn}
      </Link>
      <BetalningsLinje
        label="Anmälningsavgift"
        namn={person.namn}
        epost={person.epost}
        eventNamn={eventNamn}
        vald={person.avgift}
        notering={person.avgiftNotering}
        onVald={(v) => onUppdatera({ avgift: v })}
        onNotering={(v) => onUppdatera({ avgiftNotering: v })}
        onPaminn={() => loggaPaminnelse('avgift')}
      />
      <BetalningsLinje
        label="Slutbetalning"
        namn={person.namn}
        epost={person.epost}
        eventNamn={eventNamn}
        vald={person.slut}
        notering={person.slutNotering}
        onVald={(v) => onUppdatera({ slut: v })}
        onNotering={(v) => onUppdatera({ slutNotering: v })}
        onPaminn={() => loggaPaminnelse('slut')}
      />
      {person.historik.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {person.historik.map((post) => (
            <li
              key={`${post.betalning}-${post.skickad}-${person.historik.indexOf(post)}`}
              className="flex items-center gap-1.5 text-caption text-text-muted"
            >
              <MailCheck aria-hidden="true" size={12} className="shrink-0" />
              {paminnelseText(post)}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** K29: detalj-innehållet — betalningsarbetsytan. K30 (Marcus: toppen
    saknade struktur — "behöver vi tabbar?"; web-research bekräftar:
    Stripe Invoices filtrerar per status med tabbar/chips): grupp-
    rubrikerna ersatta av FLIKAR i familje-kapseln (S72-facitets
    period-toggle-form — samma aria-pressed-fieldset; spåret
    bg-bg-emphasized på tonala kortet, vit knopp + skugga) + deadline
    som STATUS-BADGE (listkortens status-slot-form: bg-surface-pill +
    statusfärgad text). Kryssen flyttar personen mellan flikarna live —
    räknarna i flik-etiketterna följer. */
function BetalningsDetaljer({
  event,
  betalningar,
  onUppdatera,
}: {
  event: ProtoEvent;
  betalningar: BetalningsRad[];
  onUppdatera: (epost: string, patch: Partial<BetalningsRad>) => void;
}) {
  const [flik, setFlik] = useState<'saknar' | 'klara'>('saknar');
  const deadline = deadlineStatus(event);
  const saknar = betalningar.filter((p) => !p.avgift || !p.slut);
  const klara = betalningar.filter((p) => p.avgift && p.slut);
  const lista = flik === 'saknar' ? saknar : klara;
  const flikKnapp = (denna: 'saknar' | 'klara', etikett: string) => (
    <KapselKnapp aktiv={flik === denna} onClick={() => setFlik(denna)}>
      {etikett}
    </KapselKnapp>
  );
  return (
    <div className="flex flex-col gap-3 py-3">
      <fieldset className="grid grid-cols-2 rounded-full bg-bg-emphasized p-1">
        <legend className="sr-only">Visa betalningar</legend>
        {flikKnapp('saknar', `Saknar betalning (${saknar.length})`)}
        {flikKnapp('klara', `Klara (${klara.length})`)}
      </fieldset>
      {deadline && (
        <p
          className={`inline-flex items-center gap-1.5 self-start rounded-full bg-surface px-2.5 py-1 text-small ${deadline.cls}`}
        >
          <Clock aria-hidden="true" size={14} />
          {deadline.text}
        </p>
      )}
      {lista.length > 0 ? (
        <ul className="divide-y divide-border">
          {lista.map((p) => (
            <BetalningsPersonRad
              key={p.epost}
              person={p}
              eventNamn={eventName(event)}
              onUppdatera={(patch) => onUppdatera(p.epost, patch)}
            />
          ))}
        </ul>
      ) : (
        <p className="py-2 text-small text-text-secondary">
          {flik === 'saknar'
            ? 'Alla anmälda har betalat.'
            : 'Ingen är klar med båda betalningarna ännu.'}
        </p>
      )}
    </div>
  );
}

/** K3: åtgärdsrad i kortbotten (IMG_1542:s "Ändra"-rad) — centrerad
    länkrad; avdelaren mot raderna ovanför bärs av kortets divide-y. */
function AtgardsRad({
  to,
  eventId,
  children,
}: {
  to: '/event/$eventId/betalning' | '/event/$eventId/narvaro' | '/event/$eventId/anmalda';
  eventId: string;
  children: string;
}) {
  return (
    <div className="py-3">
      <Link
        to={to}
        params={{ eventId }}
        className="flex items-center justify-center font-medium text-body underline-offset-2 hover:underline"
      >
        {children}
      </Link>
    </div>
  );
}

/**
 * Demo-uppslaget: samma event som list-prototypens kort (per id). Okänt id
 * (t.ex. direkt-URL med verkligt id i demo-läge) → första kommande
 * demo-eventet som representativ bild — aldrig 404 i demo-läget (Marcus
 * ska aldrig mötas av en vägg i konvergensen).
 */
export function demoEventById(eventId: string): ProtoEvent {
  return DEMO_EVENTS.find((e) => e.id === eventId) ?? DEMO_EVENTS[0];
}

/* ── Prototypen ── */

export function EventDetailPrototype({ eventId, useDemo }: { eventId: string; useDemo: boolean }) {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const {
    data: fetched,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => dataSource.fetchEvent(eventId),
    enabled: !useDemo,
    // 4xx (inkl. 404) är klient-fel → meningslöst att retrya (speglar fetchPerson).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  // K11: Ändra-lägets minnes-state — override läggs ÖVER visnings-eventet
  // (ren minnes-yta, inga writes; sidladdning nollställer — read-only-regeln).
  // K14: staten sektions-typad — EN sektion redigeras i taget (att öppna en
  // stänger den andra; per-sektion-redigeringens lugn, Stripe/Polaris-klassen).
  const [redigerar, setRedigerar] = useState<'om' | 'belaggning' | null>(null);
  const [override, setOverride] = useState<Partial<ProtoEvent>>({});
  // K27 (Marcus: "stanna på samma sida"): betalningsdetaljerna inline.
  const [visaBetalningsdetaljer, setVisaBetalningsdetaljer] = useState(false);
  // K29: betalningsarbetsytans minnes-state — kryssen/noteringarna lever
  // här så kortets räknings-rader och deltan följer LIVE (inga writes).
  const [betalningar, setBetalningar] = useState(() => initBetalningar(eventId));
  const uppdateraBetalning = (epost: string, patch: Partial<BetalningsRad>) =>
    setBetalningar((rader) => rader.map((r) => (r.epost === epost ? { ...r, ...patch } : r)));

  const bas: ProtoEvent | undefined = useDemo ? demoEventById(eventId) : fetched;
  const event: ProtoEvent | undefined = bas ? { ...bas, ...override } : undefined;
  const notFound = error instanceof EdgeFunctionError && error.status === 404;

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning).
  useEffect(() => {
    if (event && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = `${eventName(event)} — Miranon Media Admin`;
    }
  }, [event]);

  // K2: sid-chromen står ALLTID i slutgeometri — bara innehållsytan
  // växlar mellan ladd/fel/laddat (Lugnt laddläge §15).
  // K8: h1 "Eventdetaljer" riven — ENTITETENS NAMN är h1 (Polaris Page
  // backAction + title; Stripe/GitHub-klassen).
  // K10 (Marcus): kontext-etiketten "Eventdetaljer" RIVEN — chevronen
  // ensam bär "detta är en undersida", i RUBRIKSTORLEK (44 px-knapp,
  // samma optiska vikt som list-flikens Event-h1; FK IMG_1542:s stora
  // runda back-knapp). 44 px = touch-target-golvet på köpet.
  // Skärmläsaren får målet via aria-label ("Tillbaka till event");
  // search-genomslaget bevarat.
  // K19 (Marcus): K18:s Skriv ut-knapp på toppraden REVS — den bröt mot
  // titelradens metadata-vikt (EventKey-pillen precis under). Utskriften
  // bor nu som rad i Åtgärds-gruppen; toppraden åter chevronen ensam (K10).
  const sidRam = (innehall: React.ReactNode) => (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <Link
        to="/event"
        search={(prev) => prev}
        aria-label="Tillbaka till event"
        className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>
      {innehall}
    </section>
  );

  if (!useDemo && isPending) {
    // Lugnt laddläge (grund-arvet, §15): skeleton i slutgeometri — identitets-
    // blocket + tre tonala kortytor; Roselli-anatomin (status + busy + sr-besked).
    return sidRam(
      <div role="status" aria-busy="true" className="flex flex-col gap-6">
        <span className="sr-only">Laddar event…</span>
        <Skeleton variant="text" className="w-3/5 text-3xl" />
        <Skeleton variant="listRow" className="h-44 rounded-2xl" />
        <Skeleton variant="listRow" className="h-32 rounded-2xl" />
        <Skeleton variant="listRow" className="h-36 rounded-2xl" />
      </div>,
    );
  }

  if (!useDemo && isError) {
    return sidRam(
      notFound ? (
        <MessageBox intent="error" title="Eventet hittades inte">
          Inget event med det ID:t finns. Det kan ha tagits bort, eller så är länken felaktig.
        </MessageBox>
      ) : (
        <MessageBox intent="error" title="Kunde inte hämta eventet">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      ),
    );
  }

  if (!event) return null; // nås ej: demo är synkron, verklig täcks ovan

  return sidRam(
    <>
      {/* aria-live: bekräftar för skärmläsare att eventet anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Event ${eventName(event)} laddat.`}
      </p>

      {/* K7 (Marcus: identiteten ska läsas som LÅST kontext, inte fält):
          identiteten UR kortet → SIDHUVUD på ren bakgrund (Polaris
          Resource details layout: page header + titleMetadata-badge;
          Eventmanagers egen h1 + avdelare; Stripe/Linear-klassen).
          Kort = arbetsbara grupper (Ändra-rader); det som INTE ligger i
          ett kort läses som kontext — placeringen ÄR lås-signalen,
          inga lås-ikoner. Pillen (K5, basens EventKey) blir
          titleMetadata; indraget px-4 = kortens inner-inset-linjering;
          tunn avdelare under (Eventmanager-formen). */}
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        {/* K8: eventnamnet ÄR sidrubriken (h1, 30/600 per rubrikpolicyn);
            fokusmålet + document.title bär samma identitet.
            K9 (Marcus): EventKey-pillen på TITELRADEN till höger —
            Polaris titleMetadata/Stripe-ID-chippens plats; liten mot
            titeln (text-small, inte titel-storlek — metadata ska inte
            konkurrera med materian). */}
        <div className="flex items-center justify-between gap-3">
          <h1 ref={headingRef} tabIndex={-1} className="min-w-0 break-words font-semibold text-3xl">
            {eventName(event)}
          </h1>
          {event.eventKey && (
            <span className="shrink-0 rounded-full bg-bg-muted px-3 py-1 font-medium text-small text-text-secondary">
              {event.eventKey}
            </span>
          )}
        </div>
        {event.tidKvarTillEvent && (
          <p className="text-small text-text-muted">{event.tidKvarTillEvent}</p>
        )}
      </header>

      {/* K23 (Marcus): check-in är EVENTDAGENS PRIMÄRHANDLING — egen
          framhävd ingång ÖVER Åtgärds-listan (Eventbrite/Luma-klassen),
          aldrig en rad i den. K24: K23:s svarta primärknapp REVS (tung
          fylld bar främmande i kort+rad-grammatiken) → NavCard-form.
          K26 (Marcus): kortet i EXAKT åtgärdsradernas form — samma
          HandlingsRad (ikon 16 · py-3 · font-medium · chevron 18) i ett
          eget kort-skal (ProtoGrupp-kortens yta, utan rubrik); det
          speciella bärs av placeringen + ensamheten, inte av avvikande
          mått. PROTOTYP-NO-OP: check-in-sidan (dörr-optimerad närvaro,
          per-session mot Deltaganden) är PRD-krav — knappen nu, sidan
          senare (Marcus-order). Chevron per K25-prövningen. */}
      <div className="rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
        <HandlingsRad ikon={UserCheck}>Gå till check-in</HandlingsRad>
      </div>

      {/* K19 (Marcus): Åtgärds-gruppen ÖVERST — sidans operativa handlingar
          samlade före datagrupperna (Omedelbarhet: på eventdagar är
          åtgärderna sidans poäng). Rubriken behålls — grupp-grammatikens
          konsekvens (varje kort har rubrik utanför). Urvalet justeras i
          senare K-steg på Marcus-beslut. */}
      <ProtoGrupp id="proto-grupp-atgarder" rubrik="Åtgärder">
        <LaggTillRad eventId={eventId} />
        {/* K47 (Marcus — "samma överallt"): ikon-grammatiken sluten —
            kuvertet (Mail) på VARJE skicka mail-handling (kort-knappen,
            Bekräfta alla, Påminn i betalningsdetaljerna, utskicksraderna
            här); MailCheck är reserverad för skickat-STATUS. Send +
            BellRing utgår ur sidan. */}
        <HandlingsRad ikon={Mail}>Skicka bekräftelsemail till obekräftade</HandlingsRad>
        <HandlingsRad ikon={Mail}>Skicka betalningspåminnelse till obetalda</HandlingsRad>
        <HandlingsRad ikon={BadgeCheck}>Markera alla obetalda som betalda</HandlingsRad>
        <HandlingsRad ikon={Mail}>Skicka eventinfo till alla anmälda</HandlingsRad>
        <HandlingsRad ikon={Printer} onPress={() => window.print()}>
          Skriv ut denna detaljsida
        </HandlingsRad>
      </ProtoGrupp>

      <ProtoGrupp id="proto-grupp-om" rubrik="Om eventet">
        {redigerar === 'om' ? (
          <I18nProvider locale="sv-SE">
            <OmEventetForm
              event={event}
              onSpara={(v) => {
                setOverride((o) => ({ ...o, ...v }));
                setRedigerar(null);
              }}
              onAvbryt={() => setRedigerar(null)}
            />
          </I18nProvider>
        ) : (
          <>
            <dl className="divide-y divide-border">
              <FkRad term="Typ">{event.typ}</FkRad>
              <FkRad term="Ort">{event.ort}</FkRad>
              <FkRad term="Datum">{datumSpannText(event)}</FkRad>
              <FkRad term="Status">{event.status}</FkRad>
            </dl>
            <AndraRad onPress={() => setRedigerar('om')} />
          </>
        )}
      </ProtoGrupp>

      <ProtoGrupp id="proto-grupp-belaggning" rubrik="Beläggning">
        {redigerar === 'belaggning' ? (
          <I18nProvider locale="sv-SE">
            <BelaggningForm
              event={event}
              onSpara={(v) => {
                setOverride((o) => ({ ...o, ...v }));
                setRedigerar(null);
              }}
              onAvbryt={() => setRedigerar(null)}
            />
          </I18nProvider>
        ) : (
          <>
            {/* K16 (Marcus-modellen): radordningen är Marcus' — taket först,
                sedan kategorierna som fyller det. Prickarna == stapelns
                segment; "via formulär"-pillen bär käll-distinktionen
                (basens Källa TOM = formuläranmälan). */}
            <dl className="divide-y divide-border">
              <FkRad term="Max antal platser">
                {event.maxPlatser != null ? String(event.maxPlatser) : null}
              </FkRad>
              <FkRad term="Reserverade" prick={KATEGORI.reserverad}>
                {event.reserverade != null ? String(event.reserverade) : null}
              </FkRad>
              <FkRad term="Anmälda deltagare" prick={KATEGORI.formular}>
                {String(event.antalAnmalda)}
              </FkRad>
              <FkRad term="Manuellt tillagda" prick={KATEGORI.manuell}>
                {event.manuelltTillagda != null ? String(event.manuelltTillagda) : null}
              </FkRad>
              <FkRad term="Medföljande" prick={KATEGORI.medfoljande}>
                {event.medfoljande != null ? String(event.medfoljande) : null}
              </FkRad>
              {/* K22 (Marcus): Väntelistan ALLTID med — det är alternativet
                  när taket är nått. UTAN prick: väntande upptar inga
                  platser (aldrig segment i mätaren) — prick-grammatiken
                  bär innanför/utanför-taket-distinktionen. */}
              <FkRad term="Väntelista">
                {event.vantelista != null ? String(event.vantelista) : null}
              </FkRad>
            </dl>
            {/* K15: fotnotsraden ersatt av mätaren (IMG_1542-fotnotens plats,
                listans stapel-grammatik) — sammanfattningen fortsatt som TEXT. */}
            <BelaggningsMatare event={event} />
            <AndraRad onPress={() => setRedigerar('belaggning')} />
          </>
        )}
      </ProtoGrupp>

      {/* K35 (Marcus): Anmälda deltagare ÖVER Betalningar. K36: Airtable-
          referensens form (grå panel + vita personkort). K38 (Marcus:
          "inte tydligt nog — struktur/sammanfattning upptill, tabbar som
          betalningsdetaljerna"): mail-SAMMANFATTNINGEN överst (FkRad +
          Betalningars röda saknas-delta — "hur många") + kategori-
          FLIKARNA i familje-kapseln ("vilka"; filtrerar korten). */}
      <ProtoGrupp id="proto-grupp-deltagare" rubrik="Anmälda deltagare">
        <DeltagarLista eventId={eventId} event={event} />
      </ProtoGrupp>

      <ProtoGrupp id="proto-grupp-betalning" rubrik="Betalningar">
        {/* K27 (Marcus): saknas-DELTAT i rött bredvid räkningen —
            minustecknet är bäraren (text), rött förstärker (färg aldrig
            ensam); visas endast vid avvikelse. Gamla "Slutbetalning
            saknas"-avvikelseraden ERSATT av deltat på sin räknings-rad
            (samma information, en rad mindre). K29: räkningarna härleds
            LIVE ur arbetsytans state — Lottas kryss räknar ner deltat
            direkt (Omedelbarhet; demo-substratet, ej event-aggregaten). */}
        <dl className="divide-y divide-border">
          <FkRad term="Anmälningsavgifter">
            {`${betalningar.filter((b) => b.avgift).length} av ${betalningar.length} mottagna`}
            {betalningar.some((b) => !b.avgift) && (
              <span className="ml-2 font-medium text-error tabular-nums">
                −{betalningar.filter((b) => !b.avgift).length}
              </span>
            )}
          </FkRad>
          <FkRad term="Slutbetalningar">
            {`${betalningar.filter((b) => b.slut).length} mottagna`}
            {betalningar.some((b) => !b.slut) && (
              <span className="ml-2 font-medium text-error tabular-nums">
                −{betalningar.filter((b) => !b.slut).length}
              </span>
            )}
          </FkRad>
        </dl>
        {/* K27: navigationen till betalnings-vyn ERSATT av inline-detaljer
            (Marcus: "stanna på samma sida"). K28: toggeln + regionen i EN
            wrapper — detaljerna hör till toggeln och ska inte få kortets
            divide-y-avdelare mellan sig (Marcus-fix). */}
        <div>
          <DetaljRad
            oppen={visaBetalningsdetaljer}
            kontrollerarId="proto-betalningsdetaljer"
            onToggle={() => setVisaBetalningsdetaljer((v) => !v)}
          />
          <div id="proto-betalningsdetaljer" hidden={!visaBetalningsdetaljer}>
            <BetalningsDetaljer
              event={event}
              betalningar={betalningar}
              onUppdatera={uppdateraBetalning}
            />
          </div>
        </div>
      </ProtoGrupp>

      <ProtoGrupp id="proto-grupp-narvaro" rubrik="Närvaro">
        <NarvaroLista eventId={eventId} event={event} />
      </ProtoGrupp>

      <ProtoGrupp id="proto-grupp-anmalda" rubrik="Anmälda">
        {/* Ingen anmälda-siffra i get-event-shapen — gissa inte fält; länka bara
            (speglar närvaro-gruppens form). */}
        <AtgardsRad to="/event/$eventId/anmalda" eventId={eventId}>
          Öppna anmälda-vyn
        </AtgardsRad>
      </ProtoGrupp>
    </>,
  );
}
