---
id: TASK-310
title: >-
  Fynd: task create kostar ~3 min per kort — 287 grenar skannas av
  check_active_branches; elva kort tog över 30 min
status: To Do
assignee: []
created_date: '2026-08-23 14:55'
labels:
  - ready-for-agent
dependencies: []
ordinal: 573000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-08-23 (S108 resume 8): elva task create i följd tog >30 min i ett träd med 287 grenar (git branch -a | wc -l), ~3 min per kort; Bash-anropet dog mot 10-minuterstaket efter tre kort. CLAUDE.md § Kortnummer mätte 0,69→7,09 s vid 43 refs — kostnaden växer med antalet grenar, och fleet-drift producerar grenar utan att någon tar bort dem. Förväntat: task create under ~10 s i normal drift. Blockerar ej (korten skapades i bakgrund), värdefullt → kort (ADR-053).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mätserie bokförd: task create-tid mot antal grenar (git branch -a | wc -l), före/efter städning av landade remote-grenar
- [ ] #2 Rotorsak adresserad utan att röra backlog/config.yml: antingen (a) rutin/skript som tar bort LANDADE remote-grenar (gh pr list --state merged → git push --delete) med torrkörning + allowlist för aktiva sessioners grenar, eller (b) GitHubs 'Automatically delete head branches' aktiverad — valet bokfört med precedent
- [ ] #3 CLAUDE.md § Kortnummer uppdaterad med den nya mätningen (per-kort-kostnaden vid 287 grenar) och vägen framåt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
