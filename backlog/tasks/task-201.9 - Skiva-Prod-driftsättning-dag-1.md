---
id: TASK-201.9
title: 'Skiva: Prod-driftsättning dag 1'
status: To Do
assignee: []
created_date: '2026-08-11 20:27'
updated_date: '2026-08-12 16:15'
labels:
  - ready-for-human
dependencies:
  - TASK-201.4
  - TASK-201.6
  - TASK-201.7
parent_task_id: TASK-201
ordinal: 374000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dag 1-leveransen: hela aktivitetsloggen tas till prod. MEDVETET utan beroende på filterraden (201.8) — A-formen räcker för driftsättning (mellanstationen, S105 Del 2 beslut 1); landar 201.8 före driftsättningen följer den med. HITL: prod-access + verifiering är Marcus-moment (S103-precedentet: EF-prod-deploy som öppen skuld tills Marcus-GO).

Täcker: dag 1-leveransen av berättelserna 1–6, 9–12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 activity_log född i prod-Supabase (samma migration + RLS-bevis som staging, 201.2-formen)
- [ ] #2 log-activity + get-activity-log deployade i prod; smoke per EF-praxis (deny-triple-andan)
- [ ] #3 Front-deployen VERIFIERAD utrullad (task-199-fällan: prod-fronten kan stå stale — verifiera faktisk version, anta inte)
- [ ] #4 Rök-test i prod: en riktig åtgärd → posten syns i Lottas historik
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS-BESLUT 2026-08-12 (val A, klartext "A"): prod-ref-låset i TASK-203 lämnas BRETT, och denna skiva förblir ett Marcus-moment.

Bakgrund: TASK-203 (PR #1212) landar ett mekaniskt lås som nekar agent-kommandon som innehåller prod-refen lvjsfnphlauldxqlncpl, oavsett underkommando. Låset är avsiktligt bredare än sin ursprungliga spec — bygg-agenten flaggade utvidgningen öppet i sin slutrapport.

KONSEKVENS FÖR DENNA SKIVA: en agent som plockar 201.9 kommer att FÄLLAS av låset på AC #1 och #2. Det är korrekt beteende, inte ett fel att felsöka och inte något att kringgå. Kortet bar redan ready-for-human och HITL-noten om prod-access; låset gör den avsikten mekanisk i stället för underförstådd.

Vald väg (A) framför alternativet att låta en agent köra via låsets dokumenterade förbi-väg. Skälet: prod-driftsättning mot verklig persondata är ett Marcus-beslut, och en spärr som rutinmässigt kringgås just där den betyder mest är ingen spärr. Förbi-vägen är dessutom konvention plus en smal teknisk spärr — inte outbrytbar, eftersom agenter kan läsa skriptets källkod (bygg-agentens egen ärliga avgränsning; samma klass som ADR-104:s "!"-kanal).

BREDARE FÖLJD, bokförd här eftersom den rör samma väg: scripts/deploy-prod-functions.sh kan inte längre köras av en agent utan förbi-vägen. Det var tidigare en agent-körd väg med Marcus muntliga GO (S84/S102-historiken i tasks/todo.md). Detta är en avsiktlig policyskärpning, inte en regression.
<!-- SECTION:NOTES:END -->
