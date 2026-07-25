---
id: TASK-42
title: >-
  Atgarder.tsx åldrad wiring-kommentar — 'Bekräftelsemail: kopplas i 18.6' står
  kvar trots 18.6 levererad
status: To Do
assignee: []
created_date: '2026-07-25 01:48'
labels: []
dependencies: []
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur task-18.16:s review-pilot (2026-07-25), icke-blockerande. SYMPTOM: src/components/events/detail/Atgarder.tsx (~rad 161) säger att bekräftelsemail-raden kopplas i 18.6, men 18.6 är levererad och hantera-flödet landade i deltagarkorten i stället — raden står kvar ariaDisabled med en kommentar som inte längre är sann. FÖRVÄNTAT: kommentaren speglar faktiskt läge (vilken skiva/tråd som wirar utskicksraderna, eller varför de väntar); uppdateras när Åtgärder nästa gång rörs. OBS: när raderna wiras gäller grön-knapp-regeln (DESIGN-SYSTEM-SPEC §19) för knapparna i flödet de leder till.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
