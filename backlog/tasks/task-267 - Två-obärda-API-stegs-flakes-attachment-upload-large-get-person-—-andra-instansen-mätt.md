---
id: TASK-267
title: >-
  Två obärda API-stegs-flakes: attachment-upload-large + get-person — andra
  instansen mätt
status: To Do
assignee: []
created_date: '2026-08-17 10:16'
updated_date: '2026-08-17 10:59'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 483000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Registrerade i task-256:s notes (attachment-upload-large.staging.test.ts:101 + get-person.staging.test.ts:130) som obärda; get-person fällde IGEN 2026-08-17 i 261-agentens körning (rad 119, differentialbevisat preexisterande: identisk fällning på orörd baseline, 19/19 grön isolerat). Två instanser = mönster, inte brus. Diagnos per 256:s metodik (expect.poll-klassen? annan rot?) — riggen npm run metrics:flake för mätserien, läs ut n före tolkning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Båda testernas fällningsmekanism diagnosticerad med belägg (256-metodiken som förlaga)
- [ ] #2 Åtgärd landad eller klassen öppet bokförd med motivering + mätdata
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RELATERAD MEN SEPARAT KLASS (266-agentens bifynd, 2026-08-17): acceptance-svitens oanvänd-stub-vakt gav exit 1 (GET */auth/v1/passkeys) i 1 av 4 körningar medan 16/16 tester passerade — baslinje ren, isolerad omkörning ren, identisk omkörning ren. Vakten varnar själv för falska fynd vid delmängdskörning. En observation; eget kort mintas vid nästa instans — bokförd här för mönsterspårning, INTE samma mekanism som API-stegs-flakesen ovan.
<!-- SECTION:NOTES:END -->
