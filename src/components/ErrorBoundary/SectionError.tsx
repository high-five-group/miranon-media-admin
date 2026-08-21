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
 * ═══ COPYN (TASK-285.8, copy-domarna § 5/§ 7.3, ADR-121 § 8) ═══
 *
 * Rubrik OCH brödtext är villkorade på samma `kravsOmladdning`-flagga som
 * knappen — tidigare var båda statiska ("Något gick fel" + en text som
 * nämnde "Försök igen" ÄVEN när knappen visade "Ladda om", ett löfte
 * copy-domarna uttryckligen förbjuder). Chunk-grenens rubrik/brödtext
 * ("Den här delen behöver laddas om" / "En ny version av appen...") bär
 * ORSAK + LÖSNING utan att upprepa databesked-varningen — den bor ENBART i
 * chunk-bannern (`ChunkBanner.tsx`, ADR-121 § 8). Icke-chunk-grenens copy
 * ("Den här delen kunde inte visas" / "Resten av sidan fungerar. Prova
 * igen...") är verbatim den FÖRESLAGNA texten `notis-prototyp.tsx`s egen
 * "notis-sectionerror"-demo redan visade (se `messagebox-promoverings-
 * grind.spec.ts`s doc-block, "MEDVETET UTANFÖR PARET" — den prototyp-
 * strängen var explicit ett förslag på DENNA skivas jobb, inte en
 * facit-låsning). Rubriktiteln på chunk-grenen är MEDVETET INTE identisk med
 * `ChunkBanner`s ("Sidan behöver laddas om") — TASK-285.13 (öppet
 * beslutskort) bokför att BÅDA regionerna vid ett chunk-fel bär knappen
 * "Ladda om" (oförändrat, 285.7:s beslut); att också göra RUBRIKEN identisk
 * hade FÖRVÄRRAT den kollisionen i stället för att minska den — denna skiva
 * löser inte 285.13, men gör inte kollisionen värre.
 *
 * Skarven mot Sentry-kedjan (rapporteras Lottas upprepade, verkningslösa
 * klick?) är `T151` § LUCKA 3 — noterad, inte byggd här.
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
      title={kravsOmladdning ? 'Den här delen behöver laddas om' : 'Den här delen kunde inte visas'}
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
        {kravsOmladdning
          ? 'En ny version av appen gör att den här delen behöver laddas om.'
          : 'Resten av sidan fungerar. Prova igen, eller ladda om hela sidan om det inte hjälper.'}
      </p>
    </MessageBox>
  );
}
