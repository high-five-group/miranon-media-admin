---
id: TASK-42
title: >-
  Atgarder.tsx åldrad wiring-kommentar — 'Bekräftelsemail: kopplas i 18.6' står
  kvar trots 18.6 levererad
status: Done
assignee: []
created_date: '2026-07-25 01:48'
updated_date: '2026-08-24 15:46'
labels:
  - ready-for-agent
  - wontfix
  - intentionally-unchecked
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Beslutat av Code på Marcus-mandat 2026-08-24 (GO i klartext), S112. Motiv: citerad kommentar existerar inte längre (grep 0 träffar, 2026-08-24). Ingen divergens — belägget höll exakt som uppdraget beskrev.

OBOCKAT MED AVSIKT: förkastat (wontfix) — den citerade kommentaren existerar inte längre i filen.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-24 14:41
---
WONTFIX 2026-08-24 (S112, Marcus-mandat): den citerade kommentaren ('Bekräftelsemail: kopplas i 18.6') finns inte längre i src/components/events/detail/Atgarder.tsx — grep -n 'kopplas i 18.6\|18\.6' mot filen gav 0 träffar (2026-08-24). Åtgärds-gruppen där kommentaren bodde revs helt via TASK-162.2 (ADR-103 B2 steg 1) och ersattes av AtgarderKort/SkrivUtKort; filens nya docblock (rad 162-189) redogör i stället för radens verkliga historik ('bekräftelsemail · betalningspåminnelse · markera betalda · eventinfo' flyttade till en gemensam ingång 2026-08-05) och dagens kopplade tillstånd (TASK-147.8). Fyndets objekt är borta.
---
<!-- COMMENTS:END -->
