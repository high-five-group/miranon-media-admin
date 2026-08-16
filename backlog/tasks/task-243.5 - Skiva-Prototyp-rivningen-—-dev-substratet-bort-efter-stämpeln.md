---
id: TASK-243.5
title: 'Skiva: Prototyp-rivningen — dev-substratet bort efter stämpeln'
status: To Do
assignee: []
created_date: '2026-08-16 14:39'
labels:
  - ready-for-agent
dependencies:
  - TASK-243.4
parent_task_id: TASK-243
ordinal: 451000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prototyp-substratet har gjort sitt jobb när stämpeln sitter: dev-routen med varianterna och switcher-railen rivs mekaniskt. Rivningen grindas HÅRT av Marcus stämpel — startas kortet utan godkand-stämpel i facit-manifestet är det fel läge och arbetet avbryts. OBS: svep-prototypen (task-241.1) kan vid rivningstillfället bo i EGEN katalog (src/components/dev/svep-prototyp/) — den rörs INTE av denna rivning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dev-routen /dev/hem-prototyp, varianterna (VariantRo/VariantKontroll/VariantBento), PrototypeSwitcher-railen och prototypkatalogen src/components/dev/hem-prototyp/ rivna — B3-spärren (ADR-102) är släppt av stämpeln i task-243.4, vilket verifieras FÖRE rivning (godkand != null i facit-manifestet)
- [ ] #2 Det som rivs är flaggor, växlar och prototyp-substrat — ALDRIG formen (ADR-103); den promoverade skarpa ytan är orörd av rivningen
- [ ] #3 task-226 (hem-prototypen) flippas Done via backlog-CLI:t i samma landning (relationen avgjord vid skivningen per PRD:ns not)
- [ ] #4 Inga döda referenser: typecheck, lint och build gröna; inga kvarvarande imports mot den rivna katalogen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
