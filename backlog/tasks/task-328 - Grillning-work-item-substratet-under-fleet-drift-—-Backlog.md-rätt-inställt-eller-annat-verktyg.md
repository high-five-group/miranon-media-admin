---
id: TASK-328
title: >-
  Grillning: work-item-substratet under fleet-drift — Backlog.md rätt inställt
  eller annat verktyg?
status: To Do
assignee: []
created_date: '2026-08-26 05:02'
labels:
  - ready-for-human
  - grillning
dependencies: []
ordinal: 601000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus fråga 2026-08-26: 'kortskapandet är flaskhalsen... fel verktyg?' Underlag, VERIFIERAT mot docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md (543 rader, 10 huvudavsnitt): globalt create-lås i <git-common-dir>/backlog.md/locks/create, budget 30 s (rad 24-34) — SJÄLVUPPLEVT i denna session: ett enskilt kort tog 513 s (8,5 min) wall-clock att skapa under samtidig fleet-belastning, långt över budgeten, inklusive en 'Another task create/promote/demote operation is already in progress'-kollision följt av en process som stod i state U (uninterruptible sleep) i minst 2:38 innan den gick igenom. 2/8 lyckade vid 8 samtidiga med check_active_branches true, 8/8 utan (rad 209-210). Uppströms avvisar kollisionsfria ID:n, #711 (rad 38, 287, stängd 2026-07-10). Options-rymden (rad 315-380): 1) 1.50.1 + sänkt active_branch_days + mekaniserad grenstädning, 2) skanning av + kollisionsgrind vid landning (ADR-081-principen, 8/8 mätt, 6,5 s) — dokumentets starkaste kandidat FÖRE ett substratbyte, 3) GitHub Issues — starkaste LÅNGSIKTIGA kandidat om byte sker, 4) beads (avråds nu, öppen issue #4767 om tyst förlorade writes), 5) orkestrator-allokerade ID-block. Kortet är över ADR-baren (substratbeslut, svårt att återställa i koherens, 656 befintliga kortidentiteter i ADR:er/sessionsdok/commit-meddelanden — kostnaden av den ytan är ORÄKNAD enligt dokumentet, rad 507).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 grillning körd (/grill-me) till samsyn — dokumentets fyra styrfrågor (rad 495-507) besvarade: är kortets sanning tvungen att vara en fil i git-commit, accepterar vi landningstids-upptäckt i stället för skapande-förhindrande, hur många parallella agenter ska substratet bära, vad kostar 656 kortidentiteter vid byte
- [ ] #2 ADR mintad eller beslut bokfört med decline-rationale
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
