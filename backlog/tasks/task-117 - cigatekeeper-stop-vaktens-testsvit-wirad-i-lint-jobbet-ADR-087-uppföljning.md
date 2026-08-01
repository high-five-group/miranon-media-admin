---
id: TASK-117
title: >-
  ci(gatekeeper): stop-vaktens testsvit wirad i lint-jobbet (ADR-087
  uppföljning)
status: Done
assignee: []
created_date: '2026-08-01 21:54'
updated_date: '2026-08-01 22:25'
labels:
  - ready-for-agent
dependencies: []
ordinal: 189000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bakgrund: ADR-087 (§ Ärliga svagheter, punkt 8) bokför att scripts/test-stop-vakt.sh är körbar i repot men owirad i CI. Sessionsdok tasks/sessions/2026-07-26-session-91.md rad 7973-7974 bokför uppföljningen: "Stop-vaktens svit in i ci.yml-gatekeepern (bokförd uppföljning, ci.yml var upptagen)". Verifierat 2026-08-01: grep -n stop-vakt .github/workflows/ci.yml gav noll träffar innan detta kort.

Sviten (scripts/test-stop-vakt.sh, 16/16 PASS, TASK-113-leveransen PR #551) är en snabb lokal svit utan nätverkstrafik - samma klass som övriga skript-sviter i lint-jobbets steg "Test gatekeeper script suites", inte staging-vägen. Mönster-precedent: PR #525 wirade backlog-grindens svit i samma steg (bash scripts/test-check-backlog-closure.sh).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sviten bash scripts/test-stop-vakt.sh körs som en rad i ci.yml:s lint-jobb, steget Test gatekeeper script suites
- [x] #2 Kommentarsblocket ovanför run:-raden dokumenterar varför (kadens-skäl, samma mönster som de andra sviterna i samma steg) och den lokalt uppmätta körtiden
- [x] #3 actionlint (CI:ts exakta ignore-flagga) grönt på ci.yml
- [x] #4 Ingen listparitets-regression: verifierat att docs-grindar-paret (check-[a-z0-9-]+.sh-regex) inte matchar test-stop-vakt.sh och därmed inte påverkas
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
PR #563 (merge 9f45d3c0db6e6f40b3c77059d33c462006013667, merge queue): merge_group-run 30720678996 grön per jobb — Lint+Audit+TypeCheck: success, Detect changed files: success, Docs link check: success, Test suite/Acceptance (hermetisk): success, Test suite/Pure+Build: success, Test suite/A11y (axe-runner): skipped, Test suite/Staging sentinel purge: skipped, Test suite/Staging (API+E2E): skipped, CI Passed or Skipped: success. Stop-vakt-svitens LEVANDE bevis (ej bara wiring): lint-jobbets steg 'Test gatekeeper script suites' (job 91423819643) körde bash scripts/test-stop-vakt.sh 22:10:45Z, producerade dess 16 fallspecifika testfall (T1 RÖD SIDA/väntepåstående FÄLLS, T2 GRÖN SIDA släpps, T5 stop_hook_active genomsläpp, T8 undantag strippas/fälls, T9 engelskt väntepåstående fälls, T12 fail-closed, T13 degraderad frisläppning m.fl.) och avslutade RESULT: 16/16 PASS, 0 FAIL kl 22:11:06Z — bidirektionellt bevis (fäller planterat fel, släpper korrekt avslut). Diff = .github/workflows/ci.yml + task-117-kortet, 2 filer, inga orelaterade. AC 1-4 avbockade av byggagenten; DoD 1-4 avbockade här av stängningsbatchen.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147): actionlint, bash scripts/test-stop-vakt.sh
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
