---
id: TASK-375
title: >-
  Fynd: borOverAntal i get-event och get-events räknar avbokade och inställda
  anmälningar
status: To Do
assignee: []
created_date: '2026-09-03 09:46'
labels:
  - ready-for-agent
dependencies: []
ordinal: 673000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Symptom
Bor över-antalet på eventsidan och i eventlistan räknas över ALLA länkade anmälningar (get-event/index.ts fetchBelaggning, get-events/index.ts fetchBorOverAntalByEvent) — en avbokad eller inställd anmälan med Bor över ikryssat räknas med. Upptäckt i TASK-373 (PR #2245), medvetet lämnat utanför den skivan eftersom list-nivån har egen batch och eget stagingtest (event-bor-over.staging.test.ts).

## Förväntat beteende
Bor över räknas bara över aktiva anmälningar (arAktivAnmalan-semantiken: exkluderar Avbokad/Ombokad och Inställt), identiskt på eventsidan och i listan. Testfall: en avbokad med Bor över räknas inte; stagingtestet uppdaterat.

## Källa
S115 Del 5, review-utlåtande PR #2245 runda 1; TASK-373 § Avgränsning.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
