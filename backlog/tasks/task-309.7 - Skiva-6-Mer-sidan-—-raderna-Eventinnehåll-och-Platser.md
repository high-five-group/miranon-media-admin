---
id: TASK-309.7
title: 'Skiva 6: Mer-sidan — raderna Eventinnehåll och Platser'
status: To Do
assignee: []
created_date: '2026-08-23 14:27'
labels:
  - ready-for-agent
dependencies:
  - TASK-309.3
parent_task_id: TASK-309
ordinal: 568000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Roger och Lotta underhåller standardtexter per Event × Eventtyp och platsernas uppgifter på Mer-sidan, utan att röra redan skapade bilagor. Täcker användarberättelser: 18, 19, 29.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mer-sidans verktygsgrupp bär två nya rader bredvid Dokument: Eventinnehåll och Platser, med samma radform som grannarna (Del 2 § D beslut 10)
- [ ] #2 Eventinnehåll-ytan listar de sju kombinationerna och låter standardtexterna (inkl. agendan rad för rad) redigeras med samma block-dialog som genereringsvyn — ingen andra dialogform; sparar via skiva 2
- [ ] #3 Platser-ytan listar platser, låter adress/parkering/transport/kläder redigeras och nya platser skapas; sparar via skiva 2
- [ ] #4 Tillgänglighet 11 (fokusordning, etiketter, reduced-motion, prefers-contrast), acceptance-test per yta, ariaSnapshot
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->
