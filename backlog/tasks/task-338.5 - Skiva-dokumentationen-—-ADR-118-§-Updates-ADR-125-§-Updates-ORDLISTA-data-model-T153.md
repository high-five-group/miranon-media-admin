---
id: TASK-338.5
title: >-
  Skiva: dokumentationen — ADR-118 § Updates, ADR-125 § Updates, ORDLISTA,
  data-model, T153
status: To Do
assignee: []
created_date: '2026-08-29 08:04'
labels:
  - ready-for-agent
dependencies:
  - TASK-338.2
parent_task_id: TASK-338
ordinal: 615000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan bokför repot ersättningen öppet: ADR-118 får en § Updates-sektion som daterat beskriver att beslut 1/4/5 ersatts av S108 Del 2 § D → ADR-125 § Beslut 1 → TASK-338 (och att beslut 2/3 gäller vidare); ADR-125 får en § Updates-rad med lagringsformen (Räckvidd 'Gemensam' + axlarna Kursfamilj/Kursnivå/Plats, matchning i kod, legacy-tolerans) och skälen; ORDLISTA § Räckvidd och § Gemensam bilaga nämner värdet 'Gemensam' och badge-formerna; data-model.md § Bilagor beskriver fälten (staging-ID:n, prod väntar 338.6); tråd T153:s indexrad pekar på TASK-338 för sushimenyn/parkeringsbilagan. Inga kodändringar. Täcker användarberättelser: 13, 15.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ADR-118 har § Updates med datum, ersättningskedjan och vilka beslut som gäller vidare; ADR-125 § Updates bär lagringsformen; check-adr-räkningen oförändrad (ingen ny ADR)
- [ ] #2 ORDLISTA § Räckvidd/§ Gemensam bilaga uppdaterade i ordlistans format; data-model.md § Bilagor med fält-ID:n; T153-raden pekar på TASK-338; check-thread-index.sh exit 0
- [ ] #3 npm run check:docs exit 0 (14 gröna)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
<!-- DOD:END -->
