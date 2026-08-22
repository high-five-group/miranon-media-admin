---
id: TASK-298
title: 'Riktad baseline-dispatch: valfri spec-filter-input till visual-baselines.yml'
status: To Do
assignee: []
created_date: '2026-08-22 18:00'
updated_date: '2026-08-22 18:36'
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
- [x] #5 Tvåsidigt bevis: CI-wirad testsvit som visar att grinden fäller när den ska OCH släpper igenom när den ska, plus skarpa dispatch-körningar (riktad + default)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TVÅSIDIGT BEVIS, MÄTT (2026-08-22).

LOKALT: scripts/test-visual-baselines-scope.sh 26/26 gröna (11 SIDA 1 fäller, 8 SIDA 2 släpper, 7 invarianter). Mutationer prövade skarpt — default-kommandot filtrerat -> fall 20 rött; råa inputen interpolerad i run-block -> fall 23 rött; argumentordningen omkastad -> fall 21 rött. Workflowen återställd och sviten grön efter varje.

CI (lint-jobbet, PR 1808, job 97074096416): 'test-visual-baselines-scope: 26/26 gröna' — sviten är wirad och fyrar fortlöpande.

SKARPA DISPATCHER (gh workflow run mot grenen):
- 32590344458 RIKTAD (personer-promoverings-grind) -> RÖD. Scope-grinden korrekt (SCOPE: RIKTAD, 1 spec, 16 tester) men bildgenereringen dog i CLI-parsningen: '-u, --update-snapshots [mode]' tar VALFRITT argument och läste filtret som LÄGE. ÄKTA FYND — uppdragets antagande att mönstret kan hängas på efter flaggan höll inte.
- 32590728520 RIKTAD efter fix (filtret FÖRE flaggan) -> GRÖN. 'Running 16 tests using 2 workers', '16 passed (21.3s)' av sviten 246. PR-steget fick SCOPE=riktad, FILTER=personer-promoverings-grind, ANTAL_TESTER=16, SPECFILER=visual/personer-promoverings-grind.spec.ts och rapporterade 'Inga baseline-ändringar (scope riktad)' — korrekt, specen är aria-only och har inga incheckade skärmbilder.
- 32590791821 SKRÄP (zzz-finns-inte) -> RÖD i scope-steget. Cache/Chromium/generering/PR-steg SKIPPED. Felet bär Playwrights eget svar plus 'Avbryter FÖRE bildgenereringen — ingen PR öppnas.'
- 32590836137 DEFAULT (ingen input) -> 'SCOPE: FULL', kommandot byte-identiskt utan filterargument, 'Running 246 tests using 2 workers', 238 passed / 8 failed på samma hem-familjer som baslinjemätningen 32587783890. Default-vägen oförändrad, mätt.

PR-TEXTEN: båda varianterna renderade lokalt ur workflowens egna rader med CI:s faktiska env-värden. Default-titeln byte-identisk med den gamla.
<!-- SECTION:NOTES:END -->
