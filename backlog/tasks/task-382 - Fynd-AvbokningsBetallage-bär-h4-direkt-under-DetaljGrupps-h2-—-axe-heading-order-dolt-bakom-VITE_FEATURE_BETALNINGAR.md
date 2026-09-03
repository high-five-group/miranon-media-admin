---
id: TASK-382
title: >-
  Fynd: AvbokningsBetallage bär h4 direkt under DetaljGrupps h2 — axe
  heading-order, dolt bakom VITE_FEATURE_BETALNINGAR
status: To Do
assignee: []
created_date: '2026-09-03 12:43'
updated_date: '2026-09-03 13:16'
labels:
  - ready-for-agent
dependencies: []
ordinal: 684000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Symptom (källa: 368.5-byggarens slutrapport, PR #2267, 2026-09-03; HYPOTES tills verifierat mot disk): src/components/betalningar/AvbokningsBetallage.tsx (368.3, PR #2246) renderar <h4>Betalläge</h4> direkt under DetaljGrupps <h2>, vilket är en axe heading-order-överträdelse. Den syns inte i acceptanssviten eftersom acceptance-webServern kör VITE_FEATURE_BETALNINGAR: 'av'. Samma överträdelse fick 368.5:s egen rubrik i första körningen och rättades där till <h3>. Förväntat beteende: rubriknivåerna i avbokningsstegets betalläge följer dokumentordningen (h3 under h2), och en acceptans- eller enhetstest prövar ytan med flaggan PÅ så överträdelsen inte kan återkomma osynligt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AvbokningsBetallage renderar rubriken på rätt nivå; axe heading-order noll överträdelser med VITE_FEATURE_BETALNINGAR på
- [x] #2 Ett test prövar betalläget i avbokningssteget med flaggan på (hermetiskt), så regressionen fälls i CI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
