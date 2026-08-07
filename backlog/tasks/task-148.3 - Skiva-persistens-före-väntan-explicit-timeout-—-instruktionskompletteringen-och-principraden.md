---
id: TASK-148.3
title: >-
  Skiva: persistens före väntan + explicit timeout — instruktionskompletteringen
  och principraden
status: To Do
assignee: []
created_date: '2026-08-07 09:49'
labels:
  - ready-for-agent
dependencies:
  - TASK-148.1
parent_task_id: TASK-148
ordinal: 249000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en bygg-agent som läser sin instruktion vet exakt i vilken ordning persistens och väntan får ske och varför, och en läsare av konstitutionen kan namnge kontraktet. Täcker användarberättelser: 2, 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: bygg-agentens befintliga asynkron-signal-sektion läst i sin helhet; kompletteringen adderar utan att duplicera eller motsäga befintliga rader
- [ ] #2 bygg-agent-instruktionen kompletterad: (a) commit + push FÖRE varje anrop som kan konverteras till bakgrund, (b) explicit timeout på potentiellt långa kommandon — försvaret mot harnessens tysta bakgrunds-konvertering
- [ ] #3 CLAUDE.md bär principraden med Temporal-mönstret namngivet (subagent = Activity som GÖR, orkestrerare = Workflow som VÄNTAR) och pekare till ADR-096
- [ ] #4 Docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
