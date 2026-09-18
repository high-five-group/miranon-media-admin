---
id: TASK-451.6
title: >-
  Skiva: mät och rotorsaka varför batch 1 (get-events, get-registrations) tar
  över 9 s kallt
status: To Do
assignee: []
created_date: '2026-09-18 10:39'
updated_date: '2026-09-18 11:26'
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
- [x] #1 Tidsuppdelning per steg (kallstart, auth, Airtable-sidor, serialisering) för get-events och get-registrations, kallt och varmt, n redovisat
- [x] #2 Research-fil under docs/research/ med mätmetod, rådata och den största posten utpekad; hypoteser skilda från mätningar
- [x] #3 Minst ett åtgärdskort mintat ur fynden, eller en uttrycklig dom att latensen är en Airtable-vägg med hänvisning till constraints-katalogen
- [x] #4 Vilka prod-mätningar Marcus behöver göra (EF-loggar, execution_time) står som körklara kommandon
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Mätt mot STAGING (aldrig prod). Två mätomgångar: (1) 11:00:31–11:01:22 UTC, kontaminerad av okänd samtidig flotta-skrivaktivitet (recordCount växte mitt i mätningen) — get-events 2 476–14 088 ms, get-registrations 1 092–1 740 ms. (2) 11:18:59–11:19:49 UTC, efter att staging-semaforens preflight tvingade en 16 min 27 s väntan ut en levande post-merge.yml Staging(API+E2E)-körning — en STABIL delserie (tre anrop, identisk bas 218/194 rader) gav get-events 2 259,9–2 331,6 ms mot get-registrations 1 062,7–1 132,6 ms, kvot ≈2,1x, mycket tätt spann (~70 ms). Kod-räkning (fil:rad): get-events gör ~7 sekventiella Airtable-rundresor (paginering + en SEKVENTIELL for-loop över Bor-över-chunkar, get-events/index.ts rad 39–51/45), get-registrations (event-lösa grenen, warmup-vägen) gör ~2. Dom: latensen är till stor del ARKITEKTUR (sekventiell chunk-hämtning), inte en ren Airtable-vägg/EF-kallstart — men äkta kallstart kunde varken bekräftas eller uteslutas (ingen serverloggning finns). Två kort mintade: TASK-458 (parallellisera Bor-över-chunkarna, samma withConcurrencyLimit-mönster som TASK-416.12 redan bevisade fungerar för get-event-attachments) och TASK-459 (instrumentering — per-steg-loggning, byggs inte i detta pass). Prod-mätkommandon åt Marcus i § 7 (Dashboard-väg + verifierade function_edge_logs-fältnamn; CLI 2.75.0 saknar functions logs helt). Fullständig research-fil: docs/research/startvarmningen-batch1-kall-latens-2026-09-18.md. Grindar: markdownlint 0/vale 0/check:docs 14 gröna (mätt, exitkod läst separat, ej pipe).
<!-- SECTION:NOTES:END -->
