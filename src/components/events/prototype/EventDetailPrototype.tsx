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
import { CalendarDays, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Button as AriaButton,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  I18nProvider,
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
    stegLabel: 'K12 — sömlös morf: samma radgeometri i båda lägena',
  },
];

/* ── Hjälpare (kopierade ur EventDetail — medvetet odelade) ── */

/** Visat eventnamn ur de fält Airtable kan leverera — aldrig krasch/tomt. */
function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/** Beläggning som TEXT (färg aldrig ensam bärare). Null-säker: osatt tak → ingen NaN. */
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

/** K3 (IMG_1542-formen): key-value-RAD — etikett vänster, värde höger.
    Hoppar tomma värden. K6 (Marcus + branschmönstret): VIKTNINGEN
    inverterad mot FK-referensen — etiketten muted, VÄRDET primärt.
    Detta är data-display-konventionen (Ant Descriptions: label
    secondary/content primary; Tailwind UI description lists: dt muted,
    dd stark) — FK:s starka etiketter är settings-listans mönster, men
    denna yta är en LÄSYTA där värdena är materian. Avdelarna bärs av
    dl:ens divide-y (K6-fix: display:contents bröt selektorn — divide-y
    opererar på DOM-barn, inte layoutträdet). */
function FkRad({ term, children }: { term: string; children: React.ReactNode }) {
  if (children == null || children === '') return null;
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-small text-text-muted">{term}</dt>
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
function datumSpannText(e: Event): string {
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
function ProtoGrupp({
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
    'rounded px-0.5 tabular-nums outline-none data-[focused]:bg-bg-emphasized data-[placeholder]:text-(color:--mm-input-text-placeholder)';
  return (
    <DateRangePicker
      aria-label="Datum"
      value={value}
      onChange={onChange}
      className="flex flex-col gap-1"
    >
      <Group className="flex min-h-8 items-center justify-between gap-2 rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-2.5 text-small">
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
function RedigeringsRad({ term, children }: { term: string; children: React.ReactNode }) {
  // Bredds-taket bor på respektive fält (max-w-56), inte på slotten —
  // datumfältet behöver full radbredd för att aldrig radbrytas (K12-mätningen:
  // wrap gav 65 px-rad och 16 px-hopp).
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="shrink-0 text-small text-text-muted">{term}</dt>
      <dd className="flex flex-1 justify-end">{children}</dd>
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
        <RedigeringsRad term="Typ">
          <Select
            label="Typ"
            hideLabel
            size="sm"
            placeholder="Välj typ"
            selectedKey={typ}
            onSelectionChange={(k) => setTyp(k == null ? null : String(k))}
            className="max-w-56"
          >
            <SelectItem id="Utbildning">Utbildning</SelectItem>
            <SelectItem id="Föreläsning">Föreläsning</SelectItem>
          </Select>
        </RedigeringsRad>
        <RedigeringsRad term="Ort">
          <Input
            label="Ort"
            hideLabel
            size="sm"
            placeholder="Ort"
            value={ort}
            onChange={setOrt}
            className="max-w-56"
          />
        </RedigeringsRad>
        <RedigeringsRad term="Datum">
          <DatumFalt value={datum} onChange={setDatum} />
        </RedigeringsRad>
        <RedigeringsRad term="Status">
          <Select
            label="Status"
            hideLabel
            size="sm"
            placeholder="Välj status"
            selectedKey={status}
            onSelectionChange={(k) => setStatus(k == null ? null : String(k))}
            className="max-w-56"
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
function demoEventById(eventId: string): ProtoEvent {
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
  const [redigerar, setRedigerar] = useState(false);
  const [override, setOverride] = useState<Partial<ProtoEvent>>({});

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

  const percent = percentText(event);
  const full = isFull(event);

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

      <ProtoGrupp id="proto-grupp-om" rubrik="Om eventet">
        {redigerar ? (
          <I18nProvider locale="sv-SE">
            <OmEventetForm
              event={event}
              onSpara={(v) => {
                setOverride((o) => ({ ...o, ...v }));
                setRedigerar(false);
              }}
              onAvbryt={() => setRedigerar(false)}
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
            <AndraRad onPress={() => setRedigerar(true)} />
          </>
        )}
      </ProtoGrupp>

      <ProtoGrupp id="proto-grupp-belaggning" rubrik="Beläggning">
        <dl className="divide-y divide-border">
          <FkRad term="Max antal platser">
            {event.maxPlatser != null ? String(event.maxPlatser) : null}
          </FkRad>
          <FkRad term="Anmälda">{String(event.antalAnmalda)}</FkRad>
          <FkRad term="Platser kvar">
            {event.platserKvar != null ? String(event.platserKvar) : null}
          </FkRad>
        </dl>
        {/* Fotnotsraden (IMG_1542:s "Din adress hämtas från Skatteverket"):
            sammanfattningen som TEXT — färg aldrig ensam bärare. */}
        <p className="py-3 text-small text-text-muted">
          {belaggningText(event)}
          {full ? ' · Fullt' : ''}
          {percent ? ` · ${percent} fullt` : ''}
        </p>
        <AndraRad />
      </ProtoGrupp>

      <ProtoGrupp id="proto-grupp-betalning" rubrik="Betalningar">
        <dl className="divide-y divide-border">
          <FkRad term="Anmälningsavgifter">
            {`${event.antalAnmalningsavgifter} av ${event.antalAnmalda} mottagna`}
          </FkRad>
          <FkRad term="Slutbetalningar">{`${event.antalSlutbetalningar} mottagna`}</FkRad>
          {/* Eventmanager-raden "Antal slutbetalning saknas" — visas endast
              vid avvikelse (statusbadge-principens släkting: normalt är tyst). */}
          {event.antalSlutbetalningFelande > 0 && (
            <FkRad term="Slutbetalning saknas">{String(event.antalSlutbetalningFelande)}</FkRad>
          )}
        </dl>
        <AtgardsRad to="/event/$eventId/betalning" eventId={eventId}>
          Öppna betalnings-vyn
        </AtgardsRad>
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
