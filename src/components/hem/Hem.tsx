import { type CSSProperties, useMemo, useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { Modal } from '@/components/primitives';
import { SvepOverlay } from '@/components/svep/SvepOverlay';
import { bekraftelsesvepUrval } from '@/components/svep/svep-urval';
import { Bevakningsrad } from './Bevakningsrad';
import { ForfallnaBetalningar } from './ForfallnaBetalningar';
import { Genvagar } from './Genvagar';
import {
  bevakningar,
  dagsStart,
  eventsById,
  forfallnaBetalningar,
  fornamn,
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
  const bevakningRader = useMemo(
    () => bevakningar(eventsQuery.data, registrationsQuery.data, idagStart),
    [eventsQuery.data, registrationsQuery.data, idagStart],
  );

  /* [TASK-241.2] Bekräftelsesvepets sändyta — Hem PEKAR, svepet SKICKAR
     (ADR-114 beslut 1). `svepOppen` styr overlayen; urvalet är SAMMA
     urvalskälla som räknaren ovan (`anmalningar`/`obekraftadeAnmalningar`),
     bara omgrupperat per event (`bekraftelsesvepUrval`, AC #2). */
  const [svepOppen, setSvepOppen] = useState(false);
  const bekraftelseGrupper = useMemo(
    () => bekraftelsesvepUrval(registrationsQuery.data, evMap),
    [registrationsQuery.data, evMap],
  );

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
            (Marcus-låst blockordning); helt osynlig vid noll träffar. */}
        <Bevakningsrad rader={bevakningRader} />

        {/* 3. NYA ANMÄLNINGAR */}
        <NyaAnmalningar
          anmalDataPending={anmalDataPending}
          regsError={regsError}
          registrationsQuery={registrationsQuery}
          anmalningar={anmalningar}
          nuMs={nuMs}
          onBekraftaAlla={() => setSvepOppen(true)}
        />

        {/* 4. FÖRFALLNA BETALNINGAR */}
        <ForfallnaBetalningar
          anmalDataPending={anmalDataPending}
          regsError={regsError}
          registrationsQuery={registrationsQuery}
          forfallna={forfallna}
          nuMs={nuMs}
        />

        {/* 5. GENVÄGAR */}
        <Genvagar />

        {/* 6. SENASTE AKTIVITET — kompakt, alla bredder. */}
        <SenasteAktivitetKompakt />
      </section>

      {/* SÄNDYTAN — se `SvepOverlay.tsx`s docblock för varför Modal-ansvaret
          bor här och inte i komponenten. `svepOppen && <SvepOverlay/>` (INTE
          en `isOpen`-prop på SvepOverlay självt) speglar prototypens
          `{svepTyp && <SvepOverlay/>}`: overlayen UNMOUNTAS helt vid stängning,
          så `armerad`/testmail-state aldrig läcker in i nästa öppning. */}
      <Modal
        isOpen={svepOppen}
        isDismissable
        style={SVEP_SCRIM}
        // Scrollen bor på Dialogens body (se `SvepOverlay`s docblock), så
        // `Modal` självt får inte scrolla.
        className="w-[min(94vw,40rem)] overflow-hidden duration-300 data-[entering]:scale-[0.98] data-[exiting]:scale-[0.98]"
        onOpenChange={(open) => {
          if (!open) setSvepOppen(false);
        }}
      >
        {svepOppen && (
          <SvepOverlay
            svepTyp="bekraftelse"
            eventGrupper={bekraftelseGrupper}
            onClose={() => setSvepOppen(false)}
          />
        )}
      </Modal>
    </>
  );
}

function kapitalisera(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
