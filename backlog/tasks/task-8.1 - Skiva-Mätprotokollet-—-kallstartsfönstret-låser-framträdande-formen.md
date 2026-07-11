---
id: TASK-8.1
title: 'Skiva: Mätprotokollet — kallstartsfönstret låser framträdande-formen'
status: To Do
assignee: []
created_date: '2026-07-11 22:54'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-8
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mät det faktiska kallstartsfönstret och lås skelettets framträdande-form INNAN Hem-skivan byggs (grillad samsyn S63 Del 2 beslut 4 — mät-först, empiriskt i stället för antaget). Beteende ände-till-ände: mot deployade läs-EF:er görs hård omladdning med tom cache under prod-lika förhållanden; tiden från första render till data-släpp mäts (≥5 mätningar per dashboard-query, kallstart + varm EF separerade); utfallet prövas mot den käll-verifierade 1 s-tröskeln (NN/g 0,1/1/10 s + FK FLoader 1 s) och formen låses per samsynens regel: typiskt fönster KLART över 1 s → skeleton från första bildrutan; ofta under 1 s → framträdande-fördröjning ~1 s. Beslutet + metod + råvärden dokumenteras i skivans implementation notes OCH som kommentar på Hem-skivan (task-8.4) — substrat-buren kunskapsöverföring till nästa utförare (L266). Ingen produktkod ändras (read-only mätskiva). Täcker användarberättelser: 6 (underlag för 2, 5).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Kallstartsfönstret mätt prod-lika (tom cache, hård omladdning, ≥5 mätningar per dashboard-query) med metod + råvärden dokumenterade i skivans notes
- [ ] #2 Framträdande-formen låst per samsynens 1 s-regel och beslutet + motivering skrivet som kommentar på Hem-skivan (task-8.4)
- [ ] #3 Ingen produktkodsändring i diffen (mätskiva)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren av laddläget godkänd (per skiva med UI-yta; L220/L269)
- [ ] #6 Layout-skift ≈ 0 bevisad med renderad mätning före granskning (L245/L246; task-4.5-bevismönstret)
<!-- DOD:END -->
