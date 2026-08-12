---
id: TASK-186
title: >-
  Kör arkiverings-svepet: sessions-roten bär 2 kandidater utanför fönstret — nya
  nightly-grinden larmar tills det görs
status: Done
assignee: []
created_date: '2026-08-10 11:43'
updated_date: '2026-08-12 04:06'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 352000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur S102-batchen (kort ⑨, 158.4): grinden check-sessionsdok-fonster.sh fann ÄKTA drift — tasks/sessions/-roten bär 2 arkiv-kandidater (2026-07-25-session-85.md + -86.md) eftersom sessionstakten fortsatt sedan 158.3:s engångsmigrering. Från och med nu larmar nightly varje natt tills svepet körs. Åtgärd: scripts/arkivera-sessionsdok.sh --utfor (fönsterregeln + atomisk länk-omskrivning per 158.2) + verifiera grinden grön efteråt. OBS ADR-048-synkhorisonten: arkiverade dok lämnar claude.ai-synken by design.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Svepet kört; check-sessionsdok-fonster.sh exit 0 mot orörd policy
- [x] #2 Länk-omskrivningen verifierad (inga brutna inlänkar, lychee/docs-grindarna gröna)
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
AC #1: svepet kört 2026-08-11 (S102) — 2 arkiverade (s85+s86 → archive/2026-07/), 9 länkomskrivningar Pass A, policy orörd; check-sessionsdok-fonster.sh exit 0 GRÖNT. AC #2: check:docs 14/14 gröna lokalt (inkl länk-grindarna); shellcheck OK på rörda ci-wait.sh/test-ci-wait.sh. Flaggade (fail-closed) 3 dok orörda by design.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Svepet kört 2026-08-11 (S102-resume): s85+s86 → archive/2026-07/, 9 länkomskrivningar, policy orörd. Fönster-grinden exit 0, check:docs 14/14, shellcheck OK. Landat via PR #1164 (merge f5be8d1c), kön grön. Natt-larmet Sessionsdok-fönstret tystnar från och med i natt.
<!-- SECTION:FINAL_SUMMARY:END -->
