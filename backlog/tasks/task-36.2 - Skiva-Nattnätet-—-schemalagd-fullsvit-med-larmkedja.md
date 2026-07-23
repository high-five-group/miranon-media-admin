---
id: TASK-36.2
title: 'Skiva: Nattnätet — schemalagd fullsvit med larmkedja'
status: Done
assignee: []
created_date: '2026-07-23 17:12'
updated_date: '2026-07-23 20:29'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-36
ordinal: 91000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Denna skiva bygger nätet som allt annat i vågen vilar på. Sekvens-invarianten är hård: riskklassning och merge-dedup får INTE aktiveras innan nattnätet finns, eftersom båda medvetet hoppar över arbete före merge. Utan ett nät under sig blir varje skipp ett hål; med nätet blir det en fördröjning på högst ett dygn.

Efter denna skiva prövas hela repot varje natt i sin fulla bredd — inklusive det som dagens selektion hoppade över — vid en tidpunkt när kön är tom och mutexen fri. Går något sönder vaknar Marcus till ett ärende som redan pekar ut körningen och exakt vilket commit-spann som tillkommit sedan förra gröna natten, i stället för till en röd prick i ett flöde ingen läser.

Larmkedjan har en medveten motgift mot kyrkogårdseffekten: ett nattärende kan inte stängas tyst. Antingen åtgärdas det, eller så skrivs motiveringen ut. Regeln bor i bidragsguiden så att den överlever den här sessionen.

Nattkörningen kör i denna version allt som existerar idag. Visuell regression finns ännu inte och adderas av sin egen skiva när den byggs — nattnätet skrivs så att tillägget blir en rad, men låtsas aldrig köra något som inte finns.

Täcker användarberättelser: 7, 8, 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En schemalagd körning startar varje natt (~03:00 svensk tid) och kan även avfyras manuellt
- [x] #2 Nattkörningen kör full svit inklusive staging-stegen i mutexen, länkkontroll UTAN cache och bredare sårbarhetsgranskning än dagsvitens
- [x] #3 En röd nattkörning skapar automatiskt ett ärende: tilldelat, etiketterat, med länk till körningen och commit-spannet sedan senaste GRÖNA nattkörning
- [x] #4 Ett grönt nattnät skapar inget ärende och lämnar inga spår som kräver städning
- [x] #5 Stängningsregeln står i bidragsguiden: ett nattärende stängs endast med åtgärd eller öppet skriven motivering — aldrig tyst
- [x] #6 Beviset är en manuellt avfyrad körning med citerat körnings-ID; nattens schemalagda inväntas inte
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · ci-suite.yml + ci.yml + nightly.yml + ADR-077 (PR #112 55283ae → fixar #113 + #115) · CI grön per jobb (leverans 30037766751; nightly-grön 30039548355; simulate 30039559724 → ärende #114; gate-proof 30038462683) · CI-grön-första-pass: NEJ (3 defekter CI-fångade, → L326) · defekter under körning: 3 (startup_failure permissions-eskalering ×2 [ci.yml + nightly.yml, båda anroparna] + span-faktafel [samma-SHA flake-döljning]) · TDD: ej tillämplig (CI-config; span-logiken unit-testad lokalt mot 3 fall, larm-mekaniken runtime-bevisad via #114)
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Statiska workflow-grindar gröna på ändrad CI-konfiguration (actionlint, yamllint, shellcheck strict)
- [x] #6 L322-invarianten oregresserad: paraply-checken har alltid-kör-villkoret ENSAMT och exit:ar 1 vid failure/cancelled
<!-- DOD:END -->
