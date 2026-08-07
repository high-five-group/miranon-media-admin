---
id: TASK-149.2
title: 'Skiva: hypotes-beviset — T126:s rotorsak från OPRÖVAD till MÄTT'
status: In Progress
assignee: []
created_date: '2026-08-07 10:28'
updated_date: '2026-08-07 11:04'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-149
ordinal: 256000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: T126:s rotorsak är belagd eller falsifierad mot faktiska artefakter — mekanismen i systerskivan vilar därmed på mätt grund, inte rimlig gissning. Täcker användarberättelse: 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Resume-vägens skill-laddning prövad mot artefakter: session-resume-skillens faktiska text + S93-sessionsdokets förlopp + prototype-skillens trigger-description — belägg för VARFÖR laddningen uteblev, inte bara ATT den uteblev
- [x] #2 Generaliseringen prövad: minst två andra arbetsform-regler i skills kontrollerade för samma leveransgap (startdörrs-bundenhet)
- [x] #3 T126-kortet uppdaterat via backlog-CLI: rotorsaken omklassad HYPOTES → MÄTT med belägg, eller öppet falsifierad med vad som faktiskt gäller
- [ ] #4 PR armerad, per-jobb-grön
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
