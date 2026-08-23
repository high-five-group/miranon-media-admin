import { type CalendarDate, parseDate } from '@internationalized/date';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button as AriaButton } from 'react-aria-components';
// Cross-feature-import med avsikt (S106-passet): DatumFalt är eventsidans
// S73-facit-form (RAC DateRangePicker + RangeCalendar-popover). Historiken
// är det BEVISADE DELBEHOV dess eget filhuvud villkorar primitiv-lyft på —
// lyftet till src/components/primitives/ är TASK-225.4:s skiva.
import { DatumFalt } from '@/components/primitives/DatumFalt';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { ACTIVITY_OBJECT_TYPES } from '@/data/activityLog/activityTypes';
import { verbCopy } from '@/data/activityLog/verbCopy';
import { useActivityLogHistory } from '@/data/queries/useActivityLog';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import {
  type ActivityStatement,
  EVENT_ID_EXTENSION_IRI,
  PERSON_ID_EXTENSION_IRI,
} from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * PROMOVERAD ur S106-konvergenspassets prototyp, EJ återbyggd (ADR-103
 * B1/B2, TASK-225.1): klasser, element och ordning hämtade verbatim ur
 * `AktivitetsHistorikPrototyp.tsx`. Facit-manifestet
 * `tasks/sessions/bilagor/s106-aktivitetslogg/facit.json` är den
 * auktoritativa formbeskrivningen och slår varje prosabeskrivning
 * (ADR-102 B1) — även denna. Prototypfilen + route-växeln (`?variant=a`)
 * står KVAR tills Marcus satt `godkand`-stämpeln (TASK-225.5, ADR-104
 * kanalseparation); först därefter rivs de mekaniskt
 * (`scripts/check-facit.sh` håller trädet rött vid förtida rivning).
 */

/**
 * Aktivitetshistoriken — kärnvyn (TASK-201.6, A-formen) + filterraden
 * (TASK-201.8, B-målet, additiv: A-formen förblir en HEL yta även utan
 * filtrering, S105 Del 2 beslut 1). Data via `useActivityLogHistory(filters)`
 * (TASK-201.5, cursor-paginerad `useInfiniteQuery`,
 * `src/data/queries/useActivityLog.ts`) → `fetchActivityLog` (adaptern) →
 * `get-activity-log`-EF:en, samma åtkomstprecedens som `PersonsList`/`MailLog`.
 *
 * ORDLISTA (S105-grillningen): "Aktivitetslogg" är DATAN (Supabase
 * `activity_log`), "Aktivitetshistorik" är Lottas VY över den — hem-spaltens
 * högerspalt (K10-facit, TASK-201.7, OBYGGD) och DENNA fulla historikvy.
 * Undvik "logg" i UI-text.
 *
 * FILTRERING (TASK-201.8) — ÖPPET BOKFÖRD AVVIKELSE mot kortets AC #1-
 * ORDALYDELSE ("klientfiltrering över hämtad lista"): faktisk kod byggd i
 * TASK-201.5 säger raka motsatsen på TVÅ ställen — `ActivityLogFilters`s eget
 * filhuvud ("Server-side (get-activity-log-EF), inte klient-side",
 * `src/domain/types/Filters.ts`) och `queryKeys.activityLog.history`s eget
 * filhuvud ("Nyckeln bär FILTERPARAMETRARNA ... de ändrar VILKEN datamängd
 * get-activity-log-EF:en hämtar server-side", `src/queries/keys.ts`).
 * `get-activity-log`-EF:en har DESSUTOM redan fullt category/eventId/from/to-
 * stöd (dess eget filhuvud, § FILTER) — kortets egen beskrivningstext
 * ("EF-kontraktet från 201.5 bär redan parametrarna så ingen serverändring
 * ingår") stämmer, men bara om filtret ÄR server-side. Byggd därför som
 * SERVER-SIDE filtrering via redan existerande EF-parametrar (`category`/
 * `eventId`/`from`), inte som ett naivt array-filter över den redan hämtade
 * (delvis laddade) sidan — ett äkta klient-array-filter hade varit trasigt
 * mot en keyset-paginerad, ännu-inte-helt-laddad lista (precis den
 * pagineringsbugg uppdraget varnade för). Se § "filterbyte mitt i paginering"
 * i `useActivityLogHistory`s docstring för hur markören hanteras vid ett
 * filterbyte.
 *
 * EVENT-FILTRETS ETIKETT (TASK-201.17, fynd ur S105:s mekaniska QA-vandring
 * 2026-08-14): bar `event.eventNamn` gav 32+ options i staging identisk
 * etikett "Fjärrskådning" (samma kurs körs på flera orter/datum — en ÄKTA
 * verksamhetsform, INTE fixtur-brus; källmärkt mot staging-Airtable och
 * `get-events`-EF:ens kod i fynd-kortets egen § Verifiering/§ Rotorsak) —
 * omöjliga att skilja åt, Gunilla-principen fälld. Löst genom
 * `eventFilterEtikett` ("Namn · Ort · datum", återbruk av hem-vyns
 * `NyaAnmalningarCard.tsx`s postform) + kronologisk tie-break i
 * `eventOptions`-sorteringen — se respektive funktions egna kommentarer
 * nedan. Kod-nivå ID-dubblering (samma event-record två gånger i den
 * hämtade listan) utreddes och avfärdades — `fetchFromAirtable`
 * (`supabase/functions/_shared/airtable-client.ts`) pushar varje sidas
 * poster EN gång, ingen dedup-logik behövdes.
 */

