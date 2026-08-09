---
id: TASK-152
title: >-
  Fynd: 264 mergade lokala grenar utan städmekanism — paus-svepet städar
  worktrees men aldrig grenar
status: Done
assignee: []
created_date: '2026-08-07 10:51'
updated_date: '2026-08-09 08:09'
labels:
  - ready-for-agent
dependencies: []
ordinal: 264000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Symptom: 264 av 283 lokala grenar är redan mergade i main och växer session för session (S98 noterade 213 två dagar tidigare); worktree-svepet vid paus rör kataloger men inte grenar, och ingen mekanism i scripts/ eller dokumentationen adresserar grenstädning. Förväntat: ett städsteg i paus-rutinens svep som håller gren-listan i paritet med worktree-hygienen. Funnet i S99 uppdrag 3-svepet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: git branch --merged main räknad vid byggtillfället; worktree-städningens faktiska scope läst i session-paus-skillen/skripten
- [x] #2 Grenstädnings-steg byggt enligt repots skript-konvention (universell logik + policy-konfig): raderar lokala grenar mergade i main, skyddar aktiva worktree-grenar + konfigurerbar skyddslista; torrkörnings-läge default
- [x] #3 Tvåsidig testsvit (raderar mergad gren · skonar omergad · skonar worktree-bunden · skonar skyddslistad); shellcheck-strict grön; PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad via PR #868 (merge 6d6ac7b8), kö-CI grön. stada-grenar.sh + conf + testsvit 17/17; torrkörning fann 252 kandidater. Hub-integration (paus-svepet) bokförd som uppföljning — ingår i 158-arbetet eller eget kort.

[TASK-169, backlog-städet, 2026-08-09] AC#3+DoD#1-4 bockade mot belägg. AC#3/DoD#2: test-svit körd live nu — samtliga 16 påståenden Fas 1-3 gröna, exit 0; statisk lint-analys på stada-grenar.sh + test-stada-grenar.sh gav exit 0. DoD#3: PR #868 (merge 6d6ac7b8, 2026-08-07T11:38:54Z) — Lint+Audit+TypeCheck, Pure+Build, Acceptance, Webblasarbeteende, Docs link check samtliga SUCCESS. DoD#4: diff = ci.yml, .stada-grenar-policy.conf, scripts/stada-grenar.sh, scripts/test-stada-grenar.sh, kortfilen — inga orelaterade filer.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
