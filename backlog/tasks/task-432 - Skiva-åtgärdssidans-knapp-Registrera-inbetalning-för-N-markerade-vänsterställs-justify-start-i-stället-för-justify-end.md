---
id: TASK-432
title: >-
  Skiva: åtgärdssidans knapp 'Registrera inbetalning för N markerade'
  vänsterställs (justify-start i stället för justify-end)
status: To Do
assignee: []
created_date: '2026-09-07 16:59'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 758000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Marcus 2026-09-07 (S123 resume 1), verbatim: 'På åtgärdssidan: Jag vill flytta knappen "Registrera inbetalning för 18 markerade" till vänster sida istället för höger.' Knappen bor i src/components/events/atgarder/AtgardsSida.tsx (TASK-402.5 AC #1, rad ~3253): containern är '<div className="flex justify-end border-border border-b px-4 py-3">'. Åtgärd: justify-end → justify-start (knappen i linje med blockets vänsterkant, samma vänsterkant som räknaren och korten under). Behåll border/padding. Uppdatera det acceptance-/e2e-test som asserterar knappens placering om något gör det (grep 'Registrera inbetalning för' i tests/), annars lägg till en boundingBox-assertion att knappens vänsterkant ligger inom 16 px från blockets vänsterkant på desktop och mobil 390 px. Docblocken ovanför knappen bokför Marcus beslut med datum.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Knappen står vänsterställd i betalningsblocket på desktop och mobil (boundingBox-mätt, tvåsidigt)
- [ ] #2 Befintliga tester för åtgärdssidans betalningsblock gröna; docblocken bär Marcus beslut 2026-09-07
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
