---
id: TASK-157.4
title: 'QA: trådregistrets tunna form ände-till-ände'
status: To Do
assignee: []
created_date: '2026-08-07 11:36'
labels:
  - ready-for-human
dependencies:
  - TASK-157.1
  - TASK-157.2
  - TASK-157.3
parent_task_id: TASK-157
ordinal: 270000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan: stickprovs-forensik på migrationen, läsbarhets-test, grind-provokation, dokumentkedje-läsning. Alltid ready-for-human.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Stickprov (minst 5 trådar i olika åldrar/statusar): radens narrativ återfinns i kortet, inget tappat mot git-historiken
- [ ] #2 Registret läst i ett svep utan limit — under Read-taket med god marginal; navigering rad→kort prövad
- [ ] #3 Grinden provocerad manuellt med en fet rad — fäller med rätt anvisning; dokumentkedjan ADR-098 ↔ registret ↔ grinden ↔ ADR-053/085/095 sammanhängande
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
