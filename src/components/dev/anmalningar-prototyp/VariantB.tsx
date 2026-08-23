import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { dateValue, eventName } from '@/components/events/EventCard';
import { relativTid } from '@/components/hem/relativ-tid';
import { InitialAvatar, ToggleButton, ToggleButtonGroup } from '@/components/primitives';
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
// "Alla" (INTE "Alla event") — varv 1 av det visuella QA-passet (Marcus
// order, 375 px): "Alla event" bryter till TVÅ rader i en tredjedels
// `auto-cols-fr`-kolumn vid 375 px (uppmätt: pillen blev högre än sina
// syskon, tracket tappade sin jämna rytm). "Alla" ensamt är entydigt i
// kontext — de två andra pillerna ("Kommande"/"Tidigare") är redan
// event-implicita, och gruppens `aria-label="Period"` bär resten.
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

/**
 * Eventets visningsnamn för en anmälningsrads undertext — ALDRIG blankt.
 *
 * ROTORSAK till reviewfyndet (Marcus, 2026-08-22, mätt live i staging mot
 * `?variant=b&lage=lista`): `reg.eventNamn` är anmälans EGEN fritext (vad
 * personen skrev i formuläret), inte det matchade eventets riktiga namn —
 * och den fritexten kan vara `null` även när `reg.eventId` pekar på ett
 * giltigt, korrekt matchat event (`eventmatchning: 'OK'`). Föregående
 * variant läste `reg.eventNamn` rakt av; för en sådan rad gav
 * `[relTid, null].filter(Boolean)` bara tidsdelen — eventnamnet försvann
 * tyst ur DOM:en, aldrig dolt, aldrig trunkerat. Samma mönster som redan
 * fanns löst i `hem-derivations.ts`s `eventIdentitet()` (slå upp det
 * MATCHADE eventets namn via `eventId` FÖRST, falla tillbaka till anmälans
 * egen text bara om eventet inte kan slås upp) — den logiken porteras hit
 * i sin enklaste form (bara namnet, inte `eventIdentitet`s "namn · ort ·
 * datum" — AC #3s citat är bara "Eventnamn").
 */
function eventUndertext(reg: Registration, eventsById: Map<string, Event>): string {
  if (!reg.eventId) return 'Utan event';
  const event = eventsById.get(reg.eventId);
  if (event) return eventName(event);
  // eventId satt men eventet inte i den hämtade listan (borde inte
  // inträffa i skarpt läge — eventId KOMMER från en matchning mot samma
  // eventregister — men testfixturer kan sakna en matchande post).
  // Samma golv som `eventIdentitet`/`AnmalningarList`: aldrig blankt.
  return reg.eventNamn ?? 'Uppgift saknas';
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
 * är hela raden) · statusen som EGEN kolumn med RESERVERAD plats
 * (`invisible` i stället för villkorad rendering, PersonsList `Pill dold`-
 * tekniken) · chevron 18 px. Samma tonala `divide-y`-lista, INTE fristående
 * kort per rad (PersonsList k03-lås: en scanlista för hundratals rader).
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
 * HÖJDLÅSET (DoD #6): namn- och undertextraden RENDERAS ALLTID (aldrig
 * villkorad på om eventNamn/status finns), så radens höjd är en funktion av
 * layouten, aldrig av datan. `eventUndertext()` (se ovan) GARANTERAR
 * dessutom att undertextens andra led aldrig är tomt/blankt — bara
 * `truncate`-bredden på texten varierar med innehållet, aldrig radens höjd
 * (single-line truncate är höjd-invariant mot textlängd; mätt i
 * slutrapporten på kort/långt/saknat eventnamn).
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

  const visasRader = useMemo(() => {
    if (period === 'alla') return rader;
    return rader.filter((reg) => registrationPeriod(reg, eventsById, idagStart) === period);
  }, [rader, period, eventsById, idagStart]);

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

      {/* Periodfiltret — "en filtreringsgrej högst upp" (Marcus review
          2026-08-22). Alltid synligt (även vid noll träffar) — samma
          princip som EventsLists period-toggel: kontrollen är sidans
          egen, aldrig beroende av om det aktuella urvalet råkar vara
          tomt. `print:hidden`: kontroller är meningslösa på papper
          (samma GOV.UK-blacklist EventsList citerar). */}
      <div className="print:hidden">
        <ToggleButtonGroup<PeriodFilter>
          label="Period"
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
      </div>
      <p className="sr-only" aria-live="polite">
        {periodAnnouncement}
      </p>

      {visasRader.length === 0 ? (
        <p className="text-small text-text-muted">{tomtText(lage, period)}</p>
      ) : (
        <ul
          aria-label="Anmälningar"
          className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
        >
          {visasRader.map((reg) => {
            const namn = displayName(reg);
            const tid = inskickadTid(reg);
            const relTid = Number.isFinite(tid) ? relativTid(tid, nuMs) : null;
            const eventText = eventUndertext(reg, eventsById);
            const undertext = [relTid, eventText].filter(Boolean).join(' · ') || ' ';
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
                  <span className="truncate text-caption text-text-muted">{undertext}</span>
                </div>
                {/* Statuskolumnen — EGEN kolumn, RESERVERAD plats (AC #3 +
                    DoD #6). Ikon+ord, aldrig färg ensam (AC #5). */}
                <span
                  className={`shrink-0 ${behoverKoppling ? '' : 'invisible'}`}
                  aria-hidden={behoverKoppling ? undefined : true}
                >
                  <StatusBadge ton="warning" storlek="sm">
                    Behöver kopplas
                  </StatusBadge>
                </span>
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
