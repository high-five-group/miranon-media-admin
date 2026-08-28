---
id: TASK-265
title: >-
  B1: Leads-vyn i prod-basen visar 448/670 personer — filtret lagas mot appens
  leads-definition
status: To Do
assignee: []
created_date: '2026-08-17 10:09'
updated_date: '2026-08-28 05:10'
labels:
  - ready-for-human
dependencies: []
ordinal: 481000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur publik-utredningen (docs/research/utskickspublikens-leads-och-namnlosa-2026-08-17.md § Domen a + § Vad jag inte kunde belägga; kort på Marcus order 2026-08-17): Airtable-vyn 'Leads' i Personer-tabellen (prod apphFYbI3lbTOWiWO... — se data-model.md) visar 448 av 670 personer (67 %), inklusive deltagare med tre genomförda kurser — den ljuger vid manuell uppslagning och var trolig källa till QA-intrycket 'leads i publiken'. Appens egen leads-logik (get-leads-EF:n, 77 personer, noll överlapp med utskickspubliken) är facit. ÅTGÄRD I BASEN (ADR-063, Marcus/Lotta-moment med Code-stöd): öppna vyn i Airtable-UI:t, läs det faktiska filtervillkoret (metadata-API:t exponerar det inte — kunde ej beläggas av utredningen), rätta det så vyn speglar appens definition (personer utan anmälningar), verifiera antalet mot get-leads (77 ± leads-tillväxt). Bokför utfallet + det gamla filtret i data-model.md § konsumtionskartan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Airtable-vyn 'Leads' i Personer-tabellen (prod-basen, se data-model.md) filtrerar på appens leads-definition — personer utan anmälningar, samma logik som get-leads-EF:n — i stället för det tidigare, obelagda filtret
- [ ] #2 Antal personer i vyn efter fixen matchar get-leads-EF:ns svar (77 ± faktisk leads-tillväxt sedan 2026-08-17), verifierat genom direkt jämförelse mellan vyn och EF-svaret
- [ ] #3 Det gamla filtervillkoret (om det kunde läsas ur Airtable-UI:t) samt utfallet av fixen bokförs i data-model.md § konsumtionskartan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
