---
id: TASK-397
title: >-
  Fynd: .worktreeinclude saknar .env.docraptor — worktree-isolerad agent kan
  inte köra npm run mall:pdf
status: To Do
assignee: []
created_date: '2026-09-04 12:58'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 691000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sidofynd från bygg-agenten på PR #2295 (2026-09-04, bekräftat oförändrat i PR #2295 runda 2 fynd 4).

En worktree-isolerad agent kan inte köra `npm run mall:pdf` (DocRaptor-mätning mot förlagorna, se CLAUDE.md § Bilagemallarnas FÖRLAGOR) eftersom `.env.docraptor` inte kopieras till worktreen — `.worktreeinclude` saknar raden. Verifierat: `grep -i docraptor .worktreeinclude` gav exit 1 (ingen träff) vid PR #2295:s granskad-SHA.

Källa: PR #2295 Riskbedömnings-sektion runda 2 fynd 4; `.worktreeinclude` (rot).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Lägg till .env.docraptor i .worktreeinclude
- [ ] #2 Verifiera i en NY worktree att filen faktiskt kopieras (skapa en testworktree, kontrollera att .env.docraptor finns, städa worktreen)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
