---
id: TASK-158.3
title: 'Skiva: engångsmigrationen — ~70 äldre stängda dok arkiveras'
status: Done
assignee: []
created_date: '2026-08-07 12:28'
updated_date: '2026-08-07 16:37'
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
- [x] #1 Migrationen körs MED arkiverings-skriptet (dess första skarpa körning) — ingen separat handrutin
- [x] #2 Rotens bestånd efter körningen matchar fönsterregeln, verifierat med mekanisk räkning per lifecycle
- [x] #3 Docs link check (lychee) grön på den landade committen — noll brutna länkar efter flytt + omskrivning
- [x] #4 Flytten sker som git-flytt (historik följbar); inget dok raderas; arkivets README-pekare uppdaterad
- [x] #5 Synk-horisonten (ADR-048) orörd — ingen ändring i synk-konfigurationen
- [x] #6 PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 2 (2026-08-07): PR #925 mergad d25bd4d9, per-jobb-grön (12 pass + 3 klassnings-skip, 0 röda). 67 dok arkiverade via skriptets FÖRSTA skarpa körning; roten 19 dok (10 stängda inom fönstret + 3 active + 3 paused + 3 kända no-lifecycle). Skarpa körningen avtäckte täckningsgap i 158.2:s länk-omskrivning (två korta relativa länkformer, lychee 22 brutna) — fixat + tvåsidigt testbevisat (39/39) i samma PR per ADR-053-triage. DoD 2/4/5 bockade mot byggarens rapporterade grind-verifikat, DoD 3 mot orkestrerarens per-jobb-svep.
<!-- SECTION:FINAL_SUMMARY:END -->
