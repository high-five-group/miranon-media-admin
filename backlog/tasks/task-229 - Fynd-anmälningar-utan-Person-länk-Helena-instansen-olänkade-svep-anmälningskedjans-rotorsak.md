---
id: TASK-229
title: >-
  Fynd: anmälningar utan Person-länk - Helena-instansen, olänkade-svep +
  anmälningskedjans rotorsak
status: To Do
assignee: []
created_date: '2026-08-15 22:59'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 431000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Lotta-vandringen punkt 7 (Marcus 2026-08-16): Helena Skoglunds RIM 3-anmälan (rec1ft7CDqLJwZw9V, ID 911, EventKey Event-25, skapad 2026-06-29 via Huvudformulär) saknar Person-länk i prod - MCP-verifierat: personposten recoFAXvbggTQ8WrL finns med samma e-post, Antal genomförda event 3 och de tre ÄLDRE anmälningarna länkade; anmälningskedjans automatiska person-länkning missade den nya. Frontendkonsekvens: antalGenomfordaEvent blir null (Registration.ts-kontraktet) och deltagarkortets historikrad utelämnas (Deltagare.tsx rad ~910). RESOLUTION I BASEN per ADR-063, tre delar: (1) DATAFIX Helena: länka anmälan till personposten - PROD-WRITE, kräver Marcus-GO, utförs HITL eller av agent efter GO; (2) SVEP: räkna ALLA anmälningar utan Person-länk i prod (read-only) och rapportera lista + mönster (datum-fönster? formulär-väg?); (3) ROTORSAK: varför missade kedjan denna rad (automation-status via claude.ai-Airtable-connectorn - list_automations; jämför rad-skapad-datum mot automationens historik). Kortdesign-frågan (låst korthöjd vid null) är SEPARAT och ligger hos Marcus - inte i detta kort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus-GO inhämtat och Helena-anmälan länkad till rätt personpost, verifierad i appen (historikraden syns)
- [ ] #2 Olänkade-svepet rapporterat med antal + lista + mönsteranalys
- [ ] #3 Rotorsaken belagd eller öppet bokförd som obestämbar med vad som uteslutits
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
