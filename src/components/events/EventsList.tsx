import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CalendarDays, CalendarPlus, List } from 'lucide-react';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import {
  aktivaFilterBeskrivning,
  antalAktivaFilter,
  type FilterDimension,
  FilterRad,
  filterRaknartext,
} from '@/components/primitives/FilterRad';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { EventStatus, type EventStatusValue } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';
import { dateValue, EventCard, type Period } from './EventCard';
import { EventsCalendar } from './EventsCalendar';
// Månadsgrupperingen är DELAD sedan task-18.18 (eventväljaren blev andra
// konsumenten — facit punkt 9: två grammatiker för samma sak är drift).
import { groupByMonth } from './manadsgrupp';

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

/** Filterdimensionerna (task-17.7) — Event-modellens tre kategoriska fält. */
type FilterDim = 'typ' | 'ort' | 'status';
/** Etikett + nolläge per dimension; alternativen härleds ur källan nedan. */
const DIM_FORM: Record<FilterDim, { etikett: string; nollage: string }> = {
  typ: { etikett: 'Typ', nollage: 'Alla typer' },
  ort: { etikett: 'Ort', nollage: 'Alla orter' },
  status: { etikett: 'Status', nollage: 'Alla statusar' },
};
/** Status i basens KANONISKA ordning (ORDLISTA "Period"-distinktionen) — aldrig alfabetisk. */
const STATUS_ORDNING: EventStatusValue[] = [
  EventStatus.PLANERAT,
  EventStatus.GENOMFORT,
  EventStatus.INSTALLT,
  EventStatus.FLYTTAT,
];

/** Räknarens substantiv. "Event" är oböjt i plural — ental = flertal. */
const EVENT_ENHET = { ental: 'event', flertal: 'event' };

