---
id: TASK-249.4
title: >-
  Skiva: Basdimensionerna i skapelse- och läsvägen — Kursfamilj/Kursnivå
  ersätter kurskartan
status: To Do
assignee: []
created_date: '2026-08-17 00:30'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-249
ordinal: 466000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Basen är dimensionskällan: fälten finns redan i BÅDA baserna med verifierad backfill (data-model.md § 2026-08-17). Denna skiva kopplar på skrivning-vid-skapelse och läsvägen, så att prototypens hårdkodade kurskarta kan dö i flippen. Täcker användarberättelser: 15.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 create-event-EF:en sätter Kursfamilj och Kursnivå vid radskapelse (fält per NAMN, ADR-050) enligt kursnamnsmappningen — nya event föds aldrig utan familj när kursnamnet är känt; staging-CI:s ZZ-event föds med fälten satta (kanten ur data-model.md 2026-08-17 stängd)
- [ ] #2 get-events exponerar dimensionerna och domänmodellen bär kursfamilj/kursnivå typade
- [ ] #3 Rader UTAN fälten hanteras öppet: okänd familj visas som avvikelse i ytan (OkandaKurser-mönstret), försvinner aldrig tyst
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #6 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->
