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
import { starta } from './data/warmup/startvarmningen';
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
    // Invalidate ENDAST när auth är löst. Under isLoading är <RouterProvider> render-gate:ad
    // (mountas ej, se nedan) → routerns context.auth är fortfarande modul-defaulten (undefined).
    // En invalidate då skulle köra beforeLoad mot undefined auth → krasch. Gaten + invalidate
    // är komplementära: gaten sköter initial resolution, invalidate sköter login/logout
    // (auth-byten EFTER mount, då isLoading redan är false).
    if (!auth.isLoading) {
      router.invalidate();
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  // Warmup-gaten (TASK-218.3, ADR-112 beslut 5) — se klassdoc-blocket ovan för
  // hela resonemanget. Körs EN gång per auth-resolution: `auth.isLoading` och
  // `isRestoring` kan strukturellt aldrig gå tillbaka till sant efter sitt
  // första lös (AuthProvider.tsx sätter `isLoading=false` i varje event,
  // ALDRIG true igen; PersistQueryClientProvider restaurerar en gång vid
  // mount) — reffarna ovan är därför ett StrictMode-skyddsräcke, inte den
  // mekanism som gör "en gång" sant.
  useEffect(() => {
    if (auth.isLoading || isRestoring || varmtBeslutat.current) return;

    // OINLOGGAD ⇒ gaten öppnar DIREKT — ingen skärm, ingen startvärmning.
    // Utan session finns inget att värma (EF-anropen kräver auth), och
    // login-/glömt lösenord-/välkommen-ytorna får aldrig skymmas av
    // Förberedelseskärmen (webblasarbeteende-svitens regressionsfångst,
    // #1343 CI-varv 1). `varmtBeslutat` sätts MEDVETET INTE här: när
    // inloggningen sedan sker (auth.isAuthenticated flippar, dep nedan)
    // körs varm/kall-avgörandet på riktigt — det ÄR post-login-fallet
    // ADR-112 beställde skärmen för.
    if (!auth.isAuthenticated) {
      setGate({ typ: 'redo' });
      return;
    }

    if (!varmningHandle.current) {
      // Varm/kall-avgörandet — se klassdoc-blocket ovan.
      const varmt = queryClient.getQueryCache().getAll().length > 0;
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

  return <RouterProvider router={router} context={{ auth }} />;
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
