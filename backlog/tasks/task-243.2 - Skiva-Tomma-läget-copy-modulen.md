---
id: TASK-243.2
title: 'Skiva: Tomma läget + copy-modulen'
status: To Do
assignee: []
created_date: '2026-08-16 14:34'
labels:
  - ready-for-agent
dependencies:
  - TASK-243.1
parent_task_id: TASK-243
ordinal: 448000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta med noll väntande handlingar möts av ett lugnt, positivt kvitto i stället för tomma listor. Tomma lägets form + bevakningsradernas copy-modul (delad kortcopy + line-clamp-2-skyddsnät, varv 4-leveranserna PR #1388) promoveras ur prototypkällorna. Täcker användarberättelser: 7, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hem-vyn på / är identisk med facit tasks/sessions/bilagor/s102-hem-konvergens/facit.json ytan 'hem-vyn V1 "Lugna morgonen"' i läge tom (desktop + mobil)
- [ ] #2 Tomt läge visar grön bock + 'läget är under kontroll' — tomt känns tryggt, inte trasigt; bevakningsraden är helt dold utan träff
- [ ] #3 Bevakningsradernas kortcopy-modul + line-clamp-2-skyddsnätet promoverade ur prototypens varv 4: fullständig text utan klippning, aldrig ellips på meningsbärande text
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning utförd mot tasks/sessions/bilagor/s102-hem-konvergens/facit.json (ytan 'hem-vyn V1', läge tom, desktop + mobil)
<!-- DOD:END -->
