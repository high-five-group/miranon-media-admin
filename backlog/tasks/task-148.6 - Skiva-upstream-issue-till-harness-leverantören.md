---
id: TASK-148.6
title: 'Skiva: upstream-issue till harness-leverantören'
status: To Do
assignee: []
created_date: '2026-08-07 09:52'
labels:
  - ready-for-human
dependencies:
  - TASK-148.2
  - TASK-148.5
parent_task_id: TASK-148
ordinal: 252000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: harness-defekterna är rapporterade vid källan med mätdata som gör dem reproducerbara — kompensation lokalt, fix uppströms. Täcker användarberättelse: 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Utkast författat på engelska med reproducerbara steg och våra mätdata (Monitor-luckan ur premiss-passet i spärr-skivan; notifikations-brottet ur mätsessionen)
- [ ] #2 Marcus text-GO inhämtat FÖRE filing — utåtriktad handling, aldrig auto
- [ ] #3 Issue filad; länken bokförd i T112 och ADR-096 § Updates
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
