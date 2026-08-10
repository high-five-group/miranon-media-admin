---
id: TASK-147.7
title: 'Skiva: Kvittogenereringen med nummerserien'
status: To Do
assignee: []
created_date: '2026-08-10 07:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.5
parent_task_id: TASK-147
priority: high
ordinal: 344000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Kvittot genereras ur betalningsdata som klass C-bilaga — en PDF per mottagare, via singelloop-grenen. Räknaren bor i basen (additivt, ADR-063), numret allokeras server-side vid genereringen, formatet synligt avgränsat från Rogers serie (eget prefix + löpnummer + årssuffix, start skild från ett). En betalning kvitteras i exakt ETT system. Egen ADR mintas för nummerserien (klarar ADR-baren per PRD § ADR-koppling).

FÖRKRAV (PRD DoD 10): Roger-avstämningen om kvittogränsen bokförd FÖRE bygget — de fem frågorna står i sessionsdok S102; Marcus tar dem med Roger i dag.

Täcker användarberättelser: 20, 21, 22, 23, 24.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Roger-avstämningen bokförd i kortets notes (fem frågorna besvarade, eller Marcus-beslut med efterhandsbekräftelse öppet bokförd)
- [ ] #2 Kvittonummer: unikhet under samtidighet bevisad + ingen retroaktiv omnumrering + server-side-allokering
- [ ] #3 Kvitto-PDF genereras per mottagare och bevisas FRAMME som bilaga
- [ ] #4 ADR för nummerserien mintad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Kvittonummer: unikhet + beständighet + server-side bevisad (PRD DoD 8-arv)
- [ ] #6 Roger-avstämningen bokförd före kvitto-skivan låses (PRD DoD 10-arv)
<!-- DOD:END -->
