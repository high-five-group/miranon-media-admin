---
id: TASK-160.3
title: 'Skiva: pre-compact-skillen i hub-pluginet'
status: To Do
assignee: []
created_date: '2026-08-07 16:56'
labels:
  - ready-for-agent
dependencies:
  - TASK-160.1
parent_task_id: TASK-160
ordinal: 285000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en orkestrerare i mitt-i-flödet-läget kör skillen, får läget säkrat i fil och en fokus-instruktion, och kan sedan kompaktera kontrollerat utan att pipelinen dräneras. Täcker användarberättelser: 3, 5, 7, 9, 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skillen finns i hub-pluginet med eget kontrakt (INTE en gren i session-paus): säkra läget i fil (rent arbetsträd — lokala commits räcker, push krävs inte), sessionsdok-carry vid olandat resonemang, todo-kadens-synk, fokus-instruktion producerad ur läget (nästa mål + öppna PR-nummer + numrerings-snapshot + monitor-läge), markörfil satt som engångsbiljett
- [ ] #2 Beslutsrätten kodad i skillen: HITL = Marcus GO i klartext före kompaktering; AFK = agentens eget beslut när nisch-villkoren är mätta; max EN compact per session — andra impulsen instruerar paus-vägen
- [ ] #3 Hub-commit + plugin-bump + reinstall-innehållsbevis (149.4-formen); agenten kör OISOLERAT (hub-arbete)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
