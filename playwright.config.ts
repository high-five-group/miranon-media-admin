import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import {
  VISUAL_SUPABASE_ANON_KEY,
  VISUAL_SUPABASE_URL,
} from './tests/support/fixturvarld/fixture-data';
import { PLAYWRIGHT_DEFAULT_REPORTER } from './tests/support/fixturvarld/overskuggnings-rapport';

// Ladda .env.test för LOKALA körningar (task-10 AC 3, officiella Playwright-
// mönstret playwright.dev/docs/test-parameterize). Tre verifierade egenskaper
// (körningsbevisade 2026-07-12) gör detta CI-säkert:
//   1. Saknad fil felar MJUKT (result.error = ENOENT, inget throw) — i CI
//      finns ingen .env.test och config-laddningen fortsätter oförändrad.
//   2. dotenv skriver ALDRIG över befintliga process.env-nycklar — CI:s
//      workflow-env (secrets) vinner alltid över filen.
//   3. Lokalt ersätter detta det gamla source-prefixet
//      (`set -a; source .env.test; set +a;`) — playwright-anrop fungerar
//      direkt. quiet: true håller testutdata ren (v17 loggar annars en
//      injektions-rad per körning).
// path förankras vid config-filen (import.meta.dirname, Node >= 20.11 —
// .nvmrc-golvet uppfyller det) så cwd-varianter inte tyst missar filen.
dotenv.config({ path: path.resolve(import.meta.dirname, '.env.test'), quiet: true });

// A11y-runnern kör mot en ALLTID-FÄRSK dev-server på dedikerad port
// (Session 15 K2-fynd: främmande server på 5173 återanvändes tyst av
// reuseExistingServer, och stale server-state gav falsk-grön).
// --strictPort failar högt vid upptagen port i stället för tyst port-byte;
// reuseExistingServer: false vägrar återanvända. Aktiveras via
// test:a11y-scriptets env-flagga så övriga projekts webServer-beteende
// är orört.
const A11Y_DEV_PORT = 5199;
const isA11yRun = process.env.PLAYWRIGHT_A11Y_DEV_SERVER === '1';

// Visual-runnern (task-36.7) kör mot en ALLTID-FÄRSK dev-server på dedikerad
// port i a11y-mönstret — men med FIXTUR-ENV injicerad: servern binder mot den
// fiktiva visual-fixture-URL:en (tests/support/fixturvarld/fixture-data.ts), aldrig
// staging (AC 4: noll staging-beroende — testerna mockar allt nätverk).
// Dedikerad port behövs även lokalt: 5173 bär ofta en vanlig dev-server med
// verklig env, och stale-server-vakten ska vägra den — inte tvinga fram att
// den stängs (E2E-portlåset till 5173 är CORS-bundet; visual har ingen
// CORS-yta alls, så fri port är riskfri).
const VISUAL_DEV_PORT = 5299;
const isVisualRun = process.env.PLAYWRIGHT_VISUAL_DEV_SERVER === '1';

// Acceptance-runnern (task-59.3, ADR-080): samma fixtur-env som visual — appen
// binder mot den fiktiva visual-fixture-URL:en, aldrig staging — men på EGEN
// port. Skälet är inte kosmetiskt: klasserna ska kunna köras SAMTIDIGT lokalt
// utan att stale-server-vakten (reuseExistingServer: false + --strictPort) fäller
// den ena, och delad port hade gjort det omöjligt.
//
// NAMN-RESIDU, MEDVETET LÄMNAD: konstanternas VÄRDEN bär fortfarande
// `visual-fixture` (URL:en, och därmed supabase-js-härledda lagringsnyckeln
// `sb-visual-fixture-auth-token`). Att döpa om dem vore en BETEENDEändring
// förklädd till namnstädning — nyckeln härleds ur värdnamnet, inte ur en
// konstant vi äger. Det läser skevt när acceptance-klassen hänger på dem; det
// är priset för att flytten är ren.
const ACCEPTANCE_DEV_PORT = 5399;
const isAcceptanceRun = process.env.PLAYWRIGHT_ACCEPTANCE_DEV_SERVER === '1';

