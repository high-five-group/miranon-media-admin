---
id: TASK-171.2
title: 'Skiva: Flippen — prototypformen blir den ovillkorliga + test-konsument-svepet'
status: To Do
assignee: []
created_date: '2026-08-09 08:22'
labels:
  - ready-for-agent
dependencies:
  - TASK-171.1
parent_task_id: TASK-171
ordinal: 317000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: formvillkoren i routes + AtgardsSida flippas så prototypformen är den ovillkorliga på de skarpa URL:erna; datavägar/datakälla-grenar rörs inte. ariaSnapshot-paren bevisar identitet (variant före == promoverad efter, per läge). Test-konsument-svepet körs i SAMMA skiva: grep-svep över alla testfiler som konsumerar ytan/routerna, varje träff uppdaterad — 162.3-felet (fyra missade filer) får inte upprepas. Prototyp-railen står kvar som byggställning tills rivningsskivan. Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 7, 8, 13, 14.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Formvillkoren flippade; prototypformen ovillkorlig på skarpa URL:erna; datakälla-grenar orörda
- [ ] #2 ariaSnapshot-paren gröna per läge: variant före == promoverad efter
- [ ] #3 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i denna skiva
- [ ] #4 Prototyp-railen kvar (rivs först i rivningsskivan)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: inga datakälla-grenar flippade
- [ ] #8 Test-konsument-svepets träffyta bilagd (grep-svep) och alla träffar uppdaterade i samma skiva som sin flip
<!-- DOD:END -->
