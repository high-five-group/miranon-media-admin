---
id: TASK-232
title: >-
  Fynd: EventKey 11 på anmälan ID 868 (Allan Nieminen) - återfall av sanerad
  fälla 10/F.2
status: To Do
assignee: []
created_date: '2026-08-15 23:37'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 433000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bifynd ur TASK-229:s olänkade-svep (2026-08-16): anmälan ID 868 (Allan Nieminen, Rad skapad 2026-05-12) bär EventKey '11' - en återkommande instans av buggen i data-model.md §Kända fällor 10 / F.2 som sanerades 2026-04-26. Ny rad med felformen har alltså uppstått EFTER saneringen - antingen kör en formel/automation fortfarande den gamla logiken för vissa grenar, eller finns en oidentifierad skapandeväg. GÖR: (1) läs fälla 10/F.2:s historik i data-model.md, (2) rotorsak (vilken väg skapade raden med kort EventKey), (3) datafix av ID 868 i basen - PROD-WRITE kräver Marcus-GO, (4) uppdatera data-model.md-fällan med återfallsinstansen. Raden är också en av de 7 kvarvarande olänkade i 229-svepet - samordna.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rotorsaken till återfallet belagd eller öppet obestämbar med uteslutningar
- [ ] #2 ID 868 datafixad i basen efter Marcus-GO
- [ ] #3 Fälla 10/F.2 i data-model.md uppdaterad med återfallet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
