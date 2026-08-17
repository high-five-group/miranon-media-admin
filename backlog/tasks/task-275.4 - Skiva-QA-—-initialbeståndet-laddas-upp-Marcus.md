---
id: TASK-275.4
title: 'Skiva: QA — initialbeståndet laddas upp (Marcus)'
status: To Do
assignee: []
created_date: '2026-08-17 15:38'
labels:
  - ready-for-human
dependencies:
  - TASK-275.1
  - TASK-275.2
  - TASK-275.3
parent_task_id: TASK-275
ordinal: 499000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus laddar upp Roger & Lottas riktiga dokumentbestånd via nya flödet — uppladdningen ÄR testplanen (ADR-118 beslut 5): (1) Ladda upp ett kurstyps-dokument (t.ex. hörlursinfo, RIM) — syns med badge på alla RIM-event inkl. Event-56/59. (2) Ladda upp ett alla-event-dokument — syns överallt. (3) Ladda upp ett event-specifikt — syns bara där. (4) Byt en gemensam bilaga i räckviddsläget — nya versionen syns direkt på alla berörda event. (5) Försök radera en gemensam bilaga ur ett events kontext — går inte, badgen förklarar. (6) Bifoga en gemensam bilaga i ett utskick från åtgärdssidan (mot egen adress eller utan att skicka). (7) Omstämpla dokument-facitets amendering via !-kanalen. Täcker användarberättelser: 6 (slutverifiering av 1-5, 7).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga sju QA-steg i beskrivningen genomförda med bokfört utfall per steg
- [ ] #2 Dokument-facitets amendering omstämplad av Marcus via !-kanalen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
