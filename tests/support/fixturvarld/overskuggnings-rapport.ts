import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import {
  ANNOTATION_TYP,
  aggregeraDodaStallen,
  byggDodaMeddelande,
  type FilObservationer,
  type Overskuggningsobservation,
} from './overskuggnings-vakt';

/**
 * Den TRÖGA överskuggnings-vaktens verkan (task-62 steg 2).
 *
 * Beslutet — vilka deklarationsställen som är döda — bor i
 * `overskuggnings-vakt.ts` som rena funktioner. Denna fil är skalet som samlar
 * underlaget och fäller körningen, precis som `hermetic.ts` är skalet runt
 * hermetik-vaktens beslut.
 *
 * ── VARFÖR EN REPORTER, OCH INTE EN FIXTUR ELLER globalTeardown ──────────
 *
 * Per-fil-aggregering kan först avgöras när HELA filen körts, och det ändrar
 * integrationspunkten: den gamla vakten kunde fälla i den per-test-scopade
 * fixtur-teardownen, denna kan inte. Tre former prövades mot vad Playwright
 * faktiskt ger:
 *
 *   · WORKER-SCOPAD FIXTUR — ser bara sin egen worker. Repot kör `retries: 2` i
 *     CI, och Playwright startar en NY worker efter varje fallerat test
 *     (`fullyParallel` är osatt, så en fil kör annars i EN worker). En fil med
 *     ett rött test splittras alltså över workers, och varje worker hade sett en
 *     ofullständig fil — vilket ger falska "ingen använde stället". FÖRKASTAD.
 *
 *   · `test.afterAll` I EN DELAD BAS — hooken registreras i den suite som laddas
 *     just då. `hermetic.ts` är en ES-modul och evalueras EN gång per
 *     worker-process, så en `afterAll` på modulnivå hade hamnat i den FÖRSTA
 *     filen som importerade modulen och inte i de övriga. Att i stället kräva
 *     att var och en av de 18 filerna anropar en registreringsfunktion gör
 *     vakten avstängbar genom glömska — samma felklass som
 *     `onUnhandledRequest`-defaulten (`hermetic.ts`). FÖRKASTAD.
 *
 *   · JSONL VIA globalSetup/globalTeardown — repots befintliga mätmönster
 *     (`tests/global-teardown.ts` § hermetik-rapport). Det fungerar, men bär en
 *     fälla repot redan betalat för: filen överlever körningen, och en
 *     kvarlämnad fil presenterades som den just körda svitens utfall (tråd T105,
 *     "frånvaro presenterad som data"). Nollställningen i `globalSetup` är
 *     plåstret. En reporter har ingen persistent state alls. FÖRKASTAD.
 *
 * VALD FORM: REPORTER. Den är den enda komponent som ser samtliga tester i en
 * fil oavsett vilken worker som körde dem, den ser dessutom PLANERINGEN via
 * `onBegin` (vilket gör det möjligt att veta om alla planerade tester faktiskt
 * körde), och den kan fälla körningen genom att returnera `{ status: 'failed' }`
 * ur `onEnd` — verifierat i typerna för den installerade versionen
 * (`playwright/types/testReporter.d.ts` rad 160, 1.61.1).
 *
 * ── UNDERLAGET RESER SOM TEST-ANNOTATIONER ───────────────────────────────
 *
 * `hermetic.ts` lägger en annotation per test med observationerna som JSON.
 * `TestResult.annotations` inkluderar allt som lagts till `testInfo.annotations`
 * under körningen (samma typfil, rad 593–613). Formen valdes framför
 * `testInfo.attach` för att den inte skriver artefakter till disk.
 *
 * ── NÄR VAKTEN STÅR ÖVER ─────────────────────────────────────────────────
 *
 * Aggregeringen förutsätter att filens tester faktiskt kördes. Kördes en
 * delmängd ser vakten färre användare än filen har, och ett levande ställe kan
 * se dött ut. `--grep`, `--grep-invert` och `--shard` stänger därför av vakten
 * helt; de syns i `FullConfig`. Positions-urvalet `fil.ts:rad`, `--last-failed`
 * och UI-läget filtrerar suiten UTAN att synas i konfigurationen — den luckan är
 * öppet bokförd, och rapportens sista stycke säger rakt ut till läsaren att
 * fyndet kan vara falskt om bara en delmängd kördes.
 */

