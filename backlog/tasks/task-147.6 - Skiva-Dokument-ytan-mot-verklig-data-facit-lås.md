---
id: TASK-147.6
title: 'Skiva: Dokument-ytan mot verklig data + facit-lås'
status: To Do
assignee: []
created_date: '2026-08-10 07:02'
labels:
  - ready-for-human
dependencies:
  - TASK-146.4
  - TASK-146.5
parent_task_id: TASK-147
priority: high
ordinal: 343000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
T131-prototypen (src/components/dokument/DokumentYta.tsx, [PROTOTYPE] S100) skärps mot verkligt fundament: verklig lista i stället för stubbar, uppladdning + ersättning för klass A. Formfrågan (tre klass-grupper vs lista med filter) avgörs mot verklig datafördelning — prototypens egen docblock skjuter beslutet hit. Nattens agent-del: skärpningen + granskningsunderlag. Marcus-delen: formbeslut + facit-lås per promoveringskontraktet (ADR-102/103, plugin 1.33.0), stämpel via !-kanalen (ADR-104) — morgonmoment.

Stödjer användarberättelser 7–8 (bilageväljaren och Dokument-ytan är två vyer av samma objekt, PRD § Implementation Notes).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dokument-ytan visar verklig data ur fundamentet; uppladdning + ersättning fungerar (klass A)
- [ ] #2 Granskningsunderlag klart för Marcus formbeslut (grupper vs lista) med verklig fördelning synlig
- [ ] #3 Marcus facit-lås bokfört per promoveringskontraktet (stämpel via !-kanalen, ADR-104)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
