---
id: TASK-18.10
title: 'Skiva: Gruppdynamik'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 01:56'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AFK-BATCH MERGE-AGENT HALT (steg 5 — PR-CI-vakten per jobb) 2026-07-23. PR #88 skapad (branch task/18.10, head 7d4ddc86). PR-CI run 29972808069: jobbet 'Docs link check' RÖTT (completed failure). Rotorsak (markdownlint-cli2, lokalt reproducerad mot branch-filen): docs/specs/DESIGN-SYSTEM-SPEC.md:1275 — MD004/ul-style [Expected: dash; Actual: plus] + MD032/blanks-around-lists [Context: '+ nivastreck) som svarar pa...']. Den mjuk-radbrutna parentesen '(matar-segment + nivastreck)' la fragmentet '+ nivastreck)' vid radstart dar Markdown laser '+' som list-bullet -> mis-render + markdownlint-brott. Introducerat av branchens spec-edit (§17-tillagget); mains fil ren. Ovriga PR-jobb vid halt: Lint+Audit+TypeCheck gron, Detect changed files gron, Staging sentinel purge gron, Test+Build pagick (irrelevant — docs redan rott => rod overall). INGEN merge, main OrORD. Atgardsyta: fixa radbrytningen sa '+' inte hamnar vid radstart (t.ex. slut ihop raden eller byt '+' mot 'och'), pusha till branchen, kor om. Branch + PR #88 star kvar.
<!-- SECTION:NOTES:END -->

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
