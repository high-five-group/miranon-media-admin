---
id: TASK-219.2
title: 'Skiva: Button isLoading + auth-migreringen'
status: To Do
assignee: []
created_date: '2026-08-15 08:49'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-219
ordinal: 421000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: Button-primitiven får en isLoading-prop som bär trappsteg 2 komplett — knapp-intern spinner, spärrat klickläge (inga dubbelklick), skärmläsarbesked — för alla knappvarianter; de sex handkodade spinner-ihopsättningarna på auth-ytorna migreras till propen. Täcker användarberättelser: 2, 6 (PRD TASK-219).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Button-primitiven exponerar isLoading med spinner + spärrat klickläge + sr-besked, fungerande för samtliga varianter/intents; granskningsbar i dev-primitives
- [ ] #2 Sex auth-ställen migrerade; ingen lokal spinner-ikon-ihopsättning kvar i auth-routes (grep-bevis)
- [ ] #3 Hermetiska visual-sviten + a11y-svepet gröna med de nya lägena
- [ ] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
