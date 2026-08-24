---
id: TASK-249.4
title: >-
  Skiva: Basdimensionerna i skapelse- och läsvägen — Kursfamilj/Kursnivå
  ersätter kurskartan
status: Done
assignee: []
created_date: '2026-08-17 00:30'
updated_date: '2026-08-24 13:07'
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
- [x] #1 create-event-EF:en sätter Kursfamilj och Kursnivå vid radskapelse (fält per NAMN, ADR-050) enligt kursnamnsmappningen — nya event föds aldrig utan familj när kursnamnet är känt; staging-CI:s ZZ-event föds med fälten satta (kanten ur data-model.md 2026-08-17 stängd)
- [x] #2 get-events exponerar dimensionerna och domänmodellen bär kursfamilj/kursnivå typade
- [x] #3 Rader UTAN fälten hanteras öppet: okänd familj visas som avvikelse i ytan (OkandaKurser-mönstret), försvinner aldrig tyst
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #6 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Byggd och landad i natt-orkestreringen S104 2026-08-17 (resume 5). PR: se kortets notes/kommentarer; CI grön per jobb + merge-kö-verifikat. Stängd av orkestreraren efter landnings-verifiering mot origin/main.

S112 bokföringspass (2026-08-24): PR #1478 MERGED, CI SUCCESS (verifierad gh pr view). DoD #5/#6 N/A per 249.3:s korsreferens (samma boilerplate-mönster) — lämnas orörda.
<!-- SECTION:FINAL_SUMMARY:END -->
