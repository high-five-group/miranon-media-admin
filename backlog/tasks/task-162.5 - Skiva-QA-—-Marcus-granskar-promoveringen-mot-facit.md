---
id: TASK-162.5
title: 'Skiva: QA — Marcus granskar promoveringen mot facit'
status: To Do
assignee: []
created_date: '2026-08-08 07:44'
labels:
  - ready-for-human
dependencies:
  - TASK-162.2
  - TASK-162.3
  - TASK-162.4
parent_task_id: TASK-162
ordinal: 305000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus sida-vid-sida-granskning — promoveringsordningens steg 2–3 (ADR-103 B2). Manuell testplan: (1) Öppna eventsidan på dev-servern med riktig data, UTAN variant-parameter — den promoverade formen ska vara det som visas. (2) Jämför mot facit-bilderna yta för yta som regressionsstöd: åtgärds-kortet, filterpanelen i default-läge, aktivt filter, Bor över-krysset, noll träffar via Avbokade-filtret, avdelaren under registret, batch-baren. (3) Bocka checklistan per A1–A6; varje avvikelse blir ett NYTT kort med exakt symptom och förväntat beteende. (4) Vid godkännande: uttala det i klartext — godkännandet avblockerar rivningskortet TASK-145.6 (flagg-rivning + regressionslåsets baslinje). Täcker användarberättelser: 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Checklistan A1–A6 genomgången med utfall bokfört per punkt
- [ ] #2 Godkännande uttalat i klartext ELLER avvikelser bokförda som NYA kort (aldrig retusch av befintliga)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
