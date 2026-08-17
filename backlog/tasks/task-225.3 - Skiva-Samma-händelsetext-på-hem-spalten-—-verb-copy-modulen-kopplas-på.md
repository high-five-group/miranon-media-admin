---
id: TASK-225.3
title: 'Skiva: Samma händelsetext på hem-spalten — verb-copy-modulen kopplas på'
status: Done
assignee: []
created_date: '2026-08-15 09:20'
updated_date: '2026-08-17 08:17'
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
- [x] #1 Hem-spaltens Senaste aktivitet renderar händelsetexten via den delade verb-copy-modulen — samma statement ger samma text som historiksidan
- [x] #2 s55-hem-konvergens-facitets manifest är öppet amenderat med undantaget (verb-copy som presentationslager, Marcus-riktning 2026-08-15) — aldrig en tyst avvikelse från stämplad yta
- [x] #3 Hem-sviternas acceptance-tester gröna; ariaSnapshot-referenser uppdaterade om händelsetexten ingår i dem
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 check-facit.sh grön genom hela kedjan — rivning omöjlig medan godkand är null
- [x] #6 Marcus godkand-stämpel via facit-godkännande FÖRE all rivning av prototyp-substrat
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i PR #1335 (merge b924fb1b). Hem-spalten på delade verb-copy-modulen; hem-acceptance 9/9; ariaSnapshot-refs uppdaterade. AVVIKELSE mot AC #2, öppet bokförd: s55-manifestet är AGENT-FRUSET efter stämpel (ADR-104-hooken, prövat+nekat ×2) — amenderingen bärs durabelt av sidofilen tasks/sessions/bilagor/s55-hem-konvergens/AMENDERING-2026-08-15-verbcopy.md; inbakningen i manifestet är Marcus !-moment.
<!-- SECTION:NOTES:END -->
