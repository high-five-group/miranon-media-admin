---
id: TASK-241.3
title: 'Skiva: Bekräftelsesvepet ände-till-ände'
status: To Do
assignee: []
created_date: '2026-08-16 23:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-241.2
parent_task_id: TASK-241
ordinal: 457000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bekräftelsesvepet från armering till skickat: sändanrop per event-grupp under huven (useConfirmAll-mönstret återuppstår som ny konsument), resultatläge, hemmarkörer, aktivitetslogg. Täcker användarberättelser: 1, 5, 7, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 STOPP-VILLKOR FÖRST: Åtgärds-sidans befintliga sändkontrakt prövat för ett-anrop-per-event-grupp INNAN någon ny serverfunktions-yta designas — räcker ytan inte: STOPPA sändvägsbygget och minta EF-designkort som fynd, bokför utfallet i notes
- [ ] #2 Armerat bekräftelsesvep utför ETT sändanrop per event-grupp; resultatläget per grupp (sent/partial/failed) — identisk med facit tasks/sessions/bilagor/s102-svep-konvergens/facit.json lägena skickar, resultat och fel-resultat
- [ ] #3 Skickat-markörer syns på Morgonkollens rader efter svepet — KOORDINATION: hemmets filer delas med 243-kedjan, sekvensera mot pågående 243-arbete före push
- [ ] #4 Svepet lämnar spår i aktivitetshistoriken per event-grupp via delade verb-copy-modulen
- [ ] #5 Avbryt när som helst före armering ger noll sidoeffekter — inga anrop, inga markörer
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s102-svep-konvergens/facit.json (18 bilder) — renderad yta jämförd läge för läge
<!-- DOD:END -->
