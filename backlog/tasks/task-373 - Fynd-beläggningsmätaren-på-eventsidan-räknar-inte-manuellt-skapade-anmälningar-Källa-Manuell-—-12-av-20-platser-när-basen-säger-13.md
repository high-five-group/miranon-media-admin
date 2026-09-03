---
id: TASK-373
title: >-
  Fynd: beläggningsmätaren på eventsidan räknar inte manuellt skapade
  anmälningar (Källa 'Manuell') — '12 av 20 platser' när basen säger 13
status: To Do
assignee: []
created_date: '2026-09-03 08:58'
labels:
  - ready-for-agent
dependencies: []
ordinal: 674000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Symptom
Prod 2026-09-03, RIM 3 Rönninge (Event-25): eventsidans mätare visar '12 av 20 platser upptagna' medan basen (och räknarfixen TASK-368.1) säger 13 aktiva anmälningar och 7 platser kvar. Anmälan 'Marcus Test' (ID 1004) är skapad via appens Ny anmälan och bär Källa = 'Manuell'.

## Rotorsak (verifierad i kod)
supabase/functions/get-event/index.ts (~rad 94-107) räknar viaFormular = anmälningar med Källa TOM och medfoljande = Källa '+1'; src/components/events/detail/Belaggning.tsx summerar viaFormular + basens 'Manuella platser' (ett NUMBER-fält) + medfoljande + 'Extra platser'. Anmälningar med Källa 'Manuell' (skapade i appen) eller 'Väntelista' (flyttade från väntelistan) räknas i ingen del — mätaren undervärderar med varje sådan anmälan.

## Förväntat beteende
Mätaren visar samma upptagna-tal som basens Antal anmälda (aktiva anmälningar + Manuella platser + Extra platser), oavsett Källa; segmenten kan fortsatt särskilja formulär/manuell/medföljande/reserverad, men summan får aldrig tappa en aktiv anmälan. Avbokade och inställda ska inte räknas (arAktivAnmalan, TASK-368.1). Testfall i get-event- och Belaggning-testerna: en anmälan med Källa 'Manuell' och en med 'Väntelista' räknas; en avbokad räknas inte. S73-facitet för mätaren ska prövas mot ändringen (ADR-102).

## Källa
S115 Del 5 (2026-09-03); Marcus: 'det borde väl stå 13 platser upptagna?'
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
