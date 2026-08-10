---
id: TASK-190
title: >-
  Staging create-event svarar 500 Internal error — odiagnostiserad, ingen
  Airtable-skrivning
status: To Do
assignee: []
created_date: '2026-08-10 17:36'
labels: []
dependencies: []
ordinal: 356000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (mätt 2026-08-10, FRAMME-verifikatets pass): POST mot staging-EF:en create-event (pqtshyierkdgwdnxuirz) med giltigt kontrakt (samma form som tests/api/create-event.staging.test.ts, eventtyp-ankare recclDd7hUQsfxoVs verifierat existerande) → 500 med body error 'Internal error', requestId 7ed822c6-64e2-4ab7-bb2b-1cd3759ba2ae. Verifierat via search_records att INGEN post skrevs i staging-basen (apphjj8Q7lkXCMsL4/Eventplanering). FÖRVÄNTAT: create-event skapar eventet eller svarar med klassat fel. Diagnos: läs EF-loggarna för requestId:t i dashboard; kan vara transient — reproducera först. OBS: CI:s create-event.staging-test har varit grönt — jämför testets exakta payload mot passets innan slutsats.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
