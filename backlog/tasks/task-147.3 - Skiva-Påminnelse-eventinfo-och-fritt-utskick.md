---
id: TASK-147.3
title: 'Skiva: Påminnelse, eventinfo och fritt utskick'
status: To Do
assignee: []
created_date: '2026-08-10 07:00'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.2
parent_task_id: TASK-147
priority: high
ordinal: 340000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Resterande tre åtgärder på samma sändväg: 'Skicka betalningspåminnelse' (urvalsfilter obetalda — delmängds-påminnelsen som var kortets dyra post), 'Skicka eventinformation' och 'Skicka mail' (fritt). Redigerbar ämnesrad + brödtext följer med per utskick; malltexterna är systemkonstanter (mall-editor uttryckligen senare, PRD § Utanför omfattningen).

Täcker användarberättelser: 4, 5, 6, 19.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla fyra åtgärdstyperna sänder verkligt via 147.1-vägen; urvalsfiltren biter per typ (obekräftade/obetalda per ATGARDER-definitionen i AtgardsSida.tsx)
- [ ] #2 Redigerad text går ut i stället för mallen; platshållare fylls per mottagare
- [ ] #3 Ytorna fortsatt identiska med facit tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json (aria-referenserna)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json utförd (ADR-102 R3)
<!-- DOD:END -->
