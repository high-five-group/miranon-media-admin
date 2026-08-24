---
id: TASK-190
title: >-
  Staging create-event mappar Airtable-valideringsfel till generisk 500 utan
  felklassning
status: Done
assignee: []
created_date: '2026-08-10 17:36'
updated_date: '2026-08-24 16:44'
labels: []
dependencies: []
ordinal: 356000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
OMFORMULERAT 2026-08-10 (S102): ursprungsfyndet ('500 Internal error, odiagnostiserad') visade sig vara anroparens EGEN ogiltiga payload — 'Event (source)' är en stängd singleSelect med sex giltiga val, och fri text avvisas av Airtable (verifierat: med 'Fjärrskådning' svarar EF:en 201). KVARVARANDE fynd: EF:en mappar Airtables valideringsavvisning till generisk 500 'Internal error' i stället för klassat 4xx-fel med orsak — anroparen kan inte skilja eget kontraktsbrott från serverfel (kostade ett helt diagnosvarv i FRAMME-passet). FÖRVÄNTAT: Airtable 422/INVALID_VALUE-klassen svaras som 400/422 med fältnamn. requestId-exemplet: 7ed822c6-64e2-4ab7-bb2b-1cd3759ba2ae.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done-flipp S112: fixen (500→422, classifyAirtableWriteError) i PR #1940, landad + post-merge grön; testet asserterar Airtables faktiska svar (hypotesen om fältnamn falsifierad mot staging). Kortet saknar AC — fyndets FÖRVÄNTAT uppfyllt. Landning: PR #1940
<!-- SECTION:NOTES:END -->
