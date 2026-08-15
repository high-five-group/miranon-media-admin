---
id: TASK-215
title: >-
  Flake: aktivitetshistorik-filtrets acceptanstest fäller i full svit men
  passerar isolerat
status: To Do
assignee: []
created_date: '2026-08-14 21:57'
updated_date: '2026-08-15 00:11'
labels:
  - ready-for-agent
dependencies: []
ordinal: 411000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Exakt symptom (mätt 2026-08-14 under TASK-214.2-bygget, agentens tvåvägsmätning): mer-aktivitetshistorik-filter.acceptance.test.ts rad ~457 fäller när FULL acceptanssvit körs (1 failed av 237) men passerar isolerat. Med orelaterade src-ändringar stashade föll full svit med samma test PLUS en icke-återkommande flake i hem.acceptance.test.ts ~437 — symptomet är alltså ordnings-/interferensberoende, inte ändringsberoende. Förväntat beteende: testet grönt i full svit oavsett körordning. Ytan tillhör aktivitetshistoriken (task-201-familjen, S105-spåret) — samordna med dess ägare om spåret är aktivt. Flakighet bedöms ENDAST med metrics:flake-riggen (interfolierad A/B, retries=0, loadavg i rådata).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Flakigheten mätt med riggen (npm run metrics:flake) — aldrig en egen mätserie; n redovisat innan något noll-resultat tolkas
- [ ] #2 Rotorsaken identifierad och fixad, eller fyndet omklassat med mätdata som belägg — aldrig tyst retry-maskering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Instans 2 (2026-08-15, under TASK-214.4-bygget): samma test fällde i full acceptanssvit (229 passed, 1 failed) på en diff som inte delar en rad med filen; isolerad omkörning 11/11 grönt, full svit omkörd 229/229 grönt. Mönstret ordnings-/lastberoende står sig.
<!-- SECTION:NOTES:END -->
