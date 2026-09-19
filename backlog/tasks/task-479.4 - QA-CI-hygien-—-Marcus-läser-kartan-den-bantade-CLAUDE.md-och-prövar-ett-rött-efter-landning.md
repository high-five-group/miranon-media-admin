---
id: TASK-479.4
title: >-
  QA: CI-hygien — Marcus läser kartan, den bantade CLAUDE.md och prövar ett rött
  efter landning
status: To Do
assignee: []
created_date: '2026-09-19 10:53'
labels:
  - ready-for-human
dependencies:
  - TASK-479.1
  - TASK-479.2
  - TASK-479.3
parent_task_id: TASK-479
priority: medium
ordinal: 834000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan för Marcus. (1) Läs den nya kartan under docs/reference/: förstår du flödet förslag → kö → main → efterkontroll → natt utan att öppna någon annan fil? (2) Läs PR:ens tabell stycke → stannar/flyttar: saknar du någon regel i CLAUDE.md som du vet har räddat oss? (3) Starta en ny session och be om en armering: följer orkestreraren reglerna trots den kortare filen? (4) Nästa gång en efterkontroll blir röd: säger svepet till, och står det vem som äger ärendet? (5) Läs CONTRIBUTING-raden om tidsregeln — är tiden rätt satt? Avvikelser blir NYA kort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla fem punkter vandrade; avvikelser mintade som nya kort
- [ ] #2 Marcus dom i klartext om CLAUDE.md-bantningen: behåll / återställ något
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
