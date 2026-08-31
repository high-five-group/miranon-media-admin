import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { devPort } from './tests/support/dev-portar';
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
//
// PORTEN ÄR WORKTREE-DERIVERAD SEDAN TASK-251 (gäller alla fyra fixturbundna
// klasserna nedan): basporten här är huvudkatalogens, och varje linked worktree
// får sitt eget block så parallella bygg-agenter på samma maskin inte delar
// resurs. Hela motiveringen — inklusive varför port 0 inte är farbar med
// Playwrights webServer, och vad som medvetet INTE deriveras — står i
// tests/support/dev-portar.ts. Basportarna själva bor där, inte här: två
// hemvister för samma tal är exakt den drift som gör en literal osann.
const A11Y_DEV_PORT = devPort('a11y');
const isA11yRun = process.env.PLAYWRIGHT_A11Y_DEV_SERVER === '1';

// Visual-runnern (task-36.7) kör mot en ALLTID-FÄRSK dev-server på dedikerad
// port i a11y-mönstret — men med FIXTUR-ENV injicerad: servern binder mot den
// fiktiva visual-fixture-URL:en (tests/support/fixturvarld/fixture-data.ts), aldrig
// staging (AC 4: noll staging-beroende — testerna mockar allt nätverk).
// Dedikerad port behövs även lokalt: 5173 bär ofta en vanlig dev-server med
// verklig env, och stale-server-vakten ska vägra den — inte tvinga fram att
// den stängs (E2E-portlåset till 5173 är CORS-bundet; visual har ingen
// CORS-yta alls, så fri port är riskfri).
const VISUAL_DEV_PORT = devPort('visual');
const isVisualRun = process.env.PLAYWRIGHT_VISUAL_DEV_SERVER === '1';

// Manifest-skärmbilds-runden (TASK-126.4, npm run generate:manifest-screenshots)
// återanvänder VISUAL-fixturvärlden rakt av — SAMMA port, SAMMA hermetiska env
// (mockat nätverk, seedad session, frusen klocka, pinnade typsnitt). Egen
// runtime-flagga ändå: `manifest-screenshots`-projektet (se villkorat block i
// `projects` nedan) ska INTE instansieras under en vanlig `npm run test:visual`
// eller CI-körning — det skriver PNG-filer till public/screenshots/ som
// sidoeffekt, vilket ingen annan Playwright-körning ska göra.
const isManifestScreenshotsRun = process.env.PLAYWRIGHT_MANIFEST_SCREENSHOTS === '1';

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
const ACCEPTANCE_DEV_PORT = devPort('acceptance');
const isAcceptanceRun = process.env.PLAYWRIGHT_ACCEPTANCE_DEV_SERVER === '1';

