---
id: TASK-160.5
title: 'Skiva: tröskel-konfigen — zonen ~50 procent'
status: To Do
assignee: []
created_date: '2026-08-07 17:00'
labels:
  - ready-for-agent
dependencies:
  - TASK-160.2
parent_task_id: TASK-160
ordinal: 287000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en session som når zonen får sitt maskinella zonlarm (nekat auto-compact-försök med anvisning) vid ~50 procent i stället för vid klippan. Täcker användarberättelse: 1
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Auto-compact-tröskeln satt till ~50 procent via harnessets dokumenterade tröskel-miljövariabel i settings-miljöblocket — EFTER att PreCompact-grinden står (beroendet är säkerhetsordning: sänkt tröskel utan grind tidigarelägger okontrollerad kompaktering)
- [ ] #2 Sessionsstart-kravet bokfört: miljövärdet biter först i session född efter ändringen — samma klass som hook-registrering; verifikatsvägen dokumenterad i kortet
- [ ] #3 Docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
