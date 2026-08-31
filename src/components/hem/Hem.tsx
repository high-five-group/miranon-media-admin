import { type CSSProperties, useMemo, useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { Modal } from '@/components/primitives';
import { displayName } from '@/components/registrations/registration-display';
import { SvepOverlay } from '@/components/svep/SvepOverlay';
import {
  bekraftelsesvepUrval,
  eventinfoSvepUrval,
  paminnelseAvgiftstyperByRegId,
  paminnelseRader,
  paminnelsesvepUrval,
} from '@/components/svep/svep-urval';
import type { SvepTyp } from '@/components/svep/types';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { fornamn } from '@/lib/fornamn';
import { betalningarPa } from '@/lib/funktionsflaggor';
import { BetalningarKort } from './BetalningarKort';
import { Bevakningsrad } from './Bevakningsrad';
import { ForfallnaBetalningar } from './ForfallnaBetalningar';
import { Genvagar } from './Genvagar';
import {
  atgardskoRad,
  type BevakningRad,
  bevakningar,
  dagsStart,
  eventIdentitet,
  eventsById,
  type ForfallenRad,
  forfallnaBetalningar,
  obekraftadeAnmalningar,
  velNastaEvent,
} from './hem-derivations';
import { NastaEvent } from './NastaEvent';
import { NyaAnmalningar } from './NyaAnmalningar';
import { SenasteAktivitetKompakt } from './SenasteAktivitetKompakt';
import { useDashboardEvents, useDashboardRegistrations } from './useDashboardData';

/**
 * [TASK-241.2] Sändytans Modal-inramning — SAMMA scrim/bredd/övergångs-
 * klasser prototypens dev-route (`dev/svep-prototyp.tsx`) bar, flyttade hit
 * eftersom `Hem` (inte en dev-route) nu är den yta som öppnar sändytan
 * (ADR-114 Del 10 beslut 1: "handlingar påbörjas OCH slutförs utan att
 * Lotta lämnar Hem"). Se `SvepOverlay.tsx`s docblock för hela
 * ansvarsfördelningen mellan denna fil och den.
 *
 * SCRIMMEN: husets delade scrim (`color-mix(in srgb, var(--mm-text) 50%,
 * transparent)`, ingen blur) är avvägd för husets små formulärdialoger —
 * under en yta som täcker halva skärmen blir den en tung gråmassa. Lokal
 * override via `style` (går genom `Modal`s `...props` till `ModalOverlay`,
 * exakt elementet som konsumerar variabeln) — samma formel, lägre täckning,
 * plus lätt blur. Husets globala token är ORÖRD; ändring där hade träffat
 * varenda dialog i appen, utanför denna skivas scope.
 *
 * [TASK-241.5] WOW-ÖVERGÅNGEN — prototypens 300ms/scale-98 (konvergensvarv 2,
 * `svep-prototyp.tsx`s docblock § ÖVERGÅNGEN) är GOLV, förstärkt här utan att
 * lämna husets CSS-transition-mekanik (React Aria `data-entering`/
 * `data-exiting` + Tailwind, `Modal.tsx`s egen teknik — inget nytt bibliotek):
 *
 *   • `origin-top` — skalningen ankrar mot toppen i stället för centrum, så
 *     ytan känns som att den veckar ut sig NEDÅT från knappen som öppnade
 *     den (båda triggerknapparna — "Bekräfta alla"/"Skicka påminnelse till
 *     alla" — sitter i hemmets ÖVRE hälft) i stället för att bara krympa mot
 *     mitten. ÖVERVÄGT OCH AVFÄRDAT: exakt per-klick `transform-origin`
 *     (knappens verkliga `getBoundingClientRect()`) — kräver antingen en
 *     ref genom `Modal`-primitiven (den exponerar ingen idag; att lägga till
 *     en påverkar VARENDA dialog i huset, utanför denna skivas scope, samma
 *     motiv som SCRIMMEN ovan) eller en fast gissning av dialogens egen
 *     höjd (okänd före montering — `max-h-[85vh] w-fit`, innehållsdriven).
 *     `origin-top` ger samma RIKTNINGSKÄNSLA utan någotdera.
 *   • Asymmetrisk duration — 300ms in, 200ms ut. Material Motion-golvet:
 *     "elements permanently leaving the screen use the acceleration curve to
 *     speed off-screen over a slightly shorter duration, as they will not be
 *     returning and require less user focus" (m1.material.io/motion/
 *     duration-easing.html, "Choreography"). En snabbare bekräftad-stängning
 *     läses som "klart", inte som en trög retur.
 *   • React Aria `SharedElementTransition`/View Transitions API (finns i
 *     `react-aria-components`@1.20.0, `node_modules/react-aria-components/
 *     SharedElementTransition/`) ÖVERVÄGD OCH AVFÄRDAD — den vore husets
 *     FÖRSTA konsument (grep: noll träffar i `src/` för `view-transition`/
 *     `SharedElementTransition`; DESIGN-SYSTEM-SPEC.md §9 "View Transitions"
 *     är märkt `[GA]`, ett odokumenterat gap-analys-tillägg, aldrig byggt —
 *     `base.css` saknar `@view-transition`-blocket specen beskriver). Att
 *     introducera mönstret här, som sidoeffekt av EN övergångs-skiva, hade
 *     varit ett nytt husmönster utan egen designrond eller
 *     webbläsarstöds-avvägning — precis den arkitektur-utvidgning
 *     uppdraget bad att STOPPA och rapportera i stället för att tyst införa.
 *     Rapporterat i kortets notes/slutrapport, inte tyst uteslutet.
 *
 * Stagern på triadens sektioner (Mottagare → Utskicket) och `--mm-avsloj`-
 * användningen bor i `SvepOverlay.tsx`s docblock. `prefers-reduced-motion`
 * neutraliserar ALLT ovan via `base.css`s globala blanket-regel (samma
 * dubbelbälte som `--animate-mm-avsloj`) — inget av det ovan är villkorat
 * på egen hand, base.css klampar `transition-duration`/`animation-duration`
 * till 0,01 ms oavsett vilken data-variant som är aktiv.
 */
const SVEP_SCRIM: CSSProperties = {
  '--mm-dialog-overlay-bg': 'color-mix(in srgb, var(--mm-text) 32%, transparent)',
  backdropFilter: 'blur(3px)',
} as CSSProperties;

/**
 * Hem — Morgonkollen, V1 "Lugna morgonen" (TASK-243.1, promoverad ur
 * `dev/hem-prototyp/VariantRo.tsx` till skarp yta med VERKLIG data via
 * husets hooks/adapter — ADR-102/103). Formen är promoverad EXAKT ur facitet
 * `tasks/sessions/bilagor/s102-hem-konvergens/facit.json` (ytan "hem-vyn V1
 * 'Lugna morgonen'"): denna komponent designar ingenting nytt, den bär
 * facit-formen till den skarpa routen.
 *
 * Blockordningen (Marcus-låst, S102 Del 8 + Del 10, AC #2): fri hälsning utan
 * platta → Nästa event (fullbredd, primär-tint) → Bevakningsrad (osynlig vid
 * noll träffar) → Nya anmälningar (räknar-rubrik + bekräftelsesvep) →
 * Förfallna betalningar (tre tillståndsgrupper) → Genvägar → Senaste
 * aktivitet (kompakt, alla bredder).
 *
 * Härledningslogiken (förfallen-definitionen, tillståndsgrupperna,
 * bevakningsradens trigger) bor i det SKARPA datalagret
 * (`hem-derivations.ts`, AC #3) — aldrig inline här.
 *
 * EN läskolumn, oförändrad mobil→desktop — ingen bredare grid tar över när
 * skärmen växer (facitets "ro"-identitet).
 *
 * AVVIKELSE mot den retirerade K10-formens `Hem.tsx`, ÖPPET bokförd: den
 * gamla versionsraden ("Miranon Media Admin v…", nere till vänster på
 * desktop) fanns INTE i facit-prototypen och promoveras därför inte —
 * ADR-102 B1 ("prototypen ÄR facit … vid motsägelse mellan prototyp och
 * kravtext vinner prototypen") väger tyngre än att tyst återuppfinna en yta
 * facit inte visar. Ingen ersättare byggs; se slutrapporten för TASK-243.1.
 *
 * BREDD (TASK-247, fjärde S102-paus-fyndet) — INGEN EGEN `max-w`/`mx-auto`/
 * horisontell padding längre. Fram till denna rättning bar sektionen
 * `mx-auto max-w-2xl … p-6 … sm:p-8 …` — BYTE-IDENTISKT med prototypens
 * `dev/hem-prototyp/VariantRo.tsx` rad 154 (ADR-102 B2, promoverad EXAKT).
 * Skillnaden som gjorde skarpa `/hem` synligt smalare än varje annan sida:
 * prototypens dev-route (`src/routes/dev/hem-prototyp.tsx`) renderar
 * `VariantRo` HELT UTAN `AppShell` runt sig — `max-w-2xl` (672px) var där
 * den ENDA bredd-begränsningen. Skarpa `/hem` körs INUTI `AppShell`, vars
 * `<main>` redan sätter `max-w-[600px] px-4` (`AppShell.tsx` rad 38) — SAMMA
 * `px-4`/bredd-kontrakt VARJE annan skarp vy (t.ex.
 * `aktivitetshistorik/AktivitetsHistorik.tsx`, kommentar rad ~597: "Landmärket
 * är skalets `<main>` — ingen egen inre landmark") litar på ENSAMT, utan
 * egen wrapper. Hem hade docklurat på prototypens wrapper OVANPÅ AppShells
 * — dubbel horisontell padding, uppmätt (Playwright `boundingBox`, 1440px,
 * facit-formen): **504px** innehållsbredd (600 − 2×16 AppShell-`px-4` −
 * 2×32 Hem-`sm:p-8`), mot **568px** på varje annan sida (600 − 2×16, ingen
 * egen wrapper). Facit-bilderna (`facit-hem-v1-*.png`) visar INTE denna
 * 504px-form — de är tagna på den fristående dev-routen (ingen AppShell)
 * och mäter i stället ≈608px (672 − 2×32) — en tredje, egen siffra som
 * aldrig existerat i produktion. Ingen av facitets tre siffror matchade
 * alltså varandra; klassat som AVVIKELSE (ej en medveten facit-amendering,
 * jfr Bevakningsrad.tsx TASK-247 fynd c) eftersom facit inte visar/avser
 * den smala 504px-formen — se TASK-247 slutrapport för hela
 * klassnings-resonemanget. Fixen: dropp `mx-auto`/`max-w-2xl`, `p-6`/
 * `sm:p-8` blir vertikalt-bara `py-6`/`sm:py-8` (den vertikala rytmen —
 * `pt-10`/`pb-24`/`lg:pt-16`/`gap-12` — är ORÖRD, bara den horisontella
 * dubbleringen bort). Innehållsbredden blir därmed EXAKT 568px, identisk
 * med varje annan sida — mätt efter fix i samma viewport.
 *
 * TOMT LÄGE (TASK-243.2, AC #1/#2) — facit-granskning utförd LIVE mot
 * `/hem`, egen dev-server (port 5190, ej 5173 — Marcus, se
 * `docs/reference/prototyp-verifiering-runbook.md`), `get-registrations`
 * intercepterad till `registrations: []` (samma tomtLage-princip som
 * prototypens `TOM_LISTA`, VariantRo.tsx), `get-events` orörd (Nästa
 * event-blocket är eventsdrivet, inte registrerings-drivet — matchar
 * facitets `facit-hem-v1-tom-*.png`, som fortsatt visar ett riktigt
 * kommande event). Jämfört desktop (1440×) och mobil (375×) mot
 * `facit-hem-v1-tom-desktop.png`/`-mobil.png`: blockordningen, den fria
 * hälsningen, Nästa event-kortet, de två gröna-bock-kvittona ("läget är
 * under kontroll" / "Inga förfallna betalningar.") och Bevakningsradens
 * fullständiga frånvaro (`Bevakningsrad({ rader: [] })` → `null`, AC #2)
 * matchar facit exakt. Enda avvikelsen mot facit-bilderna är AppShells
 * egen chrome (TabBar, avatar) — facit-prototypen renderas UTAN AppShell
 * (samma redan bokförda distinktion som BREDD-avsnittet ovan), inte en
 * Hem-formsavvikelse. `verktyget task243_2-tomt-lage-verify.mjs` var ett
 * `[DEBUG-task243.2]`-engångsskript, städat efter passet
 * (Städkontraktet, prototyp-verifiering-runbook.md).
 */
export function Hem() {
  const { user } = useAuth();
  const namn = user?.displayName ? fornamn(user.displayName) : null;

  const eventsQuery = useDashboardEvents();
  const registrationsQuery = useDashboardRegistrations();

  // "Nu" läst EN gång per montering (inte per render) — samma referenspunkt
  // genom hela vyn, annars kunde "förfallen"/bevakningsraden flippa mellan
  // en switch och nästa utan att datat faktiskt ändrats.
  const [nuMs] = useState(() => Date.now());

  const idagStart = useMemo(() => dagsStart(nuMs), [nuMs]);
  const evMap = useMemo(() => eventsById(eventsQuery.data), [eventsQuery.data]);
  const nasta = useMemo(
    () => velNastaEvent(eventsQuery.data, idagStart),
    [eventsQuery.data, idagStart],
  );

  const anmalDataPending = registrationsQuery.isPending || eventsQuery.isPending;
  const regsError = registrationsQuery.isError;

  const anmalningar = useMemo(
    () => obekraftadeAnmalningar(registrationsQuery.data, evMap),
    [registrationsQuery.data, evMap],
  );
  const forfallna = useMemo(
    () => forfallnaBetalningar(registrationsQuery.data, evMap, nuMs),
    [registrationsQuery.data, evMap, nuMs],
  );
  /* [TASK-241.8 AC #4] `nyligenEventinfoSkickade` — server-BEKRÄFTADE
     registrerings-ID:n (ur `onSkickat`s `lyckade`) som eventinfo-svepet
     just stämplat, applicerade LOKALT ovanpå `registrationsQuery.data`
     INNAN `bevakningar()` körs. Motivet är INTE kosmetiskt (till skillnad
     från `nyligenSkickade`/`nyligenPaminda` nedan, vars enda syfte är ett
     kvitto Lotta annars aldrig skulle se): `bevakningar()` läser
     `registrationsQuery.data` direkt, och `useSendSvep`s
     cache-invalidering (`svepSend.ts` § `onSettled`) triggar en ASYNK
     refetch — utan detta lokala overlay vore AC #4 ("raden försvinner …
     annars kvarstår … med korrekt kvarvarande antal") en KAPPLÖPNING mot
     nätverket i stället för deterministisk vid stängning av dialogen.
     `bevakningRegs` är en RENDRINGS-lokal overlay, aldrig skriven tillbaka
     till `registrationsQuery.data` — nästa refetch tar över och detta
     minne blir en no-op (samma `Set`-medlemmar matchar redan riktiga
     stämplar då). */
  const [nyligenEventinfoSkickade, setNyligenEventinfoSkickade] = useState<Set<string>>(
    () => new Set(),
  );
  const bevakningRegs = useMemo(() => {
    if (nyligenEventinfoSkickade.size === 0) return registrationsQuery.data;
    return registrationsQuery.data?.map((r) =>
      r.deltagarinfoSkickad == null && nyligenEventinfoSkickade.has(r.id)
        ? { ...r, deltagarinfoSkickad: new Date(nuMs).toISOString() }
        : r,
    );
  }, [registrationsQuery.data, nyligenEventinfoSkickade, nuMs]);
  /* [TASK-284.4 AC #3] Åtgärdskö-raden — räknad ur `registrationsQuery.data`
     DIREKT (rå EF-data, `Anmälningar.Eventmatchning`), aldrig ur
     `bevakningRegs`s eventinfo-overlay ovan: de två är obesläktade fält
     (`deltagarinfoSkickad` kontra `eventmatchning`), och att låta
     åtgärdskön läsa overlayen hade knutit ihop två oberoende
     bevakningskällor utan skäl. */
  const atgardsko = useMemo(() => atgardskoRad(registrationsQuery.data), [registrationsQuery.data]);
  /* Åtgärdskö-raden FÖRST när den finns (se `Bevakningsrad.tsx`s docblock
     § TVÅ RADTYPER för ordnings-motiveringen), eventinfo-raderna därefter i
     sin egen närmast-start-sortering (ORÖRD). */
  const bevakningRader = useMemo<BevakningRad[]>(() => {
    const eventinfoRader = bevakningar(eventsQuery.data, bevakningRegs, idagStart);
    return atgardsko ? [atgardsko, ...eventinfoRader] : eventinfoRader;
  }, [eventsQuery.data, bevakningRegs, idagStart, atgardsko]);

  /* [TASK-241.2/241.4/241.8] Svepens sändyta — Hem PEKAR, svepet SKICKAR
     (ADR-114 beslut 1). EN union-state (`aktivtSvep: SvepTyp | null`) i
     stället för separata booleaner: alla TRE svepen är INSTANSER AV SAMMA
     FORM (ADR-114 beslut 4, utökad PRD task-241 § Amendering 2026-08-18),
     aldrig öppna samtidigt, så ETT `<Modal>`/`<SvepOverlay>`-par nedan
     väljer innehåll efter vilken typ som är aktiv i stället för att
     duplicera hela overlay-blocket.
     Urvalen är SAMMA urvalskällor som räknarna ovan — `anmalningar`/
     `obekraftadeAnmalningar` för bekräftelse (`bekraftelsesvepUrval`,
     TASK-241.2 AC #2), `forfallna`/`forfallnaBetalningar`+`forfallenGrupp`
     för påminnelse (`paminnelseRader`/`paminnelsesvepUrval`, TASK-241.4
     AC #1), `eventinfoEvent`/`bevakningar()` för eventinfo
     (`eventinfoSvepUrval`, TASK-241.8 AC #1) — bara omgrupperade per
     event. */
  const [aktivtSvep, setAktivtSvep] = useState<SvepTyp | null>(null);
  const bekraftelseGrupper = useMemo(
    () => bekraftelsesvepUrval(registrationsQuery.data, evMap),
    [registrationsQuery.data, evMap],
  );

  /* [TASK-241.8 AC #1] Eventinfo-svepets mål-event — SATT av
     `Bevakningsrad`s `onOppna` (den klickade radens FULLA `Event`), inte
     härlett ur `aktivtSvep` ensamt (den bär bara TYPEN, inte VILKET
     event). Nollställs tillsammans med `aktivtSvep` vid stängning, se
     `<Modal onOpenChange>` nedan. */
  const [eventinfoEvent, setEventinfoEvent] = useState<Event | null>(null);
  const eventinfoGrupper = useMemo(
    () => (eventinfoEvent ? eventinfoSvepUrval(eventinfoEvent, registrationsQuery.data) : []),
    [eventinfoEvent, registrationsQuery.data],
  );

  /* [TASK-241.4 AC #1] Påminnelsesvepets urval — en-påminnelse-modellens
     LÄGE 1 "Att påminna" ENDAST (S102 Del 10 beslut 7), mekaniskt spamsäkert:
     `paminnelseRader` är den delade filtrerade radkällan som BÅDE
     `paminnelsesvepUrval` (sändytans event-grupper) OCH
     `paminnelseAvgiftstyperByRegId` (adresslistans avgiftstyp-suffix,
     AC #2) samt skickat-markörernas rekonstruktion (nedan) läser — EN källa,
     tre konsumenter, aldrig tre separata filtreringar som kan glida isär. */
  const paminnelseRaderList = useMemo(
    () => paminnelseRader(registrationsQuery.data, evMap, nuMs),
    [registrationsQuery.data, evMap, nuMs],
  );
  const paminnelseGrupper = useMemo(
    () => paminnelsesvepUrval(paminnelseRaderList, evMap),
    [paminnelseRaderList, evMap],
  );
  const paminnelseAvgiftstyper = useMemo(
    () => paminnelseAvgiftstyperByRegId(paminnelseRaderList),
    [paminnelseRaderList],
  );

  /* [TASK-241.3 AC #3 / TASK-241.4 AC #3] Skickat-markörerna — session-lokalt
     minne av VAD respektive svep FAKTISKT skickade, oberoende av
     query-cachens läge. NÖDVÄNDIGT eftersom en lyckad bekräftelse flippar
     `Registration.status` bort från `OBEKRAFTAD` server-side (samma
     fält-skrivning som `confirmRegistrations`, se `useSendActionEmail`s
     docblock) och en lyckad påminnelse stämplar `Påminnelse …skickad`
     (`send-action-email/index.ts` § `stampFieldsFor`) — i BÅDA fallen
     lämnar raden sitt filter vid nästa refetch, precis som den SKA. Utan
     ett eget minne skulle "skickat" aldrig synas: rader försvinner (eller,
     för påminnelse, hoppar tyst till "Väntar") i stället för att markeras
     FÖRST.
     `onSkickat` (`SvepOverlay.tsx`) levererar UNIONEN av samtliga gruppers
     `lyckade` (`Registration[]`) när svepet landar i resultatläget — för
     påminnelse rekonstrueras RADERNA (med avgiftstyp) genom att filtrera
     `paminnelseRaderList` (fånget vid öppningstillfället, se ovan) mot de
     lyckade registrerings-ID:na, samma granularitet som
     `ForfallnaBetalningar.tsx`s "Att påminna"-lista redan visar.

     BEGRÄNSNING, ÖPPET BOKFÖRD (ärvd ur TASK-241.3): minnet rensas ALDRIG
     automatiskt — det lever tills `Hem` unmountas. Ett svep körs typiskt en
     gång per morgon, så mängden är liten och avgränsad; en tidsstyrd
     urblekning hade varit spekulativ komplexitet utan en nedskriven regel
     att bygga mot. */
  const [nyligenSkickade, setNyligenSkickade] = useState<Registration[]>([]);
  const nyligenSkickadeRader = useMemo(
    () =>
      nyligenSkickade.map((reg) => ({
        reg,
        namn: displayName(reg),
        identitet: eventIdentitet(reg, reg.eventId ? evMap.get(reg.eventId) : undefined),
      })),
    [nyligenSkickade, evMap],
  );
  const [nyligenPaminda, setNyligenPaminda] = useState<ForfallenRad[]>([]);

  const idagLangt = useMemo(
    () =>
      kapitalisera(
        new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }).format(
          nuMs,
        ),
      ),
    [nuMs],
  );

  return (
    <>
      <section className="flex min-w-0 flex-col gap-12 py-6 pt-10 pb-24 sm:py-8 lg:pt-16">
        {/* 1. FRI HÄLSNING — ingen platta, stor redaktionell rubrik + en varm
            dagsrad. h1 = sidans rubrik (ingen separat "Hem"-rubrik). */}
        <div className="flex flex-col gap-2">
          <p className="text-body text-text-secondary">{idagLangt}</p>
          <h1 className="font-semibold text-4xl tracking-tight lg:text-5xl">
            {namn ? `Hej ${namn}` : 'Hej'}
          </h1>
        </div>

        {/* 2. NÄSTA EVENT — fullbredd, hero-ton. */}
        <NastaEvent eventsQuery={eventsQuery} nasta={nasta} idagStart={idagStart} />

        {/* BEVAKNINGSRAD — mellan "Nästa event" och "Nya anmälningar"
            (Marcus-låst blockordning); helt osynlig vid noll träffar.
            [TASK-284.4] Bär nu TVÅ radtyper (åtgärdskö + eventinfo, se
            `Bevakningsrad.tsx`s docblock) — komponenten väljer interaktion
            per rad själv; `onOppnaEventinfo` styr ENDAST eventinfo-svepet. */}
        <Bevakningsrad
          rader={bevakningRader}
          onOppnaEventinfo={(event) => {
            setEventinfoEvent(event);
            setAktivtSvep('eventinfo');
          }}
        />

        {/* 3. NYA ANMÄLNINGAR */}
        <NyaAnmalningar
          anmalDataPending={anmalDataPending}
          regsError={regsError}
          registrationsQuery={registrationsQuery}
          anmalningar={anmalningar}
          nuMs={nuMs}
          onBekraftaAlla={() => setAktivtSvep('bekraftelse')}
          nyligenSkickade={nyligenSkickadeRader}
        />

        {/* 4. BETALNINGAR — ERSÄTTER "Förfallna betalningar" när miljöflaggan
            är på (TASK-346.7 AC #1, PRD § Inkorgen och formuläret: "ersätter
            dagens kort … (inte ovanpå det)").

            VÄXELN ÄR ETT TERNÄRT VAL, INTE TVÅ VILLKORADE BLOCK. Skrivet som
            två `{flagga && …}`/`{!flagga && …}` hade de två korten kunnat
            renderas samtidigt om villkoren någon gång drev isär — och
            "inte ovanpå det" är hela poängen med raden i PRD:n.

            MED FLAGGAN AV ÄR PROD-BETEENDET EXAKT DAGENS: samma komponent,
            samma props, samma påminnelsesvep. Ingen av det gamla kortets
            props har ändrats. */}
        {betalningarPa() ? (
          <BetalningarKort
            onSkickaPaminnelseAlla={() => setAktivtSvep('paminnelse')}
            harPaminnelser={paminnelseRaderList.length > 0}
          />
        ) : (
          <ForfallnaBetalningar
            anmalDataPending={anmalDataPending}
            regsError={regsError}
            registrationsQuery={registrationsQuery}
            forfallna={forfallna}
            nuMs={nuMs}
            onSkickaPaminnelseAlla={() => setAktivtSvep('paminnelse')}
            nyligenPaminda={nyligenPaminda}
          />
        )}

        {/* 5. GENVÄGAR */}
        <Genvagar />

        {/* 6. SENASTE AKTIVITET — kompakt, alla bredder. */}
        <SenasteAktivitetKompakt />
      </section>

      {/* SÄNDYTAN — se `SvepOverlay.tsx`s docblock för varför Modal-ansvaret
          bor här och inte i komponenten. `aktivtSvep && <SvepOverlay/>` (INTE
          en `isOpen`-prop på SvepOverlay självt) speglar prototypens
          `{svepTyp && <SvepOverlay/>}`: overlayen UNMOUNTAS helt vid stängning,
          så `armerad`/testmail-state aldrig läcker in i nästa öppning — och
          aldrig mellan de två svep-TYPERNA heller, eftersom `aktivtSvep`
          bara kan vara EN av dem åt gången. */}
      <Modal
        isOpen={aktivtSvep != null}
        isDismissable
        style={SVEP_SCRIM}
        // Scrollen bor på Dialogens body (se `SvepOverlay`s docblock), så
        // `Modal` självt får inte scrolla. `origin-top` + asymmetrisk
        // duration + skalningen — se docblocket ovan (§ WOW-ÖVERGÅNGEN,
        // TASK-241.5) för varför och för de avfärdade alternativen.
        //
        // DURATIONEN SITTER PÅ VILOLÄGET (`duration-300`, INTE
        // `data-[entering]:duration-300`) — CSS-transitions specifikation:
        // vilken `transition-duration` som STYR en övergång är värdet i
        // MÅLSTILEN, inte startstilen. "Entering" är STARTSTILEN (elementet
        // monteras MED attributet satt, sedan tas det bort på nästa bildruta
        // för att TRIGGA övergången mot vilostilen) — målet för den
        // övergången är alltså vilostilen, så det är DÄR durationen måste
        // sitta. `data-[entering]:duration-300` såg rätt ut men var en
        // död kodrad: uppmätt med en rAF-sampler (chromium, 60 bildrutor)
        // visade `getComputedStyle(el).transitionDuration` konsekvent
        // `0.2s` (Modal.tsx:s egen bas) trots klassen, exakt det spec-
        // beteendet förutsäger. `data-[exiting]:duration-200` däremot är
        // KORREKT redan: vid stängning är vilostilen START och
        // exiting-stilen MÅL, så exiting-klassens duration är den som
        // gäller — 200ms, den snabbare urladdningen Material Motion-
        // golvet (docblocket ovan) beskriver.
        className="w-[min(94vw,40rem)] origin-top overflow-hidden duration-300 data-[entering]:scale-95 data-[exiting]:scale-95 data-[exiting]:duration-200"
        onOpenChange={(open) => {
          if (!open) {
            setAktivtSvep(null);
            // [TASK-241.8] Nollställs SAMTIDIGT med `aktivtSvep` — annars
            // pekar nästa eventinfo-öppning tillfälligt på FÖRRA eventet
            // under en bildruta innan `onOppna` hinner sätta det nya.
            setEventinfoEvent(null);
          }
        }}
      >
        {aktivtSvep === 'bekraftelse' && (
          <SvepOverlay
            svepTyp="bekraftelse"
            eventGrupper={bekraftelseGrupper}
            onClose={() => setAktivtSvep(null)}
            onSkickat={(lyckade) => setNyligenSkickade((nu) => [...lyckade, ...nu])}
          />
        )}
        {aktivtSvep === 'paminnelse' && (
          <SvepOverlay
            svepTyp="paminnelse"
            eventGrupper={paminnelseGrupper}
            avgiftstypByRegId={paminnelseAvgiftstyper}
            onClose={() => setAktivtSvep(null)}
            onSkickat={(lyckade) => {
              // [TASK-241.4 AC #3] Rekonstruera RADERNA (med avgiftstyp) ur
              // urvalet som gällde VID ÖPPNINGSTILLFÄLLET — `onSkickat` ger
              // bara `Registration[]` (sändningen är registrerings-granulär,
              // `svep-urval.ts`s dedup-motiv), inte vilken/vilka avgiftstyper
              // som ingick per mottagare.
              const lyckadeIds = new Set(lyckade.map((r) => r.id));
              const nyaRader = paminnelseRaderList.filter((rad) => lyckadeIds.has(rad.reg.id));
              setNyligenPaminda((nu) => [...nyaRader, ...nu]);
            }}
          />
        )}
        {aktivtSvep === 'eventinfo' && eventinfoEvent && (
          <SvepOverlay
            svepTyp="eventinfo"
            eventGrupper={eventinfoGrupper}
            onClose={() => {
              setAktivtSvep(null);
              setEventinfoEvent(null);
            }}
            // [TASK-241.8 AC #4] Se `nyligenEventinfoSkickade`s docblock
            // ovan — deterministisk radspegling vid stängning, ingen
            // väntan på refetch.
            onSkickat={(lyckade) =>
              setNyligenEventinfoSkickade((nu) => {
                const next = new Set(nu);
                for (const reg of lyckade) next.add(reg.id);
                return next;
              })
            }
          />
        )}
      </Modal>
    </>
  );
}

function kapitalisera(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
