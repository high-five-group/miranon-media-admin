---
id: TASK-256
title: >-
  Staging-jobbets API-steg flakar mot sitt eget 12-min-tak —
  update-record.staging 639/746
status: To Do
assignee: []
created_date: '2026-08-17 07:41'
updated_date: '2026-08-17 07:42'
labels:
  - ready-for-agent
dependencies: []
ordinal: 474000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur TASK-239:s rotorsaksarbete (2026-08-17). Ärende #1476 var SAMMANSATT och bokfördes så i sin triage-kommentar: (1) e2e-baslinjen uppblåst av b-gruppens nio fällningar — LANDAD via TASK-243.3 (commit 97ea127c, PR #1470), väggklockan tillbaka till 6,63-8,41 min; (2) API-steget tog 3,0 min i stallet for ~1,6 pga två flaky-retries i tests/api/update-record.staging.test.ts:639 och :746 (loggen: '2 flaky', 309 passed, run 31984652487). Ben (2) SAKNAR bärare — detta kort är den.\n\nAVGRÄNSNING mot TASK-239 (prövad, ej antagen): 239 äger Acceptance-jobbets tak i ci-suite.yml. Detta ben ligger i jobbet 'Staging (API + E2E)' — annat jobb, annan timeout-instans, annan testklass (riktiga staging-anrop mot Airtable, inte MSW-fixturvärlden) och annan mekanism (retry-flake i två API-tester, inte warmup-gatens väntan). Hör INTE till 239:s klass; därför eget kort i stället för en post på 239.\n\nFÄRSK MÄTNING (TASK-239-agentens lokala 'npm run test:api' 2026-08-17, 862 passed, 2.2m): båda testerna GRÖNA men långsamma — :639 tog 5,5 s och :746 tog 5,9 s, klart över sviten i övrigt. Båda är 'allow'-vägar som SKRIVER mot staging och restaurerar i teardown (set-registration-lodging respektive set-attendance-status Närvarande ⇄ Ej avstämt). Skriv-plus-restaurera mot delad bas är den troliga flake-ytan — hypotes, ej belagd; mät innan åtgärd.\n\nStängs INTE av att #1476 stängs på annan grund — #1476 lämnades öppen just för att detta ben saknade bärare.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Flaken reproducerad och kvantifierad med npm run metrics:flake (interfolierad A/B, --retries=0) — inte bedömd på en enstaka körning; läs ut n innan ett noll-resultat tolkas
- [ ] #2 Rotorsaken namngiven: är det skriv-plus-restaurera mot delad staging-bas, en väntan som saknas, eller maskinlast — belagd, ej antagen
- [ ] #3 Åtgärd landad som återför API-steget till ~1,6 min, ELLER öppet motiverat varför steget legitimt tar 3,0 min
- [ ] #4 Staging-jobbets marginal mot timeout-minutes: 12 mätt i post-merge efter åtgärd (run-ID som belägg)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
