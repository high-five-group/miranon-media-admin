---
id: TASK-158.6
title: 'Skiva: QA — sessionsdok-arkiveringen ände-till-ände'
status: To Do
assignee: []
created_date: '2026-08-07 12:32'
labels:
  - ready-for-human
dependencies:
  - TASK-158.1
  - TASK-158.2
  - TASK-158.3
  - TASK-158.4
  - TASK-158.5
parent_task_id: TASK-158
ordinal: 277000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan: (1) räkna rotens bestånd — ~10 stängda + paused/active, inget mer; (2) stickprov 5 omskrivna länkar från todo/BUILD-LOG/trådar → klicka i GitHub-vyn, alla når arkivet; (3) öppna claude.ai-projektkunskapen och sök ett arkiverat doks titel — noll träff (synk renad), sök ett rot-doks titel — träff; (4) verifiera nattnätets senaste körning grön med grind-steget närvarande; (5) läs ADR-041 → amenderings-blocket pekar på ADR-099; (6) kvittera att fönstertalet är läsbart i policy-konfigen. Täcker användarberättelser: 1, 2, 5, 6, 8
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Manuell vandring godkänd av Marcus
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->
