/**
 * Personer-listan — sökbar vy över det FÖRLADDADE personregistret
 * (`ADR-123`, TASK-286.2) och router-context-DI (`ADR-055`). Skarp
 * produktionskod.
 *
 * [DATAKÄLLEBYTE, TASK-286.2] Läste tidigare `listPersons` sida för sida via
 * `useInfiniteQuery`, keyad på söktermen — varje tecken gav en ny EF-rundtur
 * och ett skelett (`ADR-056`). Läser nu `fetchPersonsRegister()` EN gång
 * (`queryKeys.persons.register`, global 5 min staleTime) och söker/paginerar
 * i minnet över den laddade arrayen (`src/lib/person-sok.ts`) — noll
 * nätverksanrop efter första laddningen. `listPersons`/`persons.search` lever
 * kvar orörda i adaptern tills sista konsumenten är borta (ADR-123 § Beslut
 * 1) — TASK-286.3 river dem. Sortering är OFÖRÄNDRAD (EF:ens `Namn`-asc,
 * Airtables ordning) tills TASK-286.3 lägger svensk kollation.
 *
 * HÄRKOMST, eftersom den förklarar formen: detta ÄR S90/S103-konvergensens
 * prototyp, PROMOVERAD enligt `ADR-103` (B1 promoveringsformen, B2 steg 4
 * rivningen) och godkänd av Marcus 2026-08-10 (kvitto:
 * `tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json` § godkand,
 * satt via `ADR-104`:s kanalseparation). "Det skarpa bygget" är avskaffat som
 * begrepp — den godkända formen byggs aldrig om, den flyttas hit. Filen bytte
 * alltså namn FRÅN `PersonsListPrototyp.tsx`; git bär bytet som en rename, så
 * historiken följer formen och inte filnamnet.
 *
 * Vad rivningen tog: `PROTO_VARIANTS`, rail-monteringen och `?variant=a`-
 * villkoret i `src/routes/_authenticated/personer/index.tsx`. Villkor och
 * växlar — ALDRIG form. De inline-kommentarer nedan som citerar konvergensens
 * steg (k03 kortanatomin, k09 räknar-raden, k11 tomläget, k14 statuskolumnen,
 * k15 närheten) är KVAR med avsikt: de är designskälen till varför formen ser
 * ut som den gör, och samma val gjordes vid eventsidans rivning
 * (`Deltagare.tsx` bär sina kvar). Ett steg-märke är historia, inte en växel.
 *
 * FORMEN som godkändes: tonal kortyta med `divide-y`-avdelare · låst radhöjd ·
 * status ('Aktiv anmälan') som egen kolumn med reserverad plats · e-post ensam
 * på kontaktraden · interaktionsraden avskild med 4 px, utan ikon. Marcus dom
 * på den byggda-och-rivna klockan (k16): *"Klockan kan tas bort, avståndet
 * räcker."*
 *
 * `data-testid="personer-yta"` sitter på alla tre render-grenarna (pending /
 * error / listläge) som ANKARE för regressionslåset
 * (`tests/visual/personer-promoverings-grind.spec.ts`, `ADR-103` B4). Ett
 * attribut, ingen ny DOM-nod — testid:t flippar ingen form, samma mönster som
 * `register-yta` i `Deltagare.tsx`. Sex `ariaSnapshot`-referenser fångades ur
 * variant-läget FÖRE promoveringen och är sedan dess ORÖRDA; de gäller nu som
 * regressionslås över denna fil.
 *
 * Datavägen gick genom `useDataSource`/`ADR-055`/`057` (router-context-DI)
 * redan i prototyp och skarp, och gör det fortfarande — TASK-286.2 bytte
 * VILKEN adapter-metod som anropas (`fetchPersonsRegister` i stället för
 * `listPersons`), aldrig VÄGEN dit.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRight, X } from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Button as AriaButton, Input as AriaInput, SearchField } from 'react-aria-components';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useDataSource } from '@/data/useDataSource';
import type { Person } from '@/domain/models/Person';
import { filtreraPersonregister } from '@/lib/person-sok';
import { queryKeys } from '@/queries/keys';

/**
 * [PROTOTYPE] FORKEN i steg k03 är AVGJORD (Marcus, S103 2026-08-10:
 * *"Skrota Zebra-grejen"*). Kortytan är TONAL — en tonal kortyta för hela
 * listan med `divide-y`-avdelare mellan raderna (DetaljGrupp.tsx:29-36 +
 * :63-71, eventsidans facit). Zebra-grenen (varannan rad tintad utan
 * avdelare, NyaAnmalningarCard.tsx:163-169) är riven; den bor kvar som
 * historik i `k03b-*` och `slutlage-zebra-*` i bilagemappen.
 *
 * Valet är oberoende belagt två gånger: Marcus öga, och ett research-pass
 * (`docs/research/personlista-scanlista-branschmonster-2026-08-10.md`) där
 * fem designsystem bygger en-kolumns scanlistor med avdelare och aldrig
 * zebra — zebra hör till tabellklassen, vars motiv (horisontell spårning
 * över kolumner) den här listan saknar. A11y pekade åt samma håll: vår
 * zebra-variant bar radseparationen enbart i bakgrundstinten, utan
 * kompensation under `prefers-contrast: more` eller forced-colors.
 *
 * Vinnaren behåller sin nyckel (`?variant=a`, ADR-074 beslut 1).
 *
 * Aldrig 50 fristående kort per person: den formen bär 3-12 poster (EventCard),
 * inte en scanlista som ska tåla 200 rader (Marcus-lås).
 */

