---
id: TASK-266
title: >-
  Förberedelseskärmens höjdkedja kollapsad — centrering sker i 176px-låda,
  min-h-dvh-vägen väljs
status: To Do
assignee: []
created_date: '2026-08-17 10:15'
labels:
  - ready-for-human
dependencies: []
priority: high
ordinal: 482000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-261-agentens skarpa browsermätning (2026-08-17): viewport 720 px men html/body/#root/container alla 176 px — base.css:19–23 sätter html/body utan height och #root saknar CSS-regel, så Forberedelseskarm.tsx:183:s h-full/justify-center centrerar i en kollapsad låda högst upp (Marcus live-observation: logo+loadingbar ocentrerade). SEPARAT rot från 261-blinket. Ytan är ADR-112-/TASK-242-styrd (tätt specat layoutankare) — därför väg-val, inte solofix. REKOMMENDATION: viewport-baserad min-h-dvh per login.tsx-mönstret (mätt immun). Marcus GO på vägen → agent bygger.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Väg vald öppet mot ADR-112/TASK-242:s layoutankare (rekommendation: min-h-dvh per login.tsx)
- [ ] #2 Centreringen verifierad i skarp browsermätning (container == viewport-höjd) i login-monteringen
- [ ] #3 Regressionstäckning (mätmetoden ur 261: setInterval-polling via console)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
