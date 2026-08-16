---
id: TASK-237
title: >-
  Artefakt-uppladdning även vid cancelled i ci-suite.yml (failure() ||
  cancelled())
status: Done
assignee: []
created_date: '2026-08-16 07:06'
updated_date: '2026-08-16 08:19'
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
- [x] #1 Båda artefaktstegen (test-staging + acceptance) villkoras failure() || cancelled()
- [x] #2 npm run verify:ci-parity körd och grön (läge 1 — egen ci-ändring)
- [x] #3 actionlint grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad via PR #1380 (merge 6ae89b7b, 2026-08-16) genom merge-kön = CI grön per jobb. Artefaktstegen i test-staging + acceptance villkoras nu failure() || cancelled() — takfällningar lämnar traces/screenshots i stället för noll underlag. Lokala grindar: actionlint + yamllint gröna på CI:s exakta form; full verify:ci-parity 31/32 gröna där enda röda rotorsakades till pre-existing dagar-kvar-pillen-flake (grön solo, ovidkommande diffen). Bifynd (tredje artefaktsteget i webblasarbeteende-jobbet) registrerat som AC på task-239 via PR #1381.
<!-- SECTION:FINAL_SUMMARY:END -->