// Självtestläget (task-60, T104): normalläget töms och testens egna
// network.use() görs verkningslösa, så att varje test MÅSTE fällas av
// hermetik-vakten. Flaggan läses här enbart för att stänga av
// failure-artefakter — regimen själv bor i tests/support/fixturvarld/hermetic.ts.
const isHermetikSjalvtest = process.env.HERMETIK_SJALVTEST === '1';

// E2E-dev-servern är PORTLÅST till 5173: staging-CORS_ALLOWED_ORIGINS tillåter
// exakt origin http://localhost:5173 (jfr tests/api/cors.staging.test.ts) — en
// dedikerad e2e-port à la a11y-mönstret hade CORS-blockerat appens staging-anrop
// (samma vägg som TASK-10:s preview-port 4173). Stale-server-skyddet (task-5;
// S61 batch 2: en 5 dagar gammal Vite-process med död fil-watcher serverade
// GAMMAL komponentkod → falsk-rött/falsk-grönt) bärs därför av
// reuseExistingServer: false + --strictPort på SAMMA port: ledig port → alltid
// färsk server (modulgraf ≡ disk vid start), upptagen port → hård vägran
// ("...is already used"), aldrig tyst återanvändning.
const E2E_DEV_PORT = 5173;

// Playwrights webServer är GLOBAL per config-fil — den startas/valideras för
// VARJE körning oavsett projekt-urval. API-projekten (api-pure/api-setup/
// api-staging) är serverfria: pure är rena enhetstester, setup+staging går via
// HTTP direkt mot Supabase (inga page.goto). test:api*-scripten sätter därför
// PLAYWRIGHT_NO_WEB_SERVER=1 (samma env-flagge-idiom som test:a11y) så
// webServer-blocket stängs av helt — utan flaggan hade task-5:s hårda vägran
// blockerat serverfria API-körningar varje gång 5173 bär en dev-server (och
// före task-5 slösade de en tyst reuse/serverstart).
const isServerFreeRun = process.env.PLAYWRIGHT_NO_WEB_SERVER === '1';

// Staging-preview-verifieringen (task-10): kör mot ett BYGGT staging-bygge
// servat av `vite preview` på EGEN port/origin 4173 — aldrig dev-originet 5173
// (fälla 5-klassen: en byggd app servad på dev-originet registrerar sin SW där
// och servar gammal bundle cache-first för evigt; origin-separationen är
// skyddet). 4173 är CORS-tillåten i staging-EF:ernas allowlist sedan
// S66-enabling-steget. Samma env-flagge-idiom som a11y/serverfritt ovan; utan
// flaggan existerar varken projektet eller webServer-grenen → plain-körningar
// (redan icke-stödda, TASK-6) och CI är opåverkade. Kanonisk kedja:
// `npm run test:preview:staging` (build:staging → bundelgrind → denna svit);
// runbook: docs/reference/staging-verifiering-runbook.md.
const PREVIEW_PORT = 4173;
const isPreviewRun = process.env.PLAYWRIGHT_STAGING_PREVIEW === '1';

