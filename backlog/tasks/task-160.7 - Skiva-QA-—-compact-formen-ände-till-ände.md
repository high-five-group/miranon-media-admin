---
id: TASK-160.7
title: 'Skiva: QA — compact-formen ände-till-ände'
status: To Do
assignee: []
created_date: '2026-08-07 17:03'
labels:
  - ready-for-human
dependencies:
  - TASK-160.1
  - TASK-160.2
  - TASK-160.3
  - TASK-160.4
  - TASK-160.5
  - TASK-160.6
parent_task_id: TASK-160
ordinal: 289000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan: (1) betala skarpbevis-skulderna med differentialmätning; (2) i en levande orkestrerings-session med byggare i luften, låt kontexten nå zonen och följ hela kedjan från larm till post-compact-omorientering; (3) verifiera att en ANDRA compact-impuls i samma session instruerar paus-vägen; (4) granska att disk förblev sanningsbärare genom hela förloppet (jämför sammanfattningens påståenden mot todo/sessionsdok/git). Täcker användarberättelser: 1, 2, 3, 4, 6, 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skarpbevis-skulderna för BÅDA hookarna betalda i session född efter deras landning (differentialreceptet; varna Marcus före prompt-genererande verifiering)
- [ ] #2 Hela kedjan prövad skarpt EN gång i verklig orkestrerings-session: zonlarm → skill → säkrat läge → GO → kontrollerad kompaktering med fokus → post-compact-omorientering → monitor omstartad → markör rensad
- [ ] #3 Marcus-granskning: nekande-texterna begripliga, fokus-instruktionens form rätt, sediment-upplevelsen efter compact acceptabel
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
