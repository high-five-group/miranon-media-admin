---
id: TASK-329
title: >-
  Fynd: .claude/.markdownlint.jsonc påstår att rot-configens
  MD013/MD060-disables ärvs — falsifierat
status: To Do
assignee: []
created_date: '2026-08-26 07:11'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 602000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
173.5-agentens fynd (2026-08-26): en markdown-tabell under .claude/agents/ fälls på både MD013 (radlängd) och MD060 (troligen tabellrelaterad regel) — 8 fel, exit 1. Utan tabellen: grönt. .claude/.markdownlint.jsonc:s egen kommentar hävdar 'Verifierat 2026-07-28 med en 220-teckens probe-rad' att rot-configens MD013/MD060-disables ärvs av denna config — det är osant för tabeller. Noll tabeller finns i .claude/agents/*.md i dag, därför har felet varit oupptäckt. Samma ADR-083-felklass som resten av repot städar bort (prosa som påstår en mekanism som inte finns).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mekanismen mätt: ärvs rot-configens MD013/MD060-disables av .claude/.markdownlint.jsonc eller inte — läs markdownlint-cli2:s dokumentation om config-cascade/inheritance och verifiera mot en probe-fil med en tabell
- [ ] #2 Configen eller dess kommentar rättad så den inte längre påstår en felaktig mekanism
- [ ] #3 Ett tabelltest under .claude/ läggs till i grinden som ska-fälla/ska-passera-bevis
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
