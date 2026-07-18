---
id: TASK-13
title: >-
  Fynd: CI kör EOL-Node — runtime-lyftet 20 → 24 LTS (.nvmrc + engines +
  @types/node i EN ändring)
status: To Do
assignee: []
created_date: '2026-07-18 17:23'
labels: []
dependencies: []
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (S67 dependabot-passet): .nvmrc=20 och engines '>=20' — Node 20 'Iron' gick EOL 2026-04-30; CI:s samtliga jobb (setup-node läser .nvmrc) kör alltså EOL-runtime sedan april. Marcus lokala node är v24.13.1 — CI/lokal-drift föreligger redan. Dessutom types-drift: @types/node@25.x i manifestet speglar varken CI-runtimen (20) eller lokala (24). Dependabot-PR #46 (@types/node 26) STÄNGD med motiv — types ska spegla runtime, inte springa före. FÖRVÄNTAT BETEENDE: ett medvetet runtime-lyft i EN sammanhållen ändring: (1) .nvmrc 20 → 24 (aktiv LTS; EOL april 2028), (2) engines '>=24', (3) @types/node → ^24, (4) full svit + bygge + CI grönt, (5) verifiera Vite/Playwright/Biome-kompatibilitet med Node 24 (alla stödjer det — web-verifiera vid utförandet), (6) README/CONTRIBUTING-not om Node-kravet om sådan finns. UTFÖRARE: research-pass först (branschform: matcha CI mot aktiv LTS; verifiera inga native-deps bryter), sedan mekanisk ändring. Klassning: underhålls-skuld, ej akut (runnern är sandboxad) men 11/10-baren tål inte EOL-runtime i CI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Node-versionen i .nvmrc är 24 LTS och CI:s samtliga setup-node-steg kör den
- [ ] #2 engines + @types/node speglar 24 — typecheck 0 fel
- [ ] #3 Full svit + bygge gröna lokalt och i CI per jobb
- [ ] #4 Kompatibiliteten (Vite/Playwright/Biome mot Node 24) verifierad med källa vid utförandet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
