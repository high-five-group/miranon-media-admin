---
id: TASK-152
title: >-
  Fynd: 264 mergade lokala grenar utan städmekanism — paus-svepet städar
  worktrees men aldrig grenar
status: To Do
assignee: []
created_date: '2026-08-07 10:51'
labels:
  - ready-for-agent
dependencies: []
ordinal: 264000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Symptom: 264 av 283 lokala grenar är redan mergade i main och växer session för session (S98 noterade 213 två dagar tidigare); worktree-svepet vid paus rör kataloger men inte grenar, och ingen mekanism i scripts/ eller dokumentationen adresserar grenstädning. Förväntat: ett städsteg i paus-rutinens svep som håller gren-listan i paritet med worktree-hygienen. Funnet i S99 uppdrag 3-svepet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: git branch --merged main räknad vid byggtillfället; worktree-städningens faktiska scope läst i session-paus-skillen/skripten
- [ ] #2 Grenstädnings-steg byggt enligt repots skript-konvention (universell logik + policy-konfig): raderar lokala grenar mergade i main, skyddar aktiva worktree-grenar + konfigurerbar skyddslista; torrkörnings-läge default
- [ ] #3 Tvåsidig testsvit (raderar mergad gren · skonar omergad · skonar worktree-bunden · skonar skyddslistad); shellcheck-strict grön; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
