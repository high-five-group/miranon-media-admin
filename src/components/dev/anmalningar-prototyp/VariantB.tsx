import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { dateValue } from '@/components/events/EventCard';
import { eventIdentitet } from '@/components/hem/hem-derivations';
import { relativTid } from '@/components/hem/relativ-tid';
import { InitialAvatar, ToggleButton, ToggleButtonGroup } from '@/components/primitives';
import {
  antalAktivaFilter,
  type FilterDimension,
  FilterRad,
  filterRaknartext,
} from '@/components/primitives/FilterRad';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import {
  atgardskoText,
  behoverAtgard,
  displayName,
  inskickadTid,
} from '@/components/registrations/registration-display';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { EventStatus, type EventStatusValue } from '@/domain/types/Status';
import { AnmalningRadResolution } from './AnmalningRadResolution';
import type { VariantProps } from './types';

/** `?period=` — utökar EventsLists tvåläges-toggel (Kommande/Tidigare) med
    ett nolläge ('alla', default) så AC #2s "ofiltrerad lista" förblir
    ofiltrerad tills Lotta uttryckligen väljer en period. Se docblocket
    nedan § FILTRET för hela motiveringen. */
type PeriodFilter = 'alla' | 'upcoming' | 'past';
const PERIOD_FILTER_VALUES: PeriodFilter[] = ['alla', 'upcoming', 'past'];
// KORTA ORD, EVENT-LEDET I ETIKETTEN — mätt vid 375 px, inte valt på känsla.
// "Alla event" bröt till TVÅ rader i en tredjedels `auto-cols-fr`-kolumn
// (varv 1 av QA-passet), och samma mätning gjordes 2026-08-23 på hela
// ordparet efter Marcus invändning ("Vad är 'Kommande anmälningar'
// liksom"): `Kommande event`/`Tidigare event` gav pillhöjd 64 px mot 40 och
// grupphöjd 72 mot 48 — alltså radbrytning i BÅDA pillren. Korta ord + en
// `Event`-rubrik ÖVER filterraden bär i stället att det är EVENTET som är
// kommande, med 10 px luft kvar på den bredaste pillen vid 375 px.
// Gruppens `aria-label` är "Event" och matchar den synliga rubriken.
const PERIOD_FILTER_LABEL: Record<PeriodFilter, string> = {
  alla: 'Alla',
  upcoming: 'Kommande',
  past: 'Tidigare',
};
/** Announcement-formen ("visar anmälningar FÖR …") skiljer sig från
    pillens korta etikett ("Kommande" ensamt läser konstigt efter "för"). */
const PERIOD_ANNOUNCEMENT_LED: Record<PeriodFilter, string> = {
  alla: 'alla event',
  upcoming: 'kommande event',
  past: 'tidigare event',
};

/** Räknarens substantiv för anmälningar (böjs efter nämnaren). */
const ANMALNINGS_ENHET = { ental: 'anmälan', flertal: 'anmälningar' };

/** Status i basens KANONISKA ordning — aldrig alfabetisk (EventsLists regel). */
const STATUS_ORDNING: EventStatusValue[] = [
  EventStatus.PLANERAT,
  EventStatus.GENOMFORT,
  EventStatus.INSTALLT,
  EventStatus.FLYTTAT,
];

/** Etikett + nolläge per event-dimension; alternativen härleds ur källan. */
const DIM_FORM = {
  typ: { etikett: 'Typ', nollage: 'Alla typer' },
  ort: { etikett: 'Ort', nollage: 'Alla orter' },
  status: { etikett: 'Status', nollage: 'Alla statusar' },
} as const;

/** Anmälans länkade event, eller `undefined` när det inte går att slå upp. */
function radensEvent(reg: Registration, eventsById: Map<string, Event>): Event | undefined {
  return reg.eventId ? eventsById.get(reg.eventId) : undefined;
}

/** Kommande/tidigare för en anmälningsrad, härlett ur DET LÄNKADE eventets
    startdatum (`dateValue`, samma härledning som EventsList/EventValjare —
    ALDRIG ur Status). `null` = kan inte klassificeras (inget event, eller
    eventet gick inte att slå upp) — sådana rader syns bara under "Alla
    event". */
