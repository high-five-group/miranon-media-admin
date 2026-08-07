---
id: TASK-24
title: >-
  Fynd: update-event mot okänt/raderat rec-ID ger 500 i stället för
  get-event-klassens 404-kontrakt
status: To Do
assignee: []
created_date: '2026-07-21 23:26'
updated_date: '2026-08-07 11:19'
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
