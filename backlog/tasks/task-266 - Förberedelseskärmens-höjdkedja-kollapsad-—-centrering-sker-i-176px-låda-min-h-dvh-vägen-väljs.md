---
id: TASK-266
title: >-
  Förberedelseskärmens höjdkedja kollapsad — centrering sker i 176px-låda,
  min-h-dvh-vägen väljs
status: Done
assignee: []
created_date: '2026-08-17 10:15'
updated_date: '2026-08-17 11:28'
labels:
  - ready-for-human
dependencies: []
priority: high
ordinal: 482000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-261-agentens skarpa browsermätning (2026-08-17): viewport 720 px men html/body/#root/container alla 176 px — base.css:19–23 sätter html/body utan height och #root saknar CSS-regel, så Forberedelseskarm.tsx:183:s h-full/justify-center centrerar i en kollapsad låda högst upp (Marcus live-observation: logo+loadingbar ocentrerade). SEPARAT rot från 261-blinket. Ytan är ADR-112-/TASK-242-styrd (tätt specat layoutankare) — därför väg-val, inte solofix. REKOMMENDATION: viewport-baserad min-h-dvh per login.tsx-mönstret (mätt immun). Marcus GO på vägen → agent bygger.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Väg vald öppet mot ADR-112/TASK-242:s layoutankare (rekommendation: min-h-dvh per login.tsx)
- [x] #2 Centreringen verifierad i skarp browsermätning (container == viewport-höjd) i login-monteringen
- [x] #3 Regressionstäckning (mätmetoden ur 261: setInterval-polling via console)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
VÄGVALET (AC1) — min-h-dvh-vägen byggd, men på ANROPAR-lagret, inte i komponenten. Skälet är disk-verifierat: Forberedelseskarm.tsx:144-159 (TASK-242:s layoutankare) motiverar h-full min-h-full som en AVSIKTLIG skillnad mot login.tsx — dev-showcasen (/dev/primitives:456-467) ramar in tre instanser i h-72 overflow-hidden, och min-h-dvh i komponenten hade brutit ut ur inramningen. Kontraktet 'anroparen sätter höjden' stod redan formulerat på två ställen (dev/primitives.tsx:456, main.tsx:354-356) men var aldrig implementerat på någon av de två produktionsanroparna — de renderade komponenten naken direkt under #root. Det, inte komponentens klasser, var rotorsaken. ADR-112 innehåller noll höjd-/layoutstyrning (grep: höjd/height/viewport/dvh/centrer = 0 träffar), så layoutankaret ägs helt av TASK-242.

MEKANIKEN — grid, inte flex, och det är MÄTT. Barnets h-full (height:100%) mot en förälder vars höjd kommer från min-height löser sig inte: height:100% computear inte till auto och utlöser därför aldrig align-items:stretch. Fyra former mättes i samma körning på 1280x720: flex min-h-dvh = 219 px · h-dvh = 720 utan växt · grid min-h-dvh = 720 MED växt (1032 px vid 1000 px innehåll) · flex-col + flex-1 på barnet = 720 men kräver ändring i komponenten. Grid är den enda som ger både viewporthöjd och växt utan att röra Förberedelseskärmen.

MÄTNING FÖRE/EFTER (skarp browser, 1280x720, /login, dev-server): FÖRE viewport 720 men html/body/#root/container ALLA 219 px, logons mitt y=69 mot viewportens 360. EFTER html/body/#root/container ALLA 720, container == viewport, kompositionsblockets mitt exakt 360. Kortets premiss sade 176 px — både 176 och 219 uppmättes och skillnaden är logo-SVG:ns laddningsläge (en oladdad img har höjd 0). Samma fenomen, inte en motsägelse.

AC3 — tests/webblasarbeteende/forberedelseskarm-hojdkedja.test.ts (ADR-094: ren layout, noll nätverksanrop). Två skärpningar mot 261:s setInterval, båda framtvingade av mätning: (1) MutationObserver, eftersom setInterval(4ms) fångade noll prov mot en VARM dev-server — gate-bytet sker i en passiv effekt och ingen timer hinner köra i gapet; (2) expect.poll runt insamlingen, eftersom console-leverans över CDP inte är synkroniserad med sidans väntningar — noll prov under 8 parallella workers men 10/10 ensamt. Testet fäller om noll prov fångas, aldrig tyst grönt. TVÅSIDIGT BEVISAT: med höjdkällan borttagen fäller det på Expected 720 / Received 219 — buggens egna tal. Andra testet vaktar motsatt riktning (komponenten ska fylla sin h-72-inramning, inte viewporten), så en framtida flytt av min-h-dvh in i komponenten fångas.

REGRESSION: webblasarbeteende 60/60 gröna inkl. valkommen.test.ts:261/271/293 (scrollHeight-gränsen som fällde 3/3 på min-h-dvh i PR #1400) · a11y 21/21 inkl. Forberedelseskarm + primitives-showcasen · acceptance login/passkey/valkommen 16/16. Grindar: typecheck 0 · typecheck:tests 0 · biome 0 · build 0 · test:api 0 (874).

OBSERVATION (ej orsakad härav): acceptance-sviten var vid en av fyra körningar exit 1 på oanvänd-stub-vakten (GET */auth/v1/passkeys i passkey.acceptance.test.ts) medan tester 16/16 passerade. Baslinjen utan mina ändringar var ren, filen ensam ren, och identisk omkörning ren — icke-deterministiskt, i just den vakt som själv varnar för falska fynd vid delmängdskörning.
<!-- SECTION:NOTES:END -->
