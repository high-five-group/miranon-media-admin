/**
 * Staging-preflight för preview-flödet (TASK-84).
 *
 * ═══ VARFÖR ETT SETUP-PROJEKT, OCH INTE EN RAD I TESTET ═══
 * Formen är TASK-77:s, oförändrad: haken bor i det setup-projekt som de
 * staging-rörande projekten beror på (`api-setup` → `api-staging` +
 * `kontraktsvakt`, `setup` → `chromium-authenticated`). `staging-preview` var
 * det enda Playwright-projekt som rör staging utan en sådan förälder, och fick
 * därför en — i stället för en andra form vid sidan av den befintliga.
 *
 * Att lägga anropet i `staging-preview.test.ts` hade täckt exakt en fil.
 * Dependency-vägen täcker projektet: en ny fil i `tests/preview/` ärver
 * preflighten utan att någon behöver minnas den. Det är samma skäl som gjorde
 * TASK-77:s hake till en projekt-dependency och inte ett npm-prefix.
 *
 * ═══ PRECISIONEN ÄR REDAN GIVEN ═══
 * Båda projekten existerar ENDAST under `PLAYWRIGHT_STAGING_PREVIEW=1`
 * (playwright.config.ts) — kanoniskt satt av `npm run test:preview:staging`.
 * En vanlig `npx playwright test` instansierar dem alltså inte, och ingen
 * annan svit betalar för preflighten.
 *
 * ═══ VAD DEN INTE HINDRAR — skrivet, inte underförstått ═══
 * `npm run test:preview:staging` bygger och grindar bundeln FÖRE Playwright
 * startar, och Playwrights `webServer` (vite preview på 4173) startar före
 * projekten. En fällning här sparar alltså inte det lokala bygget — den sparar
 * det som räknas: noll begäran mot staging. Att flytta haken före bygget hade
 * krävt ett prefix i `package.json`, som går bredvid rå
 * `npx playwright test --project=staging-preview`.
 */

import { test as setup } from '@playwright/test';
import { kravStagingLedigt } from '../support/staging-preflight';

setup('staging-preflight före preview-flödet (TASK-84)', () => {
  kravStagingLedigt('lokal Playwright-körning (preview-setup)');
});