/** Klockslag "14:22" — raden i grupper ÄLDRE än idag (dagen är redan sagd av gruppens h2). */
const KLOCKSLAG = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });

/** Långdatum "3 april 2026" — gruppetiketten för dagar äldre än igår (samma
 * options som EventsList.tsx:71:s LANGDATUM_IDAG, modul-privat där precis
 * som här — ingen delad export finns att återanvända). */
const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Lokal dagsstart (midnatt) — kalenderdags-diffens referenspunkt (speglar NyaAnmalningarCard.tsx). */
function dagsStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Filterradens KATEGORI-axel (TASK-201.8) — korta URL-nycklar som mappar mot
 * `ACTIVITY_OBJECT_TYPES`s fulla IRI:er (samma IRI som `get-activity-log`-
 * EF:ens `object_type`-equality-filter jämför mot, se dess filhuvud).
 * `Record<KategoriKey, string>` nedan tvingar TS att fälla om ett nytt värde
 * läggs till i `ACTIVITY_OBJECT_TYPES` utan en motsvarande svensk etikett —
 * FÅNGADE FAKTISKT DRIFT (merge mot main, TASK-201.8s egen byggsession):
 * `ACTIVITY_OBJECT_TYPES` växte från TRE kategorier (pilotens
 * betalning/bekraftelse/mail, giltiga vid denna skivas branch-punkt) till
 * NIO under TASK-201.4 (landat på main under samma tidsfönster) — PRD
 * TASK-201s användarberättelse 9 ordagrant: "betalningar, bekräftelser,
 * anmälningar, boende, mail, kvitton, event-ändringar, flaggor och
 * anteckningar". Ordningen nedan följer den uppräkningen. `KATEGORI_VALUES`
 * själv (en vanlig array, ingen fullständighetskontroll) hade INTE fångat
 * detta ensam — det var `Record`-typen som fällde typecheck.
 *
 * `segment` (TASK-201.15) LADES TILL SIST, EFTER PRD-uppräkningen ovan —
 * samma mekanism fällde typecheck EXAKT som docblocket beskriver: kategorin
 * mintades i `activityTypes.ts` (spara-segment, hemvistsluckan), och denna
 * fil vägrade kompilera förrän en svensk etikett fanns. Segment-spar
 * omfattas av PRD-berättelse 1 ("allt jag gör som ändrar något loggas"),
 * inte av berättelse 9:s uppräkning — se `activityTypes.ts`
 * `ACTIVITY_OBJECT_TYPES.segment`s eget docblock för varför kategorin finns.
 */
type KategoriKey = keyof typeof ACTIVITY_OBJECT_TYPES;
const KATEGORI_VALUES: KategoriKey[] = [
  'betalning',
  'bekraftelse',
  'anmalan',
  'boende',
  'mail',
  'kvitto',
  'event',
  'flagga',
  'anteckning',
  'segment',
];
const KATEGORI_LABEL: Record<KategoriKey, string> = {
  betalning: 'Betalning',
  bekraftelse: 'Bekräftelse',
  anmalan: 'Anmälan',
  boende: 'Boende',
  mail: 'Mail',
  kvitto: 'Kvitto',
  event: 'Eventändring',
  flagga: 'Flagga',
  anteckning: 'Anteckning',
  segment: 'Segment',
};

/** Filterradens TIDSPERIOD-axel (TASK-201.8) — ToggleButtonGroup, alltid ETT val. */
type Tidsperiod = 'idag' | '7dagar' | '30dagar' | 'allt';
const TIDSPERIOD_VALUES: Tidsperiod[] = ['idag', '7dagar', '30dagar', 'allt'];
const TIDSPERIOD_LABEL: Record<Tidsperiod, string> = {
  idag: 'Idag',
  '7dagar': '7 dagar',
  '30dagar': '30 dagar',
  allt: 'Allt',
};

/**
 * `from`-gränsen (ISO 8601, `get-activity-log`-EF:ens `from`-param) för vald
 * tidsperiod, relativt `nuMs`. `'allt'` = inget tidsfilter (`undefined` —
 * EF:en utelämnar då `gte`-villkoret helt, samma "parametern BORTA = inget
 * filter"-idiom som `/event`s `?typ`/`?ort` — URL-STATE-SPEC §Event).
 * "Idag" är KALENDERDAG (lokal midnatt, `dagsStart` — samma referenspunkt
 * radernas egen dagsgruppering använder); "7 dagar"/"30 dagar" är rullande
 * 24h-fönster (ingen kalendersemantik behövs för dem).
 */
function tidsperiodFran(tidsperiod: Tidsperiod, nuMs: number): string | undefined {
  if (tidsperiod === 'allt') return undefined;
  if (tidsperiod === 'idag') return new Date(dagsStart(nuMs)).toISOString();
  const dagar = tidsperiod === '7dagar' ? 7 : 30;
  return new Date(nuMs - dagar * 86_400_000).toISOString();
}

/** Nolläges-nyckeln i filterradens Select-dropdowns ("Alla …") — sentinel
 * skild från datavärden (speglar EventsList.tsx:s `ALLA`-konstant EXAKT). */
const ALLA = '__alla';

/** Visat eventnamn — lokal kopia (medvetet INTE en cross-feature-import av
 * `components/events/EventCard.tsx`s `eventName`; samma isolering som
 * `NastaEventCard.tsx` redan valde för identisk logik, `components/hem/`). */
