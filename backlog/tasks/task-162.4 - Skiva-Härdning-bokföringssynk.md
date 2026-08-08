---
id: TASK-162.4
title: 'Skiva: Härdning + bokföringssynk'
status: To Do
assignee: []
created_date: '2026-08-08 07:43'
labels:
  - ready-for-agent
dependencies:
  - TASK-162.2
  - TASK-162.3
parent_task_id: TASK-162
ordinal: 304000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Härdningen efter flipparna (T6-kraven ur ADR-103): tillgänglighetsbeviset på promoverade ytor, bokföringssynken av korten som promoveringsordningen omdefinierar, och död-kod-kontrollen efter de borttagna grenarna. Täcker användarberättelser: 12 (förberedelsen).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Axe-pass på de promoverade ytorna: 0 violations — nivå 11 består
- [ ] #2 DoD-posten om visual-baslinjen på TASK-145.3 och TASK-145.5 omskriven via CLI till: baslinje omtagen EFTER godkänd promovering
- [ ] #3 TASK-145.6 omdefinierad via CLI per ADR-103: riv flaggan/variant-maskineriet efter godkänd promovering + dra regressionslåsets baslinje; fortsatt blocked
- [ ] #4 Död-kod-koll efter flipparna: inga föräldralösa exporter ur de borttagna grenarna (mätt och bokfört i skivans PR)
- [ ] #5 Samtliga sviter gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: inga protoDataMode-grenar flippade
<!-- DOD:END -->
