---
id: TASK-241.5
title: 'Skiva: WOW-övergången hem–sändyta'
status: To Do
assignee: []
created_date: '2026-08-16 23:06'
labels:
  - ready-for-agent
dependencies:
  - TASK-241.2
parent_task_id: TASK-241
ordinal: 459000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
US 9 är explicit acceptansyta (Marcus WOW-krav 2026-08-16 nära-verbatim i PRD:n): riktigt snygg övergång så Lotta känner WOW. Slutlig WOW-dom fälls av Marcus i QA-skivan. Täcker användarberättelser: 9.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Övergången hem till sändyta och tillbaka är en designad kontinuerlig transition — prototypens form (Modal 300ms/scale-98 + avslöj-animationen) är GOLV, inte tak; svepet känns som en fortsättning av Morgonkollen, aldrig ett sidbyte
- [ ] #2 prefers-reduced-motion neutraliserar hela transitionen
- [ ] #3 Sändytans laddlägen följer lugna laddläget (ADR-078 + DESIGN-SYSTEM-SPEC §15)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s102-svep-konvergens/facit.json (18 bilder) — renderad yta jämförd läge för läge
<!-- DOD:END -->
