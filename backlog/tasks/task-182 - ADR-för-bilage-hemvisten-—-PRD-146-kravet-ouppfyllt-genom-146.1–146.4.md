---
id: TASK-182
title: ADR för bilage-hemvisten — PRD-146-kravet ouppfyllt genom 146.1–146.4
status: To Do
assignee: []
created_date: '2026-08-10 08:58'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 349000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur S102-batchen (kort ②, 146.4-agenten): PRD task-146 kräver uttryckligen en ADR för bilage-hemvisten ('ADR KRÄVS... mintas separat') men varken 146.1, 146.2, 146.3 eller 146.4 mintade den. Besluten är TAGNA och levererade (additiv Bilagor-tabell i basen + privat Supabase-bucket med signerad åtkomst + adapter-kontraktet uploadAttachment i båda mönstren) — ADR:n dokumenterar dem i efterhand med 146-kortens implementation notes som underlag. Över ADR-baren: svår att återställa, överraskande utan kontext (split Airtable-metadata/Supabase-bytes), verklig avvägning (mönster 1 vs 2, TUS avvisad).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ADR mintad med besluten + avvisade alternativ ur 146.1–146.4:s notes, README-katalogen synkad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