/**
 * [OMTOLKAD, TASK-286.2] Var EF:ens cursor-sidstorlek (ADR-056); är nu det
 * RENA KLIENT-RENDER-FÖNSTRET över det redan laddade registret (ADR-123
 * beslut 5) — talet 50 är oförändrat, men ingen sida hämtas längre. "Ladda
 * fler" utökar fönstret ur SAMMA i minnet filtrerade array, synkront (ingen
 * ny EF-rundtur, ingen laddningsstat att visa).
 */
const PAGE_SIZE = 50;

/**
 * [PROTOTYPE] STEG 6 (k06) — skeleton-radernas antal OCH namnbredder.
 *
 * Tio rader = "en trolig sida" i den frusna fixturvärlden, och ungefär två
 * mobila vyportar. ÄRLIG SPÄNNING: skarp `PAGE_SIZE` är 50, så exakt
 * slutgeometri för en hel sida är omöjlig utan en 3 000 px skeleton-vägg —
 * §15:s "lika många rader" tolkas här som "lika många rader man faktiskt ser".
 * Byggkrav till skarpt utförande: bekräfta talet mot verklig sidhöjd.
 *
 * Bredderna varieras deterministiskt så laddläget läses som en LISTA av namn,
 * inte som en streckkod — men aldrig slumpat (snapshots måste vara stabila).
 */
const SKELETON_NAMNBREDD = [
  'w-2/5',
  'w-1/2',
  'w-1/3',
  'w-2/5',
  'w-1/2',
  'w-1/3',
  'w-2/5',
  'w-1/2',
  'w-1/3',
  'w-2/5',
];

/**
 * [OMTOLKAD, TASK-286.2] Fördröjning innan en sökterm skrivs till URL:en
 * (delbar länk) — utlöser INTE längre en server-sökning: FILTRERINGEN är
 * odebouncad (`useDeferredValue`, ADR-123 beslut 5), enbart URL-synken bär
 * kvar detta talet.
 */
const SEARCH_DEBOUNCE_MS = 250;

/** Sammansatt visningsnamn ur de namnfält Airtable kan leverera. */
function displayName(person: Person): string {
  if (person.namn) return person.namn;
  const composed = [person.fornamn, person.efternamn].filter(Boolean).join(' ');
  return composed || 'Okänt namn';
}

/**
 * Kontaktrad — ENBART e-post. INTE ort, INTE telefon.
 *
 * [PROTOTYPE] STEG 12-13 (S103) lade orten till raden. Riven S103 senare pass
 * (Marcus 2026-08-10, ordagrant): *"vi frågar inte efter ort i
 * anmälningsformuläret... Ja då måste ju ort bort helt och hållet i de
 * sammanhang där det ser ut att visa var personen bor."*
 *
 * `Personer.ort` är INTE personens hemort — det är en ROLLUP över personens
 * ANMÄLNINGAR av `Anmälningar.Ort` (en post per anmälan, inklusive tomma).
 * Mätt i prod-basen 2026-08-10: 27 personer har två eller fler olika orter
 * (t.ex. Roger Mukka: Falköping, Rönninge, Varberg). En rad som visar orten
 * bredvid namnet läses som "var hen bor" och är i så fall ofta fel eller
 * inkonsekvent — den tidigare motiveringen ("orten är det starkaste
 * särskiljande draget efter namnet") är därmed falsifierad. Fältet är
 * fortsatt legitimt för SÖKNING (`get-persons` SEARCH_FIELDS) — det är
 * VISNINGEN som ljög, inte datat. Telefonen ströks redan i samma S103-pass
 * (Marcus: *"telefon spelar ju ingen roll, det ska vi ju inte visa i
 * personlistan ändå"*) och återinförs inte här.
 *
 * SAKNAD E-POST RÖR ALDRIG LAYOUTEN: en person utan e-post får `contactLine`
 * = null, aldrig en kortare rad. Höjdlåset bor i raden nedan; detta är bara
 * halva skälet till att det håller.
 */
