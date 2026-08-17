---
id: TASK-250
title: 'Backlog-CLI:ts gren-skanningslast under fleet-drift — permanent väg väljs'
status: To Do
assignee: []
created_date: '2026-08-17 01:20'
labels:
  - ready-for-agent
dependencies: []
ordinal: 456000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 punkt 5 (pausens resume-sekvens). Två sessioner har nu betalat lasten live: task-238 (grindens 164 s) och S102-resumen (orkestrator-edit dog på 2-minuterstaket medan parallell agents CLI-anrop malde — två processer × ~25 grenar). ROOT_CONFIG-mönstret (scripts/check-backlog-closure.sh §3) är beprövad interimsväg; detta kort väljer och mekaniserar den PERMANENTA formen. Källor: task-238-kortets notes, docs (S102 sessionsdok Del 14), CLAUDE.md § Kortnummer.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mätserien konsoliderad i kortet: task-238:s A/B (view 28,5→1,96 s) + S102-liveinstansen 2026-08-17 (task edit >120 s timeout under fleet-last → 3,4 s via ROOT_CONFIG) + antal aktiva grenar vid mätning
- [ ] #2 Lösningsrymden prövad mot mätning och EN väg vald med belägg: (a) check_active_branches av permanent + annan kollisionsvakt, (b) ROOT_CONFIG-mönstret breddas till standard-wrapper för ALLA icke-create-anrop, (c) wrapper-skript i scripts/, (d) uppströms-issue till backlog.md — vald väg mekaniserad, inte prosa
- [ ] #3 task create-vägen behåller gren-skanningen (nummer-allokeringen) oavsett vald väg — kollisionsskyddet TASK-93 får aldrig försvagas
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
