---
id: TASK-451.6
title: >-
  Skiva: mät och rotorsaka varför batch 1 (get-events, get-registrations) tar
  över 9 s kallt
status: To Do
assignee: []
created_date: '2026-09-18 10:39'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
parent_task_id: TASK-451
priority: high
ordinal: 790000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tidsgränsen slog till 2026-09-18 (Sentry-belagt), alltså tog minst en av de två tyngsta hämtningarna över 9 s. S123 mätte 1,0–1,6 s varmt / 10,3 s kallt mot staging för bilage-EF:en. Oklart VAD som kostar: Edge Function-kallstart, sekventiell Airtable-paginering (5 anrop/s-väggen, docs/reference/airtable-constraints.md), datavolymen (hela Anmälningar-tabellen hämtas event-löst) eller `getAuthHeader()` per anrop.

Detta är ett MÄTPASS mot STAGING (aldrig prod — prod-loggarna är Marcus kanal): instrumentera tidsuppdelning per steg, kör kallt och varmt, skriv fynden som docs/research/-fil och minta åtgärdskort ur dem. Inga åtgärder byggs i denna skiva. Underlag § 4 H-C, § 1.8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tidsuppdelning per steg (kallstart, auth, Airtable-sidor, serialisering) för get-events och get-registrations, kallt och varmt, n redovisat
- [ ] #2 Research-fil under docs/research/ med mätmetod, rådata och den största posten utpekad; hypoteser skilda från mätningar
- [ ] #3 Minst ett åtgärdskort mintat ur fynden, eller en uttrycklig dom att latensen är en Airtable-vägg med hänvisning till constraints-katalogen
- [ ] #4 Vilka prod-mätningar Marcus behöver göra (EF-loggar, execution_time) står som körklara kommandon
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
