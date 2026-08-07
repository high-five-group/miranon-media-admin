---
id: TASK-148.5
title: 'Skiva: harness-mätningen genomförs — dedikerad mätsession'
status: To Do
assignee: []
created_date: '2026-08-07 09:51'
labels:
  - ready-for-human
dependencies:
  - TASK-148.4
parent_task_id: TASK-148
ordinal: 251000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: efter sessionen är T112:s öppna rotorsaksfråga stängd med mätdata, inte hypotes — orkestrerar-sidans kompensationer kan därefter riktas mot den verkliga defekten. Körs som EGEN session (mätobjektet är idle-väckning; pågående arbete maskerar felet). Täcker användarberättelser: 5, 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga protokollceller körda i dedikerad session med Marcus som observatör; rådata (JSONL-utdrag per cell) bevarad
- [ ] #2 T112 uppdaterad: mätning (iv) besvarad med MÄTT-status — var kedjan bryts (notifikations-leverans eller agent-resume)
- [ ] #3 Research-dok med resultat och slutsats landat; stop-vaktens blinda fläck (spawnade agenter i background_tasks) prövad mot utfallet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