// Webbläsarbeteende-klassen (TASK-131, ADR-094): fixturfria Playwright-tester
// som prövar WEBBLÄSARBETEENDE utan datadimension — plattformsdetektering,
// events, DOM/tangentbord — aldrig ett nätverkssvar. Samma alltid-färsk-
// dev-server-på-dedikerad-port-mönster som a11y/visual/acceptance (Session 15
// K2: en återanvänd server på en delad port ger tyst stale-state), men EGEN
// port: klassen ska kunna köras SAMTIDIGT som acceptance/a11y/visual lokalt
// utan att stale-server-vakten (reuseExistingServer: false + --strictPort)
// fäller den ena.
//
// FIXTUR-ENV, INGEN MSW. Appen binder mot samma fiktiva `visual-fixture`-URL
// som acceptance/visual (src/env.ts validerar bara `z.string().url()` — den
// GÖR aldrig ett nätverksanrop dit: `AuthProvider.getSession()` läser enbart
// local storage vid mount, se auth/AuthProvider.tsx). Klassens tester gör per
// definition noll nätverksanrop, så MSW/hermetic.ts (acceptance-klassens
// maskineri, ADR-080) vore ren over-engineering här — ingen fixturvärld att
// hänga på, och ingen hermetik-vakt att bevisa mot (jfr `hermetik-sjalvtest.mjs`,
// PROJEKT = 'acceptance' — orört, ser inte denna klass).
//
// FONT-CDN:N PINNAS INTE, MEDVETET, SAMMA VAL SOM a11y (tests/a11y/fixtures.ts
// saknar all route-interception). a11y har kört så sedan Fas 3.5 utan att det
// kostat CI-tillförlitlighet; att bygga font-pinning här hade varit en andra,
// oberoende hemvist för samma egenskap a11y redan bevisat vara onödig.
const WEBBLASARBETEENDE_DEV_PORT = devPort('webblasarbeteende');
const isWebblasarbeteendeRun = process.env.PLAYWRIGHT_WEBBLASARBETEENDE_DEV_SERVER === '1';

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
 * Elva projekt:
 *   - setup       → tests/e2e/*.setup.ts (auth-fixture, kör en gång per testrun)
 *   - api-pure    → tests/api/*.test.ts (pure-logik, ingen staging-koppling)
 *   - api-setup   → tests/api/*.setup.ts (T24-b: loggar in user+admin en gång; api-staging beror på det)
 *   - api-staging → tests/api/*.staging.test.ts (HTTP mot deployad Supabase)
 *   - kontraktsvakt → tests/kontraktsvakt/ (nattlig fixtur-mot-staging, ADR-080 beslut 3;
 *                   kör ENDAST via nightly.yml — aldrig i ci-suite.yml, se projektet)
 *   - chromium-authenticated → tests/e2e/*.staging.test.ts (e2e via storageState från setup)
 *   - acceptance  → tests/acceptance/ (hermetiskt mot fixturvärlden, MUTEXFRITT
 *                   och secret-fritt; ADR-080 — se projektet nedan)
 *   - webblasarbeteende → tests/webblasarbeteende/ (fixturfritt webbläsarbeteende
 *                   UTAN datadimension — plattformsdetektering, DOM/tangentbord,
 *                   events; MUTEXFRITT och secret-fritt; TASK-131/ADR-094 — se
 *                   projektet nedan. Skiljer sig från acceptance genom att INTE
 *                   hänga på fixturvärlden/MSW: klassens tester rör sig aldrig
 *                   över nätverket alls, så det finns ingen fixtur att bevisa
 *                   beroendet av)
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
    // [TASK-162.1] Promoverings-grinden (ADR-103 B4) — ariaSnapshot-referenser
    // ur variant-läget, checkade in som grindens facit. EGET pathTemplate,
    // INTE toHaveScreenshot:s `snapshotPathTemplate` ovan: den literalen bär
    // `__screenshots__` + `{platform}` — fel katalognamn för en `.aria.yml`
    // (den är ingen bild), och `{platform}` är fel FÖR DEN HÄR ARTEFAKTEN:
    // toHaveScreenshot:s platform-segmentering finns för att bara CI-födda
    // -linux-baselines checkas in (pixelrendering skiljer sig mellan OS,
    // AC 3 ovan) — ariaSnapshot bär ingen pixel, bara DOM/ARIA-strukturen
    // Playwrights EGEN Chromium beräknar identiskt oavsett värd-OS, så en
    // lokalt genererad (darwin) referens ÄR den kanoniska filen, inte en
    // personlig jämförelse-baseline. `{projectName}` behålls (visual-desktop/
    // visual-mobile), eftersom facitkartans metod mätte BÅDA vyporterna och
    // en responsiv gren skulle kunna divergera dem — omätt tills en sådan
    // gren faktiskt finns, så segmenteringen kostar inget att behålla.
    toMatchAriaSnapshot: {
      pathTemplate: '{testDir}/__aria__/{testFileName}/{arg}-{projectName}{ext}',
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
        : isVisualRun || isAcceptanceRun || isWebblasarbeteendeRun || isManifestScreenshotsRun
          ? {
              // EN beräkning av porten, inte en ternary duplicerad i command
              // OCH url — annars kan de två glida isär (en skriven om utan
              // den andra) och servern startar på fel port jämfört med den
              // Playwright väntar på.
              // manifest-screenshots delar VISUAL_DEV_PORT med visual: båda
              // renderar samma fixturvärld och kör aldrig samtidigt.
              command: `npm run dev -- --port ${
                isVisualRun || isManifestScreenshotsRun
                  ? VISUAL_DEV_PORT
                  : isAcceptanceRun
                    ? ACCEPTANCE_DEV_PORT
                    : WEBBLASARBETEENDE_DEV_PORT
              } --strictPort`,
              url: `http://localhost:${
                isVisualRun || isManifestScreenshotsRun
                  ? VISUAL_DEV_PORT
                  : isAcceptanceRun
                    ? ACCEPTANCE_DEV_PORT
                    : WEBBLASARBETEENDE_DEV_PORT
              }`,
              reuseExistingServer: false,
              timeout: 60_000,
              // Fixtur-env:en vinner över .env-filer (Vites process-env-
              // företräde) — appen binder mot den fiktiva URL:en. DELAD mellan
              // visual, acceptance, webblasarbeteende OCH manifest-screenshots:
              // alla fyra hänger på SAMMA fixturvärld för APP-BOOT (ADR-080 +
              // TASK-126.4), så en egen env-uppsättning här hade varit första
              // steget mot flera världar som kan drifta isär.
              // webblasarbeteende-klassen gör ALDRIG ett nätverksanrop dit (se
              // konstantens kommentar ovan) — den delar bara URL-VÄRDET som
              // platshållare, inte en fixturvärld den faktiskt konsumerar.
              env: {
                VITE_SUPABASE_URL: VISUAL_SUPABASE_URL,
                VITE_SUPABASE_ANON_KEY: VISUAL_SUPABASE_ANON_KEY,
                // Devtools-knapparna (dev-läge) hör inte hemma i baselines
                // och deras versioner får aldrig driva pixlar (__root.tsx).
                VITE_DEVTOOLS: '0',
                // [TASK-346.4] Betalningsflödets miljöflagga AV i fixturvärlden.
                //
                // MÄTT, INTE ANTAGET: utan denna rad ärver dev-servern
                // `.env.development`s `pa` (fixtur-env:en vinner över
                // .env-filer, men bara för de nycklar den FAKTISKT sätter),
                // och `JobbLyssnare` — monterad som syskon till AppShell på
                // varje autentiserad sida — öppnar en Realtime-WebSocket mot
                // `VISUAL_SUPABASE_URL`. WebSocket-vakten
                // (`tests/support/fixturvarld/websocket-vakt.ts`) fäller den
                // som `OmockadWebSocketError`, och eftersom lyssnaren sitter i
                // SKALET fälls varenda autentiserad test i klassen: mätt
                // 48 av 48 i `hem.acceptance.test.ts` innan denna rad fanns.
                //
                // `av`, inte "utelämnad": flaggan har tre lägen (se
                // `src/env.ts`), och ett EXPLICIT `av` säger att frånvaron är
                // ett val. Att i stället mocka WS-handlern hade varit fel
                // ordning — den hermetiska världen bär inga betalnings-EF-
                // mockar ännu, så en mockad kanal hade gett en prenumeration
                // utan data att prenumerera på. TASK-346.6/346.7 lägger
                // mockarna när deras ytor faktiskt testas här, och flippar då
                // raden.
                //
                // Att flaggan är PER MILJÖ är dess design (AC #6): på i
                // dev/staging, frånvarande i prod, av i fixturvärlden.
                VITE_FEATURE_BETALNINGAR: 'av',
                // TASK-239 — SAMMA SEAM SOM TASK-236, ANDRA TESTKLASSEN.
                //
                // Varv 2 av task-236 satte `VITE_E2E_WARMUP_TIMEOUT_MS: '50'`
                // på e2e-webServern (grenen längst ned i denna ternary). Den
                // grenen bär BARA setup + chromium-authenticated. Acceptance
                // kör mot DENNA webServer-gren och fick därför aldrig fixen —
                // warmup-gaten (ADR-112/TASK-218.3) har kört oavkortat i
                // fixturvärlden sedan 817979a8 landade 2026-08-15.
                //
                // KOSTNADEN ÄR CI-MÄTT, INTE PROJICERAD (task-239 AC #1,
                // nattkörningarnas steg-tider via `gh api .../actions/jobs`):
                // 08-15 (229 tester, FÖRE gaten) → 08-16 (231 tester, MED
                // gaten) flyttade `Acceptance tests (hermetiska)`-steget
                // 286 → 361 s, alltså +75 s ISOLERAT i det steget, medan
                // självtest-steget MINSKADE 7 s (dess EF-mock-vakt fäller
                // warmup-anropen omedelbart — gaten kostar inget där, och
                // denna rad påverkar det steget därför knappt).
                //
                // VAR KOSTNADEN SITTER, LÄST I KÄLLAN. `starta()`
                // (startvarmningen.ts) resolvar på det FÖRSTA av (a) alla sju
                // WARMUP_ITEMS klara i fyra sekventiella batchar, (b)
                // `timeoutMs`. De flesta acceptance-tester betalar (a) — en
                // handfull MSW-tur-och-retur per sidladdning. Men tester som
                // PARKERAR nätverket för att observera laddläget
                // (hem-laddlage.acceptance.test.ts:s `hallbarMock`, fem
                // tester) parkerar `get-registrations`/`get-events` — BÅDA
                // WARMUP_ITEMS — så batchen resolvar aldrig och gaten väntar
                // ut HELA (b): 9000 ms per test, innan routern ens monteras.
                // Kostnaden är alltså inte jämnt utsmetad; den är koncentrerad
                // till just de tester som avsiktligt håller nätverket.
                //
                // 50, inte 0: `src/env.ts`s zod-schema kräver `.positive()`.
                // Samma tal och samma skäl som e2e-grenen — se dess kommentar
                // och `src/main.tsx`s `beraknaVarmningTimeoutMs()` för hela
                // härledningen. `korAlla()` kör fortfarande de sju verkliga
                // hämtningarna; bara GATENS EGEN VÄNTAN kortas.
                //
                // VILLKORAT PÅ `isAcceptanceRun`, INTE SATT FÖR HELA GRENEN.
                // Grenen delas med visual, webblasarbeteende och
                // manifest-screenshots. Visual/manifest RENDERAR fixturvärlden
                // till pixlar — ändras gatens släpp-tidpunkt där kan en
                // baseline röra sig av en orsak som inte är den ändring som
                // testas. Blast radius hålls därför vid den klass mätningen
                // gäller. Ett acceptance-test som EXPLICIT vill ha
                // produktionens 9000 ms opterar in via
                // `lasVarmningTimeoutOverride()` (startvarmningen.ts,
                // sessionStorage — samma opt-in task-236 varv 2 byggde);
                // ingen fil under tests/acceptance/ behöver den i dag
                // (hem-laddlage asserterar `progressbar` count 0, alltså
                // gatens FRÅNVARO — ett snabbare släpp gör den assertionen
                // mer sann, inte mindre).
                ...(isAcceptanceRun ? { VITE_E2E_WARMUP_TIMEOUT_MS: '50' } : {}),
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
                // TASK-236 VARV 2 (218.3 e2e-svit-tid — se src/main.tsx:s
                // `beraknaVarmningTimeoutMs()`-docblock för hela
                // bakgrunden/motiveringen). Varv 1:s 6000ms räckte INTE —
                // CI:s post-merge-artefakt (run 31943270329) visade minst
                // 11 NYA marginella tester utöver de 17 varv 1 redan
                // fixade, alla med samma "kall gate-väntan"-signatur.
                // Aritmetiken: ~200 tester × ÄVEN en kort kall väntan
                // summerar för mycket i EN 12-minuters CI-svit. Lösningen
                // är strukturell, inte ett bättre tal: e2e-DEFAULTEN sätts
                // nära noll (gaten släpper i praktiken omedelbart för de
                // ~190 tester som inte bryr sig om warmup-UI:t), och de FÅ
                // tester som EXPLICIT testar startvärmningens progression
                // (persist-cache.staging.test.ts) begär produktionens
                // riktiga tak via en query-param på sin egen
                // page.goto()-URL (?e2eVarmningMs=9000) — query-param
                // vinner alltid över denna default (se
                // beraknaVarmningTimeoutMs()). 50ms, inte 0: `src/env.ts`s
                // zod-schema kräver `.positive()` — 0 hade kraschat
                // createEnv() vid appstart. `korAlla()` kör ändå de sju
                // riktiga hämtningarna i bakgrunden oavsett detta tal —
                // bara GATENS EGEN VÄNTAN kortas, ingen ny gate-semantik.
                // Produktionens DEFAULT_TIMEOUT_MS (9000ms, ADR-112 beslut
                // 3) är helt orörd — build:staging/build:production sätter
                // aldrig denna variabel.
                env: {
                  VITE_E2E_WARMUP_TIMEOUT_MS: '50',
                },
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
        // Samma form och samma skäl som acceptance-projektet nedan — motiveringen
        // i sin helhet (TASK-80: mätt egenlast, falsifierad flake-hypotes, varför
        // inte 'on-first-retry') står där. Egenlasten är INTE mätt för DENNA svit:
        // den kör mot skarp staging bakom mutexen, där en fällning oftare är
        // nätverksbunden och därmed svårare att reproducera — vilket gör videon av
        // första fällningen mer värd här, inte mindre.
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
        //
        // VIDEO-FORMEN ÄR PRÖVAD OCH MEDVETET BEHÅLLEN (TASK-80).
        //
        // Egenlasten är REAL och mätt. `retain-on-failure` spelar in VARJE test
        // och kastar filen vid grönt (playwright/lib/index.js:464 — 'retain'
        // styr behållningen, inte inspelningen). Mätt över 5 körningar med
        // --workers=8: ffmpeg närvarande i 95 % av samplingarna, upp till 10
        // samtidiga processer, 415 % summerad CPU som topp (≈4,2 av 16 kärnor),
        // loadavg-median 42,5 mot 22,1 utan inspelning.
        //
        // MEN HYPOTESEN ATT DEN FÖRVÄRRAR FLAKIGHETEN ÄR FALSIFIERAD. Kortet
        // misstänkte att egenlasten driver TASK-74:s mekanism B3 (test-budgeten
        // vid mättnad). Interfolierad A/B via `npm run metrics:flake`, 5 varv,
        // 765 testresultat per arm: körtidsmedian 162 s MED inspelning mot
        // 163 s UTAN — diff −1 s mot ett brusgolv på ±72 s. Fällningar 3 mot 1,
        // och hem:437 föll i BÅDA armarna. Ingen effekt kan hävdas; n räcker
        // inte för att utesluta en liten sådan, men det finns inget stöd för en.
        //
        // DÄRFÖR INTE `on-first-retry`: den spelar in enbart retry 1 och behåller
        // den ALLTID, oavsett utfall (index.js:464 + 470-472). Mätt reproducerar
        // 10 av 13 fällningar INTE vid retry (framkallad mättnad, load 99-175),
        // och 0 av 32 acceptance-jobb i CI har blivit röda. Formen skulle alltså
        // i ~77 % av fallen spara en video av en GRÖN omkörning medan fällningen
        // själv är obevakad — diagnostiken bytt mot en artefakt som inte visar
        // felet. Att sänka `workers` förkastades av samma skäl: det offrar
        // genomströmning för en körtidsvinst mätningen inte hittar.
        //
        // VAD SOM BÄR DIAGNOSTIKEN VID EN FÖRSTA FÄLLNING ÄVEN UTAN VIDEO:
        // error-context.md (hela call-loggen, t.ex. "33 × locator resolved to
        // 0 elements") och skärmdumpen — båda skrivs vid VARJE fällning
        // (index.js:545). Videon är komplementet som visar FÖRLOPP; den behålls
        // för att den är det enda som gör det, inte för att den bär grundfallet.
        trace: isHermetikSjalvtest ? 'off' : 'on-first-retry',
        screenshot: isHermetikSjalvtest ? 'off' : 'only-on-failure',
        video: isHermetikSjalvtest ? 'off' : 'retain-on-failure',
      },
    },
    {
      // WEBBLÄSARBETEENDE-KLASSEN (TASK-131, ADR-094). Eget projekt, egen
      // katalog, eget MUTEXFRITT och secret-fritt CI-jobb — samma
      // klassbytes-motivering som acceptance-projektet ovan (ADR-080 beslut
      // 1), tillämpad på en ANNAN gräns: inte "kräver fixturvärlden" mot
      // "kräver staging", utan "har ett databeteende att bevisa" mot "har
      // inget". Vad klassen bevisar: att en bibliotekskomponent detekterar
      // plattform/tillstånd och beter sig rätt givet webbläsar-API:er och
      // -events (navigator, matchMedia, beforeinstallprompt, tangentbord,
      // ARIA). Vad den INTE bevisar, och aldrig ska försöka bevisa: något om
      // ett nätverkssvar — då hör testet hemma i acceptance (kräver ett svar
      // av rätt FORM) eller a11y (kräver en axe-scan), inte här.
      //
      // INGEN hermetik-vakt här, MEDVETET. `hermetik-sjalvtest.mjs` bevisar
      // att acceptance-klassens tester HÄNGER PÅ fixturvärlden — ett bevis
      // som förutsätter att det finns en fixturvärld att hänga på. Den här
      // klassens definierande egenskap är motsatsen (noll nätverksanrop), så
      // samma bevisform hade varit meningslös: det finns inget att ta bort
      // för att visa att testet fäller. Se hermetik-sjalvtest.mjs — PROJEKT
      // är hårdkodat till 'acceptance' och rör aldrig denna klass.
      name: 'webblasarbeteende',
      testDir: './tests/webblasarbeteende',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${WEBBLASARBETEENDE_DEV_PORT}`,
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
            // TASK-84: staging-preflighten. `staging-preview` var det enda
            // staging-rörande Playwright-projektet utan setup-projekt att haka
            // i, och gick därför förbi TASK-77:s mekanism helt. Formen är
            // TASK-77:s — dependency-projekt, inte npm-prefix — så att även rå
            // `npx playwright test --project=staging-preview` bär den.
            name: 'preview-setup',
            testDir: './tests/preview',
            testMatch: /.*\.setup\.ts$/,
          },
          {
            name: 'staging-preview',
            testDir: './tests/preview',
            // Explicit: setup-filen är preflighten, inte ett test. Playwrights
            // default-testMatch skulle inte ta den ändå, men att luta sig mot
            // en default är att luta sig mot något som kan ändras.
            testIgnore: ['**/*.setup.ts'],
            dependencies: ['preview-setup'],
            use: {
              ...devices['Desktop Chrome'],
              baseURL: `http://localhost:${PREVIEW_PORT}`,
            },
          },
        ]
      : []),
    // Villkorat i SAMMA mönster som staging-preview ovan (task-10): existerar
    // ENDAST under PLAYWRIGHT_MANIFEST_SCREENSHOTS=1, så plain
    // `npx playwright test` och CI:s vanliga projekt-urval aldrig drar igång
    // genereringen — kanoniska anropet är
    // `npm run generate:manifest-screenshots` (TASK-126.4). Inget `viewport`
    // här: varje spec-fil under tests/manifest-screenshots/ sätter sin egen
    // via `test.use({ viewport, deviceScaleFactor })` (narrow vs wide), så
    // formatet bor i den fil som faktiskt genererar bilden — inte gissat på
    // två ställen.
    ...(isManifestScreenshotsRun
      ? [
          {
            name: 'manifest-screenshots',
            testDir: './tests/manifest-screenshots',
            use: {
              colorScheme: 'light' as const,
              baseURL:
                process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${VISUAL_DEV_PORT}`,
            },
          },
        ]
      : []),
  ],
});
