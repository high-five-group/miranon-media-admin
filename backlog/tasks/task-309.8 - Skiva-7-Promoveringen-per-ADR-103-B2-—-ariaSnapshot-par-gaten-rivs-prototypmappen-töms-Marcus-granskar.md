---
id: TASK-309.8
title: >-
  Skiva 7: Promoveringen per ADR-103 B2 — ariaSnapshot-par, gaten rivs,
  prototypmappen töms, Marcus granskar
status: To Do
assignee: []
created_date: '2026-08-23 14:30'
updated_date: '2026-08-23 20:11'
labels:
  - ready-for-human
dependencies:
  - TASK-309.6
  - TASK-309.7
parent_task_id: TASK-309
ordinal: 569000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den godkända formen blir den enda formen: flaggor och växlar rivs mekaniskt, formen rörs inte, och Marcus ser samma yta som i sista konvergensvarvet — nu mot riktig data. Bygget är AFK; granskningen och godkännandet är Marcus (därav ready-for-human). Täcker användarberättelser: 21, 22, 23.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ariaSnapshot-par taget i variant-läge FÖRE flippen för båda mallarnas genereringsvy och listvyn; paret fäller på varje skillnad mot den promoverade ytan EFTER (ADR-103 B4)
- [x] #2 DEV-gaten och ?variant=a rivna; GenereringsPrototyp blir GenereringsVy bredvid DokumentYta; prototyp-mappen tom; listvyns handkopierade klasser ersatta av DokumentYta:s komponenter; MALL_META.fastForm städad; prototyp-markörerna borta ur manifestet (referens-scanningen grön)
- [ ] #3 Den promoverade ytan är identisk med den körande prototypen i lägena: lista · generering bekräftelse · generering deltagarinfo · block-dialog (text, agenda, datum, plats) · efter Skapa (ADR-102: facit saknas för S108 — prototypen i sitt sista godkända varv är facit tills skiva 9 låser det)
- [ ] #4 Marcus granskar den promoverade ytan mot staging på tillåten origin och godkänner i klartext (HITL)
- [ ] #5 Ny visuell baslinje tas EFTER godkännandet, aldrig före
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
