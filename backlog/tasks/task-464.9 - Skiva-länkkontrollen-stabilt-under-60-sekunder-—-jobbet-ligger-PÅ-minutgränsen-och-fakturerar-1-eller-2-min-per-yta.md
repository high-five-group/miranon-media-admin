---
id: TASK-464.9
title: >-
  Skiva: länkkontrollen stabilt under 60 sekunder — jobbet ligger PÅ
  minutgränsen och fakturerar 1 eller 2 min per yta
status: To Do
assignee: []
created_date: '2026-09-19 10:49'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-464
priority: low
ordinal: 825000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-09-19 på #2572: 'Docs link check' tog 60 s (kö), 62 s (förslag) och 69 s (main) — alltså 1 eller 2 fakturerade minuter per yta beroende på slump. Stabilt under 60 s är värt ca 1 min x 3 ytor per dokumentlandning (870 dokumentlandningar i augusti). Mät först VAR tiden går (checkout, npm ci, lychee, övriga dokumentgrindar) ur jobbets steg-tider; välj sedan den minsta ändringen (cache, färre installerade paket i docs-jobbet, parallella steg inom jobbet). Inget skydd får tas bort: samma 16 dokumentgrindar ska köra. Går det inte att nå under 60 s utan att ta bort något: rapportera det som utfall — det är ett giltigt svar. Källa för besluten: tasks/sessions/2026-09-17-session-126.md Del 17 (grillad samsyn, Marcus kvittens 2026-09-19) + Del 11 (ledstjärnan). Underlag: docs/research/actions-minutbudget-2026-09-18.md. Varje faktapåstående här är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 1, 4.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Steg-tiderna för docs-jobbet redovisade före/efter (run-ID)
- [ ] #2 Tre dokumentkörningar i rad under 60 s per yta, ELLER ett mätt, skrivet skäl till varför det inte går utan att ta bort en grind
- [ ] #3 npm run check:docs kör samma grindar som före ändringen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 PR-kroppen bär sektionen 'Kostnad i två mått': VÄNTETID och FAKTURERADE MINUTER sida vid sida, mätta körningar med run-ID, enheter utskrivna, månadseffekt vid 1 279 landningar
<!-- DOD:END -->
