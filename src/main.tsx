import * as Sentry from '@sentry/react';
import { useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Validera env-variabler vid uppstart — kraschar direkt om något saknas.
import './env';

import './styles/base.css';
import './styles/tailwind.css';

import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import { FORBEREDELSESKARM_VANTAR, Forberedelseskarm } from './components/AppShell';
import { AppErrorBoundary } from './components/ErrorBoundary';
import { dataSource } from './data/dataSource';
import type { StartvarmningForlopp, StartvarmningHandle } from './data/warmup/startvarmningen';
import { arCacheVarm, starta } from './data/warmup/startvarmningen';
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
    // skymmas av Förberedelseskärmen mitt i sitt flöde. `varmtBeslutat`
    // sätts MEDVETET INTE här — TASK-227 löser den EFTERFÖLJANDE
    // avgränsningen (skärmen direkt EFTER ett login-klick) med en HELT
    // FRISTÅENDE gate i `src/routes/_authenticated.tsx` i stället för att
    // denna effekt görs router-medveten: den layout-routen monteras per
    // konstruktion ALDRIG förrän `<RouterProvider>` gör det (dvs. EFTER att
    // DENNA gate redan släppt), så de två gaterna kan strukturellt aldrig ha
    // en startvärmning i flykten samtidigt — `arCacheVarm()` (delat predikat,
    // startvarmningen.ts) är den enda samordning som behövs; ingen delad
    // "redan avgjort"-flagga. Se _authenticated.tsx:s docblock för hela
    // resonemanget, inklusive varför login.tsx (routaEfterLyckadInloggning)
    // MEDVETET INTE rördes (racear mot denna effekts router.invalidate(),
    // se VARV 4-fångsten ovan).
    const AUTH_YTOR = ['/login', '/glomt-losenord', '/nytt-losenord', '/passkey', '/valkommen'];
    const paAuthYta = AUTH_YTOR.some((p) => window.location.pathname.startsWith(p));
    if (!auth.isAuthenticated || paAuthYta) {
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
      varmningHandle.current = starta(queryClient, { dataSource });
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
  if (gate.typ !== 'redo') {
    const forlopp = gate.typ === 'varmar' ? gate.forlopp : FORBEREDELSESKARM_VANTAR;
    return <Forberedelseskarm klara={forlopp.klara} totalt={forlopp.totalt} />;
  }

  // ÖVERGÅNGEN — se klassdoc-blocket för `visaEntreanimation`/
  // `entreanimationKlar` ovan för hela resonemanget. Wrappern är ALLTID
  // närvarande (samma <div>, samma position i trädet) från och med FÖRSTA
  // 'redo'-renderingen och framåt — <RouterProvider> byter ALDRIG
  // strukturell position mellan en "wrappad" och en "owrappad" gren, vilket
  // hade fått React att avmontera/återmontera hela routerträdet (och
  // därmed nollställa all routerstate) vid övergångens slut. Endast
  // KLASSNAMNET växlar (`motion-safe:animate-mm-avsloj` → inget), inte
  // trädformen.
  //
  // KLASSEN STRIPPAS EFTER ANIMATIONEN (onAnimationEnd) — INTE valfritt.
  // `--animate-mm-avsloj`s `both`-fill-mode HÅLLER kvar sista keyframens
  // `transform: translateY(0)` på elementet EFTER att animationen avslutats
  // om klassen finns kvar. Ett kvarstående, icke-`none`-transform-värde
  // etablerar per CSS-specen en NY containing block för alla
  // `position: fixed`-ättlingar — och AppShells `<TabBar />` ÄR
  // fixed-positionerad (`TabBar.tsx`: `className="fixed inset-x-4
  // bottom-4 ..."`). Utan strippningen hade tab-baren blivit PERMANENT
  // felpositionerad (fixerad mot denna wrapper i stället för viewporten)
  // för hela sessionen efter FÖRSTA appmonteringen — inte bara under de
  // 0,2 sekunderna animationen faktiskt kör.
  //
  // WRAPPERN BÄR MEDVETET INGEN EGEN HÖJD (varken `min-h-dvh` eller annat).
  // Ett tidigare försök att lägga `min-h-dvh` på wrappern (för att dämpa
  // TabBar-glappet UNDER de 0,2 sekunderna, se stycket ovan) körde sönder
  // `/valkommen`s "allt ryms utan scroll"-kontrakt
  // (`tests/webblasarbeteende/valkommen.test.ts` rad 261/271, CI-fällning
  // 2026-08-16 PR #1400) — sidans EGET innehåll sätter redan sin egen höjd
  // (samma mönster som `login.tsx`s `<main className="min-h-dvh ...">`),
  // och en TVINGAD extra min-höjd på wrappern OVANPÅ det trycker sidan förbi
  // viewportens kant. RouterProvider-innehållet bär redan sin höjd — wrappern
  // ska aldrig lägga sig i den. KVARSTÅENDE, INTE LÖST: under de 0,2
  // animerade sekunderna (endast vid FÖRSTA appmonteringen, endast om
  // motion tillåts) kan `<TabBar />`s `bottom-4` transientvis beräknas mot
  // wrapperns egen — nu icke garanterat viewport-höga — box i stället för
  // viewporten, om den matchade rutten är kortare än viewporten. Ovannämnda
  // strippning gör felet ALLTID transient (aldrig permanent) om det alls
  // uppstår; ett bevis på renderad autentiserad yta kunde inte tas
  // (CORS blockerar warmup-EF-anrop från en icke-allowlistad dev-port,
  // se PR-beskrivningen) — bokfört öppet, inte löst i denna skiva.
  return (
    <div
      data-testid="app-entreanimation"
      className={
        visaEntreanimation && !entreanimationKlar ? 'motion-safe:animate-mm-avsloj' : undefined
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
