---
id: TASK-167
title: >-
  Godkännande-mekaniken byggs — facit:godkann-skriptet, hook-spärren och
  check-facit-invarianten (ADR-104)
status: To Do
assignee: []
created_date: '2026-08-08 18:48'
labels:
  - ready-for-agent
dependencies: []
ordinal: 310000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bygger ADR-104:s tre artefakter (G2-grillningen, S93 Del 14). (1) SKRIPTET npm run facit:godkann -- --pass <namn> --citat '...': stämplar godkand: {av, datum, citat, sha} i tasks/sessions/bilagor/<pass>/facit.json; stöd för undantags-form (yta + skäl) per ADR-104 beslut 1; körs av Marcus via !-prefixet (kanalseparation — skriptet får INTE anropas av agenter som godkännande-väg, men själva skriptet kan inte skilja anropare: spärren är hooken). (2) HOOKEN: PreToolUse-hook som nekar agent-skrivningar mot facit-manifestens godkand-fält, matchande Edit, Write OCH Bash (heredoc-kringgåendet är källbelagt; förlaga deny-backlog-direct-edit.sh men bredare tool-matchning); !-kanalen är mätt osynlig för hook-pipelinen (S93 Del 14) så Marcus väg behöver ingen särskiljare. (3) GRIND-INVARIANTEN i scripts/check-facit.sh: godkand: null ⇒ ytans variant-markörer måste finnas kvar i koden — rivning utan godkännande fäller CI (kopplas till ADR-103 B3 lager 2-scanningen; config-driven per Lesson #6, värden i .facit-policy.conf). Alla tre citerar ADR-104 som styrande huvud. TVÅSIDIG testsvit för samtliga tre (fäller/fäller-inte). SKARPBEVIS-SKULDEN: hooken kan INTE skarpbevisas i byggsessionen (L450) — logiken bevisas med testsvit + manuell skript-körning; skarpbeviset bokförs ÖPPET i slutrapport + kort som nästa sessions skuld, aldrig som gjort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skriptet stämplar korrekt schema inkl. undantags-form; felväg vid okänt pass/redan-satt fält
- [ ] #2 Hooken nekar Edit/Write/Bash-skrivningar mot godkand-fältet — tvåsidigt bevisad i testsvit + manuell körning; skarpbevis bokfört som öppen skuld
- [ ] #3 check-facit-invarianten fäller på riven markör med godkand: null och släpper igenom med satt fält — tvåsidigt bevisad
- [ ] #4 Samtliga tre artefakter citerar ADR-104; config-värden i .facit-policy.conf, ej hardkodade
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
