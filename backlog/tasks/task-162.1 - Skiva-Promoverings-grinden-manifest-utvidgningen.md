---
id: TASK-162.1
title: 'Skiva: Promoverings-grinden + manifest-utvidgningen'
status: Done
assignee: []
created_date: '2026-08-08 07:39'
updated_date: '2026-08-08 08:48'
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
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: inga protoDataMode-grenar flippade
<!-- DOD:END -->
