---
id: TASK-368.2
title: >-
  Skiva: Operationen — allowlistad statusskrivning för avbokning och återtag,
  Notering-append, loggverb, adapter och mutation, API-test mot staging
status: To Do
assignee: []
created_date: '2026-09-03 07:57'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-368
ordinal: 668000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: appen kan sätta en aktiv anmälan till Avbokad/Ombokad med ett frivilligt skäl, och sätta tillbaka en avbokad anmälan till rätt status, härledd ur bekräftelsedatumet. Skälet hamnar som datumstämplad rad i anmälans Notering i basen utan att befintlig text går förlorad, och händelsen loggas i aktivitetsloggen. Ingen annan skrivning tillåts. Detta är serverkontraktet som skivan om anmälans sida bygger på. Täcker användarberättelser: 3, 4, 5, 9, 10, 20, 23, 24.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ny allowlist-operation skriver ENDAST Anmälningar.Status och Notering; tillåtna övergångar exakt två: aktiv status (Bekräftad (mail skickat), Betalningspåminnelse skickad, Obekräftad) till Avbokad/Ombokad, och Avbokad/Ombokad till härledd status (Bekräftad (mail skickat) om Bekräftelse skickad är satt, annars Obekräftad); alla andra övergångar och Inställt/Flytta till väntelista avvisas med 409 och begripligt fel
- [ ] #2 Notering skrivs som append: befintlig text bevaras, ny rad på formen '[Avbokad ÅÅÅÅ-MM-DD av <aktör>] <skäl>' respektive '[Avbokning återtagen ÅÅÅÅ-MM-DD av <aktör>] <skäl>'; tomt skäl ger raden utan skältext
- [ ] #3 Aktivitetsloggen får verben 'avbokade anmälan' och 'återtog avbokning' med anmälan som objekt (person-namn i objektnamnet), skrivna efter lyckad basskrivning, aldrig före
- [ ] #4 Edge Function, adapter-metod och TanStack-mutation finns; mutationen invaliderar anmälan, event, inkorg och aktivitetslogg; idempotent vid dubbelanrop (andra anropet ändrar inget och loggar inget)
- [ ] #5 API-test mot staging-funktionen (förebild: bekräftelseutskickets stagingtest) prövar tillåtna och förbjudna övergångar, Notering-append med bevarad text, loggverb och idempotens; allowlist-vakten grön; DoD-grindarna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
