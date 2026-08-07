---
id: TASK-160.2
title: 'Skiva: PreCompact-grinden — deny-familjen'
status: To Do
assignee: []
created_date: '2026-08-07 16:54'
labels:
  - ready-for-agent
dependencies:
  - TASK-160.1
parent_task_id: TASK-160
ordinal: 284000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: ett kompakterings-försök i en session där läget inte är säkrat i fil stoppas i handlingsögonblicket med anvisningen att köra pre-compact-skillen; ett kontrollerat försök med färsk markör släpps igenom. Täcker användarberättelser: 1, 2
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass mot live: PreCompact-hook-indatans form (trigger-fältet manual/auto) verifierad mot aktuell harness-version FÖRE full implementation
- [ ] #2 Hook + policy-conf i deny-familjens form: trigger auto nekar ALLTID med anvisning som pekar på pre-compact-skillen; trigger manual nekar om markörfilen saknas eller är äldre än policyns färskhetsfönster (~15 min); fail-closed på korrupt markör; frånvaro av markör vid manual = neka (grinden är motsatsen till arbetsform-push-grindens frånvaro-släpp — markören är ett AKTIVT bevis)
- [ ] #3 Tvåsidig testsvit i deny-familjens form (fäller/släpper/fail-closed mot fixtur); shellcheck-strict grön mot CI-pin; registrerad i settings
- [ ] #4 Skarpbevis-skulden ÖPPET bokförd i kortet och slutrapporten med differentialreceptet — ALDRIG rapporterad som tagen (hooken kan inte laddas i byggsessionen)
- [ ] #5 PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
