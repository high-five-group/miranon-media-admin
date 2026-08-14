---
id: TASK-201.18
title: 'Riv: två döda mutations-hooks (useConfirmAll, useLogPaymentReminder)'
status: To Do
assignee: []
created_date: '2026-08-14 19:24'
updated_date: '2026-08-14 19:27'
labels: []
dependencies: []
parent_task_id: TASK-201
ordinal: 401000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-mandat (via orkestreraren, 2026-08-14, S105): RIV `useConfirmAll` (src/data/mutations/registrationConfirmation.ts) och `useLogPaymentReminder` (src/data/mutations/registrationPayments.ts) — TASK-201.13 bokförde noll anropsplatser för båda (konsumenter rivna i TASK-145.3 resp. TASK-145.6), instrumenterade dem ändå för invariantens skull men lämnade rivningen öppen som Marcus-scope-beslut. Rivningen stod som öppet moment i tasks/todo.md rad 28 och TASK-201.13-kortets notes. Omfattning: hook-definitionerna + imports, den exklusiva verb-hjälparen betalningspaminnelseVerb i activityTypes.ts (delade verb/hjälpare rörs ej), motsvarande poster i tests/api/activity-log-luckor-statements.test.ts, samt om-mätning av mutationskatalog-invarianten.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Båda hook-definitionerna + deras unika imports rivna; grep bekräftar noll kvarvarande referenser (utom historik i git-loggen)
- [ ] #2 betalningspaminnelseVerb riven ur activityTypes.ts EFTER bekräftat att den saknar andra konsumenter än useLogPaymentReminder; delade verb/hjälpare (BEKRAFTADE_ANMALAN_VERB, registrationObjectId m.fl.) orörda
- [ ] #3 tests/api/activity-log-luckor-statements.test.ts beskuren: posterna för de två rivna hooksen borttagna, filens övriga poster (useUpdatePaymentNote/useSendActionTestEmail) intakta och gröna
- [ ] #4 Mutationskatalog-invarianten ommätt efter rivning och bokförd i kortet med FAKTISKT tal (förväntat 16/16/0 mot 18/18/0 före); tests/api/mutation-hemvist-vakt.test.ts fortsatt grönt
- [ ] #5 Historiknot med rivnings-commitens SHA bokförd i kortets notes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
