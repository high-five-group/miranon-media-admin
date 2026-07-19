---
id: TASK-13
title: >-
  Fynd: CI kör EOL-Node — runtime-lyftet 20 → 24 LTS (.nvmrc + engines +
  @types/node i EN ändring)
status: Done
assignee: []
created_date: '2026-07-18 17:23'
updated_date: '2026-07-19 08:24'
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
- [x] #1 Node-versionen i .nvmrc är 24 LTS och CI:s samtliga setup-node-steg kör den
- [x] #2 engines + @types/node speglar 24 — typecheck 0 fel
- [x] #3 Full svit + bygge gröna lokalt och i CI per jobb
- [x] #4 Kompatibiliteten (Vite/Playwright/Biome mot Node 24) verifierad med källa vid utförandet
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S69 leverans: .nvmrc 20→24 · engines >=20→>=24 · @types/node ^25.6.2→^24.13.3 (spegel-principen från #46-stängningen: types följer runtime — medvetet NED från 25) · README-badgen >=20→>=24. CI:s 3 setup-node-steg läser node-version-file .nvmrc → följer automatiskt. KOMPAT KÄLL-VERIFIERAD (AC 4): nodejs/Release schedule.json — v24 Active LTS (LTS 2025-10-28, maintenance 2026-10-20, EOL 2028-04-30), v20 EOL 2026-04-30 bekräftad · Playwright system requirements: 'latest 22.x, 24.x or 26.x' — Node 20 UTE ur stödlistan (skärper motivet) · Vite: 'requires Node 20.19+, 22.12+' → 24 uppfyller · Biome: fristående binär, wrapper-engines >=14.21.3 (installerade paketets manifest). EMPIRI: Marcus lokala node är v24.13.1 sedan veckor — hela dagens gröna svit (296/296 ×2) och alla lokala grindar har redan körts på 24; lyftet stänger CI/lokal-driften. Lokala grindar på nya konfigurationen: typecheck 0 fel · Biome 0 fel (schema-drift-varningen i biome.json är pre-existerande från 2.5-bumpen, orörd av diffen — noterad) · audit-ci PASSED · build+SW grönt · test:api 296/296 (19,9 s). CI-benen i AC 1/3 bockas efter vaktens per-jobb-verifiering.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 0ef57f4 · CI-run 29679590743 per jobb · CI-grön-första-pass: ja · defekter under körning: 0 · TDD: ej tillämplig (runtime-/tooling-kort; bevisform = full svit + bygge på Node 24 lokalt [296/296 + build/SW + typecheck 0 fel] och i CI [Test+Build success; setup-node resolvade v24.18.0, jobblogg-verifierat])
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
