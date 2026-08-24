---
id: TASK-316
title: >-
  Fynd: upload-attachment bär samma idempotenshål som finalize-attachment-upload
  hade
status: To Do
assignee: []
created_date: '2026-08-24 14:01'
labels:
  - ready-for-agent
dependencies: []
ordinal: 579000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Registrerat 2026-08-24 (S112, TASK-183-passet): upload-attachment/index.ts (mönster 1, små filer) gör identisk createAirtableRecord-utan-merge-skrivning mot samma Bilagor-tabell med samma Lagringsnyckel-fält — retry kan ge dubblett-metadatarad, exakt den bugg TASK-183 fixade i finalize-attachment-upload (PR #1908). Fixen har färdig förlaga: samma upsertAirtableRecord med Lagringsnyckel som merge-fält (ADR-066-mekanismen) + rött-först-testmönstret ur tests/api/attachment-upload-large.staging.test.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 upsertAirtableRecord med Lagringsnyckel som merge-fält ersätter createAirtableRecord i upload-attachment
- [ ] #2 Idempotens-test i befintlig skarv: retry ger EN rad, ny uppladdning ger TVÅ — rött-först-belagt som i TASK-183
- [ ] #3 Staging-deploy + grön riktad testkörning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
