---
id: TASK-18.10
title: 'Skiva: Gruppdynamik'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
  - TASK-17.3
parent_task_id: TASK-18
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Gruppdynamik-avsnittet ände-till-ände: erfarenhetsmixens summeringsrad med sekventiell mätare och streck-rader, nivågrupper som accordions med vita personkort som bär per-person-kurshistorik i kursfärgs-tokensen med månad och år, samt motiveringarna som vita kort med Läs mer/Visa mindre där radbrytningar bevaras. Shape-utökning: Erfarenhetsbadge per deltagare, kurshistorik ur Deltaganden och motiverings-fälten (fälten FINNS i basen — K65-rättelsen; ren läsning). Kända luckor i badge-underlaget (T16) visas som de är — designas inte bort. Täcker användarberättelser: 25-27 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Gruppdynamik-shape-utökningen kontraktstestad
- [ ] #2 Mätaren, accordions och kurshistoriken i tokens-färgerna renderade mot facit-gruppdynamik-bilagan; Läs mer-beteendet bevisat i e2e
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
