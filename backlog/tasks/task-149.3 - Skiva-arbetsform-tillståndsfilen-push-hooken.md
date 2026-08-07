---
id: TASK-149.3
title: 'Skiva: arbetsform-tillståndsfilen + push-hooken'
status: To Do
assignee: []
created_date: '2026-08-07 10:30'
labels:
  - ready-for-agent
dependencies:
  - TASK-149.1
parent_task_id: TASK-149
ordinal: 257000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en utförare i iterationsläge som försöker pusha stoppas i handlingsögonblicket med anvisningen lokal-commit-per-varv, oavsett vilken väg den kom in i arbetet; normalflödet utan tillståndsfil träffas aldrig. Täcker användarberättelser: 1, 2, 3, 8
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass mot live: PreToolUse-hook-indatans form för Bash-anrop verifierad mot aktuell harness-version; tillståndsfilens per-worktree-synlighet för hooken bevisad med minimalt test FÖRE full implementation
- [ ] #2 Tillståndsfil-konventionen: otrackad per-arbetsträd-fil (gitignore-post), innehåll arbetsform + tidsstämpel + sättare; skript i scripts/ med universell logik, värden i policy-konfig
- [ ] #3 PreToolUse-hook på Bash git push: nekar med anvisning när iterationsläge råder; frånvaro av fil = släpp igenom; fail-closed på korrupt fil; registrerad i .claude/settings.json
- [ ] #4 Tvåsidig testsvit i deny-familjens form: fäller/släpper/fail-closed; shellcheck-strict grön
- [ ] #5 Skarpbeviset bokfört som ÖPPEN SKULD i kortet och slutrapporten — aldrig rapporterat som taget
- [ ] #6 PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
