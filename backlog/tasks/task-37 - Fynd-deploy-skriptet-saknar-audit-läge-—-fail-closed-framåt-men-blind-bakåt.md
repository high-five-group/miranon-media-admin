---
id: TASK-37
title: 'Fynd: deploy-skriptet saknar audit-läge — fail-closed framåt men blind bakåt'
status: To Do
assignee: []
created_date: '2026-07-24 19:41'
updated_date: '2026-08-07 11:19'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 98000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-35 AC2-beslutet (2026-07-24, S84): REKOMMENDATION JA — implementera '--audit --project-ref <ref>' i scripts/deploy-prod-functions.sh: hämta live-funktionslistan, diffa mot .prod-functions-allowlist.conf, rapportera icke-allowlistade och exit 1 vid träff. Återanvänd skriptets befintliga allowlist-inläsning (ingen duplicerad parsning; logik universell, värden i conf per CI-grindvakts-principen). Design: docs/research/t39-ef-sync-preflight-2026-07-24.md §7. Bakgrund: test-auth låg i prod i 81 dagar trots allowlist-förbud — grinden hindrar nya deployer men ser inte historiska rester.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ett --audit-anrop mot prod rapporterar 0 icke-allowlistade (nuläget efter S84-städet) och exit 0
- [ ] #2 Testfall i scripts/test-deploy-prod-functions.sh täcker träff (exit 1) + icke-träff (exit 0)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
