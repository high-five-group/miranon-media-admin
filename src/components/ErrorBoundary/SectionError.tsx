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
 * ═══ VEM ÄGER "LADDA OM" VID CHUNK-FEL (TASK-285.13) ═══
 *
 * INGEN knapp alls här när chunk-flaggan är satt. Chunk-bannern
 * (`src/components/AppShell/ChunkBanner.tsx`) äger åtgärden; sektionsfelet
 * bär bara beskedet. Marcus beslut 2026-08-22 (alternativ 1 av fyra i
 * `TASK-285.13`), motiveringen verbatim: *"vid ett chunk-fel är hela sidan
 * trasig — att erbjuda 'ladda om bara den här delen' är ett löfte som inte
 * kan hållas (vilket är exakt vad skiva `TASK-285.7` heter). Bannern ligger
 * dessutom först i `<main>`, alltså det första en skärmläsare når."*
 * Bokfört i `ADR-121` § Updates 2026-08-22.
 *
 * VAD SOM LÖSTES. `TASK-285.7` bytte knapptexten här till "Ladda om" (skälet
 * i nästa stycke). Följden var att ett verkligt chunk-fel monterade TVÅ
 * samtidigt fyllda `role="alert"`-regioner med IDENTISKT tillgängligt namn —
 * chunk-bannerns knapp och denna. Upptäckten: `TASK-285.7`:s eget test föll
 * på `strict mode violation` för en oscopad
 * `getByRole('button', { name: 'Ladda om' })`. Att i stället ge dem OLIKA
 * namn ("Ladda om den här delen") uteslöts av copy-regeln *"Ladda om", inte
 * "Uppdatera"* (`docs/specs/DESIGN-SYSTEM-SPEC.md` § 21 § Copy-golvet) —
 * ordet skrivs aldrig om.
 *
 * VARFÖR "FÖRSÖK IGEN" INTE HELLER VISAS I DET LÄGET (`TASK-285.7`,
 * `ADR-121` § Tre fynd punkt 3): den kör om samma import mot samma saknade
 * chunk och kan STRUKTURELLT ALDRIG lyckas — den upprepar exakt den hämtning
 * som redan misslyckades. Chunk-grenen har därför NOLL åtgärdsknappar, inte
 * en annan. För alla ANDRA fel står "Försök igen" (reset + invalidate)
 * oförändrat kvar.
 *
 * KLASSNINGEN återanvänder `src/lib/chunk-laddningsfel.ts`s BEFINTLIGA
 * igenkänning — samma modul-nivå-flagga `ChunkBanner` redan läser för sin
 * banner (`useSyncExternalStore(prenumereraPaChunkLaddningsfel,
 * laesChunkLaddningsfel)`). INGEN egen strängmatchning på `error` här (AC #3
 * i TASK-285.7): modulens `window`-lyssnare (`vite:preloadError`) sätter
 * flaggan SYNKRONT innan Vites preload-helper kastar felet vidare (se
 * modulens eget doc-block), så flaggan är redan sann när DENNA komponent
 * hinner rendera för just det felet — `error`-propen behöver därför aldrig
 * inspekteras.
 *
 * ═══ COPYN (TASK-285.8; chunk-grenens brödtext omskriven av TASK-285.13) ═══
 *
 * Rubrik OCH brödtext är villkorade på samma `kravsOmladdning`-flagga som
 * knappen — tidigare var båda statiska ("Något gick fel" + en text som
 * nämnde "Försök igen" ÄVEN när knappen visade "Ladda om", ett löfte
 * copy-domarna uttryckligen förbjuder). Chunk-grenens BRÖDTEXT bär sedan
 * TASK-285.13 LÖSNINGEN i ord i stället för i en knapp ("Ladda om sidan för
 * att hämta den nya versionen") — copy-golvet kräver problem + orsak +
 * lösning (`DESIGN-SYSTEM-SPEC` § 21 § Copy-golvet), och den tidigare
 * lydelsen ("...gör att den här delen behöver laddas om") bar kvar precis
 * det del-scopade löftet beslutet river. Texten står dessutom ENSAM på de
 * ytor som ligger UTANFÖR `AppShell` (login, glömt-lösenord, `/dev/*`), där
 * chunk-bannern inte monteras alls — där är den hela beskedet.
 *
 * Databesked-varningen upprepas INTE här: den bor ENBART i chunk-bannern
 * (`ChunkBanner.tsx`, ADR-121 § Updates 2026-08-21, som stängde § 8).
 * Icke-chunk-grenens copy ("Den här delen kunde inte visas" / "Resten av
 * sidan fungerar. Prova igen...") är verbatim den FÖRESLAGNA texten
 * `notis-prototyp.tsx`s egen "notis-sectionerror"-demo redan visade (se
 * `messagebox-promoverings-grind.spec.ts`s doc-block, "MEDVETET UTANFÖR
 * PARET" — den prototyp-strängen var explicit ett förslag på TASK-285.8:s
 * jobb, inte en facit-låsning). Rubriktiteln på chunk-grenen är MEDVETET
 * INTE identisk med `ChunkBanner`s ("Sidan behöver laddas om"): två
 * samtidigt fyllda alert-regioner ska gå att skilja åt vid
 * landmärkesnavigering, inte likriktas.
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
        // Chunk-läget: INGEN åtgärdsknapp (TASK-285.13, Marcus 2026-08-22).
        // Chunk-bannern äger "Ladda om" — en andra knapp med samma
        // tillgängliga namn i en andra alert-region är precis det denna
        // skiva tar bort.
        kravsOmladdning ? undefined : (
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
          ? 'En ny version av appen gör att den här delen inte kunde visas. Ladda om sidan för att hämta den nya versionen.'
          : 'Resten av sidan fungerar. Prova igen, eller ladda om hela sidan om det inte hjälper.'}
      </p>
    </MessageBox>
  );
}