/**
 * Playwright — visuella regressionstester + API-säkerhetstester + e2e auth-flow.
 *
 * Tio projekt:
 *   - setup       → tests/e2e/*.setup.ts (auth-fixture, kör en gång per testrun)
 *   - api-pure    → tests/api/*.test.ts (pure-logik, ingen staging-koppling)
 *   - api-setup   → tests/api/*.setup.ts (T24-b: loggar in user+admin en gång; api-staging beror på det)
 *   - api-staging → tests/api/*.staging.test.ts (HTTP mot deployad Supabase)
 *   - kontraktsvakt → tests/kontraktsvakt/ (nattlig fixtur-mot-staging, ADR-080 beslut 3;
 *                   kör ENDAST via nightly.yml — aldrig i ci-suite.yml, se projektet)
 *   - chromium-authenticated → tests/e2e/*.staging.test.ts (e2e via storageState från setup)
 *   - acceptance  → tests/acceptance/ (hermetiskt mot fixturvärlden, MUTEXFRITT
 *                   och secret-fritt; ADR-080 — se projektet nedan)
 *   - a11y        → tests/a11y/ (axe-core mot /dev/primitives + /dev/patterns;
 *                   alltid-färsk dev-server på dedikerad port via test:a11y-
 *                   scriptets env-flagga — PLAYWRIGHT_TEST_BASE_URL lämnas osatt
 *                   även i CI per ADR-045 beslut 1, routerna är DEV-guardade ADR-044)
 *   - visual-*    → tests/visual/ (skärmdumpar, Fas 3+)
 *
 * KÖRFORM (TASK-6): plain `npx playwright test` (alla projekt i EN körning)
 * är ICKE-STÖDD. api-staging och chromium-authenticated saknar inbördes
 * dependency → de kör samtidigt, och e2e-flödena skriver mot samma
 * staging-poster som api-testernas idempotens-/409-/ordnings-assertions
 * läser → 6 deterministiska kollisioner (create-registration 89/129/160,
 * get-registrations väg D 86/132, update-record 92). Felklassa dem inte
 * som regressioner — kör de kanoniska sekventiella kommandona
 * (CONTRIBUTING.md § Testkörning). Projekt-dependencies som fix
 * förkastades: --project drar in dependencies transitivt → CI:s e2e-steg
 * hade svällt 148→259 tester och fallit på saknade admin-secrets
 * (beviskedjan i TASK-6-kortets notes; jfr ADR-073 beslut 3+4 som löser
 * kollisionsklassen utanför config-filen).
 *
 * api-staging-projektet kräver TEST_SUPABASE_URL satt. Saknas den →
 * testerna skippas i runtime (se tests/api/helpers.ts). api-pure körs
 * alltid utan staging-koppling.
 *
 * chromium-authenticated dependencies: ['setup'] — setup loggar in TEST_USER
 * och sparar storageState till playwright/.auth/user.json. Övriga e2e-tester
 * återanvänder via storageState-config. K4.2-disciplin per Kandidat 34
 * (aldrig-läcka): credentials läses från process.env, INTE hårdkodade.
 *
 * E2E-projektet använder PLAYWRIGHT_TEST_BASE_URL (CI/staging) eller default
 * localhost:5173 (dev; portlåst av staging-CORS — se E2E_DEV_PORT).
 * webServer-config startar en ALLTID-FÄRSK `npm run dev` lokalt vid behov;
 * upptagen port ⇒ hård vägran, aldrig tyst återanvändning (task-5).
 */
