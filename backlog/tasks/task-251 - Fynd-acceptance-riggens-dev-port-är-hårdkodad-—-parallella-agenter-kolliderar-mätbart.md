---
id: TASK-251
title: >-
  Fynd: acceptance-riggens dev-port är hårdkodad — parallella agenter kolliderar
  mätbart
status: To Do
assignee: []
created_date: '2026-08-17 01:20'
labels:
  - ready-for-agent
dependencies: []
ordinal: 457000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-08-17 (S102, 241.3-bygget): agentens acceptance-körningar kolliderade med parallell agents vite-server på hårdkodade port 5399 — PID-spårad till den andra agentens process via ps/lsof. Under fleet-drift (flera bygg-agenter samtidigt) är en fast port en delad resurs utan ägare. Belägg: task-241.3-kortets Implementation Notes § koordination.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Porten per-process-unik (port 0/ephemeral eller worktree-deriverad) — två samtidiga acceptance-körningar i olika worktrees stör aldrig varandra, bevisat med parallell körning
- [ ] #2 Flake-klassen ur S102-instansen (två körningar fällde olika orelaterade test i hem-laddlage.acceptance under kollisionen; tredje isolerad körning 5/5 grön) omkörd grön efter fixen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
