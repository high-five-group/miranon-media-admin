---
id: TASK-451.5
title: 'Skiva: preconnect mot Supabase i index.html'
status: To Do
assignee: []
created_date: '2026-09-18 10:39'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
parent_task_id: TASK-451
priority: medium
ordinal: 789000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prod-`index.html` (mätt 2026-09-18 mot admin.miranon.dev) bär 0 `preconnect` och 42 `modulepreload`. DNS + TCP + TLS mot Supabase startar först när första anropet fyrar — efter en vecka i vila är det token-refreshen, mitt i Förberedelseskärmen. web.dev rekommenderar preconnect för tredjeparts-origin på kritisk väg.

Origin är miljöberoende (staging/prod): använd Vites HTML-env-ersättning eller motsvarande, hårdkoda inte. Kontrollera CSP/headers i `vercel.json` och att service workerns precachade `index.html` får samma tagg. Underlag § 1.1, § 6 punkt 4.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Byggd index.html för production respektive staging bär preconnect (med crossorigin) mot rätt Supabase-origin — verifierat i dist, inte antaget
- [ ] #2 Ingen hårdkodad origin i källan; saknas env-värdet bryts bygget eller taggen utelämnas — aldrig en tom/felaktig href
- [ ] #3 DoD-grindarna gröna; befintliga e2e/acceptance orörda
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
