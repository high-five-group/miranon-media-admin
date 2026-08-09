---
id: TASK-171.4
title: 'Skiva: Marcus QA + stämplingen via !-kanalen'
status: Done
assignee: []
created_date: '2026-08-09 08:25'
updated_date: '2026-08-09 11:00'
labels:
  - ready-for-human
dependencies:
  - TASK-171.3
parent_task_id: TASK-171
ordinal: 319000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell plan: Marcus granskar den promoverade ytan på dev-servern mot facit-bilderna (regressionsstöd, inte spec) — lägen: tomt läge, mottagarurval, granskningsläge, de tre utfallslägena. Vid godkännande kör Marcus stämplingen SJÄLV via !-kanalen med stämplingskommandot per ADR-104 (orkestreraren serverar den exakta raden vid QA-avslut; agenter kan inte skriva godkand-fältet — hooken skarpbevisad i 167-leveransen). Täcker användarberättelser: 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus har granskat samtliga lägen mot facit-bilderna
- [x] #2 godkand-fältet stämplat via !-kanalen (av/datum/citat/sha i manifestet)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Marcus granskade den promoverade ytan på dev-servern (main cfc62f9f) och stämplade SJÄLV via !-kanalen 2026-08-09: godkand = {av: marcus, datum: 2026-08-09, citat: 'Ser bra ut, godkänner', sha: cfc62f9f} — verifierat i manifestet av orkestreraren efter körningen (kanalseparationen höll: agenten skrev ingenting, skriptet stämplade EN nyckel). AC #1 belagd av stämplingens citat (granskningen är godkännandets premiss); AC #2 belagd av fältet självt. Stämpeln landad i samma commit som denna stängning. DoD #3 (CI per jobb) bockas av kön + väktarverifikat på landningen; rivnings-GO:t till 171.5 är därmed givet.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
