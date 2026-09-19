---
id: TASK-464.13
title: >-
  QA: minutbudgeten — Marcus vandrar en dokumentlandning, en kodlandning,
  mätningen och budgetvarningen
status: To Do
assignee: []
created_date: '2026-09-19 10:50'
labels:
  - ready-for-human
dependencies:
  - TASK-464.3
  - TASK-464.4
  - TASK-464.5
  - TASK-464.6
  - TASK-464.7
  - TASK-464.8
  - TASK-464.9
  - TASK-464.10
  - TASK-464.11
  - TASK-464.12
parent_task_id: TASK-464
priority: medium
ordinal: 829000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan för Marcus. (1) Gör en ren dokumentändring, öppna PR, armera: se att bara klassning, länkkontroll och summeringsjobbet kör; väntan under 5 min. (2) Följ en kodlandning: förslaget kör INTE acceptance; kön kör hela sviten; main kör inte om den; efterkontrollen kör bara staging-delen; väntan från armering till main under 12 min. (3) Kör npm run metrics:ci och läs de två måtten per klass mot taken. (4) Öppna GitHubs faktureringsvy: månadens minuter, budgetvarningen vid 40 000. (5) Läs ADR-133 — stämmer den med vad du beslutade 2026-09-19? (6) Läs ommätningens tabell: håller målet med marginal? Notera avvikelser som NYA kort, retuschera inte gamla.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla sex punkter vandrade; avvikelser mintade som nya kort
- [ ] #2 Marcus dom i klartext: håller arkitekturen målen, ja/nej
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
