---
id: TASK-186
title: >-
  Kör arkiverings-svepet: sessions-roten bär 2 kandidater utanför fönstret — nya
  nightly-grinden larmar tills det görs
status: To Do
assignee: []
created_date: '2026-08-10 11:43'
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
- [ ] #1 Svepet kört; check-sessionsdok-fonster.sh exit 0 mot orörd policy
- [ ] #2 Länk-omskrivningen verifierad (inga brutna inlänkar, lychee/docs-grindarna gröna)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
