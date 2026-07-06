---
id: TASK-2
title: >-
  Fynd: get-attendance-conformance immun mot event-ackumulering —
  O(1)-fixtursökning
status: To Do
assignee: []
created_date: '2026-07-06 06:45'
updated_date: '2026-07-06 07:28'
labels:
  - ready-for-agent
dependencies: []
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (2026-07-06, CI-run 28755566920 på 6ef4ea8): Test + Build rött — get-attendance-conformance (:79 schema-valid, :97 namn-berikning) föll med 'apiRequestContext.get: Request context disposed' efter retries; övriga 109 api-staging-tester gröna. Kort-diffen (task-1.1) var orelaterad.

ORSAKSKEDJA (diagnos-belagd i S52): findHistoryAttendanceEvent söker fixtur-eventet LINJÄRT — ett get-attendance-anrop per event à ~750–1 300 ms. Staging bar 63 event varav 60 ackumulerade 'ZZ-create-event-test'-sentineller (ADR-060-purgen owirad) → 63 × ~750 ms ≈ 47 s > 30 s test-timeout → context disposed mitt i loopen. Tröskeleffekt: grönt på förmiddagen, deterministiskt rött på kvällen.

INTERIM UTFÖRD (Marcus väg A 2026-07-06): 60 sentinel-event markör-raderade ({Ort}='ZZ-create-event-test'; 0 länkade anmälningar verifierat; RIM-fixturerna 'ZZ-History Ort' orörda) → sviten 7,9 s grön. Ackumuleringen återupptas dock med ~1 event per körning.

FÖRVÄNTAT BETEENDE (detta korts HELA scope efter omscopning 2026-07-06): findHistoryAttendanceEvent filtrerar get-events-svaret på fixtur-signaturen (ort 'ZZ-History Ort') och anropar get-attendance endast på kandidaterna — testet blir IMMUNT mot event-ackumulering oavsett mängd; tydligt fel om fixturen saknas. Ren testkod, inga produktkods- eller EF-ändringar.

UTBRUTET → T64 (tråd-registret): sentinel-purge-wiringen + cred-vägvalet (var bor Airtable-städnings-credentialen?) — behöver Marcus-beslut FÖRST och är därmed tråd-klass, inte byggbar spec (klassnings-praxis kvitterad 2026-07-06).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 findHistoryAttendanceEvent anropar get-attendance ENDAST på fixtur-kandidater filtrerade ur get-events-svaret på fixtur-signaturen — aldrig ett svep över alla event
- [ ] #2 Saknas fixturen ges samma tydliga diagnos-fel som idag ('ZZ-History-deltagande saknas?')
- [ ] #3 get-attendance-sviten grön och dess körtid är opåverkad av antalet icke-fixtur-event i staging
<!-- AC:END -->
