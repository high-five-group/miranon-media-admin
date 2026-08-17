---
id: TASK-273.5
title: 'Skiva: QA — UI-fixpaketets vandring'
status: To Do
assignee: []
created_date: '2026-08-17 14:58'
labels:
  - ready-for-human
dependencies:
  - TASK-273.1
  - TASK-273.2
  - TASK-273.3
  - TASK-273.4
parent_task_id: TASK-273
ordinal: 493000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus, i browsern mot dev/staging): (1) Ladda om appen — Förberedelseskärmens bar är 6 px sage; jämför visuellt mot nästa event-kortets bar på hem-vyn. (2) Hovra genvägarna — bakgrundsplatta som på eventsidans åtgärdsrader. (3) Läs etiketten Gå till åtgärder och klicka — landar på åtgärdssidan. (4) Skrolla åtgärdssidan till botten — ingen mall-not. (5) Dokument-sidan: förhandsvisnings-ikonen öppnar ny flik med läsbart dokument för alla tre klasser (uppladdad bilaga, mall, kvitto); nedladdnings-ikonen sparar filen. (6) Omstämpla de tre amenderade faciten via !-kanalen (facit:godkann --ersatt eller --undantag per sidofilernas förslag). Täcker användarberättelser: 1-8 (slutverifiering).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga sex QA-steg i beskrivningen genomförda med bokfört utfall per steg
- [ ] #2 De tre facit-amenderingarna (hem, dokument, åtgärdssidan) omstämplade av Marcus via !-kanalen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