/** Långdatum för utskriftshuvudets "Utskrivet …" (samma form som kortens datumrad). */
const LANGDATUM_IDAG = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

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
 * FILTERVYN (task-17.7; S83-prototyp-facit k02, Marcus-låst 2026-07-24):
 * ytan är `FilterRad`-primitiven (tratt-ingång, disclosure-panel, räknare,
 * Rensa, Skriv ut) — dess docblock äger FORMEN och researchen bakom den
 * (`docs/research/filtervy-listor-monster-2026-07-24.md`). Vad som är
 * EVENT-listans eget:
 * - TRE dimensioner Typ · Ort · Status, med värden härledda ur HELA källan
 *   (stabila över periodbyte), typ/ort sv-alfabetiskt, status i kanonisk
 *   ordning. ETT val per dimension (flerval medvetet avstått — byggs ej
 *   "ifall"), AND över dimensioner, LIVE utan Apply-knapp.
 * - Filtret appliceras på den PERIODFILTRERADE listan; räknaren
 *   "Visar X av Y event" i panelfoten + aria-live-bekräftelse; eget
 *   filter-tomläge SKILJT från period-tomläget.
 * - URL-delbart: `?typ`/`?ort`/`?status` (nuqs; null tar bort parametern →
 *   REN URL utan filter, clearOnDefault-klassens beteende; status
 *   enum-parsas mot kanoniska värden så ogiltiga params är inerta).
 *   Kalenderläget berörs EJ av filtret (kalendern äger tiden, PRD beslut 7);
 *   params består i URL:en precis som ?period.
 * - Skriv ut (panelfoten): window.print() — utskriften ÄR den synliga
 *   filtrerade listan. @media print döljer nav + kontroller via Tailwinds
 *   print-variant (`print:hidden` — GOV.UK-idiomets återanvändbara
 *   utility-klass, motsvarigheten till govuk-!-display-none-print; aldrig
 *   engångs-CSS per komponent) och renderar print-huvudet
 *   "Event — {Period}[ · {aktiva filter}] · {N} event · Utskrivet {datum}"
 *   (facit k02-print — pappret bär kontexten skärmen bär implicit).
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

  // Filtervalen i URL:en (task-17.7, URL-BESLUTET Marcus 2026-07-24):
  // null = inget filter = parametern BORTA (ren URL — nuqs tar bort
  // parametern vid null, clearOnDefault-klassens beteende). typ/ort är
  // fria strängar (värdena härleds ur källan); status enum-parsas mot de
  // kanoniska värdena så ogiltiga params (t.ex. gamla ?status=past) är
  // inerta i stället för att bli tomma träffmängder. history push = filter
  // är delbara OCH back-bara (URL-STATE-SPEC §Back-knapp-beteende).
  const [typ, setTyp] = useQueryState('typ', parseAsString.withOptions({ history: 'push' }));
  const [ort, setOrt] = useQueryState('ort', parseAsString.withOptions({ history: 'push' }));
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringEnum(STATUS_ORDNING).withOptions({ history: 'push' }),
  );
  const valda: Record<FilterDim, string | null> = {
    typ: typ || null,
    ort: ort || null,
    status: status ?? null,
  };
  // Rensa-knapparna unmountas i samma tryck (aktiva → 0) — fokus flyttas
  // därför programmatiskt till tratt-knappen (filter-ytans stabila ankare)
  // så tangentbords-/skärmläsarfokus aldrig faller till body
  // (review-pilotens fynd 2; a11y-golvet 11).
  const filterKnappRef = useRef<HTMLButtonElement>(null);
  const rensaFilter = () => {
    setTyp(null);
    setOrt(null);
    setStatus(null);
    filterKnappRef.current?.focus();
  };

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

  // Dropdown-alternativen ur HELA källan (STABILA över periodbyte — byggkrav
  // 2): typ/ort sv-alfabetiskt, status i kanonisk ordning. En dimension utan
  // värden i källan renderar ingen dropdown (inget att filtrera på).
  const alternativ = useMemo<Record<FilterDim, string[]>>(() => {
    const uniq = (vals: (string | null | undefined)[]) =>
      [...new Set(vals.filter((v): v is string => v != null))].sort((a, b) =>
        a.localeCompare(b, 'sv'),
      );
    const alla = data ?? [];
    return {
      typ: uniq(alla.map((e) => e.typ)),
      ort: uniq(alla.map((e) => e.ort)),
      status: uniq(alla.map((e) => e.status)).sort(
        (a, b) =>
          STATUS_ORDNING.indexOf(a as EventStatusValue) -
          STATUS_ORDNING.indexOf(b as EventStatusValue),
      ),
    };
  }, [data]);

  // Dimensionerna till FilterRad: form ur DIM_FORM, värden ur källan ovan.
  // Ordningen (typ · ort · status) ÄR panelens kolumnordning.
  const dimensioner = useMemo<FilterDimension[]>(
    () =>
      (['typ', 'ort', 'status'] as const).map((nyckel) => ({
        nyckel,
        etikett: DIM_FORM[nyckel].etikett,
        nollage: DIM_FORM[nyckel].nollage,
        alternativ: alternativ[nyckel],
      })),
    [alternativ],
  );
  const aktiva = antalAktivaFilter(dimensioner, valda);

  // Filtret appliceras på den PERIODFILTRERADE listan (byggkrav 3):
  // periodEvents är räknarens nämnare ("av Y"), events dess täljare.
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
    [periodEvents, valda.typ, valda.ort, valda.status],
  );
  const groups = useMemo(() => groupByMonth(events), [events]);

  /** "Typ: Kurs · Ort: Skövde" — utskriftshuvudets filterbeskrivning. */
  const aktivaBeskrivning = aktivaFilterBeskrivning(dimensioner, valda);

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

  // A11y: bekräfta live-filtreringen i samma region (byggkrav 3 — räknaren
  // + aria-live). Samma skip-first-diff som perioden; isPending-vakten
  // hindrar falska nollor i annonsen (ADR-078 beslut 2). Punkten skiljer
  // annonsen från panelfotens synliga räknartext.
  const filterNyckel = `${valda.typ}|${valda.ort}|${valda.status}`;
  const prevFilterNyckel = useRef(filterNyckel);
  useEffect(() => {
    if (isPending || prevFilterNyckel.current === filterNyckel) return;
    prevFilterNyckel.current = filterNyckel;
    setAnnouncement(`${filterRaknartext(events.length, periodEvents.length, EVENT_ENHET)}.`);
  }, [filterNyckel, events.length, periodEvents.length, isPending]);

  // Period-toggeln + filter-ingången i SAMMA rad, panelen som disclosure
  // under (facit k02; MOJ:s "Show filter"-toggle utan sidopanel-överbyggnad).
  // Formen ägs av FilterRad-primitiven; här bor bara det som är listans
  // eget: dimensionerna, urvalet och räknarens tal.
  const filterRad = (
    <FilterRad
      dimensioner={dimensioner}
      valda={valda}
      onValj={(nyckel, varde) => {
        if (nyckel === 'typ') setTyp(varde);
        else if (nyckel === 'ort') setOrt(varde);
        else setStatus(varde as EventStatusValue | null);
      }}
      onRensa={rensaFilter}
      visade={events.length}
      totalt={periodEvents.length}
      enhet={EVENT_ENHET}
      isPending={isPending}
      onSkrivUt={() => window.print()}
      triggerRef={filterKnappRef}
    >
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
    </FilterRad>
  );

  // Utskriftshuvudet (print-only; facit k02-print): period + aktiva filter +
  // antal + långdatum — pappret bär kontexten skärmen bär implicit
  // (GOV.UK:s länk-href-princip, öppet deklarerad syntes i researchen).
  const utskriftsHuvud = (
    <div className="hidden text-small text-text-secondary print:block">
      Event - {PERIOD_LABEL[period]}
      {aktivaBeskrivning ? ` · ${aktivaBeskrivning}` : ''} · {events.length} event · Utskrivet{' '}
      {LANGDATUM_IDAG.format(new Date())}
    </div>
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

  // Felläget delas av båda vylägena (samma datakälla, samma besked).
  const felRuta = (
    <MessageBox intent="error" title="Kunde inte hämta event">
      {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
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
      // Filter-tomläget (byggkrav 4) SKILJT från period-tomläget: här FINNS
      // event i perioden men filtren matchar inga — Rensa är återvägen
      // (research: tydlig återväg). Tom PERIOD visar period-tomläget även
      // med aktiva filter (det finns inget att rensa fram — facit-formen).
      if (aktiva > 0 && periodEvents.length > 0) {
        return (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium text-body">Inga event matchar filtren</p>
            <AriaButton
              onPress={rensaFilter}
              className="rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
            >
              Rensa filter
            </AriaButton>
          </div>
        );
      }
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
      {/* Utskriftshuvudet ENDAST i listläget: kalendern läser hela källan
          ofiltrerad, så list-/filterkontexten hade ljugit på pappret
          (review-pilotens fynd 1; byggkrav 5 — kalenderläget berörs ej). */}
      {!kalenderLage && utskriftsHuvud}
      {/* Vy-toggeln ÖVER period-toggeln, fast position i båda lägena; i
          kalenderläget ERSÄTTER kalenderns månadsnav period-toggeln (PRD
          beslut 7 — navet är kalenderns tidsnavigation) och filterraden
          följer med den (kalendern berörs ej av filtret, byggkrav 5). */}
      {vyRad}
      {!kalenderLage && filterRad}

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
