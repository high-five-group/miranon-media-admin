---
id: TASK-298
title: 'Riktad baseline-dispatch: valfri spec-filter-input till visual-baselines.yml'
status: Done
assignee: []
created_date: '2026-08-22 18:00'
updated_date: '2026-08-22 19:33'
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
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
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

---

STÄNGNING 2026-08-22 (S109, bokföringspass — CI-svansen mätt, kortet sätts Done). Bygg-agenten lämnade kortet To Do därför att CI-svansen ägs av orkestreraren; här är den.

LANDNING: PR #1808, gren feat/riktad-baseline-dispatch, merge 52afa77ae20f9ec23e5abca760657a651dc1286c, mergedAt 2026-08-22T18:54:05Z.

DoD #3 — CI GRÖN PER JOBB, mätt jobb för jobb (gh pr checks 1808), inte som rollup:
- Lint + Audit + TypeCheck: pass (2m15s, job 97075522087)
- Test suite / Pure + Build: pass (45s)
- Test suite / Acceptance (hermetisk): pass (6m48s)
- Test suite / Acceptance — tvasidigt bevis (hermetik-sjalvtest): pass (6m58s)
- Test suite / Webblasarbeteende: pass (2m2s)
- Docs link check: pass (41s)
- Detect changed files: pass (12s) · CI Passed or Skipped: pass (4s)
- Analyze (actions): pass (39s) · Analyze (javascript-typescript): pass (1m8s) · CodeQL: pass
- Vercel: pass (deployment completed)
- Korrekt SKIPPING (ingen rörd staging-/a11y-yta): Test suite / A11y (axe-runner), Test suite / Staging (API + E2E), Test suite / Staging sentinel purge
Noll fällda jobb. Notera att den CI-wirade scope-sviten fyrade skarpt i lint-jobbet, precis som kortets eget AC #5-belägg säger: "test-visual-baselines-scope: 26/26 gröna".

DoD #2 — RÖRD FIL-KLASS, LOKALA GRINDAR OM-MÄTTA i denna worktree mot main 918b6576, exitkoder fångade separat (aldrig via pipe, L440):
- actionlint -color -ignore 'unexpected key "queue" for "concurrency" section' (CI:s exakta form): exit 0
- shellcheck --severity=style --enable=all scripts/visual-baselines-scope.sh scripts/test-visual-baselines-scope.sh: exit 0
- yamllint -c .yamllint.yml .github/workflows/visual-baselines.yml .github/workflows/ci.yml: exit 0
- bash scripts/test-visual-baselines-scope.sh: exit 0, 26/26 gröna
- npm run check:docs (markdown-klassen, CONTRIBUTING.md + T87 + kortet): se PR:en för detta bokföringspass
Diffen rör ingen src/-fil, så check-langa-streck.mjs är inte tillämplig. test:api ej körd — känd främmande röd på main (13 i api-staging, TASK-284-spåret, S110).

DoD #4 — INGA ORELATERADE FILER, hela filmängden i #1808 uppräknad och var och en i scope:
- .github/workflows/visual-baselines.yml (kortets yta) · .github/workflows/ci.yml (wiringen av scope-sviten)
- scripts/visual-baselines-scope.sh (grinden) · scripts/test-visual-baselines-scope.sh (tvåsidiga beviset, AC #5)
- CONTRIBUTING.md (dispatch-formen dokumenterad) · tasks/threads/T87-visual-grind-aktivering.md (trådens egen yta)
- backlog/tasks/task-298 (kortet, samma commit som koden)
Sju filer, noll orelaterade.

DoD #1 bockad som följd: samtliga fem AC var redan avbockade av bygg-agenten mot mätta belägg.
<!-- SECTION:NOTES:END -->
