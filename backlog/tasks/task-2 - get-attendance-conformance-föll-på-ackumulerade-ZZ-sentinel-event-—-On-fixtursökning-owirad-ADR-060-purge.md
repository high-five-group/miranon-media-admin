---
id: TASK-2
title: >-
  Fynd: get-attendance-conformance immun mot event-ackumulering —
  O(1)-fixtursökning
status: In Progress
assignee: []
created_date: '2026-07-06 06:45'
updated_date: '2026-07-06 07:31'
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
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 findHistoryAttendanceEvent anropar get-attendance ENDAST på fixtur-kandidater filtrerade ur get-events-svaret på fixtur-signaturen — aldrig ett svep över alla event
- [x] #2 Saknas fixturen ges samma tydliga diagnos-fel som idag ('ZZ-History-deltagande saknas?')
- [x] #3 get-attendance-sviten grön och dess körtid är opåverkad av antalet icke-fixtur-event i staging
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: kandidat-filter på HISTORY_FIXTURE_ORT='ZZ-History Ort' (fixtur-signaturen, Session 23 L5b) före get-attendance-anropen — max 3 anrop oavsett event-mängd (strukturell immunitet, AC 3); svepets per-event-shape-validering medvetet offrad (var O(n)-drivaren; EF-kontraktet bevisas av kandidaternas parse + 400/401/404-testerna). Sviten 6/6 grön 10,7 s; hela test:api 290 passed 16,7 s. TDD: undantag (test-infra-kort per do-work-regeln — ingen produktkod).
<!-- SECTION:NOTES:END -->
