---
id: TASK-219.4
title: 'QA: Laddtrappan i bruk — Marcus stickprov'
status: To Do
assignee: []
created_date: '2026-08-15 08:50'
labels:
  - ready-for-human
dependencies:
  - TASK-219.1
  - TASK-219.2
  - TASK-219.3
parent_task_id: TASK-219
ordinal: 423000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus, dev-server eller staging): (1) KNAPPAR — utför en mutation (t.ex. spara en anteckning, skicka testmail): knappen ska visa arbetar-läge och inte gå att dubbelklicka. (2) LISTOR — öppna Väntelista, Maillogg, Intresserade, Anmälningar med kall cache: skeleton i stället för Laddar…-text, ingen layout som hoppar. (3) STICKPROV kontrast + reducerad rörelse: slå på prefers-reduced-motion och prefers-contrast: more och gå igenom samma ytor. (4) Läs spec §15 och bekräfta att trappan är begriplig som byggregel. Bocka AC och rapportera avvikelser som nya fynd-kort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla fyra stegen i testplanen genomförda och godkända av Marcus
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
