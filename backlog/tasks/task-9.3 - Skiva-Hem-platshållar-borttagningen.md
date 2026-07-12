---
id: TASK-9.3
title: 'Skiva: Hem-platshållar-borttagningen'
status: To Do
assignee: []
created_date: '2026-07-12 10:16'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-9
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hem:s visuella 'Mina sidor'-platshållare (klass D, aldrig klickbar) tas bort — destinationen upplöstes när 'Mina sidor' omdefinierades till hela appen (ORDLISTA + T69 Revision S64). Beteendet ände-till-ände: Lotta ser ett hälsningskort utan död yta; inget i appen pekar längre mot en plats som inte finns. Oberoende av 9.1/9.2 — plockbar parallellt (T76-partitionsyta). Täcker användarberättelser: 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hem renderar INGEN 'Mina sidor'-platshållare; hälsningskortet och Hem i övrigt oförändrade mot K10-facitet
- [ ] #2 Öppen K10-facit-avvikelse bokförd i leveransen (kvitterad rivning av task-4 beslut 4 per T69 Revision S64 punkt 3; platsen konceptuellt reserverad för notis-klockan T77 — ingen ersättare byggs)
- [ ] #3 Hem-testerna synkade: platshållar-frånvaron assertad; Hem-e2e/axe gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot M6-facitet godkänd av Marcus (granskningsfärdigt läge per ADR-071 för UI-skivor)
- [ ] #6 Facit-paritet: renderad vy computed-verifierad mot M6-måtten (sessionsdok S64 Del 3)
<!-- DOD:END -->
