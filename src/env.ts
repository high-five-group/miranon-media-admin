import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import { assertModeCoherent } from './lib/env-coherence';

/**
 * [GA] Validera env-variabler vid uppstart.
 *
 * Kraschar direkt om något saknas eller har fel format — inga `undefined`-
 * fel vid runtime. Importera denna modul från `src/main.tsx` så uppstarten
 * kraschar innan React mountas.
 */
export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1),
    // Sentry DSN är optional — initieras bara i prod/staging där
    // den är satt. Lokal dev körs utan Sentry för att inte spam:a
    // Sentry-kvoten med utvecklings-fel.
    VITE_SENTRY_DSN: z.string().url().optional(),
    // TASK-236 (218.3 e2e-svit-tid): valfri e2e-läges-DEFAULT-override av
    // startvärmningens hårda tak (DEFAULT_TIMEOUT_MS 9000,
    // src/data/warmup/startvarmningen.ts). Sätts ENDAST av
    // playwright.config.ts:s e2e-webServer (chromium-authenticated/setup) —
    // aldrig av build:staging/build:production, så produktions-defaulten
    // (9000ms, ADR-112 beslut 3) förblir orörd. Existerande DI-seam
    // (`StartvarmningBeroenden.timeoutMs`), inte ett nytt gate-beteende.
    // VARV 2: detta är GOLVET (nära noll, se playwright.config.ts:s
    // kommentar) — enskilda tester som vill ha den RIKTIGA 9000ms-tiden kan
    // opta in per sidladdning via query-param `?e2eVarmningMs=9000`, som
    // vinner över denna default (src/main.tsx:s beraknaVarmningTimeoutMs()).
    // `.positive()` är avsiktligt: 0 kastar här och kraschar appen — golvet
    // är därför satt till 50, inte 0.
    VITE_E2E_WARMUP_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
    /**
     * [TASK-346.4 AC #6, PRD TASK-346 § Miljöflagga (B2)] Betalningsflödets
     * miljöflagga: `pa` i dev och staging, FRÅNVARANDE i prod tills Marcus
     * slår på den efter prod-migrationerna.
     *
     * TRE VÄRDEN, INTE TVÅ: `pa`, `av` och frånvarande. Skälet är att en
     * uttrycklig avstängning ska kunna stå kvar i en mode-fil som
     * dokumentation ("flaggan finns, den är av här") i stället för att
     * behöva raderas — och att ett STAVFEL ska krascha uppstarten
     * högljutt i stället för att tyst tolkas som avstängt.
     * `z.coerce.boolean()` hade gjort motsatsen: den läser VARJE icke-tom
     * sträng som `true`, alltså även `'av'`.
     *
     * `emptyStringAsUndefined: true` (nedan) gör en tom rad likvärdig med
     * en frånvarande, vilket är rätt: båda betyder "inte påslagen".
     *
     * RIVNINGSNOT: flaggan RIVS av TASK-346.12 efter promoveringen — då
     * försvinner denna rad, `src/lib/funktionsflaggor.ts` och varje
     * `betalningarPa()`-anrop tillsammans. Se den filen för vad rivningen
     * omfattar.
     */
    VITE_FEATURE_BETALNINGAR: z.enum(['pa', 'av']).optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});

// ADR-061 Pelare 2 (keystone): mode-medveten koherens-grind. Körs EFTER createEnv
// validerat VITE_SUPABASE_URL (samma uppstarts-villkor — ingen separat test-slotting
// behövs eftersom ingen vitest-/Playwright-test importerar denna modul). Kastar om
// en icke-prod-mode pekar på prod-ref (stänger T28 strukturellt).
assertModeCoherent(import.meta.env.MODE, env.VITE_SUPABASE_URL);
