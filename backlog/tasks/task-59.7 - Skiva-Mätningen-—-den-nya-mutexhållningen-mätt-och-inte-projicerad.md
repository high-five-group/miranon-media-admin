---
id: TASK-59.7
title: 'Skiva: Mätningen — den nya mutexhållningen, mätt och inte projicerad'
status: To Do
assignee: []
created_date: '2026-07-27 20:42'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.6
parent_task_id: TASK-59
ordinal: 131000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Vinsten mäts skarpt och jämförs mot projektionen, och acceptance-klassen färdigställs i CI-klassningen.

BETEENDET ÄNDE-TILL-ÄNDE: efter att alla arton är ute mäts hur länge staging-mutexen faktiskt hålls per körning, och vad acceptance-jobbet kostar. Talen jämförs mot projektionen 9,25 minuter till cirka 2,4. Håller den inte redovisas det som ett utfall, inte som ett problem att gömma — projektionen var en härledning och detta är dess prov.

VARFÖR EGEN SKIVA: ett mätt tal är en egen leverans och ska inte begravas i den största migrerings-PR:en. Blir mätningen en fotnot i ett sjufils-bygge läses den inte.

OCKSÅ I SKIVAN: acceptance-klassen får sin plats i den befintliga risk-klassnings-mekaniken, så att en ändring som bara rör klassen klassas rätt av grinden och inte drar med sig hela sviten.

SHARDNING INGÅR INTE. Den möjliggörs av arbetet men aktiveras separat, eftersom den linjära skalningen i workers är ett ANTAGANDE som ska mätas när den aktiveras — inte ärvas härifrån.

Täcker användarberättelser: 1, 10, 12, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Staging-mutexens nya hållning är MÄTT per körning och jämförd mot projektionen 9,25 min till cirka 2,4 — utfallet redovisat oavsett riktning
- [ ] #2 Acceptance-jobbets egen körtid är mätt och redovisad
- [ ] #3 Acceptance-klassen är inwirad i den befintliga risk-klassnings-mekaniken; en klass-lokal ändring drar inte med sig hela sviten
- [ ] #4 Avviker utfallet från projektionen står avvikelsen skriven som utfall, med hypotes om orsak — inte bortförklarad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Acceptance-jobbet kör utan staging-mutex och den nya mutexhållningen är MÄTT, ej projicerad
<!-- DOD:END -->
