---
id: TASK-9.3
title: 'Skiva: Hem-platshållar-borttagningen'
status: In Progress
assignee: []
created_date: '2026-07-12 10:16'
updated_date: '2026-07-12 13:59'
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
- [x] #1 Hem renderar INGEN 'Mina sidor'-platshållare; hälsningskortet och Hem i övrigt oförändrade mot K10-facitet
- [x] #2 Öppen K10-facit-avvikelse bokförd i leveransen (kvitterad rivning av task-4 beslut 4 per T69 Revision S64 punkt 3; platsen konceptuellt reserverad för notis-klockan T77 — ingen ersättare byggs)
- [x] #3 Hem-testerna synkade: platshållar-frånvaron assertad; Hem-e2e/axe gröna
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
K10-facit-avvikelse (ÖPPEN bokföring, AC 2): K10-facitet visar en 'Mina sidor'-platshållarknapp i hälsningskortet (task-4 beslut 4) — prod avviker nu MEDVETET: knappen är RIVEN, kvitterad rivning av task-4 beslut 4 per T69 Revision S64 punkt 3 ('Mina sidor' omdefinierades till hela appen i ORDLISTA:n; destinationen upplöstes). Platsen är konceptuellt reserverad för notis-klockan (T77) — INGEN ersättare byggd. Avvikelsen är även bokförd i Hem.tsx-huvudkommentaren (K10-facit-avvikelse-stycket) och bevakas av frånvaro-assertionen i tests/e2e/hem.staging.test.ts. Hälsningskortets mått oförändrade: Button sm (min-h-8 = 32 px) var LÄGRE än h1-raden (36 px) — h1 var höjdsättaren, kortet renderas identiskt minus knappen.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-12 13:59
---
Granskningsfärdig (ADR-071): levererad eddf928 → PR #52 → merge e747b85; CI grön per jobb first-pass (PR-run 29195184934 + main-run efter merge). DoD 5 väntar din design-review i browsern (Hem utan platshållaren — hälsningskortet måttidentiskt, h1 är höjdsättaren); DoD 6 (facit-paritet) prövas i samma granskning. K10-avvikelsen öppet bokförd i kortets notes per AC 2. AFK-proveniens: T76-piloten S65 fas 3, pipeline B agent B2, orkestrerad bokföring.
---
<!-- COMMENTS:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot M6-facitet godkänd av Marcus (granskningsfärdigt läge per ADR-071 för UI-skivor)
- [ ] #6 Facit-paritet: renderad vy computed-verifierad mot M6-måtten (sessionsdok S64 Del 3)
<!-- DOD:END -->
