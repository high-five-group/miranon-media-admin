---
id: TASK-451.4
title: 'Skiva: tidsgräns per hämtning och EN retry-policy på startvärmningens väg'
status: To Do
assignee: []
created_date: '2026-09-18 10:39'
labels:
  - ready-for-agent
dependencies:
  - TASK-451.3
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
parent_task_id: TASK-451
priority: high
ordinal: 788000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ingen `AbortController`/fetch-timeout finns någonstans (`src/data/utils.ts:35–65`) — en hängande EF hänger tills webbläsarens socket-timeout. Två retry-lager staplas: `fetchWithRetry` (4 försök) x query-lagrets globala `retry: 3` (`src/router.ts:21–22`) = upp till 16 anrop per warmup-item. TASK-420 rättade ett nyckel-specifikt symptom, inte staplingen.

Underlag § 1.7, § 6 punkt 5–6. Research före design: hur TanStack Query-dokumentationen och branschen placerar retry (ETT lager) och timeout (AbortSignal.timeout, signal från queryFn-kontexten).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rött-först: en EF som aldrig svarar — i dag hänger anropet obegränsat; efter fix avbryts det vid en config-satt gräns och räknas som misslyckat
- [ ] #2 Varje adapter-hämtning bär en avbrytbar tidsgräns kopplad till TanStack Querys signal; värdet bor på ETT ställe
- [ ] #3 Retry sker i ETT lager på warmup-vägen; värsta fallet per item är dokumenterat i koden och högst 4 anrop
- [ ] #4 4xx retryas aldrig på warmup-vägen (samma regel som useDashboardData.noRetryOn4xx)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
