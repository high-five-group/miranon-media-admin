---
id: TASK-458
title: >-
  Fynd: get-events kör Bor-över-batchen sekventiellt — parallellisera chunkarna
  som TASK-416.12 redan gjorde för get-event-attachments
status: To Do
assignee: []
created_date: '2026-09-18 11:10'
updated_date: '2026-09-18 13:50'
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
- [x] #1 Chunkarna i fetchByRecordIds (get-events/index.ts) körs via samma withConcurrencyLimit-mönster som get-event-attachments (TASK-416.12), med en uttryckligen motiverad koncurrency-gräns mot P4 (5 req/s delat tak)
- [x] #2 Svaret är byte-identiskt före/efter för samma dataset (diff bifogad i PR)
- [x] #3 Mätserie bifogad: minst 5 varma anrop mot staging före/efter på samma tidsfönster (interfolierat eller tidsstämplat så fleet-aktivitet inte förväxlas med förbättringen — se task-451.6-fyndet om samtidig datatillväxt under mätning)
- [x] #4 EF-testerna gröna (tests/api), deployad till staging av agenten; prod-deploy bokförs som öppen Marcus-skuld (fas4-prod-deploy.sh)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Ändring

fetchByRecordIds (get-events/index.ts) kör nu sina ceil(N/50)-chunkar via samma withConcurrencyLimit-mönster som get-event-attachments (TASK-416.12) i stället för en sekventiell for-loop med await. Hjälparen LYFTES UR get-event-attachments/index.ts till en ny delad modul (supabase/functions/_shared/concurrency.ts, tillagd i tsconfig.edge-shared.json:s include-lista) i stället för att kopieras — nu återanvänd av båda EF:erna. Nytt tak: BOR_OVER_CHUNK_CONCURRENCY = 2, motiverat mot get-events EGEN SAMLADE samtidighet (Bor-över-chunkarna körs i samma Promise.all som hamtaStandardpriser, som gör högst ETT Airtable-anrop — så störst samtidighet blir 2+1=3, samma tak/motiv som get-event-attachments redan etablerat mot P4).

## Mätserie (staging pqtshyierkdgwdnxuirz, varma anrop, rå fetch mot deployad EF, GET /functions/v1/get-events utan query-params)

Fönster 2026-09-18 13:32:23–13:33:59 UTC (tidsstämplat, INTE blockat), recordCount STABILT 144 över SAMTLIGA 10 anrop.

| Anrop | Före (ms) | Efter (ms) |
|---|---|---|
| 1 | 2642.4 | 2663.2 |
| 2 | 2273.4 | 1863.1 |
| 3 | 2166.2 | 1838.4 |
| 4 | 2299.3 | 1860.6 |
| 5 | 2251.8 | 1826.5 |
| Median | 2273.4 | 1860.6 |

Median-besparing: ~412,8 ms (~18,2 %). Efter-anrop 1 (2663,2 ms) är en uteliggare (sannolikt kallare isolat direkt efter deploy) — de fyra följande ligger tätt (1826,5–1863,1 ms), samtliga snabbare än VARJE före-anrop.

## Byte-diff (AC #2)

Rå svarskropp sparad för alla 10 anrop. ALLA 25 möjliga före×efter-par är BYTE-IDENTISKA (diff -q, exit 0, 0 rader skilda, 89124 byte i samtliga). Bevisar determinismen starkare än ett par: withConcurrencyLimits indexerade skrivning bevarar ordningen oavsett svarsordning. Sanity: 401 (ingen JWT), 405 (fel metod) oförändrat.

## EF-tester (tests/api)

get-event-attachments.staging.test.ts: 12/12 gröna i BÅDA körningarna. edge-functions.staging.test.ts (get-events auth deny-path, 4 fall): gröna i BÅDA körningarna. INGEN testfil som rör get-events eller get-event-attachments fälldes.

Full npm run test:api kördes två gånger under mycket hög samtidig flotta-aktivitet (staging-preflighten låst ~64 min innan mätningen kunde starta). Körning 1: 9 failed (2320 passed). Körning 2: 5 failed (2327 passed). Unionen av de 14 fällda testerna (cancel-registration, get-document-sources, get-registrations x2, hamta-inbetalningar-batch, hamta-oppna-betalningar-kvitto-avbojt, save-event-text, save-place-standard, send-registration-confirmation, skapa-om-event-bilaga) rör INGEN get-events/get-event-attachments/_shared/concurrency.ts — signaturen är Test timeout 30000ms / Request context disposed (delad-bas-kontention, samma mönster TASK-416.12 dokumenterade och friade sin EF med).

## Deploy till staging

get-events och get-event-attachments deployade till pqtshyierkdgwdnxuirz (staging). UPDATED_AT: get-events 2026-09-18T13:33:25.539Z (v42), get-event-attachments 2026-09-18T13:33:33.889Z (v33) — sekunder efter deploy-kommandot. Prod-deploy INTE utförd (mekaniskt förbjudet, TASK-419) — öppen Marcus-skuld, fas4-prod-deploy.sh --deploya i eget terminalfönster.
<!-- SECTION:NOTES:END -->
