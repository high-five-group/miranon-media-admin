---
id: TASK-82
title: >-
  Fynd: två guard-testsviter körs av inget CI-jobb — TASK-76:s fail-open-vakt
  bor i en av dem
status: To Do
assignee: []
created_date: '2026-07-29 09:02'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 162000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Repot har 15 guard-testsviter i `scripts/test-*`. **13 av dem är wirade i CI.** Exakt två är det inte:

- `scripts/test-purge-staging-sentinels.mjs` — INGEN referens i `.github/workflows/**` eller `package.json`
- `scripts/test-seed-review-fixture.mjs` — dito

Verifierat 2026-07-29 genom att korsa varje `scripts/test-*`-fil mot workflows + `package.json`.

### VARFÖR DET BLEV BÄRANDE JUST NU

`TASK-76` (purge-idempotensen) landar sin fail-open-vakt — AC #3: "404 som beror på fel bas eller fel tabell fäller FORTFARANDE" — som negativa testfall i `test-purge-staging-sentinels.mjs`. Vakten som skiljer en riktig fix från ett tyst hål bor alltså **helt och hållet i en svit som ingen kör automatiskt.**

Samtidigt gäller: `ci.yml` skickar sedan `TASK-70.3` `run_staging: false` villkorslöst, så purge-jobbet kör inte ens på PR-ytan. Purge-koden har därmed **noll automatisk täckning på PR-nivå** — varken sitt jobb eller sin testsvit.

### PRE-EXISTERANDE, MEN INTE DÄRFÖR OK

`TASK-50` bokförde frånvaron två gånger, medvetet. Det som ändrats är inte formen utan LASTEN: sviten bar tidigare beskrivande tester, den bär nu en fail-open-vakt. Ett medvetet designval fattat under andra förutsättningar är inte automatiskt giltigt under de nya.

### MÖNSTRET FINNS REDAN — DET ÄR INTE NY ARKITEKTUR

`nightly.yml:246` kör `node scripts/test-ci-metrics.mjs` — exakt formen som saknas här. `test-classify-post-merge.sh` är dessutom wirad i TVÅ workflows. Det finns alltså ingen designfråga att avgöra, bara en utelämnad rad.

### FORMFRÅGA SOM KORTET SKA AVGÖRA

Var hör de hemma? `ci.yml` (som de tretton andra), `nightly.yml` (som `test-ci-metrics.mjs`), eller båda? Väg mot: `test-purge-staging-sentinels.mjs` är hermetisk (mockat API, inga secrets) och kan därför köras i den billiga klassen; `test-seed-review-fixture.mjs` bör kontrolleras separat — kräver den staging-secrets hör den inte i PR-grinden.

**Avgränsning:** kortet wirar befintliga sviter. Det skriver INGA nya tester och ändrar inte purge-koden.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Båda sviterna körs av minst ett CI-jobb — jobbnamn och run-ID redovisat per svit
- [ ] #2 Placeringen motiverad per svit mot deras faktiska krav (hermetisk vs secrets-beroende); en svit som kräver staging-secrets hamnar INTE i PR-grinden
- [ ] #3 Tvåsidigt bevis: en medvetet bruten assertion i vardera sviten gör CI-jobbet RÖTT — run-ID per svit, sedan återställt
- [ ] #4 Ingen ny testfil och ingen ändring i purge-koden eller seed-skriptet — diffen rör wiring, inget annat
- [ ] #5 Kontroll att inga FLER scripts/test-*-sviter saknar hemvist efter ändringen — korsningen körd om och redovisad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
