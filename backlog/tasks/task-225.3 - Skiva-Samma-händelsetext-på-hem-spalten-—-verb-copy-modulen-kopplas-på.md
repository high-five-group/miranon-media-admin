---
id: TASK-225.3
title: 'Skiva: Samma händelsetext på hem-spalten — verb-copy-modulen kopplas på'
status: To Do
assignee: []
created_date: '2026-08-15 09:20'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-225
ordinal: 415000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Konsistensfyndet ur S106-passet: samma händelse visade olika text på hem ('markerade betalning', lagrad display) och i historiken ('markerade en betalning', presentationslagret). Hem-spalten kopplas på den delade modulen. OBS: SenasteAktivitet är stämplad godkänd yta (k10-facit) — ändringen görs MED facit-amendering i undantagslistan, samma form som mittpunkts-undantaget redan bär. Täcker användarberättelse: 7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hem-spaltens Senaste aktivitet renderar händelsetexten via den delade verb-copy-modulen — samma statement ger samma text som historiksidan
- [ ] #2 s55-hem-konvergens-facitets manifest är öppet amenderat med undantaget (verb-copy som presentationslager, Marcus-riktning 2026-08-15) — aldrig en tyst avvikelse från stämplad yta
- [ ] #3 Hem-sviternas acceptance-tester gröna; ariaSnapshot-referenser uppdaterade om händelsetexten ingår i dem
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 check-facit.sh grön genom hela kedjan — rivning omöjlig medan godkand är null
- [ ] #6 Marcus godkand-stämpel via facit-godkännande FÖRE all rivning av prototyp-substrat
<!-- DOD:END -->
