import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { dateValue } from '@/components/events/EventCard';
import { EventValjare } from '@/components/events/EventValjare';
import { eventIdentitet } from '@/components/hem/hem-derivations';
import { relativTid } from '@/components/hem/relativ-tid';
import { InitialAvatar } from '@/components/primitives';
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
import { AnmalningRadResolution } from './AnmalningRadResolution';
import type { VariantProps } from './types';

/** `?period=` — utökar EventsLists tvåläges-toggel (Kommande/Tidigare) med
    ett nolläge ('alla', default) så AC #2s "ofiltrerad lista" förblir
    ofiltrerad tills Lotta uttryckligen väljer en period. Se docblocket
    nedan § FILTRET för hela motiveringen. */
type PeriodFilter = 'alla' | 'upcoming' | 'past';
const PERIOD_FILTER_VALUES: PeriodFilter[] = ['alla', 'upcoming', 'past'];
// ORDEN STÅR UTSKRIVNA — och det är BREDD-LÄGET, inte ordvalet, som avgjorde.
// Mätningen 2026-08-23 som fällde `Kommande event`/`Tidigare event` (pillhöjd
// 64 px mot 40, grupphöjd 72 mot 48 — radbrytning i båda pillren) gjordes i
// `spread`-läge, som ger varje pill exakt EN TREDJEDEL av bredden
// (`grid w-full auto-cols-fr`) oavsett vad som står i den. Utan `spread` får
// pillren sin NATURLIGA bredd, och Marcus hypotes höll vid ommätning: hela
// raden `Alla` · `Kommande event` · `Tidigare event` ryms på EN rad vid
// 375 px (uppmätta tal i commit-meddelandet). Rubriken över filterraden är
// därmed onödig och struken — pillren säger själva att det är EVENTET som är
// kommande respektive tidigare.
const PERIOD_FILTER_LABEL: Record<PeriodFilter, string> = {
  alla: 'Alla',
  upcoming: 'Kommande event',
  past: 'Tidigare event',
};
/** Announcement-formen ("visar anmälningar FÖR …") skiljer sig från
    pillens korta etikett ("Kommande" ensamt läser konstigt efter "för"). */
const PERIOD_ANNOUNCEMENT_LED: Record<PeriodFilter, string> = {
  alla: 'alla event',
  upcoming: 'kommande event',
  past: 'tidigare event',
};

/** Etikett → nyckel. Dimensionen visar svenska ord medan URL:en behåller
    sitt befintliga kontrakt (`?period=upcoming|past`) — `FilterDimension`
    bär råa strängar utan etikettmappning, så översättningen bor här. */
const PERIOD_FRAN_ETIKETT: Record<string, PeriodFilter> = {
  Kommande: 'upcoming',
  Tidigare: 'past',
};

/** Räknarens substantiv för anmälningar (böjs efter nämnaren). */
const ANMALNINGS_ENHET = { ental: 'anmälan', flertal: 'anmälningar' };

/** Event-dimensionens NOLLÄGE. Bärs av `EventValjare`s `gemensamtAlternativ`
    (raden överst i listan OCH den stängda triggerns text när inget är valt),
    så väljaren säger alltid VAR man är — aldrig att ett val saknas. Samma
    sträng står som dimensionens `nollage`, så de aldrig kan glida isär. */
const ALLA_EVENT = 'Alla event';

/** Etikett + nolläge per event-dimension; alternativen härleds ur källan.
    `event` har inga `alternativ` — dess kontroll (`EventValjare`) äger sin
    egen rymd, se `FilterDimension.kontroll`. */
