---
id: TASK-458
title: >-
  Fynd: get-events kör Bor-över-batchen sekventiellt — parallellisera chunkarna
  som TASK-416.12 redan gjorde för get-event-attachments
status: To Do
assignee: []
created_date: '2026-09-18 11:10'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 797000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
get-events (supabase/functions/get-events/index.ts) gör fetchFromAirtable('Eventplanering') (full paginering, do/while), och parallellt (Promise.all) fetchBorOverAntalByEvent + hamtaStandardpriser. INUTI fetchBorOverAntalByEvent kör fetchByRecordIds (rad 39–51) sina ceil(N/50)-chunkar i en SEKVENTIELL for-loop med await (rad 45), inte parallellt — samma mönster get-event-attachments hade FÖRE TASK-416.12 (Done, PR-mätt 16,8 % median-besparing i staging via withConcurrencyLimit, ATTACHMENTS_CHUNK_CONCURRENCY=2, supabase/functions/get-event-attachments/index.ts rad 108–176). Mätt (task-451.6, docs/research/startvarmningen-batch1-kall-latens-2026-09-18.md): get-events varm-latens 2,5–8,4 s mot staging (~190 event / ~180 länkade Anmälningar, ceil(180/50)=4 chunkar), medan get-registrations (samma tabellstorleksordning, EN paginerad hämtning utan chunkning) tar 1,1–1,7 s — differensen är arkitektur (antal sekventiella Airtable-anrop), inte enbart datavolym eller EF-kallstart. I PROD (57 event, men 816+ historiska Anmälningar per data-model.md §Kända fällor 43 — betydligt fler länkade registrerings-ID:n att chunk-hämta) väntas differensen vara STÖRRE, inte mindre — overifierat, HYPOTES, prod är förbjuden mark för agenter (TASK-419).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Chunkarna i fetchByRecordIds (get-events/index.ts) körs via samma withConcurrencyLimit-mönster som get-event-attachments (TASK-416.12), med en uttryckligen motiverad koncurrency-gräns mot P4 (5 req/s delat tak)
- [ ] #2 Svaret är byte-identiskt före/efter för samma dataset (diff bifogad i PR)
- [ ] #3 Mätserie bifogad: minst 5 varma anrop mot staging före/efter på samma tidsfönster (interfolierat eller tidsstämplat så fleet-aktivitet inte förväxlas med förbättringen — se task-451.6-fyndet om samtidig datatillväxt under mätning)
- [ ] #4 EF-testerna gröna (tests/api), deployad till staging av agenten; prod-deploy bokförs som öppen Marcus-skuld (fas4-prod-deploy.sh)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