function eventVisningsNamn(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/**
 * Kortdatum "22 aug" (TASK-201.17) — LOKAL kopia av `NyaAnmalningarCard.tsx`s
 * `KORTDATUM`/`kortDatum` (samma cross-feature-isolering som `eventVisningsNamn`
 * ovan, ingen delad export finns eller ska skapas här). sv-SE utan avslutande
 * punkt; null-säker.
 */
const KORTDATUM = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' });
function kortDatum(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : KORTDATUM.format(t).replace(/\.$/, '');
}

/**
 * Filterradens event-options-ETIKETT (TASK-201.17, fynd ur S105:s QA-
 * vandring): "Namn · Ort · datum" — SAMMA postform som hem-vyns
 * anmälningslista (`NyaAnmalningarCard.tsx`s `eventIdentitet`), källmärkt i
 * fynd-kortet TASK-201.17. Bar `eventVisningsNamn(e)` ENSAM gav 32+ event i
 * staging identisk etikett "Fjärrskådning" (samma kursnamn körs på flera
 * orter/datum — en ÄKTA, återkommande verksamhetsform, inte fixtur-brus,
 * verifierat mot staging-Airtable i denna skivas byggsession) —
 * oskiljbara för Lotta (Gunilla-principen fälld). `ort`/`startdatum` är
 * redan del av `Event`-modellen (`domain/models/Event.ts`), ingen ny
 * datakälla behövdes. `.filter(Boolean)` degraderar ärligt vid saknad
 * ort/datum (aldrig en stray-separator).
 */
function eventFilterEtikett(e: Event): string {
  return [eventVisningsNamn(e), e.ort, kortDatum(e.startdatum)].filter(Boolean).join(' · ');
}

/** Dagsgruppens etikett: "Idag" / "Igår" / långdatum. Kalenderdags-diff, inte 24h-fönster
 * (DST-säkert via Math.round, speglar NyaAnmalningarCard.tsx:relativTid). */
export function dagsEtikett(iso: string, nuMs: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'Okänt datum';
  const dagar = Math.round((dagsStart(nuMs) - dagsStart(t)) / 86_400_000);
  if (dagar === 0) return 'Idag';
  if (dagar === 1) return 'Igår';
  return LANGDATUM.format(t);
}

/**
 * Gruppera den redan server-sorterade listan (occurred_at fallande,
 * `get-activity-log`-EF:ens kontrakt) per kalenderdag. Rubrikerna läggs
 * OVANPÅ ordningen — de sorterar aldrig om (speglar `manadsgrupp.ts`s
 * `groupByMonth` EXAKT, bara dagsgranulär i stället för månadsgranulär).
 */
export function grupperaPerDag(
  statements: ActivityStatement[],
  nuMs: number,
): { label: string; statements: ActivityStatement[] }[] {
  const groups: { label: string; statements: ActivityStatement[] }[] = [];
  for (const s of statements) {
    const label = dagsEtikett(s.timestamp, nuMs);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.statements.push(s);
    } else {
      groups.push({ label, statements: [s] });
    }
  }
  return groups;
}

/**
 * Radens tid — AC #1: "relativ tid respektive klockslag" (PRD användarberättelse
 * 5: "relativ tid nyss, klockslag/datum längre bak"). Inom "Idag"-gruppen:
 * relativ ("nyss" / "för N min sedan" / "för N tim sedan") — dagen är redan
 * sagd av grupphuvudet. I ÄLDRE grupper: klockslag ensamt (dagen står redan i
 * h2:n, ett andra datum vore brus).
 */
export function radensTid(iso: string, grupp: string, nuMs: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  if (grupp !== 'Idag') return KLOCKSLAG.format(t);
  const minuter = Math.floor((nuMs - t) / 60_000);
  if (minuter < 1) return 'nyss';
  if (minuter < 60) return `för ${minuter} min sedan`;
  return `för ${Math.floor(minuter / 60)} tim sedan`;
}

/** xAPI Language Map → sv-SE-strängen (vi emitterar alltid endast den, se
 * ActivityStatement.schema.ts:63), med en defensiv fallback till första
 * närvarande nyckel — Lotta ska aldrig möta en tom rad. */
function sprakText(map: Record<string, string>): string {
  return map['sv-SE'] ?? Object.values(map)[0] ?? '';
}

/**
 * Navigeringsmålet — PRD användarberättelse 8: "klicka på en post och komma
 * till personen eller eventet det gällde". Object-IRI:t
 * (`objects/registrations/{id}`) bär i sig INGEN separat person-/
 * event-identitet att parsa fram (`activityTypes.ts`s `registrationObjectId`)
 * — en registrering saknar egen detaljsida (`/event/$eventId/anmalan/
 * $registrationId` kräver BÅDA parametrarna) — navigeringsmålet läses därför
 * ALLTID ur `context.extensions`, aldrig ur `object.id`.
 *
 * Denna funktion läser extensionen defensivt: finns den (skrivvägen,
 * `TASK-201.4`, landad) blir raden en riktig länk till EVENTET — precis som
 * `NyaAnmalningarCard`s etablerade "registrering → händelsens event"-
 * precedent. Saknas den renderas raden olänkad för den delen, ärligt — INGEN
 * gissning via namnmatchning mot en cachad personlista (Gunilla-fientligt vid
 * namnkollision).
 */
export function aktivitetensEventId(statement: ActivityStatement): string | null {
  const raw = statement.context.extensions[EVENT_ID_EXTENSION_IRI];
  return typeof raw === 'string' && raw.trim() !== '' ? raw : null;
}