function registrationPeriod(
  reg: Registration,
  eventsById: Map<string, Event>,
  idagStart: number,
): 'upcoming' | 'past' | null {
  if (!reg.eventId) return null;
  const event = eventsById.get(reg.eventId);
  if (!event) return null;
  return dateValue(event) >= idagStart ? 'upcoming' : 'past';
}

/** Tomt-lägets copy — kombinerar `lage` (befintlig axel) med det nya
    period-filtret. `period === 'alla'` återger ORDAGRANT den ursprungliga
    copyn (AC #2s befintliga acceptance-täckning rör den strängen). */
function tomtText(lage: VariantProps['lage'], period: PeriodFilter): string {
  const periodLed = period === 'upcoming' ? 'kommande' : period === 'past' ? 'tidigare' : null;
  if (lage === 'atgardskon') {
    return periodLed
      ? `Inga anmälningar för ${periodLed} event behöver kopplas om.`
      : 'Inga anmälningar behöver kopplas om.';
  }
  return periodLed ? `Inga anmälningar för ${periodLed} event.` : 'Inga anmälningar än.';
}

/**
 * [PROTOTYPE, TASK-299.3] VARIANT B — "Scanlista" (PRD `TASK-299` AC #3:
 * bär personlistans radanatomi med anmälningsdata).
 *
 * Radanatomin är ÄRVD ur `persons/PersonsList.tsx` k13/k14/k15-facitet, INTE
 * uppfunnen: initialcirkel `size-9` (`InitialAvatar`-primitiven, TASK-299.1)
 * · namnet `font-medium text-body` som HELRADS-länk (`after:absolute
 * after:inset-0`-tricket — den synliga länktexten är bara namnet, klickytan
 * är hela raden) · chevron 18 px. Samma tonala `divide-y`-lista, INTE
 * fristående kort per rad (PersonsList k03-lås: en scanlista för hundratals
 * rader).
 *
 * STATUSEN BOR PÅ RAD 2 sedan 2026-08-23, inte som reserverad kolumn på rad
 * 1. Den låg tidigare där med `invisible` (PersonsList `Pill dold`-tekniken)
 * — men `visibility: hidden` BEHÅLLER sin plats, och tillsammans med den nya
 * tidskolumnen klämde den namnkolumnen till TVÅ pixlar vid 375 px. Mätt:
 * raden 309 px = avatar 36 + namn 2 + tid 69 + status 136 + chevron 18 +
 * fyra gap à 12. Marcus flyttade statusen till rad 2, efter identiteten.
 * Reservationen fyllde ingen funktion där: chevronen sitter i den YTTRE
 * raden och påverkas inte av rad 2:s innehåll.
 *
 * ANMÄLNINGSDATAN (i stället för personlistans kontaktrad): undertexten är
 * "N dagar sedan · Eventnamn" (AC #3s exakta citat). Tidsformen ÅTERANVÄNDER
 * `relativTid` (hem/relativ-tid.ts, redan delad av två hem-kort) i stället
 * för en tredje parallell formatterare — samma familj av strängar
 * ("nyss"/"för N tim sedan"/"igår HH:MM"/"för N dagar sedan"), där "N dagar
 * sedan"-formen (AC #3s bokstav) är den som visas för allt äldre än
 * gårdagen. En anmälan yngre än så visar en FINARE relativ tid i stället för
 * "0 dagar sedan" — en avsiktlig, källbelagd precisering av AC #3s exempel,
 * bokförd i slutrapporten.
 *
 * HÖJDLÅSET (DoD #6): namn- och undertextraden RENDERAS ALLTID, så radens
 * höjd är en funktion av layouten, aldrig av datan. Sedan statusen flyttade
 * till rad 2 bär den radens container ett GOLV (`min-h-6`) — badgen är
 * ~20,5 px mot undertextens 16, så utan golvet blev rader MED åtgärdsbehov
 * 4,5 px högre och sviten fällde på just den jämförelsen. Golvet ligger över
 * badgens verkliga höjd i båda fallen, så uniformiteten följer av layouten
 * och inte av en jagad decimal.
 *
 * UNDERTEXTEN är eventets IDENTITET ("kurs · ort · kortdatum") via Hems egen
 * `eventIdentitet()`, och tiden bor i egen högerställd kolumn — Marcus
 * 2026-08-23: "EXAKT så vill jag att anmälningslistan också ska ha."
 *
 * AC #4 (raden leder till resolutionen, inget separat knappelement):
 * `AnmalningRadResolution` triggas av EXAKT det element som annars hade
 * varit `<Link>`-namnet (`triggerClassName` bär samma `after:absolute
 * after:inset-0`), så den ENDA interaktiva ytan per rad är antingen en
 * riktig länk (OK-rader) eller en riktig knapp (åtgärdsrader) — aldrig
 * båda, aldrig nästlade.
 *
 * FILTRET (Marcus review 2026-08-22: "en filtreringsgrej högst upp, så
 * Lotta kan bläddra bland kommande och tidigare event och bara se
 * anmälningar. Vi kanske kan ta någon redan etablerad form för det.") —
 * ÅTERANVÄNDER `ToggleButtonGroup`/`spread` i EventsLists exakta form
 * (samma primitiv, samma layout-variant, samma URL-mekanik). Skillnaden
 * mot EventsList: TRE lägen i stället för två — "Alla event" är
 * NOLLÄGET (default) så AC #2s "ofiltrerad lista" förblir bokstavligen
 * ofiltrerad. EventsList har inget sådant nolläge (det behöver den inte:
 * hela eventlistan HAR ett `Period` per definition, en anmälan har det
 * bara VIA sitt länkade event).
 *
 * EVENT-DIMENSIONERNA (Marcus review 2026-08-23: "visst vore det bra om
 * Lotta kunde filtrera på event-typ och sånt ju?") — samma `FilterRad`-
 * primitiv som eventlistan, med period-pillren som vänsterled och
 * tratt-panelen under: Typ · Ort · Status, `?typ`/`?ort`/`?status` i
 * URL:en, AND över dimensioner, live utan Apply.
 *
 * DIMENSIONERNA ÄR EVENTETS FÄLT, inte anmälans — en anmälan bär dem bara
 * VIA `eventId`, så filtret läser uppslaget event ("visa anmälningar vars
 * event har typ X"). Två följder, båda avsiktliga:
 *
 * 1. ALTERNATIVEN härleds ur de event LÄGETS rader faktiskt pekar på (före
 *    periodfiltret, så rymden är stabil över periodbyte — EventsLists
 *    byggkrav 2). Ett event utan anmälningar i läget vore en död kontroll.
 * 2. EN RAD UTAN UPPSLAGBART EVENT matchar aldrig ett aktivt
 *    dimensionsfilter — den bär inget event-attribut att matcha mot. Det
 *    är samma regel periodfiltret redan följer (`registrationPeriod` →
 *    null), och den försvinner inte tyst: `eventId: null` ⇒ `Utan event`
 *    ⇒ `behoverAtgard` (`registration-display.ts`), så raden har sin
 *    garanterade hemvist i ÅTGÄRDSKÖ-läget, syns med undertexten "Utan
 *    event" under "Alla", och panelfotens räknare bär bortfallet
 *    numeriskt ("Visar X av Y anmälningar").
 *
 * `EventValjare.tsx` (huset ANDRA etablerade eventväljar-form) ÖVERVÄGDES
 * och AVSTYRKTES, disk-verifierat: dess `grupper`-useMemo filtrerar
 * EXPLICIT till `dateValue(e) >= idagStart` (endast kommande event) —
 * den har ALDRIG en "tidigare"-gren. Den löser alltså strukturellt inte
 * "kommande OCH tidigare" (Marcus egen ordalydelse), och att bygga en
 * andra, past-kapabel gren i den delade komponenten hade varit att bygga
 * "för säkerhets skull" på en yta som redan har en korrekt form för detta.
 *
 * PERIODEN HÄRLEDS UR DET LÄNKADE EVENTETS `startdatum` (`dateValue`,
 * `EventCard.tsx` — SAMMA härledning som EventsList/EventValjare, ALDRIG ur
 * Status), inte ur anmälans eget `inskickad`-fält — "kommande/tidigare
 * EVENT", inte "ny/gammal anmälan". En rad utan event (eller vars event
 * inte gick att slå upp) kan inte klassificeras och syns därför bara under
 * "Alla event" — dokumenterat i `registrationPeriod()` ovan.
 */
