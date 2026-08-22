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
 * nätverksanrop efter första laddningen.
 *
 * [SORTERING + RIVNING, TASK-286.3] Listan sorteras nu med `Intl.Collator('sv')`
 * på den laddade arrayen (ADR-123 beslut 4): A–Z, Å, Ä, Ö, med basens
 * namnlös-sentinel (`Ej tillgängligt`, fälla 43) sist. Det stänger fälla 51:s
 * synliga inkonsekvens — Å låg bland A vid bläddring men i egen hink vid
 * filter, eftersom Airtables egen sortering var en vägg och vår array inte är
 * det. `listPersons`/`persons.search` och deras typer är RIVNA i samma skiva
 * (sista konsumenten försvann med TASK-286.2, ADR-123 § Beslut 1); EF:ens
 * sök-/cursor-gren lever kvar och VARFÖR står i `get-persons/index.ts`.
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
import {
  Button as AriaButton,
  Input as AriaInput,
  SearchField,
  Toolbar,
} from 'react-aria-components';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useDataSource } from '@/data/useDataSource';
import type { Person } from '@/domain/models/Person';
import {
  arGiltigHink,
  BOKSTAVSHINKAR,
  bokstavshinkarMedPersoner,
  filtreraPaBokstavshink,
  filtreraPersonregister,
  HINK_UTAN_NAMN,
  HINK_UTAN_NAMN_ETIKETT,
  personVisningsnamn,
  sorteraPersonregister,
} from '@/lib/person-sok';
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
 * [TASK-283.2] BOKSTAVSRADEN — 29 bokstäver plus hinken för namnlösa, direkt
 * under sökrutan (PRD `TASK-283`).
 *
 * ═══ ETT TABBSTEG, INTE TRETTIO (AC #6) ═══
 *
 * Motorn är `react-aria-components` egen `Toolbar` (1.20.0), inte en egen
 * roving-tabindex. Den bär APG:s Toolbar-mönster
 * (`w3.org/WAI/ARIA/apg/patterns/toolbar/`): raden är EN tabbstation, och
 * pil vänster/höger flyttar fokus mellan knapparna inuti den. Mekaniken i
 * `useToolbar` är värd att känna till, eftersom den INTE är den klassiska
 * `tabIndex={-1}`-varianten: knapparna behåller sin naturliga tabbordning,
 * och Tab INUTI raden fångas av en `onKeyDownCapture` som först flyttar
 * fokus till radens SISTA (eller vid Shift+Tab FÖRSTA) knapp och sedan låter
 * webbläsaren tabba vidare därifrån. Utfallet är detsamma som roving
 * tabindex ger — ett steg in, ett steg ut — och det är utfallet AC #6 mäter,
 * i `tests/acceptance/persons-list.acceptance.test.ts`.
 *
 * ═══ VANLIGA KNAPPAR MED `aria-pressed`, INTE EN RADIOGRUPP ═══
 *
 * PRD-beslutet, och det följer husets egen precedent: `Deltagare.tsx` (rad
 * ~165 + ~312) bär samma idiom för eventsidans summeringsfilter, efter att en
 * `ToggleButtonGroup`-lösning medvetet REVS i `TASK-162.3`. APG:s
 * button-mönster säger dessutom det som gör formen rätt här: *"It is critical
 * the label on a toggle does not change when its state changes"* — `K` förblir
 * `K`, tillståndet bärs av `aria-pressed` och av stilen. Ett andra tryck på
 * samma knapp släpper filtret (AC #2); ingen separat rensa-knapp finns, och
 * det är avsiktligt (användarberättelse 4).
 *
 * ═══ MOBIL-LAYOUTEN: RADBRYTNING, VALD MOT MÄTNING (AC #7) ═══
 *
 * 30 träffmål mot WCAG 2.5.8:s golv på 24 px ryms inte på en enda rad — och
 * INTE HELLER PÅ EN SKRIVBORDSSKÄRM, vilket är den del som räknas fel på
 * papper. `AppShell.tsx:45` kapar innehållskolumnen vid `max-w-[600px] px-4`,
 * alltså 568 px oavsett hur bred skärmen är, medan raden behöver ~1 015 px
 * (29 x 28 + 86,5 + 29 x 2). Talen nedan är MÄTTA i renderad yta med
 * `getBoundingClientRect`, aldrig lästa ur en klass:
 *
 *   viewport   innerbredd   rader   radens höjd   sidan rullar i sidled
 *    320 px      288 px       4        118 px      nej
 *    375 px      343 px       3         88 px      nej
 *    430 px      398 px       3         88 px      nej
 *    768 px      568 px       2         58 px      nej
 *   1280 px      568 px       2         58 px      nej
 *
 * Minsta träffyta i samtliga fem: 28x28 px — fyra pixlar över golvet, med
 * avsikt, så en framtida typsnitts- eller radhöjdsjustering inte tyst äter
 * upp marginalen. `Utan namn` är 86,5 px bred; den är det enda målet som inte
 * är kvadratiskt.
 *
 * VALET stod mellan `flex-wrap` och en horisontellt rullande behållare.
 * Radbrytningen vann på två grunder:
 *
 *   1. WCAG 2.2 SC 1.4.10 (Reflow) — en rullande behållare hade krävt
 *      tvådimensionell rullning för att nå Ö, och en bokstavsrad är inte
 *      den sortens innehåll undantaget i SC:t gäller. Mätningens sista
 *      kolumn är den egenskapen, prövad.
 *   2. Alla 29 bokstäverna syns samtidigt, vilket är hela poängen med en rad
 *      Lotta ska LÄRA SIG var bokstäverna sitter i (användarberättelse 6).
 *      En rullande behållare hade dolt ett tjugotal av dem på telefonen.
 *
 * MELLANRUMMET ÄR 2 px (`gap-0.5`), OCKSÅ ETT MÄTT VAL: med 4 px (`gap-1`)
 * blev 375 px-fallet FYRA rader om 124 px i stället för tre om 88 — 36 px mer
 * av telefonens skärm för två pixlars luft. Golvet är opåverkat, eftersom
 * varje mål självt är 28 px och WCAG 2.5.8 därmed är uppfyllt utan att
 * spacing-undantaget behöver åberopas.
 *
 * Höjden är konstant oavsett tillstånd: antalet knappar ändras aldrig, och
 * kanten är reserverad på ALLA knappar med `border-transparent` — bara färgen
 * byts när en knapp trycks. Det är husets stående breddlås-teknik (samma som
 * kortytans `border border-transparent contrast-more:border-border-strong`),
 * och det är vad `ADR-078`:s layouthopp-förbud kräver av en kontrollrad.
 *
 * [TASK-283.3] Nedtoningen av tomma bokstäver ÄNDRAR INGET AV DETTA, och det
 * är kravet (AC #3): en tom bokstav tonas ned, den tas aldrig bort. Skillnaden
 * mellan aktiv och nedtonad ligger uteslutande i `color` och
 * `background-color` — samma `h-7 min-w-7`, samma `border`, samma `px-1.5`,
 * samma `font-medium text-small`. Raden kan därför inte byta längd vid ett
 * tillståndsbyte, av samma slag av skäl som kanten inte kan: geometrin är
 * skriven en gång och delas av alla tre lägena. Mätt i renderad yta över de
 * fem bredderna nedan, i fyra tillstånd vardera — se
 * `tests/acceptance/persons-list.acceptance.test.ts` § AC #3.
 *
 * `forced-colors`-paret är inte pynt: under Windows högkontrastläge kastas
 * författarens bakgrundsfärger, så ett tryckt tillstånd som BARA bar
 * `bg-primary-tint` hade blivit osynligt. Systemfärgerna `Highlight` /
 * `HighlightText` är den kanoniska vägen att uttrycka "vald" där.
 */
function Bokstavsrad({
  vald,
  onValj,
  hinkarMedPersoner,
}: {
  vald: string | null;
  onValj: (hink: string | null) => void;
  /**
   * Hinkarna som har minst en person i HELA registret, eller `null` så länge
   * registret inte är känt. Se `arNedtonad` nedan för varför `null` inte är
   * detsamma som en tom mängd.
   */
  hinkarMedPersoner: ReadonlySet<string> | null;
}) {
  /**
   * [TASK-283.3] Nedtonad = registret ÄR känt, hinken är tom, och knappen är
   * inte den valda. Tre villkor, och alla tre bär vikt:
   *
   * 1. `hinkarMedPersoner !== null` — OKÄNT ÄR INTE TOMT. Under laddning och i
   *    felläget vet vi ingenting om registret, och att tona ned allt hade dels
   *    målat 30 grå knappar som sedan tänds (ett flimmer i raden, precis vad
   *    kortet förbjuder), dels gjort raden oanvändbar i just det ögonblick
   *    Lotta kan vilja förvälja en bokstav. Nedtoning kräver POSITIV kunskap
   *    om tomhet. Ett tomt register (noll personer) är däremot känt tomt, och
   *    då tonas allt ned med rätta.
   *
   * 2. `!hinkarMedPersoner.has(value)` — mängden är räknad ur HELA registret
   *    (`person-sok.ts`), aldrig ur den sökta eller bokstavsfiltrerade
   *    delmängden. Kortets enda icke förhandlingsbara rad.
   *
   * 3. `!vald` — DEN VALDA HINKEN TONAS ALDRIG NED, och det är en funktionell
   *    spärr, inte kosmetik. Ett andra tryck på den valda knappen är den ENDA
   *    vägen att släppa filtret (TASK-283.2 AC #2; någon separat rensa-knapp
   *    finns medvetet inte). Ett `?bokstav=Ö` ur ett bokmärke — eller en Ö-post
   *    som försvinner ur registret medan filtret står kvar — hade annars gett
   *    en tom lista med den enda utvägen inert, och Lotta hade suttit fast med
   *    adressfältet som enda reträtt.
   */
  const arNedtonad = (hink: string, denna: boolean) =>
    hinkarMedPersoner !== null && !hinkarMedPersoner.has(hink) && !denna;

  return (
    <Toolbar
      aria-label="Filtrera på första bokstaven"
      className="flex flex-wrap gap-0.5"
      data-testid="personer-bokstavsrad"
    >
      {BOKSTAVSHINKAR.map((bokstav) => {
        const denna = vald === bokstav;
        return (
          <BokstavsKnapp
            key={bokstav}
            etikett={`Visa personer som börjar på ${bokstav}`}
            nedtonad={arNedtonad(bokstav, denna)}
            onValj={onValj}
            value={bokstav}
            vald={denna}
          >
            {bokstav}
          </BokstavsKnapp>
        );
      })}
      <BokstavsKnapp
        etikett="Visa personer utan namn"
        nedtonad={arNedtonad(HINK_UTAN_NAMN, vald === HINK_UTAN_NAMN)}
        onValj={onValj}
        value={HINK_UTAN_NAMN}
        vald={vald === HINK_UTAN_NAMN}
      >
        {HINK_UTAN_NAMN_ETIKETT}
      </BokstavsKnapp>
    </Toolbar>
  );
}

/**
 * En knapp i bokstavsraden.
 *
 * `h-7 min-w-7` = 28x28 px, fyra pixlar över WCAG 2.5.8 (AA) golvet på
 * 24x24 — marginalen är avsiktlig, så en framtida typsnitts- eller
 * radhöjdsjustering inte tyst äter upp golvet. Talet är LÅST AV EN MÄTNING i
 * renderad yta, aldrig av att klassen står här (DoD #6). Nedtoningen rör
 * ENBART färg: box, kant, padding och typsnitt är byte för byte desamma i
 * alla tre lägena, vilket är vad som gör AC #3 sann genom konstruktion.
 *
 * NATIV `<button>`, inte RAC:s `Button`: husets `aria-pressed`-idiom
 * (`Deltagare.tsx`) är nativt, och `Toolbar`s fokushantering bryr sig bara om
 * att barnen är fokuserbara. Att lägga en abstraktion emellan hade kostat
 * utan att ge något.
 *
 * ═══ `aria-disabled`, INTE NATIVE `disabled` (TASK-283.3 AC #4) ═══
 *
 * **Kravet avgör INTE valet, och det är värt att säga rakt ut.** AC #4 vill
 * att knappen ligger kvar i tillgänglighetsträdet, märkt otillgänglig — och
 * det gör den i BÅDA formerna. WAI-ARIA 1.2 § 7.1 räknar uttömmande upp vad
 * som utesluts ur trädet (`display:none`, `visibility:hidden`, `hidden`,
 * `role="none|presentation"`); varken `disabled` eller `aria-disabled` står
 * där. HTML-AAM 1.0 § 3.6.42 mappar dessutom native `disabled` till
 * `aria-disabled="true"` för samtliga plattforms-API:er, så exponeringen är
 * IDENTISK. Mätt i en verklig a11y-snapshot: båda syns som
 * `button "…" [disabled]`.
 *
 * Skillnaden ligger enbart i FOKUS:
 *
 *   native `disabled`   ej fokuserbar · osynlig för radens piltangenter
 *   `aria-disabled`     fokuserbar · vi kopplar bort handlingen själva
 *
 * **APG ger ingen regel här utan ett VILLKORAT val**, och citatet är värt att
 * ha rätt (Keyboard Interface Practices § Focusability of disabled controls):
 * *"Allowing keyboard users to skip disabled elements usually reduces the
 * number of key presses… However, screen reader users are far less likely to
 * discover disabled elements that are not focusable"*. Toolbar-mönstret gör
 * `disabled` till default (*"Typically, disabled elements are not focusable"*)
 * med undantaget *"in circumstances where discoverability of a function is
 * crucial"*. APG bär t.o.m. ett toolbar-exempel åt VARDERA hållet: Up/Down
 * använder native `disabled` (*"Given the presence of the 'Down' button,
 * discoverability of the 'Up' button is not a concern"*), medan
 * Copy/Cut/Paste använder `aria-disabled` (*"The discoverability of these
 * features relies on their focusability"*).
 *
 * Kriteriet är alltså: kan användaren SLUTA SIG TILL att kontrollen finns?
 * Tre skäl lägger denna rad på discoverability-sidan:
 *
 * 1. **Det nedtonade tillståndet BÄR INFORMATION här** — det är inte bara
 *    frånvaron av en handling. "Ingen i registret heter något på Ä" är
 *    precis det Lotta vill veta. Med native `disabled` blir svaret en TYSTNAD
 *    mitt i alfabetet, och att höra att P följs av R kräver att man håller
 *    hela alfabetet i huvudet för att märka att Q fattas. `aria-disabled` gör
 *    samma sak till ett positivt besked: "Q, växlingsknapp, nedtonad".
 *    APG:s Up/Down-fall är motsatsen: DÄR bär det avstängda läget ingen
 *    information användaren saknar.
 *
 * 2. **Piltangenterna är enda vägen in till en enskild bokstav.** Verifierat
 *    i `react-aria` 3.51.0:s källa: `useToolbar.mjs:36` skapar en
 *    `createFocusManager(ref)` (ingen roving tabindex — RAC avviker där från
 *    APG:s toolbar-mönster), piltangenterna kör `focusNext`/`focusPrevious`,
 *    och `Tab` (rad 46-53) flyttar till första/sista barnet och lämnar sedan
 *    över till webbläsaren — alltså UT ur raden. Fokus-filtret är
 *    `isFocusable`, vars selektor bär `button:not([disabled])` och nämner
 *    aldrig `aria-disabled` (`utils/isFocusable.mjs:20,32`). Native
 *    `disabled` hade därför gjort de tomma bokstäverna helt onåbara med
 *    tangentbord, inte bara snabbare att passera.
 *
 * 3. **Husets idiom, redan uttryckligen beslutat.** `Button.tsx` § isLoading
 *    avvisar `isDisabled` med samma motivering: *"Klick spärras i stället via
 *    `aria-disabled` (fokus bevaras — knappen tas ALDRIG bort ur
 *    tabordningen…)"*. `BulkAtgardsknapp.tsx` bär formen rakt. Det är också
 *    Adobes egen lösning på exakt denna kravbild i RAC:s `Button`
 *    `isPending`-läge: `aria-disabled="true"` plus bortkopplade handlers,
 *    aldrig native `disabled`.
 *
 * **Priset betalas, det avfärdas inte.** En fokuserbar kontroll är INTE
 * undantagen WCAG:s kontrastkrav så som en inaktiv är (1.4.3 § Incidental).
 * React Spectrums egen maintainer namnger det som den svåra biten: *"It can
 * be hard to design a control that both looks disabled and meets contrast
 * requirements"* (`adobe/react-spectrum#3662`). Det är hela skälet till att
 * nedtoningen nedan använder en TEXTROLL och inte `opacity` — se nästa
 * avsnitt. Kontrasten är mätt, inte antagen.
 *
 * Spärren mot handling ligger därför i `onClick` (tidig retur), inte i ett
 * attribut. Tangentbordet behöver ingen egen spärr: Enter och blanksteg på en
 * `<button>` går genom samma `click`-event.
 *
 * ═══ NEDTONINGEN ÄR EN TEXTROLL PLUS ETT SLÄCKT CHIP — ALDRIG `opacity` ═══
 *
 * Bärande kanal är FÄRGEN, ur den befintliga semantiska rollen
 * `--mm-text-muted` (`text-text-muted`) — ingen ny token, ingen hårdkodad
 * färg. Rollvalet är dessutom bundet underifrån: nästa steg ljusare i
 * paletten (`--p-neutral-400`, #898989) ger 3,50:1 mot vit och underskrider
 * AA-golvet på 4,5:1, vilket en FOKUSERBAR kontroll inte får göra. Det finns
 * alltså exakt en semantisk textroll som både är dämpad och tillåten här.
 *
 * Stödjande kanal: chipet släcks (`bg-transparent` mot den aktivas
 * `bg-bg-muted`). Det är MÄTT en svag skillnad — chipet är 1,09:1 mot den
 * vita sidbakgrunden, alltså en mycket ljus platta, inte en tydlig ram — så
 * den bär inte nedtoningen ensam och påstås inte göra det. Den finns för att
 * skillnaden ska ha mer än en form: färgsteget mellan de två textrollerna är
 * 1,48:1, och tillsammans med den försvunna plattan läser raden som "de här
 * går att trycka på, de här gör det inte".
 *
 * Husets ANDRA dämpnings-idiom, `data-[disabled]:opacity-50` (`Button.tsx`,
 * `RadioGroup.tsx`, `ToggleButtonGroup.tsx`), är medvetet INTE använt här:
 * en opacitets-slöja sänker kontrasten på allt den täcker och kan inte tas
 * tillbaka under `prefers-contrast: more` utan att nedtoningen samtidigt
 * släcks. En textroll kan bytas mot en starkare roll och behålla båda
 * egenskaperna — vilket är exakt vad `contrast-more:text-text-secondary`
 * gör.
 *
 * `forced-colors:text-[GrayText]` är samma systemfärgs-idiom som det tryckta
 * lägets `Highlight`/`HighlightText` på raden ovan: under Windows
 * högkontrastläge kastas författarens färger, och `GrayText` är den
 * kanoniska vägen att uttrycka "otillgänglig" där.
 *
 * ═══ `prefers-contrast: more` LYFTER BÅDA SIDOR, INTE BARA DEN ENA ═══
 *
 * Första försöket lyfte bara den nedtonade texten till `text-text-secondary`
 * — och kollapsade den därmed in i den AKTIVA knappens färg. Kontrastkravet
 * blev uppfyllt samtidigt som nedtoningen slutade finnas: exakt den sortens
 * "fix" som ser rätt ut i en kontrastmätning och är fel i ögat. Fångat av en
 * MÄTNING, inte av läsning (båda blev `rgb(82, 81, 81)`).
 *
 * Därför lyfts BÅDA rollerna ett steg, så avståndet består:
 *
 *   läge                    nedtonad          aktiv (ovald)
 *   normalt                 text-muted        text-secondary
 *   prefers-contrast: more  text-secondary    text
 *
 * Att den aktiva knappen får `contrast-more:text-text` är alltså inte en
 * fristående putsning utan det som gör nedtoningen möjlig i det läget. Båda
 * kvoterna mäts i renderad yta av
 * `tests/acceptance/persons-list.acceptance.test.ts`, som också asserterar
 * att de två färgerna aldrig blir samma.
 */
function BokstavsKnapp({
  value,
  etikett,
  vald,
  nedtonad,
  onValj,
  children,
}: {
  value: string;
  etikett: string;
  vald: boolean;
  nedtonad: boolean;
  onValj: (hink: string | null) => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={etikett}
      aria-pressed={vald}
      // Skrivs ut även som "false": attributet finns då på alla 30 knapparna,
      // så en regression kan fällas på VÄRDET i stället för på närvaron.
      aria-disabled={nedtonad}
      // Andra trycket släpper filtret (AC #2) — samma knapp, inget extra mål.
      // Spärren ligger HÄR, inte i ett `disabled`-attribut: se docblocken.
      onClick={() => {
        if (nedtonad) return;
        onValj(vald ? null : value);
      }}
      className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded border px-1.5 font-medium text-small motion-safe:transition-colors ${
        vald
          ? 'border-primary bg-primary-tint text-text forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]'
          : nedtonad
            ? 'cursor-not-allowed border-transparent bg-transparent text-text-muted contrast-more:text-text-secondary forced-colors:text-[GrayText]'
            : 'border-transparent bg-bg-muted text-text-secondary hover:bg-bg-emphasized contrast-more:border-border-strong contrast-more:text-text'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Tomlägets förklaring när ett bokstavsfilter är valt. Läses in i en mening
 * ("Ingen person PÅ K matchar…", "Ingen person UTAN NAMN matchar…") i stället
 * för att skriva ut hinkens tekniska värde.
 */
function hinkFras(hink: string): string {
  return hink === HINK_UTAN_NAMN ? 'utan namn' : `på ${hink}`;
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

  // [TASK-283.2] BOKSTAVSVALET LEVER I URL:EN (AC #5), precis som söktermen —
  // så tillbaka-knappen efter en persondetalj landar i samma filtrerade lista.
  //
  // INGEN debounce här, till skillnad från `q`: söktermen skrivs tecken för
  // tecken och skulle annars fylla historiken, medan ett bokstavsval ÄR en
  // diskret handling. Att skriva det direkt är dessutom vad som gör
  // tillbaka-knappen meningsfull.
  //
  // `arGiltigHink` normaliserar ett skräpvärde (`?bokstav=xyz` ur ett gammalt
  // bokmärke) till "inget filter" i stället för till en tom lista — se
  // `person-sok.ts`. Det tas i LÄSNINGEN, inte i skrivningen, eftersom URL:en
  // kan bära vad som helst utan att någon i appen skrev den.
  const [bokstavParam, setBokstavParam] = useQueryState('bokstav', parseAsString);
  const bokstav = arGiltigHink(bokstavParam) ? bokstavParam : null;

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

  // [TASK-286.3, ADR-123 beslut 4] SVENSK SORTERING, en gång per hämtat
  // register. EF:en levererar Airtables `Namn`-asc, som lägger Å bland A —
  // fälla 51:s synliga inkonsekvens mot bokstavsindexets egna Å-hink.
  // `Intl.Collator('sv')` räknar om ordningen till A–Z, Å, Ä, Ö med
  // namnlös-sentinelen sist (`src/lib/person-sok.ts`).
  //
  // EGEN `useMemo`, inte hopslagen med filtreringen nedan: sorteringen beror
  // BARA på registret, filtreringen på registret OCH söktermen. Slogs de ihop
  // skulle hela registret sorteras om vid VARJE tecken Lotta skriver — och
  // filtreringen är avsiktligt odebouncad (beslut 5).
  const sorteratRegister = useMemo(() => sorteraPersonregister(register ?? []), [register]);

  // Sök i klienten — byte-för-byte paritet med EF:ens SEARCH()-formel
  // (`src/lib/person-sok.ts`, ADR-123 beslut 2). `Array.filter` bevarar
  // ordningen, så varje sökning ärver den svenska sorteringen gratis.
  // [TASK-283.2] TVÅ FASETTER, AND-ade (AC #4). Bokstavshinken först, sedan
  // fritexten — ordningen mellan dem är fri (utfallet är detsamma), men
  // hinkfiltret är billigast och skär mängden mest, så det får gå först.
  //
  // EGEN `useMemo`, av samma skäl som sorteringen ovan står för sig: bokstaven
  // ändras sällan, söktermen vid varje tecken. Slogs de ihop skulle hela
  // registret hinkfiltreras om vid varje tangenttryck.
  const bokstavsfiltrerat = useMemo(
    () => filtreraPaBokstavshink(sorteratRegister, bokstav),
    [sorteratRegister, bokstav],
  );

  const filteredPersons = useMemo(
    () => filtreraPersonregister(bokstavsfiltrerat, deferredSearchTerm),
    [bokstavsfiltrerat, deferredSearchTerm],
  );

  // [TASK-283.3] NEDTONINGENS MÄNGD — den enda beräkning i denna komponent som
  // medvetet läser `register` och inte någon av de filtrerade arrayerna.
  //
  // DET ÄR KORTETS ICKE FÖRHANDLINGSBARA REGEL (AC #2): nedtoningen binds till
  // HELA registret, aldrig till aktuell sökterm. Läste den `filteredPersons`
  // hade nästan varenda knapp slocknat medan Lotta skriver "ann", och raden
  // hade flimrat vid varje tangenttryck. Beroendelistan är därför `[register]`
  // ensamt — söktermen kan strukturellt inte påverka utfallet, eftersom den
  // aldrig läses här.
  //
  // `undefined` (laddar / fel) ger `null`, INTE en tom mängd: okänt är inte
  // tomt. Se `Bokstavsrad` § `arNedtonad` för varför den skillnaden bär.
  const hinkarMedPersoner = useMemo(
    () => (register ? bokstavshinkarMedPersoner(register) : null),
    [register],
  );

  // Renderas i ALLA tre grenarna (laddläge / fel / lista). Raden har samma
  // GEOMETRI i alla tre — nedtoningen byter färg, aldrig antal knappar — så
  // att hålla den utanför laddläget hade fått listan att hoppa nedåt när
  // registret landar, vilket är exakt vad `ADR-078`:s layouthopp-förbud
  // förbjuder.
  const bokstavsrad = (
    <Bokstavsrad hinkarMedPersoner={hinkarMedPersoner} onValj={setBokstavParam} vald={bokstav} />
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
  //
  // [TASK-283.2] TRIGGERN ÄR HELA FILTERTILLSTÅNDET, inte bara söktermen: ett
  // nytt bokstavsval måste återställa fönstret av exakt samma skäl som en ny
  // sökterm gör det. Fogtecknet behöver bara vara omöjligt i FÖRSTA ledet för
  // att nyckeln ska vara entydig, och en hink (29 versaler eller `utan-namn`)
  // kan aldrig innehålla ett mellanslag. Söktermen får därför göra det.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filterNyckel = `${bokstav ?? ''} ${deferredSearchTerm}`;
  const [foregaendeFilter, setForegaendeFilter] = useState(filterNyckel);
  if (filterNyckel !== foregaendeFilter) {
    setForegaendeFilter(filterNyckel);
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
        {bokstavsrad}
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
        {bokstavsrad}
        <MessageBox intent="error" title="Kunde inte hämta personer">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </div>
    );
  }

  const loadedCount = persons.length;
  // [FÖRENKLAT, TASK-286.2 · WALKEN RIVEN, TASK-286.3] Var en skew-säker
  // fallback mot en EF-levererad totalsiffra (TASK-277 AC #1). Fallbacken föll
  // med 286.2 och full-walken den skyddade mot är RIVEN med 286.3 — båda talen
  // räknas nu ur arrayen: `loadedCount` är render-fönstret, `totalCount` hela
  // den filtrerade mängden i minnet. Vid tom sökterm ÄR `totalCount` därmed
  // registrets längd; vid en sökning är det träffantalet, vilket är exakt vad
  // TASK-277 AC #2:s låsta ordalydelse ("Visar N av TOTAL personer") betyder
  // på en yta som filtrerar. Ingen serversiffra att synka mot, inget
  // skew-fönster, ingen andra hämtning.
  const totalCount = filteredPersons.length;

  return (
    <div className="flex flex-col gap-4" data-testid="personer-yta">
      {searchField}
      {bokstavsrad}

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
          {/* [TASK-283.2] TOMLÄGET LÄSER BÅDA FASETTERNA (AC #4). Ett valt
              bokstavsfilter utan träffar är ett TOMLÄGE, inte ett tomt
              register — den gamla grenen läste bara söktermen och hade
              annars svarat "Personer dyker upp här när någon anmäler sig",
              vilket är osant om Lotta just tryckt på Ö.

              Rena sökfallets ordalydelse är ORÖRD (`Ingen person matchar
              "X".`) — den är låst av `tests/acceptance/persons-list.
              acceptance.test.ts` och av TASK-277:s copy-beslut. */}
          <p className="font-medium text-body">
            {deferredSearchTerm || bokstav ? 'Inga träffar' : 'Inga personer ännu'}
          </p>
          <p className="text-small text-text-muted">
            {bokstav && deferredSearchTerm
              ? `Ingen person ${hinkFras(bokstav)} matchar "${deferredSearchTerm}".`
              : bokstav
                ? bokstav === HINK_UTAN_NAMN
                  ? 'Ingen person saknar namn.'
                  : `Ingen person börjar på ${bokstav}.`
                : deferredSearchTerm
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
              exakta räkningen ur arrayen (se ovan), inte `hasNextPage`.
              [TASK-286.3] Ordalydelsen är ORÖRD; det som bytte är varifrån
              talet kommer: EF:ens full-walk är riven och båda talen räknas
              lokalt. */}
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
              const namn = personVisningsnamn(person);
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
