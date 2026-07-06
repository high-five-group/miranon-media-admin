---
id: TASK-2
title: >-
  get-attendance-conformance föll på ackumulerade ZZ-sentinel-event —
  O(n)-fixtursökning + owirad ADR-060-purge
status: To Do
assignee: []
created_date: '2026-07-06 06:45'
labels: []
dependencies: []
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (2026-07-06, CI-run 28755566920 på 6ef4ea8): Test + Build rött — get-attendance-conformance (:79 schema-valid, :97 namn-berikning) föll med 'apiRequestContext.get: Request context disposed' efter retries; övriga 109 api-staging-tester gröna. Kort-diffen (task-1.1, frontend + hem-e2e) var orelaterad.

ORSAKSKEDJA (diagnos-belagd i S52): findHistoryAttendanceEvent söker fixtur-eventet LINJÄRT — ett get-attendance-anrop per event à ~750–1 300 ms. Staging-Eventplanering bar 63 event varav 60 var 'ZZ-create-event-test'-sentineller ackumulerade av create-event-conformance (en per allow+409-körning; ADR-060 § öppna trådar förutsåg tillväxten som 'bounded tills purge wiras'). 63 × ~750 ms ≈ 47 s > 30 s test-timeout → context disposed mitt i loopen. TRÖSKELEFFEKT: grönt på förmiddagen, deterministiskt rött på kvällen — och CROSS-TEST-blastradius som ADR-060 inte förutsåg: ackumuleringen fällde ett ANNAT tests helper.

INTERIM UTFÖRD (Marcus-beslut väg A 2026-07-06): alla 60 sentinel-event raderade ur staging via markör-match {Ort}='ZZ-create-event-test' (0 länkade anmälningar verifierat FÖRE delete; RIM-fixturerna med 'ZZ-History Ort' orörda) → get-attendance-sviten 7,9 s grön. OBS: ackumuleringen återupptas av varje test:api-/CI-körning — utan strukturell fix återkommer tröskeln.

FÖRVÄNTAT BETEENDE (två samverkande fixar):
(1) get-attendance-helpern hittar fixtur-eventet utan O(n)-EF-svep — filtrera get-events-svaret på fixtur-signaturen (ort 'ZZ-History Ort'/RIM-namnen) och anropa get-attendance endast på kandidaterna; tydligt fel om fixturen saknas.
(2) ADR-060-purgen wiras per beslutet 'purge vid SETUP' och vidgas till create-event-sentinellerna — staging växer inte obegränsat.

Ingen triage-etikett: klassningen är människans (do-work-fynd-regeln).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