export function VariantB({ rader, lage, isPending, isError, error, nuMs, events }: VariantProps) {
  // Rules-of-hooks: samtliga hooks FÖRE de villkorade early-returnsen
  // nedan (isPending/isError), annars byter komponenten hook-antal mellan
  // render-lägen.
  const [period, setPeriod] = useQueryState(
    'period',
    parseAsStringEnum<PeriodFilter>(PERIOD_FILTER_VALUES).withDefault('alla'),
  );

  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  // Dagsstarten härledd ur SAMMA `nuMs` som resten av sidan (route-nivåns
  // "läst en gång" — NastaEventCard-disciplinen: aldrig två olika "idag").
  const idagStart = useMemo(() => {
    const d = new Date(nuMs);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [nuMs]);

  // Event-dimensionerna i URL:en, samma kontrakt som EventsList (`?typ`/
  // `?ort`/`?status`, history push ⇒ delbart OCH back-bart; null tar bort
  // parametern helt). Status enum-parsas mot de kanoniska värdena så en
  // ogiltig parameter är inert i stället för att ge tom träffmängd.
  const [typ, setTyp] = useQueryState('typ', parseAsString.withOptions({ history: 'push' }));
  const [ort, setOrt] = useQueryState('ort', parseAsString.withOptions({ history: 'push' }));
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringEnum(STATUS_ORDNING).withOptions({ history: 'push' }),
  );
  const valda: Record<string, string | null> = {
    typ: typ || null,
    ort: ort || null,
    status: status ?? null,
  };

  const periodRader = useMemo(() => {
    if (period === 'alla') return rader;
    return rader.filter((reg) => registrationPeriod(reg, eventsById, idagStart) === period);
  }, [rader, period, eventsById, idagStart]);

  // Alternativen härleds ur de event LÄGETS rader faktiskt pekar på — inte ur
  // hela eventlistan. Ett event utan anmälningar i det här läget vore en död
  // kontroll (den skulle garanterat ge noll träffar), och EventsLists
  // "stabila över periodbyte"-krav bärs ändå: härledningen sker på `rader`,
  // FÖRE periodfiltret. En dimension utan värden renderar ingen dropdown
  // (FilterRads egen degradering) — vilket också är det snälla beteendet
  // innan `events`-frågan landat, då uppslagen ger `undefined` rakt igenom.
  const dimensioner = useMemo<FilterDimension[]>(() => {
    const lankade = rader
      .map((reg) => radensEvent(reg, eventsById))
      .filter((e): e is Event => e != null);
    const uniq = (vals: (string | null | undefined)[]) =>
      [...new Set(vals.filter((v): v is string => v != null))].sort((a, b) =>
        a.localeCompare(b, 'sv'),
      );
    return [
      { nyckel: 'typ', ...DIM_FORM.typ, alternativ: uniq(lankade.map((e) => e.typ)) },
      { nyckel: 'ort', ...DIM_FORM.ort, alternativ: uniq(lankade.map((e) => e.ort)) },
      {
        nyckel: 'status',
        ...DIM_FORM.status,
        alternativ: uniq(lankade.map((e) => e.status)).sort(
          (a, b) =>
            STATUS_ORDNING.indexOf(a as EventStatusValue) -
            STATUS_ORDNING.indexOf(b as EventStatusValue),
        ),
      },
    ];
  }, [rader, eventsById]);
  const aktiva = antalAktivaFilter(dimensioner, valda);

  // Dimensionsfiltret läses ur EVENTET, aldrig ur anmälan: "visa anmälningar
  // vars event har typ X". En rad utan uppslagbart event bär inget sådant
  // attribut och matchar därför aldrig ett aktivt dimensionsfilter — samma
  // regel periodfiltret redan följer (`registrationPeriod` → null). Den
  // försvinner inte ur systemet: `eventId: null` ⇒ `Utan event` ⇒
  // `behoverAtgard`, så raden har sin garanterade hemvist i åtgärdskö-läget,
  // och panelfotens räknare bär bortfallet numeriskt i lista-läget.
  const visasRader = useMemo(
    () =>
      periodRader.filter((reg) => {
        const ev = radensEvent(reg, eventsById);
        return (
          (valda.typ == null || ev?.typ === valda.typ) &&
          (valda.ort == null || ev?.ort === valda.ort) &&
          (valda.status == null || ev?.status === valda.status)
        );
      }),
    [periodRader, eventsById, valda.typ, valda.ort, valda.status],
  );

  // Rensa-knapparna unmountas i samma tryck (aktiva → 0) — fokus flyttas
  // därför programmatiskt till tratt-knappen (filter-ytans stabila ankare)
  // så tangentbordsfokus aldrig faller till body.
  const filterKnappRef = useRef<HTMLButtonElement>(null);
  const rensaFilter = () => {
    setTyp(null);
    setOrt(null);
    setStatus(null);
    filterKnappRef.current?.focus();
  };

  // A11y: bekräfta periodväxlingen (EventsLists skip-first-mönster) — en
  // EGEN live-region, skild från "Anmälningarna laddade."-statusen nedan
  // (Roselli-anatomin: en region per ansvar, aldrig återanvänd för två
  // olika besked).
  const [periodAnnouncement, setPeriodAnnouncement] = useState('');
  const prevPeriod = useRef(period);
  useEffect(() => {
    if (isPending || prevPeriod.current === period) return;
    prevPeriod.current = period;
    setPeriodAnnouncement(
      `Visar anmälningar för ${PERIOD_ANNOUNCEMENT_LED[period]}. ${visasRader.length} ${
        visasRader.length === 1 ? 'anmälan' : 'anmälningar'
      }.`,
    );
  }, [period, isPending, visasRader.length]);

  // Live-filtreringen bekräftas i SAMMA region som perioden: båda beskeden
  // svarar på "vad visas nu?" — ett ansvar, en region (EventsLists form).
  // Punkten skiljer annonsen från panelfotens synliga räknartext.
  const filterNyckel = `${valda.typ}|${valda.ort}|${valda.status}`;
  const prevFilterNyckel = useRef(filterNyckel);
  useEffect(() => {
    if (isPending || prevFilterNyckel.current === filterNyckel) return;
    prevFilterNyckel.current = filterNyckel;
    setPeriodAnnouncement(
      `${filterRaknartext(visasRader.length, periodRader.length, ANMALNINGS_ENHET)}.`,
    );
  }, [filterNyckel, isPending, visasRader.length, periodRader.length]);

  if (isPending) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-3 p-4">
        <span className="sr-only">Laddar anmälningarna…</span>
        <Skeleton variant="text" className="w-40 text-small" />
        <div className="flex flex-col gap-3 rounded-2xl border border-transparent bg-bg-muted p-4">
          {['a', 'b', 'c'].map((k) => (
            <div key={k} className="flex items-center gap-3">
              <Skeleton variant="text" className="size-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton variant="text" className="w-2/5" />
                <Skeleton variant="text" className="w-3/5 text-small" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <MessageBox intent="error" title="Kunde inte hämta anmälningarna">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="sr-only" role="status" aria-live="polite">
        Anmälningarna laddade.
      </p>

      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">Anmälningar</h1>
        <p className="text-small text-text-muted">
          {lage === 'atgardskon'
            ? atgardskoText(visasRader.length)
            : `${visasRader.length} ${visasRader.length === 1 ? 'anmälan' : 'anmälningar'}`}
        </p>
      </header>

      {/* Filtret — "en filtreringsgrej högst upp" (Marcus review
          2026-08-22) + event-dimensionerna (2026-08-23). EventsLists
          FilterRad-primitiv i sin exakta form: period-pillren till
          vänster, tratt-ingången till höger, panelen under. Alltid synlig
          (även vid noll träffar) — kontrollen är sidans egen, aldrig
          beroende av om urvalet råkar vara tomt.

          ETIKETTEN "Event" (Marcus: "'Kommande' och 'Tidigare' är nog fel
          ordval här. Vad är 'Kommande anmälningar' liksom.") — pillren
          beskriver EVENTETS tidsläge, inte anmälans. Etiketten bär det
          uttryckligen, så pillren kan förbli korta nog för 375 px och
          behålla EventsLists ordpar. Den är `aria-hidden` och gruppens
          `label` bär samma ord: skärmläsaren får "Event"-gruppen EN gång,
          seendet får den som rubrik. */}
      <div className="flex flex-col gap-1.5 print:hidden">
        <span aria-hidden="true" className="font-medium text-caption text-text-muted">
          Event
        </span>
        <FilterRad
          dimensioner={dimensioner}
          valda={valda}
          onValj={(nyckel, varde) => {
            if (nyckel === 'typ') setTyp(varde);
            else if (nyckel === 'ort') setOrt(varde);
            else setStatus(varde as EventStatusValue | null);
          }}
          onRensa={rensaFilter}
          visade={visasRader.length}
          totalt={periodRader.length}
          enhet={ANMALNINGS_ENHET}
          triggerRef={filterKnappRef}
        >
          <ToggleButtonGroup<PeriodFilter>
            label="Event"
            spread
            selectedKey={period}
            onSelectionChange={setPeriod}
          >
            {PERIOD_FILTER_VALUES.map((p) => (
              <ToggleButton key={p} id={p}>
                {PERIOD_FILTER_LABEL[p]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </FilterRad>
      </div>
      <p className="sr-only" aria-live="polite">
        {periodAnnouncement}
      </p>

      {visasRader.length === 0 ? (
        // Filter-tomläget är SKILT från period-/lägestomläget: här FINNS
        // anmälningar i perioden men dimensionsfiltren matchar inga, och
        // Rensa är återvägen (EventsLists form). Är själva perioden tom
        // finns inget att rensa fram — då gäller den vanliga copyn.
        aktiva > 0 && periodRader.length > 0 ? (
          // Typografin är sidans EGEN tomlägeskonvention (`text-small
          // text-text-muted`, punkt i slutet — samma som `tomtText`), inte
          // EventsLists centrerade `py-12`-form: här bor tomläget direkt i
          // listans flöde, inte i ett kortformat.
          <div className="flex flex-col items-start gap-3">
            <p className="text-small text-text-muted">Inga anmälningar matchar filtren.</p>
            <AriaButton
              onPress={rensaFilter}
              className="rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
            >
              Rensa filter
            </AriaButton>
          </div>
        ) : (
          <p className="text-small text-text-muted">{tomtText(lage, period)}</p>
        )
      ) : (
        <ul
          aria-label="Anmälningar"
          className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
        >
          {visasRader.map((reg) => {
            const namn = displayName(reg);
            const tid = inskickadTid(reg);
            const relTid = Number.isFinite(tid) ? relativTid(tid, nuMs) : null;
            // Undertexten är eventets IDENTITET ("kurs · ort · datum"),
            // inte längre tid+eventnamn hopslagna. Marcus 2026-08-23:
            // "under namnet har vi event, ort, datum, EXAKT så vill jag att
            // anmälningslistan också ska ha." `eventIdentitet` är Hems egen
            // hjälpare — lånad, inte återuppfunnen.
            const undertext =
              eventIdentitet(reg, reg.eventId ? eventsById.get(reg.eventId) : undefined) || ' ';
            const behoverKoppling = behoverAtgard(reg);
            const namnKlass =
              'min-w-0 truncate font-medium text-body underline-offset-2 after:absolute after:inset-0 hover:underline';

            // Triggerns cva-bas (Button.tsx) lägger `inline-flex`/padding/
            // min-höjd/bakgrund för sin `md`-standardstorlek — samtliga
            // neutraliseras här (tailwind-merge löser konflikten, `cn`
            // applicerar `className` SIST) så knappen läser som radens
            // vanliga namn-länk, inte som en knapp-pill.
            const namnTriggerKlass = `min-h-0 justify-start gap-0 rounded-none p-0 hover:bg-transparent data-[hovered]:bg-transparent data-[pressed]:bg-transparent ${namnKlass}`;

            const namnElement = behoverKoppling ? (
              <AnmalningRadResolution registration={reg} triggerClassName={namnTriggerKlass}>
                {namn}
              </AnmalningRadResolution>
            ) : reg.eventId ? (
              <Link
                to="/event/$eventId/anmalda"
                params={{ eventId: reg.eventId }}
                className={namnKlass}
              >
                {namn}
              </Link>
            ) : (
              // Kan inte inträffa i praktiken (UTAN_EVENT ⇒ behoverAtgard),
              // men golvet är explicit: aldrig en död länk.
              <span className="min-w-0 truncate font-medium text-body">{namn}</span>
            );

            return (
              <li key={reg.id} className="relative flex items-center gap-3 py-2.5">
                <InitialAvatar namn={namn} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex min-w-0 items-center gap-2">{namnElement}</div>
                  {/* RAD 2 — identiteten OCH statusen. Statusen låg tidigare
                      som egen kolumn på rad 1 med RESERVERAD plats
                      (`invisible`, personlistans `Pill dold`-teknik). Den
                      formen är riven på Marcus order 2026-08-23, av en mätt
                      orsak: `visibility: hidden` behåller sin plats, så den
                      reserverade badgen (136 px) plus tidskolumnen (69 px)
                      åt upp hela namnkolumnen vid 375 px — namn och
                      undertext trunkerades till TVÅ pixlar. Rad 1 är därmed
                      exakt Hems form (namn + tid), och statusen bor här.
                      VILLKORAD, inte reserverad: en reserverad plats på rad
                      2 hade ätit identitetens bredd på varje rad, och
                      chevronens position påverkas inte eftersom den sitter i
                      den YTTRE raden. Identiteten trunkeras i stället när
                      badgen tar plats — sekundär information, samma klass av
                      trunkering Hems egen identitetsrad redan bär. */}
                  {/* FAST HÖJD (`min-h-5`), inte auto: badgen är högre än en
                      naken undertextrad, så utan golvet blev rader MED
                      åtgärdsbehov högre än rader utan — DoD #6:s höjdlås
                      bröts, och sviten fällde på just den jämförelsen.
                      Golvet gör rad 2 lika hög oavsett om badgen finns.
                      MÄTT, inte gissat: med `min-h-5` (20 px) kvarstod 4,5
                      px skillnad — badgen är ~20,5 px mot undertextens 16.
                      `min-h-6` (24 px) ligger över badgens verkliga höjd i
                      BÅDA fallen, så uniformiteten följer av golvet och inte
                      av en jagad decimal. */}
                  <div className="flex min-h-6 min-w-0 items-center gap-2">
                    <span className="truncate text-caption text-text-muted">{undertext}</span>
                    {behoverKoppling && (
                      <span className="shrink-0">
                        <StatusBadge ton="warning" storlek="sm">
                          Behöver kopplas
                        </StatusBadge>
                      </span>
                    )}
                  </div>
                </div>
                {/* Tiden — egen kolumn, högerställd och vertikalt centrerad
                    mot hela raden av förälderns `items-center`. Exakt Hems
                    form (`NyaAnmalningar.tsx`: `shrink-0 pl-2 text-caption
                    text-text-muted`), som Marcus pekade ut som förlagan. */}
                <span className="shrink-0 pl-2 text-caption text-text-muted">{relTid}</span>
                <ChevronRight
                  aria-hidden="true"
                  size={18}
                  className="shrink-0 text-text-secondary"
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
