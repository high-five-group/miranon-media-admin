---
id: TASK-158.3
title: 'Skiva: engångsmigrationen — ~70 äldre stängda dok arkiveras'
status: To Do
assignee: []
created_date: '2026-08-07 12:28'
labels:
  - ready-for-agent
dependencies:
  - TASK-158.2
parent_task_id: TASK-158
ordinal: 274000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: efter landningen bär sessionsdok-roten bara fönstrets dok (~10 senast stängda + paused/active), alla äldre stängda bor i arkivets månadsmappar med omskrivna inkommande länkar, och länk-grinden bevisar helheten grön. Täcker användarberättelser: 1, 2, 4, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Migrationen körs MED arkiverings-skriptet (dess första skarpa körning) — ingen separat handrutin
- [ ] #2 Rotens bestånd efter körningen matchar fönsterregeln, verifierat med mekanisk räkning per lifecycle
- [ ] #3 Docs link check (lychee) grön på den landade committen — noll brutna länkar efter flytt + omskrivning
- [ ] #4 Flytten sker som git-flytt (historik följbar); inget dok raderas; arkivets README-pekare uppdaterad
- [ ] #5 Synk-horisonten (ADR-048) orörd — ingen ändring i synk-konfigurationen
- [ ] #6 PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->