const DIM_FORM = {
  typ: { etikett: 'Typ', nollage: 'Alla typer' },
  ort: { etikett: 'Ort', nollage: 'Alla orter' },
  event: { etikett: 'Event', nollage: ALLA_EVENT },
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
 * tratt-panelen under: Typ · Ort · Event, `?typ`/`?ort`/`?event` i
 * URL:en, AND över dimensioner, live utan Apply.
 *
 * DIMENSIONERNA ÄR EVENTETS FÄLT, inte anmälans — en anmälan bär dem bara
 * VIA `eventId`, så filtret läser uppslaget event ("visa anmälningar vars
 * event har typ X"). Två följder, båda avsiktliga:
 *
 * 1. ALTERNATIVEN för typ/ort härleds ur de event LÄGETS rader faktiskt
 *    pekar på (före periodfiltret, så rymden är stabil över periodbyte —
 *    EventsLists byggkrav 2). Ett typvärde utan anmälningar i läget vore en
 *    död kontroll. Event-axeln bryter medvetet mot regeln — se nedan.
 * 2. EN RAD UTAN UPPSLAGBART EVENT matchar aldrig ett aktivt
 *    dimensionsfilter — den bär inget event-attribut att matcha mot. Det
 *    är samma regel periodfiltret redan följer (`registrationPeriod` →
 *    null), och den försvinner inte tyst: `eventId: null` ⇒ `Utan event`
 *    ⇒ `behoverAtgard` (`registration-display.ts`), så raden har sin
 *    garanterade hemvist i ÅTGÄRDSKÖ-läget, syns med undertexten "Utan
 *    event" under "Alla", och panelfotens räknare bär bortfallet
 *    numeriskt ("Visar X av Y anmälningar").
 *
 * ═══ EVENT-DIMENSIONEN (Marcus 2026-08-23, ERSÄTTER `Status`) ═══
 *
 * *"vi får ju byta ut status mot 'Event' så Lotta kan filtrera på event,
 * RIM 1, RIM 2, Fjärrskådning etc."* Skälet håller: att filtrera
 * ANMÄLNINGAR på EVENTETS status (Planerat/Genomfört/Inställt) svarar på en
 * fråga om eventet, inte om anmälningarna. VILKET event en anmälan gäller
 * är den fråga Lotta faktiskt ställer. `Typ` och `Ort` står kvar.
 *
 * KONTROLLEN ÄR `EventValjare` — husets egen eventväljare — via
 * `FilterDimension.kontroll`, inte en fjärde `Select`. Skälet är mätt:
 * staging bär 108 event (Airtable REST mot `tblVE3UKWl1CKrphV`,
 * 2026-08-23), där typ har två värden och ort en handfull. En naken
 * dropdown över hundratals rader tappar fotfästet långt innan dess;
 * `EventValjare` är byggd som `Select` + `Autocomplete` med sökfält och
 * månadsgrupperade sektioner för exakt det.
 *
 * Väljaren ÖVERVÄGDES och AVSTYRKTES i föregående pass — den raden är nu
 * ÖPPET RIVEN, inte tyst borttagen. Avstyrkandets sakskäl var korrekt och
 * disk-verifierat: väljarens `grupper`-useMemo filtrerade explicit till
 * `dateValue(e) >= idagStart` och hade ALDRIG en tidigare-gren, vilket
 * gjorde den strukturellt oförmögen till "kommande OCH tidigare". Det
 * skälet är åtgärdat vid roten i stället för kringgått: `omfattning="alla"`
 * (opt-in, `EventValjare.tsx` § OMFATTNINGEN) ger hela eventrymden med
 * kommande närmast först följt av tidigare senast först. Default är
 * oförändrad för väljarens övriga konsumenter.
 *
 * EVENT-AXELN LISTAR HELA EVENTRYMDEN, inte bara de event raderna pekar på
 * — en AVSIKTLIG avvikelse från härledningsregeln i punkt 1 ovan, och den
 * enda i filtret. Skälet är att axelns frågor skiljer sig: ett `Typ`-värde
 * som saknas i listan är självförklarande (det finns bara två), medan ett
 * EVENT som saknas är omöjligt att skilja från "jag hittar det inte" —
 * väljaren hade tigit i stället för att svara. Med hela rymden kan Lotta
 * söka fram RIM 2 och få det sanna svaret "0 anmälningar" via panelfotens
 * räknare och filter-tomläget, i stället för ett event som inte finns.
 * Nolläget är väljarens egen `gemensamtAlternativ`-rad ("Alla event"), så
 * axeln har EN kontroll för både val och nollställning.
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
  // `?ort`/`?event`, history push ⇒ delbart OCH back-bart; null tar bort
  // parametern helt).
  //
  // `?event` bär ett RECORD-ID, inte ett namn: två event kan heta likadant
  // (samma kurs i två orter, eller samma kurs igen nästa år) och ett
  // namnfilter hade slagit ihop dem. Ett okänt ID är inert — det matchar
  // ingen rad, och väljarens stängda läge faller tillbaka på sitt
  // laddskelett tills eventlistan landat.
  const [typ, setTyp] = useQueryState('typ', parseAsString.withOptions({ history: 'push' }));
  const [ort, setOrt] = useQueryState('ort', parseAsString.withOptions({ history: 'push' }));
  const [event, setEvent] = useQueryState('event', parseAsString.withOptions({ history: 'push' }));
  const valda: Record<string, string | null> = {
    period: period === 'alla' ? null : PERIOD_FILTER_LABEL[period],
    typ: typ || null,
    ort: ort || null,
    event: event || null,
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
      // PERIOD ÄR EN DIMENSION, INTE EN TOGGLE (Marcus 2026-08-23: "Kör
      // period som dimension i panelen"). Den låg som pill-rad ovanför
      // listan, men `Kommande event`/`Tidigare event` krävde 397,7 px mot
      // 297 tillgängliga vid 375 px — radbrytning oavsett layoutläge, mätt
      // både med och utan `spread`. Som Select tar den full radbredd, och
      // etiketten `Period` bredvid orden `Kommande`/`Tidigare` tar bort
      // tvetydigheten som fällde pillren ("Vad är 'Kommande anmälningar'").
      // Priset är ett klick: period bor nu bakom "Visa filter".
      {
        nyckel: 'period',
        etikett: 'Period',
        nollage: 'Alla perioder',
        alternativ: ['Kommande', 'Tidigare'],
      },
      { nyckel: 'typ', ...DIM_FORM.typ, alternativ: uniq(lankade.map((e) => e.typ)) },
      { nyckel: 'ort', ...DIM_FORM.ort, alternativ: uniq(lankade.map((e) => e.ort)) },
      {
        nyckel: 'event',
        ...DIM_FORM.event,
        // KONTROLLEN, inte en alternativlista — se `FilterDimension.kontroll`
        // och docblockets § EVENT-DIMENSIONEN för varför just denna axel bryter
        // mot härledningsregeln som typ/ort följer.
        kontroll: (
          <EventValjare
            valtEventId={event || undefined}
            valtEvent={event ? eventsById.get(event) : undefined}
            onByte={(id) => setEvent(id)}
            // Anmälningar finns för event som VARIT — sidan har en
            // `Tidigare`-flik, så väljarens default (endast kommande) hade
            // tystat bort precis det fliken finns för.
            omfattning="alla"
            gemensamtAlternativ={{ etikett: ALLA_EVENT, onValj: () => setEvent(null) }}
          />
        ),
      },
    ];
  }, [rader, eventsById, event, setEvent]);
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
          // Event-axeln matchar på ID mot det UPPSLAGNA eventet, inte mot
          // `reg.eventId` rakt av: en rad vars eventId pekar på ett event som
          // inte går att slå upp bär inget event-attribut att matcha mot, och
          // ska falla bort på samma villkor som för typ/ort.
          (valda.event == null || ev?.id === valda.event)
        );
      }),
    [periodRader, eventsById, valda.typ, valda.ort, valda.event],
  );

  // Rensa-knapparna unmountas i samma tryck (aktiva → 0) — fokus flyttas
  // därför programmatiskt till tratt-knappen (filter-ytans stabila ankare)
  // så tangentbordsfokus aldrig faller till body.
  const filterKnappRef = useRef<HTMLButtonElement>(null);
  const rensaFilter = () => {
    setPeriod('alla');
    setTyp(null);
    setOrt(null);
    setEvent(null);
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
  const filterNyckel = `${valda.typ}|${valda.ort}|${valda.event}`;
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

          RUBRIKEN ÖVER FILTERRADEN ÄR STRUKEN (Marcus 2026-08-23). Den bar
          ordet "Event" åt de korta pillren ("Kommande"/"Tidigare") när de
          inte fick plats med hela ordparet. Utan `spread` får pillren sin
          naturliga bredd och ordparet ryms utskrivet — då säger pillren
          själva vad som är kommande respektive tidigare, och en rubrik som
          upprepar det är brus. Gruppens `label` är "Period" (EventsLists
          egen, ORDLISTA § Period), inte "Event": panelens EGEN
          event-dimension heter så, och två olika kontroller med samma namn
          på samma yta är precis den förväxling etiketterna finns för att
          förhindra. */}
      <FilterRad
        dimensioner={dimensioner}
        valda={valda}
        onValj={(nyckel, varde) => {
          if (nyckel === 'period') setPeriod(varde ? PERIOD_FRAN_ETIKETT[varde] : 'alla');
          else if (nyckel === 'typ') setTyp(varde);
          else if (nyckel === 'ort') setOrt(varde);
          else setEvent(varde);
        }}
        onRensa={rensaFilter}
        visade={visasRader.length}
        totalt={rader.length}
        enhet={ANMALNINGS_ENHET}
        triggerRef={filterKnappRef}
      ></FilterRad>
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