interface Uppsamlat {
  observationer: Overskuggningsobservation[];
  tester: number;
}

/** Playwrights default när `reporter` inte är satt (`common/index.js` rad 753). */
export const PLAYWRIGHT_DEFAULT_REPORTER = process.env.CI ? 'dot' : 'list';

export default class OverskuggningsRapport implements Reporter {
  /** Nyckel: `projektnamn ⇥ filsökväg` — samma fil i två projekt är två filer. */
  private readonly perFil = new Map<string, Uppsamlat>();
  private planerade = new Map<string, number>();
  private filtrerad = false;

  onBegin(config: FullConfig, suite: Suite): void {
    this.filtrerad = arFiltrerad(config);

    const planerade = new Map<string, number>();
    for (const test of suite.allTests()) {
      const nyckel = filNyckel(test);
      planerade.set(nyckel, (planerade.get(nyckel) ?? 0) + 1);
    }
    this.planerade = planerade;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const nyckel = filNyckel(test);
    const uppsamlat = this.perFil.get(nyckel) ?? { observationer: [], tester: 0 };
    uppsamlat.tester += 1;

    for (const annotation of result.annotations) {
      if (annotation.type !== ANNOTATION_TYP || annotation.description === undefined) continue;
      uppsamlat.observationer.push(
        ...(JSON.parse(annotation.description) as Overskuggningsobservation[]),
      );
    }

    this.perFil.set(nyckel, uppsamlat);
  }

  // `async` är inte kosmetik: `Reporter.onEnd` tar ett SYNKRONT returvärde
  // endast som `void` — statusen måste komma i en Promise
  // (`playwright/types/testReporter.d.ts` rad 160).
  async onEnd(result: FullResult): Promise<{ status?: FullResult['status'] } | undefined> {
    if (this.filtrerad) return undefined;
    if (result.status === 'interrupted' || result.status === 'timedout') return undefined;

    // Bara filer där ALLA planerade tester rapporterade in. En fil som avbröts
    // (`--max-failures`, en krasch) är per definition ofullständigt mätt.
    const fullstandiga: FilObservationer[] = [];
    const testerPerFil = new Map<string, number>();
    for (const [nyckel, uppsamlat] of this.perFil) {
      if (uppsamlat.tester !== this.planerade.get(nyckel)) continue;
      fullstandiga.push({
        fil: nyckel,
        testerSomKorde: uppsamlat.tester,
        observationer: uppsamlat.observationer,
      });
      testerPerFil.set(nyckel, uppsamlat.tester);
    }

    const doda = aggregeraDodaStallen(fullstandiga);
    if (doda.length === 0) return undefined;

    process.stdout.write(`\n${byggDodaMeddelande(doda, testerPerFil)}\n\n`);
    return { status: 'failed' };
  }

  /** Reportern skriver bara sin egen rapport — övrig utdata bärs av list/dot. */
  printsToStdio(): boolean {
    return false;
  }
}

/**
 * `projektnamn ⇥ filsökväg`. Projektet ingår därför att visual-sviten kör SAMMA
 * spec-filer i två projekt (desktop + mobile) — utan projektet hade de två
 * körningarnas observationer smälts ihop till en fil som såg dubbelt så bevakad
 * ut som den är.
 */
function filNyckel(test: TestCase): string {
  return `${test.parent.project()?.name ?? '?'}\t${test.location.file}`;
}

/** Default-grepet är `/.*​/` — allt annat betyder att ett urval gjorts. */
function arFiltrerad(config: FullConfig): boolean {
  if (config.shard !== null) return true;
  if (config.grepInvert !== null && config.grepInvert !== undefined) return true;
  const grep = Array.isArray(config.grep) ? config.grep : [config.grep];
  return grep.some((uttryck) => uttryck.source !== '.*');
}
