---
id: TASK-299.3
title: 'Skiva: Divergens på anmälningssidan — tre varianter, tre lägen'
status: To Do
assignee: []
created_date: '2026-08-22 19:18'
labels:
  - ready-for-human
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 543000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Anmälningssidan får tre radikalt olika varianter växlingsbara på en dev-route. Startpunkten är en EXAKT kopia av nuvarande vy, aldrig ett tomt blad. Varje variant ska gå att se i sidans tre lägen: hela listan, det filtrerade åtgärdskö-läget och tomt läge — det filtrerade läget är ett läge av samma vy, inte en egen sida. Marcus väljer EN variant i visuell granskning. Radanatomin i minst en variant ska vara personlistans form med anmälningsdata: initialcirkel, namnet som länk, undertext med hur länge sedan anmälan kom in och vilket event den gäller, status som egen kolumn med reserverad plats. Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 7, 9, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tre varianter växlingsbara på en dev-route; utgångsläget är en exakt kopia av nuvarande /mer/anmalningar
- [ ] #2 Varje variant går att se i alla tre lägen: ofiltrerad lista, åtgärdskö-läget och tomt läge
- [ ] #3 Minst en variant bär personlistans radanatomi med anmälningsdata (initialcirkel, namn som länk, undertext 'N dagar sedan · Eventnamn', status som egen kolumn med reserverad plats)
- [ ] #4 I varje variant leder en rad som behöver kopplas om till resolutionen — inget separat knappelement i raden
- [ ] #5 Ingen variant bär betydelse enbart genom färg
- [ ] #6 Marcus väljer EN variant; valet citeras daterat på kortet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [ ] #6 Höjdlåset verifierat som beteende: rader med/utan status och med/utan åtgärdsbehov har samma höjd
<!-- DOD:END -->
