---
id: TASK-160.1
title: 'Skiva: ADR — compact-formen'
status: To Do
assignee: []
created_date: '2026-08-07 16:52'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-160
ordinal: 283000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en framtida läsare som ser repot neka harnessets auto-compact hittar hela varför-kedjan i en ADR — nisch, zon, beslutsrätt, markörkontrakt och de förkastade alternativen. Grillad samsyn S99 Del 9 är substratet; PRD-kortet bär besluten. Täcker användarberättelser: 4, 8, 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ADR mintad: nischen (tre samtidiga villkor), zonen ~50 %, tudelad beslutsrätt HITL/AFK, markör-kontraktet inkl. commit-räcker-divergensen mot paus-formen, max-en-compact-regeln; decline-rationale för ersättning (A) och avvisning (C) bokförda
- [ ] #2 ADR-nummer re-verifierat mot disk vid mintningen (parallella sessioner rör räknaren); README-räkningen synkad
- [ ] #3 Docs-grindarna gröna lokalt före push; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
