import * as Sentry from '@sentry/react';
import { useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Validera env-variabler vid uppstart — kraschar direkt om något saknas.
import { env } from './env';

import './styles/base.css';
import './styles/tailwind.css';

import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import { FORBEREDELSESKARM_VANTAR, Forberedelseskarm } from './components/AppShell';
import { AppErrorBoundary } from './components/ErrorBoundary';
import { dataSource } from './data/dataSource';
import type { StartvarmningForlopp, StartvarmningHandle } from './data/warmup/startvarmningen';
import { arCacheVarm, lasVarmningTimeoutOverride, starta } from './data/warmup/startvarmningen';
import { registreraAppUppdatering } from './lib/app-uppdatering';
import { reportWebVitals } from './lib/report-web-vitals';
import { initSentry } from './observability/sentry';
import { persistOptions } from './queries/persist';
import { queryClient, router } from './router';

// M7: initiera Sentry FÖRE React mountas så att tidiga fel
// (env-validering, root-element-fel, ...) fångas. Skip i lokal dev.
initSentry();

/** Gate-fasen (TASK-218.3, ADR-112) InnerApp driver EFTER auth är löst. */
type GateFas =
  | { typ: 'vantar' }
  | { typ: 'varmar'; forlopp: StartvarmningForlopp }
  | { typ: 'redo' };

/**
 * TASK-236 varv 2 — warmup-gatens timeoutMs för DENNA sidladdning.
 *
 * ═══ VARFÖR VARV 2 BEHÖVDES ═══
 * Varv 1 (samma kort) satte en ENDA e2e-default (6000ms, ner från
 * produktionens 9000ms) via `env.VITE_E2E_WARMUP_TIMEOUT_MS`. Lokal
 * mätning visade stor förbättring (shell.staging.test.ts 8/8→1/8 röda),
 * men CI:s POST-MERGE-körning på den landade fixen (run 31943270329,
 * c3f2a288) sprängde ändå 12-min-taket: den nedladdade artefakten (möjlig
 * sedan task-237s failure()||cancelled()-fix) visade minst 11 nya, tidigare
 * ORÖRDA tester (event-bor-over.staging.test.ts, mer-index.staging.test.ts,
 * ytterligare skapa-event-tester) med EXAKT samma "Timeout: 5000ms —
 * element(s) not found"-signatur. Slutsats: ~200 testers kalla gate-väntan
 * (även nedkortad till 6s) summerar fortfarande för mycket — ETT globalt
 * tal löser inte det, oavsett värde, eftersom varje enskild kall
 * sidladdning fortfarande BETALAR något innan Hem/en authenticated-route
 * kan monteras.
 *
 * ═══ VARV 2:S LÖSNING — TVÅ NIVÅER ═══
 * E2E-DEFAULTEN (`VITE_E2E_WARMUP_TIMEOUT_MS`, satt av playwright.config.ts:s
 * e2e-webServer) sänks till NÄRA NOLL (se den filens kommentar) — gaten
 * släpper i praktiken OMEDELBART för de ~190 tester som inte bryr sig om
 * warmup-UI:t alls. De FÅ tester som EXPLICIT testar startvärmningens
 * PROGRESSION (persist-cache.staging.test.ts:s Kallstart/TASK-227-block)
 * opterar i stället in i produktionens RIKTIGA timeout via
 * `lasVarmningTimeoutOverride()` (startvarmningen.ts, sessionStorage-baserad
 * — DELAT mellan denna gate OCH `_authenticated.tsx`:s app-yta-gate, se den
 * funktionens docblock för varför sessionStorage vann över en URL-query-
 * param). Overriden går FÖRE env-defaulten.
 *
 * `korAlla()` (startvarmningen.ts) kör fortfarande de sju verkliga
 * datahämtningarna i bakgrunden OAVSETT timeoutMs — bara GATENS EGEN VÄNTAN
 * kortas. Detta ändrar INGEN produktionssemantik: build:staging/
 * build:production sätter varken env-defaulten eller sessionStorage-nyckeln,
 * så DEFAULT_TIMEOUT_MS (9000ms, ADR-112 beslut 3) är opåverkad där.
 */
function beraknaVarmningTimeoutMs(): number | undefined {
  return lasVarmningTimeoutOverride() ?? env.VITE_E2E_WARMUP_TIMEOUT_MS;
}

/**
 * InnerApp-pattern (officiell TanStack-rekommendation):
 * useAuth() kan bara anropas i React-komponent, inte i modul-scope. InnerApp wrappar
 * RouterProvider och passar auth-context dynamiskt. Vid auth-state-byte triggas
 * router.invalidate() så beforeLoad-guarder re-evalueras.
 *
 * Utan router.invalidate() kan _authenticated-routes fortsätta tänka att user är obehörig
 * efter login, eller vice versa efter logout.
 *
 * ═══ ADR-112/TASK-218.3 — WARMUP-GATEN ═══
 *
 * Utökar ADR-037s render-gate (nedan) med en andra fas EFTER auth är löst:
 * innan `<RouterProvider>` monteras väntas ÄVEN `useIsRestoring()` ut
 * (`PersistQueryClientProvider`s restore-försök, startvarmningen.ts:s
 * filhuvud § "triggad av InnerApp EFTER både auth.isLoading === false och
 * PersistQueryClientProviderns onSuccess" — `useIsRestoring()` flippar false
 * EFTER `onSuccess`/`onError`, se biblioteks-källan, `finally(() =>
 * setIsRestoring(false))`, så den bär samma "restore-försöket är avgjort"-
 * signal utan en separat callback-prop).
 *
 * När BÅDA är klara avgörs varm/kall EXAKT en gång (`varmningHandle`-reffen,
 * StrictMode-säker — se kommentaren i effekten):
 * - VARM (`queryClient.getQueryCache().getAll().length > 0`, dvs. restore
 *   ÅTERSTÄLLDE faktisk data) ⇒ HELT TYST, `starta()` anropas ALDRIG — noll
 *   extra hämtningar utöver vad appen ändå gör. Detta är regressionsgolvet:
 *   `tests/e2e/persist-cache.staging.test.ts` AC 1 (varm start) och AC 4
 *   (offline-öppning, som också landar här eftersom offline-öppning ÄR en
 *   varm-cache-öppning ur denna gates perspektiv — persist-lagret fungerar
 *   identiskt offline/online) förlitar sig på att INGET laddläge syns när
 *   cachen redan bär data.
 * - KALL/STALE (tomt cache — äkta första besök, ELLER restore kastade pga
 *   buster-/maxAge-mismatch, ADR-072 skyddsräcke 3/2 — båda ger samma tomma
 *   cache och behandlas identiskt, ADR-112 grupperar dem uttryckligen) ⇒
 *   `starta(queryClient, { dataSource })` anropas — Förberedelseskärmen visas
 *   och drivs av motorns `forloppsprenumeration` tills `slutlofte` avgör
 *   ('klar'/'timeout'/'offline' — samtliga tre hanteras IDENTISKT här: gaten
 *   bryr sig bara om ATT slutlöftet avgjort, inte VILKET utfall. 'offline'
 *   löser ut synkront i samma mikrotask-kedja (startvarmningen.ts:s filhuvud
 *   § "Online-gate FÖRE start") — Förberedelseskärmen hinner därför aldrig
 *   måla en synlig ram innan gaten redan växlat till 'redo', vilket ger
 *   "offline: ingen skärm, direkt in" utan att denna gate behöver duplicera
 *   motorns online-check).
 *
 * `dataSource` importeras STATISKT (samma singleton `router.ts` redan
 * injicerar i router-context) — DI-kontraktet `starta()` kräver bor HÄR,
 * hos anroparen, precis som startvarmningen.ts:s filhuvud föreskriver.
 */
function InnerApp() {
  const auth = useAuth();
  const isRestoring = useIsRestoring();
  const [gate, setGate] = useState<GateFas>({ typ: 'vantar' });
  // Persisterar handlen över Reacts StrictMode-dubbelkörning (dev): utan den
  // hade en andra effekt-invokering antingen anropat starta() igen (dubbel
  // startvärmning) eller lämnat förloppet oprenumererat (frusen 0-visning).
  const varmningHandle = useRef<StartvarmningHandle | null>(null);
  const varmtBeslutat = useRef(false);

  // ═══ ÖVERGÅNGEN SPLASH → APP (skärpningsvarv TASK-242, forberedelseskarm-
  // splash-branschmonster-2026-08-16.md § Rekommendation 4) ═══
  // Avgörs EN gång, lazy, vid InnerApps allra första rendering (samma
  // inline-mönster som `SlideToConfirm.tsx` — appen är rent CSR, ingen
  // SSR-guard behövs): tillåter `prefers-reduced-motion: reduce` INTE
  // rörelse ⇒ wrappern nedan appliceras ALDRIG någon animationsklass —
  // "direkt byte utan animation" (Marcus-kravet), inte bara en tyst/inert
  // klass som råkar inte matcha sitt media-villkor.
  const [visaEntreanimation] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  // Flippar EN gång när entré-animationen faktiskt spelat klart
  // (onAnimationEnd nedan) — under reduced motion körs ingen animation så
  // detta förblir false för hela sessionen, vilket är korrekt (se ovan).
  const [entreanimationKlar, setEntreanimationKlar] = useState(false);

  // **TRIGGER på BÅDA isAuthenticated OCH isLoading** för router.invalidate().
  // Race-condition utan isLoading-dep (upptäckt via K4.3 regression-test):
  //   1. Initial mount: AuthProvider state är { user: null, isLoading: true, isAuthenticated: false }
  //   2. _authenticated.tsx beforeLoad ser isLoading: true → return (vänta)
  //   3. getSession() settles: { user: null, isLoading: false, isAuthenticated: false }
  //   4. isAuthenticated förblev false (false → false) → useEffect TRIGGAR INTE → guard
  //      re-evalueras ALDRIG → utloggad användare ser /hem (skyddat innehåll, "Not Found"
  //      eller motsvarande beroende på route)
  // Med isLoading i deps: settle-event (true → false) triggar router.invalidate() →
  // guard re-evaluerar → redirect till /login om ej autentiserad.
  // K4.3 Test 4 + Test 6 fångar denna race empiriskt.
  // Effekten KÖR vid state-ändring — router är modul-singleton, refereras inte i body.
  // biome-ignore lint/correctness/useExhaustiveDependencies: medveten TRIGGER på auth-state-byte
  useEffect(() => {
    // Invalidate ENDAST när auth är löst OCH <RouterProvider> FAKTISKT är
    // monterad (`gate.typ === 'redo'`, se render-gaten nedan).
    //
    // VARV 4-FÅNGSTEN (#1343, CI-massakern): kommentaren nedan beskrev fram
    // till TASK-218.3 en sanning som blev falsk UTAN att raden uppdaterades.
    // Före denna skiva var render-gaten en ENKEL boolean (`auth.isLoading`)
    // och <RouterProvider> monterades i EXAKT samma render som `isLoading`
    // föll till false — då var "!auth.isLoading" och "routern är monterad"
    // samma villkor. TASK-218.3 lade en ANDRA, ASYNKRON gate-fas
    // (warmup-effekten nedan, `gate: 'vantar' → 'varmar'/'redo'` via
    // `setState`) MELLAN dem: på den FÖRSTA renderingen efter att auth löser
    // ut är `auth.isLoading` redan false, men `gate.typ` är fortfarande
    // 'vantar' (warmup-effektens `setGate` har inte hunnit köra än — den är
    // en SYSKON-effekt, inte en synkron del av samma render). Denna effekt
    // kördes då FÖRE routern någonsin monterats, `router.invalidate()`
    // körde `beforeLoad` mot routerns modul-default `context.auth ===
    // undefined` → `TypeError: Cannot read properties of undefined (reading
    // 'isAuthenticated')` i `_authenticated.tsx`. Fångad av `SectionError`
    // (routerns `defaultErrorComponent`) på VARJE autentiserad sidladdning i
    // den hermetiska fixturvärlden (som alltid startar kall — tom
    // localStorage per test, `hem-laddlage.acceptance.test.ts`s dokumenterade
    // invariant) — mätt lokalt: 30 av 36 tester i `hem.acceptance.test.ts`
    // föll på exakt detta EFTER att fixturvärldens EF-mock-lucka (samma
    // varv, `tests/support/fixturvarld/handlers.ts`) täppts till.
    //
    // `gate.typ === 'redo'` i villkoret ovan återställer invarianten
    // explicit i stället för att luta sig mot render-ordning: när gaten
    // släpper (warm ELLER kall) monteras <RouterProvider> i SAMMA render
    // som flippar `gate.typ`, och TanStack Routers egen mount-synk av
    // `context.auth` (barn-effekt) hinner köra FÖRE denna förälder-effekt
    // (React kör effekter barn-först inom samma commit) — invalidate() är
    // därför säker både vid det första släppet OCH vid EFTERFÖLJANDE
    // auth-byten (login/logout utan sidladdning), eftersom `gate.typ`
    // förblir 'redo' permanent efter första auth-resolutionen
    // (`varmtBeslutat`-reffen nedan, "en gång per auth-resolution").
    if (!auth.isLoading && gate.typ === 'redo') {
      router.invalidate();
    }
  }, [auth.isAuthenticated, auth.isLoading, gate.typ]);

  // Warmup-gaten (TASK-218.3, ADR-112 beslut 5) — se klassdoc-blocket ovan för
  // hela resonemanget. Körs EN gång per auth-resolution: `auth.isLoading` och
  // `isRestoring` kan strukturellt aldrig gå tillbaka till sant efter sitt
  // första lös (AuthProvider.tsx sätter `isLoading=false` i varje event,
  // ALDRIG true igen; PersistQueryClientProvider restaurerar en gång vid
  // mount) — reffarna ovan är därför ett StrictMode-skyddsräcke, inte den
  // mekanism som gör "en gång" sant.
  useEffect(() => {
    if (auth.isLoading || isRestoring || varmtBeslutat.current) return;

    // OINLOGGAD ELLER PÅ EN AUTH-YTA ⇒ gaten öppnar DIREKT — ingen skärm,
    // ingen startvärmning. Två skäl, båda CI-fångade (#1343 varv 1+2):
    // (1) utan session finns inget att värma (EF-anropen kräver auth);
    // (2) auth-ytorna nås även MED session — inbjudnings- och recovery-
    // tokens skapar en (valkommen/nytt-losenord/passkey) — och får aldrig
    // skymmas av Förberedelseskärmen mitt i sitt flöde.
    //
    // `varmtBeslutat.current = true` SÄTTS HÄR (rättat, task-244 — stod
    // tidigare "MEDVETET INTE", en falsifierad premiss): utan den satt
    // återkommer denna effekt EN GÅNG TILL när `auth.isAuthenticated` flippar
    // (aktiv inloggning) — och då är `gate.typ` redan 'redo' (RouterProvider
    // redan monterad från BYPASS-beslutet ovan). Prenumerations-callbacken
    // längre ned (`nuvarande.typ === 'redo' ? nuvarande : {typ:'varmar',...}`)
    // förhindrar visserligen att gaten NÅGONSIN visar EN EGEN andra skärm i
    // det läget — men `starta()` hade ÄNDÅ anropats OSYNLIGT i bakgrunden,
    // och dess FÖRSTA `qc.ensureQueryData(...)`-anrop registrerar en Query i
    // cachen SYNKRONT (innan fetchen ens settlar). `_authenticated.tsx`:s
    // EGEN `arCacheVarm()`-koll (TASK-227-gaten, dess lazy `useState`-
    // initierare) kan då hinna se en "varm" cache trots att INGEN riktig
    // data hunnit landa — och tystnar HELT, utan att någonsin visa SIN
    // Förberedelseskärm. Resultatet mätt (task-244, persist-cache.staging.
    // test.ts:594 "kall enhet"): H1 "Hej Lotta" renderas direkt, Hems EGNA
    // per-widget-frågor (Nästa event/Obetalda/Nya anmälningar) hamnar var
    // för sig i sitt normala kalla laddläge i stället för att gå via den
    // koordinerade splashen — den bakomliggande orsaken till att kortets
    // egen kommentar (nu korrigerad) påstod att "de två gaterna kan
    // strukturellt aldrig ha en startvärmning i flykten samtidigt": det
    // påståendet höll bara för InnerApps ALLRA FÖRSTA beslut, inte för en
    // andra invokering efter att `gate.typ` redan är 'redo'. Med
    // `varmtBeslutat.current` satt HÄR gör denna effekt sitt beslut EXAKT EN
    // gång per sidladdning (matchar `starta()`-kontraktets egen "en gång per
    // auth-resolution", ADR-112 beslut 5) — en aktiv inloggning på en
    // auth-yta lämnar HELA varm/kall-avgörandet åt `_authenticated.tsx`:s
    // HELT FRISTÅENDE gate (TASK-227), precis som denna kommentar redan sa
    // var AVSIKTEN. Se _authenticated.tsx:s docblock för hela resonemanget,
    // inklusive varför login.tsx (routaEfterLyckadInloggning) MEDVETET INTE
    // rördes (racear mot denna effekts router.invalidate(), se VARV
    // 4-fångsten ovan).
    const AUTH_YTOR = ['/login', '/glomt-losenord', '/nytt-losenord', '/passkey', '/valkommen'];
    const paAuthYta = AUTH_YTOR.some((p) => window.location.pathname.startsWith(p));
    if (!auth.isAuthenticated || paAuthYta) {
      varmtBeslutat.current = true;
      setGate({ typ: 'redo' });
      return;
    }

    if (!varmningHandle.current) {
      // Varm/kall-avgörandet — se klassdoc-blocket ovan. Delat predikat
      // (TASK-227): samma funktion som _authenticated.tsx:s app-yta-gate.
      const varmt = arCacheVarm(queryClient);
      if (varmt) {
        varmtBeslutat.current = true;
        setGate({ typ: 'redo' });
        return;
      }
      // TASK-236 varv 2 (arkitektur-omtag, se filhuvudets § nedan för hela
      // resonemanget): timeoutMs-override via BEFINTLIG seam
      // (StartvarmningBeroenden.timeoutMs, startvarmningen.ts) — men nu med
      // TVÅ nivåer i stället för en. `beraknaVarmningTimeoutMs()` läser
      // per-sida query-param FÖRST (tester som vill OBSERVERA riktig
      // warmup-progression), annars `env.VITE_E2E_WARMUP_TIMEOUT_MS`
      // (e2e-webServerns nya nära-noll-default), annars `undefined`
      // (produktionens 9000ms, ADR-112 beslut 3, HELT ORÖRD — ingen av
      // vägarna sätts i dev/build:staging/build:production).
      const varmningTimeoutMs = beraknaVarmningTimeoutMs();
      varmningHandle.current = starta(queryClient, {
        dataSource,
        ...(varmningTimeoutMs !== undefined ? { timeoutMs: varmningTimeoutMs } : {}),
      });
      varmningHandle.current.slutlofte.then(() => {
        varmtBeslutat.current = true;
        setGate({ typ: 'redo' });
      });
    }

    // Re-prenumereras vid varje (StrictMode-)invokering så förloppet aldrig
    // fryser om en tidigare invokerings prenumeration städades av cleanup.
    return varmningHandle.current.forloppsprenumeration((forlopp) => {
      setGate((nuvarande) => (nuvarande.typ === 'redo' ? nuvarande : { typ: 'varmar', forlopp }));
    });
  }, [auth.isLoading, auth.isAuthenticated, isRestoring]);

  // Render-gate (ADR-037 + TASK-218.3): montera <RouterProvider> först när
  // auth är löst OCH (varm/kall-avgörandet gjort OCH ev. startvärmning klar).
  // Invariant: context.auth är definitiv (isLoading=false) när VARJE
  // beforeLoad körs → ingen flash av skyddat innehåll under auth-resolution
  // (Fynd 2+3 + index.tsx-vektorn, K0.2b). Komplementär till invalidate-
  // effekten ovan (initial resolution vs senare auth-byten).
  // Förberedelseskärmen (AppShell/Forberedelseskarm.tsx) ersätter BÅDA
  // appnivåns tidigare nakna "Laddar…"-rader (denna OCH __root.tsx:s Suspense-
  // fallback) — auth-resolution-fasen visar den i 0-läge (ADR-112 beslut 5).
  // ANROPAREN SÄTTER HÖJDEN (TASK-266) — kontraktet stod redan skrivet på två
  // ställen men var aldrig implementerat på någon av de två produktions-
  // anroparna: `routes/dev/primitives.tsx` ("I produktion fyller ytan hela
  // viewporten, ANROPAREN SÄTTER HÖJDEN, TASK-218.3 gate-integrationen") och
  // wrapper-noten längre ned i denna fil ("RouterProvider-innehållet sätter
  // redan sin egen höjd"). Förberedelseskärmen själv bär `h-full min-h-full`
  // (fyller SIN FÖRÄLDER — medvetet, se dess doc-block § LAYOUTANKARET: ett
  // byte till `min-h-dvh` i komponenten hade brutit ut ur dev-showcasens
  // `h-72 overflow-hidden`-inramning). Utan en förälder med höjd kollapsade
  // hela kedjan: skarpt uppmätt 2026-08-17 på 1280×720 var html/body/#root/
  // container ALLA 219 px, och `justify-center` centrerade följaktligen i den
  // 219 px höga topplådan — logons mitt hamnade på y=69 i stället för 360
  // (Marcus live-observation: "logo+loadingbar ocentrerade").
  //
  // `min-h-dvh` är login.tsx:s egen höjdkälla (`min-h-dvh` på dess `<main>`,
  // rad 226) applicerad på det lager kontraktet pekar ut. `min-h-` (inte
  // `h-`) så ytan kan VÄXA förbi viewporten i stället för att klippa: mätt i
  // isolerad repro växer den till 1032 px vid 1000 px innehåll, medan `h-dvh`
  // fastnar på 720 med innehållets nedre del onåbar (scrollHeight förblir
  // 720). Samma skäl som login.tsx väljer min-h framför h.
  //
  // `grid`, INTE `flex` — och det är en MÄTT skillnad, inte en stilfråga.
  // Barnet bär `h-full` (`height: 100%`), och en procent-höjd mot en förälder
  // vars höjd kommer från `min-height` (alltså `height: auto`) löser sig inte:
  // i en FLEX-förälder blir barnet 219 px, eftersom `height: 100%` heller inte
  // computear till `auto` och därför aldrig utlöser `align-items: stretch`.
  // I en GRID-förälder löses barnets procent-höjd mot GRID-AREAN, som är
  // definit så snart raden dimensionerats av containerns min-height → barnet
  // blir 720. Fyra former mättes sida vid sida i samma körning
  // (`flex min-h-dvh` 219 · `h-dvh` 720 utan växt · `grid min-h-dvh` 720 med
  // växt · `flex-col` + `flex-1` på barnet 720 men kräver ändring i
  // komponenten) — grid är den enda som ger BÅDE viewporthöjd och växt utan
  // att röra Förberedelseskärmen själv.
  if (gate.typ !== 'redo') {
    const forlopp = gate.typ === 'varmar' ? gate.forlopp : FORBEREDELSESKARM_VANTAR;
    return (
      <div className="grid min-h-dvh w-full">
        <Forberedelseskarm klara={forlopp.klara} totalt={forlopp.totalt} />
      </div>
    );
  }

  // ÖVERGÅNGEN — se klassdoc-blocket för `visaEntreanimation`/
  // `entreanimationKlar` ovan för hela resonemanget. Wrappern är ALLTID
  // närvarande (samma <div>, samma position i trädet) från och med FÖRSTA
  // 'redo'-renderingen och framåt — <RouterProvider> byter ALDRIG
  // strukturell position mellan en "wrappad" och en "owrappad" gren, vilket
  // hade fått React att avmontera/återmontera hela routerträdet (och
  // därmed nollställa all routerstate) vid övergångens slut. Endast
  // KLASSNAMNET växlar (`motion-safe:animate-mm-tona-in` → inget), inte
  // trädformen.
  //
  // `--animate-mm-tona-in`, INTE `--animate-mm-avsloj` — TVÅ RUNDOR CI-
  // FÄLLDA innan rätt mekanism hittades (PR #1400, tests/webblasarbeteende/
  // valkommen.test.ts:261+271, "GRÄNSEN: allt innehåll ryms utan vertikal
  // scroll", 3/3 fällningar på BÅDA försöken — se `git log` på denna fil
  // för de två reverterade stegen: (1) `min-h-dvh` på wrappern, (2) samma
  // fällning KVARSTOD efter att `min-h-dvh` togs bort, vilket bevisade att
  // höjden aldrig var boven). Rotorsak, isolerat käll-verifierad (fristående
  // HTML-repro, 390×844, se PR-beskrivningen): `--animate-mm-avsloj`s
  // `from`-keyframe (`transform: translateY(8px)`) räknas in i
  // `document.documentElement.scrollHeight` när det ANIMERADE ELEMENTET
  // spänner hela sidans höjd — mätt 852 px scrollHeight mot 844 px
  // clientHeight vid animationens start, 0 px diff efter och 0 px diff
  // genomgående med translateY borttagen. `/valkommen` (liksom `/login`)
  // är byggd för att rymmas EXAKT — noll marginal — så den 8 px:s transienta
  // visuella bleeden (som INTE ändrar layout-boxen, bara den POST-transform
  // målade positionen) räcker för att tippa `scrollHeight > clientHeight`.
  // `--animate-mm-tona-in` (`src/styles/tailwind.css`) är en OPACITY-ENDAST
  // syskon-animation till `--animate-mm-avsloj` — samma 0,2 s ease-out,
  // UTAN translateY-komponenten, vilket strukturellt inte KAN inflatera
  // scrollHeight (opacity påverkar aldrig layout-/målningsgränser för
  // overflow-beräkningen). `--animate-mm-avsloj` självt är ORÖRT och
  // fortsätter bära sina fem befintliga auth-route-konsumenter — de är
  // små, inline-innehållsblock där transienten aldrig träffar en sida
  // redan vid sin höjdgräns; `mm-tona-in` är EN NY, SMALARE variant för
  // just denna helsides-wrap-användning, inte en ersättning.
  //
  // KLASSEN STRIPPAS EFTER ANIMATIONEN (onAnimationEnd) — INTE valfritt,
  // oberoende av vilken av de två animationerna som används: `both`-
  // fill-mode HÅLLER kvar sista keyframens beräknade stil på elementet
  // EFTER att animationen avslutats om klassen finns kvar. Detta har ingen
  // praktisk effekt för `mm-tona-in` (sista keyframen är bara
  // `opacity: 1`, redan CSS-defaulten), men mönstret hålls konsekvent och
  // billigt att behålla.
  //
  // WRAPPERN BÄR INGEN EGEN HÖJD (varken `min-h-dvh` eller annat) —
  // RouterProvider-innehållet (login.tsx/valkommen.tsx/AppShell) sätter
  // redan sin egen höjd; wrappern ska aldrig lägga sig i den.
  return (
    <div
      data-testid="app-entreanimation"
      className={
        visaEntreanimation && !entreanimationKlar ? 'motion-safe:animate-mm-tona-in' : undefined
      }
      onAnimationEnd={() => setEntreanimationKlar(true)}
    >
      <RouterProvider router={router} context={{ auth }} />
    </div>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root-elementet #root saknas i index.html');
}

// React 19 createRoot-hooks integrerar Sentry för ALL error-capture (Session 16
// K4-konsolideringen): boundaries (AppErrorBoundary + SectionError) renderar
// fallbacks, hooks rapporterar — onCaughtError täcker boundary-fångade fel,
// onUncaughtError resten (event handlers, async, recoverable errors).
createRoot(rootEl, {
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.error('Uncaught error:', error, errorInfo);
  }),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    {/* App-boundary (DoD 7, Session 16 K4): yttersta fel-lagret — täcker
        providers + render-gate + router (sektions-fel tas av SectionError
        via defaultErrorComponent innan de når hit). */}
    <AppErrorBoundary>
      {/* Persist-lagret (ADR-072, task-8.3): ersätter QueryClientProvider —
          samma QueryClient-context för hela appen, plus synkron
          localStorage-restore vid boot (queries gate:as tills restore löst)
          och throttlad synk av varje cache-ändring till lagringen.
          Skyddsräckena (buster/maxAge/logout-clear) bor i queries/persist.ts
          + AuthProvider.logout. */}
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
      </PersistQueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
);

// Registrera Workbox-SW:n (Fas 5, ADR-047) via vite-plugin-pwa OCH koppla upp
// uppdateringsvägen (ADR-047 § Amendering 2026-08-13). Anropet var tidigare ett
// naket registerSW() utan optioner — vilket betydde att appen saknade varje väg
// från "ny deploy" till "Lotta ser ny kod" (mätt i research task-199 § 3).
// Registreringen är fortfarande no-op i dev (devOptions.enabled: false) och
// guardar själv mot miljöer utan serviceWorker-stöd.
registreraAppUppdatering();

// [GA] Rapportera Core Web Vitals
reportWebVitals();