/**
 * Person-halvan av samma navigeringsmål (`TASK-201.12`, stänger det gap
 * denna funktions systerfunktion `aktivitetensEventId` ovan tidigare
 * dokumenterade som obyggt: "ingen mutation/statement-typ sätter någon
 * person-identifierande extension i dag"). EXAKT samma läsdisciplin —
 * defensiv, `.trim() !== ''`, aldrig en gissning.
 *
 * PRIORITETSORDNING i `AktivitetsRad` nedan: eventId FÖRE personId när båda
 * finns (t.ex. en betalningsrad för en registrering i ett event bär BÅDA
 * efter `TASK-201.12`) — bevarar `NyaAnmalningarCard`-precedentets
 * "registrering → händelsens event"-mål oförändrat för de statement-typer
 * som redan länkade dit. personId är alltså ett TILLÄGG som aktiverar
 * navigering för de statement-typer som ALDRIG hade ett eventId att länka
 * mot (person-flagga, person-anteckning skapa/uppdatera — objektet ÄR redan
 * personen) snarare än en omprioritering av redan fungerande rader.
 */
export function aktivitetensPersonId(statement: ActivityStatement): string | null {
  const raw = statement.context.extensions[PERSON_ID_EXTENSION_IRI];
  return typeof raw === 'string' && raw.trim() !== '' ? raw : null;
}

/**
 * En aktivitetsrad — "spaltens postform" (`useActivityLog.ts`s filhuvud:
 * PRD § Vy-form "samma postkomponent bär spalt och vy"). Hem-spalten
 * (TASK-201.7, K10-facit-låst, OBYGGD) är en ANNAN, egen komponent —
 * extraheras hit vid FAKTISK andra konsument (över-engineering-vakten; jfr
 * `PersonMiniKort`s "konsolideras vid andra konsumenten"-precedent,
 * PersonsList.tsx). Formen (rad 1: aktör medium + händelse + · + objekt i
 * naturligt språk; rad 2: tid) är den delen TASK-201.7 sannolikt återvinner.
 *
 * MITTPUNKT (·), ALDRIG LÅNGT TANKSTRECK — Marcus-order 2026-08-12: grinden
 * `check-langa-streck` fäller "—"/"–" i användarsynlig text
 * (`.langa-streck-policy.json`). ORDLISTA.md:s illustrativa exempel ("Lotta
 * markerade betalning — …") är EJ facit för separatorn.
 */
/* S106-passet, steg 3+4 — verb-copyn bor i den DELADE presentations-
 * modulen `src/data/activityLog/verbCopy.ts` (flyttad dit i steg 4 på
 * Marcus "fixa fynden"-kvittens: EN källa för händelsetexten; hem-spalten
 * kopplas på i TASK-225.3 med facit-amendering — se modulens
 * docblock för hela bokföringen, inkl. de medvetet oförändrade verben). */

/** Initialer för identitetsmarkören — personlistans `initialer`, samma form
 * (dörrlistans `initialerD` är tredje kopian av samma formel). Tål e-post som
 * namn (dagens prod-fallback): "marcus@h5gruppen.se" → "M". */
function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

/* S106-passet, steg 2 — RADEN TALAR HUSETS RADGRAMMATIK (Check-in-
 * rotdiagnosen i omvänd riktning: nuläget talade "eget språk" — textklump
 * utan identitetsmarkör). Formen är personlistans/dörrlistans, verbatim:
 * `size-9`-initial-cirkel i `bg-bg-emphasized` · rad 1 aktör i `font-medium`
 * + händelse i normal vikt · rad 2 TIDEN SOM RUBRIK (`font-medium
 * text-text-secondary tabular-nums`, PersonsList steg 12-13: "vikten bär
 * hierarkin") + objekt dämpat efter mittpunkten · `min-h-16` höjdlås ·
 * `-mx-4 px-4` så hover-tinten når kortkanten (dörrlistans tint-idiom;
 * listans `overflow-hidden` klipper hörnen, Check-in-konvergensens varv 2). */
