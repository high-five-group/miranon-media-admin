---
id: TASK-164
title: >-
  mer-index.staging röd sedan 3a225d89 — S100:s Dokument-yta [PROTOTYPE] i skarp
  build
status: Done
assignee: []
created_date: '2026-08-08 17:10'
updated_date: '2026-08-17 08:17'
labels:
  - ready-for-agent
dependencies: []
references:
  - 3a225d89 (rotorsak)
  - ADR-103 § B3 (O3-flaggformen)
  - 'src/components/events/EventDetail.tsx:354 (förlaga)'
modified_files:
  - src/routes/_authenticated/mer/index.tsx
ordinal: 307000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Testet mer-index.staging ('Mer-landningsytan ... ikoner chevron per rad') är deterministiskt rött i post-merge-körningarna 31250759317 och 31267199889. S93-handoffen (§ Paushistorik sjunde pausen) spårar det till 3a225d89 = [PROTOTYPE] [S100] Dokument-ytan på Mer-ytan (T131, 2026-08-07). HYPOTES, prövas av mottagaren (ADR-086): prototyp-ytan saknar DEV-grind och renderar därför i staging-bygget, vilket ändrar Mer-sidans radstruktur. Etablerat beslut styr fixen: ADR-103 beslut 3 (O3-flaggformen — central läspunkt + import.meta.env.DEV + referens-scanning) säger att prototyp-ytor ska vara DEV-grindade; bekräftar diagnosen hypotesen är fixen att grinda Dokument-ytan (den förblir synlig på dev-servern där prototyper granskas). Detta är S100:s yta — övertagen av S93-orkestreringen på Marcus GO 2026-08-08. Visar diagnosen något ANNAT än ogrindat prototyp-läckage (t.ex. att ytan avsiktligt ska synas i staging) ⇒ STOPPA och rapportera. Staging-e2e körs inte lokalt (5173-förbudet); post-merge-nätet är grinden.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Diagnosen fastställd: exakt varför mer-index-testet faller, mot 3a225d89:s faktiska diff
- [x] #2 Fix landad enligt O3-flaggformen om hypotesen bekräftas (DEV-grind, prototypen kvar i dev)
- [x] #3 Testet bevisat grönt i post-merge-körning på main
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
DIAGNOS (AC#1): 3a225d89 (src/routes/_authenticated/mer/index.tsx) lade till
en OVILLKORLIG <li><NavCard to="/mer/dokument" .../></li> i grupp 2 (samma
<ul> som "Bygg segment"). mer-index.staging.test.ts (task-9.2-facitet) låser
EXAKT sex NavCard-länkar i TRE grupper med grupp 2 = ['Bygg segment'] ensam.
Den nya raden gjorde grupp 2 till ['Bygg segment', 'Dokument'] (7 länkar
totalt, 7 chevron i stället för 6) — testet föll deterministiskt. Hypotesen
(ogrindat prototyp-läckage) BEKRÄFTAD mot faktisk diff.

VIKTIG DIVERGENS FRÅN UPPDRAGETS PREMISS, verifierad (ADR-086), inte antagen:
uppdraget antog att mer-index.staging (och all .staging.test.ts-e2e) körs mot
"staging-bygget" (ett vite build-bygge). Det stämmer INTE. Tre oberoende
källor: (1) playwright.config.ts:298-365 — chromium-authenticated-projektet
(testMatch **/*.staging.test.ts) faller på webServer-defaultgrenen
`npm run dev -- --port 5173 --strictPort` (rad 360-365), ALDRIG `vite build`
eller preview; (2) post-merge.yml anropar samma ci-suite.yml/test-staging-jobb
utan PLAYWRIGHT_TEST_BASE_URL eller build-steg — identisk mekanism lokalt och
i post-merge; (3) Vites egen källa (node_modules/vite/dist/node/chunks/node.js
rad 35736: `isProduction = process.env.NODE_ENV === "production"`, rad 25777:
createServer anropar resolveConfig(inlineConfig,"serve") med defaultNodeEnv
"development") — NODE_ENV sätts ALDRIG i repot (grep .github/workflows/*.yml
package.json = 0 träffar), så DEV=true OVILLKORLIGT under hela test-staging-
körningen, lokalt och i CI.

KONSEKVENS FÖR FIXEN: en NAKEN `import.meta.env.DEV`-grind (utan andra
villkor) hade INTE dolt raden för testet — DEV är sant där också, testet hade
förblivit rött. Det bevisas indirekt av den citerade förlagan själv:
EventDetail.tsx:354 grindar med `import.meta.env.DEV && isHallplatsVariant(
variantParam)` — TVÅ villkor. event-detail.staging.test.ts:527 dokumenterar
uttryckligen att det är FRÅNVARON av `?variant=` i testets navigering (inte
DEV=false) som håller växlaren dold. Samma mönster i personer/index.tsx
(`import.meta.env.DEV && variant === 'a'`).

FIX (AC#2): mer/index.tsx — samma tvåvillkorsmönster. Ny `useQueryState(
'variant')` (nuqs, samma konvention) + `visaDokumentPrototyp = import.meta
.env.DEV && variant === 'dokument'` grindar <li>-blocket. DEV-halvan bär
ADR-103 B3 lager 1-löftet (strukturellt onåbar i vite build — verifierat:
`npm run build` + grep av dist/assets visar "Dokument"-strängen ENDAST i
TanStack Routers routeTree-registrering, INTE i Mer-sidans renderade JSX).
variant-halvan är det som faktiskt håller raden dold vid testets vanliga
page.goto('/mer') utan query-param, oavsett DEV. Granska med
/mer?variant=dokument på dev-servern. mer-index.staging.test.ts RÖRS INTE
(inte i uteslutningslistan, och behöver inte ändras — facitets 6 länkar/3
grupper återställs exakt).

AC#3 KAN INTE VERIFIERAS AV DENNA AGENT: kräver post-merge-körning på main
efter landning (ADR-096 — bygg-agenten parkerar aldrig på landnings-vakter).
Lämnas avbockad för orkestrerarens svep.

RIVNINGSPASSET (2026-08-16/17, task-164-rivning-uppdraget, gren
docs-dokument-rivning-task164): dev-grinden `visaDokumentPrototyp`
(mer/index.tsx) RIVEN — Dokument-ytan promoverad till skarp, ovillkorlig
NavCard-rad i grupp 2 (ADR-102 B3-villkoret uppfyllt: Marcus satte
"godkand" i s102-dokument-konvergens/facit.json, sha cc1d7c53, PR #1446).
mer-index.staging.test.ts uppdaterat till ÅTTA rader/grupp 2 = ['Bygg
segment', 'Dokument'] (var SJU) — kört lokalt mot canonical
`npx playwright test --project=chromium-authenticated` (webServer på 5173):
GRÖNT före (7 länkar, dev-grinden höll) OCH grönt efter (8 länkar, facit
uppdaterat). Enda kvarvarande fel i filen är AC 2 (måttjämförelse mot /hem)
— OFÖRÄNDRAT i båda körningarna, orsakat av hem-ytans EGEN pågående
konvergens (s102-hem-konvergens/facit.json, "godkand": null), UTANFÖR
detta korts scope.

AC #3 lämnas AVBOCKAD med avsikt: dess bokstav ("post-merge-körning på
main") kan inte uppfyllas av en bygg-agent (ADR-096 — ingen agent väntar in
CI/landning). Den ursprungliga MÅLSÄTTNINGEN (mer-index.staging.test.ts
grönt) är dessutom SUPERSEDERAD av rivningen: det gamla facitet (Dokument
DOLD, 7 länkar) existerar inte längre — det NYA facitet (Dokument SKARP, 8
länkar) är vad testet nu låser, och det är bevisat grönt lokalt ovan.
Orkestrerarens post-merge-svep är den slutgiltiga verifieraren, som för
varje landning.

Kortet sätts INTE till Done av denna agent (bygg-agent-kontraktet:
"Sätt aldrig kortet till Done" — orkestreraren stänger efter CI-grönt).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd av orkestreraren 2026-08-17: rivningen mergad (#1449, 7ad23d51) och post-merge på 5b71dcbb (som bär rivningen) GRÖN — seriens första fulla gröna; mellanliggande rödingar klassade förbefintliga (persist-cache/mer-index-klasserna, lagade i task-243.3 #1470).
<!-- SECTION:FINAL_SUMMARY:END -->
