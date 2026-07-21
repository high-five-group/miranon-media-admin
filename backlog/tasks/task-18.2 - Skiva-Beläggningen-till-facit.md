---
id: TASK-18.2
title: 'Skiva: Beläggningen till facit'
status: To Do
assignee: []
created_date: '2026-07-21 08:19'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
parent_task_id: TASK-18
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beläggningskortet visar innehållsmodellen som mappar basen 1-till-1 (Reserverade = Extra platser, via formulär = Källa tom, Manuellt tillagda = Manuella platser, Medföljande = Källa +1) med segmenterad mätare och streck-markörer, Väntelista-raden alltid med utanför taket — och Ändra-morfen skriver max antal platser, extra platser och manuella platser via uppdatera-event-operationen. Väntelisteplatsens event-koppling föds som ADDITIVT bas-fält (staging först). Täcker användarberättelser: 6-8 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Per-källa-uppdelningen bevisad i api-test; segmenten summerar mot basens fält
- [ ] #2 Platser-morfen skriver alla tre fälten mot staging med teardown; morfen 0 px-diff
- [ ] #3 Vänteliste-raden läser event-kopplade Väntelisteplatser via nya fältet; renderat mot facit
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
