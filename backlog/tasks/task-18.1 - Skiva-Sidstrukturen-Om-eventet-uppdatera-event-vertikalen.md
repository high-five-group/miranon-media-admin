---
id: TASK-18.1
title: 'Skiva: Sidstrukturen + Om eventet + uppdatera-event-vertikalen'
status: To Do
assignee: []
created_date: '2026-07-21 08:19'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-18
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Eventsidan får facitets grundform ände-till-ände: topprad (stor chevron ensam, h1 = eventnamnet, EventKey-pill, tid kvar-rad), grupper med rubrik utanför tonala kort, Om eventet som etikett-värde-rader med Ändra-läget i sömlös morf (0 px-diff DOM-mätt, likbredda fält, ändrar-från-mönstret) — och Spara skriver på riktigt via NY operation uppdatera-event (typ, ort, start- och slutdatum, status, max antal platser; server-side shape + allowlist, deny-by-default; skrivbarheten live-verifieras mot basen INNAN allowlist-posten låses, L294). eventKey in i läs-shapen. Täcker användarberättelser: 1-5 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Om eventet-redigeringen fungerar ände-till-ände mot staging: ändra, spara, omläsning visar nya värden (teardown återställer)
- [ ] #2 api-kontraktstester per write-vertikal-mönstret: deny-by-default, otillåtet fält fälls, lyckad väg
- [ ] #3 Morfen 0 px-diff DOM-mätt; sidformen matchar facit-helsidan renderat
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