export default defineConfig({
  testDir: './tests',
  // ADR-061 Pelare 3 (T29): purga klartext-lösenord ur error-context.md efter
  // hela runnet (Playwrights page-snapshot listar input-värden, även för
  // type=password). Ren artefakt-efterbearbetning — rör ej testbeteende/a11y.
  globalTeardown: './tests/global-teardown.ts',
  // S91 steg 1: nollställer hermetik-rapportens JSONL före körningen så mätningar
  // inte ackumulerar över varandra. No-op utan PLAYWRIGHT_HERMETIK_RAPPORT=1.
  globalSetup: './tests/global-setup.ts',
  // task-62: den TRÖGA överskuggnings-vakten. Den aggregerar per
  // deklarationsställe och FIL, vilket bara reportern kan göra — den ser
  // samtliga tester i en fil även när en retry splittrar dem över workers, och
  // den kan fälla körningen via onEnd. Motivering i sin helhet:
  // tests/support/fixturvarld/overskuggnings-rapport.ts § Varför en reporter.
  //
  // Default-reportern måste räknas upp explicit: sätts `reporter` alls faller
  // Playwrights egen default bort (`common/index.js` rad 584 + 753), och
  // CI hade tappat sitt dot-format. Konstanten speglar den raden.
  reporter: [
    [PLAYWRIGHT_DEFAULT_REPORTER],
    ['./tests/support/fixturvarld/overskuggnings-rapport.ts'],
  ],
  // task-36.7: {projectName} skiljer vyport-projekten åt (samma spec-fil, två
  // skott — utan den kolliderar filnamnen) och {platform} bär AC 3: endast
  // -linux checkas in (baselines föds i CI), -darwin/-win32 är gitignorerade
  // personliga jämförelse-baselines. Fas 0-mallen saknade båda — den skrevs
  // före CI-födda-baselines-principen och antog global testDir.
  snapshotPathTemplate:
    '{testDir}/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}',
  // T26: 0 lokalt (se flakes direkt) / 2 i CI.
  //
  // SKÄLET ÄR RÄTTAT (TASK-74). Raden bar tidigare motiveringen "absorbera
  // infra-brus utan att maskera äkta fel". Andra ledet är FALSIFIERAT: retries
  // maskerade ett äkta testkods-race. TASK-64 mätte 14 av 22 acceptance-jobb
  // med läsbar logg som rapporterade flaky > 0 utan att jobbet blev rött, och
  // en oberoende omräkning i TASK-74 över de 70 senaste CI-körningarna delar
  // talet vid klass A:s fix: 6/14 acceptance-jobb FÖRE, 1/14 EFTER.
  //
  // De behålls ändå, men som ett medvetet val med känd kostnad: en röd CI på
  // infra-brus förstör signalen på samma sätt som en dold flake, och flaken är
  // inte längre osedd — flaky-raden går att läsa per körning (formen i
  // TASK-64:s kort). 0 lokalt står kvar oförändrat: lokalt SKA en flake synas
  // direkt, och det är därför TASK-74:s mätserier kördes med --retries=0.
  retries: process.env.CI ? 2 : 0,
  expect: {
    toHaveScreenshot: {
      // TASK-49 (S89): ratio ENSAM gjorde stora vyer systematiskt okänsliga.
      // Playwright räknar om ratio till ett absolut tak internt
      // (playwright-core 1.61.1: maxDiffPixels2 = bredd * höjd * ratio), och
      // våra bilder är fullPage — så taket följer sidans höjd. Uppmätt: en
      // app-bred textfärgsändring gav 11 357–61 335 avvikande px, men
      // eventsidans desktop-bild (2880x7006) tillät 201 772. Fyra mobila vyer
      // fångade regressionen, noll desktop.
      //
      // Sätts BÅDA vinner den striktaste (Math.min i samma källa) — därför
      // behövs ingen per-projekt-uträkning: det absoluta taket biter på stora
      // bilder, ratio-taket biter om en vy blir liten nog att 2000 vore slappt.
      //
      // 2000 är MÄTT, inte gissat: brusgolvet mot färsk baseline är 0 px över
      // tre körningar (fixturvärlden är frusen — klocka, font, nätverk), och
      // minsta uppmätta ÄKTA regression var 11 357 px. Talet ligger 5,7x under
      // den och rejält över noll-golvet.
      //
      // ÄRLIG AVGRÄNSNING: brusgolvet är mätt på darwin. Linux-brus i CI är
      // OMÄTT — visual-sviten körs inte i CI förrän T87 aktiverar grinden.
      // Marginalen ovan är tilltagen för det; första CI-körningen är facit.
      maxDiffPixelRatio: 0.01,
      maxDiffPixels: 2000,
      threshold: 0.2,
      animations: 'disabled',
      // scale 'device' + deviceScaleFactor 2 i visual-projekten (task-36.7,
      // Marcus-beslut S81): Retina-skarpa baselines — granskningen av
      // baseline-PR:er är ett återkommande människomoment och default-1x
      // upplevs oskarp på 2x-skärm.
      //
      // Ratio-trösklarna är skala-neutrala för just deviceScaleFactor (2x
      // ändrar täljare och nämnare proportionellt). Den ursprungliga
      // formuleringen stannade där och lästes som "ratio är ytneutralt" —
      // det är den INTE mellan bilder av olika storlek, vilket TASK-49
      // avtäckte. Därav det absoluta taket ovan.
      scale: 'device',
    },
  },
  use: {
    locale: 'sv-SE',
    timezoneId: 'Europe/Stockholm',
  },
  // webServer startar ALLTID-FÄRSK `npm run dev` lokalt om PLAYWRIGHT_TEST_BASE_URL
  // inte är satt (task-5): reuseExistingServer: false → en upptagen 5173 ger hård
  // vägran i stället för tyst återanvändning av potentiellt stale modulgraf —
  // stäng egen dev-server före lokal e2e-körning (dev-ergonomi-trade-offen,
  // öppet bokförd i task-5-kortets notes). Med PLAYWRIGHT_TEST_BASE_URL satt
  // hoppas webServer över.
  webServer:
    process.env.PLAYWRIGHT_TEST_BASE_URL || isServerFreeRun
      ? undefined
      : isPreviewRun
        ? {
            // Servar befintlig dist/ statiskt — bygget + bundelgrinden körs
            // FÖRE i test:preview:staging-kedjan (aldrig stale/fel-mode-
            // bundle, L272-klassen). --strictPort i scriptet: upptagen 4173
            // ⇒ hård vägran, aldrig tyst port-byte.
            command: 'npm run preview:staging',
            url: `http://localhost:${PREVIEW_PORT}`,
            reuseExistingServer: false,
            timeout: 60_000,
          }
        : isVisualRun || isAcceptanceRun
          ? {
              command: `npm run dev -- --port ${isVisualRun ? VISUAL_DEV_PORT : ACCEPTANCE_DEV_PORT} --strictPort`,
              url: `http://localhost:${isVisualRun ? VISUAL_DEV_PORT : ACCEPTANCE_DEV_PORT}`,
              reuseExistingServer: false,
              timeout: 60_000,
              // Fixtur-env:en vinner över .env-filer (Vites process-env-
              // företräde) — appen binder mot den fiktiva URL:en. DELAD mellan
              // visual och acceptance: båda klasserna hänger på SAMMA
              // fixturvärld (ADR-080), så en egen env-uppsättning här hade varit
              // första steget mot två världar som kan drifta isär.
              env: {
                VITE_SUPABASE_URL: VISUAL_SUPABASE_URL,
                VITE_SUPABASE_ANON_KEY: VISUAL_SUPABASE_ANON_KEY,
                // Devtools-knapparna (dev-läge) hör inte hemma i baselines
                // och deras versioner får aldrig driva pixlar (__root.tsx).
                VITE_DEVTOOLS: '0',
              },
            }
          : isA11yRun
            ? {
                command: `npm run dev -- --port ${A11Y_DEV_PORT} --strictPort`,
                url: `http://localhost:${A11Y_DEV_PORT}`,
                reuseExistingServer: false,
                timeout: 60_000,
              }
            : {
                command: `npm run dev -- --port ${E2E_DEV_PORT} --strictPort`,
                url: `http://localhost:${E2E_DEV_PORT}`,
                reuseExistingServer: false,
                timeout: 60_000,
              },
  projects: [
    {
      name: 'setup',
      testDir: './tests/e2e',
      testMatch: /.*\.setup\.ts$/,
      use: {
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${E2E_DEV_PORT}`,
      },
    },
    {
      name: 'api-pure',
      testDir: './tests/api',
      // Ignorera även setup-filen — api-pure är creds-fria enhetstester (T24-b).
      testIgnore: ['**/*.staging.test.ts', '**/*.setup.ts'],
    },
    {
      // T24-b: loggar in user + admin EN gång och persisterar tokens; api-staging
      // beror på detta projekt → svit-testerna återanvänder tokens (44 logins → 2),
      // eliminerar GoTrue-429-burst. Idiomatisk Playwright setup-projekt + dependency.
      name: 'api-setup',
      testDir: './tests/api',
      testMatch: /.*\.setup\.ts$/,
    },
    {
      name: 'api-staging',
      testDir: './tests/api',
      testMatch: '**/*.staging.test.ts',
      dependencies: ['api-setup'],
      use: {
        baseURL: process.env.TEST_SUPABASE_URL,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
        },
      },
    },
    {
      // Kontraktsvakten (task-59.2, ADR-080 beslut 3): jämför fixturvärldens
      // svar mot skarp staging. EGET projekt — aldrig i api-staging — därför
      // att api-staging kör i ci-suite.yml, som är delad mellan presubmit och
      // natten: ett steg där hade gjort vakten BLOCKERANDE. Här körs den bara
      // av nightly.yml:s egna jobb (`npm run vakt:kontrakt`).
      // Samma api-setup-dependency som api-staging → EN inloggning per körning,
      // ingen egen auth-väg (T24-b).
      name: 'kontraktsvakt',
      testDir: './tests/kontraktsvakt',
      testMatch: '**/*.staging.test.ts',
      dependencies: ['api-setup'],
      use: {
        baseURL: process.env.TEST_SUPABASE_URL,
      },
    },
    {
      name: 'chromium-authenticated',
      testDir: './tests/e2e',
      testMatch: '**/*.staging.test.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${E2E_DEV_PORT}`,
        storageState: 'playwright/.auth/user.json',
        // Kandidat 34 aldrig-läcka: maskera password-inputs i screenshots/videos/traces.
        // Playwright maskerar input[type=password] som standard → även debug-
        // artefakter (trace, screenshot, video) är credentials-fria.
        // T26: trace on-first-retry fångar trace exakt när en retry triggas →
        // diagnostik för Landning B (flaky-repro) utan att spara på varje run.
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
    {
      // ACCEPTANCE-KLASSEN (task-59.3, ADR-080 beslut 1). Egen katalog, eget
      // projekt, eget MUTEXFRITT CI-jobb — klassbytet är beslutet, hastigheten
      // är följden. Vad den bevisar: att APPEN renderar och beter sig rätt givet
      // ett svar av rätt form. Vad den INTE bevisar: att staging och Airtable
      // producerar svar av den formen (det är api-staging, bakom mutexen).
      //
      // Kör hermetiskt mot fixturvärlden — noll staging-beroende, noll secrets,
      // ingen `concurrency`-grupp någonstans i kedjan. Ett anrop som ingen
      // handler täcker FÄLLER testet med adressen namngiven (hermetik-vakten i
      // AVBRYTANDE läge, ADR-080 beslut 4).
      //
      // devices['Desktop Chrome'] ⇒ viewport 1280×720, och det är ett KRAV inte
      // en smak: Hem-testet mäter 600px-kolumnens skärm-centrering mot exakt
      // 1280 (`(1280 - 600) / 2`). Byts device-profilen faller den mätningen.
      name: 'acceptance',
      testDir: './tests/acceptance',
      // TIDSBUDGETARNA ÄR HÄRLEDDA, INTE VALDA (TASK-74, klass B).
      //
      // Fram till TASK-74 körde klassen på Playwrights stock-budgetar — 30 s per
      // test, 5 s per expect. Ingen hade valt dem för DEN HÄR sviten, och
      // mätningen visade att 5 s ligger under svitens egen arbetskostnad.
      //
      // MEKANISMEN, MÄTT: `page.goto()` returnerar när load-eventet gått, men
      // route-chunken hämtas av app-JS EFTER det (autoCodeSplitting, vite.config).
      // Den FÖRSTA web-first-assertionen efter en goto bär därför hela
      // kall-laddningen — Vites transform av chunken, EF-hämtningen och första
      // renderingen — inom EN expect-budget. 95 av sviten 156 goto-anrop har den
      // formen. Kall-kostnaden är mätt, ej antagen: över 180 fil-körningar var
      // filens FÖRST startade test långsammare än filens egen median i 144 fall
      // (80 %), med medianskillnad +1,6 s och största +6,9 s.
      //
      // FÄLLNINGARNA SÅG UT SÅ HÄR (baslinje 10 fulla körningar, --workers=8
      // --retries=0, 1530 testresultat):
      //   mer-maillogg:77        toBeVisible  · Timeout: 5000ms · element(s) not found
      //   mer-segment-send:113   toBeFocused  · Timeout: 5000ms · element(s) not found
      // Båda är FÖRSTA testet i sin fil, och båda säger "element(s) not found" —
      // elementet fanns aldrig, det var inte fokus som missades. Assertionerna
      // retryar alltså korrekt; de får inte tid. Det är INTE klass A:s fel (en
      // ögonblicksbild-query följd av en icke-retryande assertion, TASK-64) och
      // kan inte lagas med samma grepp.
      //
      // VARFÖR DETTA INTE ÄR MASKERING. En retry kastar en signal som redan
      // inträffat. En timeout DEFINIERAR vad "för långsamt" betyder — är
      // definitionen under den legitima variationen tillverkar den falska
      // signaler. 15 s fäller fortfarande en app som blivit verkligt långsam;
      // 5 s fällde en app som var normal på en belastad maskin.
      //
      // TALEN:
      //   expect 15_000 — 3x stock. De två fällda testerna går END-TO-END på
      //     högst 14,6 s i gröna körningar, vilket är en LÖS övre gräns för
      //     enbart deras första assertion; den sanna latensen ligger klart under.
      //     15 s lämnar dessutom de två explicita 20 s-överskuggningarna
      //     (event-anteckningar:345, persons-list:219) meningsfulla — de täcker
      //     retry-backoff-kedjan, ett längre och annat fenomen.
      //   timeout 60_000 — 2,8x det tyngsta GRÖNA testet i serien (21,2 s,
      //     anmalan-detalj:535, en axe-körning). Måste rymma expect-budgeten
      //     ovan plus resten av testet. Axe-testernas marginal mot stock-30 s var
      //     29 % i värsta gröna observationen; ingen test-timeout observerades i
      //     de 10 körningarna, så den delen är förebyggande och sägs rakt ut.
      timeout: 60_000,
      // OBS — PROJEKT-`expect` ERSÄTTER, DEN MERGAR INTE. Läst i källan, ej
      // antaget: `playwright/lib/common/index.js:663` gör
      // `this.expect = takeFirst(projectConfig.expect, config.expect, {})`, så
      // blocket här SKUGGAR hela top-nivåns `expect` för detta projekt —
      // inklusive TASK-49:s `toHaveScreenshot`-trösklar. Ofarligt i dag: ingen
      // fil under tests/acceptance/ använder toHaveScreenshot eller
      // toMatchSnapshot (grep 2026-07-29). Skriver du en skärmdumps-assertion i
      // klassen får den Playwrights defaultvärden — lägg då till toHaveScreenshot
      // här också.
      expect: { timeout: 15_000 },
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${ACCEPTANCE_DEV_PORT}`,
        // T26-formen från chromium-authenticated: trace vid retry, artefakter
        // endast vid rött.
        //
        // UTOM I SJÄLVTESTLÄGET (task-60), där rött är det FÖRVÄNTADE utfallet
        // för varje test. Artefakter "endast vid rött" betyder då artefakter för
        // ALLTING: 51 videor och 51 skärmdumpar av fällningar vi bad om. De
        // dokumenterar inget fel och kostar både tid och diskutrymme i en körning
        // vars enda utdata är antalet fällda och deras orsak.
        trace: isHermetikSjalvtest ? 'off' : 'on-first-retry',
        screenshot: isHermetikSjalvtest ? 'off' : 'only-on-failure',
        video: isHermetikSjalvtest ? 'off' : 'retain-on-failure',
      },
    },
    {
      name: 'a11y',
      testDir: './tests/a11y',
      use: {
        ...devices['Desktop Chrome'],
        baseURL:
          process.env.PLAYWRIGHT_TEST_BASE_URL ||
          (isA11yRun ? `http://localhost:${A11Y_DEV_PORT}` : `http://localhost:${E2E_DEV_PORT}`),
      },
    },
    // Visual-projekten (task-36.7): kanoniskt anrop `npm run test:visual`
    // (env-flaggan startar fixtur-servern på dedikerad port — se webServer).
    // Hermetiken bor i tests/support/fixturvarld/hermetic.ts (KLASSDELAD hemvist
    // sedan task-59.1 — inte visual-ägd); baselines föds i CI.
    {
      name: 'visual-desktop',
      testDir: './tests/visual',
      use: {
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
        colorScheme: 'light',
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${VISUAL_DEV_PORT}`,
      },
    },
    {
      name: 'visual-mobile',
      testDir: './tests/visual',
      use: {
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        colorScheme: 'light',
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${VISUAL_DEV_PORT}`,
      },
    },
    // Villkorat (task-10): existerar ENDAST under PLAYWRIGHT_STAGING_PREVIEW=1
    // så att plain `npx playwright test` och CI aldrig drar igång preview-
    // flödet — kanoniska anropet är `npm run test:preview:staging`. Ingen
    // storageState: login-flödet i färsk kontext ÄR en del av beviset.
    ...(isPreviewRun
      ? [
          {
            name: 'staging-preview',
            testDir: './tests/preview',
            use: {
              ...devices['Desktop Chrome'],
              baseURL: `http://localhost:${PREVIEW_PORT}`,
            },
          },
        ]
      : []),
  ],
});
