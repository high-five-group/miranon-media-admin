---
id: TASK-160.6
title: 'Skiva: mätpunkts-tillägget i väckningskedjs-protokollet'
status: To Do
assignee: []
created_date: '2026-08-07 17:01'
updated_date: '2026-08-07 17:33'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-160
ordinal: 288000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: mätsessionen som exekverar protokollet besvarar compact-formens två öppna hypoteser med mätdata, så att skillens robusthetsantaganden ersätts av fakta. Täcker användarberättelse: 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Två mätpunkter tillagda i det bokade mätprotokollet: (1) överlever subagent-notifikationer och monitors en kompaktering i levande session, (2) retry-beteendet hos en NEKAD auto-compact — larmar den varje tur (level-triggered) eller en gång
- [x] #2 Varje mätpunkt bär förväntat utfall per hypotes + vad som justeras i pre-compact-skillen vid respektive utfall
- [x] #3 Docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
