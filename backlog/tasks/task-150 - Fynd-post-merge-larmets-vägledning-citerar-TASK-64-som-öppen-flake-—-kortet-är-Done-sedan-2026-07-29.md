---
id: TASK-150
title: >-
  Fynd: post-merge-larmets vägledning citerar TASK-64 som öppen flake — kortet
  är Done sedan 2026-07-29
status: To Do
assignee: []
created_date: '2026-08-07 10:50'
updated_date: '2026-08-07 11:02'
labels:
  - ready-for-agent
dependencies: []
ordinal: 262000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Symptom: .github/workflows/post-merge.yml rad ~485 skriver i varje rött post-merge-ärende att Acceptance-flaken är 'TASK-64, öppen och obelagd' — kortet är Done (2026-07-29, AC 2 BEKRÄFTAD MED BELÄGG) och klass B-resten har eget Done-kort TASK-74. Förväntat: larmtext som speglar backlog-fakta, så nästa röda post-merge triageas mot verkligheten. Risk: äkta regression avfärdas som känd flake. Funnet i S99 uppdrag 3-svepet, verifierat mot kod + CLI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: rad ~485 i post-merge-workflown läst + TASK-64:s och TASK-74:s faktiska status verifierade via backlog-CLI
- [x] #2 Vägledningstexten rättad mot faktiskt läge: flake-historiken beskrivs med korrekt status (båda korten Done med mätt bevis 3/8→0/8) och triage-rådet omformulerat så en äkta regression inte avfärdas som känd flake
- [ ] #3 Öppna ärendet #847 kommenterat med rättelsen; actionlint/yamllint gröna; PR armerad, per-jobb-grön
<!-- AC:END -->





## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
