---
id: TASK-309.3
title: >-
  Skiva 2: Skrivvägarna — eventets kopior, spara som platsens standard,
  eventinnehåll och agenda
status: Done
assignee: []
created_date: '2026-08-23 14:04'
updated_date: '2026-08-24 17:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-309.2
parent_task_id: TASK-309
ordinal: 564000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Det Lotta ändrar i genereringsvyn och det Roger underhåller på Mer-sidan hamnar i basen — per event som kopia, eller som platsens/eventinnehållets standard. Efter skivan överlever varje redigering en sidomladdning. Täcker användarberättelser: 3, 4, 5, 18, 19, 31.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En EF sparar ett blocks kopia på eventet ((bilagetext)-fält eller eventets Agendapunkter-rader — ersätter rader atomärt per dag) och kan tömma kopian (tillbaka till standard); staging-test i båda riktningar
- [x] #2 En EF sparar platsens standard (Platser-raden) för adress/parkering/transport/kläder och föder platsen om den saknas, länkar eventet — 'spara som platsens standard' enligt Del 2 § D beslut 6; staging-test bevisar att ett annat event på samma plats får den nya standarden och att det redigerade eventets kopia töms
- [x] #3 En EF sparar Eventinnehåll-radens standardtexter och dess Agendapunkter (för Mer-sidan); staging-test
- [x] #4 Adapter-kontraktet, båda adaptrarna och mutations-hookar med invalidering av dokumentunderlaget; lagervakten grön
- [x] #5 Fält-allowlisten för skrivning bär exakt de nya fälten och inget mer
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [x] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Skiva 2 levererade bilagornas skrivvägar i staging: save-event-text (eventets kopior i (bilagetext)-fälten och eventets Agendapunkter, rader ersatta atomärt per dag, samt tömning av kopian tillbaka till standard), save-place-standard (platsens standard för adress/parkering/transport/kläder, föder platsen om den saknas och länkar eventet — "spara som platsens standard" per Del 2 § D beslut 6) och save-event-content (Eventinnehåll-radens standardtexter och dess standardagenda, för Mer-sidan). Klientlagret: adapter-kontraktet, båda adaptrarna och mutations-hookar med invalidering av dokumentunderlaget. Fält-allowlisten för skrivning avgränsad till exakt de nya fälten.

BARS AV: PR #1874, commit 49aba1a0 (MERGED 2026-08-23T16:35Z, 25 filer).
GRIND-UTFALL: 11 CheckRuns SUCCESS + 3 SKIPPED + Vercel SUCCESS på exakt 49aba1a0 — noll icke-gröna. Landad via merge-kön.

Staging-testerna som bevisar skrivvägarna i båda riktningar ligger i tests/api/save-event-text.staging.test.ts, save-place-standard.staging.test.ts och save-event-content.staging.test.ts; deras sentinel-rader är purge-täckta (targets med prefix ^ZZ-TASK-309.3-, verifierade gröna 2026-08-24 via `node scripts/test-purge-staging-sentinels.mjs`, exit 0).

DoD-belägg: #3 bockad 2026-08-24 mot den mätta check-rollupen ovan. Punkterna #1, #2, #4, #5 och #6 var redan bockade av bygg-agenten; #6 dessutom oberoende ommätt 2026-08-24 — lagervakten `tests/api/attachment-layer-independence.test.ts` 7/7 gröna, exit 0.

Stängd av orkestrerad stängningsagent 2026-08-24 mot post-merge-bevis.
<!-- SECTION:FINAL_SUMMARY:END -->
