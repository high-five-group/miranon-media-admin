---
id: TASK-18.3
title: 'Skiva: Åtgärds-gruppen + check-in-ingången + chevron-koherensen'
status: To Do
assignee: []
created_date: '2026-07-21 08:19'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
parent_task_id: TASK-18
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Åtgärds-gruppen överst (vänsterställda rader i frekvensordning med Lägg till manuell anmälan först, kuvert-grammatiken, hover-plattan) och check-in-kortet i NavCard-form som ingång (själva sidan byggs i eget framtida pass). Chevron-beslutet verkställs här: den tidigare ingen-chevron-regeln rivs ÖPPET i spec-trailen, chevron betyder att raden leder vidare, och Mer-menyns rader får chevroner för app-koherens. Skriv ut är skarp; utskicks-raderna kopplas till sina flöden när de finns. Täcker användarberättelser: 9, 10 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Åtgärdsrader + check-in-ingång renderar per facit med hover-plattans grammatik (renderad verifiering)
- [ ] #2 Regelrivningen bokförd öppet i spec-texten; Mer-menyn bär chevroner; berörda shell-/mer-e2e uppdaterade i samma skiva
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
