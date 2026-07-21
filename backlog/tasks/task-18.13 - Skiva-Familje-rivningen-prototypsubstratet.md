---
id: TASK-18.13
title: 'Skiva: Familje-rivningen (prototypsubstratet)'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.1
  - TASK-17.2
  - TASK-17.3
  - TASK-17.4
  - TASK-17.5
  - TASK-18.1
  - TASK-18.2
  - TASK-18.3
  - TASK-18.4
  - TASK-18.5
  - TASK-18.6
  - TASK-18.7
  - TASK-18.8
  - TASK-18.9
  - TASK-18.10
  - TASK-18.11
  - TASK-18.12
  - TASK-19.1
  - TASK-19.2
  - TASK-19.3
  - TASK-19.4
parent_task_id: TASK-18
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
När hela familjen är byggd rivs konvergens-substratet: de fyra prototypsidorna, prototyp-växlaren och demo-datat; faciten bärs vidare av bilagorna och git-historiken (throwaway-kontraktets klausuler iv och v — prototypkod absorberas aldrig, riven vid skarpa byggets slut). Inga skarpa ytor rörs. Täcker inga användarberättelser — kontraktsstädning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prototypfilerna och växlaren borta; appen bygger grönt utan DEV-prototyp-grenar
- [ ] #2 Skarpa flödena opåverkade: fulla e2e-sviten grön efter rivningen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
