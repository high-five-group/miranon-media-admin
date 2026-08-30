import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { AppShell, FORBEREDELSESKARM_VANTAR, Forberedelseskarm } from '@/components/AppShell';
import { JobbLyssnare } from '@/components/betalningar/JobbLyssnare';
import { useDataSource } from '@/data/useDataSource';
import type { StartvarmningForlopp, StartvarmningHandle } from '@/data/warmup/startvarmningen';
import { arCacheVarm, lasVarmningTimeoutOverride, starta } from '@/data/warmup/startvarmningen';
import { env } from '@/env';
import { konsumeraAvsiktligUtloggning } from '@/lib/auth/utloggningsavsikt';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    // Auth-resolution är render-gate:ad i InnerApp (main.tsx, ADR-037): context.auth är
    // definitiv (isLoading=false) när denna beforeLoad körs. Här återstår enbart
    // behörighetskontrollen — ej autentiserad → redirect till /login med ursprungs-URL i
    // search (så användaren återvänder efter login).
    //
    // UNDANTAG (S107 fynd-fix): var utloggningen AVSIKTLIG utelämnas ursprungs-URL:en,
    // så `/login`s `/hem`-default tar över. Utan det blev vägen en sluten loop —
    // utloggningsknappen finns bara på Mer-vyn, så varje utloggning → inloggning
    // landade på `/mer`. Se `lib/auth/utloggningsavsikt.ts` för hela resonemanget.
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: konsumeraAvsiktligUtloggning() ? {} : { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

/**
 * ═══ APP-YTA-GATEN (TASK-227, uppföljning ur TASK-218.3) ═══
 *
 * TASK-218.3 byggde Förberedelseskärmens FÖRSTA ingångspunkt: `InnerApp`
 * (`src/main.tsx`) värmer/gate:ar EN gång vid kall APPSTART med en redan
 * befintlig session (Lottas PWA-vardag, 218.4:s e2e-kontrakt). Den gaten
 * öppnar MEDVETET tyst för auth-ytorna (login/glomt-losenord/nytt-losenord/
 * passkey/valkommen — CI-fångsterna #1343 varv 1+2) och avstår därför
 * MEDVETET från att avgöra varm/kall när ingen session finns än — se
 * main.tsx:s kommentar vid `varmtBeslutat` för hela resonemanget. Kvar stod
 * en öppet bokförd avgränsning: en AKTIV inloggning (användaren skriver in
 * uppgifter och klickar "Logga in", på en enhet som ALDRIG haft en session)
 * fick ALDRIG sin egen varm/kall-avgörande — cachen kunde vara kall, men
 * ingen skärm visades innan Hem.
 *
 * DENNA gate täcker det fallet — router-medvetet i den strikta bemärkelsen
 * att den bara existerar därför att ROUTERN redan bestämt att målet är en
 * app-yta: `_authenticated`-layouten monteras ALDRIG förrän
 * `beforeLoad`-guarden ovan har passerat (`context.auth.isAuthenticated`),
 * vilket per konstruktion utesluter samtliga auth-ytor (de ligger utanför
 * detta route-subträd). Mined danger #1 (skärmen får ALDRIG skymma en
 * auth-yta) är därför INTE en runtime-check här — den är en STRUKTURELL
 * omöjlighet.
 *
 * ── VARFÖR INTE `routaEfterLyckadInloggning` (login.tsx)? ──
 *
 * Uppdragskortet pekar ut `routaEfterLyckadInloggning` (login.tsx) som
 * ingreppspunkt, med hänvisning till research-passet
 * (docs/research/app-startup-warmup-splash-2026-08-15.md). Den hänvisningen
 * PRÖVADES (ADR-086) och HÅLLER INTE bokstavligt — research-dokumentet
 * nämner varken den funktionen eller login.tsx någonstans; formuleringen är
 * ärvd från main.tsx:s egen (tidigare) kommentar om avgränsningen, inte
 * från research-passet självt. Bokfört som avvikelse, inte tyst rättat.
 *
 * Den tekniska anledningen att INTE lägga triggern där: `handleSubmit`
 * (login.tsx) anropar `auth.login()` och därefter `routaEfterLyckadInloggning()`
 * — MEN InnerApps `router.invalidate()`-effekt (main.tsx, VARV 4-fångsten,
 * `#1343`/`de262db4`) triggar på EXAKT samma `auth.isAuthenticated`-flipp och
 * kör synkront/mikrotask-snabbt (ingen nätverksväntan), medan
 * `routaEfterLyckadInloggning` väntar in `getSession()` + en villkorad
 * passkey-nätverksprobe. `router.invalidate()` tvingar `/login`s EGEN
 * `beforeLoad` att re-evaluera (samma mekanism som loggar ut en användare
 * mitt på en skyddad sida) — ser den `isAuthenticated: true` kastar den ett
 * eget `redirect({ to: search.redirect })`, VILKET SOM HELST kan vinna racet
 * mot login.tsx:s egen `navigate()`. Att lägga en ny, tidsberoende
 * gate-övergång (stanna på /login, visa skärmen, navigera sedan manuellt) i
 * `routaEfterLyckadInloggning` hade byggt ANNU en async-gissning ovanpå
 * EXAKT den mekanism en verklig produktionsregression redan en gång kom ur
 * (samma klass fel — se main.tsx:s VARV 4-kommentar). Den slutliga
 * destinationen är densamma oavsett VILKEN väg som vinner racet (`search
 * .redirect`, förutom det just nu avstängda passkey-erbjudandet) — så
 * DESTINATIONS-sidan (denna layout) är den robusta, timing-oberoende platsen
 * att gate:a på, inte KÄLL-sidan (login.tsx).
 *
 * ── VARM/KALL-PREDIKATET ──
 *
 * `arCacheVarm()` (delat, `startvarmningen.ts`, TASK-227) är EXAKT samma
 * predikat InnerApps egen gate använder. Den läser query-cachens FAKTISKA
 * innehåll VID MOUNT — inte en delad "redan avgjort"-flagga. Det håller av
 * två skäl: (1) InnerApp gör sitt varm/kall-BESLUT (och därmed sitt ENDA
 * `starta()`-anrop) EXAKT EN gång per sidladdning — `varmtBeslutat.current`
 * sätts numera ÄVEN på auth-yta-bypass-grenen (main.tsx, rättat task-244;
 * stod tidigare "MEDVETET INTE"). INNAN den rättningen kunde InnerApps egen
 * warmup-effekt återkomma en andra gång efter en AKTIV inloggning (samma
 * `auth.isAuthenticated`-flipp denna layout själv reagerar på) och starta EN
 * OSYNLIG andra startvärmning i bakgrunden — `gate.typ` var redan 'redo' då
 * (bypass-beslutet höll RouterProvider monterad), så INGEN egen skärm syntes
 * från InnerApp, men dess FÖRSTA `ensureQueryData`-anrop registrerar en Query
 * i cachen SYNKRONT, före fetchen ens settlar — vilket kunde hinna göra
 * `arCacheVarm()` HÄR sant innan denna gates lazy `useState`-initierare ens
 * körde, och tystade HELA denna gate i onödan (mätt: `main#main` monterat
 * direkt, Hems egna per-widget-frågor i sitt normala kalla laddläge i stället
 * för den koordinerade splashen). Med rättningen gör InnerApp ALDRIG ett
 * andra `starta()`-anrop, så denna layout kan nu verkligen ALDRIG montera
 * medan en startvärmning pågår någon annanstans — ingen kapplöpning att
 * samordna. (2) Predikatet ger "tyst-vid-varmt" (ADR-112 beslut 2) korrekt
 * ÄVEN för det ovanliga fallet en session LÖPER UT (inte en explicit
 * utloggning — den tömmer cachen via `queryClient.clear()`, ADR-072
 * skyddsräcke 1) medan den PERSISTERADE query-cachen fortfarande är varm:
 * användaren loggar in igen, denna gate ser en varm cache och förblir tyst —
 * utan att känna till VARFÖR den är varm.
 *
 * ── STRICTMODE ──
 *
 * `handleRef`/`avgjortRef` speglar InnerApps etablerade mönster
 * (`varmningHandle`/`varmtBeslutat`, main.tsx): en andra effekt-invokering
 * (dev, StrictMode) återanvänder samma handle i stället för att starta en
 * andra startvärmning eller lämna förloppet oprenumererat.
 */
type AppYtaVarmningsFas = { typ: 'varmar'; forlopp: StartvarmningForlopp } | { typ: 'redo' };

function useAppYtaVarmningsgate(): AppYtaVarmningsFas {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const [fas, setFas] = useState<AppYtaVarmningsFas>(() =>
    arCacheVarm(queryClient)
      ? { typ: 'redo' }
      : { typ: 'varmar', forlopp: FORBEREDELSESKARM_VANTAR },
  );
  const handleRef = useRef<StartvarmningHandle | null>(null);
  const avgjortRef = useRef(fas.typ === 'redo');

  useEffect(() => {
    if (avgjortRef.current) return;

    if (!handleRef.current) {
      // TASK-236 varv 2: samma timeoutMs-beräkning som InnerApp (main.tsx)
      // — se den filens `beraknaVarmningTimeoutMs()`-docblock för hela
      // resonemanget. DENNA gate triggas efter en KLIENT-SIDES omdirigering
      // (aktiv inloggning, TASK-227) — `window.location` är redan
      // destinations-URL:en då, vilket är EXAKT skälet till att
      // `lasVarmningTimeoutOverride()` läser sessionStorage i stället för
      // en URL-query-param (se den funktionens docblock, startvarmningen.ts).
      const varmningTimeoutMs = lasVarmningTimeoutOverride() ?? env.VITE_E2E_WARMUP_TIMEOUT_MS;
      handleRef.current = starta(queryClient, {
        dataSource,
        ...(varmningTimeoutMs !== undefined ? { timeoutMs: varmningTimeoutMs } : {}),
      });
      handleRef.current.slutlofte.then(() => {
        avgjortRef.current = true;
        setFas({ typ: 'redo' });
      });
    }

    // Re-prenumereras vid varje (StrictMode-)invokering — samma skäl som
    // InnerApps motsvarande kommentar (main.tsx): en tidigare invokerings
    // prenumeration kan ha städats av cleanup utan att förloppet fryser.
    return handleRef.current.forloppsprenumeration((forlopp) => {
      setFas((nuvarande) => (nuvarande.typ === 'redo' ? nuvarande : { typ: 'varmar', forlopp }));
    });
  }, [queryClient, dataSource]);

  return fas;
}

// App-skalet (header + main + tab bar + skip-länk) bor på denna layout, inte
// __root: login/dev-ytorna bär egna <main>-landmarks och tab bar utanför
// inloggat läge vore död navigation (Session 16 K3 STOPPA-utfall A).
function AuthenticatedLayout() {
  const gate = useAppYtaVarmningsgate();

  // Förberedelseskärmen (TASK-227): samma komponent/motor som appstartsfallet
  // (TASK-218.3), monterad HÄR i stället för main.tsx — se klassdoc-blocket
  // ovan för varför. Kan per konstruktion aldrig skymma en auth-yta (denna
  // komponent existerar bara efter _authenticated-guarden passerat).
  // ANROPAREN SÄTTER HÖJDEN (TASK-266) — samma `grid min-h-dvh w-full`-wrapper
  // som main.tsx:s gate-gren, av exakt samma skäl. Se den filens kommentar för
  // hela resonemanget: kontraktet ("anroparen sätter höjden"), mätvärdena, och
  // varför wrappern är `grid` och inte `flex` (barnets `h-full` löses mot
  // grid-arean men kollapsar i en flex-förälder vars höjd kommer från
  // min-height).
  if (gate.typ !== 'redo') {
    return (
      <div className="grid min-h-dvh w-full">
        <Forberedelseskarm klara={gate.forlopp.klara} totalt={gate.forlopp.totalt} />
      </div>
    );
  }

  return (
    <>
      {/* [TASK-346.4 AC #5] Kvittojobbets Realtime-lyssnare + läsningen vid
          appöppning (ADR-129 beslut 8). RENDERAR `null` — den ligger som
          SYSKON till AppShell, inte inuti den, så den varken kan påverka
          skalets layout eller lägga en nod i skärmläsarträdet.

          HÄR OCH INTE I `__root`: prenumerationen kräver en inloggad session
          (Realtime levererar bara rader RLS släpper igenom), och
          `_authenticated`-layouten monteras per konstruktion aldrig förrän
          `beforeLoad`-guarden ovan passerat. På `__root` hade den försökt
          koppla upp sig på inloggningssidan.

          Miljöflaggan gatar båda effekterna — se `JobbLyssnare`. */}
      <JobbLyssnare />
      <AppShell>
        <Outlet />
      </AppShell>
    </>
  );
}
