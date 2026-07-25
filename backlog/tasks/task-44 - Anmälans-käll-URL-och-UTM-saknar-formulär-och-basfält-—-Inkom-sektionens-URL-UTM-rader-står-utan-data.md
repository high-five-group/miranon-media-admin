---
id: TASK-44
title: >-
  Anmälans käll-URL och UTM saknar formulär- och basfält — Inkom-sektionens
  URL/UTM-rader står utan data
status: To Do
assignee: []
created_date: '2026-07-25 03:33'
labels: []
dependencies: []
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Per-anmälan-detaljvyn (task-18.17 byggkrav 9, S83-facit) reserverar Inkom-raderna URL (länkad, mono, ny flik) och UTM (RÅ 'source / medium / campaign', ordagrant ur URL-parametrar — aldrig översatta). Läs-shapen bär nycklarna (sidUrl/utm, null) och vyn renderar raderna när data finns — men varken formulären eller Anmälningar-tabellen fångar sid-URL/UTM idag (Väntelista har UTM-fält, Anmälningar inte). Förväntat: nya formulärfält + ADDITIVA basfält (AT-Max/ADR-063-kandidat, bas-maximeringens T16-spår) + get-registration-mappningen (en rad kod per fält när de föds). Symptom idag: kampanj-attribution för anmälningar är omöjlig — det går inte att se vilken kampanj/sida som födde en anmälan. Fött ur task-18.17 (ADR-053: registrera, aldrig tyst).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