function contactLine(person: Person): string | null {
  return person.email ?? null;
}

/**
 * [PROTOTYPE] STEG 12 (k12) — hur kall kontakten är, i klartext.
 *
 * Speglar basens egen `Textfält bonus`-formel (Idag/Igår/N dagar sedan) så
 * appen och Airtable talar samma språk om samma sak. Siffran bärs av
 * `tabular-nums` i anropet så talen står i kolumn när ögat scannar nedåt.
 */
function dagarText(dagar: number): string {
  if (dagar === 0) return 'Idag';
  if (dagar === 1) return 'Igår';
  return `${dagar} dagar sedan`;
}

/**
 * [PROTOTYPE] STEG 13 (k13) — initialerna för cirkeln.
 *
 * KOPIERAD ur `PersonMiniKort.tsx:6-13`, avsiktligt och tillfälligt: den
 * komponenten är SKARP kod som `AnmalanDetail` konsumerar, och att bredda den
 * före Marcus godkännande vore att ändra en skarp yta i strid med ADR-102 B3.
 * Promoveringen konsoliderar - se radens docblock nedan.
 */
function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * [PROTOTYPE] STEG 7 (k07) — INSTANT. Osynlig i bild, störst kännbar effekt.
 *
 * Värmer persondetaljen på AVSIKT (ADR-078 beslut 3): hover/fokus är den
 * tidigaste ärliga signalen om att en rad ska öppnas, så `get-person` startar
 * där i stället för vid klicket. `get-person` batch-hämtar hela kurshistoriken
 * och är EF-familjens tyngre anrop — utan värmningen hinner den aldrig bli
 * instant. Idempotent: React Query dedupar och `staleTime` gör upprepad avsikt
 * gratis.
 *
 * `useCallback`-memoiseringen är LOAD-BEARING (EventCard.tsx:44, byggunderlagets
 * R8): utan stabil identitet re-avfyras avsikten vid varje omrendering utan ny
 * användarsignal. Deps är `[dataSource, queryClient]` — inget annat.
 */
function useForberedPersonDetalj(): (personId: string) => void {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  return useCallback(
    (personId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.persons.detail(personId),
        queryFn: () => dataSource.fetchPerson(personId),
        staleTime: 30_000,
      });
    },
    [dataSource, queryClient],
  );
}

/**
 * [PROTOTYPE] STEG 4 (k04) — pill-formen ur `Gruppdynamik.tsx:106-112`.
 * `bg-surface` (inte `bg-bg-muted`) eftersom pillen sitter INUTI den tonala
 * kortytan — en pill i kortets egen ton hade varit osynlig.
 */
function Pill({
  ton = 'neutral',
  dold = false,
  children,
}: {
  ton?: 'neutral' | 'aktiv';
  dold?: boolean;
  children: string;
}) {
  return (
    <span
      aria-hidden={dold || undefined}
      className={`shrink-0 rounded-full px-2 py-0.5 font-medium text-caption ${
        ton === 'aktiv' ? 'bg-primary-tint text-text' : 'bg-surface text-text-secondary'
      } ${dold ? 'invisible' : ''}`}
    >
      {children}
    </span>
  );
}

/**
 * [PROTOTYPE] Personlistan — konvergens-passets SENASTE steg (k11).
 *
 * Filen började som EXAKT KOPIA av `PersonsList` (2026-07-26, steg k01: sju
 * element klonade byte-för-byte per byggunderlagets §1.3-tabell — bevisat
 * exakt, samma SHA-256 som skarpa vyns skärmdump i båda bredderna). Varje
 * efterföljande steg ändrade EN sak, frystes med ett snapshot-par och
 * ändrades sedan vidare i samma fil.
 *
 * Stegen och deras motiv (fulltext + bilder:
 * `tasks/sessions/bilagor/s90-personlistan-konvergens/README.md`):
 *
 *   k01 exakt kopia · k02 sid-insetens dubbelkant (i routen) · k03 kortanatomin
 *   (FORK: AVGJORD, tonal) · k04 metadata-grammatiken · k05 helradslänk + chevron ·
 *   k06 lugnt laddläge · k07 prefetch på avsikt · k08 sökfältets form ·
 *   k09 räknar-raden som meta · k10 "Ladda fler" som kapsel · k11 tomläget.
 *
 * Det som INTE byggdes, medvetet: bokstavsgruppering (Marcus-beslut; cursor-
 * pagineringen skär grupper mitt itu vid sidgränsen).
 *
 * Datahämtning, sök-debounce, cursor-paginering, fokus-behållning och
 * aria-live-annonsering är OFÖRÄNDRADE ur skarpa komponenten — passet handlar
 * om formen, inte om mekaniken.
 */
