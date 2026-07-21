---
id: TASK-18.5
title: 'Skiva: Personkorten (metaytan + historiken)'
status: To Do
assignee: []
created_date: '2026-07-21 08:20'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.4
parent_task_id: TASK-18
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
De vita personkorten i grupperna får facitets form: namnet i fetstil som person-länk (identitetszonen är person-klickytan), E-post etikett-över-värde, metaytan med Anmäld dag + klockslag på EN rad som egen länk-rad utlyft ur person-länken, endast UTFÖRDA åtgärder på var sin rad (ej-skickat visas aldrig), sista raden Första eventet respektive N tidigare event hos Miranon Media (hela namnet), kategori-pill endast vid avvikelse per tysta normen. Anmäld-radens länkmål beläggs öppet i skivan — anmälans egen sida finns inte än; belagt mål eller olänkad med motiv, aldrig tyst. Täcker användarberättelser: 16 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Personkorten matchar facit renderat: metaytan, endast utförda åtgärder, historikraden med hela namnet
- [ ] #2 Anmäld-radens länkmål belagt och öppet bokfört i skivan
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
