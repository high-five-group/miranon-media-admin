---
id: TASK-162.1
title: 'Skiva: Promoverings-grinden + manifest-utvidgningen'
status: Done
assignee: []
created_date: '2026-08-08 07:39'
updated_date: '2026-08-09 08:09'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-162
ordinal: 301000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prefaktoreringen som gör promoveringen enkel: bevismekanismen byggs FÖRE någon flip. Variant-lägets renderade form fångas som ariaSnapshot-referenser i den hermetiska fixturvärlden — de blir grinden som skiva 2 och 3 bevisas mot, och registrets mekaniska facit. Facit-manifestet utvidgas så rivningsspärren täcker registret. Täcker användarberättelser: 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ariaSnapshot-referenser fångade ur variant-läget i hermetiska fixturvärlden: åtgärds-ytan + registrets fyra lägen (default, aktivt filter, Bor över-kryss, noll träffar), incheckade som grindens facit
- [x] #2 Grinden tvåsidigt bevisad: grön på identisk yta, RÖD på avsiktligt muterad
- [x] #3 Facit-manifestet bär registrets yta med källor; png-frånvaron öppet deklarerad (prototypen i variant-läget är facit per ADR-102 B1)
- [x] #4 check-facit-grinden grön efter utvidgningen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGNING (2026-08-08, orkestreraren): PR #983 mergad genom kön 08:38:24Z (merge-SHA a7c02091) — per-jobb-CI grönt via merge-grinden. Alla fyra AC bockade av utföraren; tvåsidigt grind-bevis i PR:en (grön 12/12 · röd med exakt diff på avsiktlig mutation · reverterad + grönt återbevisat). Öppen flagga bokförd: grinden körs i förgrund av utförare, ej i CI förrän T87.

[TASK-169, backlog-städet, 2026-08-09] DoD#1-4+7 bockade mot direkt belägg: AC redan [x]; PR #983 (merge a7c02091, 2026-08-08T08:38:24Z) samtliga CI-jobb SUCCESS/SKIPPED; diff = kortfilen, playwright.config.ts, Deltagare.tsx (endast ett tillagt data-testid-attribut, ingen protoVariant/protoDataMode-gren rörd — verifierat via gh pr diff), facit.json, samt aria-referensfiler under tests/visual/__aria__/ — allt i scope. DoD#5+#6 (ariaSnapshot-par + bevis-loopens spår 'för varje promoverad yta') var vid 162.1s egen leverans tautologiska (ingen yta promoverad ännu av DENNA skiva) men är nu FAKTISKT uppfyllda av syskonskivorna som gjorde promoveringen: TASK-162.2 (Åtgärds-ytan, DoD#5+#6 checkade med egen ariaSnapshot-grind + bevis-loop) och TASK-162.3 (Registret, samma mönster) — båda Done. 162.1 var grind+manifest-infrastrukturen; 162.2/162.3 bar det verkliga promoverings-beviset kravtexten pekar på.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: inga protoDataMode-grenar flippade
<!-- DOD:END -->
