---
id: TASK-149.1
title: 'Skiva: ADR-097 — arbetsformens tillståndsbärare'
status: Done
assignee: []
created_date: '2026-08-07 10:28'
updated_date: '2026-08-09 07:59'
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
- [x] #1 Premiss-pass: ADR-097 nästa lediga nummer verifierat mot disk (filcount == README == sista+1); ADR-096:s slutliga form läst på main FÖRE författning
- [x] #2 ADR-097 författad: principen (regler bor i tillstånd som mekanismer läser, inte i startdörrar), mekanismvalet (a)+(b) med decline-rationale för (c) skill-laddning-vid-resume och (d) alltid-laddad-yta, push-ekonomins princip, session-batchad push FÖRKASTAD med de fyra mätta skälen
- [x] #3 README-rad + rot-READMEs ADR-räkning bumpade; docs-grindarna gröna lokalt
- [x] #4 PR armerad med gh pr merge --auto, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad via PR #863 (merge f3ee43d1), CI grön per jobb. ADR-097 mintad.

[TASK-169, backlog-städet, 2026-08-09] DoD #1-4 bockade mot belägg (natt-grind run 31291660374: status Done, 0 AC/4 DoD obockade — bokföringsfel, inte saknat arbete). #1: AC redan [x]. #2: PR #863 (merge f3ee43d1, 2026-08-07T11:06:16Z) — alla jobb gröna. #3: PR #863 MERGED, per-jobb-grön. #4: diff scopad till README.md, kortfilen, docs/decisions/ADR-097-arbetsformens-tillstandsbarare.md, docs/decisions/README.md — ADR-097 verifierad på main.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
