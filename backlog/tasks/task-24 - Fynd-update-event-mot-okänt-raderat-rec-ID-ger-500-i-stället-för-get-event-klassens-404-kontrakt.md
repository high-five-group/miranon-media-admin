---
id: TASK-24
title: >-
  Fynd: update-event mot okänt/raderat rec-ID ger 500 i stället för
  get-event-klassens 404-kontrakt
status: Done
assignee: []
created_date: '2026-07-21 23:26'
updated_date: '2026-08-26 04:51'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75-batch v2.1, bygg-agenten task-18.1.

Symptom: Airtable PATCH 404 → generisk Error → mapErrorToResponse ger 500; get-event-vägen har 404-mappning, update-vägen saknar den.

Förväntat: NOT_FOUND-mappning i update-event-EF:n + kontraktstest (deny-sviten har mönstret). Staging-EF:n är deployad — fixas där; prod ej berörd (EF:n står inte i prod-allowlisten).
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FIXAT (rotorsak, TASK-24). Grundorsak: updateAirtableRecord (_shared/airtable-client.ts) kastar en generisk Error på varje icke-2xx Airtable-svar; ingen HttpError -> mapErrorToResponse föll till 500-grenen. Fix: en fetchAirtableRecord-pre-check i update-event/index.ts (samma mall som get-event/create-event-note) returnerar manuellt 404 { error: 'Event not found' } om raden inte finns, FÖRE PATCH-anropet. Live-verifierat mot staging (apphjj8Q7lkXCMsL4) 2026-08-26 via curl: PATCH mot ett rec-prefixat men obefintligt ID (recZZZZZZZZZZZZZZ) ger Airtable-svaret 403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND — samma statuskod fetchAirtableRecords egen docblock redan dokumenterar för GET. Kontraktstest tillagt: tests/api/update-event.staging.test.ts ('okänt event (rec-format men finns ej) → 404 (mall-kontraktet, TASK-24)'). Fixen DEPLOYAD till staging (npx supabase functions deploy update-event --project-ref pqtshyierkdgwdnxuirz) — testet kört isolerat mot deployad EF: 13/13 gront, inkl. det nya 404-testet. Filer: supabase/functions/update-event/index.ts, tests/api/update-event.staging.test.ts. Prod ej rörd (EF:n star inte i .prod-functions-allowlist.conf, matchar kortets egen premiss).

Stangningsbatch 2 (S112 resume 1, 2026-08-26): RATTELSE av stale premiss i kortets egna notes. Kortet sager 'Prod ej rord (EF:n star inte i .prod-functions-allowlist.conf...)' - FALSKT, verifierat pa disk: grep -n update-event .prod-functions-allowlist.conf -> traff rad 52; git log visar raden tillagd av commit c6c96a522471dd7d40164483585653c1f6cd73aa ('[S102] prod-allowlisten till app-paritet', 2026-08-11). update-event LIGGER i prod-allowlistan sedan dess - prod kor alltsa fortfarande 500-buggen (denna fix ar bara deployad till STAGING, inte prod) tills en separat prod-EF-deploy gors. Sokt efter ett eget uppfoljningskort for den prod-deployen (python-svep av created_date 2026-08-26 + grep pa update-event+prod+deploy over hela backlog/tasks/) - INGET sadant kort hittades. Bokfors har som en oppen lucka utan registrerat kort.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1988
<!-- SECTION:FINAL_SUMMARY:END -->
