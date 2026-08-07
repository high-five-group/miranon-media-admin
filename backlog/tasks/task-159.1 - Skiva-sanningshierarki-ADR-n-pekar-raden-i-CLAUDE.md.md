---
id: TASK-159.1
title: 'Skiva: sanningshierarki-ADR:n + pekar-raden i CLAUDE.md'
status: To Do
assignee: []
created_date: '2026-08-07 13:45'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-159
ordinal: 279000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en läsare som möter pekar-raden i CLAUDE.md når ADR:n och förstår ur EN källa vilken yta som äger vilken sanning, varför prosa aldrig är facit för läge, och varför inga nya grindar byggdes. Täcker användarberättelser: 1, 2, 3, 5, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: ADR-083, ADR-036, ADR-048 och hubbens SYSTEMET.md §0-post (7913c16) lästa i sin helhet; nästa ADR-nummer disk-verifierat vid byggtillfället — 099 är RESERVERAT för TASK-158.1 och tas ALDRIG
- [ ] #2 ADR:n bär samtliga sex element: domäntabellen · karta-inte-kopia · läsregeln (kod-verifiera före användning) · frys-banderoll-standarden · decline-rationale ×3 · ADR-083-relationen
- [ ] #3 Spoke-CLAUDE.md får EN pekar-rad till ADR:n under § Instruktioner — tabellen inlineas INTE
- [ ] #4 ADR-README-rad + rot-README-räkning stämmer; docs-grindarna gröna
- [ ] #5 PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → tillämpning är bindande: ADR-skivan landad före tillämpnings- och QA-skivorna exekveras
<!-- DOD:END -->
