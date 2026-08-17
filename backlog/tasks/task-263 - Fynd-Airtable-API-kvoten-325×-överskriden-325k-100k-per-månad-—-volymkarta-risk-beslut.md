---
id: TASK-263
title: >-
  Fynd: Airtable-API-kvoten 3,25× överskriden (325k/100k per månad) — volymkarta
  + risk-beslut
status: To Do
assignee: []
created_date: '2026-08-17 10:00'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 480000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-observation 2026-08-17 (Airtable settings): 325 048 publika API-anrop denna månad mot planens 100 000. Fungerar i dag = Airtables enforcement för betalplaner är mjuk — men det är deras policy, inte vår garanti; hård enforcement skulle stoppa staging-CI (nattliga sviter + sentinel-purge + seed/purge per PR) utan förvarning. UTREDNING: (a) mät volymen per källa (CI-jobb, nightly, MCP-läsningar, appen själv — Airtable-admin ger viss uppdelning; korsläs mot vår jobbfrekvens), (b) identifiera största förbrukarna och ev. lågt hängande minskningar (cache, färre polls, smalare fields-parametrar), (c) Marcus-beslut: acceptera nuläget öppet / minska volym / planuppgradering. Relaterar ADR-063 (basen förstklassig leverabel) och Fas E-migrationsspåret (Supabase tar över läsvägen på sikt).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Volymkartan mätt och bokförd (per källa, med metod)
- [ ] #2 Största förbrukarna + möjliga minskningar listade med uppskattad effekt
- [ ] #3 Marcus-beslut bokfört (acceptera/minska/uppgradera) med motivering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
