import { type ErrorComponentProps, useRouter } from '@tanstack/react-router';
import { useSyncExternalStore } from 'react';
import { Button, MessageBox } from '@/components/primitives';
import { laesChunkLaddningsfel, prenumereraPaChunkLaddningsfel } from '@/lib/chunk-laddningsfel';

/**
 * Sektions-fallback (Fas 5, byggplan DoD 6) — wirad som routerns
 * `defaultErrorComponent` (src/router.ts) så ALLA routes täcks utan
 * per-route-duplicering. Ersätter RouteErrorFallback (ADR-038-eran) per
 * Session 16 K4-konsolideringen till exakt två fel-lager (sektion + app).
 *
 * Renderar i Outlet-positionen: vid fel i en route överlever skalet
 * (header + tab bar) och navigation till andra flikar fungerar.
 *
 * - MessageBox intent="error" ger `role="alert"` (assertiv annonsering).
 * - "Försök igen" = routerns reset-mekanism (remount) + invalidate
 *   (kör om loaders/beforeLoad — reset ensam läker inte loader-fel).
 * - INGEN egen Sentry-capture: createRoot-hooken `onCaughtError`
 *   (src/main.tsx) rapporterar redan — dubbel-rapporterings-skydd
 *   (K4-beslut 3).
 *
 * Knappen bärs av `MessageBox`s `actions`-slot (TASK-285.2, S109-facit,
 * ADR-103 B2 steg 1) i stället för att placeras egenhändigt i `children`.
 *
 * ═══ VILKEN KNAPP (TASK-285.7, ADR-121 § Tre fynd punkt 3) ═══
 *
 * "Försök igen" kör om samma import mot samma saknade chunk och kan
 * STRUKTURELLT ALDRIG lyckas vid ett chunk-fel — den upprepar exakt den
 * hämtning som redan misslyckades. Vid chunk-fel visas därför "Ladda om"
 * (hel omladdning) i stället.
 *
 * KLASSNINGEN återanvänder `src/lib/chunk-laddningsfel.ts`s BEFINTLIGA
 * igenkänning — samma modul-nivå-flagga `AppUpdateBanner` redan läser för
 * sin chunk-banner (`useSyncExternalStore(prenumereraPaChunkLaddningsfel,
 * laesChunkLaddningsfel)`). INGEN egen strängmatchning på `error` här (AC
 * #3): modulens `window`-lyssnare (`vite:preloadError`) sätter flaggan
 * SYNKRONT innan Vites preload-helper kastar felet vidare (se modulens eget
 * doc-block), så flaggan är redan sann när DENNA komponent hinner rendera
 * för just det felet — `error`-propen behöver därför aldrig inspekteras.
 *
 * Copyn (rubrik/brödtext) rörs INTE av denna skiva — det är `TASK-285.8`s
 * jobb (S109-facitets egen not: "SectionError vid chunk-fel ska visa 'Ladda
 * om', inte 'Försök igen' (beslut i PRD:n)"). Skarven mot Sentry-kedjan
 * (rapporteras Lottas upprepade, verkningslösa klick?) är `T151` § LUCKA 3 —
 * noterad, inte byggd här.
 */
export function SectionError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const kravsOmladdning = useSyncExternalStore(
    prenumereraPaChunkLaddningsfel,
    laesChunkLaddningsfel,
    // Server-snapshot: appen renderas aldrig på servern (samma argument som
    // AppUpdateBanner.tsx kräver av samma anledning).
    () => false,
  );
  return (
    <MessageBox
      intent="error"
      title="Något gick fel"
      actions={
        kravsOmladdning ? (
          <Button intent="secondary" size="sm" onPress={() => window.location.reload()}>
            Ladda om
          </Button>
        ) : (
          <Button
            intent="secondary"
            size="sm"
            onPress={() => {
              reset();
              router.invalidate();
            }}
          >
            Försök igen
          </Button>
        )
      }
    >
      <p>
        Den här delen av sidan kunde inte visas. Försök igen - ladda om hela sidan om felet
        kvarstår.
      </p>
    </MessageBox>
  );
}
