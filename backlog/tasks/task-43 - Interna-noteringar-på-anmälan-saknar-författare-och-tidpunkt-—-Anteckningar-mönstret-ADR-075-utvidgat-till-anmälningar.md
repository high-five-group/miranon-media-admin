---
id: TASK-43
title: >-
  Interna noteringar på anmälan saknar författare och tidpunkt —
  Anteckningar-mönstret (ADR-075) utvidgat till anmälningar
status: To Do
assignee: []
created_date: '2026-07-25 03:33'
labels: []
dependencies: []
ordinal: 104000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Per-anmälan-detaljvyn (task-18.17 byggkrav 10, S83-facit) visar interimet: basens odelade Notering-fält (EN anonym multilineText per Anmälan) renderas UTAN författarrad. Målbilden i facitet är NoteringsKort-listan (text + 'Författare · datum-tid' per post, skalar till många) — kräver Anteckningar-mönstret (ADR-075: additiv tabell, server-satt författare ur verifierad JWT) utvidgat till anmälningar. Förväntat: läs-/skriv-vertikal mot en anmälnings-kopplad anteckningsström + migreringsbeslut för dagens Notering-data (ADR-kandidat; bas-ändringen ADDITIV, staging först per ADR-063/ADR-050). Symptom idag: flera noteringar klumpas i ett fält utan attribution — 'vem sa detta, när?' kan inte besvaras. Fött ur task-18.17 (ADR-053: registrera, aldrig tyst).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
