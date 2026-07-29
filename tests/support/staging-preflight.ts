/**
 * Staging-preflight för LOKALA Playwright-körningar (TASK-77).
 *
 * ═══ HÅLET DEN STÄNGER ═══
 * Två mutexar bevakade staging, och ingen av dem såg den andra:
 *   · `concurrency: staging-tests` (ci-suite.yml) serialiserar CI-run mot
 *     CI-run — och binder ingenting lokalt.
 *   · staging-semaforens fillås (ADR-073 beslut 3) serialiserar lokala
 *     pipelines mot varandra — och binder ingenting i CI.
 * En lokal `npm run test:api:staging` kunde därför stå i samma Airtable-bas
 * som ett CI-jobb. Det inträffade i normalt arbete, inte i konstruerade fall:
 * TASK-70.3:s bygg-agent gjorde det TVÅ gånger under ett pass — andra gången
 * med full kännedom om problemet. Därav mekanism i stället för regel.
 *
 * ═══ VARFÖR HÄR, OCH INTE I package.json ═══
 * `api-setup` är dependency för `api-staging` OCH `kontraktsvakt`; `setup` är
 * dependency för `chromium-authenticated`. Playwright kör ett dependency-
 * projekt ENDAST när något som beror på det valts, vilket ger precis den
 * projekt-precision AC#3 kräver: `api-pure` (som dessutom `testIgnore`:ar
 * setup-filen) och a11y/visual/acceptance rör aldrig preflighten.
 *
 * Formen täcker dessutom rå `npx playwright test --project=api-staging`, som
 * ett npm-script-prefix hade gått bredvid. Mätt, inte antaget:
 * `config.projects` i `globalSetup` är INTE filtrerad av `--project` (körning
 * med `--project=api-pure` listade samtliga tio projekt), så den vägen kan
 * inte skilja staging-körningar från övriga.
 *
 * ═══ NO-OP I CI ═══
 * CI äger redan sin egen serialisering via `staging-tests`. Skulle preflighten
 * köra där hade den sett CI:s EGET jobb som hållare och stoppat körningen —
 * mekanismen måste därför vara tyst under `GITHUB_ACTIONS`. Signalen är vald
 * för att den är entydig: `CI` sätts av godtyckliga verktyg, `GITHUB_ACTIONS`
 * bara av GitHubs runner.
 *
 * Vägen förbi är ETT aktivt val och gäller hela kedjan:
 *     MM_STAGING_PREFLIGHT=off npm run test:api:staging
 */

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMAFOR_SKRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'scripts',
  'staging-semaphore.sh',
);

/** Fältet `stderr` finns på fel från execFileSync, men inte i Error-typen. */
function stderrUr(fel: unknown): string {
  if (typeof fel === 'object' && fel !== null && 'stderr' in fel) {
    const { stderr } = fel as { stderr: unknown };
    if (typeof stderr === 'string') return stderr.trim();
    if (Buffer.isBuffer(stderr)) return stderr.toString('utf-8').trim();
  }
  return fel instanceof Error ? fel.message : String(fel);
}

/**
 * Fäller körningen om ett staging-rörande CI-jobb är igång eller köat.
 *
 * Kastar vid fällning — anropas från ett setup-projekt, så Playwright hoppar
 * över de beroende projekten och körningen får non-zero exit utan att en enda
 * begäran nått staging.
 */
export function kravStagingLedigt(agare: string): void {
  if (process.env.GITHUB_ACTIONS === 'true') return;

  try {
    execFileSync('bash', [SEMAFOR_SKRIPT, 'preflight', agare], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (fel) {
    throw new Error(`Staging-preflighten stoppade körningen (TASK-77).\n\n${stderrUr(fel)}`);
  }
}
