---
id: TASK-148.2
title: >-
  Skiva: PreToolUse-spärren — Monitor och run_in_background nekas i
  subagent-kontext
status: To Do
assignee: []
created_date: '2026-08-07 09:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-148.1
parent_task_id: TASK-148
ordinal: 248000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en subagent som försöker gå in i asynkron väntan (Monitor eller run_in_background) får ett mekaniskt nej med skäl i anropsögonblicket; huvudsessionens egna async-mönster påverkas inte. Fullföljer harnessens eget mönster (fyra async-verktyg redan strukturellt borttagna ur subagenter). Täcker användarberättelser: 1, 2, 3, 8
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass mot LIVE miljö: agent_id-fältet i hook-indata, Monitor i subagentens verktygslista och aktuell harness-version omverifierade mot förstapartsdokumentation/kod; avvikelse mot uppdragets premisser → stanna och flagga
- [ ] #2 Minimalt test FÖRE full implementation: skriptet körd manuellt med syntetisk subagent-JSON (agent_id satt) respektive huvudsessions-JSON — deny/allow bevisat åt båda håll
- [ ] #3 Skript i scripts/ med universell logik; värdena i egen policy-konfig; registrering i .claude/settings.json på PreToolUse med matchning för Monitor-verktyget och Bash med run_in_background
- [ ] #4 Tvåsidig testsvit i test-deny-familjens form: fäller-fall (Monitor+agent_id, run_in_background+agent_id), släpper-fall (samma utan agent_id, orelaterade verktyg), fail-closed-fall (oparsbar indata)
- [ ] #5 Skarpbeviset bokfört som ÖPPEN SKULD i kortet och slutrapporten (hook registrerad mitt i session laddas inte) — aldrig rapporterat som taget
- [ ] #6 shellcheck-strict grön; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
