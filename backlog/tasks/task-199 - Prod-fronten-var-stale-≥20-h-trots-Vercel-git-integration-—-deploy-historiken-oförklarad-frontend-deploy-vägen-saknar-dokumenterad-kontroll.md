---
id: TASK-199
title: >-
  Prod-fronten var stale ≥20 h trots Vercel-git-integration — deploy-historiken
  oförklarad, frontend-deploy-vägen saknar dokumenterad kontroll
status: To Do
assignee: []
created_date: '2026-08-11 19:12'
updated_date: '2026-08-28 05:09'
labels:
  - ready-for-human
dependencies: []
priority: high
ordinal: 364000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Belägg (S102-resume 2026-08-11 ~kväll): admin.miranon.dev servade index-CWH3ivIH.js UTAN route-posten event/$eventId/atgarder i route-registret, trots att ingången+routen landade på main redan 2026-08-10 17:59Z (#1133) och main därefter tagit emot ~15 merges. Marcus blockerades i morgonsekvensens steg 3 ('länken leder ingenstans'). Självläkt: när main avancerade till 9800bf6b auto-deployade Vercel (Production, 15 s build) och domänen bytte till index-CvXlcVbm.js MED routen — verifierat via curl + bundle-grep före/efter. Oförklarat: varför inga (fungerande) Production-deploys på ~20 h av mergningar — deploy-lista visade bara Preview 7–10 min + Production 41 s vid mätningen. Åtgärd: gräv Vercel-deploy-historiken, dokumentera frontend-deploy-vägen (T46:s 'frontend-kontrollen'), och överväg CI-grind som diffar deployad bundle-route-register mot HEAD (samma klass som EF-driftens task-37). OBS även PWA-lagret: SW-precache kan hålla gammal bundle hos klienten efter deploy — Lotta-relevant.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S105 utredning 2026-08-13 (docs/research/task-199-frontend-deployvagen-och-sw-precachen-2026-08-13.md).

FRÅGA A — PREMISSEN FALSIFIERAD. Det fanns inga '~20 h av mergningar'. main stod stilla 2026-08-10T21:12:05Z (ca9832d7, #1157) till 2026-08-11T18:11:52Z (dd8ae755, #1162) — EN main-avancering i hela fönstret, den som avslutar det. Gapet i deploys ÄR gapet i merges. Samtliga 25 Production-deploys i fönstret lyckades (87 success / 0 failure); hypotesen om dolda misslyckade Production-deploys är falsifierad. Instrument: GitHub Deployments-API (500 deployments + 308 statuses), inte Vercel-API.

Kortets datering av routen stämmer inte: src/routes/_authenticated/event/$eventId/atgarder.tsx landade på main 2026-08-07 (0ce766ad), tre dygn före #1133 — och var produktionskod sedan TASK-171.5. #1133 bidrog med INGÅNGEN, inte routen. #1133s merge (1b5b7592) fick lyckad Production-deploy 2026-08-10T18:08:58Z.

VERKLIG MEN ANNAN AVVIKELSE: 8 av 38 main-toppar fick bara Preview-deploy, ingen Production — Vercels dokumenterade autoJobCancellation (merges tätare än byggtiden). Sluttillståndet blev korrekt varje gång i det mätta fönstret. HYPOTES (ej avgjord): om sista mergen före en tyst period vore en sådan överhoppad topp skulle prod bli stående. Inträffade INTE här.

FRÅGA B — JA, OCH DET ÄR DEN SKARPA RISKEN. Mätt ur disk: registerSW() anropas utan optioner (src/main.tsx:117); registerType default 'prompt' (vite-plugin-pwa dist/index.js:800) => auto=false; onNeedRefresh odefinierad => ingen prompt. src/sw.ts skipWaiting() i install gör att workbox-window ALDRIG fyrar 'waiting' (activating rensar dess 200ms-timer, workbox-window.prod.umd.js) => showSkipWaitingPrompt körs aldrig => ingen omladdning registreras. clients.claim() laddar inte om (web.dev SW lifecycle). NavigationRoute servar alla navigationer ur precachen. Uppdateringskontroll triggas bara av verklig navigation (vi har varken push eller sync; SW-URL konstant => .register() triggar inget). SPA-ruttbyte är ingen navigation. => MINST TVÅ fulla sidladdningar innan ny kod körs; för installerad app som står öppen: OBEGRÄNSAT.

KRASCHRISK i mellanläget: efter clients.claim() hämtar autoCodeSplitting lazy chunkar med GAMLA hashar; de missar nya precachen, går på nätet och fångas av vercel.json SPA-rewrite. Mätt: /assets/index-CWH3ivIH.js => 200 text/html 4410 B, identiskt med en påhittad fil. Browsern vägrar exekvera HTML som modul.

BESKED: JA, SW-precachen kräver åtgärd före Lotta släpps in. Åtgärden EJ byggd (uppdragets avgränsning) och kräver Marcus-beslut under ADR-047. Rekommendation: registerType 'autoUpdate' med egen onNeedReload (diskret 'ny version — ladda om' i stället för tvångsomladdning som kan slänga inmatning) PLUS onRegisteredSW med periodisk registration.update() för att binda upptäcktstiden.

AC #3-INSTRUMENT (TASK-201.9), skarpt testat båda riktningarna: två ändar — (A) gh api deployments?environment=Production&per_page=1 + git merge-base --is-ancestor din-commit deployad-sha; (B) curl index.html => entry-bundle => GRINDA PÅ content-type (SPA-rewriten gör att saknad asset svarar 200 text/html — statuskod duger inte) => grep markör. Grön=exit 0, påhittad markör=exit 1. Full sekvens i research-dokets § 4.

CI-GRIND: NEJ. Analogin mot task-37 håller inte — EF deployas manuellt, fronten är händelsedriven och FUNGERADE (25/25). En grind som diffar deployad bundle mot HEAD kapplöper med sig själv (merges 2-5 min, byggen 7-10 min) och blir TASK-128s falsklarm om igen (sju på en natt). Den fångar inte heller felet som finns — klientens precache. Golvet behålls som on-demand-verifiering vid go-live (§ 4), inte kontinuerlig grind.

EJ FASTSTÄLLT: Vercels alias-historik. Ingen vercel-CLI, ingen .vercel/, VERCEL_OIDC_TOKEN i .env.local utgången 2026-08-06, noll vercel-poster i docs/reference/atkomst-och-nycklar.md. Kvarstår oförklarat: kortets curl-observation 2026-08-11 morgon mot att senaste Production-deploy (ca9832d7) var success och dess träd bar routen — curl går förbi varje SW, så B förklarar inte den. Data som avgör: vercel ls --prod eller GET /v6/deployments. REKOMMENDATION: lägg in Vercel-åtkomst i atkomst-och-nycklar.md före go-live.

ÅTGÄRD PÅ FRÅGA B BYGGD (S105, 2026-08-13) — Marcus beslut: research § 7 rad 2 + rad 3 tillsammans (autoUpdate med egen onNeedReload PLUS periodisk registration.update()). Omladdningsbeslutet ligger hos användaren; tvångsomladdning avvisad då den kan slänga bort inmatning mitt i ett formulär.

MÄTT, EJ ANTAGET — hur autoUpdate interagerar med vår handskrivna skipWaiting(): registerType används på exakt tre ställen i node_modules/vite-plugin-pwa/dist/index.js — rad 800 (default), rad 169 (ersätter __SW_AUTO_UPDATE__ i klientkoden, den ENDA som gäller oss) och rad 874, som sätter workbox.skipWaiting men BARA när injectRegister är 'auto'/null; vi har false, och workbox.* gäller ändå bara generateSW, inte vår injectManifest. autoUpdate byter alltså KLIENTGREN i register.js från 'waiting' (fyrar aldrig hos oss) till 'activated' (händelsen skipWaiting GARANTERAR). src/sw.ts lämnas ORÖRD — skipWaiting gick från buggens orsak till mekanismens förutsättning.

Ytterligare mätt fälla: i autoUpdate-läge är pluginets updateServiceWorker() en NO-OP (kroppen är 'if (!auto) sendSkipWaitingMessage?.()'), och useRegisterSW-hookens needRefresh-state förblir alltid false (bara onNeedRefresh sätter den, och den anropas aldrig i auto-grenen). Bannern anropar därför window.location.reload() själv och bär egen state.

Intervall 1 h (60*60*1000) — förstapartsrekommendation i BÅDA styrande källor: web.dev SW lifecycle ('call update() on an interval (such as hourly)') och vite-plugin-pwa Periodic SW updates. Formen är förstapartens edge-case-variant med tre guarder (installing, navigator.onLine, fetch(swUrl)+status 200). En visibilityState-guard PRÖVADES mot källorna och byggdes INTE: ingen förstapartskälla nämner dolda flikar.

DIVERGENS mot uppdragstexten (bokförd): uppdraget angav att det blockerande skyddet måste ligga i acceptance-lagret. Fel klass för denna yta — bannern har noll databeteende, och scripts/hermetik-sjalvtest.mjs fäller sådana tester i acceptance (TASK-131-precedenten: InstallPrompts 11 tester). Testet ligger i tests/webblasarbeteende/, som ÄR blockerande på PR (ci-suite.yml jobb webblasarbeteende, instansierat av ci.yml jobb suite, i needs för required-checken ci-passed). Uppdragets REGEL (blockerande skydd) följd; dess utpekade katalog rättad mot disk.

Tvåsidigt bevis: 6/6 gröna med komponenten monterad (exit 0), 6/6 röda utan (exit 1).

Rörda filer: vite.config.ts (registerType), src/lib/app-uppdatering.ts (ny, mekanism), src/components/AppShell/AppUpdateBanner.tsx (ny, UI), src/components/AppShell/index.ts, src/routes/__root.tsx (montering), src/main.tsx (anropsbyte), tests/webblasarbeteende/app-update-banner.test.ts (ny), docs/decisions/ADR-047-pwa-arkitektur-fas-5.md (Updates-amendering).

KVARSTÅENDE RISK, öppet bokförd i ADR-047 § Updates: MIME-kraschfönstret (§ 3.4) krymper från obegränsat till 'tills användaren klickar', men elimineras inte. Att stänga det helt kräver vite:preloadError eller Vercel Skew Protection — ej beslutat.

KRASCHFÖNSTRET STÄNGT MOT ANVÄNDAREN (S105, 2026-08-13, Marcus order "Noll luckor!"). Uppföljning på åtgärden ovan: bannern gjorde fönstret ändligt men inte noll. Byggt: src/lib/chunk-laddningsfel.ts lyssnar på Vites vite:preloadError och tänder ett andra, ASSERTIVT läge i AppUpdateBanner (role=alert, warning-tokens) med begriplig svensk text (orsak, följd, åtgärd) plus Ladda om-knapp. Ingen automatisk omladdning; det brådskande läget ersätter det artiga.

MÄTT, EJ ANTAGET — preventDefault() anropas INTE. Vite 8.2.0, node_modules/vite/dist/node/chunks/node.js: handlePreloadError gör "window.dispatchEvent(e); if (!e.defaultPrevented) throw err;" och ÄR .catch()-handlern för baseModule(). Ett svalt fel får därför __vitePreload att RESOLVA med undefined i stället för modulen, så anroparen kraschar en rad senare med ett orelaterat meddelande. Vites eget doc-exempel är bara säkert i kombination med omedelbar reload — precis det Marcus-beslutet ovan förbjuder. Felet kastas därför vidare till routerns defaultErrorComponent (SectionError), som renderar med skalet kvar (ingen vit skärm) och går till Sentry via onCaughtError. Vad SectionError ensam INTE kan: förklara eller läka — dess "Försök igen" kör om samma import mot samma saknade chunk och kan strukturellt aldrig lyckas.

MÄTT — eventet kan bara fyra vid en navigering Lotta själv utlöst, aldrig på hover: src/router.ts sätter inte defaultPreload och @tanstack/router-core sätter ingen default för fältet (dist/esm/router.js sätter defaultPreloadDelay: 50 men aldrig defaultPreload), så varje preload-gren i react-routers link.js jämför undefined mot intent/render/viewport och är falsk. Det är skälet till att en synlig, assertiv uppmaning är rätt form här i stället för en tyst.

VAD vite:preloadError INTE FÅNGAR (mätt i samma helper): statiska importer i entry-chunken, egna fetch(), bilder, web workers, och misslyckade modulepreload-länkar för JS-deps (helpern skapar bara en Promise när isCss är sant). Den sista saknar praktisk betydelse — när dep:en saknas avvisas baseModule() ändå. INTE I DEV: helpern injiceras bara i bygget ("Build only" enligt pluginets egen källkommentar), vilket är skälet till att testet dispatchar eventet syntetiskt i stället för att blockera en chunk.

KURSKORRIGERING UNDER BYGGET (mätt): första utkastet monterade alert-regionen alltid och tom, i analogi med role=status. Analogin höll inte — MDN ARIA alert role annonserar när elementet LÄGGS TILL, och den alltid monterade formen lade en andra alert-region i varje vy. Fällde tre orelaterade tester i webblasarbeteende-klassen (glomt-losenord, nytt-losenord, valkommen) med "strict mode violation: getByRole(alert) resolved to 2 elements". Regionen monteras nu villkorat, som MessageBox alltid gjort, med regressionsvakt i testfilen.

VERCEL SKEW PROTECTION — AVGJORD SOM EJ TILLGÄNGLIG UTAN ARBETE OCH ETT KONTOBESLUT. Förstapartskällan (vercel.com/docs/skew-protection, hämtad 2026-08-13): tillgängligheten är Pro/Enterprise-bunden, och zero-config gäller endast Next.js, SvelteKit, Qwik, Astro, Nuxt. Vår vercel.json har framework: vite — INTE i listan. Andra ramverk måste implementera den själva genom att läsa VERCEL_SKEW_PROTECTION_ENABLED och hänga VERCEL_DEPLOYMENT_ID på varje request (dpl-query, x-deployment-id-header eller __vdpl-cookie), vilket för en Vite-SPA betyder experimental.renderBuiltUrl plus en outredd interaktion med precache-manifestet. Default maxålder ett dygn. EJ FASTSTÄLLBART HÄRIFRÅN: vilken plan teamet har (ingen vercel-CLI: which vercel exit 1; ingen .vercel/; VERCEL_OIDC_TOKEN utgången 2026-08-06). RÄTTELSE till research § 5 punkt 3: noll dpl_-spår i serverad index.html är en SVAGARE indikation än den såg ut — för ett icke-stött ramverk hade spåren saknats även med funktionen påslagen. MARCUS-BESLUT KVARSTÅR: plan-nivån, och om dpl-pinningen är värd att bygga.

ÄR FÖNSTRET STÄNGT? Mot ANVÄNDAREN ja — det finns inte längre ett läge där Lotta möter en trasig sida utan förklaring och utan väg vidare. Mot NÄTVERKET nej — en chunk som inte finns kommer fortfarande inte att finnas, och rutten hon klickade på visas först efter omladdningen. Den skillnaden är vad Skew Protection skulle stänga.

Rörda filer (denna uppföljning): src/lib/chunk-laddningsfel.ts (ny, mekanism), src/components/AppShell/AppUpdateBanner.tsx (andra läget), tests/webblasarbeteende/app-chunk-laddningsfel.test.ts (ny), docs/decisions/ADR-047-pwa-arkitektur-fas-5.md (andra Updates-posten). Tvåsidigt bevis: 8/8 röda utan mekanismen (exit 1), 8/8 gröna med (exit 0); hela klassen 58/58 grön (exit 0). Grindar: typecheck 0, biome 0, build 0, check:docs 14 gröna exit 0, check-langa-streck 0, api-pure 439 passed exit 0. test:api gav exit 1 av staging-preflighten (TASK-77: CI höll staging, post-merge.yml körning 31733210788 in_progress) — inte av diffen, som inte rör någon API-yta.

INSTANS #2-SERIEN OMTOLKAD EFTER MÄTNING (S105 Del 10, 2026-08-14 kväll) — VIKTIG METODLÄRDOM för denna utredning:
(a) Ett stale-larm restes först: domänens bundle saknade till synes TASK-210:s invalidering (sträng-grep i minifierade chunkar, TASK-199:s egen interimsmetod). Larmet DROGS TILLBAKA efter förstapartsmätning.
(b) FACIT via vercel CLI (åtkomsten FINNS — inloggad marcus-2914, se atkomst-och-nycklar.md, ny registerrad): git-integrationen deployar VARJE main-push (deploy-lista 13 st senaste 2h), inspect visade full byggkedja (klon main@133cb91c → tsc+vite 3994 moduler → Ready → alias admin.miranon.dev), och domänens bundle-namn churna:de live med kvällens landningar (BLxhUi59 → mI1AGlay → Spim29K5).
(c) METODVARNINGEN: bundle-greppen som interimsverktyg är OPÅLITLIG — chunk-attribution flyttar mellan byggen (recordActivitys anropsmönster hittades inte i någon chunk trots bevisat närvarande kod; "Checka in"-markören saknades trots landad källa, trolig orsak tree-shaking/lazy-chunks). RÄTT INSTRUMENT är vercel inspect-kedjan (källcommit→bygglogg→alias), nu tillgänglig via den mätta CLI-åtkomsten. Steg 6-interimsformen i prod-driftsattning-runbook.md bör vid utredningens avslut ersättas med inspect-kedjan.
(d) Kortets ursprungsinstans (stale ≥20 h, 2026-08-11-eran) är därmed INTE motbevisad — men kvällens mätning visar att pipelinen i sitt NUVARANDE läge deployar och servar färskt.

AC saknas medvetet: kortets ursprungliga symptom är delvis åtgärdat (AppUpdateBanner, chunk-laddningsfel.ts, ADR-047-amenderingar redan landade, se kortets egna Implementation Notes) men kortet dokumenterar självt ett kvarstående öppet Marcus-beslut: 'MARCUS-BESLUT KVARSTÄR: plan-nivån (Vercel Pro/Enterprise), och om dpl-pinningen (Skew Protection) är värd att bygga.' Kräver Marcus-beslut om kontonivå + om det återstående nätverks-kraschfönstret (chunk som inte finns efter deploy-skifte) ska stängas helt. Källa: kortets egen Implementation Notes (S105, 2026-08-13/14). Verifierat av registerhygien-passet 2026-08-28 — satte label ready-for-human (saknades).
<!-- SECTION:NOTES:END -->
