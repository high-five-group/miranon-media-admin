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
  BellRing,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
  MailCheck,
  Minus,
  Pencil,
  Plus,
  Printer,
  Send,
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
    stegLabel: 'K29 — betalningsarbetsytan (alla anmälda · kryss · notering · person-länk)',
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
        <FkRad term="Medföljande (+1)" prick={KATEGORI.medfoljande}>
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

type BetalningsRad = {
  personId: string;
  namn: string;
  epost: string;
  avgift: boolean;
  slut: boolean;
  notering: string;
};

/** Fiktiva demo-personer (aldrig verkliga namn ur basen — PII). Koherent
    med demo-1:s aggregat vid start: 5 av 8 avgifter, 2 av 8 slutbetalningar. */
const DEMO_BETALNINGAR: Record<string, BetalningsRad[]> = {
  'demo-1': [
    {
      personId: 'demo-p1',
      namn: 'Eva Lindqvist',
      epost: 'eva.lindqvist@example.com',
      avgift: false,
      slut: false,
      notering: '',
    },
    {
      personId: 'demo-p2',
      namn: 'Johan Berg',
      epost: 'johan.berg@example.com',
      avgift: false,
      slut: false,
      notering: '',
    },
    {
      personId: 'demo-p3',
      namn: 'Sara Nyström',
      epost: 'sara.nystrom@example.com',
      avgift: false,
      slut: false,
      notering: 'Lovade betala efter lönen',
    },
    {
      personId: 'demo-p4',
      namn: 'Peter Åkesson',
      epost: 'peter.akesson@example.com',
      avgift: true,
      slut: false,
      notering: '',
    },
    {
      personId: 'demo-p5',
      namn: 'Maria Holm',
      epost: 'maria.holm@example.com',
      avgift: true,
      slut: false,
      notering: '',
    },
    {
      personId: 'demo-p6',
      namn: 'Anders Ek',
      epost: 'anders.ek@example.com',
      avgift: true,
      slut: false,
      notering: '',
    },
    {
      personId: 'demo-p7',
      namn: 'Karin Sjögren',
      epost: 'karin.sjogren@example.com',
      avgift: true,
      slut: true,
      notering: 'Swishade 12/7',
    },
    {
      personId: 'demo-p8',
      namn: 'Lars Öhman',
      epost: 'lars.ohman@example.com',
      avgift: true,
      slut: true,
      notering: '',
    },
  ],
};

/** Start-staten för betalningsarbetsytan (per event-id; okänt id → demo-1,
    speglar demoEventById — aldrig tom yta i demo-läget). */
function initBetalningar(eventId: string): BetalningsRad[] {
  return (DEMO_BETALNINGAR[eventId] ?? DEMO_BETALNINGAR['demo-1']).map((rad) => ({ ...rad }));
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

/** Deadline-texten: betalningsdeadline = 14 dagar före eventstart
    (demo-antagande; basens verkliga deadline-formel = PRD-fråga).
    Formuleras på svenska EN gång — aldrig rå negativ siffra (Gunilla;
    bättre än referensens "-106" per rad). */
function deadlineText(e: ProtoEvent): string | null {
  if (!e.startdatum) return null;
  const start = new Date(e.startdatum);
  if (Number.isNaN(start.getTime())) return null;
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() - 14);
  const idag = new Date();
  idag.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  const diffDagar = Math.round((deadline.getTime() - idag.getTime()) / 86_400_000);
  const datum = LANGDATUM.format(deadline);
  if (diffDagar > 0) return `Betalningsdeadline ${datum} — om ${diffDagar} dagar`;
  if (diffDagar === 0) return `Betalningsdeadline ${datum} — idag`;
  return `Betalningsdeadline ${datum} — passerad för ${-diffDagar} dagar sedan`;
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

/** K29: person-raden i arbetsytan — namnet länkar till person-detaljvyn
    (demo-personId; skarpt bär shapen riktiga person-id — PRD), kryss per
    betalning, notering direkt i raden (Lottas flöde: bocka + skriv
    "Swishade 19/7" utan extra klick). */
function BetalningsPersonRad({
  person,
  onUppdatera,
}: {
  person: BetalningsRad;
  onUppdatera: (patch: Partial<BetalningsRad>) => void;
}) {
  return (
    <li className="flex flex-col gap-2.5 py-3">
      <Link
        to="/personer/$personId"
        params={{ personId: person.personId }}
        className="self-start font-medium text-body underline-offset-2 hover:underline"
      >
        {person.namn}
      </Link>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <BetalKryss
          label="Anmälningsavgift"
          vald={person.avgift}
          onChange={(v) => onUppdatera({ avgift: v })}
        />
        <BetalKryss
          label="Slutbetalning"
          vald={person.slut}
          onChange={(v) => onUppdatera({ slut: v })}
        />
      </div>
      <Input
        size="sm"
        label={`Notering för ${person.namn}`}
        hideLabel
        placeholder="Notering, t.ex. Swishade 19/7"
        value={person.notering}
        onChange={(v) => onUppdatera({ notering: v })}
      />
    </li>
  );
}

/** K29: detalj-innehållet — betalningsarbetsytan. Grupperna sorterar
    tydligheten: de som SAKNAR betalning först, klara sist; kryssen
    flyttar personen mellan grupperna live. */
function BetalningsDetaljer({
  event,
  betalningar,
  onUppdatera,
}: {
  event: ProtoEvent;
  betalningar: BetalningsRad[];
  onUppdatera: (epost: string, patch: Partial<BetalningsRad>) => void;
}) {
  const deadline = deadlineText(event);
  const saknar = betalningar.filter((p) => !p.avgift || !p.slut);
  const klara = betalningar.filter((p) => p.avgift && p.slut);
  return (
    <div className="flex flex-col gap-1 py-3">
      {deadline && <p className="text-small text-text-muted">{deadline}</p>}
      <h3 className="mt-2 font-semibold text-small">Saknar betalning ({saknar.length})</h3>
      {saknar.length > 0 ? (
        <ul className="divide-y divide-border">
          {saknar.map((p) => (
            <BetalningsPersonRad
              key={p.epost}
              person={p}
              onUppdatera={(patch) => onUppdatera(p.epost, patch)}
            />
          ))}
        </ul>
      ) : (
        <p className="py-2 text-small text-text-secondary">Alla anmälda har betalat.</p>
      )}
      {klara.length > 0 && (
        <>
          <h3 className="mt-3 font-semibold text-small">Klara ({klara.length})</h3>
          <ul className="divide-y divide-border">
            {klara.map((p) => (
              <BetalningsPersonRad
                key={p.epost}
                person={p}
                onUppdatera={(patch) => onUppdatera(p.epost, patch)}
              />
            ))}
          </ul>
        </>
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
        <HandlingsRad ikon={MailCheck}>Skicka bekräftelsemail till obekräftade</HandlingsRad>
        <HandlingsRad ikon={BellRing}>Skicka betalningspåminnelse till obetalda</HandlingsRad>
        <HandlingsRad ikon={BadgeCheck}>Markera alla obetalda som betalda</HandlingsRad>
        <HandlingsRad ikon={Send}>Skicka deltagarinformation till alla anmälda</HandlingsRad>
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
              <FkRad term="Medföljande (+1)" prick={KATEGORI.medfoljande}>
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
        {/* Ingen närvaro-siffra i get-event-shapen — gissa inte fält; länka bara. */}
        <AtgardsRad to="/event/$eventId/narvaro" eventId={eventId}>
          Öppna närvaro-vyn
        </AtgardsRad>
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
