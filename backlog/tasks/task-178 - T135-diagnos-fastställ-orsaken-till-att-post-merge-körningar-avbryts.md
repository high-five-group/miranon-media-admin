---
id: TASK-178
title: 'T135-diagnos: fastställ orsaken till att post-merge-körningar avbryts'
status: To Do
assignee: []
created_date: '2026-08-10 06:15'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 335000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-merge är primär bärare av staging-kontrollen (A7:5); en avbruten körning ger larm utan dom — sex larm på ett dygn, reproducerad 2/2 per tråden. Utan diagnos är nattbatchens 'grönt på main' otillförlitligt — därför första vågen i kvällens batch.

Källa: tasks/threads/T135-post-merge-korningen-avbryts-trots-att-filen-sager-aldrig.md.

Diagnos först (rotorsak, ej lappning). Åtgärd som kräver arkitektur-/policybeslut eskaleras till Marcus i stället för att byggas.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rotorsaken fastställd med belägg: run-id:n, event-data, workflow-config-läsning
- [ ] #2 Åtgärdsväg föreslagen med källhänvisningar
- [ ] #3 Om fixen är trivial och riskfri: levererad med tvåsidigt bevis; annars öppet eskalerad
- [ ] #4 T135-tråden uppdaterad med diagnosen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
