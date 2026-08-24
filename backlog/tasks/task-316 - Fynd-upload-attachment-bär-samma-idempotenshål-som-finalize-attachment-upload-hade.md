---
id: TASK-316
title: >-
  Fynd: upload-attachment bär samma idempotenshål som finalize-attachment-upload
  hade
status: Done
assignee: []
created_date: '2026-08-24 14:01'
updated_date: '2026-08-24 16:43'
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
- [x] #1 upsertAirtableRecord med Lagringsnyckel som merge-fält ersätter createAirtableRecord i upload-attachment
- [x] #2 Idempotens-test i befintlig skarv: retry ger EN rad, ny uppladdning ger TVÅ — rött-först-belagt som i TASK-183
- [x] #3 Staging-deploy + grön riktad testkörning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done-flipp S112: PR #1939 landad, post-merge 69dbcdc7 grön; rött-först-bevis + deterministisk attachmentId-design. Landning: PR #1939
<!-- SECTION:NOTES:END -->
