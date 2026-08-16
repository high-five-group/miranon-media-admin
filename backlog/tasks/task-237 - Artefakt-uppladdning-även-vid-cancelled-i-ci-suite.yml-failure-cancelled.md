---
id: TASK-237
title: >-
  Artefakt-uppladdning även vid cancelled i ci-suite.yml (failure() ||
  cancelled())
status: To Do
assignee: []
created_date: '2026-08-16 07:06'
labels:
  - ready-for-agent
dependencies: []
ordinal: 437000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forensik 2026-08-16 (S3): artefaktsteget 'Ladda upp Playwright-artefakter vid rött e2e' är if: failure() — vid takfällning (cancelled) blir det skipped: inga traces, screenshots eller sammanfattning. Ett rött träd som slår i taket lämnar noll diagnostiskt underlag. Gäller både test-staging och acceptance i ci-suite.yml. Engångsfix som gör alla framtida takfällningar diagnosticerbara.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Båda artefaktstegen (test-staging + acceptance) villkoras failure() || cancelled()
- [ ] #2 npm run verify:ci-parity körd och grön (läge 1 — egen ci-ändring)
- [ ] #3 actionlint grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
