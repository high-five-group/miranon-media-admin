---
id: TASK-180
title: >-
  Natt-vakten 'Kom natten igång?' räknar stängt-med-motivering som obesvarat —
  falsklarm
status: To Do
assignee: []
created_date: '2026-08-10 06:18'
updated_date: '2026-08-10 11:01'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 337000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Instans #1042 (2026-08-09): vaktens run 31308855918 larmade 'nattnätet rött utan larm' fast larmet FANNS (#1028) och Marcus stängt det 07:19 med skriven motivering (rotorsak + ägare task-169). Checken ser bara 'finns öppet ci-natt-ärende' och skiljer inte obesvarat från stängt-med-motivering — falsklarm varje gång ett ärende hanteras snabbt. Fix config-drivet per grindvakts-konventionen.

Källa: S102 triage-rapport 2026-08-10 + issue #1028/#1042.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Vakt-logiken räknar ärende stängt med kommentar/motivering som besvarat (form: t.ex. även stängda ärenden inom fönstret räknas)
- [x] #2 Tvåsidigt bevis: simulerat obesvarat-fall larmar fortfarande; #1042-scenariot larmar inte
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
