---
id: TASK-187
title: >-
  Cursor-conformance-testet faller på delad staging-datas storlekskant —
  sista-sidan-antagandet
status: To Do
assignee: []
created_date: '2026-08-10 14:12'
updated_date: '2026-08-28 05:07'
labels: []
dependencies: []
ordinal: 353000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (mätt): post-merge-runs 31382290186 (62de6400, 11:09) + 31383085989 (c62df4b7, 11:20) 2026-08-10 föll 3/3 retries i Staging (API + E2E) med 'sista sidan (1) ska bära resten (1..pageSize) items' (tests/api/cursor-conformance.ts:87); grönt igen från 11:41 utan kodändring på ytan. Ärenden #1104/#1107 stängda mot detta kort. HYPOTES (obekräftad): tillståndskänslighet mot delad staging-datamängd — S103 seedade person-fixturer i samma tidsfönster; kant när totalantal ändras mellan sidhämtningar eller är jämnt delbart med pageSize. FÖRVÄNTAT: konformitetssviten är robust mot samtida datamängdsändringar (frys mängden per körning, eller egen sentinel-data) — diagnosen ska verifieras mot testkoden innan fix designas.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Diagnosen (tillståndskänslighet mot delad staging-datamängd) verifieras mot testkoden i tests/api/cursor-conformance.ts innan fix designas — root cause bekräftad eller vederlagd med belägg
- [ ] #2 Konformitetssviten körs mot en datamängd som är fryst eller sentinel-baserad per körning, opåverkad av samtida seed-aktivitet i staging
- [ ] #3 En körning under samtidig seed-belastning (t.ex. npm run seed:review parallellt) visar grönt för tests/api/cursor-conformance.ts efter fixen
- [ ] #4 Post-merge Staging (API + E2E)-jobbet grönt för cursor-conformance-testerna utan flaky-retries
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
