---
id: TASK-124
title: >-
  Fynd: leverans-hooken täcker CLAUDE.md-lagret men inte memory-lagret —
  MEMORY.md kan levereras utan loggrad
status: To Do
assignee: []
created_date: '2026-08-02 08:45'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 196000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
T100-fyndet 2026-07-27 (restlistans Spår B-rad, bruten vid session-end 2026-08-02): T100:s spärr-/loggapparat för instruktionsleverans täcker CLAUDE.md-lagret, men MEMORY.md (auto-memory-indexet) levererades utan att logga en rad. Risk: instruktionsleverans via memory-lagret är osynlig för trail och grind — samma klass ADR-083 vaktar för permissions-påståenden, fast på leveransvägen.

UPPGIFT: klassa rätt mekanism — utvidga hook-täckningen, en logg-konvention, eller ÖPPET AVSTÅ. Över-engineering-vakten prövas skarpt: EN observerad instans hittills (ursprungsfyndet), noll incidenter efter. T100-baslinjen (132 händelser, 0 träffar) är måttet en leverans-mekanism verifieras mot.

Källor: tasks/threads/T100-instruktionsleveransen.md · tasks/s91-restlistan.md § Spår B (bruten rad, session-end) · sessionsdok S91 Del 42.6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mekanismval redovisat med skäl + förkastade alternativ (verktygsvals-formen, CONTRIBUTING § Verktygsval)
- [ ] #2 Vid bygge: tvåsidigt bevis — fyrar på memory-leverans, tyst annars
- [ ] #3 Vid avstå: beslutet öppet bokfört mot T100-baslinjen (inget tyst förkastande)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
