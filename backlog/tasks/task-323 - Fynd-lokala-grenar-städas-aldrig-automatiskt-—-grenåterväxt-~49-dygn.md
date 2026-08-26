---
id: TASK-323
title: 'Fynd: lokala grenar städas aldrig automatiskt — grenåterväxt ~49/dygn'
status: To Do
assignee: []
created_date: '2026-08-26 04:47'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 596000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-310 (Done 2026-08-24) städade 289 -> 54 lokala grenar. Källmärkt (S112 resume 1, 2026-08-26): mätt i denna session, git branch --list mot huvudkatalogen (huvudkatalogens delade grenlista) gav 178 lokala grenar just nu — högre än forskningspassets 156 (docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md paragraf Återväxten, rad 249-255), konsistent med samma dokuments uppmätta nettotillväxt ~49 grenar/dygn (156 var 152 vid passets start, fyra nya under passets gång). git worktree remove rör aldrig grenen själv (bara worktree-kopplingen), så borttagna worktrees lämnar grenarna kvar. scripts/stada-grenar.sh VERIFIERAT existerande på disk (13533 bytes, körbar) men är INTE wirad till någon trigger — bekräftat av forskningsdokets egen rekommendation (paragraf Rekommendation, steg 1.3): 'Wira stada-grenar.sh till en automatik (post-merge eller nattlig). Skriptet finns och är testat; det saknar bara en trigger.' Grenpopulationens tillväxt äter kostnaden av check_active_branches-flaggan (TASK-93) inom två dygn per samma dokument.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 mekaniserad trigger vald med motiv (post-merge-hook, worktree-remove-städsteg i orkestrerar-svepet, eller heartbeat) — bara MERGADE grenar städas, aldrig -D på ej mergade
- [ ] #2 mätserie före/efter bokförd i kortet (grenantal vid start, grenantal efter aktivering, mätt över minst ett dygn)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
