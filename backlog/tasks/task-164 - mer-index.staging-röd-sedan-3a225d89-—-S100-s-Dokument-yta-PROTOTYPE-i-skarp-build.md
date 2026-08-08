---
id: TASK-164
title: >-
  mer-index.staging röd sedan 3a225d89 — S100:s Dokument-yta [PROTOTYPE] i skarp
  build
status: To Do
assignee: []
created_date: '2026-08-08 17:10'
labels:
  - ready-for-agent
dependencies: []
ordinal: 307000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Testet mer-index.staging ('Mer-landningsytan ... ikoner chevron per rad') är deterministiskt rött i post-merge-körningarna 31250759317 och 31267199889. S93-handoffen (§ Paushistorik sjunde pausen) spårar det till 3a225d89 = [PROTOTYPE] [S100] Dokument-ytan på Mer-ytan (T131, 2026-08-07). HYPOTES, prövas av mottagaren (ADR-086): prototyp-ytan saknar DEV-grind och renderar därför i staging-bygget, vilket ändrar Mer-sidans radstruktur. Etablerat beslut styr fixen: ADR-103 beslut 3 (O3-flaggformen — central läspunkt + import.meta.env.DEV + referens-scanning) säger att prototyp-ytor ska vara DEV-grindade; bekräftar diagnosen hypotesen är fixen att grinda Dokument-ytan (den förblir synlig på dev-servern där prototyper granskas). Detta är S100:s yta — övertagen av S93-orkestreringen på Marcus GO 2026-08-08. Visar diagnosen något ANNAT än ogrindat prototyp-läckage (t.ex. att ytan avsiktligt ska synas i staging) ⇒ STOPPA och rapportera. Staging-e2e körs inte lokalt (5173-förbudet); post-merge-nätet är grinden.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Diagnosen fastställd: exakt varför mer-index-testet faller, mot 3a225d89:s faktiska diff
- [ ] #2 Fix landad enligt O3-flaggformen om hypotesen bekräftas (DEV-grind, prototypen kvar i dev)
- [ ] #3 Testet bevisat grönt i post-merge-körning på main
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
