import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CalendarDays, CalendarPlus, Filter, List, Printer } from 'lucide-react';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button as AriaButton, Disclosure, DisclosurePanel } from 'react-aria-components';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
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
const DIM_LABEL: Record<FilterDim, string> = { typ: 'Typ', ort: 'Ort', status: 'Status' };
const DIM_NOLLAGE: Record<FilterDim, string> = {
  typ: 'Alla typer',
  ort: 'Alla orter',
  status: 'Alla statusar',
};
/** Status i basens KANONISKA ordning (ORDLISTA "Period"-distinktionen) — aldrig alfabetisk. */
const STATUS_ORDNING: EventStatusValue[] = [
  EventStatus.PLANERAT,
  EventStatus.GENOMFORT,
  EventStatus.INSTALLT,
  EventStatus.FLYTTAT,
];

/** Nolläges-nyckeln i dropdownsen ("Alla …") — sentinel skild från datavärden. */
const ALLA = '__alla';

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
 * FILTERVYN (task-17.7; S83-prototyp-facit k02, Marcus-låst 2026-07-24;
 * research: docs/research/filtervy-listor-monster-2026-07-24.md —
 * disclosure-bar = MOJ-mönstret, NN/g live-filtrering vid klientlokal data):
 * - Tratt-ingång HÖGER om period-toggeln (React Aria Disclosure — trigger
 *   får aria-expanded/aria-controls wirat); öppen/aktiv = bg-text-svärtan;
 *   siffer-badge (bg-accent) bär antalet aktiva val; sr-only-namnet bär
 *   "Visa/Dölj filter, N aktiva filterval" (MOJ-affordans-läxan: aktivt
 *   filter måste synas även med stängd panel).
 * - Panelen (DisclosurePanel, tonala kortets form): TRE Select-dropdowns
 *   Typ · Ort · Status — värden härledda ur HELA källan (stabila över
 *   periodbyte), typ/ort sv-alfabetiskt, status i kanonisk ordning; "Alla …"
 *   är nolläget. ETT val per dimension (flerval medvetet avstått — byggs ej
 *   "ifall"), AND över dimensioner, LIVE utan Apply-knapp (NN/g:s
 *   <1 s-villkor trivialt uppfyllt: datat är redan i klienten).
 * - Filtret appliceras på den PERIODFILTRERADE listan; räknaren
 *   "Visar X av Y event" i panelfoten + aria-live-bekräftelse; Rensa filter
 *   vid aktiva val; eget filter-tomläge SKILJT från period-tomläget.
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
  // Panelens öppet/stängt är HUR-state (useState, URL-STATE-SPEC §Princip)
  // — bara filterVALEN är delbara.
  const [filterOppen, setFilterOppen] = useState(false);

  const valda: Record<FilterDim, string | null> = {
    typ: typ || null,
    ort: ort || null,
    status: status ?? null,
  };
  const aktiva = (['typ', 'ort', 'status'] as const).filter((d) => valda[d] != null).length;
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
  const aktivaBeskrivning = (['typ', 'ort', 'status'] as const)
    .filter((dim) => valda[dim] != null)
    .map((dim) => `${DIM_LABEL[dim]}: ${valda[dim]}`)
    .join(' · ');

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
    setAnnouncement(`Visar ${events.length} av ${periodEvents.length} event.`);
  }, [filterNyckel, events.length, periodEvents.length, isPending]);

  // Period-toggeln + filter-ingången i SAMMA rad, panelen som disclosure
  // under (facit k02; MOJ:s "Show filter"-toggle utan sidopanel-överbyggnad).
  // React Aria Disclosure wirar trigger↔panel (aria-expanded/aria-controls,
  // Enter/Space, hidden-attribut på stängd panel) — ingen egen ARIA-mekanik.
  //
  // PANEL-ELEMENTET LÄMNAS OSTYLAT (Marcus-fix 2026-07-25, grundorsak
  // verifierad i react-arias useDisclosure-källa): stängd panel döljs med
  // hidden="until-found" ⇒ content-visibility: hidden — INNEHÅLLET döljs
  // men panel-elementets EGEN bakgrund/padding renderas, så visuella stilar
  // direkt på DisclosurePanel gav en tom grå rand i stängt läge. Bakgrund/
  // padding/rounded/gap bor därför på en INRE wrapper (försvinner med
  // innehållet), och rytmen mellan rad och öppen panel bärs av wrapperns
  // mt-6 — INTE av gap på roten (ett rot-gap hade lämnat 24 px dött
  // utrymme efter det 0 px höga panel-elementet i stängt läge).
  // print:hidden på roten: kontroller är meningslösa på papper
  // (GOV.UK-blacklisten).
  const filterRad = (
    <Disclosure
      isExpanded={filterOppen}
      onExpandedChange={setFilterOppen}
      className="flex flex-col print:hidden"
    >
      <div className="flex items-center gap-2">
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
        {/* Tratt-ingången: öppen/aktiv bär bg-text-svärtan (facit k02);
            badgen är dekor (aria-hidden) — sr-only-namnet bär antalet.
            Badge-texten är text-inverse på accent: ÖPPET BOKFÖRD
            facit-avvikelse från prototypens text-text (2,6:1 mot
            accent-kopparn — WCAG 1.4.3-golvet skärs aldrig; jfr
            Inställt-dämpningens bokförda avvikelse i task-17.2). */}
        <AriaButton
          ref={filterKnappRef}
          slot="trigger"
          className={`relative inline-flex shrink-0 items-center justify-center rounded-full p-2.5 motion-safe:transition-colors ${
            filterOppen || aktiva > 0
              ? 'bg-text text-text-inverse'
              : 'bg-bg-muted hover:bg-bg-emphasized'
          }`}
        >
          <Filter aria-hidden="true" size={18} className="shrink-0" />
          {aktiva > 0 ? (
            // text-[10px]: ÖPPET BOKFÖRD avvikelse från typografiskalan
            // (spec-regeln no-hardcoded-font-size) — badge-mikrotexten är
            // prototyp-facitets låsta form (k02) och skalan saknar steg
            // under text-caption; ett badge-skalsteg mintas först vid en
            // andra konsument (över-engineering-vakten). Review-pilotens
            // fynd 5, bokfört på kortet.
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-medium text-[10px] text-text-inverse"
            >
              {aktiva}
            </span>
          ) : null}
          <span className="sr-only">
            {filterOppen ? 'Dölj filter' : 'Visa filter'}
            {aktiva > 0 ? `, ${aktiva} ${aktiva === 1 ? 'aktivt' : 'aktiva'} filterval` : ''}
          </span>
        </AriaButton>
      </div>
      <DisclosurePanel data-testid="filter-panel">
        {/* Tonala kortets form på INRE wrappern (se rot-kommentaren): allt
            visuellt försvinner med innehållet när until-found döljer panelen. */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-bg-muted p-4">
          {isPending ? (
            // Lugnt laddläge i panelen (ADR-078 beslut 2+4): dropdown-formade
            // skelett i SLUTGEOMETRIN (label-rad + sm-fält = samma höjd som
            // Select) tills källan landat — alternativen kan inte härledas ur
            // ingenting, och en tom grid hade hoppat vid datalandningen.
            // Blocken är dekor (Skeleton är alltid aria-hidden); laddbeskedet
            // ägs av listkroppens status-region (Roselli-anatomin — EN region).
            <div className="grid gap-3 sm:grid-cols-3">
              {(['typ', 'ort', 'status'] as const).map((dim) => (
                <div key={dim} className="flex w-full flex-col gap-1">
                  <Skeleton variant="text" className="w-10 text-small" />
                  <Skeleton variant="text" className="h-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {/* En dimension utan värden i källan renderar ingen dropdown —
                bokförd degradering av byggkravets "TRE dropdowns" (review-
                pilotens fynd 6a, noterat på kortet): inget att filtrera på
                är ärligare än en död kontroll. Ett OKÄNT URL-värde (fri
                sträng, URL-beslutet) renderas som extra alternativ så
                triggern kommunicerar vad URL:en faktiskt filtrerar på —
                aldrig RAC:s råa placeholder (fynd 6b). */}
              {(['typ', 'ort', 'status'] as const).map((dim) => {
                // ALLA-vakten: en handskriven ?typ=__alla får inte skapa ett
                // dubblett-id bredvid nolläges-itemet (ompasseringens fynd —
                // RAC-kollektionen kräver unika nycklar).
                const okantVarde =
                  valda[dim] != null && valda[dim] !== ALLA && !alternativ[dim].includes(valda[dim])
                    ? valda[dim]
                    : null;
                return alternativ[dim].length > 0 ? (
                  <Select
                    key={dim}
                    data-testid={`filter-${dim}`}
                    label={DIM_LABEL[dim]}
                    size="sm"
                    selectedKey={valda[dim] ?? ALLA}
                    onSelectionChange={(k) => {
                      const varde = k == null || String(k) === ALLA ? null : String(k);
                      if (dim === 'typ') setTyp(varde);
                      else if (dim === 'ort') setOrt(varde);
                      else setStatus(varde as EventStatusValue | null);
                    }}
                  >
                    <SelectItem id={ALLA}>{DIM_NOLLAGE[dim]}</SelectItem>
                    {alternativ[dim].map((varde) => (
                      <SelectItem key={varde} id={varde}>
                        {varde}
                      </SelectItem>
                    ))}
                    {okantVarde != null ? (
                      <SelectItem id={okantVarde}>{okantVarde}</SelectItem>
                    ) : null}
                  </Select>
                ) : null;
              })}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-border-light border-t pt-3">
            {isPending ? (
              <Skeleton variant="text" className="w-32 text-small" />
            ) : (
              <span className="text-small text-text-secondary">
                Visar {events.length} av {periodEvents.length} event
              </span>
            )}
            <div className="flex items-center gap-2">
              {aktiva > 0 ? (
                <AriaButton
                  onPress={rensaFilter}
                  className="rounded-full px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
                >
                  Rensa filter
                </AriaButton>
              ) : null}
              {/* Skriv ut = den synliga filtrerade listan (byggkrav 5) —
                ingen parallell utskriftsvy. Kapseln i Skapa-ingångens
                grammatik, lyft på surface mot panelens tonala botten. */}
              <AriaButton
                onPress={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
              >
                <Printer aria-hidden="true" size={18} className="shrink-0" />
                Skriv ut
              </AriaButton>
            </div>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
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
