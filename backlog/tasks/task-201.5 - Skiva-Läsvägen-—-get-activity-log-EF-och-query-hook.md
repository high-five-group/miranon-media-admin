---
id: TASK-201.5
title: 'Skiva: Läsvägen — get-activity-log-EF och query-hook'
status: To Do
assignee: []
created_date: '2026-08-11 20:24'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.2
parent_task_id: TASK-201
ordinal: 370000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: läsvägen från tabell till klient — EF med kontrakt som redan rymmer filterradens behov (kategori/event/tid) så att 201.8 inte behöver röra EF:n, och en hook som hem-spalten och historikvyn båda konsumerar. Parallellbar med 201.3/201.4 (dep endast tabellen).

Täcker användarberättelser: 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 get-activity-log-EF: senaste först, paginering, filterparametrar (kategori, eventId, tidsintervall) i kontraktet; EF-ribban (SECURITY-SPEC §6.10); api-staging-test mot seedade rader
- [ ] #2 Query-hook i datalagret via adaptern — datalagret nås ALDRIG förbi sin adapter
- [ ] #3 Devtools-läsbarhet (byggplanens DoD 4): posterna inspekterbara i TanStack Query devtools
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 requestId propageras klient → EF → activity_log-rad, läsbar i devtools (byggplanens DoD 3–4)
<!-- DOD:END -->
