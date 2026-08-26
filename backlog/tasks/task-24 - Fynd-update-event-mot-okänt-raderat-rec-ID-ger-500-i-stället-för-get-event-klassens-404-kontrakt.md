---
id: TASK-24
title: >-
  Fynd: update-event mot okänt/raderat rec-ID ger 500 i stället för
  get-event-klassens 404-kontrakt
status: To Do
assignee: []
created_date: '2026-07-21 23:26'
updated_date: '2026-08-26 03:29'
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
<!-- SECTION:NOTES:END -->
