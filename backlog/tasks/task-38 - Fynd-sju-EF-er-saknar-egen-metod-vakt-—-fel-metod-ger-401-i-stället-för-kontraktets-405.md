---
id: TASK-38
title: >-
  Fynd: sju EF:er saknar egen metod-vakt — fel metod ger 401 i stället för
  kontraktets 405
status: To Do
assignee: []
created_date: '2026-07-24 19:41'
labels: []
dependencies: []
priority: medium
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S84 deny-smoken (2026-07-24) mot prod: get-event-formats, get-events, get-persons, get-registrations, get-segments, get-event-notes och create-admin-user saknar explicit metod-kontroll i index.ts — en GET med giltig Bearer når requireUser/körning i stället för att avvisas 405 (jämför create-event/create-event-note/compute-segment/save-segment/send-email/update-record som har vakten, rad ~9–33). Ingen säkerhetslucka (auth krävs alltid) men API-kontraktet blir asymmetriskt och fel metod med giltig auth ger odefinierat beteende (400/500-klass i stället för 405). Samma kontrakt-hygien-familj som TASK-24 (404-kontraktet).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga tretton allowlistade EF:er avvisar fel metod med 405 före auth-kontrollen (mönstret från create-event rad ~121)
- [ ] #2 Deny-smokens källkods-klassning (405/401-splitten) kan tas bort — en förväntan för alla
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