function AktivitetsRad({
  statement,
  grupp,
  nuMs,
}: {
  statement: ActivityStatement;
  grupp: string;
  nuMs: number;
}) {
  const eventId = aktivitetensEventId(statement);
  // Läses bara när eventId saknas — se aktivitetensPersonId's
  // prioritetskommentar (eventId vinner när båda finns).
  const personId = eventId ? null : aktivitetensPersonId(statement);
  const tid = radensTid(statement.timestamp, grupp, nuMs);
  const handelse = verbCopy(statement.verb);
  const objekt = sprakText(statement.object.definition.name);

  const innehall = (
    <>
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
      >
        {initialer(statement.actor.name)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-body underline-offset-2 group-hover:underline">
          <span className="font-medium">{statement.actor.name}</span> {handelse}
        </p>
        <p className="truncate text-caption">
          <span className="font-medium text-text-secondary tabular-nums">{tid}</span>
          <span className="text-text-muted">{` · ${objekt}`}</span>
        </p>
      </div>
    </>
  );

  /* S106-passet, steg 5 — hover per HUSETS divide-y-grammatik (Marcus
   * 2026-08-15: bakgrunds-tinten skar sig mot separatorlinjerna): ingen
   * rad-bakgrund vid hover — personlistans affordans i stället
   * (`hover:underline` på textblocket via group; chevronen bär resten).
   * `-mx-4`-tricket och listans `overflow-hidden` revs med tinten. */
  const radKlass = 'group flex min-h-16 items-center gap-3 py-2.5';
  return (
    <li>
      {eventId ? (
        <Link to="/event/$eventId" params={{ eventId }} className={radKlass}>
          {innehall}
          <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
        </Link>
      ) : personId ? (
        <Link to="/personer/$personId" params={{ personId }} className={radKlass}>
          {innehall}
          <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
        </Link>
      ) : (
        <div className="flex min-h-16 items-center gap-3 py-2.5">{innehall}</div>
      )}
    </li>
  );
}

/** Lugnt laddläge (DESIGN-SYSTEM-SPEC §15 — "Laddar…"-textrader och spinners
 * används inte, app-brett). Skeleton-block i listans SLUTGEOMETRI (samma
 * `divide-y`-container som det laddade läget) så inget hoppar när data landar. */
function LaddLage() {
  return (
    <div className="flex flex-col gap-4 px-4" aria-busy="true">
      <span className="sr-only">Laddar aktivitetshistorik…</span>
      <Skeleton variant="text" className="w-24 text-small" />
      <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex min-h-16 items-center gap-3 py-2.5">
            <Skeleton variant="text" className="size-9 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Skeleton variant="text" className="w-3/5 text-body" />
              <Skeleton variant="text" className="w-2/5 text-caption" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Filterraden (TASK-201.8, B-målet) — kategori + event (Select-primitiven,
 * ADR-044) + tidsperiod (ToggleButtonGroup-primitiven). "Ovanför kärnvyns
 * lista" (AC #1) — monterad i den LADDADE grenen tillsammans med `<h1>`
 * (aldrig i den bara isPending/isError-grenen, se
 * `AktivitetsHistorik`-komponentens egen kommentar) och stannar därför
 * monterad genom varje filterbyte (`keepPreviousData`,
 * `useActivityLog.ts`) — ett val i en dropdown tappar aldrig fokus under
 * sig själv (AC #3, tangentbordsvägen).
 *
 * Event-dropdownens data delar queryKey med `EventValjare`/`EventsList`
 * (`queryKeys.events.list`) — varm cache vid navigering från Event, kall
 * hämtning vid djuplänk hit; `isDisabled` under tiden (samma golv som
 * EventsList.tsx:s panel-Select under `isPending`).
 *
 * Event-optionens ETIKETT är `eventFilterEtikett` — "Namn · Ort · datum",
 * INTE bar `eventVisningsNamn` (TASK-201.17, fynd ur S105:s QA-vandring: bar
 * namn gav 32+ identiskt etiketterade options i staging, se funktionens eget
 * kommentarsblock ovan för källmärkningen).
 */
function FilterRad({
  kategori,
  onKategoriChange,
  eventId,
  eventOptions,
  eventerLaddar,
  onEventChange,
  tidsperiod,
  onTidsperiodChange,
  datumSpann,
  onDatumSpannChange,
}: {
  kategori: KategoriKey | null;
  onKategoriChange: (varde: KategoriKey | null) => void;
  eventId: string | null;
  eventOptions: Event[];
  eventerLaddar: boolean;
  onEventChange: (varde: string | null) => void;
  tidsperiod: Tidsperiod;
  onTidsperiodChange: (varde: Tidsperiod) => void;
  datumSpann: { start: CalendarDate; end: CalendarDate } | null;
  onDatumSpannChange: (v: { start: CalendarDate; end: CalendarDate } | null) => void;
}) {
  /* S106-passet, steg 2 — FILTERRADEN UPPDELAD (Marcus 2026-08-15: tre
   * kontroller på samma rad "ser extremt ihoptryckt ut"). Husets stapling
   * (Check-ins SessionsRad-precedent): tidsperiod-togglen FÖRST i fullbredd
   * (`spread` + `min-h-11` per flik — varv 4-lärdomen: `size="sm"` ensamt
   * gav 37 px, under 44 px-golvet), därunder de två dropdownerna sida vid
   * sida (staplade på mobil). */
  return (
    <div className="flex flex-col gap-3 px-4" data-testid="aktivitetshistorik-filterrad">
      <ToggleButtonGroup<Tidsperiod>
        label="Tidsperiod"
        spread
        selectedKey={tidsperiod}
        onSelectionChange={onTidsperiodChange}
      >
        {TIDSPERIOD_VALUES.map((t) => (
          <ToggleButton key={t} id={t} size="sm" className="min-h-11">
            {TIDSPERIOD_LABEL[t]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Kategori"
          size="sm"
          selectedKey={kategori ?? ALLA}
          onSelectionChange={(k) => {
            const varde = k == null || String(k) === ALLA ? null : (String(k) as KategoriKey);
            onKategoriChange(varde);
          }}
        >
          <SelectItem id={ALLA}>Alla kategorier</SelectItem>
          {KATEGORI_VALUES.map((k) => (
            <SelectItem key={k} id={k}>
              {KATEGORI_LABEL[k]}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Event"
          size="sm"
          isDisabled={eventerLaddar}
          selectedKey={eventId ?? ALLA}
          onSelectionChange={(k) => {
            const varde = k == null || String(k) === ALLA ? null : String(k);
            onEventChange(varde);
          }}
        >
          <SelectItem id={ALLA}>Alla event</SelectItem>
          {eventOptions.map((e) => (
            <SelectItem key={e.id} id={e.id}>
              {eventFilterEtikett(e)}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* S106-passet, steg 5 — DATUMVÄLJAREN (Marcus 2026-08-15:
          "välja en specifik dag att se vad som hände då"). Eventsidans
          DatumFalt återanvänds: en dag = samma start/slut i kalendern, ett
          spann fungerar också. Hela datakedjan fanns redan (EF:ens
          from/to-range mot occurred_at · adapterns ActivityLogParams ·
          ActivityLogFilters) — ingen backend-ändring. Ett valt spann
          ÅSIDOSÄTTER tidsperiod-togglen; ett toggle-val rensar spannet
          (ömsesidigt exklusiva, en tidsfiltrering i taget). */}
      <div className="flex flex-col gap-1">
        <span className="font-medium text-small text-text-secondary">Datum</span>
        <DatumFalt value={datumSpann} onChange={onDatumSpannChange} />
      </div>
    </div>
  );
}

/**
 * Aktivitetshistoriken (TASK-201.6) — GLOBAL, cursor-paginerad LÄS-vy, med
 * filterraden (TASK-201.8, B-målet — kategori/event/tidsperiod).
 * Nås via Mer (mobil/platta, AC #2 — `/mer/`-index) och via länk/route på
 * desktop (hem-spaltens "Se all aktivitetshistorik", TASK-201.7, OBYGGD —
 * routen är redan reachable oavsett, `/mer/aktivitetshistorik`).
 *
 * FILTRENS URL-STATE (TASK-201.8 AC #4 — prövat mot URL-STATE-SPEC:s mönster,
 * inte antaget): specens `/event`-avsnitt är den EXAKTA precedenten — fria
 * dropdown-värden (`typ`/`ort`) som `parseAsString`, en enum-begränsad
 * dropdown (`status`) som `parseAsStringEnum`, en ToggleButtonGroup
 * (`period`) som `parseAsStringEnum().withDefault(...)`, samtliga
 * `history: 'push'` (delbart + back-bart). Denna vy speglar formen 1:1:
 * `?kategori` (enum, nollbar), `?event` (fri sträng, nollbar — eventId-
 * mängden är datadriven precis som `?typ`/`?ort`), `?tidsperiod` (enum,
 * `.withDefault('allt')` — "Allt" ger en REN URL, `clearOnDefault`-
 * beteendet). UTFALL: specens mönster bar filtret rakt av, inget nytt
 * URL-idiom behövdes.
 *
 * A11y (11/10, speglar MailLog/PersonsList):
 * - `<h1>` = "Aktivitetshistorik"; fokus dit när data anlänt ([] är giltigt
 *   laddat → fokus ändå, AC #3). ENDAST vid FÖRSTA lyckade hämtningen
 *   (`announceRef`-spärren) — ett filterbyte flyttar ALDRIG fokus bort från
 *   kontrollen Lotta just använde.
 * - Filterraden (kategori/event-Select + tidsperiod-ToggleButtonGroup) är
 *   fullt tangentbordsnavigerbar via primitivernas egen React Aria-mekanik
 *   (piltangenter/Enter/Escape i Select; piltangenter/Enter/Space i
 *   ToggleButtonGroup) — se primitivernas egna a11y-stycken.
 * - Dagsgrupper som RIKTIGA `<h2>`-rubriker (rubrikstruktur, AC #4) —
 *   speglar `EventsList.tsx`s månadsgruppering.
 * - Landmärket är skalets `<main>` (AppShell) — ingen egen inre landmark
 *   uppfinns ovanpå den (samma val som MailLog/PersonsList).
 * - Data-anländning + "Ladda fler"-tillskott annonseras i `aria-live="polite"`.
 * - Fel: `role="alert"` via MessageBox.
 * - "Tillbaka till Mer"-länk, närvarande i alla tillstånd.
 */
export function AktivitetsHistorik() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  // Filtervalen (TASK-201.8, URL-STATE-SPEC §Event-mönstret — se
  // komponentens egen kommentar ovan för avstämningen mot specen).
  const [kategori, setKategori] = useQueryState(
    'kategori',
    parseAsStringEnum(KATEGORI_VALUES).withOptions({ history: 'push' }),
  );
  const [eventId, setEventId] = useQueryState(
    'event',
    parseAsString.withOptions({ history: 'push' }),
  );
  const [tidsperiod, setTidsperiod] = useQueryState(
    'tidsperiod',
    parseAsStringEnum(TIDSPERIOD_VALUES).withDefault('allt').withOptions({ history: 'push' }),
  );

  // S106-passet, steg 5 — datumspannet i URL:en som två fria
  // ISO-datumsträngar (URL-STATE-SPEC:s `parseAsString`-mönster för
  // datadrivna värden, samma som `?event`). `parseDate` valideras defensivt:
  // en handredigerad ogiltig URL ger null-spann, aldrig en krasch.
  const [fran, setFran] = useQueryState('fran', parseAsString.withOptions({ history: 'push' }));
  const [till, setTill] = useQueryState('till', parseAsString.withOptions({ history: 'push' }));
  const datumSpann = useMemo(() => {
    if (!fran || !till) return null;
    try {
      return { start: parseDate(fran), end: parseDate(till) };
    } catch {
      return null;
    }
  }, [fran, till]);
  const valjDatumSpann = (v: { start: CalendarDate; end: CalendarDate } | null) => {
    setFran(v ? v.start.toString() : null);
    setTill(v ? v.end.toString() : null);
    // Ömsesidig exklusivitet: spannet ersätter tidsperioden helt.
    if (v) setTidsperiod(null);
  };
  const valjTidsperiod = (t: Tidsperiod) => {
    setTidsperiod(t);
    setFran(null);
    setTill(null);
  };

  // `from`/`to` beräknas ENDAST när filtren faktiskt ändras (useMemo) —
  // INTE varje render. `Date.now()` inline i queryKeyen hade gett en NY
  // sträng (och därmed ny cache-post/refetch) varje render; samma disciplin
  // som `EventsList.tsx`/`EventValjare.tsx`s `idagStart`. Spann-grenen:
  // lokal dygnsgräns → ISO (Lottas dag, inte UTC-dygnet).
  const from = useMemo(
    () =>
      datumSpann
        ? new Date(`${datumSpann.start.toString()}T00:00:00`).toISOString()
        : tidsperiodFran(tidsperiod, Date.now()),
    [datumSpann, tidsperiod],
  );
  const to = useMemo(
    () =>
      datumSpann ? new Date(`${datumSpann.end.toString()}T23:59:59.999`).toISOString() : undefined,
    [datumSpann],
  );
  const kategoriIri = kategori ? ACTIVITY_OBJECT_TYPES[kategori] : undefined;

  const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useActivityLogHistory({ category: kategoriIri, eventId: eventId ?? undefined, from, to });

  // Event-dropdownens alternativ — delar queryKey med EventValjare/EventsList
  // (varm cache vid navigering från Event; se FilterRad-komponentens huvud).
  const dataSource = useDataSource();
  const { data: eventsData, isPending: eventerLaddar } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });
  // Sortering (TASK-201.17): NAMN primär nyckel (oförändrat), STARTDATUM
  // sekundär tie-break. Utan tie-breaken låg identiskt namngivna event
  // (samma kurs, flera orter/datum — se `eventFilterEtikett` ovan) i
  // godtycklig Airtable-radordning sinsemellan; kronologisk tie-break
  // grupperar och ordnar dem läsbart. `startdatum` är ISO "YYYY-MM-DD" —
  // lexikografisk `localeCompare` är redan kronologisk, ingen `Date.parse`
  // behövs. `?? ''` sorterar events UTAN datum tidigast (null-säkert, aldrig
  // ett kastat fel).
  const eventOptions = useMemo(
    () =>
      [...(eventsData ?? [])].sort((a, b) => {
        const namnCmp = eventVisningsNamn(a).localeCompare(eventVisningsNamn(b), 'sv');
        return namnCmp !== 0 ? namnCmp : (a.startdatum ?? '').localeCompare(b.startdatum ?? '');
      }),
    [eventsData],
  );

  const filterAktiv =
    kategori != null || eventId != null || tidsperiod !== 'allt' || datumSpann != null;
  const rensaFilter = () => {
    setKategori(null);
    setEventId(null);
    setTidsperiod(null);
    setFran(null);
    setTill(null);
    // Filterraden stannar monterad (keepPreviousData), men RESULTATLISTAN
    // byts ut under fötterna på "Rensa filter"-knappen (den unmountas med
    // tomläget) — flytta fokus till den stabila h1:an i stället för att
    // låta det falla till <body> (samma stabila-ankare-princip som
    // EventsList.tsx:s `filterKnappRef`, fast anpassad: den raden HAR ingen
    // egen tratt-knapp — filterraden är alltid synlig, AC #1).
    headingRef.current?.focus();
  };

  const statements = data?.pages.flatMap((page) => page.statements) ?? [];

  const loadMoreRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const loadMoreTriggered = useRef(false);
  const prevCountRef = useRef(0);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (data && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Aktivitetshistorik';
    }
  }, [data]);

  // "Ladda fler"-round-tripens fokus-behållning + aria-live-antalsbesked
  // (speglar PersonsList.tsx EXAKT).
  useEffect(() => {
    if (isFetchingNextPage) return;
    if (!loadMoreTriggered.current) {
      prevCountRef.current = statements.length;
      return;
    }
    const added = statements.length - prevCountRef.current;
    prevCountRef.current = statements.length;
    loadMoreTriggered.current = false;
    if (added > 0) {
      setAnnouncement(
        `${added} fler ${added === 1 ? 'post' : 'poster'} laddade, ${statements.length} totalt.`,
      );
      if (loadMoreRef.current) loadMoreRef.current.focus();
      else statusRef.current?.focus();
    }
  }, [isFetchingNextPage, statements.length]);

  /* TASK-299.11 — PROMOVERAD: husets delade SidRam-primitiv (kant-i-kant-
   * dialekten, endast sidkromet — ADR-103 B2 steg 1) är nu den ENDA formen.
   * Dev-växeln `?sidram=ny` (TASK-299.1) är riven (ADR-103 B2 steg 4);
   * facit-manifestet amenderat till klass (c), se
   * s106-aktivitetslogg/AMENDERING-2026-08-23-sidram-promovering.md.
   * Kromet + rubriken renderas i ALLA tre tillstånd — stabil geometri,
   * rubriken hoppar inte in när datan landar. `headerKlass` håller
   * px-4-indraget samlat på EN plats i stället för tre; hela
   * innehållskolumnen under (FilterRad, dagsgrupperna, LaddLage) delar
   * SAMMA px-4-marginal (TASK-299.2-mätningens fynd: annars driver
   * innehållet 16 px ur linje med rubriken).
   */
  const kromKnapp = <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />;
  const headerKlass = 'flex flex-col gap-1 px-4';

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" data-testid="aktivitetshistorik-yta">
        {kromKnapp}
        <header className={headerKlass}>
          <h1 className="font-semibold text-3xl">Aktivitetshistorik</h1>
        </header>
        <LaddLage />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4" data-testid="aktivitetshistorik-yta">
        {kromKnapp}
        <header className={headerKlass}>
          <h1 className="font-semibold text-3xl">Aktivitetshistorik</h1>
        </header>
        <MessageBox intent="error" title="Kunde inte hämta aktivitetshistoriken">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </div>
    );
  }

  const nuMs = Date.now();
  const grupper = grupperaPerDag(statements, nuMs);
  const total = statements.length;
  // TASK-225.2: filtermängdens totalantal ur SENASTE sidan (EF:en räknar om
  // per anrop — färskast vinner). `undefined` mot en äldre EF-deploy utan
  // fältet → statusraden faller till interimsformen (skew-säkert).
  const totalAntal = data?.pages.at(-1)?.total;

  return (
    <div className="flex flex-col gap-4" data-testid="aktivitetshistorik-yta">
      {kromKnapp}

      <p className="sr-only" role="status" aria-live="polite">
        Aktivitetshistorik laddad.
      </p>

      <header className={headerKlass}>
        {/* Programfokuset (AC #3, skärmläsarens landningspunkt) BEHÅLLS;
            ringen släcks av base.css:s h1[tabindex="-1"]-släckare
            (TASK-225.4 — husets facit-rubriker är rena, och tabIndex={-1}
            nås aldrig via Tab så ingen indikator förloras). */}
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
          Aktivitetshistorik
        </h1>
      </header>

      {/* Filterraden (AC #1) — OVANFÖR listan, alltid synlig (ingen
          disclosure/tratt-panel; alla tre kontroller är redan i sikte). */}
      <FilterRad
        kategori={kategori}
        onKategoriChange={setKategori}
        eventId={eventId}
        eventOptions={eventOptions}
        eventerLaddar={eventerLaddar}
        onEventChange={setEventId}
        tidsperiod={tidsperiod}
        onTidsperiodChange={valjTidsperiod}
        datumSpann={datumSpann}
        onDatumSpannChange={valjDatumSpann}
      />

      {total === 0 ? (
        filterAktiv ? (
          // AC #2 — TOMLÄGE FÖR FILTRERAT NOLLRESULTAT: SKILT från
          // första-gången-tomläget nedan (annan text, annan handling —
          // "Rensa filter" i stället för det lugna välkomstbudskapet).
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-2 px-4 py-12 text-center"
          >
            <p className="font-medium text-body">Inga träffar med det filtret</p>
            <p className="max-w-md text-small text-text-muted">
              Prova ett annat filter, eller rensa för att se allt.
            </p>
            <AriaButton
              onPress={rensaFilter}
              className="rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
            >
              Rensa filter
            </AriaButton>
          </div>
        ) : (
          // AC #3 (TASK-201.6) — TOMLÄGE FÖRSTA GÅNGEN: vänligt, på Lotta-
          // språket (Gunilla-principen). Systemet är nytt, inte trasigt
          // (speglar MailLog/PersonsList k11). Ett kolon ersätter det
          // illustrativa långa tankstrecket i den ursprungliga
          // FEATURE-ACTIVITY-LOG.md-copyn — samma check-langa-streck-skäl
          // som radens "·"-separator ovan.
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-1 px-4 py-12 text-center"
          >
            <p className="font-medium text-body">Ingen aktivitet ännu</p>
            <p className="max-w-md text-small text-text-muted">
              Här kommer du snart se allt du gör i appen: betalningar, bekräftelser, mail och mer.
              Allt sparas automatiskt, så du aldrig behöver undra vad som hände.
            </p>
          </div>
        )
      ) : (
        <>
          <p
            ref={statusRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="px-4 text-small text-text-muted"
          >
            {/* TASK-225.2 — MÅLFORMEN (Marcus 2026-08-15): "Visar N av
                TOTAL poster." när fler finns, "Visar alla N poster." när
                allt är laddat. Interimsformen står kvar som SKEW-FALLBACK:
                mot en äldre EF-deploy utan total-fältet visas den i stället
                för NaN (Vercel Skew-klassen). */}
            {hasNextPage
              ? totalAntal != null
                ? `Visar ${total} av ${totalAntal} poster.`
                : `Visar de ${total} senaste posterna · fler finns.`
              : `Visar alla ${total} ${total === 1 ? 'post' : 'poster'}.`}
          </p>

          {/* Dold live-region ENDAST för "Ladda fler"-tillskottet — status-
              raden ovan bär redan den INLEDANDE aria-live-rollen. */}
          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>

          <div className="flex flex-col gap-6 px-4">
            {grupper.map((grupp) => (
              <section key={grupp.label} className="flex flex-col gap-2">
                <h2 className="px-2 font-semibold text-small text-text-secondary">{grupp.label}</h2>
                <ul
                  aria-label={`Aktiviteter, ${grupp.label.toLowerCase()}`}
                  className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
                >
                  {grupp.statements.map((s) => (
                    <AktivitetsRad key={s.id} statement={s} grupp={grupp.label} nuMs={nuMs} />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center">
              <AriaButton
                ref={loadMoreRef}
                aria-busy={isFetchingNextPage}
                isDisabled={isFetchingNextPage}
                onPress={() => {
                  loadMoreTriggered.current = true;
                  fetchNextPage();
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized data-[disabled]:opacity-60 motion-safe:transition-colors"
              >
                Ladda fler
              </AriaButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
