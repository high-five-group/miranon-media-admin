---
id: TASK-427
title: >-
  Fynd: backlog-stängning (nightly) rött — 22 Done/To-Do-kort utanför S121 med
  obockad DoD eller omvänd invariant 1; TASK-425:s 'två äldre listor'-premiss
  var fel, bocka mot belägg eller öppna ärligt, enbart via CLI
status: To Do
assignee: []
created_date: '2026-09-07 15:55'
updated_date: '2026-09-07 15:55'
labels:
  - ready-for-agent
dependencies: []
ordinal: 757000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: efter TASK-425:s fix av S121:s nio kort (374.5, 381, 402.1, 402.3, 402.4, 402.8, 410, 411, 412), lokal körning av scripts/check-backlog-closure.sh (CI:s exakta form, nightly.yml jobbet 'Backlog-stängning (natt-grind)') visar exit 1 med 22 KVARVARANDE inkonsistenta kort av 870 prövade — noll av dem är någon av S121:s nio. PREMISS-KORRIGERING (ADR-086): TASK-425:s beskrivning karaktäriserade nightly-loggens 'två äldre listor (41 resp. 25 kort-ID:n)' som invariant 1/3-fällningar. Det är FALSKT, verifierat mot scripts/check-backlog-closure.sh och en färsk körning: de två listorna är loggens 'Stängningsformer bland de 870 korten'-sektion — 25 kort godkända via härledd DoD-rad/landnings-pekare ('CI grön per jobb') och 41 (nu 43 efter TASK-425:s två nya intentionally-unchecked-kort) stängda med etiketten 'intentionally-unchecked' + markören 'OBOCKAT MED AVSIKT:'. BÅDA är redan UNDANTAGNA från invariant 2 och visas ALDRIG som ❌-rader — de fäller inte grinden, och kräver därför inget eget fynd-kort enligt TASK-425 AC #3:s bokstav. De 22 korten i DETTA kort är en separat, tidigare obekant population: 21 invariant-2-fällningar (status Done, AC och/eller DoD obockade) plus 1 invariant-1-fällning (TASK-368.2: samtliga 5 AC avbockade men status 'To Do'). Full lista (kort-ID — fällningsform): TASK-346.7.1 (Done, 1 AC/3 DoD obockade), TASK-379 (Done, 0/3), TASK-416.1 (Done, 0/3), TASK-416.5 (Done, 0/3), TASK-416.7 (Done, 0/3), TASK-416.8 (Done, 0/3), TASK-416.9 (Done, 0/3), TASK-416.12 (Done, 0/3), TASK-416.16 (Done, 0/3), TASK-416.17 (Done, 0/3), TASK-416.18 (Done, 0/3), TASK-239 (Done, 1 AC/1 DoD), TASK-241.5 (Done, 0/1), TASK-284.4 (Done, 0/1), TASK-338.1 (Done, 0/3), TASK-338.2 (Done, 0/1), TASK-338.3 (Done, 0/2), TASK-338.4 (Done, 0/1), TASK-338.5 (Done, 0/3), TASK-346.9 (Done, 1 AC/2 DoD), TASK-346.10 (Done, 2 AC/2 DoD), TASK-368.2 (samtliga 5 AC avbockade, status To Do — invariant 1, motsatt riktning: fix är att STÄNGA kortet, inte bocka DoD). Åtgärd per kort: läs kortets notes/PR/commit-belägg (gh pr list --search 'TASK-<id> in:title'), bocka DoD/AC-punkterna mot belägget via 'task edit --check-dod'/'--check-ac' — eller, saknas belägg, öppna/stäng kortet ärligt med skäl i notes (för TASK-368.2: sätt status Done om arbetet är bevisat, annars dokumentera varför inte). Kortfiler ändras ENBART via backlog-CLI:t (PreToolUse-hooken nekar direktredigering). Kör grinden lokalt med CI:s exakta kommando (bash scripts/check-backlog-closure.sh, exitkod fångad separat) efter varje batch för att verifiera framsteg.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Vart och ett av de 22 korten: DoD/AC bockat med belägg (PR-nummer/SHA) i notes ELLER kortet öppnat/stängt ärligt med skäl — inget kort lämnat i mellanläge
- [ ] #2 Grinden körd lokalt med CI:s kommando ur nightly.yml (jobbet Backlog-stängning); exit 0, eller kvarvarande ❌-rader bevisat vara EN NY, ännu okänd population bokförd i notes med kort-ID (aldrig antaget höra till detta korts 22)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
