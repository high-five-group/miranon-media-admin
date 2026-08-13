---
id: TASK-199
title: >-
  Prod-fronten var stale ≥20 h trots Vercel-git-integration — deploy-historiken
  oförklarad, frontend-deploy-vägen saknar dokumenterad kontroll
status: To Do
assignee: []
created_date: '2026-08-11 19:12'
updated_date: '2026-08-13 15:46'
labels: []
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
<!-- SECTION:NOTES:END -->
