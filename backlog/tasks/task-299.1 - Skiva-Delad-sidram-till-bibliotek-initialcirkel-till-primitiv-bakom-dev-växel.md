---
id: TASK-299.1
title: >-
  Skiva: Delad sidram till bibliotek + initialcirkel till primitiv, bakom
  dev-växel
status: To Do
assignee: []
created_date: '2026-08-22 19:08'
updated_date: '2026-08-22 20:54'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-299
ordinal: 541000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prefaktorering — gör ändringen enkel först. Efter skivan finns EN delad sidram att importera i stället för sex kopierade sidkrom, och initialcirkeln bor i primitiv-hemvisten i stället för i Hem-katalogen. Ingen skarp yta ser annorlunda ut: de fyra befintliga ytor som ska kunna byta sidram gör det bara när dev-parametern är satt, så Marcus kan se båda formerna sida vid sida utan att något är låst. Tracer bullet-ordning inom skivan: komponenten först, växeln sedan, importbytena sist. Täcker användarberättelser: 19, 20.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En delad sidram-komponent finns i bibliotekshemvisten på 11/11/11 och bär kant-i-kant-dialekten (chevron och rubrik indragna, kortytan kant i kant mot innehållsytan); den kan valfritt äga rubrikblocket, så både den smalare och den bredare omfattningen kan visas
- [x] #2 Initialcirkelns komponent bor i primitiv-hemvisten och exporteras därifrån; Hems två konsumenter importerar den nya sökvägen; noll visuell förändring — befintliga baslinjer gröna UTAN om-baselinjering
- [x] #3 Kodkommentaren som påstår att duplicering av presentationsformer är avsiktlig är riven i samma landning som lyftet
- [x] #4 Dev-parametern visar den nya sidramen på persondetaljen, check-in, aktivitetshistoriken och dokumentytan; UTAN parametern är var och en av de fyra ytorna identisk med sitt facit
- [x] #5 Ingen av de fyra ytornas befintliga promoveringsgrindar eller aria-referenser ändras
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [x] #6 Facit-granskning före stängning: persondetaljen mot tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json, check-in mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json, aktivitetshistoriken mot tasks/sessions/bilagor/s106-aktivitetslogg/facit.json, dokumentytan mot tasks/sessions/bilagor/s102-dokument-konvergens/facit.json
<!-- DOD:END -->
