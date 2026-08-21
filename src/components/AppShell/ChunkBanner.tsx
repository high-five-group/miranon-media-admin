import { useSearch } from '@tanstack/react-router';
import { useSyncExternalStore } from 'react';
import { Button, MessageBox } from '@/components/primitives';
import { laesChunkLaddningsfel, prenumereraPaChunkLaddningsfel } from '@/lib/chunk-laddningsfel';

/**
 * Chunk-bannern — "en del av sidan kunde inte laddas" (Notistrappan §21 rad
 * 2: "Systemnivå, handling krävs för att fortsätta"). Utbruten ur
 * `AppUpdateBanner.tsx` (TASK-285.5, ADR-121 beslut 3): den ÖVERLAGRADE
 * notisen ("ny version finns", `Uppdateringsnotis`) och DENNA banner delade
 * tidigare mekanism men hör inte till samma klass — olika brådska, olika
 * plats, olika form.
 *
 * ═══ PLACERINGEN (ADR-121 beslut 3) ═══
 *
 * Flyttad från den GLOBALA roten (`__root.tsx`, alla grenar: login/dev/
 * inloggat) in i det INLOGGADE SKALET — monteras av `AppShell` som FÖRSTA
 * barn i innehållsytan (`<main id="main">`), omedelbart före varje sidas
 * `h1`. Skälet är Carbon/Material/GOV.UK samstämmigt (*"place system-wide
 * messages directly below the main header"* / *"below a top app bar"* /
 * *"immediately before the page h1"*) och research-passets mätning: ytan
 * ÄRVER innehållets bredd (max 600 px, `AppShell`s kolumn) i stället för att
 * spänna hela vyporten.
 *
 * KONSEKVENS: bannern finns INTE LÄNGRE på oautentiserade ytor (login,
 * glomt-losenord, …) — den bor bara i det inloggade skalet. Det är en
 * medveten följd av flytten, inte ett förbiseende: mekanismen
 * (`src/lib/chunk-laddningsfel.ts`) kan strukturellt bara fyra vid en
 * navigering ANVÄNDAREN själv utlöser i den redan lazy-laddade appen — se
 * den filens docblock. En andra monteringspunkt hålls ändå vid liv för
 * KOMPONENTENS BETEENDE (ersätter/staplas inte, ingen tom alert-region,
 * eventet sväljs inte): `/dev/primitives`, som ligger UTANFÖR skalet och
 * därför monterar denna komponent explicit själv (se den routens egen
 * kommentar).
 *
 * ═══ FORMEN (ADR-121 § meddelanderutans facit) ═══
 *
 * Chunk-bannern har MEDVETET ingen egen facit-bild
 * (`tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`,
 * yta "chunk-banner", `bilder: []` — en deklaration att ingen bild låstes,
 * inte en lucka). Formen är i stället meddelanderutans (`MessageBox`,
 * `tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json`):
 * `intent="warning"` ger exakt familjeformen (ingen kontur, 4 px vänsterkant
 * i varning-färg, tonad bakgrund, rubrik i intent-färg, actions-sloten
 * högerställd under texten) UTAN att en andra, parallell implementation av
 * samma facit uppfinns (dubbelriktad över-engineering-vakt,
 * `~/.claude/CLAUDE.md` § Instruktioner). `role="alert"` följer av
 * `intent="warning"` (`MessageBox`s egen roll-mappning) — oförändrat mot
 * `ADR-047` § Amendering 2026-08-13 (2). Kryss-regeln (S109-facit) utesluter
 * strukturellt en stäng-knapp för `warning`: enda vägen ut är knappen.
 *
 * ═══ COPYN (kortning, AC #3) ═══
 *
 * Tre meningar ("Appen har uppdaterats … Ladda om för att fortsätta … Har du
 * skrivit …") blir rubrik + två korta meningar: rubriken bär "ladda om"-
 * uppmaningen (ingen egen CTA-mening behövs när knappen redan säger "Ladda
 * om"), och databesked-varningen ("Har du skrivit något som inte är sparat,
 * kopiera det först", ordagrant citerad ur `ADR-121` § 8) bor HÄR och ingen
 * annanstans (§ 8-amenderingen 2026-08-21, Marcus beslut).
 *
 * ═══ DEV-FORCERINGEN (?variant=1&data=chunk) ═══
 *
 * Samma DATAVÄG som `AppUpdateBanner` fortfarande bär för info-läget
 * (ADR-103 B2 steg 1) — `NotisPrototypVaxlare` sätter alltid BÅDA
 * parametrarna, så forceringen är bara nåbar via samma URL-form som förut.
 * Läses HÄR (inte längre i `AppUpdateBanner`) eftersom denna komponent nu
 * lever i ett annat träd. `AppUpdateBanner` läser SAMMA sökparametrar
 * oberoende, för sin egen "chunk vinner över info"-undertryckning — de två
 * läsningarna kan inte divergera: båda läser samma URL för samma route,
 * bara på olika ställen i trädet.
 */
export function ChunkBanner() {
  const omladdningKravs = useSyncExternalStore(
    prenumereraPaChunkLaddningsfel,
    laesChunkLaddningsfel,
    () => false,
  );

  // [PROTOTYPE — KONVERGENS, S109] Se filhuvudets "DEV-FORCERINGEN". DEV-
  // grindad: grenen tree-shakas bort ur prod-bundeln.
  const sok = useSearch({ strict: false }) as Record<string, unknown>;
  const chunkTvingad =
    import.meta.env.DEV && String(sok.variant) === '1' && String(sok.data ?? '') === 'chunk';

  if (!omladdningKravs && !chunkTvingad) {
    return null;
  }

  return (
    <MessageBox
      intent="warning"
      title="Sidan behöver laddas om"
      testId="app-reload-required-banner"
      className="mb-4"
      actions={
        <Button
          intent="primary"
          size="sm"
          onPress={() => {
            // Den nya service workern har REDAN tagit kontroll när denna
            // banner visas (`src/sw.ts` anropar `skipWaiting()` +
            // `clients.claim()`), så en vanlig omladdning hämtar den nya
            // koden — samma resonemang som `Uppdateringsnotis`s knapp.
            window.location.reload();
          }}
          data-testid="app-reload-required-reload"
        >
          Ladda om
        </Button>
      }
    >
      Appen har uppdaterats, så en del av sidan kunde inte laddas. Har du skrivit något som inte är
      sparat, kopiera det först.
    </MessageBox>
  );
}
