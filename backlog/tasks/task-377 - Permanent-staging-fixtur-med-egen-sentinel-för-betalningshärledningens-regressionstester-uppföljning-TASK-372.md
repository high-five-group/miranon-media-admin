---
id: TASK-377
title: >-
  Permanent staging-fixtur med egen sentinel för betalningshärledningens
  regressionstester (uppföljning TASK-372)
status: To Do
assignee: []
created_date: '2026-09-03 09:46'
labels:
  - ready-for-agent
dependencies: []
ordinal: 675000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Bakgrund
TASK-372 (PR #2244) fick inget staging-regressionstest: en återanvänd ZZ-create-event-fixtur blir purge-flakig, och ett nytt event med länkad anmälan blir permanent opurgbart (linkGuard i scripts/purge-staging-sentinels.mjs; ingen delete-registration-EF finns). Marcus beslut 2026-09-03: registreras som eget kort i stället för att utvidga PR:en.

## Förväntat beteende
En permanent fixtur (event + anmälan, egen sentinel-ort) registrerad i .purge-staging-policy.json OCH i CONTRIBUTING.md:s uppräkning (annars fäller scripts/check-listparitet.sh), med ett stagingtest som gör rundturen registrera helpris (okänd avgift) → Mottagen → radera → Ej mottagen mot skarpa EF:er. Skarpbevisets manus finns som skript i S115-sessionens scratchpad (task-372-fasB.mjs) och i PR #2244:s kropp.

## Källa
S115 Del 5; review-utlåtande PR #2244 runda 1 (ask-user); Marcus: 'Kör på dina rekommendationer'.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
