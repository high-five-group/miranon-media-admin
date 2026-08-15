---
id: TASK-217
title: Incheckningen loggar inte till aktivitetsloggen — verb-beslut + koppling
status: To Do
assignee: []
created_date: '2026-08-15 08:27'
labels:
  - needs-triage
dependencies: []
ordinal: 413000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur TASK-214.2 (2026-08-14): dörrlistans skrivväg (set-attendance-status + create-attendance) loggar INTE till aktivitetsloggen — PRD task-214 höll det utanför vertikalen med avsikt, och ett incheckningsverb är en ny post i aktivitetstyp-katalogen som task-201-familjens form kräver eget mandat för. Ingen mekanisk grind fäller i dag. Berör: människo-attribueringen (S103 Del 15 F5 väg a) förutsätter att aktivitetsloggen bär vem-gjorde-vad när den landar — utan incheckningsverb täcker den inte dörrflödet. Samordna med task-201-familjens ägare (S105/S106-spåret).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Beslut fattat (Marcus/spec): ska incheckning/urbockning bära egna verb i aktivitetsloggen, och i så fall vilka
- [ ] #2 Vid ja: verben tillagda enligt task-201-familjens form (eget mandat per verb) och mutationsvägen loggar via husets mönster
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
