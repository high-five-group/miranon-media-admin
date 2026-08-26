---
id: TASK-26
title: >-
  Fynd: CI laddar inte upp Playwright-artefakter — trace/screenshots från
  failade runs oåtkomliga i efterhand
status: Done
assignee: []
created_date: '2026-07-22 07:12'
updated_date: '2026-08-26 04:13'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75, diagnos-agenten för 18.8-studsen (gh run download → 'no valid artifacts found'); försvårade diagnosen — assertion-diffar fanns i loggen men trace/screenshots saknades.

Förväntat: e2e-jobben laddar upp playwright-report/trace vid failure (actions/upload-artifact med if: failure(), retention kort). Registrerat per fynd-regeln.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
REDAN LÖST — premiss-pass 2026-08-26 (S112 fix-våg 4, bunt A). Kortets påstående (CI laddar inte upp Playwright-artefakter vid fel) stämde vid skapandet 2026-07-22, men har sedan dess åtgärdats av tre separata landningar, verifierade mot origin/main (fetch 2026-08-26, HEAD 2fda2d78):

1. TASK-59.3 (PR #302, commit 109f8465): införde acceptance-jobbets steg "Ladda upp Playwright-artefakter vid rött" (upload-artifact@v7, if: failure()).
2. TASK-131 (commit 1956b1ee): samma mönster i webblasarbeteende-jobbet.
3. TASK-237/TASK-239 (commits 2eecc41d, ee22abbf, 32a3b2cf): utökade if-villkoret till failure() || cancelled() i alla fyra Playwright-bärande jobb.

Mätt i .github/workflows/ci-suite.yml (2026-08-26): fyra separata "Ladda upp Playwright-artefakter vid rött"-steg finns, ett per jobb — acceptance (rad ~352), acceptance-sjalvtest/hermetik-självtest (rad ~484), webblasarbeteende (rad ~579), test-staging e2e (rad ~740) — samtliga if: failure() || cancelled(), samtliga uses: actions/upload-artifact@v7, retention-days: 7. ci.yml anropar ci-suite.yml som reusable workflow (rad 1396), så PR-ytan täcks. Ingen kod ändrad — bevakning: grep -n "upload-artifact" .github/workflows/ci-suite.yml.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
REDAN LÖST — kortets påstående (CI laddar inte upp Playwright-artefakter vid fel) stämde vid skapandet 2026-07-22 men var redan åtgärdat innan detta pass (TASK-59.3/PR #302 m.fl.); oberoende verifierat mot origin/main 2026-08-26 av review-agenten (4 upload-artifact-steg, if: failure() || cancelled(), retention 7d, i ci-suite.yml). Ingen kod rörd i detta pass — endast bokföring. Landning: PR #1978. Done-flipp S112 resume 1, 2026-08-26, post-merge efa98ffe74a4 success.
<!-- SECTION:FINAL_SUMMARY:END -->
