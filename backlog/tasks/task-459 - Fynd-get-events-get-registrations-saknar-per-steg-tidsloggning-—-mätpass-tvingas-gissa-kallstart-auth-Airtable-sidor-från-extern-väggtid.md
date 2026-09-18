---
id: TASK-459
title: >-
  Fynd: get-events/get-registrations saknar per-steg-tidsloggning — mätpass
  tvingas gissa kallstart/auth/Airtable-sidor från extern väggtid
status: To Do
assignee: []
created_date: '2026-09-18 11:10'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 798000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
task-451.6 (docs/research/startvarmningen-batch1-kall-latens-2026-09-18.md) mätte get-events/get-registrations enbart som EN extern väggtid per anrop (curl mot deployad EF) — koden loggar inga steg (verifierat: grep 'console\.|performance.now|Date.now' i get-events/index.ts, get-registrations/index.ts, _shared/airtable-client.ts, _shared/eventpris.ts, _shared/registration-read.ts, _shared/errors.ts gav noll timing-träffar, bara errors.ts:110/112 console.info/error vid FEL). Följden: kallstart (Deno-isolat-boot), auth (requireUser → supabase.auth.getUser()), varje Airtable-sidas svarstid och serialiseringen kan inte särskiljas utan extern gissning. Samma slutsats gäller sannolikt fler get-*-EF:er (samma _shared/airtable-client.ts-kärna). Bygg INTE i detta kort — endast instrumentering, ingen beteendeändring.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 get-events och get-registrations loggar (console.info, strukturerad JSON likt errors.ts:110) minst: auth-tid (requireUser), varje Airtable-anrops varaktighet (kan bo i airtable-client.ts centralt så alla anropare ärver det gratis), och total handler-tid
- [ ] #2 Loggformen är sökbar i Supabase Logs Explorer (function_edge_logs, metadata.execution_time_ms) utan att kräva en ny extern mätrigg
- [ ] #3 Ingen beteendeändring i svaret — enhetstesterna (tests/api) oförändrat gröna
- [ ] #4 Dokumenterat i EF-header/docblock varför loggningen finns (så nästa mätpass hittar den utan att söka)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
