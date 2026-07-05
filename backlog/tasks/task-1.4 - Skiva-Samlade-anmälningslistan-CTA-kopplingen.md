---
id: TASK-1.4
title: 'Skiva: Samlade anmälningslistan + CTA-kopplingen'
status: To Do
assignee: []
created_date: '2026-07-05 21:09'
labels:
  - ready-for-agent
dependencies:
  - TASK-1.3
parent_task_id: TASK-1
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
En samlad anmälningslista finns under Mer (/mer/anmalningar, FK-listmönstret: ett kort per rad, de senaste först, namn + event + datum per rad — PRD implementationsbeslut 6), och Hems CTA byter till 'Visa alla anmälningar' och pekar dit (beslut 7 — eventlistan nås via tabbaren; knappen förlänger listan den står under). Klick på en rad landar på eventets anmälda-vy — samma väg som på Hem; rad utan event-koppling visas olänkad med 'Utan event' (beslut 4). Data via samma befintliga läs-EF:s event-lösa gren genom router-context-DI — read-only, ingen ny EF, ingen ändring i write-allowlisten. Mer-landningens länklista får posten. Sök/filter är utanför omfattningen (enkel lista i denna version). Förebilder: mer-väntelista-e2e:n + hem-e2e:n.
Täcker användarberättelser: 8, 9, 10, 11 (listans tomma läge) (+ 13, 14, 15 för listan)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /mer/anmalningar visar alla anmälningar med de senaste först, namn + event + datum per rad, och nås från Mer-landningens länklista
- [ ] #2 Hem-CTA:n lyder 'Visa alla anmälningar' och landar på den nya listan
- [ ] #3 Klick på en rad landar på det eventets anmälda-vy; rad utan event visas olänkad med 'Utan event'; tomt läge visar vänlig text
- [ ] #4 Nya vyn är tangentbordsnavigerbar, har axe-baseline 0 via den befintliga baseline-runnern och dess e2e är grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd
<!-- DOD:END -->
