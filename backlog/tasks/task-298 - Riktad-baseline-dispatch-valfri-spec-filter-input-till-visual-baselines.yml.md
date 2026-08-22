---
id: TASK-298
title: 'Riktad baseline-dispatch: valfri spec-filter-input till visual-baselines.yml'
status: To Do
assignee: []
created_date: '2026-08-22 18:00'
updated_date: '2026-08-22 18:16'
labels: []
dependencies: []
ordinal: 540000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Baslinje-workflowen är allt-eller-inget: en enda familjs röda test blockerar hela födseln (run 32587783890 — 238 passed, 8 failed i hem-familjen, ingen PR skapad). Ge visual-baselines.yml en VALFRI workflow_dispatch-input som begränsar körningen till namngivna specar, utan att riva GITHUB_TOKEN-formen eller approval-grinden.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Default oförändrat: dispatch utan input kör byte-identiskt kommando som idag (hela sviten) och ger byte-identisk PR-titel
- [x] #2 PR-texten visar scopet: en riktad körning märks i BÅDE titel och kropp, med filtret och de faktiskt körda spec-sökvägarna utskrivna
- [x] #3 Fail-closed på skräp-input: ogiltig teckenuppsättning, ledande bindestreck, för lång sträng eller noll matchande specar avbryter FÖRE bildgenereringen med tydligt fel — aldrig tom PR, aldrig tyst full körning
- [x] #4 Approval-grinden orörd: GITHUB_TOKEN-formen, permissions-blocket och concurrency-gruppen oförändrade; inputen når aldrig ett skal som kan tolka den
- [ ] #5 Tvåsidigt bevis: CI-wirad testsvit som visar att grinden fäller när den ska OCH släpper igenom när den ska, plus skarpa dispatch-körningar (riktad + default)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