export function PersonsList() {
  const dataSource = useDataSource();
  // [PROTOTYPE] STEG 7 (k07) — värmning av persondetaljen på avsikt.
  const varmDetalj = useForberedPersonDetalj();
  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));

  const [searchInput, setSearchInput] = useState(() => q);

  // URL-synken (delbar länk, AC #6) — OFÖRÄNDRAD sedan innan TASK-286.2.
  // Notera att detta INTE längre driver filtreringen (se `deferredSearchTerm`
  // nedan) — enbart `q`/adressfältet.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== q) setQ(searchInput || null);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput, q, setQ]);

  // ADR-123 beslut 5 — FILTRERINGEN är odebouncad: `useDeferredValue` håller
  // sökfältet responsivt (input-uppdateringen prioriteras alltid) medan
  // React kan deprioritera om-renderingen av den filtrerade listan, utan att
  // införa en artificiell tidsgräns. Detta är den ENDA källan filtret och
  // räknarraden läser — `q` (ovan) rör aldrig filtreringen.
  const deferredSearchTerm = useDeferredValue(searchInput);

  // TASK-286.2 (ADR-123 beslut 1) — HELA registret, EN gång, global 5 min
  // staleTime (defaultOptions, `src/router.ts`). `TabBar.tsx` prefetchar
  // SAMMA nyckel på hover/fokus (ADR-078 beslut 3), så det vanliga fallet är
  // att denna frågan redan är varm när Lotta når sidan.
  const {
    data: register,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.persons.register,
    queryFn: () => dataSource.fetchPersonsRegister(),
  });

  // Sök i klienten — byte-för-byte paritet med EF:ens SEARCH()-formel
  // (`src/lib/person-sok.ts`, ADR-123 beslut 2). Sortering är OFÖRÄNDRAD
  // (registrets egen Namn-asc-ordning ur EF:en) — svensk kollation är
  // TASK-286.3.
  const filteredPersons = useMemo(
    () => filtreraPersonregister(register ?? [], deferredSearchTerm),
    [register, deferredSearchTerm],
  );

  // Klient-render-fönstret (ADR-123 beslut 5) — "Ladda fler" utökar detta,
  // aldrig en ny hämtning. Fönstret återställs till FÖRSTA sidan varje gång
  // sökningen ändras (en ny sökning börjar alltid om från början).
  //
  // "ADJUSTING STATE WHEN A PROP CHANGES" (react.dev/learn/you-might-not-
  // need-an-effect), inte en `useEffect`: jämförelsen + `setVisibleCount`
  // sker UNDER rendering, inte i en passerad effekt. En effekt hade antingen
  // krävt en `useExhaustiveDependencies`-avstängning (kroppen LÄSER aldrig
  // `deferredSearchTerm` — den finns bara som TRIGGER i deps-arrayen, vilket
  // linten korrekt flaggar som en obehövd dependency) eller kostat ett extra
  // render-varv innan fönstret hunnit återställas (skelett/gammalt fönster
  // hade blinkat till innan reset). Render-tids-justeringen har ingendera
  // kostnaden.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [foregaendeSokterm, setForegaendeSokterm] = useState(deferredSearchTerm);
  if (deferredSearchTerm !== foregaendeSokterm) {
    setForegaendeSokterm(deferredSearchTerm);
    setVisibleCount(PAGE_SIZE);
  }

  const persons = filteredPersons.slice(0, visibleCount);
  const hasNextPage = filteredPersons.length > persons.length;

  const loadMoreRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const loadMoreTriggered = useRef(false);
  const prevCountRef = useRef(0);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!loadMoreTriggered.current) {
      prevCountRef.current = persons.length;
      return;
    }
    const added = persons.length - prevCountRef.current;
    prevCountRef.current = persons.length;
    loadMoreTriggered.current = false;
    if (added > 0) {
      setAnnouncement(
        `${added} fler ${added === 1 ? 'person' : 'personer'} laddade, ${persons.length} totalt.`,
      );
      if (loadMoreRef.current) loadMoreRef.current.focus();
      else statusRef.current?.focus();
    }
  }, [persons.length]);

  // [PROTOTYPE] STEG 8 (k08) — SÖKFÄLTETS FORM.
  // Appens enda faktiska sökfälts-facit är eventväljarens (EventValjare.tsx:398-423,
  // Marcus-beslut 2026-07-25 våg 3); ingen spec-paragraf finns (0 träffar på
  // "Sökfält" i DESIGN-SYSTEM-SPEC). Formen: `min-h-10` i stället för `size="lg"`
  // (min-h-12 px-4 text-lg — sökfältet slutar dominera sidan), samma
  // input-tokens, native webkit-krysset släckt och ersatt av RAC:s clear-Button
  // i appens grå ikonform (X 16, muted → text vid hover).
  //
  // ÄRLIG NOT till Marcus: `mm-fokusring-vid-fokus` följer med ur den citerade
  // raden, men klassens RATIONALE är overlay-specifik (ringen ska synas vid
  // MUS-öppning av en autofokuserad popover, base.css:119-127). Ett sidfält
  // fokuseras inte automatiskt, så här hade globala `:focus-visible` räckt.
  // Behållen för att låset sa "inklusive" — flagga för skarpt bygge.
  //
  // INGEN `autoFocus`: sidladdnings-autofokus är a11y-golv, inte stil
  // (EventValjare bär propen just för att den ÖPPNAS på användarens handling).
  const searchField = (
    <SearchField
      aria-label="Sök person"
      value={searchInput}
      onChange={setSearchInput}
      className="group flex flex-col"
    >
      <div className="relative">
        <AriaInput
          placeholder="Sök på namn, e-post, telefon eller ort"
          className="text-(color:--mm-input-text) placeholder:text-(color:--mm-input-text-placeholder) mm-fokusring-vid-fokus min-h-10 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 pr-10 text-body [&::-webkit-search-cancel-button]:[-webkit-appearance:none]"
        />
        <AriaButton
          aria-label="Rensa sökningen"
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:text-text group-data-[empty]:hidden"
        >
          <X aria-hidden="true" size={16} className="shrink-0" />
        </AriaButton>
      </div>
    </SearchField>
  );

  // [PROTOTYPE] STEG 6 (k06) — LUGNT LADDLÄGE (spec §15).
  // "Laddar personer…" som naken textrad är ordagrant förbjudet (spec §15,
  // Laddtrappans steg 4: aldrig naken "Laddar…"-textrad som enda laddbesked).
  // Sökfältet är statiskt känd chrome och ritas
  // direkt; ENDAST datakropparna blir skeleton-block, i radernas SLUTgeometri
  // (samma padding, samma gap, samma tre textnivåer) så inget hoppar när data
  // landar. Beskedet bärs av `aria-busy` + ett visuellt dolt sr-only-besked på
  // containern; Skeleton-primitiven är alltid `aria-hidden` (Roselli-mönstret).
  // Mall: EventsList.tsx:505-532. Ingen e2e-assertion hänger i den gamla texten
  // (till skillnad från persondetaljens, byggunderlagets R2).
  if (isPending) {
    return (
      <div className="flex flex-col gap-4" data-testid="personer-yta">
        {searchField}
        <div role="status" aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Laddar personer…</span>
          <Skeleton variant="text" className="w-40 text-small" />
          <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
            {SKELETON_NAMNBREDD.map((bredd, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fast skeleton-rad, ingen identitet
                key={i}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="text-body">
                    <Skeleton variant="text" className={`${bredd} text-body`} />
                  </div>
                  <Skeleton variant="text" className="w-3/5 text-small" />
                  <Skeleton variant="text" className="w-2/5 text-caption" />
                </div>
                {/* Chevronens plats reserveras (18 px) utan att rita en
                    affordans till en rad som ännu inte finns. */}
                <span aria-hidden="true" className="size-[18px] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4" data-testid="personer-yta">
        {searchField}
        <MessageBox intent="error" title="Kunde inte hämta personer">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </div>
    );
  }

  const loadedCount = persons.length;
  // [FÖRENKLAT, TASK-286.2] Var en skew-säker fallback mot en EF-levererad
  // totalsiffra (TASK-277 AC #1) — den full-walken existerar inte längre för
  // listans räkning: `filteredPersons` ÄR redan HELA det filtrerade
  // registret i minnet (ADR-123), så längden är alltid exakt. Ingen
  // separat serversiffra att synka mot, inget skew-fönster.
  const totalCount = filteredPersons.length;

  return (
    <div className="flex flex-col gap-4" data-testid="personer-yta">
      {searchField}

      {/* Dold aria-live-region som annonserar antal nya rader vid "Ladda fler". */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {/* [PROTOTYPE] STEG 11 (k11) — TOMLÄGET.
          `Inga träffar för "zzz".` som en grå metarad är ingen upplevelse: den
          ser ut som om sidan gick sönder tyst. Strukturerat, centrerat tomläge
          i facitets form (EventsList.tsx:559-570): en bärande rad + en dämpad
          förklaring, `py-12` luft. Rollen `status`/`aria-live` FLYTTAR MED hit
          så beskedet fortfarande annonseras — annars vore tomläget tyst för en
          skärmläsare.

          Tomlägets copy hade ETT byggkrav mot `persons-list.staging.test.ts`
          — en fil FLYTTAD i `task-59.4` (ADR-080, Acceptance-klassen); den
          hänger numera i `tests/acceptance/persons-list.acceptance.test.ts`
          (TASK-277 AC #4, rättat efter att raden stod stale i tre veckor). */}
      {loadedCount === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-1 py-12 text-center"
        >
          <p className="font-medium text-body">
            {deferredSearchTerm ? 'Inga träffar' : 'Inga personer ännu'}
          </p>
          <p className="text-small text-text-muted">
            {deferredSearchTerm
              ? `Ingen person matchar "${deferredSearchTerm}".`
              : 'Personer dyker upp här när någon anmäler sig eller lämnar sin e-post.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* [PROTOTYPE] STEG 9 (k09) — RÄKNAR-RADEN BLIR META.
              Placeringen: direkt ovanför kortet med kortets inner-inset
              (`px-4`) och `gap-2` till det — samma rytm som eventsidans
              grupprubriker (DetaljGrupp.tsx:26) och månadsrubrikerna
              (EventsList.tsx:575). Färg-trappan blir max tre steg
              (rubrik → meta → kortets text).

              Copyn: "laddade" är maskin-svenska (Gunilla-principen), och
              grammatikbuggen `1 person laddade` (PersonsList.tsx:164)
              försvinner genom konstruktion när verbet inte längre böjs efter
              antalet. (Historisk not: den promoveringstida VARNINGEN om SJU
              e2e-assertions i `persons-list.staging.test.ts` avsåg en fil
              som redan var flyttad — se `tests/acceptance/persons-list.acceptance.test.ts` —
              och migreringen är sedan länge utförd; ADR-103 B2 steg 4.)

              TASK-277 AC #2 (Marcus 2026-08-18/19, LÅST ordalydelse): den
              gamla "(fler finns)"-svansen utgår HELT. Formen är nu "Visar N
              av TOTAL personer[ för \"sökterm\"]." — `totalCount` är den
              äkta serversiffran (se ovan), inte `hasNextPage`. */}
          <p
            ref={statusRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="px-4 text-small text-text-muted"
          >
            {`Visar ${loadedCount} av ${totalCount} personer${
              deferredSearchTerm ? ` för "${deferredSearchTerm}"` : ''
            }.`}
          </p>

          {/* [PROTOTYPE] STEG 3 (k03) — KORTANATOMIN. Raden slutade vara ett
          `border-b`-fragment och blev en YTA.

          Defekten som revs: `border-b` bar ingen färgklass, och `tailwind.css:12`
          nollställer `--color-*` (Tailwind v4:s default blir currentColor) →
          avdelaren ritades i TEXTFÄRG. Det var den svarta linjen under varje
          rad i k01/k02.

          Formen är facitets kortgrammatik: rundad tonal yta, transparent kant
          som blir synlig under `prefers-contrast: more`, inner-inset px-4 =
          "där rundningen slutar" (DetaljGrupp.tsx:29-36).

          `<ul aria-label="Personer">` BEHÅLLS oförändrad — sex e2e-assertions
          hänger i `getByRole('list', { name: 'Personer' })`
          (`tests/acceptance/persons-list.acceptance.test.ts`, promoverad hit
          via ADR-103 B1; migreringen är sedan länge UTFÖRD, inte en framtida
          "skarpt bygge"-punkt — TASK-277 AC #4 rättade den stale
          framtids-formuleringen). */}
          <ul
            aria-label="Personer"
            className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
          >
            {persons.map((person) => {
              const contact = contactLine(person);
              const namn = displayName(person);
              return (
                // [PROTOTYPE] STEG 13 (k13) — RADEN ÄRVER `PersonMiniKort`s ANATOMI.
                //
                // Marcus 2026-08-10: "Vi behöver ju återvinna här, inte uppfinna …
                // alla dem korten leder ju till persondetaljer, så därför bör det
                // kortet vara grunden." Rätt princip, och den pekar på
                // `PersonMiniKort` (registrations/) - INTE på Gruppdynamiks kopia,
                // vars två avvikelser (ingen chevron, ingen roll-underrad) finns
                // just för att DET kortet inte leder någonstans (Gruppdynamik.tsx
                // :118-127). Personlistans rader leder vidare, så de ärver
                // originalet.
                //
                // ÄRVT: initial-cirkel `size-9` i `bg-bg-emphasized` · namnet
                // `font-medium text-body` · underrads-stapeln · chevron 18 px ·
                // hela ytan klickbar.
                //
                // INTE ÄRVT - `rounded-xl bg-surface` PER RAD. Det är formen för
                // 3-12 poster; k03:s Marcus-lås säger "aldrig 50 fristående kort
                // per person … inte en scanlista som ska tåla 200 rader", och
                // research-passet (docs/research/personlista-scanlista-*) fann
                // fem designsystem som bygger scanlistor med avdelare. Ytan
                // förblir därför den tonala listan; det är radens ANATOMI som
                // återvinns, inte dess inramning.
                //
                // KONSOLIDERAS VID PROMOVERING: `PersonMiniKort` bär
                // "[BIBLIOTEKS-KANDIDAT] … promoveras till primitives/ vid andra
                // konsumenten". Personlistan ÄR den andra (mätt: AnmalanDetail är
                // ensam konsument i dag). Här duplicerar prototypen medvetet
                // hellre än att bredda en skarp komponent före godkännande
                // (ADR-102 B3).
                <li
                  key={person.id}
                  onMouseEnter={() => varmDetalj(person.id)}
                  onFocusCapture={() => varmDetalj(person.id)}
                  className="relative flex items-center gap-3 py-2.5"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
                  >
                    {initialer(namn)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link
                        to="/personer/$personId"
                        params={{ personId: person.id }}
                        className="min-w-0 truncate font-medium text-body underline-offset-2 after:absolute after:inset-0 hover:underline"
                      >
                        {namn}
                      </Link>
                    </div>
                    {/* HÖJDLÅSET, del 1 (Marcus S103: "varje rad MÅSTE ha låst
                        höjd och får ALDRIG växa eller krympa med innehållet").
                        Raden renderas ALLTID - saknas kontakten bär den ` `
                        och håller sin rad. Villkorad rendering hade gjort
                        radhöjden till en funktion av datan, vilket är precis
                        det förbudet gäller. Samma teknik som check-in-räknarens
                        breddlås: platshållaren är osynlig, geometrin konstant. */}
                    <span className="truncate text-caption text-text-muted">{contact ?? ' '}</span>
                    {/* [PROTOTYPE] STEG 12-13 — SENASTE INTERAKTION, TIDEN SOM RUBRIK.
                        Marcus: "man vill ju visuellt se att '103 dagar sedan' är
                        rubriken till interaktionen". Tiden bär därför
                        `text-text-secondary` + `font-medium`, händelsen följer
                        dämpad - vikten bär hierarkin, inte en extra rad (varje
                        radhöjd kostar scanhöjd på 430 px).

                        Texten kommer FÄRDIGFORMAD ur basen ("Anmälde sig till RIM 1
                        i Rönninge"); appen bygger ingen sträng och parsar ingen, så
                        formeländringar slår igenom utan kodändring (ADR-063,
                        ADR-108). Datumet togs ur basformeln 2026-08-10 - tiden stod
                        två gånger när appen redan bar "N dagar sedan".

                        HÖJDLÅSET, del 2: raden renderas ALLTID, med ` ` när
                        interaktionen saknas. Efter bas-filtret (anmälningar > 0)
                        bör varje person i listan ha en interaktion - men höjden
                        får inte VILA på det antagandet. Datan är den enda som
                        kan svika; geometrin ska inte kunna göra det. */}
                    {/* [PROTOTYPE] STEG 15 (k15) — NÄRHET SOM SÄRSKILJARE.
                        Marcus S103: "vi måste göra något mer med designen på
                        korten … hur kan vi särskilja den på ett snyggt sätt?"

                        Textblocket bar INGET mellanrum alls (`flex flex-col`
                        utan `gap`), så namn, e-post och interaktion satt tätt
                        och lästes som ETT grått block. Det var problemet:
                        raderna var geometriskt en enhet.

                        4 px (spacing-skalans grundenhet) före interaktionen
                        delar kortet i TVÅ block i stället för tre rader —
                        identitet (namn + e-post) mot aktivitet (vad som hänt).
                        Ren Gestalt-närhet: ögat ser strukturen utan att läsa.

                        VARFÖR INTE BAKGRUND, som var Marcus första idé: appens
                        neutraler ligger 1.09 isär (T130), vilket mätt räckte
                        för en 26 px pill men är oprövat för en 16 px textrad —
                        och en bakgrundstint försvinner HELT i forced-colors.
                        Det var exakt den invändning som fällde zebra-varianten
                        i samma session (se filhuvudet). Närhet bär i alla
                        kontrastlägen och kostar noll färgsteg; färgtrappan är
                        dessutom redan full på tre steg.

                        PRISET, öppet: raden blir 4 px högre. Filen bokför att
                        "varje radhöjd kostar scanhöjd på 430 px". Höjdlåset är
                        opåverkat — raden blir lika mycket högre för ALLA, så
                        höjden förblir oberoende av datan, vilket är vad låset
                        skyddar. */}
                    <span className="mt-1 truncate text-caption">
                      {person.senasteInteraktion ? (
                        <>
                          {person.dagarSedanSenaste != null && (
                            <span className="font-medium text-text-secondary tabular-nums">
                              {dagarText(person.dagarSedanSenaste)}
                              {' · '}
                            </span>
                          )}
                          <span className="text-text-muted">{person.senasteInteraktion}</span>
                        </>
                      ) : (
                        ' '
                      )}
                    </span>
                  </div>
                  {/* [PROTOTYPE] STEG 14 — STATUSEN SOM EGEN KOLUMN.
                      Marcus S103: "flytta ut 'Aktiv anmälan' pillen till höger
                      istället. Då sitter den alltid på samma ställe oavsett hur
                      långt eller kort namnet är." Pillen satt förut inuti
                      namn-raden och vandrade därmed i sidled med namnlängden -
                      i en scanlista är det ögat som betalar, eftersom statusen
                      inte går att fixera med blicken.

                      Pillen bär redan `shrink-0` i sin egen form (Pill, ovan),
                      så den kläms aldrig av ett långt namn; textblockets
                      `min-w-0 flex-1` tar smällen med truncate i stället,
                      vilket är rätt part att låta ge vika.

                      DOM-ORDNINGEN FLYTTAS MED AVSIKT. Pillen läses nu efter
                      interaktionsraden i stället för direkt efter namnet.
                      Skärmläsarordningen följer därmed den visuella ordningen,
                      vilket är kravet - inte tvärtom.

                      `harAktivAnmalan` är en formel som ger "Aktiv" ELLER
                      "Ingen aktiv anmälan" - ALDRIG falsy. Dagens
                      truthiness-gren (PersonsList.tsx:189) skriver därför ut
                      icke-statusen ordagrant. Pillen jämför mot STRÄNGVÄRDET.

                      BREDDLÅSET (Marcus S103: "reservera alltid plats", husets
                      stående mönster): pillen renderas ALLTID och döljs med
                      `invisible` när personen saknar aktiv anmälan - aldrig med
                      villkorad rendering. Annars hade textens brytpunkt
                      varierat mellan rader med och utan pill, och kolumnen
                      blivit ojämn i precis den scanlista den ska hjälpa.
                      Samma teknik som check-in-räknarens breddlås
                      (`FramstegskortD` i EventCheckin.tsx, TASK-214.4:
                      linjenumret drev när A/B/C revs, sök på "Breddlåset"
                      i stället för ett fryst tal): osynlig platshållare,
                      geometrin konstant. `visibility: hidden` tar dessutom bort
                      elementet ur tillgänglighetsträdet, så skärmläsaren hör
                      ingen status som inte finns - `aria-hidden` sätts ändå
                      explicit, samma form som husets övriga platshållare.

                      HÖJDLÅSET är opåverkat: raden är `items-center` och dess
                      höjd sätts av textblockets tre rader, som alltid renderas.
                      Pillen är lägre än så. */}
                  <Pill ton="aktiv" dold={person.harAktivAnmalan !== 'Aktiv'}>
                    Aktiv anmälan
                  </Pill>
                  <ChevronRight
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-text-secondary"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* [PROTOTYPE] STEG 10 (k10) — "LADDA FLER" SOM KAPSEL.
          Formen är väljarnas mjuka kapsel (EventsList.tsx:464) i stället för
          primitivens `secondary md` — spec §19: solid fyllnad hör inte hemma
          i/under en kortyta, och en sekundär rad-handling bär text + mjuk ton.

          [FÖRENKLAT, TASK-286.2] "Ladda fler" utökade tidigare via en NY
          EF-rundtur (`fetchNextPage`), med en `Laddar…`/`aria-busy`-mellanstat
          under svaret. Registret är redan HELT i minnet (ADR-123) — utökningen
          är nu en synkron array-slice, ingen väntan, inget mellanstat att visa.
          STABILT TILLGÄNGLIGT NAMN kvarstår ändå som egenskap (namnet växlade
          ALDRIG, oavsett mekanism) — bara `aria-busy`/`isDisabled` föll bort
          som obehövda. Fokus-behållningen (annonserings-effekten ovan) är
          OFÖRÄNDRAD — den är hela skälet till att knappen finns i stället för
          oändlig scroll. */}
      {hasNextPage && (
        <div className="flex justify-center">
          <AriaButton
            ref={loadMoreRef}
            onPress={() => {
              loadMoreTriggered.current = true;
              setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredPersons.length));
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized data-[disabled]:opacity-60 motion-safe:transition-colors"
          >
            Ladda fler
          </AriaButton>
        </div>
      )}
    </div>
  );
}
