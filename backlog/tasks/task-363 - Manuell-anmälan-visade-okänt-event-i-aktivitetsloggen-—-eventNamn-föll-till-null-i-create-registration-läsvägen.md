---
id: TASK-363
title: >-
  Manuell anmälan visade '(okänt event)' i aktivitetsloggen — eventNamn föll
  till null i create-registration + läsvägen
status: To Do
assignee: []
created_date: '2026-09-02 09:23'
updated_date: '2026-09-02 09:23'
labels: []
dependencies: []
ordinal: 662000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rotorsak: create-registration-EF:en skrev aldrig Anmälans egna 'Vill anmäla sig till', så formeln Event (namn) alltid var tom för manuella/+1/väntelista-anmälningar och eventNamn föll till null. Samma tomma formel lästes av get-registrations/get-registration (_shared/registration-read.ts). Fix: eventNamn föredrar nu lookupen Kurs (from Event) med fallback till formeln Event (namn), plus en tredje sista-utväg-fallback i create-registration (eventnamnet EF:en redan läst ur Eventplanering-posten). STOPP-BESLUT: skrev INTE Vill anmäla sig till vid create — data-model.md visar att fältet bär en annan semantik (self-reported form-claim, Eventmatchning-formelns påstående-sida, källa för Antal tidigare genomförda utbildningar-rollupen på Personer).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 create-registration svarar med eventNamn satt (aldrig null) när Event-länken finns — bevisat via skarp staging-conformance mot deployad EF
- [x] #2 get-registrations/get-registration (_shared/registration-read.ts mapRegistration) returnerar samma eventNamn-parity för en manuell anmälan som för en webbformulär-anmälan till samma event
- [x] #3 Vill anmäla sig till skrivs INTE av create-registration (STOPP-BESLUT, ADR-086) — bevisat: skriv-beviset visar fältet frånvarande i record.fields
- [x] #4 Aktivitetsloggens klientmall (useCreateRegistration.ts m.fl.) behåller sin okänt-event-fallback, men den ska inte längre kunna inträffa för en länkad anmälan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
