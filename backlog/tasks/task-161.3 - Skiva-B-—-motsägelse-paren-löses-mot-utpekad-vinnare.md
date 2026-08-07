---
id: TASK-161.3
title: 'Skiva: B — motsägelse-paren löses mot utpekad vinnare'
status: To Do
assignee: []
created_date: '2026-08-07 19:04'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.2
parent_task_id: TASK-161
ordinal: 293000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: två styrande ytor kan inte längre säga olika saker om samma kunskapsklass — varje f.d. par har EN källa och pekare. Täcker användarberättelse: 3
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga elva Ö-par ur Explore-kartan lösta: vinnaren är den yta ADR-100:s domäntabell pekar ut (fas-status: byggplan §2 vinner, CLAUDE.md-pekaren rättas; operations-registret: SECURITY-SPEC-formen vinner, airtable-interaction-tabellen blir pekare; sanningshierarkins tre versioner: ADR-100 är källan, hub-§0 och CLAUDE.md-parentesen blir pekare; kvalitetsribban: CLAUDE.md-tabellen förblir bärare tills KVALITETSDEFINITIONER fylls — pekaren dit får öppen deferral-markering; övriga par per kartans facit)
- [ ] #2 Förloraren i varje par ELIMINERAS eller blir explicit karta med pekare — aldrig en kvarlämnad andra sanning; hub-sidans Ö8-rader lämnas till hub-skivan
- [ ] #3 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
