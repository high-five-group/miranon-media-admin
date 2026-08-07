---
id: TASK-149.1
title: 'Skiva: ADR-097 — arbetsformens tillståndsbärare'
status: To Do
assignee: []
created_date: '2026-08-07 10:28'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-149
ordinal: 255000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en framtida läsare förstår ur EN ADR varför arbetsform-regler bärs av tillstånd + mekanism, varför push nekas i iterationsläge, och varför session-batchad push förkastades. Underlag: sessionsdok S99 Del 3 + T126 + push-kadens-researchen 2026-07-26. Täcker användarberättelser: 5, 8
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: ADR-097 nästa lediga nummer verifierat mot disk (filcount == README == sista+1); ADR-096:s slutliga form läst på main FÖRE författning
- [ ] #2 ADR-097 författad: principen (regler bor i tillstånd som mekanismer läser, inte i startdörrar), mekanismvalet (a)+(b) med decline-rationale för (c) skill-laddning-vid-resume och (d) alltid-laddad-yta, push-ekonomins princip, session-batchad push FÖRKASTAD med de fyra mätta skälen
- [ ] #3 README-rad + rot-READMEs ADR-räkning bumpade; docs-grindarna gröna lokalt
- [ ] #4 PR armerad med gh pr merge --auto, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
