---
id: TASK-450.6
title: 'Skiva: N7 — listan Månad/år i produktionsbasen fylls på med 2027'
status: To Do
assignee: []
created_date: '2026-09-18 09:53'
labels:
  - ready-for-human
dependencies: []
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: high
ordinal: 780000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Appen kan i dag inte skapa ett event med startdatum 2027: fältet Månad/år i produktionsbasen är en fast lista som slutar vid december 2026, och serverfunktionen felar medvetet i stället för att tyst skapa ett val. Efter skivan bär listan tolv val till (januari–december 2027). Skrivningen sker i produktionsbasen — ägarens kanal, subagenter är mekaniskt spärrade. Den riktiga lösningen (formelhärlett fält) är SE14 och ligger utanför. Spec: planens § N7.

Täcker användarberättelser: 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fältets schema läst före och efter: fjorton val blir tjugosex, inga befintliga val ändrade
- [ ] #2 Skarpt i staging: ett event med startdatum 2027-01-15 skapas via create-event utan tekniskt fel (staging-basens lista fylld på samma sätt om den saknar valen)
- [ ] #3 docs/reference/data-model.md § Kända fällor post 45 bär det nya slutdatumet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
